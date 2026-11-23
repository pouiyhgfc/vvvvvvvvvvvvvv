import { useState } from "react";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import EditFooter from "../../ui/EditFooter.jsx";
import { Field, Select, TextArea, TextInput } from "../../ui/Field.jsx";
import Sheet from "../../ui/Sheet.jsx";
import TaskRow from "./TaskRow.jsx";
import { addTask, deleteTask, updateTask, useTasks } from "./taskStore.js";
import { stepsOf } from "./tasks.js";
import { useToggleTask } from "./useToggleTask.jsx";

const DURATIONS = [15, 30, 45, 60, 90, 120];
const REMINDERS = [
  ["", "Geen herinnering"],
  ["0", "Op de dag zelf"],
  ["1", "1 dag vooraf"],
  ["3", "3 dagen vooraf"],
  ["7", "7 dagen vooraf"],
];

// Nieuwe taak, bewerken en stappen in één sheet. Alleen de titel is nodig;
// de rest staat ingeklapt onder "Meer opties". `parentId` = nieuwe stap.
export default function TaskSheet({
  task,
  parentId,
  defaults,
  today,
  onClose,
}) {
  const [f, setF] = useState(() => ({
    title: "",
    horizon: "kort",
    date: "",
    time: "",
    durationMin: 30,
    deadline: "",
    remindDays: "",
    note: "",
    ...defaults,
    ...task,
  }));
  const [more, setMore] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [openStep, setOpenStep] = useState(null);
  const [stepTitle, setStepTitle] = useState("");
  const [toggle, toggleDialog] = useToggleTask();
  const steps = stepsOf(useTasks(), task?.id);
  const isStep = !!(task?.parentId || parentId);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  const save = async () => {
    if (!f.title.trim()) return;
    const fields = {
      ...f,
      date: f.date || null,
      time: f.time || null,
      durationMin: Number(f.durationMin),
      deadline: f.deadline || null,
      remindDays:
        f.deadline && f.remindDays !== "" ? Number(f.remindDays) : null,
    };
    if (task) await updateTask(task.id, fields);
    else await addTask({ ...fields, parentId: parentId ?? null });
    onClose();
  };
  const addStep = async () => {
    if (!stepTitle.trim()) return;
    await addTask({ title: stepTitle, parentId: task.id });
    setStepTitle("");
  };

  return (
    <>
      <Sheet
        title={task ? "Taak bewerken" : isStep ? "Nieuwe stap" : "Nieuwe taak"}
        onClose={onClose}
        footer={
          <EditFooter
            isEdit={!!task}
            canSave={!!f.title.trim()}
            onSave={save}
            onDelete={() => setConfirmDel(true)}
          />
        }
      >
        <TextInput
          value={f.title}
          autoFocus={!task}
          aria-label="Titel"
          placeholder="Wat moet er gebeuren?"
          onChange={set("title")}
          onKeyDown={(e) => e.key === "Enter" && save()}
          style={{ marginBottom: "var(--sp-3)" }}
        />
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore(!more)}
          style={moreBtn}
        >
          Meer opties
        </button>
        {more && (
          <>
            {!isStep && (
              <Field label="Lijst">
                <Select
                  aria-label="Lijst"
                  value={f.horizon}
                  onChange={set("horizon")}
                >
                  <option value="kort">Korte termijn</option>
                  <option value="lang">Lange termijn</option>
                </Select>
              </Field>
            )}
            <Field
              label="Datum"
              hint="Met een datum staat de taak in je planning."
            >
              <TextInput
                type="date"
                aria-label="Datum"
                value={f.date ?? ""}
                onChange={set("date")}
              />
            </Field>
            <Field label="Tijd en duur">
              <div style={{ display: "flex", gap: 8 }}>
                <TextInput
                  type="time"
                  aria-label="Tijd"
                  disabled={!f.date}
                  value={f.time ?? ""}
                  onChange={set("time")}
                />
                <Select
                  aria-label="Duur"
                  disabled={!f.time}
                  value={f.durationMin ?? 30}
                  onChange={set("durationMin")}
                >
                  {DURATIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </Select>
              </div>
            </Field>
            <Field label="Deadline">
              <TextInput
                type="date"
                aria-label="Deadline"
                value={f.deadline ?? ""}
                onChange={set("deadline")}
              />
            </Field>
            {f.deadline && (
              <Field label="Herinnering">
                <Select
                  aria-label="Herinnering"
                  value={f.remindDays ?? ""}
                  onChange={set("remindDays")}
                >
                  {REMINDERS.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Notitie">
              <TextArea value={f.note ?? ""} rows={2} onChange={set("note")} />
            </Field>
          </>
        )}
        {task && !isStep && (
          <Field label="Stappen">
            {steps.map((s) => (
              <TaskRow
                key={s.id}
                task={s}
                today={today}
                onToggle={toggle}
                onOpen={setOpenStep}
              />
            ))}
            <TextInput
              value={stepTitle}
              placeholder="+ Stap toevoegen"
              aria-label="Nieuwe stap"
              onChange={(e) => setStepTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
            />
          </Field>
        )}
      </Sheet>
      {openStep && (
        <TaskSheet
          task={openStep}
          today={today}
          onClose={() => setOpenStep(null)}
        />
      )}
      {toggleDialog}
      {confirmDel && (
        <ConfirmDialog
          title="Taak verwijderen?"
          message={`"${f.title}"${steps.length ? ` met ${steps.length} stappen` : ""} wordt verwijderd.`}
          onConfirm={async () => {
            await deleteTask(task.id);
            onClose();
          }}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}

const moreBtn = {
  minHeight: 44,
  padding: 0,
  marginBottom: "var(--sp-2)",
  border: "none",
  background: "transparent",
  color: "var(--accent-text)",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
};
