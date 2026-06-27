import { useState } from "react";
import { fmtDate, dk, tMin, minT } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { DAYS_NL } from "../../lib/constants.js";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import IconField from "../../ui/IconField.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput, TextArea } from "../../ui/Field.jsx";

const DURS = [
  [15, "15m"],
  [30, "30m"],
  [45, "45m"],
  [60, "1u"],
  [90, "1½u"],
  [120, "2u"],
];

const timeStyle = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 8,
  border: "1.5px solid var(--border)",
  fontSize: 14,
  outline: "none",
  background: "var(--input-bg)",
  color: "var(--text)",
};

export default function EventModal({
  modal,
  templates,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = modal.mode === "edit";
  const ev = isEdit ? modal.event : null;
  const h0 = isEdit ? null : modal.hour;

  const [title, setTitle] = useState(ev?.title || "");
  const [icon, setIcon] = useState(ev?.icon || "✅");
  const [startTime, setStartTime] = useState(
    ev?.startTime ||
      (h0 != null ? `${String(h0).padStart(2, "0")}:00` : "09:00"),
  );
  const [endTime, setEndTime] = useState(
    ev?.endTime ||
      (h0 != null
        ? h0 >= 23
          ? "23:59"
          : `${String(h0 + 1).padStart(2, "0")}:00`
        : "10:00"),
  );
  const [color, setColor] = useState(ev?.color || "#0e7a52");
  const [desc, setDesc] = useState(ev?.desc || "");
  const [repeat, setRepeat] = useState(ev?.repeat || "none");
  const [timeError, setTimeError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const dateStr = isEdit ? ev.date : dk(modal.date);
  const dayLabel = isEdit
    ? fmtDate(new Date(ev.date + "T00:00"))
    : fmtDate(modal.date);

  const applyTpl = (t) => {
    setTitle(t.title);
    setIcon(t.icon);
    setColor(t.color);
    if (t.desc) setDesc(t.desc);
  };

  const submit = () => {
    if (!title.trim()) return;
    if (tMin(endTime) <= tMin(startTime)) {
      setTimeError("Eindtijd moet na de starttijd liggen.");
      return;
    }
    setTimeError("");
    buzz();
    onSave({
      ...(isEdit ? { id: ev.id, exDates: ev.exDates || [] } : {}),
      date: dateStr,
      title: title.trim(),
      icon,
      startTime,
      endTime,
      color,
      desc: desc.trim(),
      repeat,
    });
  };

  const curDur = Math.max(0, tMin(endTime) - tMin(startTime));
  const onStart = (v) => {
    const dur = curDur > 0 ? curDur : 60;
    setStartTime(v);
    setEndTime(minT(Math.min(24 * 60 - 1, tMin(v) + dur)));
  };
  const setDur = (mins) =>
    setEndTime(minT(Math.min(24 * 60 - 1, tMin(startTime) + mins)));

  const isRepeat = isEdit && ev.repeat && ev.repeat !== "none";

  const segBtn = (active) => ({
    flex: 1,
    padding: "8px 4px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: active ? "2px solid var(--accent)" : "1.5px solid var(--border)",
    background: active ? "var(--sel-bg)" : "var(--card)",
    color: active ? "var(--accent-text)" : "var(--text-muted)",
  });

  return (
    <>
      <Sheet
        title={isEdit ? "Event bewerken" : "Nieuw event"}
        subtitle={dayLabel}
        onClose={onClose}
        footer={
          <>
            {isEdit && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button
              onClick={submit}
              disabled={!title.trim()}
              style={{ flex: 1 }}
            >
              {isEdit ? "💾 Opslaan" : "✓ Toevoegen"}
            </Button>
          </>
        }
      >
        {!isEdit && templates.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 6,
              }}
            >
              Snel invullen via template:
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTpl(t)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: 99,
                    background: t.color + "18",
                    border: `1.5px solid ${title === t.title ? t.color : t.color + "55"}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.color,
                  }}
                >
                  <Emoji char={t.icon} size={14} /> {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <IconField value={icon} onChange={setIcon} />
          <TextInput
            value={title}
            autoFocus={!isEdit}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Naam activiteit..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>

        <Field label="Beschrijving (optioneel)">
          <TextArea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Notitie of details..."
            rows={2}
          />
        </Field>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <Field label="Starttijd">
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStart(e.target.value)}
              style={timeStyle}
            />
          </Field>
          <Field label="Eindtijd">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={timeStyle}
            />
          </Field>
        </div>
        {timeError && (
          <div
            style={{
              fontSize: 11,
              color: "#dc2626",
              marginBottom: 6,
              marginTop: -4,
            }}
          >
            ⚠️ {timeError}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {DURS.map(([m, l]) => (
            <button
              key={m}
              onClick={() => setDur(m)}
              style={{
                flex: "1 1 0",
                minWidth: 42,
                padding: "6px 4px",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                border:
                  curDur === m
                    ? "2px solid var(--accent)"
                    : "1.5px solid var(--border)",
                background: curDur === m ? "var(--sel-bg)" : "var(--card)",
                color:
                  curDur === m ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <Field label="🔁 Herhalen">
          <div style={{ display: "flex", gap: 6 }}>
            {[
              ["none", "Niet"],
              ["daily", "Elke dag"],
              ["weekly", "Elke week"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRepeat(v)}
                style={segBtn(repeat === v)}
              >
                {l}
              </button>
            ))}
          </div>
          {repeat === "weekly" && (
            <div
              style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 5 }}
            >
              Herhaalt elke{" "}
              {DAYS_NL[new Date(dateStr + "T00:00").getDay()].toLowerCase()}{" "}
              vanaf {dayLabel}.
            </div>
          )}
          {repeat === "daily" && (
            <div
              style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 5 }}
            >
              Herhaalt elke dag vanaf {dayLabel}.
            </div>
          )}
        </Field>

        <Field label="Kleur">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </Sheet>

      {confirmDel &&
        (isRepeat ? (
          <ConfirmDialog
            title="Herhalend event verwijderen"
            message={`"${ev.title}" is een herhalend event.`}
            onCancel={() => setConfirmDel(false)}
            actions={[
              {
                label: "Hele reeks verwijderen",
                variant: "dangerSolid",
                onClick: () => onDelete(ev.id, { whole: true }),
              },
              {
                label: `Alleen deze dag (${dayLabel})`,
                variant: "secondary",
                onClick: () => onDelete(ev.id, { skipDate: ev.date }),
              },
            ]}
          />
        ) : (
          <ConfirmDialog
            title="Event verwijderen?"
            message={`"${ev.title}" wordt verwijderd.`}
            onCancel={() => setConfirmDel(false)}
            onConfirm={() => onDelete(ev.id)}
          />
        ))}
    </>
  );
}
