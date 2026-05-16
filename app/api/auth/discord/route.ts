import { redirect } from "next/navigation";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
  });

  redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
