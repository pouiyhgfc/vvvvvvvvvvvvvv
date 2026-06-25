import { useState } from "react";
import { fmtDate, dk, tMin, minT } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { EVENT_COLORS, DAYS_NL } from "../../lib/constants.js";
import EmojiPicker from "../../ui/EmojiPicker.jsx";

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
  const [color, setColor] = useState(ev?.color || "#059669");
  const [desc, setDesc] = useState(ev?.desc || "");
  const [repeat, setRepeat] = useState(ev?.repeat || "none");
  const [showEmoji, setShowEmoji] = useState(false);
  const [timeError, setTimeError] = useState("");

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
  const DURS = [
    [15, "15m"],
    [30, "30m"],
    [45, "45m"],
    [60, "1u"],
    [90, "1½u"],
    [120, "2u"],
  ];

  const handleDelete = () => {
    if (isEdit && ev.repeat && ev.repeat !== "none") {
      const whole = confirm(
        `"${ev.title}" is een herhalend event.\n\nOK = hele reeks verwijderen\nAnnuleren = alleen deze dag (${dayLabel}) overslaan`,
      );
      if (whole) onDelete(ev.id, { whole: true });
      else onDelete(ev.id, { skipDate: ev.date });
    } else {
      if (confirm("Event verwijderen?")) onDelete(ev.id);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 540,
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "fadeUp .25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {isEdit ? "Event bewerken" : "Nieuw event"}
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: 20,
              color: "var(--text-faint)",
              background: "none",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 12 }}
        >
          {dayLabel}
        </div>

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
                    transition: "border-color .15s",
                  }}
                >
                  {t.icon} {t.title}
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
          }}
        >
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 9,
              border: "1.5px solid var(--border)",
              background: "var(--input-bg)",
              fontSize: 22,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </button>
          <input
            type="text"
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
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              fontSize: 13,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#059669")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {showEmoji && (
          <div style={{ marginBottom: 10 }}>
            <EmojiPicker
              value={icon}
              onPick={(e) => {
                setIcon(e);
                setShowEmoji(false);
              }}
              size={28}
              height={150}
            />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 4,
            }}
          >
            Beschrijving{" "}
            <span style={{ fontWeight: 400, color: "var(--text-faint)" }}>
              (optioneel)
            </span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Notitie of details..."
            rows={2}
            style={{
              width: "100%",
              padding: "9px 11px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#059669")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Starttijd
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStart(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Eindtijd
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
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
                    ? "2px solid #059669"
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

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 6,
            }}
          >
            🔁 Herhalen
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              ["none", "Niet"],
              ["daily", "Elke dag"],
              ["weekly", "Elke week"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRepeat(v)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border:
                    repeat === v
                      ? "2px solid #059669"
                      : "1.5px solid var(--border)",
                  background: repeat === v ? "var(--sel-bg)" : "var(--card)",
                  color:
                    repeat === v ? "var(--accent-text)" : "var(--text-muted)",
                }}
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
        </div>

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 7,
            }}
          >
            Kleur
          </div>
          <div
            style={{
              display: "flex",
              gap: 7,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: c,
                  border:
                    color.toLowerCase() === c
                      ? "3px solid var(--text)"
                      : "2.5px solid transparent",
                  boxShadow:
                    color.toLowerCase() === c
                      ? "0 0 0 2px var(--card) inset"
                      : "none",
                  flexShrink: 0,
                  transition: "all .15s",
                }}
              />
            ))}
            <label
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                flexShrink: 0,
                cursor: "pointer",
                position: "relative",
                border: EVENT_COLORS.includes(color.toLowerCase())
                  ? "1.5px dashed var(--border)"
                  : "3px solid var(--text)",
                background: EVENT_COLORS.includes(color.toLowerCase())
                  ? "conic-gradient(red,orange,yellow,lime,aqua,blue,magenta,red)"
                  : color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                overflow: "hidden",
              }}
            >
              {EVENT_COLORS.includes(color.toLowerCase()) && (
                <span
                  style={{
                    fontSize: 13,
                    filter: "drop-shadow(0 0 1px rgba(0,0,0,.4))",
                  }}
                >
                  🎨
                </span>
              )}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isEdit && (
            <button
              onClick={handleDelete}
              style={{
                padding: "11px 14px",
                borderRadius: 9,
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                color: "#dc2626",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🗑️
            </button>
          )}
          <button
            onClick={submit}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 9,
              background: "#059669",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              opacity: title.trim() ? "1" : ".5",
              transition: "opacity .15s",
            }}
          >
            {isEdit ? "💾 Opslaan" : "✓ Toevoegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
