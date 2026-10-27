import Icon from "./Icon.jsx";

// Terug-knop bovenaan een subpagina ("‹ Meer").
export default function BackButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 44,
        padding: "0 var(--sp-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        background: "transparent",
        color: "var(--accent-text)",
        fontSize: "var(--fs-md)",
      }}
    >
      <Icon name="caret-left" size={20} />
      {children}
    </button>
  );
}
