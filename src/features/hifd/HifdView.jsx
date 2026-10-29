import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { addDays } from "../../lib/date.js";
import { DEFAULT_SETTINGS } from "../../lib/constants.js";
import { surahById, TOTAL_AYAT } from "../../lib/surahs.js";
import { nextSrs, INITIAL_EASE } from "../../lib/hifd.js";
import { manzilPlan } from "../../lib/manzil.js";
import { showToast } from "../../lib/toast.js";
import { today } from "./hifdDates.js";
import VandaagView from "./VandaagView.jsx";
import VoortgangView from "./VoortgangView.jsx";
import SurahSheet from "./SurahSheet.jsx";

// Velden voor een surah die (helemaal) gememoriseerd is: morgen eerste revisie.
const memorizedFields = (meta, t) => ({
  status: "memorized",
  versesKnown: meta?.verses ?? 0,
  easeFactor: INITIAL_EASE,
  interval: 1,
  reps: 1,
  dateMemorized: t,
  nextDue: addDays(t, 1),
  lastReviewed: t,
});

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HifdView() {
  const [tab, setTab] = useState("vandaag");
  const [selectedSurah, setSelectedSurah] = useState(null);

  const settingsRecord = useLiveQuery(() => db.settings.get("singleton"));
  const dailyCap =
    settingsRecord?.hifdDailyCap ?? DEFAULT_SETTINGS.hifdDailyCap;

  const hifdRecords = useLiveQuery(() => db.hifd.toArray(), []);
  const hifdMap = useMemo(() => {
    const m = {};
    (hifdRecords || []).forEach((r) => (m[r.surah] = r));
    return m;
  }, [hifdRecords]);

  const selectedLog = useLiveQuery(
    () =>
      selectedSurah
        ? db.hifdLogV2
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

  const versesKnownTotal = useMemo(
    () => (hifdRecords || []).reduce((sum, r) => sum + (r.versesKnown ?? 0), 0),
    [hifdRecords],
  );

  const learningList = useMemo(
    () =>
      (hifdRecords || [])
        .filter((r) => r.status === "learning")
        .sort((a, b) => a.surah - b.surah),
    [hifdRecords],
  );

  // Aantal revisies dat vandaag al beoordeeld is — bepaalt de resterende
  // plekken binnen de daglimiet. Zonder dit zou elke afgehandelde revisie een
  // nieuwe due-surah in beeld schuiven en kon je meer dan dailyCap per dag doen.
  const reviewsDoneToday = useLiveQuery(async () => {
    const t = today();
    const logs = await db.hifdLogV2.where("date").equals(t).toArray();
    return logs.reduce((n, l) => (l.phase === "review" ? n + 1 : n), 0);
  }, []);

  // Revisie volgens sabqi + manzil (gekozen 29-10, zie .md/HIFD-ONDERZOEK.md):
  // eerst sabqi (recent of zwak), dan manzil in rotatie binnen het dagbudget.
  // De SRS-velden worden nog wel bijgewerkt, zodat terugschakelen kan.
  const recentLogs = useLiveQuery(
    () => db.hifdLogV2.where("date").above(addDays(today(), -8)).toArray(),
    [],
  );
  const plan = useMemo(
    () => manzilPlan(hifdRecords || [], recentLogs || [], today(), dailyCap),
    [hifdRecords, recentLogs, dailyCap],
  );
  const reviewList = useMemo(
    () =>
      recentLogs
        ? [
            ...plan.sabqiToday.map((r) => ({ ...r, kind: "sabqi" })),
            ...plan.manzilToday.map((r) => ({ ...r, kind: "manzil" })),
          ]
        : [],
    [plan, recentLogs],
  );

  // Voortgang op verzen, niet op surahs: Al-Baqarah (286 verzen) telt zo
  // zwaarder dan Al-Kawthar (3). Bij enige voortgang minstens 1%.
  const versePct = (versesKnownTotal / TOTAL_AYAT) * 100;
  const ringPct = versesKnownTotal ? Math.max(1, Math.round(versePct)) : 0;

  async function updateVersesKnown(surahId, delta) {
    const rec = hifdMap[surahId];
    if (!rec) return;
    const meta = surahById(surahId);
    const newVal = Math.max(0, Math.min(meta.verses, rec.versesKnown + delta));
    await db.hifd.update(surahId, { versesKnown: newVal });
  }

  async function logLearnSession(surahId, rating) {
    const rec = hifdMap[surahId];
    if (!rec) return;
    await db.hifdLogV2.put({
      surah: surahId,
      date: today(),
      versesKnown: rec.versesKnown,
      rating,
      phase: "learn",
      note: "",
    });
    const label =
      { goed: "Goed", redelijk: "Redelijk", zwak: "Zwak" }[rating] ?? rating;
    showToast(`✓ Sessie gelogd — ${label}`);
  }

  async function markMemorized(surahId) {
    const t = today();
    const meta = surahById(surahId);
    await db.hifd.update(surahId, memorizedFields(meta, t));
    await db.hifdLogV2.put({
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
    const meta = surahById(surahId);
    await db.hifd.update(surahId, memorizedFields(meta, t));
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

  async function rateReview(surahId, rating, mistakes = null) {
    const rec = hifdMap[surahId];
    if (!rec) return;
    const t = today();
    const meta = surahById(surahId);
    const srs = nextSrs(rec, rating);
    const newNextDue = addDays(t, srs.interval);
    await db.hifd.update(surahId, {
      easeFactor: srs.easeFactor,
      interval: srs.interval,
      reps: srs.reps,
      lapses: srs.lapses,
      nextDue: newNextDue,
      lastReviewed: t,
    });
    await db.hifdLogV2.put({
      surah: surahId,
      date: t,
      versesKnown: meta?.verses ?? rec.versesKnown,
      rating,
      mistakes,
      phase: "review",
      note: "",
    });
    showToast("✓ Herhaald");
  }

  const selectedRec = selectedSurah ? hifdMap[selectedSurah] : null;
  const selectedMeta = selectedSurah ? surahById(selectedSurah) : null;

  return (
    <div style={{ paddingBottom: "var(--sp-4)" }}>
      <header
        style={{
          padding: "var(--sp-6) var(--sp-5) var(--sp-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-3)",
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Hifd
        </h1>
        <div
          role="tablist"
          aria-label="Weergave"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: "var(--r-md)",
            background: "var(--track)",
          }}
        >
          {[
            { key: "vandaag", label: "Vandaag" },
            { key: "voortgang", label: "Voortgang" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              style={{
                minHeight: 36,
                padding: "0 var(--sp-3)",
                borderRadius: "var(--r-sm)",
                border: "none",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                background: tab === key ? "var(--card)" : "transparent",
                color: tab === key ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "vandaag" && (
        <VandaagView
          ringPct={ringPct}
          memorizedCount={memorizedCount}
          versesKnownTotal={versesKnownTotal}
          learningList={learningList}
          reviewList={reviewList}
          reviewsDoneToday={reviewsDoneToday ?? 0}
          cycleDays={plan.cycleDays}
          onDelta={updateVersesKnown}
          onLog={logLearnSession}
          onMarkMemorized={markMemorized}
          onRate={rateReview}
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
