import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths always accessible even during maintenance
const MAINTENANCE_BYPASS = [
  "/maintenance",
  "/admin",
  "/api/admin",
  "/_next",
  "/favicon",
  "/login",
  "/register",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Auth client (anon key + cookies) ───────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Service-role client (no cookies needed — bypasses RLS) ─────────────────
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── Maintenance mode check ─────────────────────────────────────────────────
  const isBypassed = MAINTENANCE_BYPASS.some((p) => pathname.startsWith(p));

  if (!isBypassed) {
    try {
      const { data: rows, error } = await adminClient
        .from("admin_settings")
        .select("key, value")
        .in("key", ["maintenance_mode", "maintenance_allowed_users"]);

      if (!error) {
        const isMaintenanceOn =
          rows?.find((r: { key: string; value: string }) => r.key === "maintenance_mode")?.value === "true";

        if (isMaintenanceOn) {
          let canPass = false;

          if (user) {
            const { data: profile } = await adminClient
              .from("profiles")
              .select("role")
              .eq("user_id", user.id)
              .single();

            if (profile?.role === "admin" || profile?.role === "owner") {
              canPass = true;
            } else {
              const allowedStr = rows?.find(
                (r: { key: string; value: string }) => r.key === "maintenance_allowed_users"
              )?.value;
              if (allowedStr) {
                try {
                  const allowed: { user_id: string }[] = JSON.parse(allowedStr);
                  canPass = allowed.some((u) => u.user_id === user.id);
                } catch { /* ignore */ }
              }
            }
          }

          if (!canPass) {
            const url = request.nextUrl.clone();
            url.pathname = "/maintenance";
            return NextResponse.redirect(url);
          }
        }
      }
    } catch { /* fail-open: if DB unreachable, don't block the site */ }
  }

  // ── Auth guards ────────────────────────────────────────────────────────────

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
