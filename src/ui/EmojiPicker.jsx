import { useState } from "react";
import { EMOJI_CATEGORIES } from "../lib/constants.js";

export default function EmojiPicker({
  value,
  onPick,
  size = 30,
  height = 170,
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(0);
  const query = q.trim().toLowerCase();
  let emojis;
  if (query) {
    const hits = EMOJI_CATEGORIES.filter((c) =>
      (c.name + " " + c.kw).toLowerCase().includes(query),
    );
    emojis = (hits.length ? hits : EMOJI_CATEGORIES).flatMap((c) => c.emojis);
    emojis = [...new Set(emojis)];
  } else {
    emojis = EMOJI_CATEGORIES[cat].emojis;
  }
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 8,
        border: "1px solid var(--border)",
        padding: 6,
      }}
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Zoek (bv. sport, eten, gebed)..."
        style={{
          width: "100%",
          padding: "6px 9px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          fontSize: 12,
          outline: "none",
          marginBottom: 6,
          background: "var(--input-bg)",
        }}
      />
      {!query && (
        <div
          style={{
            display: "flex",
            gap: 4,
            overflowX: "auto",
            paddingBottom: 5,
            marginBottom: 5,
            borderBottom: "1px solid var(--border)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {EMOJI_CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setCat(i)}
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 600,
                padding: "4px 9px",
                borderRadius: 99,
                whiteSpace: "nowrap",
                border:
                  cat === i ? "1.5px solid #059669" : "1px solid var(--border)",
                background: cat === i ? "var(--sel-bg)" : "var(--card)",
                color: cat === i ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {c.name} {c.emojis[0]}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          maxHeight: height,
          overflowY: "auto",
          padding: 2,
        }}
      >
        {emojis.map((e, idx) => (
          <button
            key={e + idx}
            onClick={() => onPick(e)}
            style={{
              width: size,
              height: size,
              borderRadius: 6,
              border:
                value === e ? "2px solid #059669" : "1px solid var(--border)",
              background: value === e ? "var(--sel-bg)" : "var(--card)",
              fontSize: size * 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {e}
          </button>
        ))}
        {emojis.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--text-faint)", padding: 8 }}>
            Niets gevonden.
          </div>
        )}
      </div>
    </div>
  );
}
