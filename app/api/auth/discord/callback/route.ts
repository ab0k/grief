import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    redirect("/login?error=discord_cancelled");
  }

  const clientId = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  // Exchange code for access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    redirect("/login?error=token_exchange_failed");
  }

  const tokenData = await tokenRes.json();

  // Fetch Discord user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    redirect("/login?error=user_fetch_failed");
  }

  const user = await userRes.json();

  // TODO: Create/find user in your database with:
  // user.id, user.username, user.email, user.avatar
  // Then set a session cookie and redirect to dashboard
  console.log("Discord user authenticated:", user.username, user.email);

  // Placeholder: redirect to home after auth
  redirect("/?discord_user=" + encodeURIComponent(user.username));
}
