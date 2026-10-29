import Emoji from "../../ui/Emoji.jsx";
import ListRow from "../../ui/ListRow.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Kies het notitieboek waar de selectie naartoe gaat.
export default function MoveSheet({ notebooks, currentId, onPick, onClose }) {
  return (
    <Sheet title="Verplaatsen naar…" onClose={onClose}>
      {notebooks
        .filter((n) => n.id !== currentId)
        .map((n) => (
          <ListRow key={n.id} onClick={() => onPick(n.id)}>
            <Emoji char={n.icon} size={22} />
            {n.name}
          </ListRow>
        ))}
    </Sheet>
  );
}
