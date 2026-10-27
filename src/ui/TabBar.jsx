import Icon from "./Icon.jsx";

// Zwevende tabbalk onderin (ontwerp v2). Vaste plekken, duim-bereikbaar.
// `items`: [{ id, label, icon }]; `active`: id van de actieve tab.
export default function TabBar({ items, active, onSelect }) {
  return (
    <nav
      aria-label="Hoofdmenu"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        padding:
          "0 var(--sp-4) calc(var(--sp-4) + env(safe-area-inset-bottom))",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 508,
          margin: "0 auto",
          height: 64,
          padding: "0 6px",
          background: "var(--card)",
          borderRadius: 22,
          boxShadow: "var(--shadow-float)",
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        {items.map(({ id, label, icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                height: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: "transparent",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                fontSize: "var(--fs-xs)",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon name={icon} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
