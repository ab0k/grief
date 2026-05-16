"use client";
import { motion } from "framer-motion";

const C = { card: "#16161e", border: "rgba(255,255,255,0.07)", muted: "rgba(255,255,255,0.4)" };

export function StubTab({ title, description, icon, items }: {
  title: string;
  description: string;
  icon: string;
  items?: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem", padding: "1.1rem", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
        <span style={{ fontSize: "2rem" }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.muted }}>{description}</p>
        </div>
      </div>

      {/* Stats if provided */}
      {items && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {items.map((item) => (
            <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem" }}>
              <p style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 800, color: item.color ?? "#fff" }}>{item.value}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coming soon */}
      <div style={{ background: C.card, border: `1px dashed rgba(255,255,255,0.1)`, borderRadius: 12, padding: "3rem", textAlign: "center" }}>
        <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🔧</span>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Em desenvolvimento</p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.muted }}>
          Esta seção estará disponível em breve. As tabelas Supabase necessárias já foram criadas na migration.
        </p>
      </div>
    </motion.div>
  );
}
