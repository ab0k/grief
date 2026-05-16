"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    section: "Dashboard",
    items: [{ label: "Overview", href: "/dashboard", icon: <OverviewIcon /> }],
  },
  {
    section: "Customize",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: <ProfileIcon /> },
      { label: "Appearance", href: "/dashboard/appearance", icon: <AppearanceIcon /> },
      { label: "Links", href: "/dashboard/links", icon: <LinksIcon /> },
      { label: "Badges", href: "/dashboard/badges", icon: <BadgesIcon /> },
      { label: "Widgets", href: "/dashboard/widgets", icon: <WidgetsIcon /> },
      { label: "Tracks", href: "/dashboard/tracks", icon: <TracksIcon /> },
      { label: "Effects", href: "/dashboard/effects", icon: <EffectsIcon /> },
      { label: "Midia", href: "/dashboard/midia", icon: <EffectsIcon /> },
    ],
  },
  {
    section: "Manage",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: <SettingsIcon /> },
    ],
  },
  {
    section: "Resources",
    items: [
      { label: "Help", href: "/dashboard/help", icon: <HelpIcon /> },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; uid: string; role: string; badges: { icon: string; color: string }[] }>({ username: "...", uid: "", role: "", badges: [] });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, role")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        // fetch badges in parallel
        const { data: ub } = await supabase
          .from("user_badges")
          .select("badge:badges(icon, color)")
          .eq("profile_id", profile.id);
        const badges = (ub ?? []).map((r: any) => r.badge).filter(Boolean) as { icon: string; color: string }[];
        setUser({ username: profile.username, uid: String(profile.id), role: profile.role ?? "", badges });
      } else {
        const meta = user.user_metadata;
        setUser({
          username: meta?.username ?? meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "user",
          uid: "—",
          role: "",
          badges: [],
        });
      }
    })();
  }, []);

  async function handleLogout() {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "logout", url: "/auth/logout" }),
    }).catch(() => { });

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1.1rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#dblg)" />
            <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="3" fill="#fff" />
            <defs>
              <linearGradient id="dblg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", letterSpacing: "-0.02em" }}>grief.cc</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="sidebar-close-btn"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, display: "none" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.5rem 0.6rem", overflowY: "auto" }}>
        {NAV.map((group) => (
          <div key={group.section} style={{ marginBottom: "0.25rem" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.6rem 0.5rem 0.3rem" }}>
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "0.45rem 0.6rem", borderRadius: 8,
                    textDecoration: "none", fontSize: "0.875rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                    background: active ? "rgba(124,92,252,0.18)" : "transparent",
                    transition: "background 0.15s, color 0.15s", marginBottom: 2,
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; } }}
                >
                  <span style={{ opacity: active ? 1 : 0.6, display: "flex" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Admin Panel link — only for admin/owner */}
      {(user.role === "admin" || user.role === "owner") && (
        <div style={{ padding: "0.25rem 0.6rem 0" }}>
          <a
            href="/admin"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.6rem", borderRadius: 8, textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, rgba(124,92,252,0.25), rgba(248,87,166,0.15))", border: "1px solid rgba(124,92,252,0.3)", marginBottom: "0.25rem", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <AdminIcon />
            Admin Panel
            {user.role === "owner" && <span style={{ marginLeft: "auto", fontSize: "0.65rem", background: "rgba(251,191,36,0.2)", color: "#fbbf24", padding: "1px 6px", borderRadius: 4 }}>owner</span>}
          </a>
        </div>
      )}

      {/* View Profile */}
      <div style={{ padding: "0.5rem 0.6rem" }}>
        <a
          href={`/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (user.username === "...") e.preventDefault(); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.6rem", borderRadius: 8, textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, color: "rgba(255,255,255,0.5)", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <ExternalIcon /> Ver perfil
        </a>
      </div>

      {/* User */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {user.username[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{user.username}</p>
              {user.badges.map((b, i) => (
                <span key={i} title={b.icon} style={{ fontSize: "0.75rem", lineHeight: 1, filter: `drop-shadow(0 0 4px ${b.color}80)` }}>{b.icon}</span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>UID {user.uid}</p>
          </div>
        </div>
        <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4, display: "flex" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <LogoutIcon />
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d12" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99, display: "none" }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`db-sidebar${sidebarOpen ? " db-sidebar--open" : ""}`}
        style={{ width: 210, flexShrink: 0, background: "#111118", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: "auto" }}
      >
        <SidebarContent />
      </aside>

      {/* Right side */}
      <div className="db-content" style={{ marginLeft: 210, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Mobile topbar */}
        <header className="db-topbar" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 52, background: "#111118", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" />
            </svg>
          </button>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>grief.cc</span>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>
            {user.username[0]?.toUpperCase() ?? "?"}
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .db-page-wrap { padding: 1rem 0.9rem 2rem !important; }
          .db-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: none;
          }
          .db-sidebar--open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.5);
          }
          .sidebar-overlay { display: block !important; }
          .sidebar-close-btn { display: flex !important; }
          .db-content { margin-left: 0 !important; }
          .db-topbar { display: flex !important; }

          /* Responsive grids */
          .db-grid-3  { grid-template-columns: 1fr !important; }
          .db-grid-2  { grid-template-columns: 1fr !important; }
          .db-grid-badges { grid-template-columns: 1fr !important; }
          .db-grid-game   { grid-template-columns: 1fr 1fr !important; }
          .db-grid-right  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .db-grid-game { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function OverviewIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }
function ProfileIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function AppearanceIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>; }
function LinksIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>; }
function BadgesIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>; }
function WidgetsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>; }
function TracksIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>; }
function SettingsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function HelpIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>; }
function ExternalIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>; }
function LogoutIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function EffectsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>; }
function MediaIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-4 4-2-2-4 3" /><path d="M14 8.5l4 2.5-4 2.5v-5z" /></svg>; }
function AdminIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3 6.5L22 9.3l-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l7-.8L12 2z" /></svg>; }