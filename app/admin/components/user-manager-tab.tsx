"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type User = {
  id: string;          // profile numeric id (string)
  user_id: string;     // auth uuid
  username: string;
  role: string | null;
  avatar: string | null;
  tier: string | null;
  isBanned: boolean;
};

type Badge = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
};

type UserBadge = {
  id: string;       // user_badges.id
  badge_id: string;
  badge: Badge;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; desc: string; icon: string; color: string; bg: string }> = {
  free:     { label: "Free",     desc: "Acesso básico",       icon: "⚡", color: "#6b7280", bg: "#6b728015" },
  pro:      { label: "Pro",      desc: "Recursos de Pro",     icon: "⭐", color: "#3b82f6", bg: "#3b82f615" },
  creator:  { label: "Creator",  desc: "Recursos de Creator", icon: "👑", color: "#f59e0b", bg: "#f59e0b15" },
  lifetime: { label: "Lifetime", desc: "Acesso permanente",   icon: "💎", color: "#ec4899", bg: "#ec489915" },
};

const ROLE_COLOR: Record<string, string> = {
  owner: "#fbbf24",
  admin: "#ef4444",
  user:  "rgba(255,255,255,0.3)",
};

const C = {
  bg:     "#0d0d12",
  card:   "#16161e",
  card2:  "#1a1a24",
  border: "rgba(255,255,255,0.07)",
  muted:  "rgba(255,255,255,0.4)",
  muted2: "rgba(255,255,255,0.2)",
  primary: "#7c5cfc",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function UserManagerTab() {
  // list state
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery]           = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError]   = useState<string | null>(null);

  // panel state
  const [selected, setSelected]     = useState<User | null>(null);
  const [subTab, setSubTab]         = useState<"badges" | "tier">("badges");

  // badges state
  const [allBadges, setAllBadges]     = useState<Badge[]>([]);
  const [userBadges, setUserBadges]   = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgeBusy, setBadgeBusy]     = useState<string | null>(null); // badge_id being toggled

  // tier state
  const [tierBusy, setTierBusy] = useState(false);

  // ── Fetch users ─────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (q: string, role: string, p: number) => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ q, page: String(p), limit: "15" });
      if (role !== "all") params.set("role", role);
      const res  = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (!res.ok) { setListError(data.error ?? `Erro ${res.status}`); setUsers([]); return; }
      setUsers(data.users ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch { setListError("Falha na conexão"); }
    finally { setListLoading(false); }
  }, []);

  // initial + query/role debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(query, roleFilter, 1); }, 300);
    return () => clearTimeout(t);
  }, [query, roleFilter, fetchUsers]);

  // page change
  useEffect(() => { fetchUsers(query, roleFilter, page); }, [page]); // eslint-disable-line

  // ── Load all badge definitions ───────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((d) => setAllBadges(d.badges ?? []))
      .catch(() => {});
  }, []);

  // ── Load user badges when selection changes ──────────────────────────────────

  useEffect(() => {
    if (!selected) return;
    setBadgesLoading(true);
    fetch(`/api/admin/users/${selected.id}/badges`)
      .then((r) => r.json())
      .then((d) => setUserBadges(d.badges ?? []))
      .catch(() => {})
      .finally(() => setBadgesLoading(false));
  }, [selected]);

  // ── Badge toggle ─────────────────────────────────────────────────────────────

  async function toggleBadge(badge: Badge) {
    if (!selected || badgeBusy) return;
    setBadgeBusy(badge.id);
    try {
      const owned = userBadges.find((ub) => ub.badge_id === badge.id);
      if (owned) {
        await fetch(`/api/admin/users/${selected.id}/badges/${owned.id}`, { method: "DELETE" });
        setUserBadges((prev) => prev.filter((ub) => ub.id !== owned.id));
      } else {
        const res  = await fetch(`/api/admin/users/${selected.id}/badges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badge_id: badge.id }),
        });
        const data = await res.json();
        if (data.badge) setUserBadges((prev) => [...prev, data.badge]);
      }
      // refresh user list to update badge count
      fetchUsers(query, roleFilter, page);
    } finally { setBadgeBusy(null); }
  }

  // ── Tier change ──────────────────────────────────────────────────────────────

  async function changeTier(tier: string) {
    if (!selected || tierBusy) return;
    setTierBusy(true);
    try {
      await fetch(`/api/admin/users/${selected.id}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      setSelected((s) => s ? { ...s, tier } : s);
      setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, tier } : u));
    } finally { setTierBusy(false); }
  }

  // ── Role change ──────────────────────────────────────────────────────────────

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSelected((s) => s ? { ...s, role } : s);
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role } : u));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", alignItems: "start" }}
    >
      {/* ── Left: user list ─────────────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {/* Search + filter */}
        <div style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: "0.8rem" }}>🔍</span>
            <input
              placeholder="Pesquisar usuários..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.45rem 0.75rem 0.45rem 2rem", fontSize: "0.83rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.45rem 0.6rem", fontSize: "0.8rem", color: C.muted, outline: "none", cursor: "pointer" }}
          >
            <option value="all">Todos os cargos</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* List */}
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {listLoading ? (
            <p style={{ padding: "2rem", textAlign: "center", color: C.muted, margin: 0 }}>Carregando...</p>
          ) : listError ? (
            <div style={{ padding: "1.5rem", textAlign: "center" }}>
              <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0 0 4px" }}>Erro ao carregar:</p>
              <p style={{ color: C.muted, fontSize: "0.72rem", margin: 0, fontFamily: "monospace" }}>{listError}</p>
            </div>
          ) : users.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: C.muted, margin: 0 }}>Nenhum usuário encontrado.</p>
          ) : (
            users.map((u) => {
              const isSelected = selected?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => { setSelected(isSelected ? null : u); setSubTab("badges"); }}
                  style={{ padding: "0.65rem 0.85rem", cursor: "pointer", borderBottom: `1px solid ${C.border}20`, background: isSelected ? "rgba(124,92,252,0.1)" : "transparent", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: u.avatar ? `url(${u.avatar}) center/cover` : "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0, overflow: "hidden" }}>
                      {!u.avatar && (u.username?.[0]?.toUpperCase() ?? "?")}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{u.username}</span>
                        {(u.role === "owner" || u.role === "admin") && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: (u.role === "owner" ? "#fbbf2420" : "#ef444420"), color: ROLE_COLOR[u.role] }}>
                            {u.role}
                          </span>
                        )}
                        {u.isBanned && <span style={{ fontSize: "0.65rem", background: "#ef444420", color: "#ef4444", padding: "1px 7px", borderRadius: 20 }}>banido</span>}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: C.muted }}>@{u.username}</span>
                    </div>

                    {/* Chevron */}
                    <span style={{ color: isSelected ? C.primary : C.muted2, fontSize: "0.9rem", transition: "transform 0.15s", display: "inline-block", transform: isSelected ? "rotate(180deg)" : "none" }}>⌄</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.85rem", borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: "0.72rem", color: C.muted }}>{total} usuários</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <PagBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</PagBtn>
              <span style={{ fontSize: "0.72rem", color: C.muted, padding: "0 4px" }}>{page}/{totalPages}</span>
              <PagBtn disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: management panel ──────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", position: "sticky", top: "1rem" }}>
        {/* Panel header */}
        <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>👑</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Gerenciador de Usuários</p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>
              {selected ? `Gerenciando ${selected.username}` : "Selecione um usuário"}
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div style={{ display: "flex", gap: 6, padding: "0.65rem 1rem", borderBottom: `1px solid ${C.border}` }}>
          <SubTabBtn active={subTab === "badges"} color="#f59e0b" onClick={() => setSubTab("badges")}>
            ✦ Badges
          </SubTabBtn>
          <SubTabBtn active={subTab === "tier"} color="#ec4899" onClick={() => setSubTab("tier")}>
            💎 Plano
          </SubTabBtn>
        </div>

        {/* Panel body */}
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "3rem 1rem", textAlign: "center", color: C.muted, fontSize: "0.82rem" }}>
                Selecione um usuário na lista para gerenciar
              </motion.div>
            ) : subTab === "badges" ? (
              <motion.div key={`badges-${selected.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                {/* User info mini-header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.85rem 1rem", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: selected.avatar ? `url(${selected.avatar}) center/cover` : "linear-gradient(135deg,#7c5cfc,#f857a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                    {!selected.avatar && (selected.username?.[0]?.toUpperCase() ?? "?")}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{selected.username}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>@{selected.username}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#22c55e" }}>✦ {userBadges.length} badges</p>
                  </div>
                </div>

                {/* Badge list */}
                {badgesLoading ? (
                  <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Carregando badges...</p>
                ) : allBadges.length === 0 ? (
                  <p style={{ padding: "1.5rem", textAlign: "center", color: C.muted, margin: 0 }}>Nenhum badge cadastrado no banco.</p>
                ) : (
                  <div>
                    {allBadges.map((badge) => {
                      const owned = userBadges.find((ub) => ub.badge_id === badge.id);
                      const busy  = badgeBusy === badge.id;
                      return (
                        <div
                          key={badge.id}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 1rem", borderBottom: `1px solid ${C.border}15`, background: owned ? `${badge.color}06` : "transparent", transition: "background 0.1s" }}
                        >
                          {/* Badge icon */}
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${badge.color}18`, border: `1.5px solid ${badge.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                            {badge.icon}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: owned ? badge.color : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{badge.name}</p>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{badge.description}</p>
                          </div>

                          {/* Toggle button */}
                          <button
                            onClick={() => toggleBadge(badge)}
                            disabled={busy}
                            style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: owned ? "#ef444420" : "#22c55e20", color: owned ? "#ef4444" : "#22c55e", cursor: busy ? "wait" : "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
                            title={owned ? "Remover badge" : "Atribuir badge"}
                          >
                            {busy ? "·" : owned ? "−" : "+"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              // Tier tab
              <motion.div key={`tier-${selected.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <p style={{ margin: 0, padding: "0.75rem 1rem", fontSize: "0.75rem", color: C.muted, borderBottom: `1px solid ${C.border}` }}>Selecionar plano para atribuir</p>
                <div style={{ padding: "0.5rem" }}>
                  {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
                    const isCurrent = (selected.tier ?? "free") === key;
                    return (
                      <button
                        key={key}
                        onClick={() => !isCurrent && changeTier(key)}
                        disabled={isCurrent || tierBusy}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0.7rem 0.85rem", borderRadius: 10, border: `2px solid ${isCurrent ? cfg.color + "50" : "transparent"}`, background: isCurrent ? cfg.bg : "rgba(255,255,255,0.02)", cursor: isCurrent ? "default" : "pointer", textAlign: "left", marginBottom: 4, transition: "all 0.15s", opacity: tierBusy && !isCurrent ? 0.5 : 1 }}
                        onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: isCurrent ? cfg.color : "#fff" }}>{cfg.label}</p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>{cfg.desc}</p>
                        </div>
                        {isCurrent ? (
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>Atual</span>
                        ) : (
                          <span style={{ color: C.muted2, fontSize: "0.9rem" }}>›</span>
                        )}
                      </button>
                    );
                  })}
                  <p style={{ margin: "0.5rem 0 0", padding: "0.6rem", borderRadius: 8, background: "rgba(245,158,11,0.07)", fontSize: "0.7rem", color: "#f59e0b" }}>
                    ⚠️ Atribuir plano manualmente — use para pagamentos fora do site.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function PagBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: disabled ? "rgba(255,255,255,0.2)" : "#fff", cursor: disabled ? "not-allowed" : "pointer", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}

function SubTabBtn({ children, active, color, onClick }: { children: React.ReactNode; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "0.4rem 0", borderRadius: 9, border: `1px solid ${active ? color + "40" : "transparent"}`, background: active ? color + "15" : "rgba(255,255,255,0.03)", color: active ? color : "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}
