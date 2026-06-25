import { useEffect } from "react";
import Button from "./Button.jsx";

// Gecentreerd bevestig-dialoog. Vervangt native confirm().
// - Standaard: bevestig/annuleer.
// - `actions`: lijst van keuze-knoppen (bv. "hele reeks" vs "alleen deze dag").
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Verwijderen",
  cancelLabel = "Annuleer",
  danger = true,
  actions,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 360,
          animation: "fadeUp .2s ease",
          boxShadow: "0 12px 40px rgba(0,0,0,.3)",
        }}
      >
        {title && (
          <h3
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {title}
          </h3>
        )}
        {message && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </p>
        )}
        {actions ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map((a, i) => (
              <Button
                key={i}
                variant={a.variant || "secondary"}
                full
                onClick={a.onClick}
              >
                {a.label}
              </Button>
            ))}
            <Button variant="ghost" full onClick={onCancel}>
              {cancelLabel}
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? "dangerSolid" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
