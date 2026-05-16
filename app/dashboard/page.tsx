"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { username: string; uid: number; view_count: number; views_today: number; views_week: number; daily_views: number[] };

const BADGES = Array(10).fill(null);

const WALLET_GAMES = [
  { label: "Daily Reward",         pct: "0.0%", diff: "+0", color: "#7c5cfc" },
  { label: "Dice Roll",            pct: "0.0%", diff: "+0", color: "#0ea5e9" },
  { label: "Spin the Wheel",       pct: "0.0%", diff: "+0", color: "#f59e0b" },
  { label: "Slot Machine",         pct: "0.0%", diff: "+0", color: "#10b981" },
  { label: "Rock Paper Scissors",  pct: "0.0%", diff: "+0", color: "#ef4444" },
  { label: "Range Roulette",       pct: "0.0%", diff: "+0", color: "#8b5cf6" },
];

// Generate last-30-days labels
function getLast30Days() {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return days;
}

function VisitorChart({ values }: { values: number[] }) {
  const days = getLast30Days();
  const W = 660, H = 100, PAD = 10;
  const maxV = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v / maxV) * (H - PAD * 2));
    return `${x},${y}`;
  });
  const tickEvery = 2;
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total > 0 ? (total / 30).toFixed(1) : "0";

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H + 20} style={{ display: "block" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${PAD},${H - PAD} ${pts.join(" ")} ${W - PAD},${H - PAD}`}
          fill="url(#chartGrad)"
        />
        <polyline points={pts.join(" ")} fill="none" stroke="#7c5cfc" strokeWidth="1.5" />
        {days.map((label, i) => {
          if (i % tickEvery !== 0) return null;
          const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
          return (
            <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">
              {label}
            </text>
          );
        })}
      </svg>
      <div style={{ marginTop: 8, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
        <span>Visitors last 30 days: <strong style={{ color: "#fff" }}>{total.toLocaleString("pt-BR")}</strong></span>
        <span style={{ color: "#7c5cfc" }}>↗</span>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>Daily average: {avg} visitors/day</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [giveawayTab, setGiveawayTab] = useState<"active" | "winners">("active");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badgeScroll, setBadgeScroll] = useState(0);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, username, view_count")
        .eq("user_id", user.id)
        .single();

      let profileRow = data;
      if (!profileRow) {
        const meta = user.user_metadata;
        const username = meta?.username ?? meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "user";
        const { data: inserted } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, username })
          .select("id, username, view_count")
          .single();
        profileRow = inserted;
      }
      if (!profileRow) return;

      // Fetch last 30 days of views for the chart
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const { data: viewRows } = await supabase
        .from("profile_views")
        .select("viewed_at")
        .eq("profile_id", profileRow.id)
        .gte("viewed_at", since.toISOString());

      // Bucket into 30 daily slots
      const daily = Array(30).fill(0);
      const nowMs = Date.now();
      for (const row of viewRows ?? []) {
        const diffDays = Math.floor((nowMs - new Date(row.viewed_at).getTime()) / 86400000);
        const idx = 29 - Math.min(diffDays, 29);
        daily[idx]++;
      }

      // Today and this week
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0);
      let views_today = 0, views_week = 0;
      for (const row of viewRows ?? []) {
        const d = new Date(row.viewed_at);
        if (d >= todayStart) views_today++;
        if (d >= weekStart)  views_week++;
      }

      setProfile({
        username: profileRow.username,
        uid: profileRow.id,
        view_count: profileRow.view_count ?? 0,
        views_today,
        views_week,
        daily_views: daily,
      });
    })();
  }, []);

  function scrollBadges(dir: -1 | 1) {
    if (!badgeRef.current) return;
    badgeRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    setBadgeScroll((p) => p + dir);
  }

  const C = { card: "#16161e", border: "rgba(255,255,255,0.07)", muted: "rgba(255,255,255,0.4)" };

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 3rem", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <GridIcon />
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Overview</h1>
      </div>

      {/* Top stat cards */}
      <div className="db-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <StatCard icon={<EyeIcon />}  label="Profile Views" value={profile ? profile.view_count.toLocaleString("pt-BR") : "—"} />
        <StatCard icon={<HashIcon />} label="User ID"       value={profile ? String(profile.uid) : "—"} />
        <StatCard icon={<UserIcon />} label="Username"      value={profile ? profile.username : "—"} />
      </div>

      {/* Row 2: Badges + Discord */}
      <div className="db-grid-badges" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {/* Badges */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem" }}>
            <span style={{ color: "#7c5cfc" }}><StarIcon /></span>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Limited Badges</span>
          </div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: C.muted }}>
            You&apos;ve claimed all available limited badges.{" "}
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Check back later for more!</span>
          </p>
          {/* Carousel */}
          <div style={{ position: "relative" }}>
            <button onClick={() => scrollBadges(-1)} style={arrowBtn("left")}>‹</button>
            <div
              ref={badgeRef}
              style={{ display: "flex", gap: 8, overflowX: "hidden", scrollbarWidth: "none", padding: "2px 0" }}
            >
              {BADGES.map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "1rem", opacity: 0.3 }}>?</span>
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)" }}>???</span>
                </div>
              ))}
            </div>
            <button onClick={() => scrollBadges(1)} style={arrowBtn("right")}>›</button>
          </div>
          {/* Progress */}
          <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.07)" }}>
              <div style={{ width: "0%", height: "100%", background: "linear-gradient(90deg,#7c5cfc,#f857a6)", borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: "0.72rem", color: C.muted, whiteSpace: "nowrap" }}>0 / 10 badges</span>
          </div>
        </Card>

        {/* Discord + Casino */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Card style={{ padding: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <DiscordIcon size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>Join our Discord</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>discord.gg/4Hh5gAmXBp</p>
              </div>
            </div>
            <Btn color="#5865F2" icon={<DiscordIcon size={14} />}>Connected to Discord</Btn>
            <div style={{ marginTop: "0.5rem" }}>
              <Btn color="#d97706" icon={<span>🎰</span>}>Go to Casino</Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Giveaways + Game stats */}
      <div className="db-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 390px", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {/* Giveaways */}
        <Card style={{ minHeight: 200 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#7c5cfc" }}><GiftIcon /></span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Giveaways</span>
            </div>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: 3, gap: 2 }}>
              {(["active", "winners"] as const).map((tab) => (
                <button key={tab} onClick={() => setGiveawayTab(tab)} style={{ background: giveawayTab === tab ? "rgba(255,255,255,0.1)" : "transparent", border: "none", borderRadius: 5, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", color: giveawayTab === tab ? "#fff" : C.muted, fontFamily: "inherit", textTransform: "capitalize" }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: C.muted }}>
            No {giveawayTab === "active" ? "active giveaways" : "winners"} yet.{" "}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Please check back later.</span>
          </p>
        </Card>

        {/* Game stats column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="db-grid-game" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Total Rounds",   value: "0",    icon: <ControllerIcon /> },
              { label: "Current Streak", value: "0",    icon: <FireIcon /> },
              { label: "Win Rate",       value: "0.0%", icon: <TrophyIcon /> },
              { label: "Total Winnings", value: "0",    icon: <CoinsIcon /> },
            ].map((s) => (
              <Card key={s.label} style={{ padding: "0.8rem 0.9rem" }}>
                <span style={{ color: C.muted, display: "flex", marginBottom: 6 }}>{s.icon}</span>
                <p style={{ margin: "0 0 2px", fontSize: "1.15rem", fontWeight: 700, color: "#fff" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Wallet */}
          <Card style={{ padding: "0.8rem 0.9rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Wallet Overview</p>
            <p style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>₣0</p>
            <p style={{ margin: "0 0 8px", fontSize: "0.72rem" }}>
              <span style={{ color: "#10b981" }}>● Biggest Win: 0</span>{" "}
              <span style={{ color: "#ef4444" }}>● Biggest Loss: -0</span>
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8, display: "flex", flexWrap: "wrap", gap: "3px 12px" }}>
              {WALLET_GAMES.map((g) => (
                <span key={g.label} style={{ fontSize: "0.7rem", color: C.muted, display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: g.color }}>●</span>
                  {g.label} {g.pct} <span style={{ color: "rgba(255,255,255,0.2)" }}>{g.diff}</span>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 4: Profile Visitors + Top 5 Links */}
      <div className="db-grid-right" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#7c5cfc" }}><EyeIcon /></span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Profile Visitors</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "3px 10px", fontSize: "0.78rem", color: C.muted, cursor: "pointer" }}>
              Last 30 Days <ChevronIcon />
            </div>
          </div>
          <VisitorChart values={profile?.daily_views ?? Array(30).fill(0)} />
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <span style={{ color: "#7c5cfc" }}><LinkIcon /></span>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Top 5 Links</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: C.muted }}>No link data yet.</p>
        </Card>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function arrowBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: -6,
    width: 24, height: 24, borderRadius: "50%",
    background: "rgba(124,92,252,0.85)", border: "none",
    color: "#fff", fontSize: "1rem", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1, padding: 0, lineHeight: 1,
  };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "1rem 1.1rem", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 14, padding: "0.85rem 1.1rem" }}>
      <span style={{ color: "rgba(255,255,255,0.35)", display: "flex" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{value}</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.38)" }}>{label}</p>
      </div>
    </Card>
  );
}

function Btn({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  return (
    <button style={{ width: "100%", background: color, color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem", fontSize: "0.83rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit", transition: "opacity 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {icon}{children}
    </button>
  );
}

/* ── Icons ───────────────────────────────────────────────── */
function GridIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function EyeIcon()        { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function HashIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>; }
function UserIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function StarIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>; }
function GiftIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>; }
function ControllerIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="17" cy="10" r="1" fill="currentColor"/><path d="M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/></svg>; }
function FireIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>; }
function TrophyIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>; }
function CoinsIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>; }
function DiscordIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>; }
function ChevronIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>; }
function LinkIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
