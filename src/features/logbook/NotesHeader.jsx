import Button from "../../ui/Button.jsx";
import Icon from "../../ui/Icon.jsx";

const squareBtn = {
  width: 44,
  height: 44,
  borderRadius: "var(--r-md)",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

// Kop van Notities: titel met menu en "nieuwe notitie", of tijdens
// selecteren het aantal geselecteerd met Alles/Annuleren.
export default function NotesHeader({
  selectMode,
  selectedCount,
  onSelectAll,
  onCancelSelect,
  onMenu,
  onNew,
}) {
  if (selectMode)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          minHeight: 48,
          marginBottom: "var(--sp-4)",
          padding: "0 var(--sp-1)",
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-xl)",
            fontWeight: 600,
          }}
        >
          {selectedCount} geselecteerd
        </span>
        <Button variant="secondary" size="sm" onClick={onSelectAll}>
          Alles
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancelSelect}>
          Annuleren
        </Button>
      </div>
    );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        marginBottom: "var(--sp-4)",
        padding: "0 var(--sp-1)",
      }}
    >
      <h1
        style={{
          flex: 1,
          margin: 0,
          fontFamily: "var(--ff-head)",
          fontSize: "var(--fs-2xl)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        Notities
      </h1>
      <button
        type="button"
        aria-label="Meer opties"
        onClick={onMenu}
        style={{
          ...squareBtn,
          background: "var(--card)",
          color: "var(--text)",
        }}
      >
        <Icon name="dots-three-vertical" size={22} />
      </button>
      <button
        type="button"
        aria-label="Nieuwe notitie"
        onClick={onNew}
        style={{
          ...squareBtn,
          background: "var(--accent)",
          color: "var(--accent-contrast)",
        }}
      >
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
