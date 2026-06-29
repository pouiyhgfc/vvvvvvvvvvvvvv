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
import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { TextInput } from "../../ui/Field.jsx";

const RichEditor = lazy(() => import("./RichEditor.jsx"));

const parseTags = (str) =>
  str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function fmtDay(str) {
  const d = new Date(str + "T12:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 5l-5 5 5 5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11" />
    </svg>
  );
}

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
  const [created, setCreated] = useState(!!entry?.id);
  const [confirmDel, setConfirmDel] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);

  const idRef = useRef(entry?.id || null);
  const contentRef = useRef({
    doc: entry?.doc ?? null,
    text: entry?.body ?? "",
  });
  // Pas opslaan/updatedAt aanpassen als er echt iets bewerkt is — niet bij
  // alleen openen of sluiten zonder wijziging.
  const dirtyRef = useRef(false);

  const initialContent = entry?.doc ?? entry?.body ?? undefined;
  const entryDate = entry?.date || dateProp || dk(new Date());

  const persist = useCallback(async () => {
    // Geen wijziging sinds laden → niets opslaan (geen onnodige updatedAt-bump).
    if (!dirtyRef.current) return;
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.logEntries.update(idRef.current, {
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        tags: parseTags(tags),
        updatedAt: new Date().toISOString(),
      });
    }
    dirtyRef.current = false;
  }, [title, tags, notebookId, dateProp]);

  useEffect(() => {
    const t = setTimeout(persist, 500);
    return () => clearTimeout(t);
  }, [persist, contentVersion]);

  const onEditorChange = ({ doc, text }) => {
    // text kan (nog) ontbreken bij de synchrone melding — dan de vorige tekst
    // behouden; de async markdown-conversie vult 'm vlak erna alsnog aan.
    contentRef.current = {
      doc,
      text: text !== undefined ? text : contentRef.current.text,
    };
    dirtyRef.current = true;
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
      {/* Topbalk — minimaal: alleen terug + verwijder */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-mid)",
          background: "var(--card)",
          minHeight: 52,
        }}
      >
        <button
          onClick={close}
          aria-label="Terug"
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          <ChevronIcon />
        </button>
        {created && (
          <button
            onClick={() => setConfirmDel(true)}
            aria-label="Verwijderen"
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--danger-text)",
              border: "1px solid var(--danger-border)",
              background: "var(--danger-bg)",
              cursor: "pointer",
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Scroll-zone: titel + meta + editor */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 48px" }}
        >
          {/* Grote titel */}
          <TextInput
            value={title}
            onChange={(e) => {
              dirtyRef.current = true;
              setTitle(e.target.value);
            }}
            placeholder="Titel…"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontFamily: "var(--ff-display)",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text)",
              padding: "0 0 8px",
              lineHeight: 1.2,
              boxShadow: "none",
            }}
          />
          {/* Meta-rij: datum · tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {fmtDay(entryDate)}
            </span>
            <span style={{ color: "var(--border)", fontSize: 14 }}>·</span>
            <TextInput
              value={tags}
              onChange={(e) => {
                dirtyRef.current = true;
                setTags(e.target.value);
              }}
              placeholder="tags (komma-gescheiden)"
              style={{
                flex: 1,
                minWidth: 120,
                border: "none",
                background: "transparent",
                fontSize: 12,
                color: "var(--text-muted)",
                padding: 0,
                boxShadow: "none",
              }}
            />
          </div>
          {/* Rijke editor */}
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
