import { useState } from "react";
import { DAYS_NL, EVENT_COLORS, MONTHS_NL } from "../../lib/constants.js";
import { dk, tMin, minT } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import Icon from "../../ui/Icon.jsx";
import { Field, TextInput, TextArea } from "../../ui/Field.jsx";
import { durationMin, isRecurring } from "./planner.js";

const DURATIONS = [
  [30, "30 m"],
  [60, "1 u"],
  [90, "1,5 u"],
  [120, "2 u"],
  [180, "3 u"],
];
const REPEATS = [
  ["none", "Eenmalig"],
  ["weekly", "Elke week"],
  ["daily", "Elke dag"],
];

const dayLabel = (key) => {
  const d = new Date(key + "T12:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()].toLowerCase()}`;
};

const chip = (on) => ({
  minHeight: 40,
  padding: "0 var(--sp-3)",
  borderRadius: "var(--r-pill)",
  border: "none",
  fontSize: "var(--fs-sm)",
  fontWeight: on ? 600 : 500,
  background: on ? "var(--text)" : "var(--sunken)",
  color: on ? "var(--bg)" : "var(--text)",
});

const timeInput = {
  width: "100%",
  minHeight: 44,
  padding: "0 12px",
  borderRadius: "var(--r-md)",
  border: "none",
  fontSize: "var(--fs-md)",
  background: "var(--sunken)",
  color: "var(--text)",
};

// Eén sheet om een blok toe te voegen of te bewerken. `initial`:
// { mode: "add", date: Date, startMin } of { mode: "edit", occ }.
export default function BlockSheet({
  initial,
  templates,
  onSave,
  onDelete,
  onClose,
}) {
  const occ = initial.mode === "edit" ? initial.occ : null;
  const startDefault = initial.startMin ?? 9 * 60;
  const [title, setTitle] = useState(occ?.title ?? "");
  const [icon, setIcon] = useState(occ?.icon ?? "✅");
  const [date, setDate] = useState(occ?.date ?? dk(initial.date));
  const [startTime, setStartTime] = useState(
    occ?.startTime ?? minT(startDefault),
  );
  const [endTime, setEndTime] = useState(
    occ?.endTime ?? minT(Math.min(1439, startDefault + 60)),
  );
  const [repeat, setRepeat] = useState(occ?.repeat ?? "none");
  const [color, setColor] = useState(occ?.color ?? EVENT_COLORS[0]);
  const [desc, setDesc] = useState(occ?.desc ?? "");
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const dur =
    tMin(endTime) > tMin(startTime) ? durationMin(startTime, endTime) : 0;
  const setDur = (m) => setEndTime(minT(Math.min(1439, tMin(startTime) + m)));
  const onStart = (v) => {
    setStartTime(v);
    setEndTime(minT(Math.min(1439, tMin(v) + (dur || 60))));
  };
  const applyTemplate = (t) => {
    setTitle(t.title);
    setIcon(t.icon);
    setColor(t.color);
    if (t.desc) setDesc(t.desc);
  };

  const submit = () => {
    if (!title.trim()) return;
    if (tMin(endTime) <= tMin(startTime)) {
      setError("De eindtijd moet na de begintijd liggen.");
      return;
    }
    buzz();
    onSave({
      date,
      title: title.trim(),
      icon,
      startTime,
      endTime,
      repeat,
      color,
      desc: desc.trim(),
    });
  };

  return (
    <>
      <Sheet
        title={occ ? "Blok bewerken" : "Nieuw blok"}
        subtitle={dayLabel(date)}
        onClose={onClose}
        footer={
          <>
            {occ && (
              <Button
                variant="danger"
                aria-label="Verwijderen"
                onClick={() => setConfirmDel(true)}
                style={{
                  width: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="trash" size={20} />
              </Button>
            )}
            <Button
              onClick={submit}
              disabled={!title.trim()}
              style={{ flex: 1 }}
            >
              {occ ? "Opslaan" : "Toevoegen"}
            </Button>
          </>
        }
      >
        <Field label="Wat ga je doen?">
          <TextInput
            value={title}
            autoFocus={!occ}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Bv. Studeren RTE"
            dir="auto"
          />
        </Field>

        {!occ && templates.length > 0 && (
          <Field label="Snelkeuze">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  style={{
                    ...chip(title === t.title),
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: t.color,
                    }}
                  />
                  {t.title}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Dag">
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            style={timeInput}
          />
        </Field>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <Field label="Begint">
            <input
              type="time"
              aria-label="Begintijd"
              value={startTime}
              onChange={(e) => onStart(e.target.value)}
              style={timeInput}
            />
          </Field>
          <Field label="Eindigt">
            <input
              type="time"
              aria-label="Eindtijd"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={timeInput}
            />
          </Field>
        </div>
        {error && (
          <p
            style={{
              margin: "-4px 0 8px",
              fontSize: "var(--fs-sm)",
              color: "var(--danger-text)",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 6, marginBottom: "var(--sp-3)" }}>
          {DURATIONS.map(([m, l]) => (
            <button
              key={m}
              type="button"
              onClick={() => setDur(m)}
              style={{ ...chip(dur === m), flex: 1, padding: 0 }}
            >
              {l}
            </button>
          ))}
        </div>

        <Field label="Herhalen">
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: "var(--r-md)",
              background: "var(--sunken)",
            }}
          >
            {REPEATS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={repeat === v}
                onClick={() => setRepeat(v)}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  background: repeat === v ? "var(--card)" : "transparent",
                  boxShadow: repeat === v ? "0 1px 3px var(--shadow)" : "none",
                  color: repeat === v ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Kleur">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <Field label="Notitie (optioneel)">
          <TextArea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Lokaal, link, details…"
            rows={2}
          />
        </Field>
      </Sheet>

      {confirmDel &&
        (isRecurring(occ) ? (
          <ConfirmDialog
            title="Herhalend blok verwijderen"
            message={`"${occ.title}" komt ${occ.repeat === "daily" ? "elke dag" : "elke week"} terug.`}
            onCancel={() => setConfirmDel(false)}
            actions={[
              {
                label: `Alleen ${dayLabel(occ.date).toLowerCase()}`,
                variant: "secondary",
                onClick: () => onDelete("one"),
              },
              {
                label: "Alle keren",
                variant: "dangerSolid",
                onClick: () => onDelete("all"),
              },
            ]}
          />
        ) : (
          <ConfirmDialog
            title="Blok verwijderen?"
            message={`"${occ.title}" wordt verwijderd.`}
            onCancel={() => setConfirmDel(false)}
            onConfirm={() => onDelete("all")}
          />
        ))}
    </>
  );
}
