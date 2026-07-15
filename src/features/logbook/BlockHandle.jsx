import { useEffect, useRef, useState } from "react";
import BlockMenuSheet from "./BlockMenuSheet.jsx";
import { openSlashMenu, moveBlock } from "./editorActions.js";

const LONG_PRESS_MS = 350;

// Zes-puntjes-handvat (⠿) — eigen SVG i.p.v. de touch-dode BlockNote-default.
function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      {[4, 8, 12].map((y) =>
        [5, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
      )}
    </svg>
  );
}

// Zoekt het blok-element onder een schermpunt en bepaalt of er vóór of ná
// gedropt wordt (t.o.v. het verticale midden). Coördinaten relatief aan de
// container, want de drop-indicator wordt daarbinnen absoluut geplaatst.
function findDropTarget(editor, container, x, y, sourceId) {
  // Droppen op (of ín) het gesleepte blok zelf is ongeldig: het doel zou mee
  // verwijderd worden en het blok zou verloren gaan.
  const sourceEl = editor.domElement?.querySelector(`[data-id="${sourceId}"]`);
  const els = document.elementsFromPoint(x, y);
  let el = null;
  for (const n of els) {
    const withId = n.closest?.("[data-id]");
    if (withId && editor.domElement?.contains(withId)) {
      if (sourceEl?.contains(withId)) return null;
      el = withId;
      break;
    }
  }
  if (!el) return null;
  const id = el.getAttribute("data-id");
  if (!id || id === sourceId) return null;
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const placement = y < r.top + r.height / 2 ? "before" : "after";
  return {
    id,
    placement,
    line: {
      top: (placement === "before" ? r.top : r.bottom) - c.top,
      left: r.left - c.left,
      width: r.width,
    },
  };
}

// Top-level blokken die de HUIDIGE DOM-selectie beslaat. We lezen bewust de
// DOM-selectie (window.getSelection) i.p.v. editor.getSelection(): op touch
// synct een native selectie niet betrouwbaar naar ProseMirror, maar de
// DOM-selectie is exact wat er visueel geselecteerd is. Geeft null bij een lege
// of enkel-blok-selectie.
function domSelectionBlocks(editor) {
  const dom = typeof window !== "undefined" ? window.getSelection?.() : null;
  const root = editor?.domElement;
  if (!dom || dom.isCollapsed || dom.rangeCount === 0 || !root) return null;
  const range = dom.getRangeAt(0);
  const hit = [...root.querySelectorAll("[data-id]")].filter((el) =>
    range.intersectsNode(el),
  );
  const inSel = new Set(hit);
  const blocks = [];
  for (const el of hit) {
    // Geneste blokken overslaan: hun voorouder (ook geselecteerd) dekt ze al.
    let p = el.parentElement?.closest("[data-id]");
    let nested = false;
    while (p) {
      if (inSel.has(p)) {
        nested = true;
        break;
      }
      p = p.parentElement?.closest("[data-id]");
    }
    if (nested) continue;
    const b = editor.getBlock(el.getAttribute("data-id"));
    if (b) blocks.push(b);
  }
  return blocks.length > 1 ? blocks : null;
}

// Toont een handvat + "+" bij het actieve blok (het blok waar de cursor staat).
// Positie wordt berekend uit de blok-DOM-node, niet uit hover — zo werkt het op
// touch, waar BlockNote's eigen (hover-gedreven) zijmenu nooit verschijnt.
// Tik op ⠿ = blok-menu; ingedrukt houden = vrij verslepen.
export default function BlockHandle({ editor, containerRef }) {
  const [pos, setPos] = useState(null); // { top } | null
  const [sheetTarget, setSheetTarget] = useState(null); // { block, selectionBlocks } | null
  const [ghost, setGhost] = useState(null); // { x, y } tijdens slepen
  const [indicator, setIndicator] = useState(null); // { top, left, width }
  const rafRef = useRef(0);
  const press = useRef(null); // actieve pointer-interactie
  const timerRef = useRef(0);
  const selBlocksRef = useRef(null); // laatst geziene meervoudige selectie

  useEffect(() => {
    if (!editor) return undefined;

    const compute = () => {
      const block = editor.getTextCursorPosition()?.block;
      const container = containerRef.current;
      const el = block
        ? editor.domElement?.querySelector(`[data-id="${block.id}"]`)
        : null;
      if (!block || !container || !el) {
        setPos(null);
        return;
      }
      const c = container.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      setPos({ top: b.top - c.top });
    };

    // Scroll/resize vuren vaak → via rAF afknijpen tot één berekening per frame.
    const schedule = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };

    // Meervoudige selectie onthouden: op touch collapst de selectie zodra je op
    // ⠿ tikt, dus bij de tik is de selectie al weg. We bewaren de laatst geziene
    // meervoudige (DOM-)selectie als fallback voor Kopiëren. We luisteren op het
    // DOM-`selectionchange`-event (vuurt óók bij touch-selectie), niet alleen op
    // editor.onSelectionChange (die mist een niet-gesyncte native selectie).
    const trackSel = () => {
      const blocks = domSelectionBlocks(editor);
      if (blocks) selBlocksRef.current = blocks;
    };
    const onSel = () => {
      trackSel();
      schedule();
    };
    // Een nieuwe cursor/selectie ín de editor wist het onthouden meervoud, zodat
    // een latere tik niet per ongeluk een oude selectie kopieert. De tik op ⠿
    // valt buiten de editor en wist dus niets.
    const onDocDown = (e) => {
      if (editor.domElement?.contains(e.target)) selBlocksRef.current = null;
    };

    const unsubSel = editor.onSelectionChange(onSel);
    const unsubChange = editor.onChange(schedule);
    document.addEventListener("selectionchange", trackSel);
    document.addEventListener("pointerdown", onDocDown, true);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
      unsubSel?.();
      unsubChange?.();
      document.removeEventListener("selectionchange", trackSel);
      document.removeEventListener("pointerdown", onDocDown, true);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [editor, containerRef]);

  const endDrag = () => {
    setGhost(null);
    setIndicator(null);
    document.body.style.userSelect = "";
  };

  const onPointerDown = (e) => {
    const block = editor.getTextCursorPosition()?.block;
    if (!block) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // Live DOM-selectie als die meerdere blokken beslaat (desktop, waar de
    // selectie de tik overleeft); anders de laatst onthouden meervoudige
    // selectie (touch, waar de tik de selectie al heeft gecollapst).
    press.current = {
      block,
      selectionBlocks: domSelectionBlocks(editor) ?? selBlocksRef.current,
      dragging: false,
      target: null,
      startX: e.clientX,
      startY: e.clientY,
    };
    selBlocksRef.current = null; // verbruikt
    timerRef.current = setTimeout(() => {
      if (!press.current) return;
      press.current.dragging = true;
      document.body.style.userSelect = "none";
      setGhost({ x: press.current.startX, y: press.current.startY });
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e) => {
    const p = press.current;
    if (!p || !p.dragging) return;
    e.preventDefault();
    setGhost({ x: e.clientX, y: e.clientY });
    const target = findDropTarget(
      editor,
      containerRef.current,
      e.clientX,
      e.clientY,
      p.block.id,
    );
    p.target = target;
    setIndicator(target ? target.line : null);
  };

  const onPointerUp = (e) => {
    clearTimeout(timerRef.current);
    const p = press.current;
    press.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!p) return;
    if (!p.dragging) {
      // tik → blok-menu (met de bij pointerdown vastgelegde selectie)
      setSheetTarget({ block: p.block, selectionBlocks: p.selectionBlocks });
      return;
    }
    endDrag();
    if (p.target) {
      // moveBlock is atomair: gooit hij (ongeldig doel), dan is er niets
      // gewijzigd — de sleep eindigt dan gewoon zonder effect.
      try {
        moveBlock(editor, p.block, p.target.id, p.target.placement);
      } catch {
        /* document intact gebleven */
      }
    }
    editor.focus();
  };

  const onPointerCancel = () => {
    clearTimeout(timerRef.current);
    press.current = null;
    endDrag();
  };

  const btnStyle = {
    width: 24,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "var(--text-faint)",
    cursor: "pointer",
    borderRadius: 6,
    touchAction: "none",
  };

  return (
    <>
      {/* Horizontaal in de linkergoot van de editor (54px padding-inline):
          eerst +, dan ⠿ — naast de eerste regel, niet over de tekst eronder. */}
      {pos && (
        <div
          style={{
            position: "absolute",
            top: pos.top,
            left: 0,
            display: "flex",
            alignItems: "center",
            zIndex: 40,
          }}
        >
          <button
            type="button"
            aria-label="Nieuw blok invoegen"
            // preventDefault: de editor mag geen focus verliezen, anders
            // sluit de focus-wissel het net geopende slash-menu meteen weer.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => openSlashMenu(editor)}
            style={btnStyle}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            style={{
              ...btnStyle,
              color: ghost ? "var(--accent)" : "var(--text-faint)",
            }}
          >
            <DotsIcon />
          </button>
        </div>
      )}

      {/* Drop-indicator: horizontale lijn op de plek waar het blok landt. */}
      {indicator && (
        <div
          style={{
            position: "absolute",
            top: indicator.top - 1,
            left: indicator.left,
            width: indicator.width,
            height: 2,
            background: "var(--accent)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 45,
          }}
        />
      )}

      {/* Ghost: pil die de vinger volgt tijdens het slepen. */}
      {ghost && (
        <div
          style={{
            position: "fixed",
            top: ghost.y + 8,
            left: ghost.x + 8,
            padding: "6px 12px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            fontFamily: "var(--ff-body)",
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 6px 20px var(--shadow)",
            pointerEvents: "none",
            zIndex: 300,
          }}
        >
          Blok verplaatsen…
        </div>
      )}

      {sheetTarget && (
        <BlockMenuSheet
          editor={editor}
          block={sheetTarget.block}
          selectionBlocks={sheetTarget.selectionBlocks}
          onClose={() => setSheetTarget(null)}
        />
      )}
    </>
  );
}
