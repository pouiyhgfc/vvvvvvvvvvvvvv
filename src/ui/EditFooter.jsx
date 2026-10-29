import Button from "./Button.jsx";
import Emoji from "./Emoji.jsx";

// Onderbalk van een bewerk-sheet: verwijderen (alleen bij bewerken) en
// Opslaan of Toevoegen.
export default function EditFooter({ isEdit, canSave, onSave, onDelete }) {
  return (
    <>
      {isEdit && onDelete && (
        <Button variant="danger" onClick={onDelete}>
          <Emoji char="🗑️" size={16} />
        </Button>
      )}
      <Button onClick={onSave} disabled={!canSave} style={{ flex: 1 }}>
        {isEdit ? (
          <>
            <Emoji char="💾" size={14} /> Opslaan
          </>
        ) : (
          <>
            <Emoji char="✅" size={14} /> Toevoegen
          </>
        )}
      </Button>
    </>
  );
}
