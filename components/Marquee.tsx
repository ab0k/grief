"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  "#7c5cfc", "#f857a6", "#0ea5e9", "#10b981",
  "#f97316", "#ec4899", "#8b5cf6", "#06b6d4",
  "#f59e0b", "#84cc16", "#fb7185", "#a78bfa",
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

type Profile = { username: string; avatar_url: string | null };

function ProfileChip({ profile }: { profile: Profile }) {
  const color = colorFor(profile.username);
  return (
    <a
      href={`https://dwe.lol/${profile.username}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 999,
        padding: "8px 16px 8px 8px",
        marginRight: 12,
        whiteSpace: "nowrap",
        flexShrink: 0,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.09)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.18)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.username}
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 800, color: "#fff",
          }}
        >
          {profile.username[0]?.toUpperCase()}
        </div>
      )}
      <div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>
          {profile.username}
        </div>
        <div style={{ fontSize: "0.7rem", fontFamily: "'Geist Mono', monospace", color: "var(--text-muted)" }}>
          dwe.lol/{profile.username}
        </div>
      </div>
    </a>
  );
}

export default function Marquee() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .order("id", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) setProfiles(data as Profile[]);
      });
  }, []);

  // Need enough chips to fill the marquee — repeat until we have at least 16
  const filled: Profile[] = profiles.length === 0
    ? []
    : Array.from({ length: Math.ceil(16 / profiles.length) })
        .flatMap(() => profiles)
        .slice(0, Math.max(profiles.length * 2, 16));

  // Double for seamless loop
  const doubled = [...filled, ...filled];

  if (profiles.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0", overflow: "hidden", position: "relative" }}>
      <div
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(to right, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }}
      />
      <div
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(to left, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }}
      />
      <div className="marquee-track">
        {doubled.map((profile, i) => (
          <ProfileChip key={`${profile.username}-${i}`} profile={profile} />
        ))}
      </div>
    </section>
  );
}
