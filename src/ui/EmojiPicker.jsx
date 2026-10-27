import { useState } from "react";
import { ICON_CATEGORIES } from "../lib/constants.js";
import Emoji from "./Emoji.jsx";
import { TextInput } from "./Field.jsx";

// Icoonkiezer: zoeken of een groep kiezen, dan een icoon aantikken. Slaat
// het emoji op dat bij het icoon hoort (zie ICON_CATEGORIES).
export default function EmojiPicker({ value, onPick }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(0);
  const query = q.trim().toLowerCase();

  let emojis;
  if (query) {
    const hits = ICON_CATEGORIES.filter((c) =>
      (c.name + " " + c.kw).toLowerCase().includes(query),
    );
    emojis = hits.flatMap((c) => c.emojis);
  } else {
    emojis = ICON_CATEGORIES[cat].emojis;
  }

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-soft)",
        padding: "var(--sp-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-3)",
      }}
    >
      <TextInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek, bv. sport, gebed, taal"
        aria-label="Zoek icoon"
        style={{ fontSize: "var(--fs-md)" }}
      />
      {!query && (
        <div
          style={{
            display: "flex",
            gap: "var(--sp-2)",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {ICON_CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCat(i)}
              aria-pressed={cat === i}
              style={{
                flexShrink: 0,
                minHeight: 36,
                padding: "0 var(--sp-3)",
                borderRadius: "var(--r-pill)",
                whiteSpace: "nowrap",
                fontSize: "var(--fs-sm)",
                fontWeight: 500,
                border: "none",
                background: cat === i ? "var(--accent-bg)" : "var(--sunken)",
                color: cat === i ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
          gap: 6,
          maxHeight: 200,
          overflowY: "auto",
          padding: 2,
        }}
      >
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            aria-pressed={value === e}
            style={{
              height: 44,
              borderRadius: "var(--r-sm)",
              border: "none",
              outline: value === e ? "2px solid var(--accent)" : "none",
              background: value === e ? "var(--accent-bg)" : "var(--sunken)",
              color: value === e ? "var(--accent-text)" : "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Emoji char={e} size={24} />
          </button>
        ))}
        {emojis.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              padding: "var(--sp-2)",
            }}
          >
            Niets gevonden.
          </div>
        )}
      </div>
    </div>
  );
}
