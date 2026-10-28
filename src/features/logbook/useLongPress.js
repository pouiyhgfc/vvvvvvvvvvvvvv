import { useRef } from "react";

// Lang indrukken (450 ms) roept `onFire(id)` aan. Eén timer volstaat: er kan
// maar één kaart tegelijk worden ingedrukt. `consumeFired()` vertelt de
// klik-handler dat de long-press al iets deed (en zet dat terug).
export function useLongPress(onFire) {
  const timer = useRef(null);
  const fired = useRef(false);
  const start = (id) => {
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      onFire(id);
    }, 450);
  };
  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const consumeFired = () => {
    const was = fired.current;
    fired.current = false;
    return was;
  };
  return { start, cancel, consumeFired };
}
