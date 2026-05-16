"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AVATARS = [
  { name: "Kai", color: "#7c5cfc", letter: "K" },
  { name: "Luna", color: "#f857a6", letter: "L" },
  { name: "Zed", color: "#0ea5e9", letter: "Z" },
  { name: "Nova", color: "#10b981", letter: "N" },
];

const STATS = [
  { label: "Active Users", value: 98000, suffix: "k" },
  { label: "Links Created", value: 2400000, suffix: "M" },
  { label: "Profile Views", value: 51000000, suffix: "M" },
];

function formatStat(value: number, suffix: string) {
  if (suffix === "k") return `${Math.round(value / 1000)}k`;
  if (suffix === "M") return `${(value / 1000000).toFixed(1)}M`;
  return value.toString();
}

export default function Hero() {
  const [username, setUsername] = useState("");
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0]);
  const router = useRouter();

  function handleClaim() {
    const slug = username.trim().replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    router.push(slug ? `/register?username=${encodeURIComponent(slug)}` : "/register");
  }

  useEffect(() => {
    const timers = STATS.map((stat, i) =>
      setTimeout(() => {
        let start = 0;
        const end = stat.value;
        const duration = 1800;
        const step = end / (duration / 16);
        const interval = setInterval(() => {
          start = Math.min(start + step, end);
          setAnimatedStats((prev) => {
            const next = [...prev];
            next[i] = Math.round(start);
            return next;
          });
          if (start >= end) clearInterval(interval);
        }, 16);
      }, i * 200)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "8rem 1.5rem 4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Orbs */}
      <div
        className="orb"
        style={{
          width: 600,
          height: 600,
          background: "rgba(124,92,252,0.18)",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background: "rgba(248,87,166,0.12)",
          top: 200,
          right: -100,
        }}
      />
      <div
        className="orb"
        style={{
          width: 300,
          height: 300,
          background: "rgba(14,165,233,0.1)",
          bottom: 0,
          left: -50,
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(124,92,252,0.12)",
          border: "1px solid rgba(124,92,252,0.3)",
          borderRadius: 999,
          padding: "6px 16px",
          marginBottom: "2rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#b39dfc",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#7c5cfc",
            display: "inline-block",
            position: "relative",
          }}
        >
          <span
            className="pulse-ring"
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: "1px solid #7c5cfc",
            }}
          />
        </span>
        In beta phase
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          maxWidth: 900,
          margin: "0 0 1.5rem",
        }}
      >
        <span className="glow-text">Your digital identity,</span>
        <br />
        <span className="gradient-text">simplified.</span>
      </h1>

      {/* Subheadline */}
      <p
        style={{
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          color: "var(--text-muted)",
          maxWidth: 560,
          lineHeight: 1.7,
          margin: "0 0 3rem",
          fontWeight: 400,
        }}
      >
        Create stunning bio links, showcase your content, and connect with your audience.
        One link to rule them all — beautifully.
      </p>

      {/* URL bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          marginBottom: "1.5rem",
        }}
      >
        <div className="url-bar">
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              fontFamily: "'Geist Mono', monospace",
              whiteSpace: "nowrap",
            }}
          >
            dwe.lol/
          </span>
          <input
            type="text"
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleClaim()}
          />
          <button
            className="btn-primary"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem", flexShrink: 0 }}
            onClick={handleClaim}
          >
            Claim →
          </button>
        </div>
      </div>

      {/* Social proof avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "4rem" }}>
        <div style={{ display: "flex" }}>
          {AVATARS.map((av, i) => (
            <div
              key={av.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: av.color,
                border: "2px solid var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
                marginLeft: i === 0 ? 0 : -10,
                position: "relative",
                zIndex: AVATARS.length - i,
              }}
            >
              {av.letter}
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Join <strong style={{ color: "var(--text)" }}>98,000+</strong> creators worldwide
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem",
          width: "100%",
          maxWidth: 600,
        }}
      >
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatStat(animatedStats[i], stat.suffix)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          opacity: 0.4,
        }}
      >
        <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Scroll
        </span>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M8 3v10M3 8l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
}
