import Icon from "../../ui/Icon.jsx";

// Zoekbalk boven de notitielijst (titel, tekst en tags).
export default function NoteSearch({ value, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 48,
        padding: "0 var(--sp-4)",
        borderRadius: "var(--r-md)",
        background: "var(--card)",
        marginBottom: "var(--sp-3)",
        color: "var(--text-muted)",
      }}
    >
      <Icon name="magnifying-glass" size={20} />
      <input
        dir="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Zoeken in notities en tags"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text)",
          fontSize: "var(--fs-md)",
        }}
      />
    </label>
  );
}
