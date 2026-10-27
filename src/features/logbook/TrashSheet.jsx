import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";
import { metaBtn, metaRow } from "./noteHelpers.js";

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
      onClose={onClose}
      footer={
        entries.length > 0 && (
          <Button variant="danger" full onClick={() => onPurge("all")}>
            <Emoji char="🗑️" size={14} /> Prullenbak legen
          </Button>
        )
      }
    >
      {entries.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          Prullenbak is leeg.
        </p>
      ) : (
        <>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              marginBottom: 10,
            }}
          >
            Items worden na 30 dagen automatisch definitief verwijderd.
          </p>
          {entries.map((entry) => {
            const nb = notebookOf(entry);
            return (
              <div key={entry.id} style={metaRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 3,
                    }}
                  >
                    <Emoji char={nb.icon} size={12} />
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-faint)",
                        fontWeight: 600,
                      }}
                    >
                      {nb.name}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.title || entry.body?.slice(0, 60) || "Zonder titel"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => onRestore(entry.id)}
                    aria-label="Herstellen"
                    title="Herstellen"
                    style={metaBtn}
                  >
                    <Emoji char="↩️" size={14} />
                  </button>
                  <button
                    onClick={() => onPurge(entry)}
                    aria-label="Definitief verwijderen"
                    title="Definitief verwijderen"
                    style={metaBtn}
                  >
                    <Emoji char="❌" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}
