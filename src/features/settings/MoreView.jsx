import Icon from "../../ui/Icon.jsx";

// "Meer"-tab: ingang naar Statistieken, met daaronder de instellingen.
// (De instellingen worden in een volgende stap per onderdeel een eigen
// subpagina; nu staan ze nog als één lijst onder elkaar.)
export default function MoreView({ onOpenStats, children }) {
  return (
    <div>
      <header style={{ padding: "var(--sp-6) var(--sp-5) var(--sp-3)" }}>
        <h1
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Meer
        </h1>
      </header>
      <div style={{ padding: "0 var(--sp-4)" }}>
        <button
          onClick={onOpenStats}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "var(--sp-4) 18px",
            background: "var(--card)",
            borderRadius: "var(--r-lg)",
            color: "var(--text)",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--accent-bg)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="chart" size={22} />
          </span>
          <span style={{ flex: 1, fontSize: "var(--fs-md)", fontWeight: 600 }}>
            Statistieken
          </span>
          <Icon
            name="chevronRight"
            size={18}
            style={{ color: "var(--text-muted)" }}
          />
        </button>
      </div>
      {children}
    </div>
  );
}
