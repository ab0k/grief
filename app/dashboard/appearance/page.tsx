"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Color helpers ────────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function isValidHex(h: string) { return /^#[0-9a-fA-F]{6}$/.test(h); }

// ── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [
  "#000000","#1a1a2e","#16213e","#0f3460","#533483","#e94560",
  "#c71585","#db7093","#ff69b4","#ffb6c1","#ffe4e1","#ffffff",
  "#7c5cfc","#9d6ffc","#b39dfc","#c4b5fd","#ddd6fe","#f857a6",
  "#4b0082","#6a0dad","#8b008b","#9932cc","#ba55d3","#e040fb",
  "#191970","#0000cd","#4169e1","#6495ed","#87ceeb","#00bcd4",
  "#006400","#228b22","#32cd32","#98fb98","#ffd700","#ff6b35",
];

const FONTS: { key: string; name: string; family: string; gk: string | null; premium: boolean }[] = [
  { key: "default",    name: "Inter",            family: "inherit",                           gk: null,                   premium: false },
  { key: "cinzel",     name: "Cinzel",            family: "'Cinzel',serif",                    gk: "Cinzel",               premium: false },
  { key: "indie",      name: "Indie Flower",      family: "'Indie Flower',cursive",            gk: "Indie+Flower",         premium: false },
  { key: "jetbrains",  name: "JetBrains Mono",    family: "'JetBrains Mono',monospace",        gk: "JetBrains+Mono",       premium: false },
  { key: "dancing",    name: "Dancing Script",    family: "'Dancing Script',cursive",          gk: "Dancing+Script",       premium: false },
  { key: "bangers",    name: "Bangers",           family: "'Bangers',cursive",                 gk: "Bangers",              premium: false },
  { key: "creepster",  name: "Creepster",         family: "'Creepster',cursive",               gk: "Creepster",            premium: true  },
  { key: "orbitron",   name: "Orbitron",          family: "'Orbitron',sans-serif",             gk: "Orbitron",             premium: true  },
  { key: "pacifico",   name: "Pacifico",          family: "'Pacifico',cursive",                gk: "Pacifico",             premium: true  },
  { key: "pressstart", name: "Press Start 2P",    family: "'Press Start 2P',cursive",          gk: "Press+Start+2P",       premium: true  },
  { key: "playfair",   name: "Playfair Display",  family: "'Playfair Display',serif",          gk: "Playfair+Display",     premium: true  },
  { key: "righteous",  name: "Righteous",         family: "'Righteous',cursive",               gk: "Righteous",            premium: true  },
];

function fontFamily(key: string) {
  return FONTS.find(f => f.key === key)?.family ?? "inherit";
}

function loadFont(gk: string) {
  const id = `gf-${gk}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id; link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${gk}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

// ── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange, onClose }: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab]               = useState<"presets" | "custom">("presets");
  const [hsl, setHsl]               = useState<[number,number,number]>(() => isValidHex(value) ? hexToHsl(value) : [260,80,68]);
  const [hexInput, setHexInput]     = useState(value);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const gradRef                     = useRef<HTMLDivElement>(null);

  const currentHex = isValidHex(hexInput) ? hexInput : hslToHex(...hsl);

  function applyHex(h: string) {
    setHexInput(h);
    if (isValidHex(h)) { setHsl(hexToHsl(h)); onChange(h); }
  }

  function applyHsl(h: number, s: number, l: number) {
    setHsl([h, s, l]);
    const hex = hslToHex(h, s, l);
    setHexInput(hex);
    onChange(hex);
  }

  function handleGradClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = gradRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 50 + 0);
    applyHsl(hsl[0], s, l);
  }

  function handleGradDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    handleGradClick(e);
  }

  return (
    <div style={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "0.9rem", width: 240, boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}>
      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 3, gap: 3, marginBottom: "0.75rem" }}>
        {(["presets","custom"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 6, padding: "0.3rem", color: tab === t ? "#fff" : "rgba(255,255,255,0.45)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
            {t === "presets" ? "Presets" : "Customizar"}
          </button>
        ))}
      </div>

      {tab === "presets" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 4 }}>
          {PRESETS.map(c => (
            <button key={c} onClick={() => { applyHex(c); onChange(c); }}
              style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: c, border: currentHex === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "transform 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "")}
            />
          ))}
        </div>
      ) : (
        <>
          {/* 2D gradient */}
          <div
            ref={gradRef}
            onClick={handleGradClick}
            onMouseMove={handleGradDrag}
            style={{
              width: "100%", height: 120, borderRadius: 8,
              background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${hsl[0]},100%,50%))`,
              cursor: "crosshair", marginBottom: 8, position: "relative",
            }}
          >
            <div style={{
              position: "absolute",
              left: `${hsl[1]}%`, top: `${100 - hsl[2] * 2}%`,
              width: 12, height: 12, borderRadius: "50%",
              border: "2px solid #fff", transform: "translate(-50%,-50%)",
              boxShadow: "0 0 4px rgba(0,0,0,0.8)",
              background: currentHex,
            }} />
          </div>

          {/* Hue slider */}
          <input type="range" min={0} max={360} value={hsl[0]}
            onChange={e => applyHsl(Number(e.target.value), hsl[1], hsl[2])}
            style={{ width: "100%", marginBottom: 10, accentColor: "#7c5cfc", appearance: "none", height: 8, borderRadius: 4, background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)", cursor: "pointer" }}
          />

          {/* Your Colors */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Suas Cores</span>
              <button onClick={() => { if (!savedColors.includes(currentHex)) setSavedColors(s => [...s, currentHex]); }}
                style={{ background: "none", border: "none", color: "#7c5cfc", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                + Adicionar
              </button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {savedColors.map(c => (
                <div key={c} style={{ position: "relative" }}>
                  <button onClick={() => applyHex(c)}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: currentHex === c ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)", cursor: "pointer" }} />
                  <button onClick={() => setSavedColors(s => s.filter(x => x !== c))}
                    style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#f87171", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hex input */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.4rem 0.7rem" }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: currentHex, flexShrink: 0 }} />
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>#</span>
        <input value={hexInput.replace("#","")} onChange={e => applyHex("#" + e.target.value)}
          style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "monospace", minWidth: 0 }} />
      </div>
    </div>
  );
}

// ── Color Swatch Button ───────────────────────────────────────────────────────

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div>
        <p style={{ margin: "0 0 6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</p>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: 90, height: 42, borderRadius: 10, background: value, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "4px 5px" }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        </button>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 300 }}>
          <ColorPicker value={value} onChange={onChange} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── Font Picker ───────────────────────────────────────────────────────────────

function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    FONTS.forEach(f => { if (f.gk) loadFont(f.gk); });
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = FONTS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const current = FONTS.find(f => f.key === value) ?? FONTS[0];

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <p style={{ margin: "0 0 6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</p>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
        padding: "0.55rem 0.85rem", color: "#fff", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer",
        fontFamily: current.family, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily2: "inherit",
      } as React.CSSProperties}>
        <span style={{ fontFamily: current.family }}>{current.name}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 300,
          background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)", overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "0.6rem 0.75rem 0", position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ position: "absolute", left: "1.4rem", top: "50%", transform: "translateY(-20%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.45rem 0.75rem 0.45rem 2rem", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: "auto", padding: "0.4rem 0" }}>
            {filtered.map(f => (
              <button key={f.key} onClick={() => { if (!f.premium) { onChange(f.key); } }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.55rem 1rem", background: value === f.key ? "rgba(124,92,252,0.15)" : "transparent",
                  border: "none", cursor: f.premium ? "default" : "pointer",
                  opacity: f.premium ? 0.5 : 1,
                }}>
                <span style={{ fontFamily: f.family, fontSize: "0.92rem", color: "#fff", fontWeight: value === f.key ? 700 : 400 }}>{f.name}</span>
                {f.premium ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.6)" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ) : value === f.key ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Appearance Preview ────────────────────────────────────────────────────────

const SHAPE_RADIUS: Record<string, string> = {
  square: "0px", soft: "12px", rounded: "28px", circle: "50%",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", twitter: "#1DA1F2", tiktok: "#010101",
  youtube: "#FF0000", twitch: "#9146FF", discord: "#5865F2",
  github: "#333333", linkedin: "#0A66C2", spotify: "#1DB954",
  telegram: "#229ED9", custom: "#7c5cfc",
};

const PREVIEW_ICONS: Record<string, string> = {
  hash: "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 0 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 0 1-6 0 3 3 0 0 1 6 0z",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

type ProfileSnap = {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  avatar_shape: string | null;
  tags: string[] | null;
  view_count: number;
  background_color: string | null;
  background_url: string | null;
  background_type: string | null;
  bio: string | null;
};

type PreviewLink = { id: number; platform: string; label: string; url: string };

function decodeTagForPreview(s: string): { icon: string; label: string } {
  const i = s.indexOf(":");
  if (i === -1) return { icon: "hash", label: s };
  return { icon: s.slice(0, i), label: s.slice(i + 1) };
}

function AppearancePreview({ form, profile, links }: {
  form: AppearanceForm;
  profile: ProfileSnap | null;
  links: PreviewLink[];
}) {
  const nameFontFamily = fontFamily(form.name_font);
  const textFontFamily = fontFamily(form.text_font);
  const displayName    = profile?.display_name || profile?.username || "username";
  const avatarRadius   = SHAPE_RADIUS[profile?.avatar_shape ?? "circle"] ?? "50%";
  const hasBgImage     = profile?.background_type !== "color" && !!profile?.background_url;
  const decodedTags    = (profile?.tags ?? []).slice(0, 5).map(decodeTagForPreview);

  return (
    <div style={{
      width: 340, flexShrink: 0, borderRadius: 18, overflow: "hidden",
      position: "relative", height: 560,
      boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
    }}>

      {/* Background */}
      {hasBgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile!.background_url!} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block",
        }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: profile?.background_color || "#09090f" }} />
      )}
      {hasBgImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />}

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        padding: "0 1rem 1.1rem",
      }}>

        {/* Avatar */}
        <div style={{ marginBottom: "0.6rem" }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" style={{
              width: 86, height: 86, borderRadius: avatarRadius,
              objectFit: "cover", display: "block",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            }} />
          ) : (
            <div style={{
              width: 86, height: 86, borderRadius: avatarRadius,
              background: `linear-gradient(135deg,${form.theme_color},${form.theme_color}aa)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 900, color: "#fff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            }}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <p style={{
          margin: "0 0 0.3rem", fontWeight: 800, fontSize: "1.1rem",
          color: form.name_color, textAlign: "center", letterSpacing: "-0.01em",
          textShadow: "0 2px 8px rgba(0,0,0,0.8)", fontFamily: nameFontFamily,
        }}>
          {displayName}
        </p>

        {/* Views */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          marginBottom: "0.4rem",
          fontSize: "0.7rem", fontWeight: 600, fontFamily: textFontFamily,
          color: form.text_color, opacity: 0.5,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={form.theme_color} strokeWidth={2}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {(profile?.view_count ?? 0).toLocaleString("pt-BR")} visitas
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p style={{
            margin: "0 0 0.5rem", fontSize: "0.75rem",
            color: form.text_color, textAlign: "center", lineHeight: 1.45,
            textShadow: "0 1px 4px rgba(0,0,0,0.7)", fontFamily: textFontFamily,
            opacity: 0.8,
          }}>
            {profile.bio.slice(0, 70)}{profile.bio.length > 70 ? "…" : ""}
          </p>
        )}

        {/* Tags */}
        {decodedTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: "0.6rem" }}>
            {decodedTags.map((t, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: "0.65rem",
                background: `${form.theme_color}33`,
                border: `1px solid ${form.theme_color}66`,
                borderRadius: 999, padding: "2px 8px 2px 5px",
                color: form.text_color, fontWeight: 500, fontFamily: textFontFamily,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={PREVIEW_ICONS[t.icon] ?? PREVIEW_ICONS.hash} />
                </svg>
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* Links pill */}
        {links.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, flexWrap: "wrap",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
            borderRadius: 999, padding: "0.55rem 1.1rem", marginTop: "0.4rem",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {links.slice(0, 6).map((link) => (
              <div key={link.id} style={{
                width: 38, height: 38, borderRadius: "50%",
                background: PLATFORM_COLORS[link.platform] ?? form.theme_color,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
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

// ── Types ────────────────────────────────────────────────────────────────────

type AppearanceForm = {
  theme_color: string;
  name_color: string;
  text_color: string;
  name_font: string;
  text_font: string;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AppearancePage() {
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<"colors" | "font" | null>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [premiumDismissed, setPremiumDismissed] = useState(false);
  const [profile, setProfile]               = useState<ProfileSnap | null>(null);
  const [links, setLinks]                   = useState<PreviewLink[]>([]);

  const [form, setForm] = useState<AppearanceForm>({
    theme_color: "#7c5cfc",
    name_color: "#ffffff",
    text_color: "#ffffff",
    name_font: "default",
    text_font: "default",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from("profiles")
      .select("theme_color,name_color,text_color,name_font,text_font,display_name,username,avatar_url,avatar_shape,tags,view_count,background_color,background_url,background_type,bio")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setForm({
        theme_color: data.theme_color ?? "#7c5cfc",
        name_color:  data.name_color  ?? "#ffffff",
        text_color:  data.text_color  ?? "#ffffff",
        name_font:   data.name_font   ?? "default",
        text_font:   data.text_font   ?? "default",
      });
      setProfile({
        display_name:     data.display_name     ?? null,
        username:         data.username         ?? "",
        avatar_url:       data.avatar_url       ?? null,
        avatar_shape:     data.avatar_shape     ?? "circle",
        tags:             data.tags             ?? [],
        view_count:       data.view_count       ?? 0,
        background_color: data.background_color ?? "#09090f",
        background_url:   data.background_url   ?? null,
        background_type:  data.background_type  ?? "color",
        bio:              data.bio              ?? null,
      });
    }

    const { data: linkRows } = await supabase
      .from("links")
      .select("id,platform,label,url")
      .eq("user_id", user.id)
      .eq("visible", true)
      .order("position");
    setLinks((linkRows ?? []) as PreviewLink[]);
    setLoading(false);
  }

  function update<K extends keyof AppearanceForm>(key: K, value: AppearanceForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveColors() {
    if (!userId) return;
    setSaving("colors");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      theme_color: form.theme_color,
      name_color:  form.name_color,
      text_color:  form.text_color,
    }).eq("user_id", userId);
    setSaving(null);
    error ? showToast("Erro ao salvar.", false) : showToast("Cores salvas!", true);
  }

  async function saveFont() {
    if (!userId) return;
    setSaving("font");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      name_font: form.name_font,
      text_font: form.text_font,
    }).eq("user_id", userId);
    setSaving(null);
    error ? showToast("Erro ao salvar.", false) : showToast("Fontes salvas!", true);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(124,92,252,0.3)", borderTopColor: "#7c5cfc", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const card: React.CSSProperties = {
    background: "#111118", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "1.5rem",
  };

  const saveBtn = (onClick: () => void, isSaving: boolean): React.CSSProperties => ({
    width: "100%", background: "linear-gradient(135deg,#7c5cfc,#f857a6)",
    border: "none", borderRadius: 10, padding: "0.7rem",
    color: "#fff", fontWeight: 700, fontSize: "0.92rem",
    cursor: isSaving ? "not-allowed" : "pointer", fontFamily: "inherit",
    opacity: isSaving ? 0.7 : 1, marginTop: "1.25rem",
  });

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 6rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Aparência</h1>
      </div>

      <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>

        {/* ── LEFT FORM ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Colors + Font row */}
          <div style={{ display: "flex", gap: "1.25rem" }}>

            {/* Colors card */}
            <div style={{ ...card, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
                    <path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10a2 2 0 0 0 2-2c0-.52-.2-1-.5-1.36-.3-.34-.5-.8-.5-1.14 0-1.1.9-2 2-2h2.4c3.1 0 5.6-2.5 5.6-5.6C22.87 5.62 17.93 2 12 2z"/>
                    <circle cx="6.5" cy="11.5" r="1.5" fill="#7c5cfc"/><circle cx="9.5" cy="7.5" r="1.5" fill="#7c5cfc"/>
                    <circle cx="14.5" cy="7.5" r="1.5" fill="#7c5cfc"/><circle cx="17.5" cy="11.5" r="1.5" fill="#7c5cfc"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Cores</span>
                </div>
                <button
                  onClick={() => { update("theme_color", "#7c5cfc"); update("name_color", "#ffffff"); update("text_color", "#ffffff"); }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "3px 10px", color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                  </svg>
                  Resetar
                </button>
              </div>

              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                <ColorSwatch label="Tema"  value={form.theme_color} onChange={v => update("theme_color", v)} />
                <ColorSwatch label="Nome"  value={form.name_color}  onChange={v => update("name_color", v)} />
                <ColorSwatch label="Texto" value={form.text_color}  onChange={v => update("text_color", v)} />
              </div>

              <button onClick={saveColors} disabled={saving === "colors"} style={saveBtn(saveColors, saving === "colors")}>
                {saving === "colors" ? "Salvando…" : "Salvar"}
              </button>
            </div>

            {/* Font card */}
            <div style={{ ...card, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
                    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Fonte</span>
                </div>
                <button
                  onClick={() => { update("name_font", "default"); update("text_font", "default"); }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "3px 10px", color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                  </svg>
                  Resetar
                </button>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <FontPicker label="Nome"  value={form.name_font} onChange={v => update("name_font", v)} />
                <FontPicker label="Texto" value={form.text_font} onChange={v => update("text_font", v)} />
              </div>

              <button onClick={saveFont} disabled={saving === "font"} style={saveBtn(saveFont, saving === "font")}>
                {saving === "font" ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>

          {/* Get Premium banner */}
          {!premiumDismissed && (
            <div style={{
              position: "relative", borderRadius: 16, padding: "1.25rem 1.5rem",
              background: "linear-gradient(135deg,#1a1040,#0f1a4a,#1a1040)",
              border: "1px solid rgba(124,92,252,0.3)",
              overflow: "hidden",
            }}>
              {/* Stars decoration */}
              {["8%,20%","80%,12%","55%,60%","20%,70%","90%,50%","40%,15%"].map((pos, i) => (
                <div key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], color: "rgba(255,255,255,0.3)", fontSize: i % 2 === 0 ? 10 : 6 }}>★</div>
              ))}

              {/* Close */}
              <button onClick={() => setPremiumDismissed(true)} style={{
                position: "absolute", top: "0.85rem", right: "0.85rem",
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6,
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.6)",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Obter Premium</span>
              </div>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, maxWidth: 480 }}>
                Leve seu perfil ao próximo nível com recursos premium como fontes personalizadas, animações, efeitos, e muito mais.
              </p>
              <a href="/premium" style={{ display: "inline-block", background: "#7c5cfc", border: "none", borderRadius: 9, padding: "0.55rem 1.3rem", color: "#fff", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
                Upgrade agora
              </a>
            </div>
          )}

          {/* Enhancements card */}
          <div style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Melhorias</span>
            </div>

            {/* Effects row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {["Efeito de Nome", "Efeito de Bio"].map(label => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 8, cursor: "not-allowed", opacity: 0.6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.7)" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Overlay row */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { label: "Nenhum", sub: "Page Overlay", active: true },
                { label: "Premium", sub: "Cursor Trail", active: false },
                { label: "Premium", sub: "Efeito de Fundo", active: false },
              ].map(item => (
                <div key={item.sub} style={{
                  flex: 1, background: item.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${item.active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 10, padding: "0.75rem", cursor: item.active ? "pointer" : "not-allowed",
                  opacity: item.active ? 1 : 0.5,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    {!item.active && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.7)" strokeWidth={2}>
                        <path d="M6 3h12l4 6-10 12L2 9z"/>
                      </svg>
                    )}
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{item.sub}</span>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {[
                { label: "Animar Views", on: false },
                { label: "Tilting Card", on: false },
                { label: "Ícones Brilhantes", on: true },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  </svg>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{item.label}</span>
                  <div style={{ width: 38, height: 20, borderRadius: 10, background: item.on ? "#7c5cfc" : "rgba(255,255,255,0.1)", position: "relative", cursor: "not-allowed" }}>
                    <div style={{ position: "absolute", top: 3, left: item.on ? 20 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.6)" strokeWidth={2}><path d="M6 3h12l4 6-10 12L2 9z"/></svg>
              <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Visualizador de Áudio</span>
              <div style={{ width: 38, height: 20, borderRadius: 10, background: "rgba(255,255,255,0.1)", position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: 3, width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
              </div>
            </div>

            <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
              Melhorias interativas em breve.
            </p>
          </div>

        </div>

        {/* ── RIGHT PREVIEW ── */}
        <div style={{ flexShrink: 0, position: "sticky", top: "1.5rem" }}>
          <p style={{ margin: "0 0 0.85rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Preview
          </p>
          <AppearancePreview form={form} profile={profile} links={links} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "1.5rem", zIndex: 999, background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${toast.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: 10, padding: "0.6rem 1rem", color: toast.ok ? "#6ee7b7" : "#fca5a5", fontSize: "0.85rem", fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
