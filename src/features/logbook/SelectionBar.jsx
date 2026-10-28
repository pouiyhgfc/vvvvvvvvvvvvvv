import Icon from "../../ui/Icon.jsx";

// Actiebalk onderin zolang er notities geselecteerd zijn.
export default function SelectionBar({ onPin, onArchive, onMove, onTrash }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 150,
        display: "flex",
        justifyContent: "center",
        gap: 8,
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--card)",
        borderTop: "1px solid var(--border-mid)",
        boxShadow: "0 -2px 10px var(--shadow)",
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
