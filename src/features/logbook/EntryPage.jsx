import { useRef, useState, lazy, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { dk } from "../../lib/date.js";
import { DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { buzz } from "../../lib/storage.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import EntryMenuSheet from "./EntryMenuSheet.jsx";
import EntryMeta from "./EntryMeta.jsx";
import EntryTopBar from "./EntryTopBar.jsx";
import FindBar from "./FindBar.jsx";
import AskClaudeSheet from "./AskClaudeSheet.jsx";
import OutlineSheet from "./OutlineSheet.jsx";
import Backlinks from "./Backlinks.jsx";
import SaveTemplateSheet from "./SaveTemplateSheet.jsx";
import { tagStats } from "../../lib/tags.js";
import { useEntrySave } from "./useEntrySave.js";
import { headingsOf, isActive } from "../../lib/notes.js";
import { TextInput } from "../../ui/Field.jsx";

const RichEditor = lazy(() => import("./RichEditor.jsx"));
const NO_TAGS = [];

// Een tik op een notitielink opent die notitie op dezelfde pagina (de huidige
// is dan al opgeslagen). Terug gaat naar waar je vandaan kwam.
export default function EntryPage(props) {
  const [entry, setEntry] = useState(props.entry);
  const openNote = async (id) => {
    const next = await db.logEntries.get(id);
    if (next) setEntry(next);
  };
  const moved = entry !== props.entry;
  return (
    <NotePage
      key={entry?.id ?? "new"}
      {...props}
      entry={entry}
      draft={moved ? undefined : props.draft}
      onOpenNote={openNote}
    />
  );
}

// Volledige eigen pagina met de rijke editor. Opslaan: zie useEntrySave.
// `draft`: optionele voorinvulling voor een nieuwe entry ({ title?, body?, doc? }),
// bv. vanuit een sjabloon of een gedeelde link — markeert de entry direct als
// dirty zodat de auto-save 'm aanmaakt. Zonder draft is het gedrag ongewijzigd.
function NotePage({
  entry,
  notebookId,
  date: dateProp,
  theme,
  draft,
  onClose,
  onOpenNote,
}) {
  const [title, setTitle] = useState(entry?.title || draft?.title || "");
  const [tags, setTags] = useState(entry?.tags ?? []);
  // Je bestaande tags (actieve notities) voor de tagkiezer.
  const knownTags =
    useLiveQuery(async () =>
      tagStats((await db.logEntries.toArray()).filter(isActive)),
    ) ?? NO_TAGS;
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
  const [asking, setAsking] = useState(false);
  // Beschikbaarheid van undo/redo als state (niet de ref tijdens render lezen);
  // bijgewerkt vanuit de editor-onChange, die ook na undo/redo vuurt.
  const [hist, setHist] = useState({ undo: false, redo: false });
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const editorRef = useRef(null);

  const {
    idRef,
    contentRef,
    created,
    contentVersion,
    saveState,
    markDirty,
    onContentChange,
    flush,
  } = useEntrySave({
    entry,
    draft,
    title,
    tags,
    knownTags,
    date: dateProp,
    notebookId: currentNb,
    editorRef,
  });

  const initialContent =
    entry?.doc ?? entry?.body ?? draft?.doc ?? draft?.body ?? undefined;
  const entryDate = entry?.date || dateProp || dk(new Date());

  const onEditorChange = (change) => {
    onContentChange(change);
    setHist({
      undo: editorRef.current?.canUndo?.() ?? false,
      redo: editorRef.current?.canRedo?.() ?? false,
    });
  };
  const close = async () => {
    await flush();
    onClose();
  };
  const openNote = async (id) => {
    await flush();
    onOpenNote(id);
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
              onOpenNote={openNote}
              theme={theme}
            />
          </Suspense>
          <Backlinks id={entry?.id} onOpen={openNote} />
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
          onAsk={() => setAsking(true)}
          onOutline={headings.length ? () => setShowOutline(true) : null}
          onClose={() => setShowMenu(false)}
        />
      )}
      {asking && (
        <AskClaudeSheet
          getText={async () =>
            [title.trim(), await editorRef.current?.getMarkdown()]
              .filter(Boolean)
              .join("\n\n")
          }
          onClose={() => setAsking(false)}
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
