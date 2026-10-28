import Button from "../../ui/Button.jsx";
import Sheet from "../../ui/Sheet.jsx";
import NoteRow from "./NoteRow.jsx";

// Prullenbak over alle notitieboeken heen. `onPurge` krijgt een entry of
// "all"; de bevestiging zit in LogbookView.
export default function TrashSheet({
  entries,
  notebookOf,
  onRestore,
  onPurge,
  onClose,
}) {
  return (
    <Sheet
      title="Prullenbak"
      subtitle={
        entries.length > 0
          ? "Na 30 dagen worden notities definitief verwijderd."
          : undefined
      }
      onClose={onClose}
      footer={
        entries.length > 0 && (
          <Button variant="danger" full onClick={() => onPurge("all")}>
            Prullenbak legen
          </Button>
        )
      }
    >
      {entries.length === 0 ? (
        <p style={empty}>De prullenbak is leeg.</p>
      ) : (
        entries.map((entry) => (
          <NoteRow
            key={entry.id}
            entry={entry}
            notebook={notebookOf(entry)}
            actions={[
              {
                icon: "arrow-u-up-left",
                label: "Herstellen",
                onClick: () => onRestore(entry.id),
              },
              {
                icon: "x",
                label: "Definitief verwijderen",
                onClick: () => onPurge(entry),
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
