import { useState } from "react";

const TONES = {
  default: {
    bg: "var(--card2)",
    border: "var(--border)",
    title: "var(--text)",
  },
  accent: {
    bg: "var(--accent-bg)",
    border: "var(--accent-border)",
    title: "var(--accent-text)",
  },
  danger: {
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
    title: "var(--danger-text)",
  },
};

// Inklapbare instellingen-sectie (accordion). `right` is een optionele
// actie-node in de kop (bv. een "+"-knop); `tone` kleurt de sectie.
export default function Section({
  title,
  icon,
  right,
  tone = "default",
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const t = TONES[tone];
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 12,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            transition: "transform .2s",
            transform: open ? "rotate(90deg)" : "none",
            display: "inline-block",
          }}
        >
          ▸
        </span>
        {icon != null && <span style={{ display: "inline-flex" }}>{icon}</span>}
        <h3
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: 15,
            fontWeight: 600,
            flex: 1,
            color: t.title,
          }}
        >
          {title}
        </h3>
        {right && <div onClick={(e) => e.stopPropagation()}>{right}</div>}
      </div>
      {open && <div style={{ padding: "0 12px 12px" }}>{children}</div>}
    </div>
  );
}
