"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: number;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_shape: string | null;
  tags: string[] | null;
  page_title: string | null;
  favicon_url: string | null;
  view_count: number;
  is_premium: boolean;
  background_url: string | null;
  background_type: string | null;
  background_color: string | null;
  font_url: string | null;
  audio_url: string | null;
  audio_autoplay: boolean;
  cursor_url: string | null;
  link_icon_color: string;
  link_bg_color: string;
  theme_color: string | null;
  name_color: string | null;
  text_color: string | null;
  name_font: string | null;
  text_font: string | null;
};

type Link = {
  id: number;
  platform: string;
  label: string;
  url: string;
  position: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", twitter: "#1DA1F2", tiktok: "#010101",
  youtube: "#FF0000", twitch: "#9146FF", discord: "#5865F2",
  github: "#333333", linkedin: "#0A66C2", spotify: "#1DB954",
  telegram: "#229ED9", reddit: "#FF4500", whatsapp: "#25D366",
  custom: "#7c5cfc",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram:  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  twitter:    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  tiktok:     "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z",
  youtube:    "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  twitch:     "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z",
  discord:    "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.11 18.1.128 18.11a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z",
  github:     "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z",
  spotify:    "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
  telegram:   "M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  linkedin:   "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  custom:     "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
};

function PlatformIcon({ platform }: { platform: string }) {
  const d = PLATFORM_ICONS[platform] ?? PLATFORM_ICONS.custom;
  const isCustom = !PLATFORM_ICONS[platform] || platform === "custom";
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill={isCustom ? "none" : "white"}
      stroke={isCustom ? "white" : "none"}
      strokeWidth={isCustom ? 2 : 0}
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NotFound({ username }: { username: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👻</div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>@{username}</h1>
      <p style={{ margin: "0 0 2rem", color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Este perfil não existe.</p>
      <a href="/" style={{ padding: "0.65rem 1.5rem", borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#f857a6)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
        Criar o meu perfil
      </a>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === "string" ? params.username : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [badges, setBadges] = useState<{ icon: string; color: string; name: string }[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;
    const supabase = createClient();
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,user_id,username,display_name,bio,avatar_url,avatar_shape,tags,page_title,favicon_url,view_count,is_premium,background_url,background_type,background_color,font_url,audio_url,audio_autoplay,cursor_url,link_icon_color,link_bg_color,theme_color,name_color,text_color,name_font,text_font")
        .eq("username", username)
        .single();

      if (!prof) { setNotFound(true); setLoading(false); return; }
      setProfile(prof as Profile);

      const [{ data: linkData }, { data: ubData }] = await Promise.all([
        supabase
          .from("links")
          .select("id,platform,label,url,position")
          .eq("user_id", prof.user_id)
          .eq("visible", true)
          .order("position", { ascending: true }),
        supabase
          .from("user_badges")
          .select("badge:badges(icon,color,name)")
          .eq("profile_id", prof.id),
      ]);

      setLinks((linkData ?? []) as Link[]);
      setBadges(((ubData ?? []).map((r: any) => r.badge).filter(Boolean)) as { icon: string; color: string; name: string }[]);
      setLoading(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === prof.user_id) { setIsOwner(true); return; }

      const sessionKey = `viewed_${prof.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        await supabase.rpc("increment_profile_view", { p_username: username });
        sessionStorage.setItem(sessionKey, "1");
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    document.title = profile.page_title || `${profile.username} (@${profile.username})`;
    if (profile.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = profile.favicon_url;
    }
  }, [profile]);

  // Close notif on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(124,92,252,0.3)", borderTopColor: "#7c5cfc", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound) return <NotFound username={username} />;

  const prof = profile!;
  const hasVideoBg = prof.background_type === "video" && prof.background_url;
  const hasImageBg = prof.background_type === "image" && prof.background_url;
  const bgColor = prof.background_color ?? "#09090f";

  const themeColor = prof.theme_color ?? "#7c5cfc";
  const nameColor  = prof.name_color  ?? "#ffffff";
  const textColor  = prof.text_color  ?? "#ffffff";

  const FONT_MAP: Record<string, string> = {
    default:    "inherit",
    cinzel:     "'Cinzel',serif",
    indie:      "'Indie Flower',cursive",
    jetbrains:  "'JetBrains Mono',monospace",
    dancing:    "'Dancing Script',cursive",
    bangers:    "'Bangers',cursive",
    creepster:  "'Creepster',cursive",
    orbitron:   "'Orbitron',sans-serif",
    pacifico:   "'Pacifico',cursive",
    pressstart: "'Press Start 2P',cursive",
    playfair:   "'Playfair Display',serif",
    righteous:  "'Righteous',cursive",
  };
  const FONT_GK: Record<string, string> = {
    cinzel: "Cinzel", indie: "Indie+Flower", jetbrains: "JetBrains+Mono",
    dancing: "Dancing+Script", bangers: "Bangers", creepster: "Creepster",
    orbitron: "Orbitron", pacifico: "Pacifico", pressstart: "Press+Start+2P",
    playfair: "Playfair+Display", righteous: "Righteous",
  };
  const nameFontFamily = FONT_MAP[prof.name_font ?? "default"] ?? "inherit";
  const textFontFamily = FONT_MAP[prof.text_font ?? "default"] ?? "inherit";
  const nameGk = FONT_GK[prof.name_font ?? ""];
  const textGk = FONT_GK[prof.text_font ?? ""];

  const SHAPE_RADIUS: Record<string, string> = {
    square: "0px", soft: "12px", rounded: "28px", circle: "50%",
  };
  const avatarRadius = SHAPE_RADIUS[prof.avatar_shape ?? "circle"] ?? "50%";
  const displayName = prof.display_name || prof.username;

  function decodeTag(s: string): { icon: string; label: string } {
    const i = s.indexOf(":");
    if (i === -1) return { icon: "hash", label: s };
    return { icon: s.slice(0, i), label: s.slice(i + 1) };
  }

  const ICON_PATHS: Record<string, string> = {
    hash: "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", fire: "M12 2c-2 4-4 6-4 10a4 4 0 0 0 8 0c0-4-2-6-4-10z",
    music: "M9 18V5l12-2v13M9 18a3 3 0 0 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 0 1-6 0 3 3 0 0 1 6 0z",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    code: "M16 18l6-6-6-6M8 6l-6 6 6 6", shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    mic: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
    camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    image: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    "map-pin": "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    gamepad: "M6 12h4M8 10v4M15 12h.01M18 12h.01M4 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z",
    moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
    trophy: "M8 21h8M12 17v4M7 4H4l1 7a7 7 0 0 0 14 0l1-7h-3M7 4h10",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    leaf: "M17 8C8 10 5.9 16.2 3.7 21.5c.7.2 1.4.3 2.1.3 4.1 0 8.7-2.4 9.5-8 .5-3.7-1.3-6.7-3.3-9.1",
    smile: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    crown: "M2 20h20M5 20l-1-9 4 4 4-8 4 8 4-4-1 9", user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    diamond: "M12 2l4 6h6l-5 5 2 7-7-4-7 4 2-7L2 8h6l4-6z",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2", trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    pen: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  };

  const decodedTags = (prof.tags ?? []).map((s: string) => decodeTag(s));

  return (
    <div style={{
      minHeight: "100vh",
      background: hasImageBg ? `url(${prof.background_url}) center/cover no-repeat fixed` : bgColor,
      fontFamily: prof.font_url ? "'CustomFont',sans-serif" : "inherit",
      position: "relative",
    }}>
      {prof.font_url && <style>{`@font-face{font-family:'CustomFont';src:url('${prof.font_url}')}*{font-family:'CustomFont',sans-serif!important}`}</style>}
      {nameGk && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${nameGk}:wght@400;700&display=swap`} />}
      {textGk && textGk !== nameGk && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${textGk}:wght@400;700&display=swap`} />}
      {prof.cursor_url && <style>{`*{cursor:url('${prof.cursor_url}'),auto!important}`}</style>}
      {hasVideoBg && (
        <video autoPlay muted loop playsInline style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
          <source src={prof.background_url!} />
        </video>
      )}
      {(hasVideoBg || hasImageBg) && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1, pointerEvents: "none" }} />}
      {prof.audio_url && prof.audio_autoplay && <audio autoPlay loop style={{ display: "none" }}><source src={prof.audio_url} /></audio>}

      {/* ── OWNER TOP BAR ─────────────────────────────────── */}
      {isOwner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: "0.5rem", padding: "0.75rem 1.5rem",
        }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none",
                color: "rgba(255,255,255,0.7)", fontSize: "0.88rem",
                fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                padding: "0.45rem 0.75rem", borderRadius: 8,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notificações
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#111118", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, width: 300,
                boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.1rem 0.75rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Notificações</span>
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div style={{ padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Nenhuma notificação</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ───────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex",
        maxWidth: 1100,
        margin: "0 auto",
        minHeight: "100vh",
        padding: isOwner ? "5rem 1.5rem 3rem" : "3rem 1.5rem 3rem",
      }}>

        {/* LEFT */}
        <div className="profile-left" style={{ width: 320, flexShrink: 0, paddingRight: "2rem" }}>

          {/* Avatar */}
          <div style={{ marginBottom: "1.5rem" }}>
            {prof.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prof.avatar_url} alt={prof.username}
                style={{ width: 120, height: 120, borderRadius: avatarRadius, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{
                width: 120, height: 120, borderRadius: avatarRadius,
                background: "linear-gradient(135deg,#7c5cfc,#9d6ffc)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.8rem", fontWeight: 900, color: "#fff",
              }}>
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.2rem", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: nameColor, letterSpacing: "-0.02em", fontFamily: nameFontFamily }}>
              {displayName}
            </h1>
            {prof.is_premium && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#ppbg)" />
                <defs><linearGradient id="ppbg" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#7c5cfc"/><stop offset="1" stopColor="#f857a6"/></linearGradient></defs>
              </svg>
            )}
            {badges.map((b, i) => (
              <span
                key={i}
                title={b.name}
                style={{ fontSize: "1.1rem", lineHeight: 1, filter: `drop-shadow(0 0 6px ${b.color}90)`, cursor: "default" }}
              >
                {b.icon}
              </span>
            ))}
          </div>

          <p style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: textColor, opacity: 0.5, fontFamily: textFontFamily }}>
            @{prof.username}
          </p>

          {/* Tags — between @username and followers */}
          {decodedTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.85rem" }}>
              {decodedTags.map((tag, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", background: `${themeColor}20`, border: `1px solid ${themeColor}40`, borderRadius: 999, padding: "3px 10px 3px 7px", color: textColor, fontWeight: 500, fontFamily: textFontFamily }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[tag.icon] ?? ICON_PATHS.hash} />
                  </svg>
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.84rem", color: textColor, opacity: 0.45, marginBottom: prof.bio ? "1rem" : "2rem", fontFamily: textFontFamily }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth={2}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {(prof.view_count ?? 0).toLocaleString("pt-BR")} visitas
          </div>

          {/* Bio */}
          {prof.bio && (
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: textColor, opacity: 0.6, lineHeight: 1.55, fontFamily: textFontFamily }}>
              {prof.bio}
            </p>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "2rem" }}>
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 9,
                    background: prof.link_bg_color ?? "#18181f",
                    border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    textDecoration: "none", flexShrink: 0,
                    transition: "transform 0.15s, opacity 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.opacity = "1"; }}
                >
                  <PlatformIcon platform={link.platform} />
                </a>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ paddingTop: "2rem" }}>
            <a href="/" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Feito com <span style={{ color: "rgba(124,92,252,0.6)", fontWeight: 700 }}>grief</span>
            </a>
          </div>
        </div>

        {/* RIGHT — vazio, reservado para futuro */}
        <div className="profile-right" style={{ flex: 1 }} />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .profile-left  { width: 100% !important; padding-right: 0 !important; }
          .profile-right { display: none !important; }
          div[style*="display: flex"][style*="max-width: 1100px"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
