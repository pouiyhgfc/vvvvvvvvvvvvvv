import Icon from "../../ui/Icon.jsx";
import ListRow from "../../ui/ListRow.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Acties voor één notitie achter de ⋯-knop. Vastzetten, archiveren en
// verwijderen kan pas als de notitie bestaat (`created`); "Inhoud" alleen
// als er koppen zijn.
export default function EntryMenuSheet({
  created,
  pinned,
  onPin,
  onArchive,
  onSaveTemplate,
  onTrash,
  onFind,
  onOutline,
  onAsk,
  onClose,
}) {
  const act = (fn) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet title="Notitie" onClose={onClose}>
      <Row
        icon="magnifying-glass"
        label="Zoeken in notitie"
        onClick={act(onFind)}
      />
      <Row icon="chat-circle-text" label="Vraag Claude" onClick={act(onAsk)} />
      {onOutline && (
        <Row icon="text-h" label="Inhoud" onClick={act(onOutline)} />
      )}
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
    <ListRow aria-label={label} onClick={onClick} danger={danger}>
      <Icon
        name={icon}
        size={22}
        style={{ color: danger ? "var(--danger-text)" : "var(--text-muted)" }}
      />
      {label}
    </ListRow>
  );
}
