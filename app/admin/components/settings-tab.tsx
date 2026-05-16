"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const C = {
  card:   "#16161e",
  border: "rgba(255,255,255,0.07)",
  muted:  "rgba(255,255,255,0.4)",
  primary: "#7c5cfc",
};

type UserResult = { id: string; user_id: string; username: string };

export function SettingsTab({ role }: { role: string }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // maintenance
  const [isMaintenance, setIsMaintenance]         = useState(false);
  const [maintenanceMsg, setMaintenanceMsg]         = useState("Estamos realizando manutenção neste momento. Volte em breve.");
  const [endsAtDate, setEndsAtDate]               = useState("");
  const [endsAtHour, setEndsAtHour]               = useState("");
  const [endsAtMinute, setEndsAtMinute]           = useState("");
  const [allowedUsers, setAllowedUsers]           = useState<UserResult[]>([]);
  const [userSearch, setUserSearch]               = useState("");
  const [userResults, setUserResults]             = useState<UserResult[]>([]);

  // other settings
  const [siteName, setSiteName]                   = useState("");
  const [registrationEnabled, setRegistration]   = useState(true);
  const [maxLinks, setMaxLinks]                   = useState("20");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const s: Record<string, string> = d.settings ?? {};
        setIsMaintenance(s.maintenance_mode === "true");
        setMaintenanceMsg(s.maintenance_message ?? "Estamos realizando manutenção neste momento. Volte em breve.");
        setSiteName(s.site_name ?? "");
        setRegistration(s.registration_enabled !== "false");
        setMaxLinks(s.max_links_per_user ?? "20");
        if (s.maintenance_ends_at) {
          const dt = new Date(s.maintenance_ends_at);
          if (!isNaN(dt.getTime())) {
            setEndsAtDate(dt.toISOString().split("T")[0]);
            setEndsAtHour(String(dt.getHours()).padStart(2, "0") + ":00");
            setEndsAtMinute(String(dt.getMinutes()).padStart(2, "0"));
          }
        }
        if (s.maintenance_allowed_users) {
          try { setAllowedUsers(JSON.parse(s.maintenance_allowed_users)); } catch { /* ignore */ }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // debounced user search
  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      const res  = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&limit=5`);
      const data = await res.json();
      setUserResults(data.users ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  if (role !== "owner") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "3rem", textAlign: "center" }}>
        <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }}>🔒</span>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 700, color: "#fff" }}>Acesso restrito</p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: C.muted }}>Apenas owners podem acessar as configurações do sistema.</p>
      </motion.div>
    );
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function toggleMaintenance() {
    const next = !isMaintenance;
    setIsMaintenance(next);
    await saveSetting("maintenance_mode", String(next));
  }

  async function saveAll() {
    setSaving(true);
    let endsAtISO = "";
    if (endsAtDate) {
      const h   = endsAtHour   ? endsAtHour.split(":")[0].padStart(2, "0")   : "00";
      const min = endsAtMinute ? endsAtMinute.padStart(2, "0")               : "00";
      const dt  = new Date(`${endsAtDate}T${h}:${min}:00`);
      if (!isNaN(dt.getTime())) endsAtISO = dt.toISOString();
    }
    await Promise.all([
      saveSetting("maintenance_message",       maintenanceMsg),
      saveSetting("maintenance_ends_at",       endsAtISO),
      saveSetting("maintenance_allowed_users", JSON.stringify(allowedUsers)),
      saveSetting("site_name",                 siteName),
      saveSetting("registration_enabled",      String(registrationEnabled)),
      saveSetting("max_links_per_user",        maxLinks),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addQuickTime(hours: number) {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    setEndsAtDate(d.toISOString().split("T")[0]);
    setEndsAtHour(String(d.getHours()).padStart(2, "0") + ":00");
    setEndsAtMinute(String(d.getMinutes()).padStart(2, "0"));
  }

  function addTomorrow() {
    const d = new Date(Date.now() + 86400 * 1000);
    setEndsAtDate(d.toISOString().split("T")[0]);
  }

  function addAllowedUser(u: UserResult) {
    if (allowedUsers.find((x) => x.id === u.id)) return;
    setAllowedUsers((p) => [...p, u]);
    setUserSearch(""); setUserResults([]);
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  let estimatedReturn = "";
  if (endsAtDate) {
    const h   = endsAtHour   ? endsAtHour.split(":")[0].padStart(2, "0")   : "00";
    const min = endsAtMinute ? endsAtMinute.padStart(2, "0")               : "00";
    const dt  = new Date(`${endsAtDate}T${h}:${min}:00`);
    if (!isNaN(dt.getTime())) {
      estimatedReturn = dt.toLocaleString("pt-BR", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.85rem 1rem", background: "linear-gradient(135deg,rgba(245,158,11,0.08),transparent)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>⚙️</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Configurações do Site</p>
          <p style={{ margin: 0, fontSize: "0.73rem", color: C.muted }}>Configuração exclusiva do proprietário</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: C.muted, textAlign: "center", padding: "2rem 0" }}>Carregando...</p>
      ) : (<>

        {/* ── Maintenance card ──────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>

          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: isMaintenance ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                🚧
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Modo de manutenção</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: isMaintenance ? "#ef4444" : "#22c55e" }}>
                  {isMaintenance ? "⚠️ Site em manutenção" : "✓ O site está acessível publicamente"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMaintenance}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "0.5rem 1rem", borderRadius: 9, border: "none", background: isMaintenance ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: isMaintenance ? "#22c55e" : "#f59e0b", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "inherit", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              ⏻ {isMaintenance ? "Desativar manutenção" : "Ativar manutenção"}
            </button>
          </div>

          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Message */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Mensagem de manutenção</label>
              <textarea
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                rows={4}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.75rem", fontSize: "0.85rem", color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            {/* Estimated end time */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: "0.85rem" }}>📅</span>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>Horário estimado de término (opcional)</p>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: "0.73rem", color: C.muted }}>Defina quando você espera que a manutenção seja concluída.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", color: C.muted, marginBottom: 4 }}>Data</label>
                  <input type="date" value={endsAtDate} onChange={(e) => setEndsAtDate(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.5rem 0.65rem", fontSize: "0.8rem", color: "#fff", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", color: C.muted, marginBottom: 4 }}>Hora</label>
                  <select value={endsAtHour} onChange={(e) => setEndsAtHour(e.target.value)}
                    style={{ width: "100%", background: "#16161e", border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.5rem 0.65rem", fontSize: "0.8rem", color: endsAtHour ? "#fff" : C.muted, outline: "none", boxSizing: "border-box" }}>
                    <option value="">--</option>
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", color: C.muted, marginBottom: 4 }}>Minuto</label>
                  <select value={endsAtMinute} onChange={(e) => setEndsAtMinute(e.target.value)}
                    style={{ width: "100%", background: "#16161e", border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.5rem 0.65rem", fontSize: "0.8rem", color: endsAtMinute ? "#fff" : C.muted, outline: "none", boxSizing: "border-box" }}>
                    <option value="">--</option>
                    {["00", "15", "30", "45"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {estimatedReturn && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.55rem 0.85rem", background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "0.8rem" }}>🕐</span>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#7c5cfc" }}>Retorno estimado: <strong>{estimatedReturn}</strong></p>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[{ label: "+1 hora", h: 1 }, { label: "+2 horas", h: 2 }, { label: "+4 horas", h: 4 }].map(({ label, h }) => (
                  <button key={h} onClick={() => addQuickTime(h)}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
                <button onClick={addTomorrow}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                  +Amanhã
                </button>
                {(endsAtDate || endsAtHour || endsAtMinute) && (
                  <button onClick={() => { setEndsAtDate(""); setEndsAtHour(""); setEndsAtMinute(""); }}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Allowed users */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: "0.85rem" }}>✉️</span>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>Usuários permitidos (podem ignorar a manutenção)</p>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: "0.73rem", color: C.muted }}>Sua conta de proprietário sempre terá acesso. Pesquise usuários existentes para conceder acesso durante a manutenção.</p>

              <div style={{ position: "relative", marginBottom: 8 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: "0.8rem" }}>🔍</span>
                <input
                  placeholder="Pesquisar usuários por nome, usuário ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.5rem 0.75rem 0.5rem 2rem", fontSize: "0.82rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
                {userResults.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a1a24", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", zIndex: 20 }}>
                    {userResults.filter((u) => !allowedUsers.find((a) => a.id === u.id)).map((u) => (
                      <div key={u.id} onClick={() => addAllowedUser(u)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.55rem 0.85rem", cursor: "pointer", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, color: "#fff" }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        @{u.username}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {allowedUsers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {allowedUsers.map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.3rem 0.5rem 0.3rem 0.4rem", background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 20, fontSize: "0.78rem", color: "#fff" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff" }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      @{u.username}
                      <button onClick={() => setAllowedUsers((p) => p.filter((x) => x.id !== u.id))}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0 2px", fontSize: "0.9rem", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Other settings ────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
          <p style={{ margin: "0 0 1rem", fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Outras configurações</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row label="Nome do Site" desc="Nome exibido no painel e e-mails">
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)}
                style={{ width: 160, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "0.35rem 0.6rem", fontSize: "0.82rem", color: "#fff", outline: "none" }} />
            </Row>
            <Row label="Registro habilitado" desc="Permitir novos cadastros">
              <button onClick={() => setRegistration((v) => !v)}
                style={{ width: 44, height: 24, borderRadius: 12, background: registrationEnabled ? "#22c55e" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, left: registrationEnabled ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
              </button>
            </Row>
            <Row label="Máximo de links por usuário" desc="Número máximo de links permitidos">
              <input type="number" value={maxLinks} onChange={(e) => setMaxLinks(e.target.value)}
                style={{ width: 80, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "0.35rem 0.6rem", fontSize: "0.82rem", color: "#fff", outline: "none" }} />
            </Row>
          </div>
        </div>

        {/* Save */}
        <button onClick={saveAll} disabled={saving}
          style={{ width: "100%", padding: "0.85rem", borderRadius: 12, border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg,#7c5cfc,#f857a6)", color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: "0.92rem", fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Salvando..." : saved ? "✓ Configurações salvas" : "⊙ Salvar configurações"}
        </button>

      </>)}
    </motion.div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.82rem" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{desc}</p>
      </div>
      {children}
    </div>
  );
}
