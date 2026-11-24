import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import { showToast } from "../../lib/toast.js";
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
    if (parent) await syncParent(parent.id);
    return id;
  });
}

export async function updateTask(id, fields) {
  const task = await db.tasks.get(id);
  await db.tasks.put(normalizeTask({ ...task, ...fields }));
}

// Een taak met stappen vink je niet zelf af (anders gebeurt dat per
// ongeluk): hij is klaar zodra al zijn stappen klaar zijn.
export function toggleDone(id) {
  return db.transaction("rw", db.tasks, async () => {
    const task = await db.tasks.get(id);
    if (await db.tasks.where("parentId").equals(id).count()) return false;
    await db.tasks.update(id, {
      doneAt: task.doneAt ? null : new Date().toISOString(),
    });
    if (task.parentId) await syncParent(task.parentId);
    return true;
  });
}

// Voor het afvinkrondje: legt uit waarom een taak met stappen niet afgaat.
export async function toggleTask(task) {
  if (!(await toggleDone(task.id)))
    showToast("Klaar zodra alle stappen zijn afgevinkt.");
}

async function syncParent(parentId) {
  const parent = await db.tasks.get(parentId);
  const steps = await db.tasks.where("parentId").equals(parentId).toArray();
  const allDone = steps.length > 0 && steps.every((t) => t.doneAt);
  if (!!parent?.doneAt !== allDone)
    await db.tasks.update(parentId, {
      doneAt: allDone ? new Date().toISOString() : null,
    });
}

// Na slepen: de ids in hun nieuwe volgorde.
export const reorderTasks = (ids) =>
  db.transaction("rw", db.tasks, () =>
    Promise.all(ids.map((id, order) => db.tasks.update(id, { order }))),
  );

export const moveToToday = (id, today) => db.tasks.update(id, { date: today });

// Een hoofdtaak gaat samen met zijn stappen weg.
export function deleteTask(id) {
  return db.transaction("rw", db.tasks, async () => {
    const task = await db.tasks.get(id);
    await db.tasks.where("parentId").equals(id).delete();
    await db.tasks.delete(id);
    if (task?.parentId) await syncParent(task.parentId);
  });
}
