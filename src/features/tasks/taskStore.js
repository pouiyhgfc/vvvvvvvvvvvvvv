import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import { normalizeTask } from "./tasks.js";

const NO_TASKS = [];

export const useTasks = () =>
  useLiveQuery(() => db.tasks.toArray()) ?? NO_TASKS;

// Nieuwe taak achteraan zijn lijst (of achteraan de stappen van de
// hoofdtaak). Een stap neemt de lijst van de hoofdtaak over.
export async function addTask(fields) {
  return db.transaction("rw", db.tasks, async () => {
    const parent = fields.parentId ? await db.tasks.get(fields.parentId) : null;
    const horizon = parent?.horizon ?? fields.horizon ?? "kort";
    const siblings = await db.tasks
      .filter((t) =>
        parent
          ? t.parentId === parent.id
          : !t.parentId && t.horizon === horizon,
      )
      .toArray();
    const id = uid();
    await db.tasks.add(
      normalizeTask({
        parentId: null,
        deadline: null,
        remindDays: null,
        note: "",
        ...fields,
        id,
        horizon,
        order: Math.max(-1, ...siblings.map((t) => t.order ?? 0)) + 1,
        createdAt: new Date().toISOString(),
        doneAt: null,
      }),
    );
    return id;
  });
}

export async function updateTask(id, fields) {
  const task = await db.tasks.get(id);
  await db.tasks.put(normalizeTask({ ...task, ...fields }));
}

export async function toggleDone(id) {
  const task = await db.tasks.get(id);
  await db.tasks.update(id, {
    doneAt: task.doneAt ? null : new Date().toISOString(),
  });
}

export const moveToToday = (id, today) => db.tasks.update(id, { date: today });

// Een hoofdtaak gaat samen met zijn stappen weg.
export function deleteTask(id) {
  return db.transaction("rw", db.tasks, async () => {
    await db.tasks.where("parentId").equals(id).delete();
    await db.tasks.delete(id);
  });
}
