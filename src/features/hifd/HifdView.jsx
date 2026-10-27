import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { addDays } from "../../lib/date.js";
import { DEFAULT_SETTINGS } from "../../lib/constants.js";
import { surahById } from "../../lib/surahs.js";
import { nextSrs, INITIAL_EASE } from "../../lib/hifd.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { showToast } from "../../lib/toast.js";
import { today, shortDate } from "./hifdDates.js";
import VandaagView from "./VandaagView.jsx";
import VoortgangView from "./VoortgangView.jsx";
import SurahSheet from "./SurahSheet.jsx";

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

  // Pas tonen zodra de telling geladen is (null → 0 plekken) zodat er nooit
  // kort te veel kaarten verschijnen waarop je per ongeluk kunt tikken.
  const remainingReviews =
    reviewsDoneToday == null ? 0 : Math.max(0, dailyCap - reviewsDoneToday);

  // Alle surahs die vandaag toe zijn (nog niet beoordeeld vandaag → nextDue
  // ligt nog in het verleden/vandaag), los van de daglimiet.
  const dueCount = useMemo(() => {
    const t = today();
    return (hifdRecords || []).filter(
      (r) => r.status === "memorized" && r.nextDue != null && r.nextDue <= t,
    ).length;
  }, [hifdRecords]);

  const reviewList = useMemo(() => {
    const t = today();
    return (hifdRecords || [])
      .filter(
        (r) => r.status === "memorized" && r.nextDue != null && r.nextDue <= t,
      )
      .sort((a, b) =>
        a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : 0,
      )
      .slice(0, remainingReviews);
  }, [hifdRecords, remainingReviews]);

  const ringPct = Math.round((memorizedCount / 114) * 100);

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
    await db.hifd.update(surahId, {
      status: "memorized",
      versesKnown: meta?.verses ?? 0,
      easeFactor: INITIAL_EASE,
      interval: 1,
      reps: 1,
      dateMemorized: t,
      nextDue: addDays(t, 1),
      lastReviewed: t,
    });
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
    await db.hifd.update(surahId, {
      status: "memorized",
      versesKnown: meta?.verses ?? 0,
      easeFactor: INITIAL_EASE,
      interval: 1,
      reps: 1,
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

  async function rateReview(surahId, rating) {
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
      phase: "review",
      note: "",
    });
    const dagen = srs.interval === 1 ? "1 dag" : `${srs.interval} dagen`;
    showToast(`✓ Volgende revisie over ${dagen} (${shortDate(newNextDue)})`);
  }

  const selectedRec = selectedSurah ? hifdMap[selectedSurah] : null;
  const selectedMeta = selectedSurah ? surahById(selectedSurah) : null;

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
          versesKnownTotal={versesKnownTotal}
          learningList={learningList}
          reviewList={reviewList}
          dailyCap={dailyCap}
          reviewsDoneToday={reviewsDoneToday ?? 0}
          dueCount={dueCount}
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
