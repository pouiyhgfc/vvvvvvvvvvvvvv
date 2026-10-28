import { TOTAL_AYAT } from "../../lib/surahs.js";
import Card from "../../ui/Card.jsx";
import Ring from "../../ui/Ring.jsx";
import RecallCard from "./RecallCard.jsx";
import LearningCard from "./LearningCard.jsx";

const cardTitle = {
  margin: 0,
  fontFamily: "var(--ff-head)",
  fontSize: "var(--fs-lg)",
  fontWeight: 600,
};

export default function VandaagView({
  ringPct,
  memorizedCount,
  versesKnownTotal,
  learningList,
  reviewList,
  dailyCap,
  reviewsDoneToday,
  dueCount,
  onDelta,
  onLog,
  onMarkMemorized,
  onRate,
}) {
  const capReached = reviewsDoneToday >= dailyCap;
  const empty =
    learningList.length === 0 && reviewList.length === 0 && dueCount === 0;
  const next = reviewList[0];

  return (
    <div
      style={{
        padding: "0 var(--sp-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-3)",
      }}
    >
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Ring value={ringPct} size={56} stroke={6} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: "var(--fs-md)", fontWeight: 600 }}>
            {versesKnownTotal.toLocaleString("nl-NL")} van{" "}
            {TOTAL_AYAT.toLocaleString("nl-NL")} verzen
          </span>
          <span
            style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
          >
            Revisie vandaag: {reviewsDoneToday} van {dailyCap}
          </span>
          <span
            style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}
          >
            {memorizedCount} van 114 surahs gememoriseerd
          </span>
        </div>
      </Card>

      {next && (
        <RecallCard
          key={next.surah}
          rec={next}
          position={reviewsDoneToday + 1}
          total={reviewsDoneToday + reviewList.length}
          onRate={onRate}
        />
      )}
      {!next && capReached && dueCount > 0 && (
        <Card
          style={{
            background: "var(--accent-bg)",
            color: "var(--accent-text)",
            fontSize: "var(--fs-sm)",
          }}
        >
          Daglimiet bereikt ({dailyCap}/{dailyCap}). Nog {dueCount}{" "}
          {dueCount === 1 ? "surah wacht" : "surahs wachten"} tot morgen.
        </Card>
      )}

      {learningList.length > 0 && (
        <Card style={{ gap: 0, paddingBottom: 6 }}>
          <h2 style={{ ...cardTitle, marginBottom: "var(--sp-2)" }}>
            Aan het leren
          </h2>
          {learningList.map((rec) => (
            <LearningCard
              key={rec.surah}
              rec={rec}
              onDelta={onDelta}
              onLog={onLog}
              onMarkMemorized={onMarkMemorized}
            />
          ))}
        </Card>
      )}

      {empty && (
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "var(--fs-sm)",
            padding: "var(--sp-6) 0",
            margin: 0,
          }}
        >
          Niets voor vandaag. Kies een surah via Voortgang.
        </p>
      )}
    </div>
  );
}
