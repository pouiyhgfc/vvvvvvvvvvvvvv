import { arrMove, useSortable } from "../../hooks/useSortable.js";
import { reorderTasks } from "./taskStore.js";

// Taken (of stappen) die je aan het handvat versleept. `row(taak, drag)`
// tekent één rij; `drag` gaat door naar TaskRow.
export default function SortableTasks({ list, row }) {
  const { ref, dragId, onHandleDown } = useSortable((from, to) =>
    reorderTasks(arrMove(list, from, to).map((t) => t.id)),
  );
  return (
    <div ref={ref}>
      {list.map((t, i) =>
        row(t, {
          dragging: dragId === t.id,
          onHandleDown: (e) => onHandleDown(e, i, t.id),
        }),
      )}
    </div>
  );
}
