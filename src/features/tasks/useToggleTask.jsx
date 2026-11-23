import { useState } from "react";
import { db } from "../../lib/db.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { toggleDone } from "./taskStore.js";

// Afvinken, en na de laatste open stap de vraag of de hele taak klaar is
// (nooit automatisch). Geeft [toggle, dialoog] terug; zet de dialoog in je
// scherm.
export function useToggleTask() {
  const [ask, setAsk] = useState(null); // hoofdtaak
  const toggle = async (task) => {
    await toggleDone(task.id);
    if (task.doneAt || !task.parentId) return;
    const parent = await db.tasks.get(task.parentId);
    const open = await db.tasks
      .where("parentId")
      .equals(task.parentId)
      .filter((t) => !t.doneAt)
      .count();
    if (parent && !parent.doneAt && open === 0) setAsk(parent);
  };
  const dialog = ask && (
    <ConfirmDialog
      title="Hele taak afvinken?"
      message={`Alle stappen van "${ask.title}" zijn gedaan.`}
      confirmLabel="Afvinken"
      danger={false}
      onConfirm={async () => {
        await toggleDone(ask.id);
        setAsk(null);
      }}
      onCancel={() => setAsk(null)}
    />
  );
  return [toggle, dialog];
}
