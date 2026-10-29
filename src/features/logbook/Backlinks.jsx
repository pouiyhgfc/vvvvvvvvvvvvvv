import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";
import { linkedNoteIds } from "./noteLinks.js";

// Onderaan een notitie: welke andere notities hiernaar linken.
export default function Backlinks({ id, onOpen }) {
  const from = useLiveQuery(
    async () =>
      id
        ? (await db.logEntries.toArray()).filter(
            (e) =>
              e.id !== id && isActive(e) && linkedNoteIds(e.doc).includes(id),
          )
        : [],
    [id],
  );
  if (!from?.length) return null;
  return (
    <section style={{ margin: "var(--sp-5) 0 0 44px" }}>
      <h2
        style={{
          margin: "0 0 var(--sp-2)",
          fontSize: "var(--fs-xs)",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Gelinkt vanuit
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {from.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onOpen(e.id)}
            dir="auto"
            style={{
              minHeight: 36,
              padding: "0 12px",
              border: "none",
              borderRadius: "var(--r-pill)",
              background: "var(--sunken)",
              color: "var(--text)",
              fontSize: "var(--fs-sm)",
            }}
          >
            {e.title || "Zonder titel"}
          </button>
        ))}
      </div>
    </section>
  );
}
