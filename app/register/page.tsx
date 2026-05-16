"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState(searchParams.get("username") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const u = searchParams.get("username");
    if (u) setUsername(u);
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleDiscord() {
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este email já está cadastrado."
          : error.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setResendCooldown(60);
  }

  async function handleResend() {
    setResendLoading(true);
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    setResendLoading(false);
    setResendCooldown(60);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
      <Link href="/" style={{ position: "absolute", top: "1.25rem", left: "1.25rem", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
        Back to home
      </Link>
      <div className="glass-card" style={{ width: "100%", maxWidth: 440, borderRadius: 20, padding: "2.25rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg2)" />
            <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="3" fill="#fff" />
            <defs>
              <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, background: "linear-gradient(135deg, #7c5cfc, #f857a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.02em" }}>
            grief.cc
          </span>
        </div>

        {!success ? (
          /* ── Register form ─────────────────────────────── */
          <>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>Register</h1>
              <p style={{ color: "var(--text-muted)", margin: "6px 0 0", fontSize: "0.9rem" }}>
                Create your account to start using grief.cc
              </p>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.85rem", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button onClick={handleDiscord} style={{ width: "100%", background: "#5865F2", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <DiscordIcon />
              Sign Up with Discord
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>or register with</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <Field label="Username">
                <IconInput icon={<LinkIcon />}>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())} placeholder="yourname" required style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                </IconInput>
                <p style={{ margin: "5px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Your page: <strong style={{ color: "var(--text)" }}>grief.cc/{username || "username"}</strong>
                </p>
              </Field>

              <Field label="Email address">
                <IconInput icon={<AtIcon />}>
                  <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                </IconInput>
              </Field>

              <Field label="Password">
                <IconInput icon={<KeyIcon />} right={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }>
                  <input type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ ...inputStyle, paddingRight: "1.5rem" }} onFocus={focusBorder} onBlur={blurBorder} />
                </IconInput>
              </Field>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", borderRadius: 10, padding: "0.75rem", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>
          </>
        ) : (
          /* ── OTP verification screen ───────────────────── */
          <OtpScreen
            email={email}
            resendLoading={resendLoading}
            resendCooldown={resendCooldown}
            onResend={handleResend}
            onBack={() => setSuccess(false)}
            onSuccess={() => { router.push("/dashboard"); router.refresh(); }}
          />
        )}

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Login</Link>
        </p>
      </div>
    </main>
  );
}

/* ── OTP screen ──────────────────────────────────────────── */
function OtpScreen({ email, resendLoading, resendCooldown, onResend, onBack, onSuccess }: {
  email: string;
  resendLoading: boolean;
  resendCooldown: number;
  onResend: () => void;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigit(i: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setCodeError(null);
    if (char && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) submitCode(next.join(""));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    e.preventDefault();
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
      submitCode(pasted);
    }
  }

  async function submitCode(code: string) {
    setVerifying(true);
    setCodeError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    if (error) {
      setCodeError("Código inválido ou expirado. Tente novamente.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      setVerifying(false);
      return;
    }

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "register", url: "/auth/register" }),
    }).catch(() => {});

    onSuccess();
  }

  const filled = digits.filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Icon + heading */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
            Verifique seu email
          </h2>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Enviamos um código de 6 dígitos para<br />
            <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>
        </div>
      </div>

      {/* Digit inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              style={{
                width: 48, height: 56,
                borderRadius: 12,
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                background: d ? "rgba(124,92,252,0.15)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${
                  codeError
                    ? "rgba(239,68,68,0.6)"
                    : d
                    ? "rgba(124,92,252,0.6)"
                    : "var(--border)"
                }`,
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s, background 0.15s",
                opacity: verifying ? 0.5 : 1,
                cursor: verifying ? "not-allowed" : "text",
              }}
              onFocus={(e) => {
                if (!codeError) e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                if (!d && !codeError) e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {digits.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < filled ? "var(--accent)" : "rgba(255,255,255,0.15)", transition: "background 0.2s" }} />
          ))}
        </div>

        {codeError && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171", textAlign: "center" }}>
            {codeError}
          </p>
        )}

        {verifying && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
            Verificando…
          </p>
        )}
      </div>

      {/* Resend */}
      <button
        onClick={onResend}
        disabled={resendLoading || resendCooldown > 0}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "0.65rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
          color: resendCooldown > 0 ? "var(--text-muted)" : "var(--text)",
          fontFamily: "inherit",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => { if (!resendCooldown) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      >
        {resendLoading
          ? "Reenviando…"
          : resendCooldown > 0
          ? `Reenviar código em ${resendCooldown}s`
          : "Reenviar código"}
      </button>

      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
        Email errado?{" "}
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: 0, fontFamily: "inherit" }}
        >
          Voltar
        </button>
      </p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none", outline: "none",
  color: "var(--text)", fontSize: "0.9rem", fontFamily: "inherit", padding: 0,
};
const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => {
  (e.currentTarget.closest(".input-wrap") as HTMLElement | null)
    ?.style.setProperty("border-color", "var(--accent)");
};
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => {
  (e.currentTarget.closest(".input-wrap") as HTMLElement | null)
    ?.style.setProperty("border-color", "var(--border)");
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, display: "block" }}>{label}</label>
      {children}
    </div>
  );
}

function IconInput({ icon, right, children }: { icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="input-wrap" style={{ position: "relative", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.65rem 0.9rem 0.65rem 2.5rem", transition: "border-color 0.2s" }}>
      <span style={{ position: "absolute", left: 13, color: "var(--text-muted)", display: "flex" }}>{icon}</span>
      {children}
      {right && <span style={{ position: "absolute", right: 13, display: "flex" }}>{right}</span>}
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────── */
function DiscordIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>; }
function LinkIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function AtIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>; }
function KeyIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>; }
function EyeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
