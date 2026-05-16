"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextUrl = searchParams.get("next") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed" ? "Falha na autenticação. Tente novamente." : null
  );

  async function handleDiscord() {
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message
      );
      setLoading(false);
      return;
    }

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "login", url: "/auth/login" }),
    }).catch(() => {});

    router.push(nextUrl);
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      <Link href="/" style={{ position: "absolute", top: "1.25rem", left: "1.25rem", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
        Back to home
      </Link>
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 20,
          padding: "2.25rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg)" />
            <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="3" fill="#fff" />
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c5cfc" />
                <stop offset="1" stopColor="#f857a6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, background: "linear-gradient(135deg, #7c5cfc, #f857a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.02em" }}>
            dwe.lol
          </span>
        </div>

        {/* Heading */}
        <div>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Sign in to your account
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "6px 0 0", fontSize: "0.9rem" }}>
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.85rem", color: "#f87171" }}>
            {error}
          </div>
        )}

        {/* Discord button */}
        <button
          onClick={handleDiscord}
          style={{ width: "100%", background: "#5865F2", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <DiscordIcon />
          Sign in with Discord
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, display: "block" }}>
              Username or Email
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <UserIcon />
              </span>
              <input
                type="text"
                placeholder="Your username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.65rem 0.9rem 0.65rem 2.5rem", color: "var(--text)", fontSize: "0.9rem", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s", boxSizing: "border-box" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, display: "block" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <KeyIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.65rem 2.8rem 0.65rem 2.5rem", color: "var(--text)", fontSize: "0.9rem", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s", boxSizing: "border-box" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.88rem" }}>
              <button type="button" role="switch" aria-checked={remember} onClick={() => setRemember(!remember)} style={{ width: 36, height: 20, borderRadius: 999, background: remember ? "var(--accent)" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", padding: 0, flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 2, left: remember ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
              </button>
              <span style={{ color: "var(--text-muted)" }}>Remember for 7 days</span>
            </label>
            <a href="#" style={{ color: "var(--accent)", fontSize: "0.88rem", textDecoration: "none", fontWeight: 600 }}>
              Forgot password
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", borderRadius: 10, padding: "0.75rem", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

function DiscordIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>;
}
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function KeyIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>; }
function EyeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
