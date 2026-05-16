"use client";

const SAMPLE_LINKS = [
  { label: "YouTube Channel", icon: "▶", color: "#ef4444" },
  { label: "Instagram", icon: "◉", color: "#ec4899" },
  { label: "My Store", icon: "◈", color: "#f97316" },
  { label: "Portfolio", icon: "◆", color: "#7c5cfc" },
];

const PROFILE_DEMOS = [
  {
    name: "Nova ✦",
    handle: "nova",
    bio: "musician • producer • dreamer",
    accent: "#7c5cfc",
    bg: "linear-gradient(135deg, #1a1028 0%, #0d0a1a 100%)",
    avatar: "N",
  },
  {
    name: "Celestia ☽",
    handle: "celestia",
    bio: "content creator • 2.1M followers",
    accent: "#f857a6",
    bg: "linear-gradient(135deg, #1a0d16 0%, #100812 100%)",
    avatar: "C",
  },
  {
    name: "Atlas ⚡",
    handle: "atlas",
    bio: "dev • designer • builder",
    accent: "#0ea5e9",
    bg: "linear-gradient(135deg, #080f1a 0%, #050a12 100%)",
    avatar: "A",
  },
];

function MiniProfile({ profile }: { profile: typeof PROFILE_DEMOS[0] }) {
  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        background: profile.bg,
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        minWidth: 240,
        flex: "0 0 auto",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${profile.accent}30`,
          border: `2px solid ${profile.accent}60`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: 900,
          color: profile.accent,
        }}
      >
        {profile.avatar}
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "#fff" }}>{profile.name}</p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "0.75rem",
            fontFamily: "'Geist Mono', monospace",
            color: profile.accent,
          }}
        >
          grief.cc/{profile.handle}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
          {profile.bio}
        </p>
      </div>

      {/* Mini links */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        {SAMPLE_LINKS.slice(0, 3).map((link) => (
          <div
            key={link.label}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <span style={{ color: link.color, fontSize: "0.9rem" }}>{link.icon}</span>
            {link.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Explore() {
  return (
    <section
      id="explore"
      style={{
        padding: "4rem 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "0 1.5rem", marginBottom: "3rem" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(14,165,233,0.12)",
            border: "1px solid rgba(14,165,233,0.25)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#38bdf8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1.25rem",
          }}
        >
          Live Examples
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            margin: "0 0 1rem",
          }}
        >
          <span className="glow-text">See it in action.</span>
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 400, margin: "0 auto" }}>
          Real pages built by real creators. Yours could be next.
        </p>
      </div>

      {/* Horizontal scroll profiles */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          padding: "0 max(1.5rem, calc((100vw - 1200px) / 2))",
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: "1rem",
        }}
      >
        {PROFILE_DEMOS.map((p) => (
          <MiniProfile key={p.handle} profile={p} />
        ))}

        {/* "Create yours" card */}
        <div
          style={{
            borderRadius: 24,
            border: "1px dashed rgba(124,92,252,0.4)",
            overflow: "hidden",
            background: "rgba(124,92,252,0.04)",
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            minWidth: 240,
            flex: "0 0 auto",
            cursor: "pointer",
            transition: "border-color 0.3s, background 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,92,252,0.7)";
            e.currentTarget.style.background = "rgba(124,92,252,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,92,252,0.4)";
            e.currentTarget.style.background = "rgba(124,92,252,0.04)";
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(124,92,252,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              color: "#7c5cfc",
            }}
          >
            +
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#9d7dfc" }}>Create yours</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Free forever
            </p>
          </div>
          <button className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
            Get Started →
          </button>
        </div>
      </div>
    </section>
  );
}
