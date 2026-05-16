"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  uploadAsset,
  deleteAsset,
  getUserAssets,
  formatBytes,
  type UserAsset,
  type AssetType,
} from "@/lib/assets";

// ── Types ─────────────────────────────────────────────────────
type Tab = "background" | "cursor" | "audio" | "font" | "images" | "videos";
type Profile = {
  userId: string;
  cursorUrl: string | null;
  backgroundUrl: string | null;
  backgroundType: string | null;
  backgroundColor: string | null;
  fontUrl: string | null;
  fontName: string | null;
  audioUrl: string | null;
  audioAutoplay: boolean;
};

// ── Helpers ───────────────────────────────────────────────────
const ACCEPT: Record<Tab, string> = {
  background: "image/*,video/*",
  cursor:     ".png,.svg,.cur,.ani,image/png,image/svg+xml",
  audio:      "audio/*",
  font:       ".ttf,.otf,.woff,.woff2",
  images:     "image/*",
  videos:     "video/*",
};

const ASSET_TYPE_FOR_TAB: Record<Tab, AssetType | null> = {
  background: null, // could be image or video
  cursor:     "cursor",
  audio:      "audio",
  font:       "font",
  images:     "image",
  videos:     "video",
};

const TAB_LABELS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "background", label: "Background", icon: <BgIcon /> },
  { id: "cursor",     label: "Cursor",     icon: <CursorIcon /> },
  { id: "audio",      label: "Audio",      icon: <AudioIcon /> },
  { id: "font",       label: "Fonte",      icon: <FontIcon /> },
  { id: "images",     label: "Imagens",    icon: <ImgIcon /> },
  { id: "videos",     label: "Vídeos",     icon: <VideoIcon /> },
];

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999,
      background: ok ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
      border: `1px solid ${ok ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)"}`,
      borderRadius: 10, padding: "0.6rem 0.75rem 0.6rem 1rem",
      color: ok ? "#6ee7b7" : "#fca5a5", fontSize: "0.85rem", fontWeight: 500,
      display: "flex", alignItems: "center", gap: "0.65rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      {ok
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, padding: "2px", display: "flex", marginLeft: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// ── Upload Drop Zone ──────────────────────────────────────────
function DropZone({
  accept, label, loading, onFiles,
}: {
  accept: string; label: string; loading: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
      onClick={() => !loading && ref.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "#7c5cfc" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 12, padding: "2rem 1rem",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, cursor: loading ? "default" : "pointer",
        background: dragging ? "rgba(124,92,252,0.06)" : "rgba(255,255,255,0.02)",
        transition: "border-color 0.15s, background 0.15s", marginBottom: "1.5rem",
      }}
    >
      <input ref={ref} type="file" accept={accept} multiple style={{ display: "none" }}
        onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) { onFiles(f); e.target.value = ""; } }}
      />
      {loading
        ? <Spinner />
        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      }
      <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        {loading ? "Enviando…" : label}
      </span>
    </div>
  );
}

// ── Asset Card ────────────────────────────────────────────────
function AssetCard({
  asset, isActive, onSetActive, onDelete,
}: {
  asset: UserAsset; isActive: boolean;
  onSetActive: (asset: UserAsset) => void;
  onDelete: (asset: UserAsset) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const preview = (() => {
    if (asset.type === "image" || asset.type === "cursor") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt={asset.name}
          style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.03)" }} />
      );
    }
    if (asset.type === "video") {
      return (
        <video src={asset.url} muted style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6 }} />
      );
    }
    if (asset.type === "audio") {
      return (
        <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,92,252,0.08)", borderRadius: 6 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,252,0.8)" strokeWidth={1.5}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
      );
    }
    if (asset.type === "font") {
      return (
        <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,87,166,0.08)", borderRadius: 6 }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: "rgba(248,87,166,0.8)" }}>Aa</span>
        </div>
      );
    }
    return null;
  })();

  return (
    <div style={{
      background: isActive ? "rgba(124,92,252,0.12)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isActive ? "rgba(124,92,252,0.45)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12, padding: "0.75rem", position: "relative",
    }}>
      {isActive && (
        <div style={{ position: "absolute", top: 8, right: 8, background: "#7c5cfc", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700, color: "#fff", padding: "2px 7px" }}>
          Ativo
        </div>
      )}
      {preview}
      <p style={{ margin: "0.5rem 0 0.1rem", fontSize: "0.78rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</p>
      <p style={{ margin: "0 0 0.6rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{formatBytes(asset.size)}</p>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onSetActive(asset)}
          disabled={isActive}
          style={{
            flex: 1, padding: "0.35rem 0", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600,
            background: isActive ? "rgba(124,92,252,0.2)" : "rgba(124,92,252,0.15)",
            border: "1px solid rgba(124,92,252,0.3)", color: isActive ? "rgba(124,92,252,0.5)" : "#a78bfa",
            cursor: isActive ? "default" : "pointer", fontFamily: "inherit",
          }}
        >
          {isActive ? "Em uso" : "Usar"}
        </button>
        <button
          onClick={async () => {
            setDeleting(true);
            await onDelete(asset);
            setDeleting(false);
          }}
          disabled={deleting}
          style={{
            width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", cursor: deleting ? "default" : "pointer", flexShrink: 0,
          }}
        >
          {deleting ? <Spinner size={12} /> : <TrashIcon />}
        </button>
      </div>
    </div>
  );
}

// ── Background Tab ─────────────────────────────────────────────
function BackgroundTab({ profile, assets, onSetActive, onDelete, onUpload, uploading }: {
  profile: Profile | null;
  assets: UserAsset[];
  onSetActive: (asset: UserAsset) => void;
  onDelete: (asset: UserAsset) => void;
  onUpload: (files: File[], type: AssetType) => void;
  uploading: boolean;
}) {
  const bgAssets = assets.filter((a) => a.type === "image" || a.type === "video");
  return (
    <div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
        Imagem ou vídeo de fundo do seu perfil. Recomendado: 1920×1080px.
      </p>
      <DropZone
        accept="image/*,video/*"
        label="Arraste ou clique para enviar imagem ou vídeo de fundo"
        loading={uploading}
        onFiles={(files) => {
          const file = files[0];
          const type: AssetType = file.type.startsWith("video/") ? "video" : "image";
          onUpload([file], type);
        }}
      />
      {bgAssets.length === 0
        ? <EmptyState label="Nenhum background enviado ainda." />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
            {bgAssets.map((a) => (
              <AssetCard
                key={a.id} asset={a}
                isActive={profile?.backgroundUrl === a.url}
                onSetActive={onSetActive}
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Generic Asset Tab ─────────────────────────────────────────
function GenericAssetTab({ tab, assets, profile, onSetActive, onDelete, onUpload, uploading }: {
  tab: Tab; assets: UserAsset[]; profile: Profile | null;
  onSetActive: (asset: UserAsset) => void;
  onDelete: (asset: UserAsset) => void;
  onUpload: (files: File[], type: AssetType) => void;
  uploading: boolean;
}) {
  const type = ASSET_TYPE_FOR_TAB[tab]!;
  const hints: Record<string, string> = {
    cursor: "Arquivo .PNG, .SVG ou .CUR. Tamanho recomendado: 32×32px.",
    audio:  "MP3, OGG ou WAV. Toque de fundo do seu perfil.",
    font:   "TTF, OTF, WOFF ou WOFF2.",
    images: "JPG, PNG, WebP, GIF, SVG…",
    videos: "MP4, WebM ou MOV.",
  };
  const labels: Record<string, string> = {
    cursor: "Arraste ou clique para enviar cursor",
    audio:  "Arraste ou clique para enviar áudio",
    font:   "Arraste ou clique para enviar fonte",
    images: "Arraste ou clique para enviar imagens",
    videos: "Arraste ou clique para enviar vídeos",
  };

  const isActive = (a: UserAsset) => {
    if (type === "cursor") return profile?.cursorUrl === a.url;
    if (type === "audio")  return profile?.audioUrl  === a.url;
    if (type === "font")   return profile?.fontUrl   === a.url;
    return false;
  };

  return (
    <div>
      {hints[tab] && (
        <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>{hints[tab]}</p>
      )}
      <DropZone
        accept={ACCEPT[tab]}
        label={labels[tab]}
        loading={uploading}
        onFiles={(files) => onUpload(files, type)}
      />
      {assets.length === 0
        ? <EmptyState label={`Nenhum arquivo enviado ainda.`} />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
            {assets.map((a) => (
              <AssetCard
                key={a.id} asset={a}
                isActive={isActive(a)}
                onSetActive={onSetActive}
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function EffectsPage() {
  const [tab, setTab] = useState<Tab>("background");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => setToast({ msg, ok }), []);

  // Load profile + all assets
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, assetsData] = await Promise.all([
        supabase.from("profiles").select(
          "user_id,cursor_url,background_url,background_type,background_color,font_url,font_name,audio_url,audio_autoplay"
        ).eq("user_id", user.id).single(),
        getUserAssets(),
      ]);

      if (prof) {
        setProfile({
          userId: prof.user_id,
          cursorUrl: prof.cursor_url,
          backgroundUrl: prof.background_url,
          backgroundType: prof.background_type,
          backgroundColor: prof.background_color,
          fontUrl: prof.font_url,
          fontName: prof.font_name,
          audioUrl: prof.audio_url,
          audioAutoplay: prof.audio_autoplay ?? false,
        });
      }
      setAssets(assetsData);
    })();
  }, []);

  // Filter assets for current tab
  const tabAssets = (() => {
    if (tab === "background") return assets.filter((a) => a.type === "image" || a.type === "video");
    const type = ASSET_TYPE_FOR_TAB[tab];
    return type ? assets.filter((a) => a.type === type) : [];
  })();

  async function handleUpload(files: File[], type: AssetType) {
    if (!profile) return;
    setUploading(true);
    const results = await Promise.all(files.map((f) => uploadAsset(f, profile.userId, type)));
    const uploaded = results.filter(Boolean) as UserAsset[];
    if (uploaded.length) {
      setAssets((prev) => [...uploaded, ...prev]);
      showToast(`${uploaded.length} arquivo(s) enviado(s) com sucesso!`, true);
    } else {
      showToast("Falha ao enviar. Tente novamente.", false);
    }
    setUploading(false);
  }

  async function handleSetActive(asset: UserAsset) {
    if (!profile) return;
    const supabase = createClient();

    const update: Record<string, unknown> = {};
    if (asset.type === "cursor") { update.cursor_url = asset.url; }
    else if (asset.type === "audio") { update.audio_url = asset.url; }
    else if (asset.type === "font") { update.font_url = asset.url; update.font_name = asset.name; }
    else if (asset.type === "image") { update.background_url = asset.url; update.background_type = "image"; }
    else if (asset.type === "video") { update.background_url = asset.url; update.background_type = "video"; }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("user_id", profile.userId);

    if (error) {
      showToast("Erro ao salvar. Tente novamente.", false);
      return;
    }

    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (asset.type === "cursor") next.cursorUrl = asset.url;
      else if (asset.type === "audio") next.audioUrl = asset.url;
      else if (asset.type === "font") { next.fontUrl = asset.url; next.fontName = asset.name; }
      else if (asset.type === "image" || asset.type === "video") {
        next.backgroundUrl = asset.url;
        next.backgroundType = asset.type;
      }
      return next;
    });

    showToast("Efeito aplicado com sucesso!", true);
  }

  async function handleDelete(asset: UserAsset) {
    const ok = await deleteAsset(asset);
    if (ok) {
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      // Clear from profile if it was active
      const supabase = createClient();
      if (profile) {
        const clear: Record<string, null> = {};
        if (asset.type === "cursor" && profile.cursorUrl === asset.url) clear.cursor_url = null;
        if (asset.type === "audio"  && profile.audioUrl  === asset.url) clear.audio_url  = null;
        if (asset.type === "font"   && profile.fontUrl   === asset.url) { clear.font_url = null; clear.font_name = null; }
        if ((asset.type === "image" || asset.type === "video") && profile.backgroundUrl === asset.url) clear.background_url = null;
        if (Object.keys(clear).length > 0) {
          await supabase.from("profiles").update(clear).eq("user_id", profile.userId);
          setProfile((prev) => prev ? { ...prev, ...Object.fromEntries(Object.keys(clear).map((k) => {
            const map: Record<string, string> = { cursor_url: "cursorUrl", audio_url: "audioUrl", font_url: "fontUrl", font_name: "fontName", background_url: "backgroundUrl" };
            return [map[k] ?? k, null];
          })) } : prev);
        }
      }
      showToast("Asset removido.", true);
    } else {
      showToast("Erro ao remover. Tente novamente.", false);
    }
  }

  const totalSize = assets.reduce((acc, a) => acc + (a.size ?? 0), 0);

  return (
    <div className="db-page-wrap" style={{ padding: "2rem 2.5rem 3rem", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.35rem", fontWeight: 800, color: "#fff" }}>Efeitos & Assets</h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
          Gerencie os assets do seu perfil — background, cursor, áudio, fonte e mais.
          &nbsp;·&nbsp;
          <span style={{ color: "rgba(255,255,255,0.25)" }}>{assets.length} arquivo(s) · {formatBytes(totalSize)}</span>
        </p>
      </div>

      {/* Active effects summary */}
      {profile && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {[
            { label: "Background", value: profile.backgroundUrl ? "✓ Definido" : "Nenhum", active: !!profile.backgroundUrl },
            { label: "Cursor",     value: profile.cursorUrl     ? "✓ Definido" : "Nenhum", active: !!profile.cursorUrl },
            { label: "Áudio",      value: profile.audioUrl      ? "✓ Definido" : "Nenhum", active: !!profile.audioUrl },
            { label: "Fonte",      value: profile.fontName      ?? "Padrão",                active: !!profile.fontUrl },
          ].map((item) => (
            <div key={item.label} style={{
              background: item.active ? "rgba(124,92,252,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${item.active ? "rgba(124,92,252,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "0.35rem 0.75rem",
              fontSize: "0.78rem", color: item.active ? "#a78bfa" : "rgba(255,255,255,0.35)",
            }}>
              <span style={{ fontWeight: 600 }}>{item.label}:</span> {item.value}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TAB_LABELS.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: active ? 700 : 500,
                background: active ? "rgba(124,92,252,0.2)" : "transparent",
                border: `1px solid ${active ? "rgba(124,92,252,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: active ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, display: "flex" }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.5rem" }}>
        {tab === "background"
          ? <BackgroundTab
              profile={profile} assets={assets}
              onSetActive={handleSetActive} onDelete={handleDelete}
              onUpload={handleUpload} uploading={uploading}
            />
          : <GenericAssetTab
              tab={tab} assets={tabAssets} profile={profile}
              onSetActive={handleSetActive} onDelete={handleDelete}
              onUpload={handleUpload} uploading={uploading}
            />
        }
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function BgIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function CursorIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></svg>; }
function AudioIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function FontIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function ImgIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function VideoIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>; }
function TrashIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
}
function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0", color: "rgba(255,255,255,0.2)", fontSize: "0.83rem" }}>{label}</div>
  );
}
