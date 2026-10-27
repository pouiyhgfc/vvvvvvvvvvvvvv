import { bodyPreview } from "../../lib/notes.js";
import Card from "../../ui/Card.jsx";
import Icon from "../../ui/Icon.jsx";

// Ingang naar het logboek van deze dag, met de eerste regel als voorproefje.
export default function TodayLogCard({ entry, onOpen }) {
  const preview = entry && bodyPreview(entry.body);
  return (
    <Card
      onClick={onOpen}
      aria-label={
        entry
          ? "Logboek voor vandaag openen"
          : "Nieuw logboek voor vandaag aanmaken"
      }
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          Logboek van vandaag
        </span>
        <span
          dir="auto"
          style={{
            fontSize: "var(--fs-md)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preview || (entry ? "Openen" : "Schrijf iets over vandaag")}
        </span>
      </span>
      <Icon
        name="caret-right"
        size={20}
        style={{ color: "var(--text-muted)" }}
      />
    </Card>
  );
}
