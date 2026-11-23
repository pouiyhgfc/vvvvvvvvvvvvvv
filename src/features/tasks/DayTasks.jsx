import TaskRow from "./TaskRow.jsx";

// Taken zonder tijd en deadlines van één dag, voor Planning (dag en week).
// Gedaan blijft doorgestreept staan: dat is de geschiedenis van die dag.
export default function DayTasks({
  untimed,
  deadlines,
  today,
  onToggle,
  onOpen,
}) {
  return (
    <>
      {untimed.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
      {deadlines.map((t) => (
        <button
          key={t.id}
          type="button"
          dir="auto"
          onClick={() => onOpen(t)}
          style={{
            minHeight: 36,
            padding: 0,
            border: "none",
            background: "transparent",
            textAlign: "start",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--danger-text)",
          }}
        >
          Deadline: {t.title}
        </button>
      ))}
    </>
  );
}
