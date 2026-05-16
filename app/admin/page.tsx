"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { OverviewTab } from "./components/overview-tab";
import { UserManagerTab } from "./components/user-manager-tab";
import { ModerationTab } from "./components/moderation-tab";
import { SettingsTab } from "./components/settings-tab";
import { StubTab } from "./components/stub-tab";

type AdminTab =
  | "overview" | "user-manager" | "moderation" | "abuse"
  | "security" | "tickets" | "incidents" | "newsletter"
  | "partners" | "legal" | "compliance" | "settings";

type TabDef = {
  id: AdminTab;
  label: string;
  desc: string;
  icon: string;
  color: string;
  ownerOnly?: boolean;
};

const TABS: TabDef[] = [
  { id: "overview",      label: "Overview",          desc: "Estatísticas gerais",     icon: "📊", color: "#7c5cfc" },
  { id: "user-manager",  label: "Usuários",          desc: "Gerenciar cargos",        icon: "👥", color: "#3b82f6" },
  { id: "moderation",    label: "Moderação",         desc: "Bans e apelações",        icon: "🛡️", color: "#ef4444" },
  { id: "abuse",         label: "Abusos",            desc: "Relatórios de abuso",     icon: "⚠️", color: "#f59e0b" },
  { id: "security",      label: "Segurança",         desc: "Eventos de segurança",    icon: "🔐", color: "#dc2626" },
  { id: "tickets",       label: "Tickets",           desc: "Suporte ao usuário",      icon: "🎫", color: "#6366f1" },
  { id: "incidents",     label: "Incidentes",        desc: "Acompanhamento",          icon: "🚨", color: "#f59e0b" },
  { id: "newsletter",    label: "Newsletter",        desc: "Campanhas de e-mail",     icon: "📧", color: "#6366f1" },
  { id: "partners",      label: "Parceiros",         desc: "Gestão de parceiros",     icon: "🤝", color: "#14b8a6" },
  { id: "legal",         label: "Legal",             desc: "Documentos legais",       icon: "⚖️", color: "#6366f1" },
  { id: "compliance",    label: "Compliance",        desc: "Conformidade",            icon: "✅", color: "#22c55e" },
  { id: "settings",      label: "Configurações",     desc: "Sistema (owner only)",    icon: "⚙️", color: "#8b5cf6", ownerOnly: true },
];

const C = { bg: "#0d0d12", sidebar: "#111118", card: "#16161e", border: "rgba(255,255,255,0.07)", muted: "rgba(255,255,255,0.4)", primary: "#7c5cfc" };

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const t = searchParams.get("tab") as AdminTab | null;
    return TABS.some((x) => x.id === t) ? t! : "overview";
  });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("user_id", authUser.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
        router.push("/dashboard");
        return;
      }

      setUser({ username: profile.username, role: profile.role });
      setLoading(false);
    })();
  }, [router]);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    setSidebarOpen(false);
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || user?.role === "owner");
  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div style={{ padding: "1.1rem 0.9rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>👑</div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#fff" }}>Admin Panel</p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: C.muted }}>{user?.role === "owner" ? "Owner Access" : "Admin Access"}</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="admin-sidebar-close" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2, display: "none" }}>✕</button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.5rem 0.5rem", overflowY: "auto" }}>
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.6rem", borderRadius: 8, border: "none", background: isActive ? "rgba(255,255,255,0.06)" : "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2, position: "relative", transition: "background 0.12s" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {isActive && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "0 2px 2px 0", background: tab.color }} />}
              <span style={{ fontSize: "1rem", width: 24, textAlign: "center" }}>{tab.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.label}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Admin mode indicator */}
      <div style={{ margin: "0.5rem", padding: "0.6rem 0.7rem", background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 8 }}>
        <p style={{ margin: "0 0 1px", fontSize: "0.68rem", fontWeight: 600, color: C.primary }}>🛡️ Modo Admin ativo</p>
        <p style={{ margin: 0, fontSize: "0.65rem", color: C.muted }}>Ações são registradas</p>
      </div>

      {/* User info */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "0.65rem 0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {user?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</p>
          <p style={{ margin: 0, fontSize: "0.67rem", color: C.muted }}>{user?.role}</p>
        </div>
        <a href="/dashboard" style={{ color: C.muted, textDecoration: "none", fontSize: "0.72rem" }} title="Dashboard">←</a>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} className="admin-overlay" />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${sidebarOpen ? " admin-sidebar--open" : ""}`}
        style={{ width: 200, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: "auto" }}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="admin-content" style={{ marginLeft: 200, flex: 1, minHeight: "100vh" }}>
        {/* Mobile topbar */}
        <header className="admin-topbar" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 52, background: C.sidebar, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4, fontSize: "1.1rem" }}>☰</button>
          <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "#fff" }}>Admin Panel</span>
          <span style={{ fontSize: "1rem" }}>{activeTabDef.icon}</span>
        </header>

        <main style={{ padding: "1.75rem 1.5rem 3rem", maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {/* Page header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <span style={{ background: activeTabDef.color + "15", borderRadius: 8, padding: "7px 8px", fontSize: "1.1rem" }}>{activeTabDef.icon}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{activeTabDef.label}</h1>
              <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>{activeTabDef.desc}</p>
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview"     && <OverviewTab key="overview" onTabChange={handleTabChange} role={user?.role ?? "admin"} />}
            {activeTab === "user-manager" && <UserManagerTab key="user-manager" />}
            {activeTab === "moderation"   && <ModerationTab key="moderation" />}
            {activeTab === "abuse"        && <StubTab key="abuse" title="Relatórios de Abuso" description="Gerencie relatórios de conteúdo abusivo e violações." icon="⚠️" items={[{ label: "Abertos", value: "—", color: "#f59e0b" }, { label: "Em revisão", value: "—" }, { label: "Resolvidos", value: "—", color: "#22c55e" }]} />}
            {activeTab === "security"     && <StubTab key="security" title="Monitoramento de Segurança" description="Eventos de segurança, acessos suspeitos e alertas." icon="🔐" items={[{ label: "Alertas", value: "—", color: "#ef4444" }, { label: "Bloqueados", value: "—" }]} />}
            {activeTab === "tickets"      && <StubTab key="tickets" title="Tickets de Suporte" description="Central de atendimento e suporte ao usuário." icon="🎫" items={[{ label: "Abertos", value: "—", color: "#6366f1" }, { label: "Em progresso", value: "—", color: "#f59e0b" }, { label: "Resolvidos", value: "—", color: "#22c55e" }]} />}
            {activeTab === "incidents"    && <StubTab key="incidents" title="Incidentes" description="Rastreamento e resposta a incidentes do sistema." icon="🚨" items={[{ label: "Ativos", value: "—", color: "#ef4444" }, { label: "Investigando", value: "—", color: "#f59e0b" }]} />}
            {activeTab === "newsletter"   && <StubTab key="newsletter" title="Newsletter" description="Gestão de campanhas de e-mail e assinantes." icon="📧" items={[{ label: "Assinantes", value: "—", color: "#6366f1" }, { label: "Enviados", value: "—" }]} />}
            {activeTab === "partners"     && <StubTab key="partners" title="Parceiros" description="Gestão de parcerias e integrações externas." icon="🤝" items={[{ label: "Ativos", value: "—", color: "#14b8a6" }, { label: "Pendentes", value: "—", color: "#f59e0b" }]} />}
            {activeTab === "legal"        && <StubTab key="legal" title="Documentos Legais" description="Termos de uso, política de privacidade e outros documentos." icon="⚖️" items={[{ label: "Documentos", value: "—" }, { label: "Ativos", value: "—", color: "#22c55e" }]} />}
            {activeTab === "compliance"   && <StubTab key="compliance" title="Compliance" description="Conformidade regulatória e relatórios de auditoria." icon="✅" />}
            {activeTab === "settings"     && <SettingsTab key="settings" role={user?.role ?? "admin"} />}
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform 0.25s ease; }
          .admin-sidebar--open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
          .admin-sidebar-close { display: flex !important; }
          .admin-content { margin-left: 0 !important; }
          .admin-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageInner />
    </Suspense>
  );
}
