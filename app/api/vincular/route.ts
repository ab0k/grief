import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  const supabase = await createClient();

  // Verifica sessão do usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  // Busca o token (policy anon_all permite leitura sem restrição)
  const { data: linkToken, error: tokenErr } = await supabase
    .from("link_tokens")
    .select("id, token, discord_id, discord_username, used_at, expires_at")
    .eq("token", token)
    .single();

  if (tokenErr || !linkToken) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 404 });
  }

  if (linkToken.used_at) {
    return NextResponse.json({ error: "Esse token já foi usado." }, { status: 400 });
  }

  if (new Date(linkToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expirado. Use !login novamente no Discord." }, { status: 400 });
  }

  // Busca perfil do usuário autenticado
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, discord_id")
    .eq("user_id", user.id)
    .single();

  // Se não existir, cria o perfil (o usuário tem sessão, então o RLS permite)
  if (!profile) {
    const { data: newProfile, error: createErr } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        username: user.user_metadata?.username ?? user.email?.split("@")[0] ?? "user",
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select("id, discord_id")
      .single();

    if (createErr || !newProfile) {
      console.error("Erro ao criar perfil:", createErr);
      return NextResponse.json({ error: `Erro: ${createErr?.message ?? createErr?.code ?? "desconhecido"}` }, { status: 500 });
    }
    profile = newProfile;
  }

  if (profile.discord_id && profile.discord_id !== linkToken.discord_id) {
    return NextResponse.json({ error: "Seu perfil já está vinculado a outro Discord." }, { status: 400 });
  }

  // Atualiza discord_id e marca token como usado
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ discord_id: linkToken.discord_id })
    .eq("id", profile.id);

  if (updateErr) {
    console.error("Erro ao atualizar discord_id:", updateErr);
    return NextResponse.json({ error: `Erro ao vincular: ${updateErr.message}` }, { status: 500 });
  }

  // Marca token como usado via RPC (SECURITY DEFINER bypassa RLS)
  await supabase.rpc("vincular_discord", {
    p_discord_id: linkToken.discord_id,
    p_discord_username: linkToken.discord_username,
    p_profile_id: profile.id,
  });

  return NextResponse.json({ success: true, discord_username: linkToken.discord_username });
}
