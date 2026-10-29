import { createContext, useContext } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { createReactInlineContentSpec } from "@blocknote/react";
import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";

// Wat er gebeurt bij een tik op een notitielink (zie EntryPage).
export const OpenNoteContext = createContext(null);

// Link naar een andere notitie, midden in de tekst. De titel wordt bij het
// invoegen bewaard, maar getoond wordt de actuele titel uit de database.
export const noteLink = createReactInlineContentSpec(
  {
    type: "noteLink",
    propSchema: { id: { default: "" }, title: { default: "" } },
    content: "none",
  },
  {
    render: ({ inlineContent }) => <Chip {...inlineContent.props} />,
    // Markdown/body: alleen de titel, zodat zoeken hem vindt.
    toExternalHTML: ({ inlineContent }) => (
      <span>{inlineContent.props.title}</span>
    ),
  },
);

function Chip({ id, title }) {
  const open = useContext(OpenNoteContext);
  const target = useLiveQuery(() => db.logEntries.get(id), [id]);
  const gone = target === undefined ? false : !target || !isActive(target);
  return (
    <button
      type="button"
      contentEditable={false}
      onClick={() => !gone && open?.(id)}
      style={{
        display: "inline",
        padding: "0 4px",
        border: "none",
        borderRadius: "var(--r-sm)",
        background: "var(--accent-bg)",
        color: gone ? "var(--text-faint)" : "var(--accent-text)",
        textDecoration: gone ? "line-through" : "none",
        font: "inherit",
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {target?.title || title || "Zonder titel"}
    </button>
  );
}
