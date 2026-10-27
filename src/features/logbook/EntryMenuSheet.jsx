import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Acties voor één notitie achter de ⋯-knop. Vastzetten, archiveren en
// verwijderen kan pas als de notitie bestaat (`created`).
export default function EntryMenuSheet({
  created,
  pinned,
  onPin,
  onArchive,
  onSaveTemplate,
  onTrash,
  onClose,
}) {
  const act = (fn) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet title="Notitie" onClose={onClose}>
      {created && (
        <Row
          icon="push-pin"
          label={pinned ? "Losmaken" : "Vastzetten"}
          onClick={act(onPin)}
        />
      )}
      {created && (
        <Row icon="archive" label="Archiveren" onClick={act(onArchive)} />
      )}
      <Row
        icon="floppy-disk"
        label="Opslaan als sjabloon"
        onClick={act(onSaveTemplate)}
      />
      {created && (
        <Row
          icon="trash"
          label="Naar prullenbak"
          danger
          onClick={act(onTrash)}
        />
      )}
    </Sheet>
  );
}

function Row({ icon, label, danger, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "none",
        borderBottom: "1px solid var(--border-soft)",
        background: "transparent",
        color: danger ? "var(--danger-text)" : "var(--text)",
        fontSize: "var(--fs-md)",
        textAlign: "left",
        padding: 0,
      }}
    >
      <Icon
        name={icon}
        size={22}
        style={{ color: danger ? "var(--danger-text)" : "var(--text-muted)" }}
      />
      {label}
    </button>
  );
}
