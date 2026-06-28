import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { dk, addDays } from "../../lib/date.js";
import { SURAHS } from "../../lib/surahs.js";
import { heatColor } from "../../lib/heat.js";
import Ring from "../../ui/Ring.jsx";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";

function today() {
  return dk(new Date());
}

// ─── Vandaag ─────────────────────────────────────────────────────────────────

function LearningCard({ rec, onDelta, onLog, onMarkMemorized }) {
  const meta = SURAHS.find((s) => s.id === rec.surah);
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
            fontFamily: "var(--ff-head)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--accent)",
          }}
        >
          {rec.versesKnown} / {meta.verses}
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

function VandaagView({
  ringPct,
  memorizedCount,
  learningList,
  onDelta,
  onLog,
  onMarkMemorized,
}) {
  return (
    <div style={{ padding: "0 16px" }}>
      {/* Ring */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0 20px",
        }}
      >
        <Ring value={ringPct} size={100} stroke={9} label="gememoriseerd" />
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {memorizedCount} van 114 surahs
        </div>
      </div>

      {/* Bezig */}
      {learningList.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            padding: "24px 0",
          }}
        >
          Geen surahs in leerproces. Start via Voortgang.
        </div>
      ) : (
        <>
          <div
            style={{
              fontFamily: "var(--ff-head)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Bezig met leren
          </div>
          {learningList.map((rec) => (
            <LearningCard
              key={rec.surah}
              rec={rec}
              onDelta={onDelta}
              onLog={onLog}
              onMarkMemorized={onMarkMemorized}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Voortgang ────────────────────────────────────────────────────────────────

function VoortgangView({ hifdMap, onSelect }) {
  const sorted = [...SURAHS].sort((a, b) => b.id - a.id);

  return (
    <div style={{ padding: "0 16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: 8,
        }}
      >
        {sorted.map((meta) => {
          const rec = hifdMap[meta.id];
          const pct = rec ? (rec.versesKnown / meta.verses) * 100 : 0;
          const bg = heatColor(pct);
          const isMemorized = rec?.status === "memorized";
          return (
            <button
              key={meta.id}
              onClick={() => onSelect(meta.id)}
              style={{
                background: bg,
                border: isMemorized
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border-soft)",
                borderRadius: 10,
                padding: "8px 4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-head)",
                  fontWeight: 700,
                  fontSize: 11,
                  color: pct >= 75 ? "#fff" : "var(--text)",
                }}
              >
                {meta.id}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color:
                    pct >= 75 ? "rgba(255,255,255,.8)" : "var(--text-muted)",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {meta.tr.length > 10 ? meta.tr.slice(0, 9) + "…" : meta.tr}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function SurahSheet({
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
      subtitle={`${meta.name} · ${meta.verses} verzen`}
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
            fontSize: 11,
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
            style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}
          >
            Gememoriseerd op {rec.dateMemorized}
          </span>
        )}
      </div>

      {/* Recente sessies */}
      {log.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
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
              <span>{entry.date}</span>
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HifdView() {
  const [tab, setTab] = useState("vandaag");
  const [selectedSurah, setSelectedSurah] = useState(null);

  const hifdRecords = useLiveQuery(() => db.hifd.toArray(), []);
  const hifdMap = useMemo(() => {
    const m = {};
    (hifdRecords || []).forEach((r) => (m[r.surah] = r));
    return m;
  }, [hifdRecords]);

  const selectedLog = useLiveQuery(
    () =>
      selectedSurah
        ? db.hifdLog
            .where("surah")
            .equals(selectedSurah)
            .reverse()
            .limit(10)
            .toArray()
        : Promise.resolve([]),
    [selectedSurah],
  );

  const memorizedCount = useMemo(
    () => (hifdRecords || []).filter((r) => r.status === "memorized").length,
    [hifdRecords],
  );

  const learningList = useMemo(
    () =>
      (hifdRecords || [])
        .filter((r) => r.status === "learning")
        .sort((a, b) => a.surah - b.surah),
    [hifdRecords],
  );

  const ringPct = Math.round((memorizedCount / 114) * 100);

  async function updateVersesKnown(surahId, delta) {
    const rec = hifdMap[surahId];
    if (!rec) return;
    const meta = SURAHS.find((s) => s.id === surahId);
    const newVal = Math.max(0, Math.min(meta.verses, rec.versesKnown + delta));
    await db.hifd.update(surahId, { versesKnown: newVal });
  }

  async function logLearnSession(surahId, rating) {
    const rec = hifdMap[surahId];
    if (!rec) return;
    await db.hifdLog.put({
      surah: surahId,
      date: today(),
      versesKnown: rec.versesKnown,
      rating,
      phase: "learn",
      note: "",
    });
  }

  async function markMemorized(surahId) {
    const t = today();
    const meta = SURAHS.find((s) => s.id === surahId);
    await db.hifd.update(surahId, {
      status: "memorized",
      versesKnown: meta?.verses ?? 0,
      srsStep: 0,
      dateMemorized: t,
      nextDue: addDays(t, 1),
      lastReviewed: t,
    });
    await db.hifdLog.put({
      surah: surahId,
      date: t,
      versesKnown: meta?.verses ?? 0,
      rating: "goed",
      phase: "learn",
      note: "",
    });
  }

  async function startLearning(surahId) {
    await db.hifd.update(surahId, { status: "learning", dateStarted: today() });
    setSelectedSurah(null);
  }

  async function markFullyMemorized(surahId) {
    const t = today();
    const meta = SURAHS.find((s) => s.id === surahId);
    await db.hifd.update(surahId, {
      status: "memorized",
      versesKnown: meta?.verses ?? 0,
      srsStep: 0,
      dateMemorized: t,
      nextDue: addDays(t, 1),
      lastReviewed: t,
    });
    setSelectedSurah(null);
  }

  async function backToLearning(surahId) {
    await db.hifd.update(surahId, {
      status: "learning",
      nextDue: null,
      dateMemorized: null,
    });
    setSelectedSurah(null);
  }

  const selectedRec = selectedSurah ? hifdMap[selectedSurah] : null;
  const selectedMeta = selectedSurah
    ? SURAHS.find((s) => s.id === selectedSurah)
    : null;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 8px" }}>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
          }}
        >
          Hifd
        </h1>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        {[
          { key: "vandaag", label: "Vandaag", emoji: "📋" },
          { key: "voortgang", label: "Voortgang", emoji: "📈" },
        ].map(({ key, label, emoji }) => (
          <Button
            key={key}
            variant={tab === key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTab(key)}
          >
            <Emoji char={emoji} size={12} /> {label}
          </Button>
        ))}
      </div>

      {tab === "vandaag" && (
        <VandaagView
          ringPct={ringPct}
          memorizedCount={memorizedCount}
          learningList={learningList}
          onDelta={updateVersesKnown}
          onLog={logLearnSession}
          onMarkMemorized={markMemorized}
        />
      )}

      {tab === "voortgang" && (
        <VoortgangView
          hifdMap={hifdMap}
          onSelect={(id) => setSelectedSurah(id)}
        />
      )}

      {/* Detail sheet */}
      {selectedSurah && selectedRec && selectedMeta && (
        <SurahSheet
          rec={selectedRec}
          meta={selectedMeta}
          log={selectedLog || []}
          onClose={() => setSelectedSurah(null)}
          onStartLearning={startLearning}
          onMarkFullyMemorized={markFullyMemorized}
          onBackToLearning={backToLearning}
          onDelta={updateVersesKnown}
        />
      )}
    </div>
  );
}
