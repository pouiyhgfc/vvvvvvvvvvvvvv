import { copyText, shareText } from "../../lib/share.js";
import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";

const ASKS = [
  ["Samenvatten", "Vat deze notitie kort samen in een paar zinnen."],
  [
    "Structureren",
    "Zet deze notitie om in een heldere structuur met kopjes en punten. Verzin niets bij.",
  ],
  [
    "Actiepunten",
    "Haal de concrete actiepunten uit deze notitie, als korte lijst.",
  ],
];

// Eén notitie met een vaste opdracht naar Claude, via delen of kopiëren.
// `getText()` geeft de actuele tekst (titel + markdown) van de notitie.
export default function AskClaudeSheet({ getText, onClose }) {
  const build = async (ask) => `${ask}\n\n---\n\n${await getText()}`;
  return (
    <Sheet
      title="Vraag Claude"
      subtitle="Via delen of kopiëren"
      onClose={onClose}
    >
      {ASKS.map(([label, ask]) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minHeight: 56,
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <span style={{ flex: 1, fontSize: "var(--fs-md)" }}>{label}</span>
          <button
            type="button"
            aria-label={`${label}: kopiëren`}
            onClick={async () => copyText(await build(ask))}
            style={iconBtn}
          >
            <Icon name="copy" size={20} />
          </button>
          <button
            type="button"
            aria-label={`${label}: delen`}
            onClick={async () => shareText(await build(ask), label)}
            style={{ ...iconBtn, color: "var(--accent-text)" }}
          >
            <Icon name="share-network" size={20} />
          </button>
        </div>
      ))}
    </Sheet>
  );
}

const iconBtn = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "var(--r-pill)",
  background: "transparent",
  color: "var(--text-muted)",
  padding: 0,
};
