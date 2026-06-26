import {
  useRef,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { db } from "../../lib/db.js";
import { uid, dk } from "../../lib/date.js";
import { MOODS } from "../../lib/constants.js";
import Emoji from "../../ui/Emoji.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { TextInput } from "../../ui/Field.jsx";

const RichEditor = lazy(() => import("./RichEditor.jsx"));

const parseTags = (str) =>
  str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

// Volledige eigen pagina met de rijke editor. Slaat automatisch op (debounced
// + bij Terug). Maakt een nieuwe entry pas aan zodra er inhoud is.
export default function EntryPage({
  entry,
  notebookId,
  date: dateProp,
  theme,
  onClose,
}) {
  const [title, setTitle] = useState(entry?.title || "");
  const [tags, setTags] = useState(entry?.tags?.join(", ") || "");
  const [mood, setMood] = useState(entry?.mood || "");
  const [created, setCreated] = useState(!!entry?.id);
  const [confirmDel, setConfirmDel] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);

  const idRef = useRef(entry?.id || null);
  const contentRef = useRef({
    doc: entry?.doc ?? null,
    text: entry?.body ?? "",
  });

  // RichEditor normaliseert zelf: array → door, string → plainToBlocks, leeg → undefined.
  const initialContent = entry?.doc ?? entry?.body ?? undefined;

  const persist = useCallback(async () => {
    const { doc, text } = contentRef.current;
    const hasContent = title.trim() || (text && text.trim());
    if (!idRef.current) {
      if (!hasContent) return;
      const id = uid();
      idRef.current = id;
      setCreated(true);
      await db.logEntries.put({
        id,
        notebookId,
        date: dateProp || dk(new Date()),
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        tags: parseTags(tags),
        mood: mood || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.logEntries.update(idRef.current, {
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        tags: parseTags(tags),
        mood: mood || null,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [title, tags, mood, notebookId, dateProp]);

  // Debounced auto-save bij elke wijziging (titel/tags/mood via persist, editor
  // via contentVersion).
  useEffect(() => {
    const t = setTimeout(persist, 500);
    return () => clearTimeout(t);
  }, [persist, contentVersion]);

  const onEditorChange = ({ doc, text }) => {
    contentRef.current = { doc, text };
    setContentVersion((v) => v + 1);
  };
  const close = async () => {
    await persist();
    onClose();
  };
  const remove = async () => {
    if (idRef.current) await db.logEntries.delete(idRef.current);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 250,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Topbalk */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-mid)",
          background: "var(--card)",
        }}
      >
        <button
          onClick={close}
          aria-label="Terug"
          style={{
            fontSize: 22,
            background: "none",
            color: "var(--text)",
            padding: "2px 8px",
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 16,
            fontWeight: 700,
            padding: "6px 4px",
          }}
        />
        {created && (
          <button
            onClick={() => setConfirmDel(true)}
            aria-label="Verwijderen"
            style={{
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              borderRadius: 8,
              padding: "6px 9px",
              lineHeight: 1,
            }}
          >
            <Emoji char="🗑️" size={15} />
          </button>
        )}
      </div>

      {/* Tags + stemming */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-soft)",
          background: "var(--card)",
        }}
      >
        <TextInput
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags (komma-gescheiden)"
          style={{ flex: 1, minWidth: 150, fontSize: 12, padding: "6px 10px" }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? "" : m.value)}
              aria-label={m.value}
              style={{
                padding: 4,
                borderRadius: 7,
                display: "flex",
                border:
                  mood === m.value
                    ? "2px solid var(--accent)"
                    : "1.5px solid var(--border)",
                background: mood === m.value ? "var(--sel-bg)" : "var(--card)",
              }}
            >
              <Emoji char={m.emoji} size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{ maxWidth: 720, margin: "0 auto", padding: "14px 4px 48px" }}
        >
          <Suspense
            fallback={
              <div
                style={{
                  padding: 20,
                  color: "var(--text-faint)",
                  fontSize: 13,
                }}
              >
                Editor laden…
              </div>
            }
          >
            <RichEditor
              initialContent={initialContent}
              onChange={onEditorChange}
              theme={theme}
            />
          </Suspense>
        </div>
      </div>

      {confirmDel && (
        <ConfirmDialog
          title="Entry verwijderen?"
          message="Deze entry wordt verwijderd."
          onCancel={() => setConfirmDel(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
