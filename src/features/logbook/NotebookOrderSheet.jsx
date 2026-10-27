import { useCallback } from "react";
import { db } from "../../lib/db.js";
import { useSortable, arrMove } from "../../hooks/useSortable.js";
import DragHandle from "../../ui/DragHandle.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Notitieboeken op volgorde slepen; slaat direct op in de notebooks-blob.
export default function NotebookOrderSheet({ notebooks, onClose }) {
  const onNbReorder = useCallback(
    (from, to) => {
      db.blobs.put({ key: "notebooks", data: arrMove(notebooks, from, to) });
    },
    [notebooks],
  );
  const { ref: nbSortRef, onHandleDown: nbHandleDown } =
    useSortable(onNbReorder);

  return (
    <Sheet title="Volgorde notitieboeken" onClose={onClose}>
      <div ref={nbSortRef}>
        {notebooks.map((n, i) => (
          <div
            key={n.id}
            data-srow="1"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--card)",
              border: `1.5px solid ${n.color}22`,
              marginBottom: 6,
              boxShadow: "0 1px 2px var(--shadow)",
            }}
          >
            <DragHandle onPointerDown={(e) => nbHandleDown(e, i, n.id)} />
            <Emoji char={n.icon} size={18} />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {n.name}
            </span>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: n.color,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </Sheet>
  );
}
