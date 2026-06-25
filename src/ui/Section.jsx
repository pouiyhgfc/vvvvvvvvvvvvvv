import { useState } from "react";

// Inklapbare instellingen-sectie (accordion). Default ingeklapt.
// `right` is een optionele actie-node in de kop (bv. een "+"-knop).
export default function Section({
  title,
  icon,
  right,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: "var(--card2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
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
            fontSize: 14,
            fontWeight: 700,
            flex: 1,
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
