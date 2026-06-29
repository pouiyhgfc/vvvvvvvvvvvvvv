import { useRef, useState, useEffect } from "react";

export function arrMove(arr, from, to) {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}

export function useSortable(onReorder) {
  const ref = useRef(null);
  const st = useRef(null);
  const [dragId, setDragId] = useState(null);
  // Altijd de nieuwste onReorder aanroepen zonder de listeners opnieuw te koppelen.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);
  // Opruimfunctie van een lopende sleep, zodat we bij unmount kunnen afbreken.
  const teardownRef = useRef(null);

  const onHandleDown = (e, index, id) => {
    if (e.button != null && e.button !== 0) return;
    if (st.current) return; // al een sleep bezig: tweede pointer negeren
    const container = ref.current;
    if (!container) return;
    const els = [...container.querySelectorAll('[data-srow="1"]')];
    if (!els[index]) return; // index buiten bereik: niets doen i.p.v. crashen
    const rows = els.map((el) => {
      const b = el.getBoundingClientRect();
      return { el, center: b.top + b.height / 2, height: b.height };
    });

    const docEl = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = docEl.style.overflow;
    const prevOB = docEl.style.overscrollBehavior;

    const clearRows = () => {
      rows.forEach((r) => {
        r.el.style.transform = "";
        r.el.style.transition = "";
        r.el.style.zIndex = "";
      });
    };

    const move = (ev) => {
      const s = st.current;
      if (!s) return;
      const self = s.rows[s.index];
      if (!self) return; // rij weg (re-render): negeer
      if (ev.cancelable) ev.preventDefault(); // browser-scroll tegenhouden tijdens sleep
      s.dy = ev.clientY - s.startY;
      const cur = self.center + s.dy;
      let to = 0;
      for (let i = 0; i < s.rows.length; i++) {
        if (i === s.index) continue;
        if (s.rows[i].center < cur) to++;
      }
      s.to = to;
      s.rows.forEach((r, i) => {
        if (i === s.index) {
          r.el.style.transition = "none";
          r.el.style.transform = `translateY(${s.dy}px) scale(1.02)`;
          r.el.style.zIndex = "50";
          return;
        }
        let shift = 0;
        if (s.index < to && i > s.index && i <= to) shift = -s.dragH;
        else if (s.index > to && i >= to && i < s.index) shift = s.dragH;
        r.el.style.transition = "";
        r.el.style.transform = shift ? `translateY(${shift}px)` : "";
      });
    };

    const end = () => {
      const s = st.current;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.body.style.overflow = prevBody;
      docEl.style.overflow = prevHtml;
      docEl.style.overscrollBehavior = prevOB;
      clearRows();
      st.current = null;
      teardownRef.current = null;
      setDragId(null);
      if (s && s.to !== s.index) onReorderRef.current(s.index, s.to);
    };

    st.current = {
      index,
      id,
      startY: e.clientY,
      rows,
      dragH: rows[index].height + 3,
      dy: 0,
      to: index,
    };
    teardownRef.current = end;
    setDragId(id);

    // Pagina-scroll vergrendelen tijdens het slepen zodat de lijst niet meebeweegt.
    document.body.style.overflow = "hidden";
    docEl.style.overflow = "hidden";
    docEl.style.overscrollBehavior = "contain";

    // Listeners NU koppelen (synchroon), niet via een useEffect na re-render —
    // anders kaapt de mobiele browser de eerste bewegingen als scroll en breekt
    // de sleep af (pointercancel) voordat onze handler actief is.
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (e.cancelable) e.preventDefault();
  };

  // Veiligheid: breek een lopende sleep netjes af als de component verdwijnt.
  useEffect(() => () => teardownRef.current?.(), []);

  return { ref, dragId, onHandleDown };
}
