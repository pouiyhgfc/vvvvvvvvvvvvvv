import { useState } from "react";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Sheet from "../../ui/Sheet.jsx";
import NoteRow from "./NoteRow.jsx";
import { purgeEntries, purgeEntry, restoreFromTrash } from "./noteActions.js";

// Prullenbak over alle notitieboeken heen. Definitief verwijderen (één of
// alles) gaat altijd via een bevestiging.
export default function TrashSheet({ entries, notebookOf, onClose }) {
  const [confirmPurge, setConfirmPurge] = useState(null); // entry | "all"
  const purge = async () => {
    await (confirmPurge === "all"
      ? purgeEntries(entries)
      : purgeEntry(confirmPurge.id));
    setConfirmPurge(null);
  };
  return (
    <>
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
            <Button
              variant="danger"
              full
              onClick={() => setConfirmPurge("all")}
            >
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
                  onClick: () => restoreFromTrash(entry.id),
                },
                {
                  icon: "x",
                  label: "Definitief verwijderen",
                  onClick: () => setConfirmPurge(entry),
                },
              ]}
            />
          ))
        )}
      </Sheet>
      {confirmPurge && (
        <ConfirmDialog
          title="Definitief verwijderen?"
          message={
            confirmPurge === "all"
              ? `${entries.length} item(s) worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.`
              : "Dit item wordt definitief verwijderd. Dit kan niet ongedaan worden gemaakt."
          }
          onCancel={() => setConfirmPurge(null)}
          onConfirm={purge}
        />
      )}
    </>
  );
}

const empty = {
  margin: 0,
  padding: "var(--sp-4) 0",
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
  textAlign: "center",
};
