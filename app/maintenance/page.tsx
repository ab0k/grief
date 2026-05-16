import { createClient } from "@supabase/supabase-js";

async function getMaintenanceInfo() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await admin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["maintenance_message", "maintenance_ends_at", "site_name"]);

    const get = (key: string) => data?.find((r) => r.key === key)?.value ?? "";
    return {
      message:  get("maintenance_message") || "Estamos realizando manutenção neste momento. Volte em breve.",
      endsAt:   get("maintenance_ends_at"),
      siteName: get("site_name") || "dwe.lol",
    };
  } catch {
    return { message: "Estamos em manutenção. Volte em breve.", endsAt: "", siteName: "dwe.lol" };
  }
}

export default async function MaintenancePage() {
  const { message, endsAt, siteName } = await getMaintenanceInfo();

  let returnStr = "";
  if (endsAt) {
    const d = new Date(endsAt);
    if (!isNaN(d.getTime())) {
      returnStr = d.toLocaleString("pt-BR", {
        weekday: "long", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit",
      });
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#09090f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 300, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,92,252,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ textAlign: "center", maxWidth: 480, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#mblg)" />
            <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="3" fill="#fff" />
            <defs>
              <linearGradient id="mblg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em" }}>{siteName}</span>
        </div>

        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: "linear-gradient(135deg,rgba(124,92,252,0.2),rgba(248,87,166,0.1))",
          border: "1px solid rgba(124,92,252,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2.2rem", margin: "0 auto 1.5rem",
        }}>
          🚧
        </div>

        {/* Title */}
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          Site em Manutenção
        </h1>

        {/* Message */}
        <p style={{ margin: "0 0 1.75rem", fontSize: "0.95rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Estimated return */}
        {returnStr && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.6rem 1.1rem",
            background: "rgba(124,92,252,0.1)",
            border: "1px solid rgba(124,92,252,0.25)",
            borderRadius: 12, marginBottom: "1.75rem",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
              Retorno estimado: <strong style={{ color: "#7c5cfc" }}>{returnStr}</strong>
            </span>
          </div>
        )}

        {/* Admin link */}
        <div style={{ marginTop: "2rem" }}>
          <a href="/login" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
            Acesso administrativo →
          </a>
        </div>
      </div>
    </div>
  );
}
