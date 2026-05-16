"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0 1.5rem",
        transition: "all 0.3s",
        background: scrolled
          ? "rgba(8,8,16,0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: "1.4rem",
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
        </Link>

        {/* Desktop links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {[
            { label: "Features",  href: "#features" },
            { label: "Premium",   href: "/premium" },
            { label: "Explore",   href: "#explore" },
            { label: "Ranking",   href: "/ranking" },
            { label: "Partner",   href: "/partner" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                color: "rgba(240,240,248,0.65)",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,240,248,0.65)")}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="nav-links" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              color: "rgba(240,240,248,0.7)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
            }}
          >
            Login
          </Link>
          <Link href="/register">
            <button className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--text)",
            cursor: "pointer",
            padding: 8,
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="8" x2="21" y2="8" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "rgba(8,8,16,0.98)",
            borderTop: "1px solid var(--border)",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {[
            { label: "Features", href: "#features" },
            { label: "Premium",  href: "/premium" },
            { label: "Explore",  href: "#explore" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link href="/login" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }} onClick={() => setMobileOpen(false)}>
            Login
          </Link>
          <Link href="/register" onClick={() => setMobileOpen(false)}>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Get Started Free
            </button>
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
