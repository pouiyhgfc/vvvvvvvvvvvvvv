import { useEffect, useRef } from "react";

// Zet de focus bij openen in een sheet/dialoog (voor toetsenbord en
// schermlezer) en bij sluiten terug op de knop waar je vandaan kwam. Niet
// als je in de editor zit: dan zou het toetsenbord op de telefoon dichtgaan.
export function useDialogFocus() {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    if (prev?.closest?.('[contenteditable="true"]')) return undefined;
    if (!ref.current?.contains(prev))
      ref.current?.focus({ preventScroll: true });
    return () => {
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}
