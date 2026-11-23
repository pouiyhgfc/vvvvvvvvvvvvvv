import { useState } from "react";
import { fmtShortDay } from "../../lib/date.js";
import Icon from "../../ui/Icon.jsx";
import { canMoveToToday, daysLeft, isOverdue, progress } from "./tasks.js";

// Eén taak: afvinkrondje, titel met labels, en bij stappen een pijltje om
// ze open te klappen (standaard dicht, zodat de lijst kort blijft).
export default function TaskRow({
  task,
  steps = [],
  today,
  parentTitle,
  onToggle,
  onOpen,
  onToday,
}) {
  const [open, setOpen] = useState(false);
  const pct = progress(steps);
  const late = isOverdue(task, today);
  const done = !!task.doneAt;
  const meta = [
    task.date && (task.date === today ? "vandaag" : fmtShortDay(task.date)),
    task.time,
    task.deadline &&
      !done &&
      `deadline ${fmtShortDay(task.deadline)} · nog ${daysLeft(task.deadline, today)} d`,
    parentTitle && `· ${parentTitle}`,
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TaskCheck task={task} onToggle={() => onToggle(task)} />
        <button type="button" onClick={() => onOpen(task)} style={textBtn}>
          <span
            dir="auto"
            style={{
              display: "block",
              color: done ? "var(--text-muted)" : "var(--text)",
              textDecorationLine: done ? "line-through" : "none",
            }}
          >
            {task.title}
          </span>
          {(meta.length > 0 || pct !== null) && (
            <span style={metaStyle}>
              {pct !== null && (
                <b style={{ color: "var(--accent-text)" }}>{pct}% </b>
              )}
              {meta.join(" · ")}
            </span>
          )}
        </button>
        {late && (
          <span style={{ ...metaStyle, color: "var(--danger-text)" }}>
            te laat
          </span>
        )}
        {onToday && canMoveToToday(task, today) && (
          <button type="button" onClick={() => onToday(task)} style={chip}>
            naar vandaag
          </button>
        )}
        {steps.length > 0 && (
          <button
            type="button"
            aria-label={`Stappen van ${task.title}`}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            style={iconBtn}
          >
            <Icon name={open ? "caret-down" : "caret-right"} size={18} />
          </button>
        )}
      </div>
      {open && (
        <div style={{ paddingInlineStart: 34 }}>
          {steps.map((s) => (
            <TaskRow
              key={s.id}
              task={s}
              today={today}
              onToggle={onToggle}
              onOpen={onOpen}
              onToday={onToday}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskCheck({ task, onToggle }) {
  const done = !!task.doneAt;
  return (
    <button
      type="button"
      aria-label={`${done ? "Terugzetten" : "Afvinken"}: ${task.title}`}
      onClick={onToggle}
      style={{
        ...iconBtn,
        color: done ? "var(--accent)" : "var(--control-border)",
      }}
    >
      <Icon name={done ? "check-circle" : "circle"} size={24} />
    </button>
  );
}

const iconBtn = {
  width: 44,
  height: 44,
  marginInline: -10,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  color: "var(--text-muted)",
};
const textBtn = {
  flex: 1,
  minWidth: 0,
  minHeight: 44,
  padding: "4px 0",
  border: "none",
  background: "transparent",
  textAlign: "start",
  fontSize: "var(--fs-md)",
};
const metaStyle = {
  display: "block",
  fontSize: "var(--fs-xs)",
  color: "var(--text-muted)",
};
const chip = {
  minHeight: 32,
  padding: "0 10px",
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "var(--accent-bg)",
  color: "var(--accent-text)",
  fontSize: "var(--fs-xs)",
  fontWeight: 600,
  flexShrink: 0,
};
