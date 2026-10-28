import { INITIAL_EASE } from "../../lib/hifd.js";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import { shortDate } from "./hifdDates.js";

export default function SurahSheet({
  rec,
  meta,
  log,
  onClose,
  onStartLearning,
  onMarkFullyMemorized,
  onBackToLearning,
  onDelta,
}) {
  return (
    <Sheet
      title={`${meta.tr} (${meta.id})`}
      subtitle={
        <>
          <bdi>{meta.name}</bdi> · {meta.verses} verzen
        </>
      }
      onClose={onClose}
    >
      {/* Voortgangsbalk */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 6,
          }}
        >
          <span>Gekend</span>
          <span>
            {rec.versesKnown} / {meta.verses}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "var(--border-soft)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(rec.versesKnown / meta.verses) * 100}%`,
              background: "var(--accent)",
              borderRadius: 4,
            }}
          />
        </div>

        {rec.status === "learning" && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              alignItems: "center",
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
                opacity: rec.versesKnown === 0 ? 0.4 : 1,
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                flex: 1,
                textAlign: "center",
              }}
            >
              verzen aanpassen
            </span>
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
                opacity: rec.versesKnown >= meta.verses ? 0.4 : 1,
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            background:
              rec.status === "memorized"
                ? "var(--accent-bg)"
                : rec.status === "learning"
                  ? "var(--purple-bg)"
                  : "var(--card2)",
            color:
              rec.status === "memorized"
                ? "var(--accent-text)"
                : rec.status === "learning"
                  ? "var(--purple-text)"
                  : "var(--text-muted)",
          }}
        >
          {rec.status === "memorized"
            ? "✓ Gememoriseerd"
            : rec.status === "learning"
              ? "Bezig met leren"
              : "Nog niet begonnen"}
        </span>
        {rec.dateMemorized && (
          <span
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              marginLeft: 8,
            }}
          >
            Gememoriseerd op {shortDate(rec.dateMemorized)}
          </span>
        )}
      </div>

      {/* SRS-statistieken (alleen gememoriseerd) */}
      {rec.status === "memorized" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Sterkte",
              value: (rec.easeFactor ?? INITIAL_EASE).toFixed(2),
            },
            { label: "Interval", value: `${rec.interval ?? 0}d` },
            { label: "Herhaald", value: rec.reps ?? 0 },
            { label: "Terugval", value: rec.lapses ?? 0 },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--card2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                padding: "8px 4px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-head)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--text)",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
          {rec.nextDue && (
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Volgende revisie: {shortDate(rec.nextDue)}
            </div>
          )}
        </div>
      )}

      {/* Recente sessies */}
      {log.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".04em",
              marginBottom: 6,
            }}
          >
            Recente sessies
          </div>
          {log.map((entry) => (
            <div
              key={entry.date}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--text-muted)",
                padding: "4px 0",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <span>{shortDate(entry.date)}</span>
              <span>
                {entry.versesKnown} verzen ·{" "}
                <span
                  style={{
                    color:
                      entry.rating === "goed"
                        ? "var(--accent)"
                        : entry.rating === "zwak"
                          ? "var(--danger-text)"
                          : "var(--text)",
                  }}
                >
                  {entry.rating}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Acties */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rec.status === "todo" && (
          <Button
            variant="primary"
            full
            onClick={() => onStartLearning(rec.surah)}
          >
            Start met leren
          </Button>
        )}
        {(rec.status === "todo" || rec.status === "learning") && (
          <Button
            variant="secondary"
            full
            onClick={() => onMarkFullyMemorized(rec.surah)}
          >
            Ik ken deze al volledig
          </Button>
        )}
        {rec.status === "memorized" && (
          <Button
            variant="danger"
            full
            onClick={() => onBackToLearning(rec.surah)}
          >
            Terug naar bezig
          </Button>
        )}
        {rec.status === "learning" && (
          <Button
            variant="danger"
            full
            onClick={() => onBackToLearning(rec.surah)}
          >
            Terug naar bezig
          </Button>
        )}
      </div>
    </Sheet>
  );
}
