"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "owned" | "other";

type Badge = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: "achievement" | "staff" | "premium" | "event" | "social";
  acquirable: boolean;
};

type UserBadge = {
  id: string;
  badge_id: string;
  acquired_at: string;
  badge: Badge;
};

// ── Badge catalogue (matches DB seed) ────────────────────────────────────────

const BADGE_CATALOGUE: Omit<Badge, "id">[] = [
  { key: "og",           name: "OG",            description: "Um dos primeiros usuários da plataforma.",         icon: "👑", color: "#f59e0b", category: "achievement", acquirable: false },
  { key: "early",        name: "Early",         description: "Entrou durante o acesso antecipado.",              icon: "🌅", color: "#fb923c", category: "achievement", acquirable: false },
  { key: "verified",     name: "Verified",      description: "Identidade verificada pela equipe.",               icon: "✅", color: "#3b82f6", category: "achievement", acquirable: false },
  { key: "premium",      name: "Premium",       description: "Assinante Premium ativo.",                         icon: "💎", color: "#a855f7", category: "premium",     acquirable: true  },
  { key: "donator",      name: "Donator",        description: "Apoiou o desenvolvimento da plataforma.",         icon: "💜", color: "#ec4899", category: "premium",     acquirable: true  },
  { key: "booster",      name: "Booster",       description: "Impulsionou o servidor no Discord.",              icon: "🚀", color: "#22d3ee", category: "social",      acquirable: true  },
  { key: "staff",        name: "Staff",         description: "Membro da equipe oficial.",                       icon: "🛡️", color: "#ef4444", category: "staff",       acquirable: false },
  { key: "partner",      name: "Partner",       description: "Parceiro oficial da plataforma.",                  icon: "🤝", color: "#14b8a6", category: "staff",       acquirable: false },
  { key: "trending",     name: "Trending",      description: "Perfil em alta esta semana.",                     icon: "📈", color: "#f97316", category: "achievement", acquirable: false },
  { key: "popular",      name: "Popular",       description: "Mais de 1.000 visitas no perfil.",                icon: "⭐", color: "#eab308", category: "achievement", acquirable: false },
  { key: "famous",       name: "Famous",        description: "Mais de 10.000 visitas no perfil.",               icon: "🌟", color: "#fbbf24", category: "achievement", acquirable: false },
  { key: "inviter",      name: "Inviter",       description: "Convidou 10 ou mais usuários.",                   icon: "📨", color: "#8b5cf6", category: "social",      acquirable: false },
  { key: "active",       name: "Active",        description: "Usuário muito ativo na plataforma.",              icon: "⚡", color: "#06b6d4", category: "achievement", acquirable: false },
  { key: "gambler",      name: "Gambler",       description: "Venceu no cassino 5 vezes.",                      icon: "🎰", color: "#dc2626", category: "achievement", acquirable: false },
  { key: "event_winner", name: "Event Winner",  description: "Vencedor de um evento oficial.",                  icon: "🏆", color: "#d97706", category: "event",       acquirable: false },
  { key: "innovator",    name: "Innovator",     description: "Sugeriu uma feature que foi implementada.",        icon: "💡", color: "#84cc16", category: "achievement", acquirable: false },
  { key: "featured",     name: "Featured",      description: "Perfil destaque na página inicial.",              icon: "✨", color: "#f472b6", category: "achievement", acquirable: false },
  { key: "custom",       name: "Custom",        description: "Badge exclusiva personalizada.",                  icon: "🎨", color: "#6366f1", category: "premium",     acquirable: false },
];

const CATEGORY_LABELS: Record<Badge["category"], string> = {
  achievement: "Conquista",
  staff:       "Staff",
  premium:     "Premium",
  event:       "Evento",
  social:      "Social",
};

const CATEGORY_COLOR: Record<Badge["category"], string> = {
  achievement: "#f59e0b",
  staff:       "#ef4444",
  premium:     "#a855f7",
  event:       "#d97706",
  social:      "#22d3ee",
};

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: ok ? "#22c55e" : "#ef4444",
      color: "#fff", borderRadius: 10, padding: "10px 18px",
      fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      animation: "slideUp 0.2s ease",
    }}>
      {msg}
    </div>
  );
}

// ── Badge Card (Owned) ────────────────────────────────────────────────────────

function OwnedBadgeCard({ ub, onRemove }: { ub: UserBadge; onRemove: (id: string) => void }) {
  const b = ub.badge;
  const date = new Date(ub.acquired_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{
      background: "#18181f", border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 16,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${b.color}44`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* Icon bubble */}
      <div style={{
        width: 52, height: 52, borderRadius: 13, flexShrink: 0,
        background: `${b.color}18`, border: `1.5px solid ${b.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
      }}>
        {b.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{b.name}</span>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            padding: "2px 7px", borderRadius: 20,
            background: `${CATEGORY_COLOR[b.category]}22`, color: CATEGORY_COLOR[b.category],
          }}>
            {CATEGORY_LABELS[b.category]}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
          {b.description}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
          Adquirido em {date}
        </p>
      </div>

      {/* Remove (staff only or own acquirable) */}
      {b.acquirable && (
        <button
          onClick={() => onRemove(ub.id)}
          title="Remover badge"
          style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            fontSize: "0.78rem", color: "#f87171", fontWeight: 600, flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
        >
          Remover
        </button>
      )}
    </div>
  );
}

// ── Badge Card (Other / catalogue) ───────────────────────────────────────────

function CatalogueBadgeCard({
  badge, owned, onClaim,
}: {
  badge: Badge;
  owned: boolean;
  onClaim: (badge: Badge) => void;
}) {
  return (
    <div style={{
      background: "#18181f", border: `1px solid ${owned ? `${badge.color}44` : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 16,
      transition: "border-color 0.2s", opacity: owned ? 0.7 : 1,
    }}
      onMouseEnter={e => { if (!owned) e.currentTarget.style.borderColor = `${badge.color}44`; }}
      onMouseLeave={e => { if (!owned) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      {/* Icon bubble */}
      <div style={{
        width: 52, height: 52, borderRadius: 13, flexShrink: 0,
        background: `${badge.color}18`, border: `1.5px solid ${badge.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        filter: owned ? "grayscale(0)" : undefined,
      }}>
        {badge.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{badge.name}</span>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            padding: "2px 7px", borderRadius: 20,
            background: `${CATEGORY_COLOR[badge.category]}22`, color: CATEGORY_COLOR[badge.category],
          }}>
            {CATEGORY_LABELS[badge.category]}
          </span>
          {!badge.acquirable && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "2px 7px", borderRadius: 20,
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)",
            }}>
              Não adquirível
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
          {badge.description}
        </p>
      </div>

      {/* Action */}
      {owned ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: "0.8rem", color: badge.color, fontWeight: 600, flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Obtido
        </div>
      ) : badge.acquirable ? (
        <button
          onClick={() => onClaim(badge)}
          style={{
            background: `${badge.color}22`, border: `1px solid ${badge.color}55`,
            borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            fontSize: "0.8rem", color: badge.color, fontWeight: 700, flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${badge.color}33`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${badge.color}22`)}
        >
          Obter
        </button>
      ) : (
        <div style={{
          fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontWeight: 500, flexShrink: 0,
        }}>
          Restrito
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyOwned() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏅</div>
      <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
        Nenhum badge ainda
      </p>
      <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.25)" }}>
        Explore a aba "Outros" para descobrir os disponíveis.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BadgesPage() {
  const [tab, setTab] = useState<Tab>("owned");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [owned, setOwned] = useState<UserBadge[]>([]);
  const [catalogue, setCatalogue] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterCat, setFilterCat] = useState<Badge["category"] | "all">("all");

  const showToast = (msg: string, ok = true) => setToast({ msg, ok });

  // Load profile + badges
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;
      setProfileId(String(profile.id));

      // Load all badges from DB (catalogue)
      const { data: allBadges } = await supabase
        .from("badges")
        .select("*")
        .order("name");

      if (allBadges && allBadges.length > 0) {
        setCatalogue(allBadges as Badge[]);
      } else {
        // Fallback to local catalogue if table not seeded yet
        setCatalogue(BADGE_CATALOGUE.map((b, i) => ({ ...b, id: String(i + 1) })));
      }

      // Load user badges
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge_id,
          acquired_at,
          badge:badges(id, key, name, description, icon, color, category, acquirable)
        `)
        .eq("profile_id", profile.id)
        .order("acquired_at", { ascending: false });

      if (userBadges) {
        setOwned(userBadges as UserBadge[]);
      }

      setLoading(false);
    })();
  }, []);

  async function handleRemove(userBadgeId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_badges")
      .delete()
      .eq("id", userBadgeId);

    if (error) {
      showToast("Erro ao remover badge.", false);
      return;
    }
    setOwned(prev => prev.filter(ub => ub.id !== userBadgeId));
    showToast("Badge removido.");
  }

  async function handleClaim(badge: Badge) {
    if (!profileId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_badges")
      .insert({ profile_id: profileId, badge_id: badge.id })
      .select(`
        id,
        badge_id,
        acquired_at,
        badge:badges(id, key, name, description, icon, color, category, acquirable)
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        showToast("Você já possui este badge.", false);
      } else {
        showToast("Erro ao obter badge.", false);
      }
      return;
    }
    setOwned(prev => [data as UserBadge, ...prev]);
    showToast(`Badge "${badge.name}" obtido!`);
  }

  const ownedIds = new Set(owned.map(ub => ub.badge_id));

  const filteredCatalogue = filterCat === "all"
    ? catalogue
    : catalogue.filter(b => b.category === filterCat);

  const categories: (Badge["category"] | "all")[] = ["all", "achievement", "premium", "social", "staff", "event"];

  const card: React.CSSProperties = {
    background: "#111118", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "1.5rem",
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(124,92,252,0.3)", borderTopColor: "#7c5cfc", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 6rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Badges</h1>
      </div>

      {/* Card with tabs + content */}
      <div style={card}>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: "1.5rem",
          background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 11, padding: 4, width: "fit-content",
        }}>
          {([["owned", "Owned"], ["other", "Outros"]] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? "rgba(124,92,252,0.2)" : "transparent",
                border: tab === id ? "1px solid rgba(124,92,252,0.35)" : "1px solid transparent",
                borderRadius: 8, padding: "7px 20px",
                cursor: "pointer", fontSize: "0.875rem",
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? "#a78bfa" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s", fontFamily: "inherit",
              }}
            >
              {label}
              {id === "owned" && owned.length > 0 && (
                <span style={{
                  marginLeft: 7, fontSize: "0.72rem", fontWeight: 700,
                  background: "rgba(124,92,252,0.25)", color: "#a78bfa",
                  borderRadius: 20, padding: "1px 7px",
                }}>
                  {owned.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "owned" ? (
          /* ── Owned tab ── */
          owned.length === 0 ? (
            <EmptyOwned />
          ) : (
            <div className="db-grid-badges" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {owned.map(ub => (
                <OwnedBadgeCard key={ub.id} ub={ub} onRemove={handleRemove} />
              ))}
            </div>
          )
        ) : (
          /* ── Other tab ── */
          <>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  style={{
                    background: filterCat === cat ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.04)",
                    border: filterCat === cat ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20, padding: "5px 14px",
                    cursor: "pointer", fontSize: "0.78rem",
                    fontWeight: filterCat === cat ? 700 : 500,
                    color: filterCat === cat ? "#a78bfa" : "rgba(255,255,255,0.4)",
                    transition: "all 0.15s", fontFamily: "inherit",
                  }}
                >
                  {cat === "all" ? "Todos" : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="db-grid-badges" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {filteredCatalogue.map(badge => (
                <CatalogueBadgeCard
                  key={badge.id}
                  badge={badge}
                  owned={ownedIds.has(badge.id)}
                  onClaim={handleClaim}
                />
              ))}
            </div>

            {filteredCatalogue.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
                Nenhum badge nesta categoria.
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
