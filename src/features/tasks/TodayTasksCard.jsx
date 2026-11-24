import { useState } from "react";
import { dk } from "../../lib/date.js";
import Card from "../../ui/Card.jsx";
import { TextInput } from "../../ui/Field.jsx";
import Icon from "../../ui/Icon.jsx";
import TaskRow from "./TaskRow.jsx";
import TaskSheet from "./TaskSheet.jsx";
import { addTask, moveToToday, toggleTask, useTasks } from "./taskStore.js";
import { cardList, daysLeft } from "./tasks.js";

// "Te doen" op Vandaag: de taken van de getoonde dag (op vandaag ook wat te
// laat is en deadlines binnenkort), afvinken en snel iets toevoegen. De kop
// opent de volledige lijst.
export default function TodayTasksCard({ date, onOpenAll }) {
  const tasks = useTasks();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(null);
  const day = dk(date);
  const today = dk(new Date());
  const { items, deadlines } = cardList(tasks, day, today);
  const titleOf = (id) => tasks.find((t) => t.id === id)?.title;

  const add = async () => {
    if (!title.trim()) return;
    await addTask({ title, horizon: "kort", date: day });
    setTitle("");
  };

  return (
    <Card style={{ gap: "var(--sp-2)" }}>
      <button type="button" onClick={onOpenAll} style={head}>
        Te doen
        <Icon
          name="caret-right"
          size={18}
          style={{ color: "var(--text-muted)" }}
        />
      </button>
      {items.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          parentTitle={t.parentId && titleOf(t.parentId)}
          onToggle={toggleTask}
          onOpen={setOpen}
          onToday={(task) => moveToToday(task.id, today)}
        />
      ))}
      {deadlines.map((t) => {
        const n = daysLeft(t.deadline, today);
        return (
          <span key={t.id} dir="auto" style={deadline}>
            Deadline: {t.title} —{" "}
            {n === 0 ? "vandaag" : `over ${n} ${n === 1 ? "dag" : "dagen"}`}
          </span>
        );
      })}
      <TextInput
        value={title}
        placeholder={
          day === today ? "+ Taak voor vandaag" : "+ Taak voor deze dag"
        }
        aria-label="Taak toevoegen"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
      />
      {open && (
        <TaskSheet task={open} today={today} onClose={() => setOpen(null)} />
      )}
    </Card>
  );
}

const head = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--text)",
  fontFamily: "var(--ff-head)",
  fontSize: "var(--fs-lg)",
  fontWeight: 600,
};
const deadline = {
  fontSize: "var(--fs-sm)",
  color: "var(--danger-text)",
};
