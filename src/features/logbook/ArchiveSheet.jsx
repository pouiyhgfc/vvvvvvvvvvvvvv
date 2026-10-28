import Sheet from "../../ui/Sheet.jsx";
import NoteRow from "./NoteRow.jsx";

// Gearchiveerde notities over alle notitieboeken heen, met het notitieboek
// als label. Tikken opent de notitie.
export default function ArchiveSheet({
  entries,
  notebookOf,
  onOpen,
  onRestore,
  onTrash,
  onClose,
}) {
  return (
    <Sheet title="Archief" onClose={onClose}>
      {entries.length === 0 ? (
        <p style={empty}>Nog niets gearchiveerd.</p>
      ) : (
        entries.map((entry) => (
          <NoteRow
            key={entry.id}
            entry={entry}
            notebook={notebookOf(entry)}
            onOpen={() => onOpen(entry)}
            actions={[
              {
                icon: "arrow-u-up-left",
                label: "Terugzetten",
                onClick: () => onRestore(entry.id),
              },
              {
                icon: "trash",
                label: "Naar prullenbak",
                onClick: () => onTrash(entry.id),
              },
            ]}
          />
        ))
      )}
    </Sheet>
  );
}

const empty = {
  margin: 0,
  padding: "var(--sp-4) 0",
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
  textAlign: "center",
};
