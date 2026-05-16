"use client";
import { useState } from "react";

const FREE_FEATURES = [
  "Custom username & URL",
  "Unlimited links",
  "Theme colors & fonts",
  "Interactive widgets",
  "Layout customization",
  "Avatar & decorations",
  "Basic animations",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Background video & audio",
  "Audio visualizer",
  "25 text animations",
  "10 background effects",
  "29 premium fonts",
  "10 cursor effects",
  "Custom cursor upload",
  "Premium badge & priority support",
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={`${color}20`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pricing() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section
      id="premium"
      style={{
        padding: "6rem 1.5rem",
        maxWidth: 1000,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Orb */}
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          background: "rgba(248,87,166,0.08)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: -1,
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(248,87,166,0.12)",
            border: "1px solid rgba(248,87,166,0.25)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#f896c8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1.25rem",
          }}
        >
          Pricing
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
          <span className="glow-text">Simple pricing.</span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #f857a6, #7c5cfc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Big results.
          </span>
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
          Start free, upgrade when you're ready. No subscriptions. Ever.
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Free */}
        <div
          className="glass-card"
          style={{
            borderRadius: 24,
            padding: "2.5rem",
            transition: "border-color 0.3s, transform 0.3s",
            borderColor: hovered === "free" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
            transform: hovered === "free" ? "translateY(-4px)" : "none",
          }}
          onMouseEnter={() => setHovered("free")}
          onMouseLeave={() => setHovered(null)}
        >
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.75rem" }}>
              Free
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.04em" }}>$0</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>/forever</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.75rem 0 0" }}>
              Everything you need to build a stunning page.
            </p>
          </div>

          <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: "2rem" }}>
            Get Started Free
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {FREE_FEATURES.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon color="#7c5cfc" />
                <span style={{ fontSize: "0.9rem", color: "rgba(240,240,248,0.8)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium */}
        <div
          style={{
            borderRadius: 24,
            padding: "2.5rem",
            background: "rgba(124,92,252,0.08)",
            border: "1px solid rgba(124,92,252,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "border-color 0.3s, transform 0.3s",
            borderColor: hovered === "premium" ? "rgba(124,92,252,0.8)" : "rgba(124,92,252,0.45)",
            transform: hovered === "premium" ? "translateY(-4px)" : "none",
            backdropFilter: "blur(12px)",
          }}
          onMouseEnter={() => setHovered("premium")}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Top glow line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, #7c5cfc, #f857a6)",
            }}
          />

          {/* Popular badge */}
          <div
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              background: "linear-gradient(135deg, #7c5cfc, #f857a6)",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Most Popular
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9d7dfc", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.75rem" }}>
              Premium
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.04em" }}>$8</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>/lifetime</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.75rem 0 0" }}>
              Make your page truly unforgettable.
            </p>
          </div>

          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: "2rem" }}>
            Upgrade Now ✦
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {PREMIUM_FEATURES.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon color="#f857a6" />
                <span style={{ fontSize: "0.9rem", color: "rgba(240,240,248,0.85)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Casino note */}
      <div
        style={{
          textAlign: "center",
          marginTop: "2.5rem",
          padding: "1.25rem 2rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
          🎰 <strong style={{ color: "var(--text)" }}>Don't want to pay?</strong> Earn coins in our digital casino and unlock premium features completely free.
        </p>
      </div>
    </section>
  );
}
