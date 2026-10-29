import { useState } from "react";

// Selectiemodus voor bulkacties op notities.
export function useSelection() {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectOnly = (ids) => {
    setSelectMode(true);
    setSelectedIds(new Set(ids));
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return {
    selectMode,
    selectedIds,
    startSelect: () => setSelectMode(true),
    toggleSelect,
    selectOnly,
    exitSelectMode,
  };
}
