import { surahById } from "../../lib/surahs.js";
import { nextSrs } from "../../lib/hifd.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";

// Knop-volgorde zwakst → sterkst, met de variant en het voorbeeld-interval.
const RECALL_BUTTONS = [
  { label: "Zwak", value: "zwak", variant: "danger" },
  { label: "Redelijk", value: "redelijk", variant: "secondary" },
  { label: "Goed", value: "goed", variant: "primary" },
  { label: "Sterk", value: "sterk", variant: "primary", strong: true },
];

export default function RecallCard({ rec, onRate }) {
  const meta = surahById(rec.surah);
  if (!meta) return null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--accent-border)",
        borderRadius: 12,
        padding: "16px",
        marginBottom: 10,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "var(--ff-head)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text)",
          }}
        >
          {meta.tr}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
          {meta.name} · #{meta.id} · {meta.verses} verzen
        </div>
        <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
          <Emoji char="🌙" size={11} /> Revisie · zeg uit het hoofd op en
          beoordeel
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {RECALL_BUTTONS.map(({ label, value, variant, strong }) => {
          const days = nextSrs(rec, value).interval;
          return (
            <Button
              key={value}
              variant={variant}
              size="sm"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                lineHeight: 1.1,
                ...(strong
                  ? {
                      background: "var(--accent-strong)",
                      borderColor: "var(--accent-strong)",
                    }
                  : {}),
              }}
              onClick={() => onRate(rec.surah, value)}
            >
              <span>{label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>
                {days}d
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
