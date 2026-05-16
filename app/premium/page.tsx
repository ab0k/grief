"use client";
import { useState } from "react";
import Link from "next/link";

// ── Data ──────────────────────────────────────────────────────
const FEATURES_GRID = [
  { icon: "🎨", title: "Cursor Personalizado", desc: "Substitua o cursor padrão por qualquer imagem ou animação. Um detalhe que ninguém tem no gratuito." },
  { icon: "🎬", title: "Background em Vídeo", desc: "Coloque um vídeo em loop como fundo do seu perfil. Seu perfil vira uma experiência." },
  { icon: "🎵", title: "Áudio de Perfil", desc: "Toque uma música automaticamente quando alguém entrar no seu perfil. Seja imersivo." },
  { icon: "✏️", title: "Fonte Personalizada", desc: "Mude a tipografia de todo o seu perfil. Um toque que poucos têm e que faz toda a diferença." },
  { icon: "✨", title: "Efeitos & Partículas", desc: "Neve, brilhos, chamas e outros efeitos exclusivos que animam seu perfil em tempo real." },
  { icon: "🛡️", title: "Badge Premium", desc: "Um selo visível no seu perfil público e nos comentários. Mostre que você é de verdade." },
  { icon: "📁", title: "Assets Ilimitados", desc: "Suba quantas imagens, vídeos, fontes e cursors quiser. Sem cota, sem limite." },
  { icon: "⚡", title: "Suporte Prioritário", desc: "Fila VIP. Sua dúvida vai na frente. Resposta rápida, sem esperar na fila." },
  { icon: "📊", title: "Analytics Avançado", desc: "Veja de onde vêm seus visitantes, quais links clicam e como seu perfil cresce." },
];

const COMPARISON = [
  { feature: "Links & Redes Sociais", free: "✓", premium: "✓" },
  { feature: "Analytics básico",       free: "✓", premium: "✓" },
  { feature: "Músicas no perfil",      free: "✓", premium: "✓" },
  { feature: "Assets de imagem",       free: "5 arquivos", premium: "Ilimitado" },
  { feature: "Cursor personalizado",   free: "—",  premium: "✓" },
  { feature: "Background em vídeo",    free: "—",  premium: "✓" },
  { feature: "Áudio de perfil",        free: "—",  premium: "✓" },
  { feature: "Fonte personalizada",    free: "—",  premium: "✓" },
  { feature: "Efeitos & Partículas",   free: "—",  premium: "✓" },
  { feature: "Badge Premium",          free: "—",  premium: "✓" },
  { feature: "Analytics avançado",     free: "—",  premium: "✓" },
  { feature: "Suporte prioritário",    free: "—",  premium: "✓" },
];

const FAQS = [
  {
    q: "O pagamento é único ou assinatura?",
    a: "Você pode escolher. Temos plano mensal com renovação automática e plano anual com desconto de 35% — pago uma vez por ano.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancele a qualquer momento pelo painel. O Premium fica ativo até o fim do período pago.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "PIX e cartão de crédito. O pagamento é processado com segurança.",
  },
  {
    q: "O Badge Premium aparece mesmo sem o plano ativo?",
    a: "Não. O badge fica visível apenas enquanto sua assinatura estiver ativa. Se cancelar, ele some automaticamente.",
  },
  {
    q: "Os efeitos funcionam em todos os dispositivos?",
    a: "Sim, incluindo mobile. Alguns efeitos pesados podem ser reduzidos em dispositivos mais antigos para manter a performance.",
  },
];

// ── Components ────────────────────────────────────────────────
function Checkmark({ color = "#7c5cfc" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.3} />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function Dash() {
  return <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "1rem" }}>—</span>;
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "1.1rem 0",
        cursor: "pointer",
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>{q}</p>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <p style={{ margin: "0.6rem 0 0", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function PremiumPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const monthlyPrice = "12,90";
  const annualTotal  = "99,90";
  const annualMonthly = "8,32";
  const annualSaving  = "35%";

  return (
    <div style={{ background: "#0d0d12", minHeight: "100vh", color: "#fff", fontFamily: "inherit", overflowX: "hidden" }}>

      {/* Gradient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-5%",  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(248,87,166,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Announcement bar ── */}
        <div style={{ background: "rgba(124,92,252,0.12)", borderBottom: "1px solid rgba(124,92,252,0.2)", padding: "0.55rem 1rem", textAlign: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5cfc", display: "inline-block" }} />
            Preço de lançamento · garanta agora antes dos valores subirem
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5cfc", display: "inline-block" }} />
          </span>
        </div>

        {/* ── Nav ── */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="url(#nlg)" />
              <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="16" cy="22" r="3" fill="#fff" />
              <defs>
                <linearGradient id="nlg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", letterSpacing: "-0.02em" }}>dwe.lol</span>
          </Link>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/login" style={{ padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
              Entrar
            </Link>
            <Link href="/register" style={{ padding: "0.45rem 1.1rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#7c5cfc,#f857a6)" }}>
              Criar conta
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", padding: "5rem 1rem 3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 999, padding: "0.35rem 1rem", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Premium</span>
          </div>
          <h1 style={{ margin: "0 0 1rem", fontSize: "clamp(2.4rem, 6vw, 3.8rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Seu perfil.<br />
            <span style={{ background: "linear-gradient(135deg,#7c5cfc,#f857a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Sem limites.
            </span>
          </h1>
          <p style={{ margin: "0 auto", maxWidth: 480, fontSize: "1.05rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Cursor, vídeo, áudio, efeitos, fontes e tudo mais. Tudo que seu perfil merece — sem asterisco.
          </p>
        </section>

        {/* ── Billing toggle ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: 4, gap: 4 }}>
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "0.45rem 1.2rem", borderRadius: 999, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
                  background: billing === b ? "linear-gradient(135deg,#7c5cfc,#f857a6)" : "transparent",
                  color: billing === b ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              >
                {b === "monthly" ? "Mensal" : (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Anual
                    <span style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px", borderRadius: 999 }}>
                      -{annualSaving}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pricing cards ── */}
        <section style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap", padding: "0 1.5rem 1.5rem", maxWidth: 820, margin: "0 auto" }}>

          {/* Mensal */}
          <div style={{
            flex: "1 1 320px", maxWidth: 370,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20, padding: "2rem",
          }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Plano Mensal</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "0.5rem 0 0.25rem" }}>
              <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>R$</span>
              <span style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.03em" }}>{monthlyPrice}</span>
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>/mês</span>
            </div>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)" }}>Acesso completo com renovação automática.</p>
            <Link
              href="/register"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0.75rem", borderRadius: 10, fontFamily: "inherit", fontSize: "0.9rem",
                fontWeight: 700, textDecoration: "none", color: "#fff",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                marginBottom: "0.75rem", transition: "background 0.15s",
              }}
            >
              Assinar Mensal →
            </Link>
            <p style={{ margin: "0 0 1.75rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Preço de lançamento · pode subir a qualquer momento</p>
            <FeatureList />
          </div>

          {/* Anual — destaque */}
          <div style={{
            flex: "1 1 320px", maxWidth: 370,
            background: "rgba(124,92,252,0.07)",
            border: "1px solid rgba(124,92,252,0.4)",
            borderRadius: 20, padding: "2rem", position: "relative",
            boxShadow: "0 0 60px rgba(124,92,252,0.12)",
          }}>
            {/* Badge */}
            <div style={{ position: "absolute", top: -14, right: 24, background: "linear-gradient(135deg,#7c5cfc,#f857a6)", borderRadius: 999, padding: "0.3rem 0.9rem", fontSize: "0.72rem", fontWeight: 800, color: "#fff", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
              ★ MELHOR VALOR
            </div>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 700, color: "rgba(167,139,250,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Plano Anual</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "0.5rem 0 0.1rem" }}>
              <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>R$</span>
              <span style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.03em" }}>{annualTotal}</span>
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>/365 dias</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>R$ 154,80</span>
              <span style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Economia de {annualSaving}</span>
            </div>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)" }}>
              Equivale a <strong style={{ color: "#a78bfa" }}>R$ {annualMonthly}/mês</strong> — o melhor custo-benefício.
            </p>
            <Link
              href="/register"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "0.85rem", borderRadius: 10, fontFamily: "inherit", fontSize: "0.92rem",
                fontWeight: 800, textDecoration: "none", color: "#fff",
                background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
                marginBottom: "0.75rem", boxShadow: "0 4px 24px rgba(124,92,252,0.35)",
              }}
            >
              <span>💎</span> Garantir Anual agora
            </Link>
            <p style={{ margin: "0 0 1.75rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Preço de lançamento · pode subir a qualquer momento</p>
            <FeatureList highlight />
          </div>
        </section>

        {/* Payment note */}
        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", marginBottom: "5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          Pagamento seguro via PIX ou cartão de crédito
        </p>

        {/* ── Features grid ── */}
        <section style={{ padding: "0 1.5rem 6rem", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: "3.5rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#7c5cfc", letterSpacing: "0.12em", textTransform: "uppercase" }}>— O que você ganha</p>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Tudo incluso.<br />Zero asterisco.
            </h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", maxWidth: 360 }}>
              Cada recurso foi pensado pra quem leva o perfil a sério.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {FEATURES_GRID.map((f) => (
              <div key={f.title} style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "1.4rem",
                transition: "border-color 0.2s, background 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.35)"; e.currentTarget.style.background = "rgba(124,92,252,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "0.85rem" }}>
                  {f.icon}
                </div>
                <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section style={{ padding: "0 1.5rem 6rem", maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#7c5cfc", letterSpacing: "0.12em", textTransform: "uppercase" }}>— Comparativo</p>
            <h2 style={{ margin: 0, fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Gratuito vs <span style={{ background: "linear-gradient(135deg,#7c5cfc,#f857a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Premium</span>
            </h2>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem 1.5rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Recurso</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>Gratuito</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>Premium</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 120px",
                  padding: "0.9rem 1.5rem", alignItems: "center",
                  borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}
              >
                <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.75)" }}>{row.feature}</span>
                <span style={{ textAlign: "center", fontSize: "0.88rem" }}>
                  {row.free === "✓" ? <Checkmark color="rgba(255,255,255,0.4)" /> : row.free === "—" ? <Dash /> : <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{row.free}</span>}
                </span>
                <span style={{ textAlign: "center", fontSize: "0.88rem" }}>
                  {row.premium === "✓" ? <Checkmark /> : <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.82rem" }}>{row.premium}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: "0 1.5rem 6rem", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#7c5cfc", letterSpacing: "0.12em", textTransform: "uppercase" }}>— Dúvidas</p>
            <h2 style={{ margin: 0, fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>Perguntas frequentes</h2>
          </div>
          <div>
            {FAQS.map((faq) => <FAQ key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: "0 1.5rem 8rem", textAlign: "center" }}>
          <div style={{
            maxWidth: 580, margin: "0 auto",
            background: "linear-gradient(135deg, rgba(124,92,252,0.12), rgba(248,87,166,0.08))",
            border: "1px solid rgba(124,92,252,0.25)",
            borderRadius: 24, padding: "3rem 2rem",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💎</div>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Pronto pra se destacar?
            </h2>
            <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              Junte-se a quem já tem o perfil que todo mundo olha duas vezes.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                style={{
                  padding: "0.85rem 2rem", borderRadius: 10, fontFamily: "inherit", fontSize: "0.95rem",
                  fontWeight: 800, textDecoration: "none", color: "#fff",
                  background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
                  boxShadow: "0 4px 24px rgba(124,92,252,0.35)",
                }}
              >
                Começar agora
              </Link>
              <Link
                href="/"
                style={{
                  padding: "0.85rem 2rem", borderRadius: 10, fontFamily: "inherit", fontSize: "0.95rem",
                  fontWeight: 600, textDecoration: "none", color: "rgba(255,255,255,0.6)",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Ver exemplos
              </Link>
            </div>
            <p style={{ margin: "1.5rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
              Sem surpresa. Cancele quando quiser.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 2rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>
            © 2025 dwe.lol · <Link href="/" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Voltar ao início</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Feature list shared between cards ─────────────────────────
function FeatureList({ highlight = false }: { highlight?: boolean }) {
  const items = [
    "Cursor personalizado",
    "Background em vídeo ou imagem",
    "Áudio de perfil",
    "Fonte personalizada",
    "Efeitos & partículas exclusivos",
    "Badge Premium no perfil",
    "Assets ilimitados",
    "Suporte prioritário",
    "Analytics avançado",
  ];
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
          <Checkmark color={highlight ? "#a78bfa" : "rgba(255,255,255,0.4)"} />
          {item}
        </li>
      ))}
    </ul>
  );
}
