import { useEffect, useMemo, useState } from "react";
import Icon from "../../ui/Icon.jsx";

// Zoeken binnen de open notitie. Markeren gaat via de CSS Custom Highlight
// API: de DOM van de editor blijft onaangeroerd, dus de markering kan nooit
// in de opgeslagen notitie belanden. Tekst in een ingeklapte uitklaplijst
// telt niet mee (niet te zien, dus ook niet te tonen).
function findRanges(query) {
  const q = query.trim().toLowerCase();
  const root = document.querySelector(".bn-container .ProseMirror");
  if (!root || !q) return [];
  const ranges = [];
  for (const el of root.querySelectorAll(".bn-inline-content")) {
    // Eén blok kan uit meerdere tekst-nodes bestaan (vet, link …): plak ze
    // aan elkaar en reken de treffer terug naar node + positie.
    const nodes = [];
    let text = "";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      nodes.push({ n, start: text.length });
      text += n.data;
    }
    const at = (pos, end) => {
      const hit = nodes.find(({ n, start }) =>
        end
          ? pos > start && pos <= start + n.data.length
          : pos >= start && pos < start + n.data.length,
      );
      return [hit.n, pos - hit.start];
    };
    const lower = text.toLowerCase();
    for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, i + q.length)) {
      const r = document.createRange();
      r.setStart(...at(i, false));
      r.setEnd(...at(i + q.length, true));
      if (r.getClientRects().length) ranges.push(r);
    }
  }
  return ranges;
}

export default function FindBar({ version, onClose }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  // `version` telt op bij elke wijziging in de editor: dan opnieuw zoeken.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- zie hierboven
  const ranges = useMemo(() => findRanges(query), [query, version]);
  const cur = ranges.length ? Math.min(index, ranges.length - 1) : -1;

  useEffect(() => {
    const hl = globalThis.CSS?.highlights;
    if (hl && globalThis.Highlight) {
      hl.set("zoek", new Highlight(...ranges));
      if (cur >= 0) hl.set("zoek-nu", new Highlight(ranges[cur]));
      else hl.delete("zoek-nu");
    }
    ranges[cur]?.startContainer.parentElement?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    return () => {
      hl?.delete("zoek");
      hl?.delete("zoek-nu");
    };
  }, [ranges, cur]);

  const step = (d) =>
    ranges.length && setIndex((cur + d + ranges.length) % ranges.length);

  return (
    <div
      role="search"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        margin: "0 var(--sp-3) var(--sp-2)",
        padding: "0 4px 0 12px",
        borderRadius: "var(--r-pill)",
        background: "var(--sunken)",
      }}
    >
      <Icon
        name="magnifying-glass"
        size={18}
        style={{ color: "var(--text-muted)" }}
      />
      <input
        autoFocus
        dir="auto"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIndex(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            step(e.shiftKey ? -1 : 1);
          } else if (e.key === "Escape") onClose();
        }}
        placeholder="Zoeken in deze notitie"
        aria-label="Zoeken in deze notitie"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "var(--fs-md)",
          color: "var(--text)",
        }}
      />
      {query.trim() && (
        <span
          aria-live="polite"
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {ranges.length ? `${cur + 1} van ${ranges.length}` : "Geen"}
        </span>
      )}
      <button
        type="button"
        aria-label="Vorige treffer"
        disabled={ranges.length < 2}
        onClick={() => step(-1)}
        style={btn(ranges.length > 1)}
      >
        <Icon name="caret-up" size={20} />
      </button>
      <button
        type="button"
        aria-label="Volgende treffer"
        disabled={ranges.length < 2}
        onClick={() => step(1)}
        style={btn(ranges.length > 1)}
      >
        <Icon name="caret-down" size={20} />
      </button>
      <button
        type="button"
        aria-label="Zoeken sluiten"
        onClick={onClose}
        style={btn(true)}
      >
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}

const btn = (enabled) => ({
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "var(--r-pill)",
  background: "transparent",
  color: "var(--text-muted)",
  opacity: enabled ? 1 : 0.35,
  padding: 0,
});
