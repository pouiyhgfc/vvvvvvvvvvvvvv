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
  onCopy,
  onDownload,
}) {
  const actions = [
    ["Vastzetten", "push-pin", onPin],
    ["Archiveren", "archive", onArchive],
    ["Verplaatsen naar…", "folder-open", onMove],
    ["Kopiëren", "copy", onCopy],
    ["Downloaden", "download-simple", onDownload],
    ["Naar prullenbak", "trash", onTrash],
  ];
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
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            fontSize: "var(--fs-sm)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {count} geselecteerd
        </span>
        <Button
          variant="secondary"
          size="sm"
          style={noWrap}
          onClick={onSelectAll}
        >
          Alles selecteren
        </Button>
        <Button variant="secondary" size="sm" style={noWrap} onClick={onCancel}>
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
          {actions.map(([label, icon, onClick]) => (
            <button
              key={label}
              onClick={onClick}
              aria-label={label}
              title={label}
              style={metaBtn}
            >
              <Icon name={icon} size={22} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const noWrap = { whiteSpace: "nowrap", flexShrink: 0 };

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
