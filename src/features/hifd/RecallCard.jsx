import { useState } from "react";
import { surahById } from "../../lib/surahs.js";
import { nextSrs } from "../../lib/hifd.js";
import Card from "../../ui/Card.jsx";

// Knop-volgorde zwakst → sterkst; kleur per knop uit de ontwerptokens.
const RECALL_BUTTONS = [
  {
    label: "Zwak",
    value: "zwak",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
  },
  {
    label: "Redelijk",
    value: "redelijk",
    bg: "var(--sunken)",
    color: "var(--text)",
  },
  {
    label: "Goed",
    value: "goed",
    bg: "var(--accent)",
    color: "var(--accent-contrast)",
  },
  {
    label: "Sterk",
    value: "sterk",
    bg: "var(--accent-bg)",
    color: "var(--accent-text)",
  },
];

const intervalLabel = (days) => (days === 1 ? "morgen" : `${days} d`);

// Optioneel: hoeveel fouten je maakte. Gaat mee in de log (`mistakes`), zodat
// later te zien is welke stukken wegzakken (zie .md/HIFD-ONDERZOEK.md).
const MISTAKES = ["0", "1-2", "3+"];

// Eén revisie tegelijk: de surah groot, daaronder vier beoordelingen met
// wanneer hij dan terugkomt.
export default function RecallCard({ rec, position, total, onRate }) {
  const [mistakes, setMistakes] = useState(null);
  const meta = surahById(rec.surah);
  if (!meta) return null;

  return (
    <Card style={{ gap: "var(--sp-4)", padding: "var(--sp-5) 18px 18px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          {position} van {total} · zeg uit het hoofd op
        </span>
        <span
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: "var(--ff-arabic)",
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {meta.name}
        </span>
        <span
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-lg)",
            fontWeight: 600,
          }}
        >
          {meta.tr}
        </span>
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          Surah {meta.id} · {meta.verses} verzen
        </span>
      </div>
      <div
        role="group"
        aria-label="Fouten"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <span
          style={{
            flex: 1,
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          Fouten
        </span>
        {MISTAKES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mistakes === m}
            onClick={() => setMistakes(mistakes === m ? null : m)}
            style={{
              minWidth: 52,
              minHeight: 40,
              borderRadius: "var(--r-pill)",
              border: "none",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              background: mistakes === m ? "var(--accent-bg)" : "var(--sunken)",
              color: mistakes === m ? "var(--accent-text)" : "var(--text)",
            }}
          >
            {m.replace("-", "–")}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--sp-2)",
        }}
      >
        {RECALL_BUTTONS.map(({ label, value, bg, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => onRate(rec.surah, value, mistakes)}
            style={{
              minHeight: 56,
              borderRadius: "var(--r-md)",
              border: "none",
              background: bg,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 var(--sp-4)",
            }}
          >
            <span style={{ fontSize: "var(--fs-md)", fontWeight: 600 }}>
              {label}
            </span>
            <span style={{ fontSize: "var(--fs-xs)", opacity: 0.85 }}>
              {intervalLabel(nextSrs(rec, value).interval)}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
