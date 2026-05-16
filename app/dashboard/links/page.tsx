"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ══════════════════ COLOR UTILITIES ══════════════════════════ */
function hexToHsv(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  if (c.length !== 6) return [0, 0, 100];
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [Math.round(h), Math.round(max === 0 ? 0 : (d / max) * 100), Math.round(max * 100)];
}
function hsvToHex(h: number, s: number, v: number): string {
  const sv = s / 100, vv = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.max(0, Math.min(255, Math.round((vv - vv * sv * Math.max(0, Math.min(k, 4 - k, 1))) * 255)));
  };
  return `#${f(5).toString(16).padStart(2, "0")}${f(3).toString(16).padStart(2, "0")}${f(1).toString(16).padStart(2, "0")}`;
}

const COLOR_PRESETS = [
  ["#000000", "#1f1f1f", "#3f3f3f", "#7f7f7f", "#bfbfbf", "#ffffff"],
  ["#7f0011", "#c00018", "#ff0022", "#ff4466", "#ff99aa", "#ffccd5"],
  ["#7f0040", "#bf005f", "#ff007f", "#ff44aa", "#ff99cc", "#ffd6ee"],
  ["#550080", "#7700bb", "#9900ff", "#bb44ff", "#dd99ff", "#f0ccff"],
  ["#1a0080", "#2200bb", "#3300ff", "#6655ff", "#9988ff", "#ccbbff"],
  ["#001a80", "#0022bb", "#0044ff", "#3377ff", "#88aaff", "#bbccff"],
  ["#004466", "#006699", "#0099dd", "#33ccff", "#88eeff", "#ccf6ff"],
  ["#005500", "#007700", "#00aa00", "#33dd33", "#88ee88", "#bbffcc"],
  ["#556600", "#778800", "#aacc00", "#ccee00", "#eeff55", "#f5ffaa"],
  ["#664400", "#996600", "#cc8800", "#ffaa00", "#ffcc55", "#ffe8aa"],
  ["#661100", "#992200", "#cc4400", "#ff5500", "#ff8844", "#ffc0a0"],
];
const SAVED_KEY = "grief_saved_colors";

/* ══════════════════ SAT/VAL PICKER ══════════════════════════ */
function SatValPicker({ hue, sat, val, onChange }: {
  hue: number; sat: number; val: number; onChange: (s: number, v: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const pick = useCallback((cx: number, cy: number) => {
    if (!boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    cbRef.current(
      Math.round(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100))),
      Math.round(Math.max(0, Math.min(100, (1 - (cy - r.top) / r.height) * 100)))
    );
  }, []);

  useEffect(() => {
    const mv = (e: MouseEvent) => { if (dragging.current) pick(e.clientX, e.clientY); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [pick]);

  return (
    <div
      ref={boxRef}
      onMouseDown={(e) => { e.preventDefault(); dragging.current = true; pick(e.clientX, e.clientY); }}
      style={{ position: "relative", width: "100%", height: 150, borderRadius: 7, overflow: "hidden", cursor: "crosshair", userSelect: "none", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", inset: 0, background: `hsl(${hue}, 100%, 50%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1))" }} />
      <div style={{ position: "absolute", left: `${sat}%`, top: `${100 - val}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.5)", pointerEvents: "none" }} />
    </div>
  );
}

/* ══════════════════ HUE SLIDER ══════════════════════════════ */
function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const pick = useCallback((cx: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    cbRef.current(Math.round(Math.max(0, Math.min(360, ((cx - r.left) / r.width) * 360))));
  }, []);

  useEffect(() => {
    const mv = (e: MouseEvent) => { if (dragging.current) pick(e.clientX); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [pick]);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => { e.preventDefault(); dragging.current = true; pick(e.clientX); }}
      style={{ position: "relative", height: 12, borderRadius: 6, cursor: "pointer", userSelect: "none", background: "linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)" }}
    >
      <div style={{ position: "absolute", left: `${(hue / 360) * 100}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.4)", background: `hsl(${hue},100%,50%)`, pointerEvents: "none" }} />
    </div>
  );
}

/* ══════════════════ COLOR PICKER POPUP ══════════════════════ */
function ColorPickerPopup({ value, onChange, onClose }: {
  value: string; onChange: (v: string) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const init = hexToHsv(value);
  const [hue, setHue] = useState(init[0]);
  const [sat, setSat] = useState(init[1]);
  const [val, setVal] = useState(init[2]);
  const [hexInput, setHexInput] = useState(value);
  const [saved, setSaved] = useState<string[]>([]);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]")); } catch {}
  }, []);

  useEffect(() => {
    const hex = hsvToHex(hue, sat, val);
    setHexInput(hex);
    onChange(hex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, sat, val]);

  function applyHex(hex: string) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const [h, s, v] = hexToHsv(hex);
    setHue(h); setSat(s); setVal(v);
  }

  function addSaved() {
    const hex = hsvToHex(hue, sat, val);
    if (saved.includes(hex)) return;
    const next = [hex, ...saved].slice(0, 10);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }
  function removeSaved(c: string) {
    const next = saved.filter((x) => x !== c);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", h), 10);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={popRef}
      style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 600, background: "#111118", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "0.8rem", width: 258, boxShadow: "0 16px 40px rgba(0,0,0,0.75)" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: 3, gap: 3, marginBottom: "0.75rem" }}>
        {(["presets", "custom"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "rgba(255,255,255,0.15)" : "transparent", border: "none", borderRadius: 6, padding: "4px 0", color: tab === t ? "#fff" : "rgba(255,255,255,0.45)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "presets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: "0.75rem", maxHeight: 230, overflowY: "auto" }}>
          {COLOR_PRESETS.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 5 }}>
              {row.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange(c); onClose(); }}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: c.toLowerCase() === value.toLowerCase() ? "2.5px solid #fff" : "2px solid transparent", cursor: "pointer", outline: "none", flexShrink: 0, boxShadow: "0 0 0 1px rgba(0,0,0,0.25)", transition: "transform 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "custom" && (
        <>
          <SatValPicker hue={hue} sat={sat} val={val} onChange={(s, v) => { setSat(s); setVal(v); }} />
          <div style={{ margin: "8px 0" }}><HueSlider hue={hue} onChange={setHue} /></div>
          {/* Saved colors */}
          <div style={{ marginBottom: "0.7rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>Your Colors</span>
              <button onClick={addSaved} style={{ background: "none", border: "none", color: "#7c5cfc", fontSize: "0.71rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>+ Add New</button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", minHeight: 24 }}>
              {saved.map((c) => (
                <div key={c} style={{ position: "relative" }}>
                  <button onClick={() => { applyHex(c); }} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: c.toLowerCase() === hexInput.toLowerCase() ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: "0 0 0 1px rgba(0,0,0,0.3)" }} />
                  <button onClick={(e) => { e.stopPropagation(); removeSaved(c); }} style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.55rem", lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
              {saved.length === 0 && <span style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.22)" }}>No saved colors yet.</span>}
            </div>
          </div>
        </>
      )}

      {/* Hex input */}
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "4px 8px", gap: 5 }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.83rem", fontFamily: "monospace" }}>#</span>
        <input
          value={hexInput.replace("#", "")}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
            setHexInput("#" + raw);
            if (raw.length === 6) applyHex("#" + raw);
          }}
          placeholder="ffffff"
          style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: "0.83rem", outline: "none", fontFamily: "monospace" }}
        />
        <div style={{ width: 18, height: 18, borderRadius: 4, background: hexInput, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ══════════════════ COLOR PICKER FIELD ══════════════════════ */
function ColorPickerField({ label, required, value, onChange }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: `1px solid ${open ? "#7c5cfc" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0.45rem 0.65rem", gap: 8, cursor: "pointer", transition: "border-color 0.15s" }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 5, background: value, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: "monospace", color: "#fff", fontSize: "0.85rem" }}>{value}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", display: "flex" }}><PencilIcon /></span>
      </div>
      {open && <ColorPickerPopup value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ══════════════════ PLATFORM CATALOGUE ══════════════════════ */
const PLATFORMS = [
  { id: "instagram", name: "Instagram",  base: "instagram.com/",          color: "#E1306C", icon: <IGIcon /> },
  { id: "twitter",   name: "Twitter / X", base: "x.com/",                 color: "#1DA1F2", icon: <XIcon /> },
  { id: "tiktok",    name: "TikTok",      base: "tiktok.com/@",           color: "#010101", icon: <TikTokIcon /> },
  { id: "youtube",   name: "YouTube",     base: "youtube.com/@",          color: "#FF0000", icon: <YTIcon /> },
  { id: "twitch",    name: "Twitch",      base: "twitch.tv/",             color: "#9146FF", icon: <TwitchIcon /> },
  { id: "discord",   name: "Discord",     base: "discord.gg/",            color: "#5865F2", icon: <DiscordIcon /> },
  { id: "github",    name: "GitHub",      base: "github.com/",            color: "#333333", icon: <GitHubIcon /> },
  { id: "linkedin",  name: "LinkedIn",    base: "linkedin.com/in/",       color: "#0A66C2", icon: <LinkedInIcon /> },
  { id: "spotify",   name: "Spotify",     base: "open.spotify.com/user/", color: "#1DB954", icon: <SpotifyIcon /> },
  { id: "steam",     name: "Steam",       base: "steamcommunity.com/id/", color: "#1b2838", icon: <SteamIcon /> },
  { id: "telegram",  name: "Telegram",    base: "t.me/",                  color: "#229ED9", icon: <TelegramIcon /> },
  { id: "reddit",    name: "Reddit",      base: "reddit.com/u/",          color: "#FF4500", icon: <RedditIcon /> },
  { id: "snapchat",  name: "Snapchat",    base: "snapchat.com/add/",      color: "#FFFC00", icon: <SnapIcon /> },
  { id: "pinterest", name: "Pinterest",   base: "pinterest.com/",         color: "#E60023", icon: <PinIcon /> },
  { id: "whatsapp",  name: "WhatsApp",    base: "wa.me/",                 color: "#25D366", icon: <WAIcon /> },
  { id: "custom",    name: "Custom Link", base: "",                       color: "#7c5cfc", icon: <LinkIcon /> },
];

type DBLink = { id: number; platform: string; label: string; url: string; position: number; visible: boolean };

/* ══════════════════ TOAST ════════════════════════════════════ */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999, background: ok ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", border: `1px solid ${ok ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)"}`, borderRadius: 10, padding: "0.6rem 0.75rem 0.6rem 1rem", color: ok ? "#6ee7b7" : "#fca5a5", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.65rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {ok ? <CheckCircleIcon /> : <AlertIcon />}
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, padding: 2, display: "flex" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ══════════════════ CUSTOMIZE MODAL ═════════════════════════ */
function CustomizeModal({ iconColor, bgColor, onSave, onClose }: {
  iconColor: string; bgColor: string;
  onSave: (ic: string, bg: string) => Promise<void>; onClose: () => void;
}) {
  const [ic, setIc] = useState(iconColor);
  const [bg, setBg] = useState(bgColor);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await onSave(ic, bg);
    setLoading(false);
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <ModalHeader title="Customize Colors" icon={<PaletteIcon />} onClose={onClose} />
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
          Globally change the colors of your links. This will apply to all links.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <ColorPickerField label="Icon Color" required value={ic} onChange={setIc} />
          <ColorPickerField label="Background Color" value={bg} onChange={setBg} />
        </div>
        <SaveBtn loading={loading} onClick={save} />
      </ModalBox>
    </Overlay>
  );
}

/* ══════════════════ ADD LINK MODAL ══════════════════════════ */
function AddLinkModal({ onSave, onClose }: {
  onSave: (platform: string, label: string, url: string) => Promise<void>; onClose: () => void;
}) {
  const [step, setStep] = useState<"search" | "form">("search");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<typeof PLATFORMS[0] | null>(null);
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = PLATFORMS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  function select(p: typeof PLATFORMS[0]) {
    setChosen(p); setLabel(p.name); setSource(""); setStep("form");
  }

  async function save() {
    if (!chosen || !label.trim()) return;
    setLoading(true);
    const finalUrl = chosen.base ? `https://${chosen.base}${source.trim()}` : source.trim();
    await onSave(chosen.id, label.trim(), finalUrl);
    setLoading(false);
    onClose();
  }

  const previewUrl = chosen?.base ? `${chosen.base}${source}` : source;

  return (
    <Overlay onClose={onClose}>
      <ModalBox style={{ maxWidth: 460 }}>
        <ModalHeader title="Add Link" icon={<LinkIcon />} onClose={onClose} />

        {step === "search" && (
          <>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", display: "flex" }}><SearchIcon /></span>
              <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search platforms…"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "0.55rem 0.75rem 0.55rem 2.2rem", color: "#fff", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ maxHeight: 230, overflowY: "auto", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: 2 }}>
              {filtered.map((p) => (
                <button key={p.id} onClick={() => select(p)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.55rem 0.75rem", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "#fff", fontFamily: "inherit", transition: "background 0.12s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{p.name}</span>
                </button>
              ))}
              {filtered.length === 0 && <p style={{ margin: "1rem 0", textAlign: "center", fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>No platforms found.</p>}
            </div>
            <button onClick={() => select(PLATFORMS.find((p) => p.id === "custom")!)}
              style={{ width: "100%", background: "linear-gradient(135deg,#7c5cfc,#a855f7)", border: "none", borderRadius: 9, padding: "0.6rem", color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Or Create Custom Link
            </button>
          </>
        )}

        {step === "form" && chosen && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", display: "flex" }}><LinkIcon /></span>
              <span style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>{previewUrl || chosen.base || "https://…"}</span>
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} autoFocus />
            </div>
            <div style={{ marginBottom: chosen.base ? "0.35rem" : "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>{chosen.base ? "Source" : "URL"}</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder={chosen.base ? "Your username" : "https://…"} style={inputStyle} />
            </div>
            {chosen.base && <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>This will generate a platform-specific link based on your input.</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("search")} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: "0.6rem 1rem", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>← Back</button>
              <SaveBtn loading={loading} onClick={save} style={{ flex: 1 }} />
            </div>
          </>
        )}
      </ModalBox>
    </Overlay>
  );
}

/* ══════════════════ EDIT LINK MODAL ═════════════════════════ */
function EditLinkModal({ link, onSave, onClose }: {
  link: DBLink; onSave: (id: number, label: string, url: string) => Promise<void>; onClose: () => void;
}) {
  const plat = PLATFORMS.find((p) => p.id === link.platform) ?? PLATFORMS[PLATFORMS.length - 1];
  const baseHttp = plat.base ? `https://${plat.base}` : "";
  const initSource = baseHttp && link.url.startsWith(baseHttp)
    ? link.url.slice(baseHttp.length)
    : link.url;

  const [label, setLabel] = useState(link.label);
  const [source, setSource] = useState(initSource);
  const [loading, setLoading] = useState(false);

  const previewUrl = plat.base ? `${plat.base}${source}` : source;

  async function save() {
    setLoading(true);
    const finalUrl = baseHttp ? `${baseHttp}${source.trim()}` : source.trim();
    await onSave(link.id, label, finalUrl);
    setLoading(false);
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox style={{ maxWidth: 440 }}>
        <ModalHeader title="Edit Link Appearance" icon={<LinkIcon />} onClose={onClose} />

        {/* URL preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", display: "flex", flexShrink: 0 }}><LinkIcon /></span>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewUrl || plat.base || "https://…"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>{plat.base ? "Source" : "URL"}</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder={plat.base ? "Seu usuário" : "https://…"} style={inputStyle} />
          </div>
        </div>
        <SaveBtn loading={loading} onClick={save} />
      </ModalBox>
    </Overlay>
  );
}

/* ══════════════════ LINK MENU ════════════════════════════════ */
function LinkMenu({ visible, onEdit, onToggle, onDelete }: {
  visible: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 6, display: "flex", borderRadius: 6, transition: "color 0.15s, background 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "none"; }}
      >
        <DotsIcon />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, zIndex: 999, minWidth: 140, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
          <MenuBtn icon={<PencilIcon />} label="Edit" onClick={() => { setOpen(false); onEdit(); }} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <MenuBtn icon={visible ? <EyeOffIcon /> : <EyeIcon />} label={visible ? "Hide" : "Show"} onClick={() => { setOpen(false); onToggle(); }} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <MenuBtn icon={<TrashIcon />} label="Delete" onClick={() => { setOpen(false); onDelete(); }} danger />
        </div>
      )}
    </div>
  );
}

/* ══════════════════ MAIN PAGE ════════════════════════════════ */
export default function LinksPage() {
  const [links, setLinks] = useState<DBLink[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#1e1e2a");
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [editLink, setEditLink] = useState<DBLink | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase.from("links").select("*").eq("user_id", user.id).order("position"),
      supabase.from("profiles").select("link_icon_color,link_bg_color").eq("user_id", user.id).single(),
    ]);
    if (rows) setLinks(rows.map((r) => ({ ...r, visible: r.visible ?? true })));
    if (profile) {
      if (profile.link_icon_color) setIconColor(profile.link_icon_color);
      if (profile.link_bg_color)   setBgColor(profile.link_bg_color);
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function addLink(platform: string, label: string, url: string) {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase.from("links").insert({ user_id: userId, platform, label, url, position: links.length, visible: true }).select().single();
    if (data) { setLinks((l) => [...l, { ...data, visible: data.visible ?? true }]); showToast("Link added!"); }
  }

  async function editLinkSave(id: number, label: string, url: string) {
    const supabase = createClient();
    await supabase.from("links").update({ label, url }).eq("id", id);
    setLinks((l) => l.map((x) => x.id === id ? { ...x, label, url } : x));
    showToast("Link updated!");
  }

  async function deleteLink(id: number) {
    const supabase = createClient();
    await supabase.from("links").delete().eq("id", id);
    setLinks((l) => l.filter((x) => x.id !== id));
    showToast("Link deleted!");
    setOpenMenu(null);
  }

  async function toggleVisibility(id: number, current: boolean) {
    const next = !current;
    const supabase = createClient();
    await supabase.from("links").update({ visible: next }).eq("id", id);
    setLinks((l) => l.map((x) => x.id === id ? { ...x, visible: next } : x));
    showToast(next ? "Link is now visible." : "Link hidden from profile.");
    setOpenMenu(null);
  }

  async function saveColors(ic: string, bg: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ link_icon_color: ic, link_bg_color: bg }).eq("user_id", userId);
    setIconColor(ic); setBgColor(bg);
    showToast("Colors saved!");
  }

  const platformOf = (id: string) => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[PLATFORMS.length - 1];

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 3rem", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <LinkIcon color="#7c5cfc" size={18} />
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Links</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: "1.5rem" }}>
        <button onClick={() => setShowCustomize(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <PaletteIcon /> Customize
        </button>
        <button onClick={() => setShowAdd(true)} style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Add Link
        </button>
      </div>

      {links.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", maxWidth: 720 }}>
          {links.map((link) => {
            const plat = platformOf(link.platform);
            return (
              <div key={link.id} style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, background: bgColor, border: `1px solid ${!link.visible ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "0.7rem 1rem", transition: "border-color 0.2s" }}>
                {/* Blur overlay when hidden */}
                {!link.visible && (
                  <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(3px)", background: "rgba(0,0,0,0.35)", borderRadius: 10, zIndex: 1, pointerEvents: "none" }} />
                )}

                {/* Drag handle */}
                <span style={{ color: "rgba(255,255,255,0.2)", cursor: "grab", display: "flex", position: "relative", zIndex: 2 }}><GripIcon /></span>
                {/* Platform icon */}
                <span style={{ width: 34, height: 34, borderRadius: 9, background: plat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                  {plat.icon}
                </span>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "0.74rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#fff" }}>{link.label}</p>
                    <span style={{ fontSize: "0.6rem", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", borderRadius: 4, padding: "2px 6px", fontWeight: 700, letterSpacing: "0.05em" }}>ICON</span>
                    {!link.visible && <span style={{ fontSize: "0.6rem", background: "rgba(239,68,68,0.18)", color: "#f87171", borderRadius: 4, padding: "2px 6px", fontWeight: 700, letterSpacing: "0.05em" }}>HIDDEN</span>}
                  </div>
                </div>
                {/* 3-dot menu */}
                <div style={{ position: "relative", zIndex: 2 }}>
                  <LinkMenu
                    visible={link.visible}
                    onEdit={() => setEditLink(link)}
                    onToggle={() => toggleVisibility(link.id, link.visible)}
                    onDelete={() => deleteLink(link.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem" }}>
          <div style={{ width: "100%", maxWidth: 400, marginBottom: "1.5rem", opacity: 0.15, pointerEvents: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ flex: 1, height: 14, borderRadius: 6, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
              </div>
            ))}
          </div>
          <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#fff", fontSize: "1rem" }}>No Links Found</p>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)" }}>Create your first link to get started.</p>
          <button onClick={() => setShowAdd(true)} style={{ background: "#7c5cfc", border: "none", borderRadius: 9, padding: "0.6rem 1.4rem", color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Add Link
          </button>
        </div>
      )}

      {showAdd       && <AddLinkModal onSave={addLink} onClose={() => setShowAdd(false)} />}
      {showCustomize && <CustomizeModal iconColor={iconColor} bgColor={bgColor} onSave={saveColors} onClose={() => setShowCustomize(false)} />}
      {editLink      && <EditLinkModal link={editLink} onSave={editLinkSave} onClose={() => setEditLink(null)} />}
      {toast         && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ══════════════════ SHARED HELPERS ══════════════════════════ */
function MenuBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: "none", border: "none", padding: "0.6rem 0.9rem", color: danger ? "#f87171" : "rgba(255,255,255,0.78)", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <span style={{ display: "flex", opacity: danger ? 1 : 0.7 }}>{icon}</span>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.55rem 0.75rem", color: "#fff", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const menuItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "0.55rem 0.85rem", color: "rgba(255,255,255,0.75)", fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left" };

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
function ModalBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420, ...style }}>{children}</div>;
}
function ModalHeader({ title, icon, onClose }: { title: string; icon: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 7, padding: "5px 6px", display: "flex" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{title}</span>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>×</button>
    </div>
  );
}
function SaveBtn({ loading, onClick, style }: { loading: boolean; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg,#7c5cfc,#a855f7)", border: "none", borderRadius: 9, padding: "0.65rem", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, ...style }}>
      {loading ? "Saving…" : "Save"}
    </button>
  );
}

/* ══════════════════ ICONS ════════════════════════════════════ */
function LinkIcon({ color = "currentColor", size = 15 }: { color?: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function PaletteIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>; }
function SearchIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function PencilIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function DotsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>; }
function GripIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>; }
function EyeIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function CheckCircleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>; }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }

function IGIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>; }
function XIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function TikTokIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/></svg>; }
function YTIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000"/></svg>; }
function TwitchIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>; }
function DiscordIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>; }
function GitHubIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>; }
function LinkedInIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
function SpotifyIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>; }
function SteamIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/></svg>; }
function TelegramIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>; }
function RedditIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>; }
function SnapIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.3 4.869l-.006.09c-.007.12-.013.238-.016.354.026.1.13.324.51.324.27 0 .602-.09.987-.27l.007-.003c.129-.049.254-.073.374-.073.26 0 .5.1.66.266.19.19.22.416.14.627-.16.42-.62.582-.991.705l-.012.005c-.292.093-.515.175-.604.333-.061.11-.052.239.021.428.1.25.21.53.45.78.17.18.398.316.597.449.23.155.44.297.555.48.067.111.1.244.066.376-.063.255-.27.42-.589.494-.328.07-.757.044-1.335-.123l-.021-.006a4.328 4.328 0 0 0-1.158-.186c-.339 0-.563.067-.751.187-.27.17-.496.458-.744.793a5.8 5.8 0 0 1-.316.407c-.602.7-1.37 1.055-2.285 1.055h-.048c-.915 0-1.683-.355-2.285-1.055a5.8 5.8 0 0 1-.316-.407c-.248-.335-.475-.623-.744-.793-.188-.12-.412-.187-.75-.187-.425 0-.842.078-1.16.186l-.021.006c-.578.167-1.007.193-1.335.123-.318-.074-.526-.24-.589-.494-.033-.132-.001-.265.066-.376.115-.183.325-.325.555-.48.199-.133.428-.27.597-.449.24-.25.35-.53.45-.78.073-.189.082-.318.021-.428-.089-.158-.312-.24-.603-.333l-.013-.005c-.37-.123-.83-.285-.991-.705-.08-.211-.05-.437.14-.627.16-.166.4-.266.66-.266.12 0 .245.024.374.073l.007.003c.385.18.717.27.987.27.38 0 .485-.224.51-.324-.003-.116-.009-.234-.016-.354l-.006-.09c-.103-1.65-.229-3.676.3-4.869C7.859 1.07 11.216.793 12.206.793z"/></svg>; }
function PinIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C8.667 0 6 2.7 6 6c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.667-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>; }
function WAIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>; }
