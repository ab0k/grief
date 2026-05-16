"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Tag = { icon: string; label: string };

type ProfileData = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  avatar_shape: "square" | "soft" | "rounded" | "circle";
  background_color: string;
  background_url: string;
  background_type: string;
  banner_url: string;
  tags: Tag[];
  view_count: number;
  link_icon_color: string;
  link_bg_color: string;
};

type Link = { id: number; platform: string; label: string; url: string };

function encodeTag(t: Tag): string { return `${t.icon}:${t.label}`; }
function decodeTag(s: string): Tag {
  const i = s.indexOf(":");
  if (i === -1) return { icon: "hash", label: s };
  return { icon: s.slice(0, i), label: s.slice(i + 1) };
}

const ICON_SET: { key: string; name: string; path: string; fill?: boolean }[] = [
  { key: "hash",      name: "hash",      path: "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" },
  { key: "heart",     name: "heart",     path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
  { key: "star",      name: "star",      path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { key: "zap",       name: "lightning", path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { key: "fire",      name: "fire",      path: "M12 2c-2 4-4 6-4 10a4 4 0 0 0 8 0c0-4-2-6-4-10z" },
  { key: "music",     name: "music",     path: "M9 18V5l12-2v13M9 18a3 3 0 0 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 0 1-6 0 3 3 0 0 1 6 0z" },
  { key: "link",      name: "link",      path: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { key: "code",      name: "code",      path: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { key: "shield",    name: "shield",    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { key: "eye",       name: "eye",       path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { key: "mic",       name: "mic",       path: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" },
  { key: "camera",    name: "camera",    path: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { key: "image",     name: "image",     path: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21" },
  { key: "globe",     name: "globe",     path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" },
  { key: "map-pin",   name: "location",  path: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { key: "gamepad",   name: "gamepad",   path: "M6 12h4M8 10v4M15 12h.01M18 12h.01M4 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" },
  { key: "palette",   name: "palette",   path: "M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10a2 2 0 0 0 2-2c0-.52-.2-1-.5-1.36-.3-.34-.5-.8-.5-1.14 0-1.1.9-2 2-2h2.4c3.1 0 5.6-2.5 5.6-5.6C22.87 5.62 17.93 2 12 2zM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM9.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" },
  { key: "moon",      name: "moon",      path: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" },
  { key: "sun",       name: "sun",       path: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" },
  { key: "trophy",    name: "trophy",    path: "M8 21h8M12 17v4M7 4H4l1 7a7 7 0 0 0 14 0l1-7h-3M7 4h10" },
  { key: "book",      name: "book",      path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" },
  { key: "mail",      name: "mail",      path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { key: "phone",     name: "phone",     path: "M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.11 2H7a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
  { key: "leaf",      name: "leaf",      path: "M17 8C8 10 5.9 16.2 3.7 21.5c.7.2 1.4.3 2.1.3 4.1 0 8.7-2.4 9.5-8 .5-3.7-1.3-6.7-3.3-9.1" },
  { key: "coffee",    name: "coffee",    path: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" },
  { key: "gift",      name: "gift",      path: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" },
  { key: "smile",     name: "smile",     path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" },
  { key: "users",     name: "users",     path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { key: "flag",      name: "flag",      path: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" },
  { key: "headphones",name: "headphones",path: "M3 18v-6a9 9 0 0 1 18 0v6M3 18a3 3 0 0 0 3 3 3 3 0 0 0 3-3v-3H3v3zM21 18a3 3 0 0 1-3 3 3 3 0 0 1-3-3v-3h6v3z" },
  { key: "video",     name: "video",     path: "M23 7l-7 5 7 5V7zM1 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H1V5z" },
  { key: "clock",     name: "clock",     path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2" },
  { key: "feather",   name: "feather",   path: "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9" },
  { key: "diamond",   name: "diamond",   path: "M12 2l4 6h6l-5 5 2 7-7-4-7 4 2-7L2 8h6l4-6z" },
  { key: "crown",     name: "crown",     path: "M2 20h20M5 20l-1-9 4 4 4-8 4 8 4-4-1 9" },
  { key: "user",      name: "user",      path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { key: "anchor",    name: "anchor",    path: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 4v16M4.9 19.1C2 16.2 2 11.6 4.9 8.7M19.1 8.7c2.9 2.9 2.9 7.5 0 10.4M2 12h4M18 12h4" },
  { key: "bell",      name: "bell",      path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
  { key: "bookmark",  name: "bookmark",  path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" },
  { key: "compass",   name: "compass",   path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" },
  { key: "scissors",  name: "scissors",  path: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" },
  { key: "terminal",  name: "terminal",  path: "M4 17l6-6-6-6M12 19h8" },
  { key: "truck",     name: "delivery",  path: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { key: "scissors2", name: "cut",       path: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { key: "pen",       name: "pen",       path: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
  { key: "target",    name: "target",    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { key: "trending",  name: "trending",  path: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
  { key: "activity",  name: "activity",  path: "M22 12h-4l-3 9L9 3l-3 9H2" },
];

const SHAPE_RADIUS: Record<string, string> = {
  square: "0px",
  soft: "12px",
  rounded: "28px",
  circle: "50%",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", twitter: "#1DA1F2", tiktok: "#010101",
  youtube: "#FF0000", twitch: "#9146FF", discord: "#5865F2",
  github: "#333333", linkedin: "#0A66C2", spotify: "#1DB954",
  telegram: "#229ED9", custom: "#7c5cfc",
};

/* ── Profile Preview ──────────────────────────────────────── */
function ProfilePreview({ data, links }: { data: ProfileData; links: Link[] }) {
  const avatarRadius = SHAPE_RADIUS[data.avatar_shape] ?? "50%";
  const hasBgImage = data.background_type !== "color" && !!data.background_url;

  return (
    <div style={{
      width: 340,
      flexShrink: 0,
      borderRadius: 18,
      overflow: "hidden",
      position: "relative",
      height: 560,
      boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
    }}>

      {/* Background */}
      {hasBgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.background_url} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block",
        }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: data.background_color || "#09090f" }} />
      )}
      {hasBgImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />}

      {/* "Minimal Profile Preview" label — top right */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 10,
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
        borderRadius: 6, padding: "3px 8px",
      }}>
        Minimal Profile Preview
      </div>

      {/* Bottom content area */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        padding: "0 1rem 1.1rem",
      }}>

        {/* Avatar */}
        <div style={{ marginBottom: "0.6rem" }}>
          {data.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar_url} alt="" style={{
              width: 86, height: 86, borderRadius: avatarRadius,
              objectFit: "cover", display: "block",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            }} />
          ) : (
            <div style={{
              width: 86, height: 86, borderRadius: avatarRadius,
              background: "linear-gradient(135deg,#7c5cfc,#9d6ffc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 900, color: "#fff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            }}>
              {(data.display_name || data.username || "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <p style={{
          margin: "0 0 0.15rem", fontWeight: 800, fontSize: "1.1rem",
          color: "#fff", textAlign: "center", letterSpacing: "-0.01em",
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}>
          {data.display_name || data.username || "username"}
        </p>

        {/* Bio */}
        {data.bio && (
          <p style={{
            margin: "0 0 0.5rem", fontSize: "0.75rem",
            color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.45,
            textShadow: "0 1px 4px rgba(0,0,0,0.7)",
          }}>
            {data.bio.slice(0, 70)}{data.bio.length > 70 ? "…" : ""}
          </p>
        )}

        {/* Tags */}
        {data.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: "0.6rem" }}>
            {data.tags.slice(0, 5).map((t, i) => {
              const icon = ICON_SET.find(ic => ic.key === t.icon);
              return (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.65rem", background: "rgba(124,92,252,0.25)", border: "1px solid rgba(124,92,252,0.4)", borderRadius: 999, padding: "2px 8px 2px 5px", color: "#ddd6fe", fontWeight: 500 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon?.path ?? ICON_SET[0].path} />
                  </svg>
                  {t.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Links — dark pill row like feds.lol */}
        {links.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, flexWrap: "wrap",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px)",
            borderRadius: 999,
            padding: "0.55rem 1.1rem",
            marginTop: "0.4rem",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {links.slice(0, 6).map((link) => (
              <div key={link.id} style={{
                width: 38, height: 38,
                borderRadius: "50%",
                background: PLATFORM_COLORS[link.platform] ?? "#7c5cfc",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white" style={{ display: "block" }}>
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{title}</h3>
      {children}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: "fixed", bottom: "5rem", right: "1.5rem", zIndex: 999, background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: 10, padding: "0.6rem 1rem", color: ok ? "#6ee7b7" : "#fca5a5", fontSize: "0.85rem", fontWeight: 500 }}>
      {msg}
    </div>
  );
}

/* ── Icon Picker Modal ───────────────────────────────────── */
function IconPickerModal({ current, onSelect, onClose }: {
  current: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = ICON_SET.filter(i => i.name.includes(search.toLowerCase()));

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: 320, overflow: "hidden" }}>
        {/* Search */}
        <div style={{ padding: "0.85rem 0.85rem 0", position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ position: "absolute", left: "1.5rem", top: "50%", transform: "translateY(-40%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar ícones, ex: heart..."
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "0.55rem 0.75rem 0.55rem 2.2rem", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2, padding: "0.75rem", maxHeight: 280, overflowY: "auto" }}>
          {filtered.map((icon) => (
            <button
              key={icon.key}
              onClick={() => { onSelect(icon.key); onClose(); }}
              title={icon.name}
              style={{
                background: current === icon.key ? "rgba(124,92,252,0.25)" : "transparent",
                border: `1px solid ${current === icon.key ? "rgba(124,92,252,0.5)" : "transparent"}`,
                borderRadius: 8, padding: "0.5rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (current !== icon.key) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { if (current !== icon.key) e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={icon.path} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Edit Tag Popup ──────────────────────────────────────── */
function EditTagPopup({ tag, onSave, onDelete, onClose }: {
  tag: Tag;
  onSave: (t: Tag) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft]           = useState<Tag>(tag);
  const [iconPicker, setIconPicker] = useState(false);
  const currentIcon = ICON_SET.find(i => i.key === draft.icon);

  return (
    <>
      <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}>
        <div style={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.25rem", width: "100%", maxWidth: 340, position: "relative" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Editar tag</span>
            <button onClick={() => { /* remove icon */ setDraft(d => ({ ...d, icon: "hash" })); }}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 7, padding: "4px 10px", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Remover Ícone
            </button>
          </div>

          {/* Icon + Label row */}
          <div style={{ display: "flex", gap: 12, marginBottom: "1.1rem" }}>
            <div>
              <p style={{ margin: "0 0 5px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ícone</p>
              <button
                onClick={() => setIconPicker(true)}
                style={{ width: 50, height: 50, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={currentIcon?.path ?? ICON_SET[0].path} />
                </svg>
                <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, background: "#7c5cfc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 5px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Label</p>
              <input
                autoFocus
                value={draft.label}
                onChange={(e) => setDraft(d => ({ ...d, label: e.target.value }))}
                style={{ width: "100%", height: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0 0.85rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onDelete}
              style={{ width: 40, height: 40, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2}>
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={onClose}
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 9, padding: "0.5rem 1rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button onClick={() => onSave(draft)}
              style={{ background: "#7c5cfc", border: "none", borderRadius: 9, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Salvar
            </button>
          </div>
        </div>
      </div>

      {iconPicker && (
        <IconPickerModal
          current={draft.icon}
          onSelect={(key) => setDraft(d => ({ ...d, icon: key }))}
          onClose={() => setIconPicker(false)}
        />
      )}
    </>
  );
}

/* ── Avatar Modal ────────────────────────────────────────── */
function AvatarModal({
  currentUrl,
  avatarShape,
  onConfirm,
  onDelete,
  onClose,
}: {
  currentUrl: string;
  avatarShape: string;
  onConfirm: (url: string, file: File | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [pasteUrl, setPasteUrl] = useState(currentUrl);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const radius = SHAPE_RADIUS[avatarShape] ?? "50%";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPasteUrl("");
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasteUrl(e.target.value);
    setPreviewUrl(e.target.value);
    setPendingFile(null);
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        width: "100%", maxWidth: 400,
        padding: "1.5rem",
        position: "relative",
      }}>
        {/* × close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 8, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
          Alterar foto de perfil
        </h2>

        {/* Preview area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed rgba(124,92,252,0.4)",
            borderRadius: 16,
            minHeight: 180,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
            cursor: "pointer",
            background: "rgba(124,92,252,0.04)",
            transition: "border-color 0.15s",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,92,252,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,92,252,0.4)")}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" style={{ width: 120, height: 120, borderRadius: radius, objectFit: "cover" }} />
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>Clique para trocar</p>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.7)" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Clique para fazer upload</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>PNG, JPG, GIF até 5MB</p>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        {/* URL paste */}
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
          Ou cole uma URL
        </p>
        <input
          value={pasteUrl}
          onChange={handleUrlChange}
          placeholder="https://..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
            padding: "0.6rem 0.85rem", color: "#fff", fontSize: "0.88rem",
            outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            marginBottom: "1rem",
          }}
        />

        {/* Confirm */}
        <button
          onClick={() => onConfirm(pasteUrl, pendingFile)}
          style={{
            width: "100%",
            background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
            border: "none", borderRadius: 10,
            padding: "0.7rem",
            color: "#fff", fontWeight: 700, fontSize: "0.92rem",
            cursor: "pointer", fontFamily: "inherit",
            marginBottom: "0.6rem",
          }}
        >
          Confirmar
        </button>

        {/* Delete */}
        {currentUrl && (
          <button
            onClick={onDelete}
            style={{
              width: "100%",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "0.6rem",
              color: "#f87171", fontWeight: 600, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Remover foto de perfil
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Background Modal ───────────────────────────────────── */
function BackgroundModal({
  currentUrl,
  onConfirm,
  onClose,
}: {
  currentUrl: string;
  onConfirm: (url: string, file: File | null) => void;
  onClose: () => void;
}) {
  const [pasteUrl, setPasteUrl] = useState(currentUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPasteUrl(f.name);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPasteUrl(f.name);
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        width: "100%", maxWidth: 420,
        padding: "1.5rem",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
            Escolher imagem de fundo
          </h2>
        </div>

        {/* × close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 8, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "rgba(124,92,252,0.8)" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 14,
            padding: "2rem 1rem",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "1.25rem",
            cursor: "pointer",
            background: dragOver ? "rgba(124,92,252,0.06)" : "rgba(255,255,255,0.02)",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          {pendingFile ? (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.8)" strokeWidth={1.5}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#c4b5fd", fontWeight: 600 }}>{pendingFile.name}</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>Clique para trocar</p>
            </>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M12 12v6M9 15l3-3 3 3"/>
              </svg>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                Arraste e solte ou{" "}
                <span style={{ color: "#7c5cfc", fontWeight: 700 }}>Procurar Arquivo</span>
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                .jpeg, .png, .gif, .webp, .jpg
              </p>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        {/* URL paste */}
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
          Ou cole uma URL
        </p>
        <input
          value={pendingFile ? "" : pasteUrl}
          onChange={(e) => { setPasteUrl(e.target.value); setPendingFile(null); }}
          placeholder="https://cdn.xoa.me/uploads/example.png"
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
            padding: "0.65rem 0.9rem", color: "#fff", fontSize: "0.88rem",
            outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            marginBottom: "1rem",
          }}
        />

        {/* Confirm */}
        <button
          onClick={() => onConfirm(pasteUrl, pendingFile)}
          style={{
            width: "100%",
            background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
            border: "none", borderRadius: 10,
            padding: "0.75rem",
            color: "#fff", fontWeight: 700, fontSize: "0.95rem",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}


/* ── Main Page ───────────────────────────────────────────── */
export default function ProfilePage() {
  const [userId, setUserId]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [dirty, setDirty]             = useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [links, setLinks]             = useState<Link[]>([]);
  const [bgTab, setBgTab]               = useState<"color" | "media">("color");
  const [avatarModal, setAvatarModal]   = useState(false);
  const [bgModal, setBgModal]           = useState(false);
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx]   = useState<number | null>(null);

  const [form, setForm] = useState<ProfileData>({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    avatar_shape: "circle",
    background_color: "#09090f",
    background_url: "",
    background_type: "color",
    banner_url: "",
    tags: [],
    view_count: 0,
    link_icon_color: "#ffffff",
    link_bg_color: "#1e1e2a",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: prof } = await supabase
      .from("profiles")
      .select("username,display_name,bio,avatar_url,avatar_shape,background_color,background_url,background_type,banner_url,tags,view_count,link_icon_color,link_bg_color")
      .eq("user_id", user.id)
      .single();

    if (prof) {
      setForm({
        username:         prof.username ?? "",
        display_name:     prof.display_name ?? "",
        bio:              prof.bio ?? "",
        avatar_url:       prof.avatar_url ?? "",
        avatar_shape:     prof.avatar_shape ?? "circle",
        background_color: prof.background_color ?? "#09090f",
        background_url:   prof.background_url ?? "",
        background_type:  prof.background_type ?? "color",
        banner_url:       prof.banner_url ?? "",
        tags:             (prof.tags ?? []).map((s: string) => decodeTag(s)),
        view_count:       prof.view_count ?? 0,
        link_icon_color:  prof.link_icon_color ?? "#ffffff",
        link_bg_color:    prof.link_bg_color ?? "#1e1e2a",
      });
      if (prof.background_type === "media" || prof.background_url) setBgTab("media");
    }

    const { data: linkRows } = await supabase
      .from("links")
      .select("id,platform,label,url")
      .eq("user_id", user.id)
      .eq("visible", true)
      .order("position");

    setLinks((linkRows ?? []) as Link[]);
    setLoading(false);
  }

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true });
    if (error) { showToast("Erro no upload do avatar.", false); return; }
    const { data: { publicUrl } } = supabase.storage.from("profile-media").getPublicUrl(path);
    update("avatar_url", `${publicUrl}?t=${Date.now()}`);
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      display_name:     form.display_name || null,
      bio:              form.bio || null,
      avatar_url:       form.avatar_url || null,
      avatar_shape:     form.avatar_shape,
      background_color: form.background_color,
      background_url:   form.background_url || null,
      background_type:  bgTab === "color" ? "color" : "image",
      banner_url:       form.banner_url || null,
      tags:             form.tags.map(encodeTag),
    }).eq("user_id", userId);

    setSaving(false);
    if (error) { showToast("Erro ao salvar.", false); return; }
    setDirty(false);
    showToast("Salvo com sucesso!", true);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function addTag() {
    if (form.tags.length >= 8) return;
    const next = [...form.tags, { icon: "hash", label: "New Tag" }];
    update("tags", next);
    setEditingTagIdx(next.length - 1);
  }

  function saveTag(idx: number, t: Tag) {
    const next = [...form.tags];
    next[idx] = t;
    update("tags", next);
    setEditingTagIdx(null);
  }

  function deleteTag(idx: number) {
    update("tags", form.tags.filter((_, i) => i !== idx));
    setEditingTagIdx(null);
  }

  function moveTag(from: number, to: number) {
    const next = [...form.tags];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update("tags", next);
  }

  async function handleAvatarConfirm(url: string, file: File | null) {
    setAvatarModal(false);
    if (file) {
      await uploadAvatar(file);
    } else if (url) {
      update("avatar_url", url);
    }
  }

  function handleAvatarDelete() {
    setAvatarModal(false);
    update("avatar_url", "");
  }

  async function uploadBackground(file: File) {
    if (!userId) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/background/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true });
    if (error) { showToast("Erro no upload do background.", false); return; }
    const { data: { publicUrl } } = supabase.storage.from("profile-media").getPublicUrl(path);
    update("background_url", `${publicUrl}?t=${Date.now()}`);
    update("background_type", "image");
    setBgTab("media");
  }

  async function handleBgConfirm(url: string, file: File | null) {
    setBgModal(false);
    if (file) {
      await uploadBackground(file);
    } else if (url) {
      update("background_url", url);
      update("background_type", "image");
      setBgTab("media");
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(124,92,252,0.3)", borderTopColor: "#7c5cfc", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, padding: "0.6rem 0.85rem", color: "#fff", fontSize: "0.88rem",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const shapeBtn = (s: typeof form.avatar_shape) => ({
    background: form.avatar_shape === s ? "rgba(124,92,252,0.3)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${form.avatar_shape === s ? "rgba(124,92,252,0.6)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 8, padding: "0.4rem 0.9rem", color: form.avatar_shape === s ? "#c4b5fd" : "rgba(255,255,255,0.55)",
    fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties);

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 6rem", maxWidth: 1180, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Perfil</h1>
      </div>

      {/* Two-col layout */}
      <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}>

        {/* ── FORM ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── AVATAR ── */}
          <Section title="Avatar">
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1rem" }}>
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: SHAPE_RADIUS[form.avatar_shape], objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: SHAPE_RADIUS[form.avatar_shape], background: "linear-gradient(135deg,#7c5cfc,#9d6ffc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                  {(form.display_name || form.username || "?")[0]?.toUpperCase()}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setAvatarModal(true)}
                  style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Alterar Avatar
                </button>
              </div>
            </div>

            {/* Avatar Shape */}
            <div>
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>Formato do Avatar</p>
              <div style={{ display: "flex", gap: 6 }}>
                {(["square","soft","rounded","circle"] as const).map((s) => (
                  <button key={s} onClick={() => update("avatar_shape", s)} style={shapeBtn(s)}>
                    {s === "square" ? "Quadrado" : s === "soft" ? "Suave" : s === "rounded" ? "Arredondado" : "Círculo"}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── DECORATION ── */}
          <Section title="Decoração">
            <button style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", opacity: 0.6 }}>
              Alterar Decoração
            </button>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Em breve disponível.</p>
          </Section>

          {/* ── BACKGROUND ── */}
          <Section title="Background">
            {/* Color / Media tabs */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 3, marginBottom: "0.85rem", width: "fit-content" }}>
              {(["color","media"] as const).map((t) => (
                <button key={t} onClick={() => setBgTab(t)}
                  style={{ background: bgTab === t ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 6, padding: "0.35rem 1rem", color: bgTab === t ? "#fff" : "rgba(255,255,255,0.45)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {t === "color" ? "Cor" : "Mídia"}
                </button>
              ))}
            </div>

            {bgTab === "color" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <input type="color" value={form.background_color} onChange={(e) => update("background_color", e.target.value)}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                    <div style={{ width: 44, height: 44, borderRadius: 9, background: form.background_color, border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{form.background_color}</span>
                </div>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Define uma cor de fundo sólida. Qualquer imagem será removida.</p>
              </div>
            ) : (
              <div>
                {/* Image / Video sub-tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: "0.85rem", alignItems: "center" }}>
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: 3, gap: 3 }}>
                    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 5, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>
                      Imagem
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 5, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", cursor: "not-allowed" }}>
                      Vídeo
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.7)" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                  </div>

                  <button onClick={() => setBgModal(true)}
                    style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.45rem 1rem", color: "#fff", fontWeight: 600, fontSize: "0.84rem", cursor: "pointer", fontFamily: "inherit" }}>
                    {form.background_url ? "Alterar Imagem" : "Adicionar Imagem"}
                  </button>

                  {form.background_url && (
                    <button onClick={() => { update("background_url", ""); update("background_type", "color"); setBgTab("color"); }}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.45rem 1rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.84rem", cursor: "pointer", fontFamily: "inherit" }}>
                      Remover Imagem
                    </button>
                  )}
                </div>

                {!form.background_url && (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                    Escolha uma imagem ou vídeo de fundo. A cor será removida.
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* ── BANNER ── */}
          <Section title="Banner">
            <button style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", opacity: 0.6 }}>
              Alterar Banner
            </button>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Em breve disponível.</p>
          </Section>

          {/* ── DISPLAY NAME ── */}
          <Section title="Nome de exibição">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input
                value={form.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                placeholder={form.username}
                style={{ ...inputStyle, paddingLeft: "2.1rem" }}
              />
            </div>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
              Se vazio, o username <strong style={{ color: "rgba(255,255,255,0.5)" }}>@{form.username}</strong> será usado.
            </p>
          </Section>

          {/* ── BIO ── */}
          <Section title="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Escreva algo sobre você..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </Section>

          {/* ── TAGS ── */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Tags</h3>
              <button onClick={addTag}
                style={{ background: "#7c5cfc", border: "none", borderRadius: 999, padding: "0.35rem 0.9rem", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Tag
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.tags.map((tag, idx) => {
                const icon = ICON_SET.find(i => i.key === tag.icon);
                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => setDragOverIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                    onDrop={() => { if (dragOverIdx !== null && dragOverIdx !== idx) moveTag(dragOverIdx, idx); setDragOverIdx(null); }}
                    onDragEnd={() => setDragOverIdx(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: dragOverIdx === idx ? "rgba(124,92,252,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${dragOverIdx === idx ? "rgba(124,92,252,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10, padding: "0.55rem 0.65rem",
                      transition: "background 0.1s, border-color 0.1s",
                    }}
                  >
                    {/* Drag handle */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} style={{ cursor: "grab", flexShrink: 0 }}>
                      <circle cx="9" cy="6" r="1" fill="rgba(255,255,255,0.25)"/><circle cx="9" cy="12" r="1" fill="rgba(255,255,255,0.25)"/><circle cx="9" cy="18" r="1" fill="rgba(255,255,255,0.25)"/>
                      <circle cx="15" cy="6" r="1" fill="rgba(255,255,255,0.25)"/><circle cx="15" cy="12" r="1" fill="rgba(255,255,255,0.25)"/><circle cx="15" cy="18" r="1" fill="rgba(255,255,255,0.25)"/>
                    </svg>

                    {/* Icon */}
                    <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.08)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon?.path ?? ICON_SET[0].path} />
                      </svg>
                    </div>

                    {/* Label */}
                    <span style={{ flex: 1, fontSize: "0.88rem", color: "#fff", fontWeight: 500 }}>{tag.label}</span>

                    {/* Three dots */}
                    <button
                      onClick={() => setEditingTagIdx(idx)}
                      style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── PREVIEW ── */}
        <div style={{ flexShrink: 0, position: "sticky", top: "1.5rem" }}>
          <ProfilePreview data={form} links={links} />
        </div>
      </div>

      {/* ── FLOATING SAVE BAR ── */}
      {dirty && (
        <div style={{
          position: "fixed",
          bottom: "1.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          background: "rgba(18,18,26,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "0.75rem 0.75rem 0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
            Você tem alterações não salvas.
          </p>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
              border: "none", borderRadius: 9,
              padding: "0.5rem 1.25rem",
              color: "#fff", fontWeight: 700, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {avatarModal && (
        <AvatarModal
          currentUrl={form.avatar_url}
          avatarShape={form.avatar_shape}
          onConfirm={handleAvatarConfirm}
          onDelete={handleAvatarDelete}
          onClose={() => setAvatarModal(false)}
        />
      )}

      {bgModal && (
        <BackgroundModal
          currentUrl={form.background_url}
          onConfirm={handleBgConfirm}
          onClose={() => setBgModal(false)}
        />
      )}


      {editingTagIdx !== null && form.tags[editingTagIdx] && (
        <EditTagPopup
          tag={form.tags[editingTagIdx]}
          onSave={(t) => saveTag(editingTagIdx, t)}
          onDelete={() => deleteTag(editingTagIdx)}
          onClose={() => setEditingTagIdx(null)}
        />
      )}
    </div>
  );
}
