// Eén tikbare regel in een lijst of menu-sheet (volle breedte, scheidingslijn
// eronder). Inhoud (icoon, tekst, teller) bepaalt de aanroeper.
export default function ListRow({ danger, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "none",
        borderBottom: "1px solid var(--border-soft)",
        background: "transparent",
        color: danger ? "var(--danger-text)" : "var(--text)",
        fontSize: "var(--fs-md)",
        textAlign: "start",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
