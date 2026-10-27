import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { surahById } from "../../lib/surahs.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { today } from "./hifdDates.js";

const RATING_LABEL = { goed: "Goed", redelijk: "Redelijk", zwak: "Zwak" };
const RATING_COLOR = {
  goed: "var(--accent)",
  redelijk: "var(--text-muted)",
  zwak: "var(--danger-text)",
};

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
        background: "var(--card)",
        border: "1px solid var(--border-soft)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--ff-head)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
            }}
          >
            {meta.tr}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {meta.name} · #{meta.id}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "var(--ff-head)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--accent)",
            }}
          >
            {rec.versesKnown} / {meta.verses}
          </div>
          {logToday && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: RATING_COLOR[logToday.rating] ?? "var(--text-muted)",
                background: "var(--card2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 6,
                padding: "1px 6px",
              }}
            >
              ✓ {RATING_LABEL[logToday.rating] ?? logToday.rating}
            </span>
          )}
        </div>
      </div>

      {/* Versteller */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => onDelta(rec.surah, -1)}
          disabled={rec.versesKnown === 0}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--card2)",
            border: "1px solid var(--border)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text)",
            opacity: rec.versesKnown === 0 ? 0.4 : 1,
          }}
        >
          −
        </button>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "var(--border-soft)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(rec.versesKnown / meta.verses) * 100}%`,
              background: "var(--accent)",
              borderRadius: 3,
              transition: "width .3s",
            }}
          />
        </div>
        <button
          onClick={() => onDelta(rec.surah, 1)}
          disabled={rec.versesKnown >= meta.verses}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--card2)",
            border: "1px solid var(--border)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text)",
            opacity: rec.versesKnown >= meta.verses ? 0.4 : 1,
          }}
        >
          +
        </button>
      </div>

      {full ? (
        <Button
          variant="primary"
          size="sm"
          full
          onClick={() => onMarkMemorized(rec.surah)}
        >
          <Emoji char="✅" size={13} /> Markeer als gememoriseerd
        </Button>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "Goed", value: "goed", variant: "primary" },
            { label: "Redelijk", value: "redelijk", variant: "secondary" },
            { label: "Zwak", value: "zwak", variant: "danger" },
          ].map(({ label, value, variant }) => (
            <Button
              key={value}
              variant={variant}
              size="sm"
              style={{ flex: 1 }}
              onClick={() => onLog(rec.surah, value)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
