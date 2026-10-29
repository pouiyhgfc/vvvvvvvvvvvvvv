import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { addDays } from "../../lib/date.js";
import { DEFAULT_SETTINGS } from "../../lib/constants.js";
import { hifdStats } from "../../lib/hifdStats.js";
import { surahById } from "../../lib/surahs.js";
import Card from "../../ui/Card.jsx";
import { today } from "../hifd/hifdDates.js";

// Hifd in Statistieken: laatste 30 dagen, los van de gekozen periode.
export default function HifdStatsCard() {
  const data = useLiveQuery(async () => {
    const settings = await db.settings.get("singleton");
    if (settings?.hifdEnabled === false) return null;
    const t = today();
    return hifdStats(
      await db.hifd.toArray(),
      await db.hifdLogV2.where("date").above(addDays(t, -31)).toArray(),
      t,
      settings?.hifdDailyCap ?? DEFAULT_SETTINGS.hifdDailyCap,
    );
  });
  if (!data?.memorized) return null;

  return (
    <Card style={{ marginTop: "var(--sp-3)" }} aria-labelledby="hifd-stats">
      <h2
        id="hifd-stats"
        style={{
          margin: 0,
          fontFamily: "var(--ff-head)",
          fontSize: "var(--fs-lg)",
          fontWeight: 600,
        }}
      >
        Hifd · laatste 30 dagen
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        <Figure value={`${data.coveragePct}%`} label="van je hifd herhaald" />
        <Figure value={data.reviews} label="revisies" />
        <Figure
          value={`${data.cycleDays} d`}
          label="manzil-cyclus"
          warn={data.cycleDays > 30}
        />
      </div>
      {data.cycleDays > 30 && (
        <p style={note}>
          Je manzil duurt langer dan een maand. Verhoog je revisies per dag in
          Meer → Weergave, of plan een inhaaldag.
        </p>
      )}
      {data.weakest.length > 0 && (
        <div>
          <div style={{ ...note, marginBottom: 6 }}>
            Zwakke plekken (beoordeling en fouten)
          </div>
          {data.weakest.map(({ surah }) => {
            const meta = surahById(surah);
            return (
              <div
                key={surah}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  fontSize: "var(--fs-sm)",
                }}
              >
                <span>
                  {surah}. {meta.tr}
                </span>
                <span
                  lang="ar"
                  style={{
                    fontFamily: "var(--ff-arabic)",
                    color: "var(--text-muted)",
                  }}
                >
                  {meta.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Figure({ value, label, warn }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--ff-head)",
          fontSize: "var(--fs-xl)",
          fontWeight: 600,
          color: warn ? "var(--danger-text)" : "var(--text)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

const note = {
  margin: 0,
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
};
