import Button from "../../ui/Button.jsx";
import Icon from "../../ui/Icon.jsx";

// Balk onderin tijdens selecteren: aantal, Alles selecteren en Annuleren
// (ook na scrollen bereikbaar), en de acties zodra er iets geselecteerd is.
export default function SelectionBar({
  count,
  onSelectAll,
  onCancel,
  onPin,
  onArchive,
  onMove,
  onTrash,
}) {
  return (
    <div
      role="toolbar"
      aria-label="Selectie"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 150,
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--card)",
        borderTop: "1px solid var(--border-mid)",
        boxShadow: "0 -2px 10px var(--shadow)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontWeight: 600 }}>{count} geselecteerd</span>
        <Button variant="secondary" size="sm" onClick={onSelectAll}>
          Alles selecteren
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
      {count > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 6,
          }}
        >
          <button
            onClick={onPin}
            aria-label="Vastzetten"
            title="Vastzetten"
            style={metaBtn}
          >
            <Icon name="push-pin" size={22} />
          </button>
          <button
            onClick={onArchive}
            aria-label="Archiveren"
            title="Archiveren"
            style={metaBtn}
          >
            <Icon name="archive" size={22} />
          </button>
          <button
            onClick={onMove}
            aria-label="Verplaatsen naar…"
            title="Verplaatsen naar…"
            style={metaBtn}
          >
            <Icon name="folder-open" size={22} />
          </button>
          <button
            onClick={onTrash}
            aria-label="Naar prullenbak"
            title="Naar prullenbak"
            style={metaBtn}
          >
            <Icon name="trash" size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

const metaBtn = {
  width: 44,
  height: 44,
  borderRadius: 99,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  flexShrink: 0,
};
