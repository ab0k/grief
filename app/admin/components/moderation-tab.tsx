"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type BanUser = { id: string; user_id: string; username: string; avatar: string | null; isBanned: boolean; role: string | null };
type Appeal = { id: string; message: string; status: string; created_at: string; ban_id: string; bans: { ban_type: string; reason: string } | null; profiles: { username: string } | null };
type LogEntry = { id: string; action: string; reason: string | null; created_at: string; profiles: { username: string } | null };

const C = { card: "#16161e", border: "rgba(255,255,255,0.07)", muted: "rgba(255,255,255,0.4)", primary: "#7c5cfc" };

type SubTab = "users" | "appeals" | "logs";

export function ModerationTab() {
  const [sub, setSub] = useState<SubTab>("users");
  const [users, setUsers] = useState<BanUser[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Ban modal
  const [showBan, setShowBan] = useState<BanUser | null>(null);
  const [banType, setBanType] = useState<"temporary" | "permanent" | "shadow">("temporary");
  const [banReason, setBanReason] = useState("");
  const [banNotes, setBanNotes] = useState("");
  const [banHours, setBanHours] = useState(24);
  const [banning, setBanning] = useState(false);

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${p}&limit=15`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(searchQ, 1); }, 300);
    return () => clearTimeout(t);
  }, [searchQ, fetchUsers]);

  useEffect(() => { fetchUsers(searchQ, page); }, [page]); // eslint-disable-line

  useEffect(() => {
    if (sub === "appeals") {
      setLoading(true);
      fetch("/api/admin/appeals").then((r) => r.json()).then((d) => setAppeals(d.appeals ?? [])).finally(() => setLoading(false));
    }
    if (sub === "logs") {
      setLoading(true);
      fetch("/api/admin/moderation-log").then((r) => r.json()).then((d) => setLogs(d.logs ?? [])).finally(() => setLoading(false));
    }
  }, [sub]);

  async function doBan() {
    if (!showBan || !banReason) return;
    setBanning(true);
    const expiresAt = banType === "temporary" ? new Date(Date.now() + banHours * 3600000).toISOString() : null;
    await fetch("/api/admin/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: showBan.user_id, banType, reason: banReason, internalNotes: banNotes || undefined, expiresAt }),
    });
    setBanning(false);
    setShowBan(null);
    setBanReason("");
    setBanNotes("");
    fetchUsers(searchQ, page);
  }

  async function doUnban(userId: string) {
    await fetch(`/api/admin/bans/${userId}/unban`, { method: "POST" });
    fetchUsers(searchQ, page);
  }

  async function reviewAppeal(id: string, decision: "approved" | "rejected") {
    const response = prompt(`Resposta (${decision === "approved" ? "aprovado" : "rejeitado"}):`);
    if (!response) return;
    await fetch(`/api/admin/appeals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, response }),
    });
    fetch("/api/admin/appeals").then((r) => r.json()).then((d) => setAppeals(d.appeals ?? []));
  }

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "users", label: "Usuários" },
    { id: "appeals", label: "Apelações" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, marginBottom: "1rem", width: "fit-content" }}>
        {subTabs.map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ padding: "0.35rem 1rem", borderRadius: 8, border: "none", background: sub === t.id ? "rgba(255,255,255,0.1)" : "transparent", color: sub === t.id ? "#fff" : C.muted, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users sub-tab */}
      {sub === "users" && (
        <div>
          <input
            placeholder="Buscar usuário..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.45rem 0.75rem", fontSize: "0.85rem", color: "#fff", outline: "none", marginBottom: "0.75rem", boxSizing: "border-box" }}
          />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {loading ? (
              <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Carregando...</p>
            ) : users.length === 0 ? (
              <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Nenhum resultado.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 0.75rem", borderBottom: `1px solid ${C.border}30` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
                    {u.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{u.username}</p>
                    <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                      {u.isBanned && <span style={{ fontSize: "0.68rem", background: "#ef444420", color: "#ef4444", padding: "0 5px", borderRadius: 4 }}>banido</span>}
                      {(u.role === "admin" || u.role === "owner") && <span style={{ fontSize: "0.68rem", background: "rgba(124,92,252,0.2)", color: "#7c5cfc", padding: "0 5px", borderRadius: 4 }}>{u.role}</span>}
                    </div>
                  </div>
                  {u.isBanned ? (
                    <button onClick={() => doUnban(u.user_id)} style={{ padding: "0.3rem 0.7rem", borderRadius: 6, border: "1px solid #22c55e30", background: "#22c55e15", color: "#22c55e", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>Desbanir</button>
                  ) : (
                    <button
                      onClick={() => { setShowBan(u); setBanType("temporary"); setBanReason(""); setBanNotes(""); }}
                      disabled={u.role === "admin" || u.role === "owner"}
                      style={{ padding: "0.3rem 0.7rem", borderRadius: 6, border: "1px solid #ef444430", background: "#ef444415", color: "#ef4444", cursor: (u.role === "admin" || u.role === "owner") ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 600, opacity: (u.role === "admin" || u.role === "owner") ? 0.4 : 1 }}
                    >
                      Banir
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "0.75rem" }}>
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={pagStyle(page === 1)}>‹ Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} style={pagStyle(page === totalPages)}>Próximo ›</button>
            </div>
          )}
        </div>
      )}

      {/* Appeals sub-tab */}
      {sub === "appeals" && (
        <div>
          {loading ? (
            <p style={{ color: C.muted, textAlign: "center", padding: "2rem 0", margin: 0 }}>Carregando...</p>
          ) : appeals.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "2.5rem", textAlign: "center" }}>
              <p style={{ margin: 0, color: C.muted }}>Nenhuma apelação pendente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {appeals.map((a) => (
                <div key={a.id} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#fff" }}>{a.profiles?.username ?? "Usuário desconhecido"}</p>
                    <span style={{ fontSize: "0.72rem", background: "rgba(245,158,11,0.2)", color: "#f59e0b", padding: "2px 8px", borderRadius: 4 }}>pendente</span>
                  </div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: C.muted }}>Tipo: {a.bans?.ban_type} · Motivo original: {a.bans?.reason}</p>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#fff" }}>"{a.message}"</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => reviewAppeal(a.id, "approved")} style={{ flex: 1, padding: "0.4rem", borderRadius: 7, border: "1px solid #22c55e30", background: "#22c55e15", color: "#22c55e", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>✓ Aprovar</button>
                    <button onClick={() => reviewAppeal(a.id, "rejected")} style={{ flex: 1, padding: "0.4rem", borderRadius: 7, border: "1px solid #ef444430", background: "#ef444415", color: "#ef4444", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>✗ Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs sub-tab */}
      {sub === "logs" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Carregando...</p>
          ) : logs.length === 0 ? (
            <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Nenhum log.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 0.75rem", borderBottom: `1px solid ${C.border}30` }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: actionColor(log.action) + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                  {actionIcon(log.action)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#fff" }}><strong>{log.action}</strong>{log.profiles && ` → @${log.profiles.username}`}</p>
                  {log.reason && <p style={{ margin: 0, fontSize: "0.73rem", color: C.muted }}>{log.reason}</p>}
                </div>
                <span style={{ fontSize: "0.7rem", color: C.muted, whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ban modal */}
      <AnimatePresence>
        {showBan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowBan(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} style={{ width: "100%", maxWidth: 420, background: "#111118", border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>🔨 Banir @{showBan.username}</h3>

              <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: C.muted }}>Tipo de ban</p>
              <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
                {(["temporary", "permanent", "shadow"] as const).map((t) => (
                  <button key={t} onClick={() => setBanType(t)} style={{ flex: 1, padding: "0.4rem 0", borderRadius: 7, border: `1px solid ${banType === t ? "#ef444440" : C.border}`, background: banType === t ? "#ef444415" : "transparent", color: banType === t ? "#ef4444" : C.muted, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, fontFamily: "inherit" }}>
                    {t === "temporary" ? "Temp." : t === "permanent" ? "Perm." : "Shadow"}
                  </button>
                ))}
              </div>

              {banType === "temporary" && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: C.muted }}>Duração (horas)</p>
                  <input type="number" min={1} value={banHours} onChange={(e) => setBanHours(parseInt(e.target.value) || 1)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "0.4rem 0.7rem", fontSize: "0.85rem", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: C.muted }}>Motivo *</p>
              <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={3} placeholder="Motivo do ban..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "0.5rem 0.7rem", fontSize: "0.82rem", color: "#fff", outline: "none", resize: "none", marginBottom: "0.75rem", fontFamily: "inherit", boxSizing: "border-box" }} />

              <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: C.muted }}>Notas internas</p>
              <textarea value={banNotes} onChange={(e) => setBanNotes(e.target.value)} rows={2} placeholder="Notas para admins (opcional)..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "0.5rem 0.7rem", fontSize: "0.82rem", color: "#fff", outline: "none", resize: "none", marginBottom: "1.25rem", fontFamily: "inherit", boxSizing: "border-box" }} />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowBan(null)} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancelar</button>
                <button onClick={doBan} disabled={banning || !banReason} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: (!banReason || banning) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: (!banReason || banning) ? 0.6 : 1 }}>
                  {banning ? "Banindo..." : "Confirmar Ban"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function pagStyle(disabled: boolean): React.CSSProperties {
  return { padding: "0.35rem 0.85rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: disabled ? "rgba(255,255,255,0.2)" : "#fff", cursor: disabled ? "not-allowed" : "pointer", fontSize: "0.78rem", fontFamily: "inherit" };
}

function actionColor(action: string) {
  if (action.startsWith("ban")) return "#ef4444";
  if (action.startsWith("unban") || action === "appeal_approved") return "#22c55e";
  if (action === "appeal_rejected") return "#f59e0b";
  return "#6b7280";
}

function actionIcon(action: string) {
  if (action.startsWith("ban")) return "🔨";
  if (action.startsWith("unban")) return "✓";
  if (action.startsWith("appeal")) return "⚖️";
  return "📝";
}
