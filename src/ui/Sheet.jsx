import { useEffect } from "react";
import { useGhostClickShield } from "../hooks/useGhostClickShield.js";
import Icon from "./Icon.jsx";

// Gedeelde bottom-sheet. Sluit op een tik naast het paneel en op Escape;
// vergrendelt de achtergrond-scroll. `backdrop="light"`: nauwelijks gedimd,
// voor sheets waarbij je de inhoud erachter wilt blijven zien (zoals het
// blok-menu in de editor).
export default function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
  backdrop = "dark",
}) {
  const shield = useGhostClickShield();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          backdrop === "light" ? "rgba(0,0,0,.08)" : "rgba(0,0,0,.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      {...shield}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: "var(--card)",
          borderRadius: "var(--r-xl) var(--r-xl) 0 0",
          boxShadow: "var(--shadow-float)",
          padding:
            "var(--sp-4) var(--sp-5) calc(var(--sp-5) + env(safe-area-inset-bottom))",
          width: "100%",
          maxWidth: 540,
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "fadeUp .25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--sp-2)",
            marginBottom: subtitle ? 0 : "var(--sp-3)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-lg)",
              fontWeight: 600,
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 44,
              height: 44,
              marginRight: -10,
              borderRadius: "var(--r-pill)",
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={22} />
          </button>
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              marginBottom: "var(--sp-3)",
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
        {footer && (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
