import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";
import { metaBtn, metaRow } from "./noteHelpers.js";

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
        <p
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          Nog niets gearchiveerd.
        </p>
      ) : (
        entries.map((entry) => {
          const nb = notebookOf(entry);
          return (
            <div key={entry.id} style={metaRow}>
              <div
                style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                onClick={() => {
                  onOpen(entry);
                }}
              >
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
              <div
                style={{ display: "flex", gap: 4, flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRestore(entry.id)}
                  aria-label="Terugzetten"
                  title="Terugzetten"
                  style={metaBtn}
                >
                  <Emoji char="↩️" size={14} />
                </button>
                <button
                  onClick={() => onTrash(entry.id)}
                  aria-label="Naar prullenbak"
                  title="Naar prullenbak"
                  style={metaBtn}
                >
                  <Emoji char="🗑️" size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </Sheet>
  );
}
