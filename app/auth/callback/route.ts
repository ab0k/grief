import { createClient } from "@/lib/supabase/server";
import { sendDiscordLog } from "@/lib/discord";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert profile so existing Discord users also get their profile updated
      const meta = data.user.user_metadata;
      const username =
        meta?.username ??
        meta?.full_name ??
        meta?.name ??
        data.user.email?.split("@")[0] ??
        "user";

      // provider_id é o ID do usuário no Discord quando logado via OAuth Discord
      const discordId = data.user.app_metadata?.provider === "discord"
        ? (meta?.provider_id ?? meta?.sub ?? null)
        : null;

      await supabase.from("profiles").upsert(
        {
          user_id: data.user.id,
          username,
          avatar_url: meta?.avatar_url ?? null,
          ...(discordId ? { discord_id: discordId } : {}),
        },
        { onConflict: "user_id" }
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";

      await sendDiscordLog({
        type:      "oauth_login",
        method:    "GET",
        url:       "/auth/callback",
        username,
        email:     data.user.email ?? undefined,
        userId:    profile ? `${profile.id} (${data.user.id.slice(0, 8)}...)` : data.user.id,
        role:      "user",
        ip,
        userAgent: request.headers.get("user-agent") ?? "unknown",
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
