"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "What is linkr?",
    a: "linkr is a powerful link-in-bio platform that lets you create a fully customizable page to showcase your links, social profiles, content, and personality — all in one place.",
  },
  {
    q: "Is it really free?",
    a: "Absolutely. linkr's free plan is genuinely powerful with unlimited links, full customization, widgets, and analytics. Premium adds exclusive visual effects for those who want to go further.",
  },
  {
    q: "How is linkr different from other platforms?",
    a: "We obsess over customization and community. Every feature is built based on user feedback. Plus, we have a digital casino where you can earn premium features without spending a dime.",
  },
  {
    q: "How long does setup take?",
    a: "Less than 5 minutes. Claim your URL, pick a style, add your links — you're live. No tutorials, no friction.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes! Premium users can connect a custom domain so your bio link matches your brand perfectly.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ padding: "6rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            margin: "0 0 1rem",
          }}
        >
          <span className="glow-text">Got questions?</span>
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          We've got answers. And if we don't, hit us up on Discord.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="glass-card"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                transition: "border-color 0.3s",
                borderColor: isOpen ? "rgba(124,92,252,0.35)" : "rgba(255,255,255,0.08)",
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 16,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                  {faq.q}
                </span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isOpen ? "rgba(124,92,252,0.25)" : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "transform 0.3s, background 0.3s",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    fontSize: "1.1rem",
                    color: isOpen ? "#9d7dfc" : "var(--text-muted)",
                  }}
                >
                  +
                </span>
              </button>

              <div
                style={{
                  maxHeight: isOpen ? 200 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.35s ease",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    padding: "0 1.5rem 1.25rem",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
