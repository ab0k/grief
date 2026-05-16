import { sendDiscordLog } from "@/lib/discord";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, url } = body as { type: string; url?: string };

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let username: string | undefined;
    let email: string | undefined;
    let userId: string | undefined;
    let role = "user";

    if (user) {
      userId = user.id;
      email  = user.email ?? undefined;
      const meta = user.user_metadata;
      username = meta?.username ?? meta?.full_name ?? meta?.name ?? email?.split("@")[0] ?? "user";

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        username = profile.username;
        userId   = `${profile.id} (${user.id.slice(0, 8)}...)`;
      }
    }

    await sendDiscordLog({
      type:      type as "login" | "register" | "logout" | "oauth_login",
      method:    "POST",
      url:       url ?? `/auth/${type}`,
      username,
      email,
      userId,
      role,
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
