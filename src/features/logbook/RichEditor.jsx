import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Dunne wrapper om de BlockNote-editor. Wordt lazy geladen (alleen bij het
// openen van een entry-pagina) zodat tracker/weekplanner licht blijven.
// Geeft bij wijziging zowel de blocks-JSON (doc) als de markdown-tekst terug.
export default function RichEditor({ initialContent, onChange, theme }) {
  const editor = useCreateBlockNote({ initialContent });
  return (
    <BlockNoteView
      editor={editor}
      theme={theme === "dark" ? "dark" : "light"}
      onChange={async () => {
        const doc = editor.document;
        const text = await editor.blocksToMarkdownLossy(doc);
        onChange({ doc, text });
      }}
    />
  );
}
