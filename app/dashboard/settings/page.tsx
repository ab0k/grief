"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "account" | "metadata" | "comments";
type Profile = {
  userId: string;
  username: string;
  email: string;
  uid: number;
  hasDiscord: boolean;
  pageTitle: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
};

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
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
      {/* checkmark / error icon */}
      <span style={{ display: "flex", flexShrink: 0 }}>
        {ok
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        }
      </span>
      <span>{msg}</span>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, padding: "2px", display: "flex", flexShrink: 0, marginLeft: 4 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 999, cursor: "pointer", flexShrink: 0, background: on ? "#7c5cfc" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
      <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

/* ── Upload modal ───────────────────────────────────────────── */
function UploadModal({ title, hint, onConfirm, onClose }: {
  title: string;
  hint: string;
  onConfirm: (file: File | null, url: string, localPreview: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setUrlInput(f.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirm() {
    setLoading(true);
    await onConfirm(file, urlInput, preview);
    setLoading(false);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "5px 6px", display: "flex" }}>
              <UploadIcon />
            </span>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>×</button>
        </div>
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{hint}</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: "relative",
            border: `2px dashed ${dragging ? "#7c5cfc" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 10,
            minHeight: 130,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            marginBottom: "1rem",
            overflow: "hidden",
            background: dragging ? "rgba(124,92,252,0.07)" : "transparent",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" style={{ maxHeight: 120, maxWidth: "100%", objectFit: "contain", borderRadius: 6 }} />
          ) : (
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.25)" }}>
              {urlInput || "Click or drag an image here"}
            </span>
          )}

          {/* Delete button */}
          {(preview || urlInput) && (
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(239,68,68,0.85)", border: "none", borderRadius: 7,
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <TrashIcon />
            </button>
          )}
        </div>

        {/* URL input */}
        <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Or paste a URL</p>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => { setUrlInput(e.target.value); setFile(null); setPreview(null); }}
          placeholder="https://..."
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.55rem 0.75rem", color: "#fff", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "1rem" }}
        />

        <button
          onClick={confirm}
          disabled={loading || (!file && !urlInput)}
          style={{ width: "100%", background: "linear-gradient(135deg,#7c5cfc,#a855f7)", border: "none", borderRadius: 9, padding: "0.65rem", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", opacity: (loading || (!file && !urlInput)) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {loading ? <><Spinner /> Uploading…</> : "Confirm"}
        </button>
      </div>
    </div>
  );
}

/* ── Edit modal ─────────────────────────────────────────────── */
function EditModal({ title, label, type = "text", current, onSave, onClose }: {
  title: string; label: string; type?: string; current?: string;
  onSave: (val: string) => Promise<string | null>; onClose: () => void;
}) {
  const [val, setVal] = useState(current ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const error = await onSave(val);
    if (error) { setErr(error); setLoading(false); } else onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 4 }}>{label}</label>
            <input type={type} value={val} onChange={(e) => setVal(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.55rem 0.75rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              autoFocus />
          </div>
          {err && <p style={{ margin: 0, fontSize: "0.8rem", color: "#f87171" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: "0.5rem 1rem", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Comments modal ─────────────────────────────────────────── */
function CommentsModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#7c5cfc" }}><ChatIcon /></span>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Comments</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Newest first</span>
          <button style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.45rem 1rem", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span> New Comment
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "2rem 0" }}>No comments yet.</p>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("account");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commentsOn, setCommentsOn] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [editModal, setEditModal] = useState<null | "username" | "email" | "password">(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const skipTitleBlurRef = useRef(false);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<null | "favicon" | "og">(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles")
        .select("id, username, page_title, favicon_url, og_image_url")
        .eq("user_id", user.id).single();
      const hasDiscord = (user.identities ?? []).some((i) => i.provider === "discord");
      const loaded: Profile = {
        userId:     user.id,
        uid:        p?.id ?? 0,
        username:   p?.username ?? user.email?.split("@")[0] ?? "user",
        email:      user.email ?? "",
        hasDiscord,
        pageTitle:  p?.page_title ?? "",
        faviconUrl: p?.favicon_url ?? null,
        ogImageUrl: p?.og_image_url ?? null,
      };
      setProfile(loaded);
      setTitleDraft(loaded.pageTitle);
      setFaviconPreview(loaded.faviconUrl);
      setOgImagePreview(loaded.ogImageUrl);
    })();
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Upload helper ── */
  async function uploadFile(file: File, path: string): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fullPath = `${path}.${ext}`;
    const { error } = await supabase.storage
      .from("profile-media")
      .upload(fullPath, file, { upsert: true, contentType: file.type });
    if (error) { showToast("Erro no upload: " + error.message, false); return null; }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(fullPath);
    // Append timestamp to bust CDN cache on re-upload of same filename
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  /* ── Favicon confirm (from modal) ── */
  async function handleFaviconConfirm(file: File | null, urlStr: string, localPreview: string | null) {
    if (!profile) return;
    // Optimistic preview while uploading
    const optimistic = localPreview ?? urlStr;
    if (optimistic) setFaviconPreview(optimistic);

    const supabase = createClient();
    let url = urlStr;
    if (file) {
      const uploaded = await uploadFile(file, `${profile.userId}/favicon`);
      if (!uploaded) {
        // Revert preview — upload failed (toast already shown by uploadFile)
        setFaviconPreview(profile.faviconUrl);
        return;
      }
      url = uploaded;
    }
    if (!url) { setFaviconPreview(profile.faviconUrl); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ favicon_url: url })
      .eq("user_id", profile.userId);

    if (error) {
      setFaviconPreview(profile.faviconUrl);
      showToast("Erro ao salvar favicon. Tente novamente.", false);
      return;
    }

    setFaviconPreview(url);
    setProfile((p) => p ? { ...p, faviconUrl: url } : p);
    showToast("Favicon atualizado!");
  }

  /* ── OG image confirm (from modal) ── */
  async function handleOgConfirm(file: File | null, urlStr: string, localPreview: string | null) {
    if (!profile) return;
    // Optimistic preview while uploading
    const optimistic = localPreview ?? urlStr;
    if (optimistic) setOgImagePreview(optimistic);

    const supabase = createClient();
    let url = urlStr;
    if (file) {
      const uploaded = await uploadFile(file, `${profile.userId}/og-image`);
      if (!uploaded) {
        setOgImagePreview(profile.ogImageUrl);
        return;
      }
      url = uploaded;
    }
    if (!url) { setOgImagePreview(profile.ogImageUrl); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ og_image_url: url })
      .eq("user_id", profile.userId);

    if (error) {
      setOgImagePreview(profile.ogImageUrl);
      showToast("Erro ao salvar imagem OG. Tente novamente.", false);
      return;
    }

    setOgImagePreview(url);
    setProfile((p) => p ? { ...p, ogImageUrl: url } : p);
    showToast("Imagem OG atualizada!");
  }

  /* ── Save title ── */
  async function saveTitle() {
    if (!profile) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ page_title: titleDraft })
      .eq("user_id", profile.userId);
    if (error) {
      showToast("Erro ao salvar título. Tente novamente.", false);
      return;
    }
    setProfile((p) => p ? { ...p, pageTitle: titleDraft } : p);
    setEditingTitle(false);
    showToast("Título salvo!");
  }

  /* ── Account edits ── */
  async function saveUsername(val: string): Promise<string | null> {
    if (!val.trim()) return "Username cannot be empty.";
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Not authenticated.";
    const { error } = await supabase.from("profiles").update({ username: val.trim() }).eq("user_id", user.id);
    if (error) return error.message;
    setProfile((p) => p ? { ...p, username: val.trim() } : p);
    showToast("Username updated!"); return null;
  }
  async function saveEmail(val: string): Promise<string | null> {
    if (!val.includes("@")) return "Enter a valid email.";
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: val });
    if (error) return error.message;
    setProfile((p) => p ? { ...p, email: val } : p);
    showToast("Confirmation email sent!"); return null;
  }
  async function savePassword(val: string): Promise<string | null> {
    if (val.length < 6) return "Min. 6 characters.";
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: val });
    if (error) return error.message;
    showToast("Password updated!"); return null;
  }

  const C = { muted: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.07)" };
  const displayTitle = (profile?.pageTitle || `${profile?.username} (@${profile?.username})`) ;

  return (
    <div className="db-page-wrap" style={{ padding: "1.75rem 2rem 3rem", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <span style={{ background: "rgba(124,92,252,0.15)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <SettingsIconLg />
        </span>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: "1.75rem" }}>
        {(["account","metadata","comments"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0.65rem 1.1rem", fontSize: "0.88rem", fontWeight: tab === t ? 600 : 500, color: tab === t ? "#fff" : C.muted, borderBottom: `2px solid ${tab === t ? "#7c5cfc" : "transparent"}`, marginBottom: -1, transition: "color 0.15s", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ══ ACCOUNT ══ */}
      {tab === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 900 }}>
          {/* Premium */}
          <div style={{ background: "linear-gradient(135deg, rgba(124,92,252,0.15), rgba(248,87,166,0.1))", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "1.8rem" }}>💎</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Upgrade to Premium</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: C.muted }}>One-time payment. No subscriptions. Unlock premium features instantly.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/premium" style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>Upgrade Now</a>
              <button style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>View Features</button>
            </div>
          </div>
          {/* Security notice */}
          <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 12, padding: "0.85rem 1.1rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ color: "#60a5fa", marginTop: 1, fontSize: "0.9rem" }}>ℹ</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#93c5fd", fontSize: "0.88rem" }}>Account Security</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(147,197,253,0.7)" }}>We highly recommend setting an email and password for improved security and account recovery.</p>
            </div>
          </div>
          <Section label="Username" onEdit={() => setEditModal("username")}>
            <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{profile?.username ?? "…"}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.muted }}>Your profile is available at <span style={{ color: "#7c5cfc" }}>grief.cc/{profile?.username ?? "…"}</span></p>
          </Section>
          <Section label="Email" onEdit={() => setEditModal("email")}>
            <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>{profile?.email || "Not set"}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.muted }}>Your account is linked to this email address. You can use it to log in and recover your account.</p>
          </Section>
          <Section label="Password" onEdit={() => setEditModal("password")}>
            <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>••••••••</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.muted }}>Your password is used to secure your account. Make sure it&apos;s strong and unique.</p>
          </Section>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.1rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontWeight: 600, color: "#fff", fontSize: "0.92rem" }}>Discord Sign-in</p>
            {profile?.hasDiscord ? (
              <button style={{ background: "#ed4245", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <DiscordIcon size={15} /> Disconnect
              </button>
            ) : (
              <button style={{ background: "#5865F2", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <DiscordIcon size={15} /> Connect Discord
              </button>
            )}
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: C.muted }}>Use Discord, in addition to your username and email, to access your grief.cc account.</p>
          </div>
        </div>
      )}

      {/* ══ METADATA ══ */}
      {tab === "metadata" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: 900 }}>

          {/* ── Browser Metadata ── */}
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Browser Metadata</p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: C.muted }}>Customize how your profile appears in browser tabs and bookmarks by setting a title and favicon.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setUploadModal("favicon")}
                style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <UploadIcon /> Change Favicon
              </button>
              <button
                onClick={() => setEditingTitle(true)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <PencilIcon /> Edit Title
              </button>
            </div>

            {/* Browser tab preview */}
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.75rem 1rem" }}>
              {/* Window chrome */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ef4444","#f59e0b","#10b981"].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
                {/* Tab bar */}
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Favicon in tab */}
                  {faviconPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faviconPreview} alt="favicon" style={{ width: 14, height: 14, borderRadius: 2, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: 2, background: "linear-gradient(135deg,#7c5cfc,#f857a6)" }} />
                  )}
                  {/* Editable title */}
                  {editingTitle ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      placeholder={`${profile?.username} (@${profile?.username})`}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => { if (!skipTitleBlurRef.current) saveTitle(); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.currentTarget.blur(); }
                        if (e.key === "Escape") { skipTitleBlurRef.current = true; setEditingTitle(false); setTitleDraft(profile?.pageTitle ?? ""); setTimeout(() => { skipTitleBlurRef.current = false; }, 0); }
                        if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); skipTitleBlurRef.current = true; setTitleDraft(""); setTimeout(() => { skipTitleBlurRef.current = false; }, 0); }
                      }}
                      style={{ flex: 1, background: "rgba(124,92,252,0.15)", border: "1px solid #7c5cfc", borderRadius: 4, padding: "1px 6px", color: "#fff", fontSize: "0.8rem", outline: "none", fontFamily: "inherit", minWidth: 0 }}
                    />
                  ) : (
                    <span
                      style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", cursor: "text", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onClick={() => setEditingTitle(true)}
                      title="Click to edit"
                    >
                      {displayTitle}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ height: 56, background: "rgba(255,255,255,0.03)", borderRadius: 6 }} />
            </div>
            {editingTitle && (
              <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                <kbd style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: "0.72rem" }}>Enter</kbd> salvar &nbsp;·&nbsp;
                <kbd style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: "0.72rem" }}>Esc</kbd> cancelar &nbsp;·&nbsp;
                <kbd style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: "0.72rem" }}>Ctrl+Z</kbd> usar nome padrão
              </p>
            )}
          </div>

          {/* ── Social Preview ── */}
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Social Preview (Open Graph)</p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: C.muted }}>Customize how your link looks when shared on Discord, X, and other platforms.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setUploadModal("og")}
                style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <UploadIcon /> Upload custom image
              </button>
              {ogImagePreview && (
                <a href={ogImagePreview} target="_blank" rel="noreferrer"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.5rem 1rem", color: "#fff", fontSize: "0.83rem", textDecoration: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ExternalIcon /> Live Open Graph Image
                </a>
              )}
            </div>

            {/* OG preview card */}
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "rgba(59,130,246,0.12)", borderBottom: "1px solid rgba(59,130,246,0.2)", padding: "0.5rem 1rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#60a5fa" }}>Preview</p>
                <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "rgba(147,197,253,0.6)" }}>Discord embed when sharing your profile.</p>
              </div>
              <div style={{ background: "#0d0d12", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {ogImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ogImagePreview} alt="OG preview" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                ) : null}
                <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "2rem", background: ogImagePreview ? "rgba(0,0,0,0.55)" : "transparent", width: "100%", boxSizing: "border-box" }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{profile?.username ?? "…"}</p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    🔗 /{profile?.username ?? "…"}
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginTop: "1rem", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", gap: 8 }}>
              <span style={{ color: "#60a5fa", fontSize: "0.85rem", flexShrink: 0 }}>ℹ</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "#93c5fd", fontSize: "0.82rem" }}>Note</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(147,197,253,0.65)" }}>Discord may cache Open Graph images for up to an hour. If you don&apos;t see your changes immediately, please wait a bit and try again.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => showToast("Metadata saved!")} style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.25rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Save</button>
          </div>
        </div>
      )}

      {/* ══ COMMENTS ══ */}
      {tab === "comments" && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>Enable Comments</p>
              <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Comments will be shown and users will be able to leave comments on your page.</p>
            </div>
            <Toggle on={commentsOn} onChange={setCommentsOn} />
          </div>
          <button onClick={() => setShowCommentsModal(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem" }}>
            View Comments
          </button>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => showToast("Comments settings saved!")} style={{ background: "#7c5cfc", border: "none", borderRadius: 8, padding: "0.5rem 1.25rem", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Save</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editModal === "username" && <EditModal title="Edit Username" label="New username" current={profile?.username} onSave={saveUsername} onClose={() => setEditModal(null)} />}
      {editModal === "email"    && <EditModal title="Edit Email"    label="New email"    type="email"    current={profile?.email}    onSave={saveEmail}    onClose={() => setEditModal(null)} />}
      {editModal === "password" && <EditModal title="Change Password" label="New password" type="password" onSave={savePassword} onClose={() => setEditModal(null)} />}
      {uploadModal === "favicon" && (
        <UploadModal
          title="Change Favicon"
          hint="Square, at least 16×16px. PNG/ICO recommended."
          onConfirm={handleFaviconConfirm}
          onClose={() => setUploadModal(null)}
        />
      )}
      {uploadModal === "og" && (
        <UploadModal
          title="Upload OG Image"
          hint="Recommended: 1200×630px. PNG or JPG."
          onConfirm={handleOgConfirm}
          onClose={() => setUploadModal(null)}
        />
      )}
      {showCommentsModal && <CommentsModal onClose={() => setShowCommentsModal(false)} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── Section row ─────────────────────────────────────────────── */
function Section({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.1rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</p>
          {children}
        </div>
        <button onClick={onEdit} style={{ background: "none", border: "none", color: "#7c5cfc", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, flexShrink: 0, fontWeight: 500, padding: "2px 0" }}>
          ✎ Edit {label}
        </button>
      </div>
    </div>
  );
}

/* ── Icons / micro components ────────────────────────────────── */
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function Spinner() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>; }
function UploadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function PencilIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function ExternalIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>; }
function SettingsIconLg() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function ChatIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function DiscordIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>; }
