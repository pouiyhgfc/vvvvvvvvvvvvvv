import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { isActive } from "../../lib/notes.js";
import { copyText, shareText } from "../../lib/share.js";
import { showToast } from "../../lib/toast.js";
import Button from "../../ui/Button.jsx";
import { Field, TextArea } from "../../ui/Field.jsx";
import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";
import { nbOf } from "../logbook/noteHelpers.js";
import {
  buildReview,
  DEFAULT_PROMPT,
  PERIODS,
  periodRange,
} from "./reviewText.js";
import { saveAnswer } from "./saveAnswer.js";

const PARTS = [
  ["routines", "Routines"],
  ["planning", "Planning"],
  ["notes", "Notities"],
  ["hifd", "Hifd"],
];

// Weekreview (muhasaba) naar Claude: kies periode en wat er meegaat, pas de
// opdracht aan en deel of kopieer. Er gaat pas iets de app uit als je op
// Delen of Kopiëren tikt; standaard gaan alleen je routines mee.
export default function ReviewSheet({ routines, calEvents, onClose }) {
  const [period, setPeriod] = useState("week");
  const [include, setInclude] = useState({ routines: true });
  const [noteBooks, setNoteBooks] = useState(["logboek"]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [answer, setAnswer] = useState("");

  const stored = useLiveQuery(async () => ({
    days: await db.days.toArray(),
    notes: (await db.logEntries.toArray()).filter(isActive),
    notebooks: (await db.blobs.get("notebooks"))?.data ?? DEFAULT_NOTEBOOKS,
    hifd: await db.hifd.toArray(),
    hifdLog: await db.hifdLogV2.toArray(),
  }));
  const range = useMemo(() => periodRange(period), [period]);

  const text = useMemo(() => {
    if (!stored) return "";
    const nameOf = (n) =>
      stored.notebooks.find((b) => b.id === nbOf(n))?.name ?? "Logboek";
    return buildReview({
      prompt,
      range,
      include,
      data: {
        routines,
        days: Object.fromEntries(stored.days.map((d) => [d.date, d])),
        events: calEvents,
        notes: stored.notes.filter((n) => noteBooks.includes(nbOf(n))),
        notebookName: nameOf,
        hifd: stored.hifd,
        hifdLog: stored.hifdLog,
      },
    });
  }, [stored, prompt, range, include, noteBooks, routines, calEvents]);

  const toggle = (key) => setInclude((s) => ({ ...s, [key]: !s[key] }));
  const toggleBook = (id) =>
    setNoteBooks((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const save = async () => {
    await saveAnswer(answer, range.label);
    showToast("Bewaard in Muhasaba");
    onClose();
  };

  return (
    <Sheet
      title="Weekreview"
      subtitle="Naar Claude, via delen of kopiëren"
      onClose={onClose}
    >
      <Field label="Periode">
        <div style={row}>
          {PERIODS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              style={chip(period === id)}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Wat gaat mee">
        <div style={row}>
          {PARTS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={!!include[key]}
              onClick={() => toggle(key)}
              style={chip(!!include[key])}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      {include.notes && stored && (
        <Field label="Uit welke notitieboeken">
          <div style={row}>
            {stored.notebooks.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={noteBooks.includes(n.id)}
                onClick={() => toggleBook(n.id)}
                style={chip(noteBooks.includes(n.id))}
              >
                {n.name}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field
        label="Opdracht"
        hint={`${text.length.toLocaleString("nl-NL")} tekens gaan mee.`}
      >
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={7}
          aria-label="Opdracht"
        />
      </Field>
      <div
        style={{
          display: "flex",
          gap: "var(--sp-2)",
          marginBottom: "var(--sp-5)",
        }}
      >
        <Button variant="secondary" onClick={() => copyText(text)} style={btn}>
          <Icon name="copy" size={20} /> Kopiëren
        </Button>
        <Button onClick={() => shareText(text, "Weekreview")} style={btn}>
          <Icon name="share-network" size={20} /> Delen
        </Button>
      </div>
      <Field
        label="Antwoord van Claude"
        hint="Komt als notitie in het notitieboek Muhasaba."
      >
        <TextArea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          dir="auto"
          placeholder="Plak hier het antwoord"
          aria-label="Antwoord van Claude"
        />
      </Field>
      <Button variant="secondary" full disabled={!answer.trim()} onClick={save}>
        Bewaren in Muhasaba
      </Button>
    </Sheet>
  );
}

const row = { display: "flex", flexWrap: "wrap", gap: 8 };
const btn = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
const chip = (on) => ({
  minHeight: 40,
  padding: "0 14px",
  borderRadius: "var(--r-pill)",
  border: "none",
  fontSize: "var(--fs-sm)",
  fontWeight: on ? 600 : 500,
  background: on ? "var(--accent-bg)" : "var(--sunken)",
  color: on ? "var(--accent-text)" : "var(--text)",
});
