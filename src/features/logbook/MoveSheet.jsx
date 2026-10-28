import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Kies het notitieboek waar de selectie naartoe gaat.
export default function MoveSheet({ notebooks, currentId, onPick, onClose }) {
  return (
    <Sheet title="Verplaatsen naar…" onClose={onClose}>
      {notebooks
        .filter((n) => n.id !== currentId)
        .map((n) => (
          <div
            key={n.id}
            onClick={() => onPick(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 4px",
              borderBottom: "1px solid var(--border-soft)",
              cursor: "pointer",
            }}
          >
            <Emoji char={n.icon} size={18} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {n.name}
            </span>
          </div>
        ))}
    </Sheet>
  );
}
