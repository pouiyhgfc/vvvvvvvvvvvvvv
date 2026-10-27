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
import { DAYS_NL, MONTHS_NL, DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { buzz } from "../../lib/storage.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import IconField from "../../ui/IconField.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";
import EntryMenuSheet from "./EntryMenuSheet.jsx";
import { TextInput, Select } from "../../ui/Field.jsx";

const RichEditor = lazy(() => import("./RichEditor.jsx"));

const parseTags = (str) =>
  str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

// Korte datum voor de meta-regel, bv. "di 27 okt".
function fmtDay(str) {
  const d = new Date(str + "T12:00");
  return `${DAYS_NL[d.getDay()].slice(0, 2).toLowerCase()} ${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;
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
  const [pinned, setPinned] = useState(!!entry?.pinnedAt);
  const [currentNb, setCurrentNb] = useState(
    entry?.notebookId || notebookId || "logboek",
  );
  const [confirmDel, setConfirmDel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  // Beschikbaarheid van undo/redo als state (niet de ref tijdens render lezen);
  // bijgewerkt vanuit de editor-onChange, die ook na undo/redo vuurt.
  const [hist, setHist] = useState({ undo: false, redo: false });
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
  // alleen openen of sluiten zonder wijziging. Een SJABLOON-draft (met `doc`)
  // telt NIET meteen mee: alleen opslaan als je er echt iets aan toevoegt,
  // anders maakt "openen + terug" een lege sjabloon-entry. Een share-target-
  // draft (title/body, geen doc) telt wél meteen mee, zodat gedeelde inhoud
  // niet verloren gaat.
  const dirtyRef = useRef(!!draft && !draft.doc);
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
        notebookId: currentNb,
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
  }, [title, tags, dateProp, currentNb]);

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
    setHist({
      undo: editorRef.current?.canUndo?.() ?? false,
      redo: editorRef.current?.canRedo?.() ?? false,
    });
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
  // Verwijderen is zacht: de entry gaat naar de prullenbak (deletedAt) en
  // wordt pas na 30 dagen (of "definitief verwijderen" daar) echt gewist.
  const remove = async () => {
    if (idRef.current) {
      await db.logEntries.update(idRef.current, {
        deletedAt: new Date().toISOString(),
        pinnedAt: null,
      });
      showToast("Naar prullenbak");
    }
    onClose();
  };

  const archive = async () => {
    if (!idRef.current) return;
    buzz();
    await db.logEntries.update(idRef.current, {
      archivedAt: new Date().toISOString(),
      pinnedAt: null,
    });
    showToast("Gearchiveerd");
    onClose();
  };

  const togglePin = async () => {
    if (!idRef.current) return;
    buzz();
    const next = pinned ? null : new Date().toISOString();
    await db.logEntries.update(idRef.current, { pinnedAt: next });
    setPinned(!!next);
    showToast(next ? "Notitie vastgezet" : "Notitie losgemaakt");
  };

  const notebooksBlob = useLiveQuery(() => db.blobs.get("notebooks"));
  const notebooks = notebooksBlob?.data ?? DEFAULT_NOTEBOOKS;

  // Verplaatsen is een losse, meteen zichtbare actie — net als pin/archief
  // schrijft dit direct naar Dexie i.p.v. via de gedebouncte persist(), zodat
  // het niet wacht op de volgende tekstwijziging. Nog niet opgeslagen entries
  // (idRef leeg) hebben nog geen record: daar volstaat het bijwerken van de
  // state, persist() gebruikt currentNb zodra 'm wél aanmaakt.
  const moveToNotebook = async (id) => {
    if (id === currentNb) return;
    setCurrentNb(id);
    if (idRef.current) {
      await db.logEntries.update(idRef.current, { notebookId: id });
      showToast("✓ Verplaatst");
    }
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

  const iconBtn = (enabled = true) => ({
    width: 44,
    height: 44,
    borderRadius: "var(--r-pill)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    border: "none",
    background: "none",
    opacity: enabled ? 1 : 0.35,
  });
  const nb = notebooks.find((n) => n.id === currentNb);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--card)",
        zIndex: 250,
        display: "flex",
        flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Topbalk: terug, ongedaan maken/opnieuw, en de rest achter ⋯ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "var(--sp-2) var(--sp-2) 0",
          minHeight: 52,
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Terug"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            minHeight: 44,
            padding: "0 var(--sp-2) 0 4px",
            border: "none",
            background: "none",
            color: "var(--accent-text)",
            fontSize: "var(--fs-md)",
            fontWeight: 500,
          }}
        >
          <Icon name="caret-left" size={20} />
          Notities
        </button>
        <span style={{ flex: 1 }} />
        {/* Ongedaan maken / opnieuw — editor-historie (ProseMirror). */}
        <button
          type="button"
          onClick={() => editorRef.current?.undo()}
          disabled={!hist.undo}
          aria-label="Ongedaan maken"
          style={iconBtn(hist.undo)}
        >
          <Icon name="arrow-u-up-left" size={22} />
        </button>
        <button
          type="button"
          onClick={() => editorRef.current?.redo()}
          disabled={!hist.redo}
          aria-label="Opnieuw"
          style={iconBtn(hist.redo)}
        >
          <Icon name="arrow-u-up-right" size={22} />
        </button>
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          aria-label="Notitie-opties"
          style={{ ...iconBtn(), color: "var(--text)" }}
        >
          <Icon name="dots-three" size={24} />
        </button>
      </div>

      {/* Scroll-zone: meta + titel + editor */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "var(--sp-3) var(--sp-3) 48px",
          }}
        >
          {/* Meta-rij: notitieboek · datum · tags · opslaan-status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              flexWrap: "wrap",
              // Zelfde linkerkant als de tekst in de editor (44px goot).
              padding: "0 4px 0 44px",
              marginBottom: "var(--sp-2)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 32,
                padding: "0 10px",
                borderRadius: "var(--r-pill)",
                background: "var(--accent-bg)",
                color: "var(--accent-text)",
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: nb?.color ?? "var(--accent)",
                }}
              />
              <Select
                value={currentNb}
                onChange={(e) => moveToNotebook(e.target.value)}
                aria-label="Notitieboek"
                style={{
                  width: "auto",
                  border: "none",
                  background: "transparent",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  color: "inherit",
                  padding: 0,
                }}
              >
                {notebooks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </Select>
            </label>
            <span style={{ whiteSpace: "nowrap" }}>{fmtDay(entryDate)}</span>
            <TextInput
              value={tags}
              onChange={(e) => {
                markDirty();
                setTags(e.target.value);
              }}
              placeholder="+ tags"
              aria-label="Tags (komma-gescheiden)"
              style={{
                flex: 1,
                minWidth: 90,
                border: "none",
                background: "transparent",
                fontSize: "var(--fs-sm)",
                color: "var(--accent-text)",
                padding: 0,
                boxShadow: "none",
              }}
            />
            <span style={{ fontSize: "var(--fs-xs)" }}>
              {saveState === "saving" && "Opslaan…"}
              {saveState === "saved" && "Opgeslagen"}
            </span>
          </div>
          {/* Grote titel */}
          <TextInput
            value={title}
            onChange={(e) => {
              markDirty();
              setTitle(e.target.value);
            }}
            placeholder="Titel…"
            dir="auto"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-2xl)",
              fontWeight: 600,
              color: "var(--text)",
              padding: "0 4px var(--sp-2) 44px",
              lineHeight: 1.2,
              boxShadow: "none",
            }}
          />
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

      {showMenu && (
        <EntryMenuSheet
          created={created}
          pinned={pinned}
          onPin={togglePin}
          onArchive={archive}
          onSaveTemplate={() => setShowSaveTemplate(true)}
          onTrash={() => setConfirmDel(true)}
          onClose={() => setShowMenu(false)}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title="Naar prullenbak?"
          message="Deze entry gaat naar de prullenbak en wordt na 30 dagen definitief verwijderd."
          confirmLabel="Naar prullenbak"
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
