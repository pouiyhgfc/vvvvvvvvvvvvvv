// Witte kaart van ontwerp B. Met `onClick` wordt het een knop (hele kaart
// tikbaar), anders een <section>.
export default function Card({ onClick, style, children, ...rest }) {
  const Tag = onClick ? "button" : "section";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        padding: "var(--sp-4) 18px",
        border: "none",
        width: "100%",
        textAlign: "left",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-3)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
