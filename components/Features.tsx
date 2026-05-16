"use client";

const FEATURES = [
  {
    icon: "🎨",
    title: "Customize Without Limits",
    description:
      "Fonts, colors, layouts, animations — make your page undeniably yours. Hundreds of combinations, zero design skills needed.",
    tag: "Design",
    color: "#7c5cfc",
  },
  {
    icon: "🎵",
    title: "Music Player",
    description:
      "Embed your favorite tracks directly on your page. Let your vibe speak before you do.",
    tag: "Media",
    color: "#f857a6",
  },
  {
    icon: "🔗",
    title: "Unlimited Links",
    description:
      "Connect every corner of your digital world. Social profiles, stores, portfolios — all in one place.",
    tag: "Links",
    color: "#0ea5e9",
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description:
      "Know exactly who's visiting, where they're from, and what they're clicking. Data that actually makes sense.",
    tag: "Analytics",
    color: "#10b981",
  },
  {
    icon: "⚡",
    title: "Instant Setup",
    description:
      "From zero to live in under 5 minutes. Claim your URL, customize, and share — it's really that fast.",
    tag: "Speed",
    color: "#f97316",
  },
  {
    icon: "🏆",
    title: "Earn & Unlock",
    description:
      "Play our digital casino to earn coins and unlock premium features — completely free. Skill > wallet.",
    tag: "Rewards",
    color: "#ec4899",
  },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: "6rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(124,92,252,0.12)",
            border: "1px solid rgba(124,92,252,0.25)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#9d7dfc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1.25rem",
          }}
        >
          Features
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
          }}
        >
          <span className="glow-text">Everything you need,</span>
          <br />
          <span className="gradient-text">nothing you don't.</span>
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>
          Powerful tools wrapped in a beautiful interface. Build the page you've always imagined.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {FEATURES.map((feat, i) => (
          <div
            key={feat.title}
            className="glass-card feature-card"
            style={{
              borderRadius: 20,
              padding: "2rem",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${feat.color}40, transparent)`,
              }}
            />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${feat.color}18`,
                  border: `1px solid ${feat.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                }}
              >
                {feat.icon}
              </div>

              {/* Tag */}
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: feat.color,
                  background: `${feat.color}15`,
                  border: `1px solid ${feat.color}25`,
                  borderRadius: 999,
                  padding: "3px 10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {feat.tag}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                margin: "0 0 0.6rem",
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              {feat.title}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
