import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { isActive } from "../../lib/notes.js";
import { TextInput } from "../../ui/Field.jsx";
import Sheet from "../../ui/Sheet.jsx";
import { nbOf } from "./noteHelpers.js";
import NoteRow from "./NoteRow.jsx";

// Kies de notitie om naar te linken; zoeken op titel, nieuwste eerst.
export default function NoteLinkSheet({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const data = useLiveQuery(async () => ({
    notes: (await db.logEntries.toArray())
      .filter((e) => isActive(e) && e.title)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    notebooks: (await db.blobs.get("notebooks"))?.data ?? DEFAULT_NOTEBOOKS,
  }));
  const q = query.trim().toLowerCase();
  const notes = (data?.notes ?? [])
    .filter((e) => !q || e.title.toLowerCase().includes(q))
    .slice(0, 30);
  const notebookOf = (e) =>
    data.notebooks.find((n) => n.id === nbOf(e)) ?? data.notebooks[0];

  return (
    <Sheet title="Link naar notitie" onClose={onClose}>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek op titel"
        aria-label="Zoek notitie"
        style={{ width: "100%", marginBottom: "var(--sp-2)" }}
      />
      {notes.map((e) => (
        <NoteRow
          key={e.id}
          entry={e}
          notebook={notebookOf(e)}
          onOpen={() => onPick(e)}
          actions={[]}
        />
      ))}
      {data && !notes.length && (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          Geen notitie gevonden.
        </p>
      )}
    </Sheet>
  );
}
