import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { surahById } from "../../lib/surahs.js";
import Icon from "../../ui/Icon.jsx";
import { today } from "./hifdDates.js";

const RATINGS = [
  { label: "Goed", value: "goed" },
  { label: "Redelijk", value: "redelijk" },
  { label: "Zwak", value: "zwak" },
];

// Eén surah die je aan het leren bent: verzen bijstellen en de sessie van
// vandaag beoordelen. Alles gekend → markeren als gememoriseerd.
export default function LearningCard({ rec, onDelta, onLog, onMarkMemorized }) {
  const meta = surahById(rec.surah);
  const logToday = useLiveQuery(
    () => db.hifdLogV2.get([rec.surah, today(), "learn"]),
    [rec.surah],
  );
  if (!meta) return null;
  const full = rec.versesKnown >= meta.verses;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "var(--sp-3) 0",
        borderTop: "1px solid var(--border-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            flex: 1,
            fontSize: "var(--fs-md)",
            fontWeight: 600,
          }}
        >
          {meta.tr}
        </span>
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          {rec.versesKnown} / {meta.verses}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          aria-label="Een vers minder"
          onClick={() => onDelta(rec.surah, -1)}
          disabled={rec.versesKnown === 0}
          style={{
            ...stepBtn,
            opacity: rec.versesKnown === 0 ? 0.4 : 1,
          }}
        >
          <Icon name="minus" size={20} />
        </button>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "var(--track)",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              height: 6,
              width: `${(rec.versesKnown / meta.verses) * 100}%`,
              background: "var(--accent)",
              borderRadius: 3,
              transition: "width .3s",
            }}
          />
        </div>
        <button
          type="button"
          aria-label="Een vers meer"
          onClick={() => onDelta(rec.surah, 1)}
          disabled={full}
          style={{ ...stepBtn, opacity: full ? 0.4 : 1 }}
        >
          <Icon name="plus" size={20} />
        </button>
      </div>

      {full ? (
        <button
          type="button"
          onClick={() => onMarkMemorized(rec.surah)}
          style={{
            ...pill,
            width: "100%",
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          Markeer als gememoriseerd
        </button>
      ) : (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              marginRight: 4,
            }}
          >
            Hoe ging het?
          </span>
          {RATINGS.map(({ label, value }) => {
            const chosen = logToday?.rating === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={chosen}
                onClick={() => onLog(rec.surah, value)}
                style={{
                  ...pill,
                  background: chosen ? "var(--accent-bg)" : "var(--sunken)",
                  color: chosen ? "var(--accent-text)" : "var(--text)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const stepBtn = {
  width: 40,
  height: 40,
  borderRadius: "var(--r-sm)",
  border: "none",
  background: "var(--accent-bg)",
  color: "var(--accent-text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const pill = {
  minHeight: 36,
  padding: "0 var(--sp-3)",
  borderRadius: "var(--r-pill)",
  border: "none",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
};
