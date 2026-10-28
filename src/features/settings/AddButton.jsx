import Icon from "../../ui/Icon.jsx";

// Ronde icoonknop voor "toevoegen"/"opslaan" in de kop van een sectie of
// dagdeel. Het label staat in aria-label (en dus ook als tooltip).
export default function AddButton({ label, icon = "plus", onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "var(--r-pill)",
        background: "var(--accent-bg)",
        color: "var(--accent-text)",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
