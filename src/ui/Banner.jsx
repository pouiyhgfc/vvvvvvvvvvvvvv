import Emoji from "./Emoji.jsx";

// Blijvende melding bovenaan een scherm (i.t.t. een toast, die na een paar
// seconden verdwijnt). Voor dingen die je niet mag missen, met knoppen eronder.
const TONES = {
  accent: {
    background: "var(--accent-bg)",
    border: "1px solid var(--accent-border)",
    color: "var(--accent-text)",
  },
  danger: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger-border)",
    color: "var(--danger-text)",
  },
};

export default function Banner({ tone = "accent", icon, children, actions }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      style={{
        ...TONES[tone],
        borderRadius: 12,
        padding: "12px 14px",
        margin: "12px 14px 0",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {icon && <Emoji char={icon} size={16} />}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
      {actions && (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 10,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
