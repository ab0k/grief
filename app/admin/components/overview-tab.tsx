"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Stats = {
  totalUsers: number;
  activeBans: number;
  pendingAppeals: number;
  totalAdmins: number;
  openTickets: number;
  openIncidents: number;
};

const C = {
  card: "#16161e",
  border: "rgba(255,255,255,0.07)",
  muted: "rgba(255,255,255,0.4)",
  primary: "#7c5cfc",
};

type AdminTab = "overview" | "user-manager" | "moderation" | "abuse" | "security" | "tickets" | "incidents" | "newsletter" | "partners" | "legal" | "compliance" | "settings";

export function OverviewTab({
  onTabChange,
  role,
}: {
  onTabChange: (tab: AdminTab) => void;
  role: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const statCards = [
    { label: "Total de Usuários", value: stats?.totalUsers ?? "—", color: C.primary, icon: "👥" },
    { label: "Bans Ativos", value: stats?.activeBans ?? "—", color: "#ef4444", icon: "🔨" },
    { label: "Apelações Pendentes", value: stats?.pendingAppeals ?? "—", color: "#f59e0b", icon: "⚠️" },
    { label: "Admins", value: stats?.totalAdmins ?? "—", color: "#22c55e", icon: "🛡️" },
  ];

  const quickActions: { label: string; tab: AdminTab; color: string; icon: string }[] = [
    { label: "Gerenciar Usuários", tab: "user-manager", color: "#3b82f6", icon: "👤" },
    { label: "Revisão de Bans", tab: "moderation", color: "#ef4444", icon: "🔨" },
    { label: "Alertas de Abuso", tab: "abuse", color: "#f59e0b", icon: "⚠️" },
    { label: "Tickets Abertos", tab: "tickets", color: "#6366f1", icon: "🎫" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
      {/* Welcome */}
      <div style={{ background: "linear-gradient(135deg, rgba(124,92,252,0.12), transparent)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>Painel Administrativo</h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: C.muted }}>Bem-vindo de volta. Todas as ações são registradas.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{s.icon}</div>
            <p style={{ margin: "0 0 2px", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{stats ? s.value : "—"}</p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: C.muted }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Ações Rápidas</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {quickActions.map((a) => (
          <button
            key={a.tab}
            onClick={() => onTabChange(a.tab)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.85rem", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = a.color + "60")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            <div style={{ fontSize: "1.25rem", marginBottom: 6 }}>{a.icon}</div>
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{a.label}</p>
          </button>
        ))}
      </div>

      {/* Activity placeholder */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>Atividade Recente</p>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, width: "60%", borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 6 }} />
              <div style={{ height: 8, width: "35%", borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
        ))}
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.73rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Em breve — histórico de atividades</p>
      </div>

      {role === "owner" && (
        <button
          onClick={() => onTabChange("settings")}
          style={{ marginTop: "0.75rem", width: "100%", background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(236,72,153,0.08))", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "0.9rem 1rem", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: "1.4rem" }}>⚙️</span>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 600, color: "#fff", fontSize: "0.88rem" }}>Configurações do Sistema</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>Apenas para owners — manutenção e ajustes globais</p>
          </div>
        </button>
      )}
    </motion.div>
  );
}
