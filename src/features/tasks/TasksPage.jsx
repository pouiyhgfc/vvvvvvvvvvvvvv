import { useState } from "react";
import BackButton from "../../ui/BackButton.jsx";
import Card from "../../ui/Card.jsx";
import Icon from "../../ui/Icon.jsx";
import TaskRow from "./TaskRow.jsx";
import TaskSheet from "./TaskSheet.jsx";
import { moveToToday, useTasks } from "./taskStore.js";
import { doneList, longList, shortList, stepsOf } from "./tasks.js";
import { useToggleTask } from "./useToggleTask.jsx";

// Alle taken: korte termijn, lange termijn en (ingeklapt) wat gedaan is.
export default function TasksPage({ today, onBack }) {
  const tasks = useTasks();
  const [sheet, setSheet] = useState(null); // { task } | { defaults }
  const [showDone, setShowDone] = useState(false);
  const [toggle, toggleDialog] = useToggleTask();
  const done = doneList(tasks);

  const row = (t) => (
    <TaskRow
      key={t.id}
      task={t}
      steps={stepsOf(tasks, t.id)}
      today={today}
      onToggle={toggle}
      onOpen={(task) => setSheet({ task })}
      onToday={(task) => moveToToday(task.id, today)}
    />
  );
  const section = (title, list, horizon) => (
    <Card style={{ gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={sectionTitle}>{title}</h2>
        <button
          type="button"
          aria-label={`Taak toevoegen aan ${title.toLowerCase()}`}
          onClick={() => setSheet({ defaults: { horizon } })}
          style={addBtn}
        >
          <Icon name="plus" size={20} />
        </button>
      </div>
      {list.map(row)}
      {list.length === 0 && <p style={empty}>Niets op deze lijst.</p>}
    </Card>
  );

  return (
    <div style={{ padding: "var(--sp-2) var(--sp-4) var(--sp-6)" }}>
      <BackButton onClick={onBack}>Vandaag</BackButton>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "var(--sp-2) 0 var(--sp-4)",
        }}
      >
        <h1 style={pageTitle}>Taken</h1>
        <button
          type="button"
          aria-label="Nieuwe taak"
          onClick={() => setSheet({ defaults: {} })}
          style={{
            ...addBtn,
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          <Icon name="plus" size={22} />
        </button>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}
      >
        {section("Korte termijn", shortList(tasks, today), "kort")}
        {section("Lange termijn", longList(tasks), "lang")}
        {done.length > 0 && (
          <Card style={{ gap: 0 }}>
            <button
              type="button"
              aria-expanded={showDone}
              onClick={() => setShowDone(!showDone)}
              style={{ ...sectionTitle, ...doneBtn }}
            >
              <Icon name={showDone ? "caret-down" : "caret-right"} size={18} />
              Gedaan ({done.length})
            </button>
            {showDone && done.map(row)}
          </Card>
        )}
      </div>
      {sheet && (
        <TaskSheet
          task={sheet.task}
          defaults={sheet.defaults}
          today={today}
          onClose={() => setSheet(null)}
        />
      )}
      {toggleDialog}
    </div>
  );
}

const pageTitle = {
  flex: 1,
  margin: 0,
  fontFamily: "var(--ff-head)",
  fontSize: "var(--fs-2xl)",
  fontWeight: 600,
};
const sectionTitle = {
  flex: 1,
  margin: 0,
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const addBtn = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "var(--r-md)",
  background: "transparent",
  color: "var(--accent-text)",
};
const doneBtn = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  border: "none",
  background: "transparent",
  padding: 0,
  textAlign: "start",
};
const empty = {
  margin: "4px 0 8px",
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
};
