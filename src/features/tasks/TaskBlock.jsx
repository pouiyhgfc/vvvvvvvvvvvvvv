import { TaskCheck } from "./TaskRow.jsx";

// Een taak met tijd in de dagtijdlijn: stippelrand en afvinkrondje, zodat
// hij te onderscheiden is van een planningsblok. Niet te slepen.
export default function TaskBlock({ task, end, style, onToggle, onOpen }) {
  const done = !!task.doneAt;
  return (
    <div
      data-task={task.title}
      style={{
        ...style,
        display: "flex",
        alignItems: "flex-start",
        overflow: "hidden",
        borderRadius: "var(--r-sm)",
        border: "1.5px dashed var(--accent)",
        background: "var(--card)",
        zIndex: 3,
        opacity: done ? 0.6 : 1,
      }}
    >
      <TaskCheck task={task} onToggle={() => onToggle(task)} />
      <button
        type="button"
        onClick={() => onOpen(task)}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          padding: "4px 6px 0 0",
          border: "none",
          background: "transparent",
          textAlign: "start",
          color: "var(--text)",
          fontSize: "var(--fs-sm)",
        }}
      >
        <span
          dir="auto"
          style={{
            display: "block",
            fontWeight: 600,
            textDecorationLine: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </span>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          {task.time} – {end}
        </span>
      </button>
    </div>
  );
}
