"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "success" | "error" | "no-token";

function VincularPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    // Verifica se o usuário está logado
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Redireciona para login e volta depois
        router.push(`/login?next=/vincular?token=${token}`);
      } else {
        setStatus("ready");
      }
    });
  }, [token, router]);

  async function handleVincular() {
    setStatus("checking");
    try {
      const res = await fetch("/api/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro desconhecido.");
        return;
      }

      setDiscordUsername(data.discord_username);
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#09090f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#16161e",
        border: "1px solid #2a2a3a",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔗</div>
        <h1 style={{ color: "#fff", fontSize: "22px", margin: "0 0 8px" }}>
          Vincular Discord
        </h1>
        <p style={{ color: "#888", fontSize: "14px", margin: "0 0 32px" }}>dwe.lol</p>

        {status === "checking" && (
          <p style={{ color: "#7c5cfc", fontSize: "15px" }}>⏳ Verificando...</p>
        )}

        {status === "no-token" && (
          <p style={{ color: "#f87171" }}>
            Token inválido. Use <strong>!login</strong> no Discord para gerar um novo link.
          </p>
        )}

        {status === "ready" && (
          <>
            <p style={{ color: "#ccc", marginBottom: "24px", fontSize: "15px" }}>
              Clique no botão abaixo para vincular sua conta do Discord ao seu perfil do dwe.lol.
            </p>
            <button
              onClick={handleVincular}
              style={{
                background: "linear-gradient(135deg, #7c5cfc, #f857a6)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Vincular minha conta
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <p style={{ color: "#4ade80", fontSize: "16px", fontWeight: "bold" }}>
              Discord vinculado com sucesso!
            </p>
            <p style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>
              Conta <strong style={{ color: "#fff" }}>@{discordUsername}</strong> conectada ao seu perfil.
              Volte ao Discord — o bot já enviou uma confirmação!
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                marginTop: "24px",
                background: "#2a2a3a",
                color: "#ccc",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Ir para o Dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <p style={{ color: "#f87171", fontSize: "15px" }}>{message}</p>
            <button
              onClick={() => setStatus("ready")}
              style={{
                marginTop: "16px",
                background: "#2a2a3a",
                color: "#ccc",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VincularPage() {
  return (
    <Suspense>
      <VincularPageInner />
    </Suspense>
  );
}
