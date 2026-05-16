"use client";
import { useState } from "react";

export default function Footer() {
  const [username, setUsername] = useState("");

  return (
    <>
      {/* CTA Section */}
      <section
        style={{
          padding: "6rem 1.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          className="orb"
          style={{
            width: 700,
            height: 400,
            background: "rgba(124,92,252,0.15)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: "0 0 1.5rem",
            }}
          >
            <span className="glow-text">Ready to claim</span>
            <br />
            <span className="gradient-text">your link?</span>
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.1rem",
              marginBottom: "2.5rem",
              maxWidth: 440,
              margin: "0 auto 2.5rem",
              lineHeight: 1.6,
            }}
          >
            Join 98,000+ creators. Set up in minutes. Free forever.
          </p>

          <div
            style={{
              maxWidth: 480,
              margin: "0 auto",
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
              />
              <button className="btn-primary" style={{ padding: "0.65rem 1.4rem", flexShrink: 0 }}>
                Claim Free →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "2.5rem 1.5rem",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {/* Logo */}
          <span
            style={{
              fontSize: "1.3rem",
              fontWeight: 900,
              background: "linear-gradient(135deg, #7c5cfc, #f857a6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            grief
          </span>

          {/* Links */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {["Features", "Premium", "Privacy", "Terms", "Discord"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(240,240,248,0.3)" }}>
            © 2026 grief. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
