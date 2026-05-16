"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Period = "today" | "week" | "alltime";
type RankEntry = {
  id: number;
  username: string;
  avatar_url: string | null;
  view_count: number;
  is_premium: boolean;
};

const INITIAL_SHOW = 10;

function fmtViews(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1_000) return n.toLocaleString("pt-BR");
  return String(n);
}

function Avatar({ url, name, size = 72 }: { url: string | null; name: string; size?: number }) {
  const colors = ["#7c5cfc", "#f857a6", "#0ea5e9", "#10b981", "#f97316", "#8b5cf6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = colors[h % colors.length];
  if (url) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Podium card (top 3) ───────────────────────────────────────
function PodiumCard({ entry, rank, isCenter }: { entry: RankEntry; rank: number; isCenter: boolean }) {
  const gold   = { border: "rgba(255,200,50,0.35)",  glow: "rgba(255,180,0,0.18)",   badge: "#f5c842", icon: "👑", ring: "2px solid rgba(255,200,50,0.6)" };
  const silver = { border: "rgba(180,190,210,0.2)",  glow: "rgba(160,170,200,0.07)", badge: "#9ba8b8", icon: "🥈", ring: "none" };
  const bronze = { border: "rgba(180,120,60,0.2)",   glow: "rgba(180,120,60,0.07)",  badge: "#cd8b55", icon: "🥉", ring: "none" };
  const theme  = rank === 1 ? gold : rank === 2 ? silver : bronze;

  return (
    <Link
      href={`/${entry.username}`}
      style={{
        flex: isCenter ? "0 0 240px" : "0 0 200px",
        alignSelf: isCenter ? "flex-start" : "flex-start",
        marginTop: isCenter ? 0 : "2.5rem",
        background: "#111118",
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        padding: "1.5rem 1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.6rem",
        textDecoration: "none",
        position: "relative",
        boxShadow: isCenter ? `0 12px 60px ${theme.glow}, 0 0 0 1px ${theme.border}` : "none",
        transition: "transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Rank badge */}
      <div style={{
        position: "absolute", top: 12, left: 12,
        width: 28, height: 28, borderRadius: "50%",
        background: theme.badge, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.72rem", fontWeight: 900, color: rank === 1 ? "#3d2800" : "#fff",
      }}>
        {rank}
      </div>

      {/* Medal icon */}
      <div style={{ fontSize: isCenter ? "1.8rem" : "1.4rem", lineHeight: 1, marginTop: "0.25rem" }}>
        {theme.icon}
      </div>

      {/* Avatar */}
      <div style={{ borderRadius: "50%", padding: rank === 1 ? 3 : 0, background: rank === 1 ? "linear-gradient(135deg,#f5c842,#f89820)" : "transparent" }}>
        <Avatar url={entry.avatar_url} name={entry.username} size={isCenter ? 80 : 64} />
      </div>

      {/* Name */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: isCenter ? "1rem" : "0.88rem", fontWeight: 700, color: "#fff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.username}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>@{entry.username}</p>
      </div>

      {/* Views badge */}
      <div style={{
        marginTop: "0.25rem",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 999, padding: "0.3rem 0.85rem",
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "0.78rem", color: rank === 1 ? "#f5c842" : "rgba(255,255,255,0.55)",
        fontWeight: 700,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        {fmtViews(entry.view_count)}
        <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>total</span>
      </div>

      {/* Bottom glow for #1 */}
      {isCenter && (
        <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 40, background: "radial-gradient(ellipse at center, rgba(245,200,66,0.25) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(8px)" }} />
      )}
    </Link>
  );
}

// ── List row (rank 4+) ────────────────────────────────────────
function ListRow({ entry, rank }: { entry: RankEntry; rank: number }) {
  return (
    <Link
      href={`/${entry.username}`}
      style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "0.85rem 1.25rem", borderRadius: 12,
        background: "#111118", border: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none", transition: "border-color 0.15s, background 0.15s",
        marginBottom: "0.5rem",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.3)"; e.currentTarget.style.background = "rgba(124,92,252,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#111118"; }}
    >
      <span style={{ width: 28, fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.3)", textAlign: "center", flexShrink: 0 }}>
        {rank}
      </span>
      <Avatar url={entry.avatar_url} name={entry.username} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.username}
          {entry.is_premium && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 5, verticalAlign: "middle" }}>
              <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#rbg)" />
              <defs><linearGradient id="rbg" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" /></linearGradient></defs>
            </svg>
          )}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>@{entry.username}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{fmtViews(entry.view_count)}</span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>total</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} style={{ marginLeft: 4 }}><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", borderRadius: 12, background: "#111118", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.5rem" }}>
      <div style={{ width: 28, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ width: "40%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ width: "25%", height: 11, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ width: 60, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function RankingPage() {
  const [period, setPeriod] = useState<Period>("alltime");
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const periodLabel: Record<Period, string> = {
    today:   "Hoje",
    week:    "Esta semana",
    alltime: "Desde sempre",
  };

  useEffect(() => {
    setLoading(true);
    setShowAll(false);
    const supabase = createClient();

    async function load() {
      if (period === "alltime") {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, view_count, is_premium")
          .order("view_count", { ascending: false })
          .limit(50);
        setEntries((data ?? []) as RankEntry[]);
        setLoading(false);
        return;
      }

      // Date filter for today / week
      const from = new Date();
      if (period === "today") {
        from.setHours(0, 0, 0, 0);
      } else {
        const day = from.getDay();
        from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
        from.setHours(0, 0, 0, 0);
      }

      const { data: viewData } = await supabase
        .from("profile_views")
        .select("profile_id")
        .gte("viewed_at", from.toISOString());

      if (!viewData || viewData.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const counts: Record<number, number> = {};
      for (const row of viewData) counts[row.profile_id] = (counts[row.profile_id] ?? 0) + 1;

      const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([id]) => Number(id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_premium")
        .in("id", topIds);

      const merged: RankEntry[] = topIds
        .map((id) => {
          const p = profiles?.find((x) => x.id === id);
          if (!p) return null;
          return { ...p, view_count: counts[id] } as RankEntry;
        })
        .filter(Boolean) as RankEntry[];

      setEntries(merged);
      setLoading(false);
    }

    load();
  }, [period]);

  const top3   = entries.slice(0, 3);
  const rest   = entries.slice(3);
  const visible = showAll ? rest : rest.slice(0, INITIAL_SHOW);

  const FILTERS: { id: Period; label: string; icon: string }[] = [
    { id: "today",   label: "Hoje",    icon: "🕐" },
    { id: "week",    label: "Semana",  icon: "📅" },
    { id: "alltime", label: "All Time", icon: "🏆" },
  ];

  return (
    <div style={{ background: "#09090f", minHeight: "100vh", color: "#fff", fontFamily: "inherit" }}>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", position: "sticky", top: 0, background: "rgba(9,9,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#nlg2)" />
            <path d="M10 16a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="3" fill="#fff" />
            <defs><linearGradient id="nlg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#f857a6" /></linearGradient></defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#fff" }}>grief.cc</span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.83rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}>Entrar</Link>
          <Link href="/register" style={{ padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.83rem", fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#7c5cfc,#f857a6)" }}>Criar conta</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "4rem 1rem 2rem", position: "relative" }}>
        {/* Subtle vertical line accent */}
        <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: 80, background: "linear-gradient(to bottom, transparent, rgba(124,92,252,0.4), transparent)", transform: "translateX(-50%)" }} />

        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "#7c5cfc", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Ranking
        </p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Perfis mais{" "}
          <span style={{ background: "linear-gradient(135deg, #f5c842, #f89820, #f857a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            famosos
          </span>
        </h1>
        <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.35)" }}>
          {periodLabel[period]}
        </p>

        {/* Filter pills */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: 4, gap: 3 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setPeriod(f.id)}
              style={{
                padding: "0.45rem 1.25rem", borderRadius: 999, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.83rem", fontWeight: 600, transition: "all 0.2s",
                background: period === f.id ? "linear-gradient(135deg,#7c5cfc,#a855f7)" : "transparent",
                color: period === f.id ? "#fff" : "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.25rem 6rem" }}>

        {/* ── Podium top 3 ── */}
        {loading ? (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", alignItems: "flex-start", marginBottom: "3rem" }}>
            {[200, 240, 200].map((w, i) => (
              <div key={i} style={{ flex: `0 0 ${w}px`, height: i === 1 ? 280 : 240, background: "#111118", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, marginTop: i === 1 ? 0 : "2.5rem" }} />
            ))}
          </div>
        ) : top3.length > 0 ? (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", alignItems: "flex-start", marginBottom: "3rem", flexWrap: "wrap" }}>
            {/* Order: 2, 1, 3 */}
            {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
              if (!entry) return null;
              const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
              return <PodiumCard key={entry.id} entry={entry} rank={rank} isCenter={rank === 1} />;
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "rgba(255,255,255,0.25)", marginBottom: "2rem" }}>
            Nenhum dado para este período ainda.
          </div>
        )}

        {/* ── Rest of ranking ── */}
        {(rest.length > 0 || loading) && (
          <>
            <p style={{ margin: "0 0 1rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center" }}>
              Restante do ranking
            </p>
            <div>
              {loading
                ? Array.from({ length: INITIAL_SHOW }).map((_, i) => <SkeletonRow key={i} />)
                : visible.map((entry, idx) => (
                    <ListRow key={entry.id} entry={entry} rank={idx + 4} />
                  ))
              }
            </div>

            {!loading && rest.length > INITIAL_SHOW && (
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "0.65rem 2rem", color: "rgba(255,255,255,0.6)",
                    fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  {showAll ? "▲ Mostrar menos" : `Ver todos os ${entries.length} perfis ↓`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "3rem 1.5rem", textAlign: "center" }}>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", color: "rgba(255,255,255,0.4)" }}>
          Ainda não tem seu perfil?
        </p>
        <Link
          href="/register"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.85rem 2rem", borderRadius: 999, fontFamily: "inherit",
            fontSize: "0.95rem", fontWeight: 800, textDecoration: "none", color: "#fff",
            background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
            boxShadow: "0 4px 24px rgba(124,92,252,0.3)",
          }}
        >
          Criar minha página grátis →
        </Link>
      </footer>
    </div>
  );
}
