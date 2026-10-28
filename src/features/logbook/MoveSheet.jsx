import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Kies het notitieboek waar de selectie naartoe gaat.
export default function MoveSheet({ notebooks, currentId, onPick, onClose }) {
  return (
    <Sheet title="Verplaatsen naar…" onClose={onClose}>
      {notebooks
        .filter((n) => n.id !== currentId)
        .map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onPick(n.id)}
            style={{
              width: "100%",
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "none",
              borderBottom: "1px solid var(--border-soft)",
              background: "transparent",
              color: "var(--text)",
              fontSize: "var(--fs-md)",
              textAlign: "start",
              padding: 0,
            }}
          >
            <Emoji char={n.icon} size={22} />
            {n.name}
          </button>
        ))}
    </Sheet>
  );
}
