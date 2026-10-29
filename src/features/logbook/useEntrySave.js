import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../lib/db.js";
import { uid, dk } from "../../lib/date.js";
import { cleanTags } from "../../lib/tags.js";
import { docText } from "../../lib/docText.js";
import { DOC_SCHEMA_VERSION } from "./docSchema.js";

// Automatisch opslaan van een notitie (debounced + bij Terug). Maakt een
// nieuwe entry pas aan zodra er inhoud is.
export function useEntrySave({
  entry,
  draft,
  title,
  tags,
  knownTags,
  date,
  notebookId,
  editorRef,
}) {
  const [created, setCreated] = useState(!!entry?.id);
  const [contentVersion, setContentVersion] = useState(0);
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"

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

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveState("saving");
  };

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

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
        date: date || dk(new Date()),
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        docSchemaVersion: doc ? DOC_SCHEMA_VERSION : undefined,
        searchText: doc ? docText(doc) : undefined,
        tags: cleanTags(tags, knownTags),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.logEntries.update(idRef.current, {
        title: title.trim(),
        body: text || "",
        doc: doc || undefined,
        docSchemaVersion: doc ? DOC_SCHEMA_VERSION : undefined,
        searchText: doc ? docText(doc) : undefined,
        tags: cleanTags(tags, knownTags),
        updatedAt: new Date().toISOString(),
      });
    }
    dirtyRef.current = false;
    setSaveState("saved");
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
  }, [title, tags, knownTags, date, notebookId]);

  useEffect(() => {
    const t = setTimeout(persist, 500);
    return () => clearTimeout(t);
  }, [persist, contentVersion]);

  const onContentChange = ({ doc, text }) => {
    // text kan (nog) ontbreken bij de synchrone melding — dan de vorige tekst
    // behouden; de async markdown-conversie vult 'm vlak erna alsnog aan.
    contentRef.current = {
      doc,
      text: text !== undefined ? text : contentRef.current.text,
    };
    markDirty();
    setContentVersion((v) => v + 1);
  };

  const flush = async () => {
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
  };

  return {
    idRef,
    contentRef,
    created,
    contentVersion,
    saveState,
    markDirty,
    onContentChange,
    flush,
  };
}
