import { eventsOnDate, isToday } from "../../lib/date.js";
import Card from "../../ui/Card.jsx";

const MAX = 3;
const minutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Wat er vandaag nu en straks gepland staat (of op een andere dag: de
// eerste blokken van die dag). Tikken opent de Planning. Niets gepland:
// dan geen kaart.
export default function UpNextCard({ date, calEvents, onOpen }) {
  const today = isToday(date);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const events = eventsOnDate(calEvents, date)
    .filter((e) => !today || minutes(e.endTime) > nowMin)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, MAX);
  if (events.length === 0) return null;

  return (
    <Card onClick={onOpen} aria-label="Open de planning">
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--ff-head)",
          fontSize: "var(--fs-lg)",
          fontWeight: 600,
        }}
      >
        {today ? "Nu en straks" : "Gepland"}
      </h2>
      {events.map((e) => {
        const ongoing = today && minutes(e.startTime) <= nowMin;
        return (
          <span
            key={e.id + e.date}
            style={{ display: "flex", gap: 12, alignItems: "center" }}
          >
            <span
              style={{
                width: 4,
                alignSelf: "stretch",
                borderRadius: 2,
                background: e.color,
              }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                dir="auto"
                style={{ fontSize: "var(--fs-md)", fontWeight: 600 }}
              >
                {e.title}
              </span>
              <span
                style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
              >
                {e.startTime} – {e.endTime}
              </span>
            </span>
            {ongoing && (
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: 600,
                  color: "var(--accent-text)",
                  background: "var(--accent-bg)",
                  borderRadius: "var(--r-pill)",
                  padding: "4px 10px",
                }}
              >
                Nu
              </span>
            )}
          </span>
        );
      })}
    </Card>
  );
}
