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
import { DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { buzz } from "../../lib/storage.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import EntryMenuSheet from "./EntryMenuSheet.jsx";
import EntryMeta from "./EntryMeta.jsx";
import EntryTopBar from "./EntryTopBar.jsx";
import FindBar from "./FindBar.jsx";
import OutlineSheet from "./OutlineSheet.jsx";
import SaveTemplateSheet from "./SaveTemplateSheet.jsx";
import { cleanTags, tagStats } from "../../lib/tags.js";
import { headingsOf, isActive } from "../../lib/notes.js";
import { TextInput } from "../../ui/Field.jsx";

const RichEditor = lazy(() => import("./RichEditor.jsx"));
const NO_TAGS = [];

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
  const [tags, setTags] = useState(entry?.tags ?? []);
  // Je bestaande tags (actieve notities) voor de tagkiezer.
  const knownTags =
    useLiveQuery(async () =>
      tagStats((await db.logEntries.toArray()).filter(isActive)),
    ) ?? NO_TAGS;
  const [created, setCreated] = useState(!!entry?.id);
  const [pinned, setPinned] = useState(!!entry?.pinnedAt);
  const [currentNb, setCurrentNb] = useState(
    entry?.notebookId || notebookId || "logboek",
  );
  const [confirmDel, setConfirmDel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  // Koppen voor "Inhoud", vastgelegd bij het openen van het menu.
  const [headings, setHeadings] = useState([]);
  const [showOutline, setShowOutline] = useState(false);
  const [finding, setFinding] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  // Beschikbaarheid van undo/redo als state (niet de ref tijdens render lezen);
  // bijgewerkt vanuit de editor-onChange, die ook na undo/redo vuurt.
  const [hist, setHist] = useState({ undo: false, redo: false });
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

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
        tags: cleanTags(tags, knownTags),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.logEntries.update(idRef.current, {
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        tags: cleanTags(tags, knownTags),
        updatedAt: new Date().toISOString(),
      });
    }
    dirtyRef.current = false;
    setSaveState("saved");
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
  }, [title, tags, knownTags, dateProp, currentNb]);

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
      <EntryTopBar
        hist={hist}
        onBack={close}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
        onMenu={() => {
          setHeadings(headingsOf(contentRef.current.doc));
          setShowMenu(true);
        }}
      />

      {finding && (
        <FindBar version={contentVersion} onClose={() => setFinding(false)} />
      )}

      {/* Scroll-zone: meta + titel + editor */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            // Onderin ruimte voor de werkbalk boven het toetsenbord.
            padding: "var(--sp-3) var(--sp-3) 96px",
          }}
        >
          <EntryMeta
            nb={nb}
            notebooks={notebooks}
            currentNb={currentNb}
            onMove={moveToNotebook}
            date={entryDate}
            tags={tags}
            knownTags={knownTags}
            onTags={(next) => {
              markDirty();
              setTags(next);
            }}
            saveState={saveState}
          />
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
          onFind={() => setFinding(true)}
          onOutline={headings.length ? () => setShowOutline(true) : null}
          onClose={() => setShowMenu(false)}
        />
      )}
      {showOutline && (
        <OutlineSheet
          headings={headings}
          onClose={() => setShowOutline(false)}
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
        <SaveTemplateSheet
          getDoc={() => contentRef.current.doc}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
    </div>
  );
}
