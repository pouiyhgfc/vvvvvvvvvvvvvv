import {
  useRef,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid, dk } from "../../lib/date.js";
import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import IconField from "../../ui/IconField.jsx";
import Emoji from "../../ui/Emoji.jsx";
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

function UndoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5L4 9l4 4" />
      <path d="M4 9h7a4 4 0 0 1 4 4v1" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5l4 4-4 4" />
      <path d="M16 9H9a4 4 0 0 0-4 4v1" />
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
// `draft`: optionele voorinvulling voor een nieuwe entry ({ title?, body?, doc? }),
// bv. vanuit een sjabloon of een gedeelde link — markeert de entry direct als
// dirty zodat de auto-save 'm aanmaakt. Zonder draft is het gedrag ongewijzigd.
export default function EntryPage({
  entry,
  notebookId,
  date: dateProp,
  theme,
  draft,
  onClose,
}) {
  const [title, setTitle] = useState(entry?.title || draft?.title || "");
  const [tags, setTags] = useState(entry?.tags?.join(", ") || "");
  const [created, setCreated] = useState(!!entry?.id);
  const [confirmDel, setConfirmDel] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplIcon, setTplIcon] = useState("📄");

  const idRef = useRef(entry?.id || null);
  const contentRef = useRef({
    doc: entry?.doc ?? draft?.doc ?? null,
    text: entry?.body ?? draft?.body ?? "",
  });
  // Pas opslaan/updatedAt aanpassen als er echt iets bewerkt is — niet bij
  // alleen openen of sluiten zonder wijziging. Met een draft is er al
  // inhoud, dus die telt meteen als een wijziging die opgeslagen moet worden.
  const dirtyRef = useRef(!!draft);
  const savedTimerRef = useRef(null);
  const editorRef = useRef(null);

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveState("saving");
  };

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  const initialContent =
    entry?.doc ?? entry?.body ?? draft?.doc ?? draft?.body ?? undefined;
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
    setSaveState("saved");
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
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
    markDirty();
    setContentVersion((v) => v + 1);
  };
  const close = async () => {
    // Race-fix: bij direct sluiten na de laatste toetsaanslag kan de async
    // markdown-conversie van RichEditor nog niet zijn aangekomen. Vraag 'm
    // hier alsnog op, zodat persist() de nieuwste tekst opslaat.
    if (dirtyRef.current) {
      try {
        const text = await editorRef.current?.getMarkdown();
        if (text !== undefined) contentRef.current.text = text;
      } catch {
        // Val terug op de laatst bekende tekst.
      }
    }
    await persist();
    onClose();
  };
  const remove = async () => {
    if (idRef.current) await db.logEntries.delete(idRef.current);
    onClose();
  };

  const templatesBlob = useLiveQuery(() => db.blobs.get("entryTemplates"));
  const saveAsTemplate = async () => {
    if (!tplName.trim()) return;
    const current = templatesBlob?.data ?? [];
    await db.blobs.put({
      key: "entryTemplates",
      data: [
        ...current,
        {
          id: uid(),
          name: tplName.trim(),
          icon: tplIcon,
          doc: contentRef.current.doc,
        },
      ],
    });
    showToast("✓ Sjabloon opgeslagen");
    setShowSaveTemplate(false);
    setTplName("");
    setTplIcon("📄");
  };

  const ghostBtn = {
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
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={close} aria-label="Terug" style={ghostBtn}>
            <ChevronIcon />
          </button>
          {/* Ongedaan maken / opnieuw — editor-historie (ProseMirror). Altijd
              aan: niets om te herstellen is een no-op. */}
          <button
            onClick={() => editorRef.current?.undo()}
            aria-label="Ongedaan maken"
            style={ghostBtn}
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => editorRef.current?.redo()}
            aria-label="Opnieuw"
            style={ghostBtn}
          >
            <RedoIcon />
          </button>
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-faint)",
          }}
        >
          {saveState === "saving" && "Opslaan…"}
          {saveState === "saved" && "Opgeslagen ✓"}
        </span>
        <button
          onClick={() => setShowSaveTemplate(true)}
          aria-label="Meer opties"
          style={{
            width: 34,
            height: 34,
            borderRadius: 99,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          ⋯
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
              markDirty();
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
                markDirty();
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
              ref={editorRef}
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

      {showSaveTemplate && (
        <Sheet
          title="Opslaan als sjabloon"
          onClose={() => setShowSaveTemplate(false)}
          footer={
            <Button full disabled={!tplName.trim()} onClick={saveAsTemplate}>
              <Emoji char="💾" size={14} /> Opslaan
            </Button>
          }
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <IconField value={tplIcon} onChange={setTplIcon} />
            <TextInput
              value={tplName}
              autoFocus
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Naam sjabloon..."
              style={{ flex: 1, minWidth: 140 }}
            />
          </div>
        </Sheet>
      )}
    </div>
  );
}
