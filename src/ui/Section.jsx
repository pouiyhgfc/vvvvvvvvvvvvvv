import { useId, useState } from "react";
import Icon from "./Icon.jsx";

// Inklapbare instellingen-sectie als witte kaart (ontwerp B). De kop is een
// echte knop (toetsenbord, schermlezer). `right` is een optionele actie in de
// kop (bv. "+ Nieuw"); `tone="danger"` kleurt de titel rood.
export default function Section({
  title,
  icon,
  right,
  tone = "default",
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const color = tone === "danger" ? "var(--danger-text)" : "var(--text)";
  return (
    <section
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        marginBottom: "var(--sp-3)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 var(--sp-2) 0 18px",
            border: "none",
            background: "transparent",
            color,
            textAlign: "left",
          }}
        >
          {icon != null && (
            <span
              style={{
                display: "inline-flex",
                color: tone === "danger" ? color : "var(--text-muted)",
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              flex: 1,
              fontSize: "var(--fs-md)",
              fontWeight: 500,
            }}
          >
            {title}
          </span>
          <Icon
            name="caret-down"
            size={18}
            style={{
              color: "var(--text-muted)",
              transition: "transform .2s",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </button>
        {right && <div style={{ paddingRight: 14 }}>{right}</div>}
      </div>
      {open && (
        <div id={bodyId} style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
      )}
    </section>
  );
}
