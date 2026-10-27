import { TOTAL_AYAT } from "../../lib/surahs.js";
import Ring from "../../ui/Ring.jsx";
import Emoji from "../../ui/Emoji.jsx";
import RecallCard from "./RecallCard.jsx";
import LearningCard from "./LearningCard.jsx";

function SectionLabel({ children }) {
  return (
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
      {children}
    </div>
  );
}

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
  const hasReviewSection = reviewList.length > 0 || dueCount > 0;
  const empty = learningList.length === 0 && !hasReviewSection;

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
          {memorizedCount} van 114 surahs ·{" "}
          {versesKnownTotal.toLocaleString("nl-NL")} / {TOTAL_AYAT} verzen
        </div>
      </div>

      {/* Te reviseren */}
      {hasReviewSection && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <SectionLabel>Te reviseren</SectionLabel>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: capReached ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {reviewsDoneToday}/{dailyCap} vandaag
            </span>
          </div>
          {reviewList.map((rec) => (
            <RecallCard key={rec.surah} rec={rec} onRate={onRate} />
          ))}
          {reviewList.length === 0 && capReached && (
            <div
              style={{
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 13,
                color: "var(--accent-text)",
                textAlign: "center",
              }}
            >
              <Emoji char="✅" size={13} /> Daglimiet bereikt ({dailyCap}/
              {dailyCap}).{" "}
              {dueCount > 0
                ? `Nog ${dueCount} ${dueCount === 1 ? "surah wacht" : "surahs wachten"} tot morgen.`
                : "Kom morgen terug."}
            </div>
          )}
        </div>
      )}

      {/* Bezig */}
      {learningList.length > 0 && (
        <div>
          <SectionLabel>Bezig met leren</SectionLabel>
          {learningList.map((rec) => (
            <LearningCard
              key={rec.surah}
              rec={rec}
              onDelta={onDelta}
              onLog={onLog}
              onMarkMemorized={onMarkMemorized}
            />
          ))}
        </div>
      )}

      {empty && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            padding: "32px 0",
          }}
        >
          Niets voor vandaag. Start via Voortgang.
        </div>
      )}
    </div>
  );
}
