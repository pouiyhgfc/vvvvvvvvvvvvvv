import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Alles wat niet dagelijks nodig is, achter de ⋯-knop: sorteren, selecteren,
// notitieboeken beheren, archief en prullenbak.
export default function NotesMenuSheet({
  sortMode,
  onSort,
  onSelect,
  onEditNotebook,
  onOrderNotebooks,
  onArchive,
  onTrash,
  archiveCount,
  trashCount,
  onClose,
}) {
  const act = (fn) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet title="Notities" onClose={onClose}>
      <p style={label}>Volgorde</p>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: "var(--r-md)",
          background: "var(--sunken)",
          marginBottom: "var(--sp-4)",
        }}
      >
        {[
          ["eigen", "Eigen"],
          ["datum", "Datum"],
        ].map(([mode, text]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={sortMode === mode}
            onClick={() => onSort(mode)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: "var(--r-sm)",
              border: "none",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              background: sortMode === mode ? "var(--card)" : "transparent",
              boxShadow: sortMode === mode ? "0 1px 3px var(--shadow)" : "none",
              color: sortMode === mode ? "var(--text)" : "var(--text-muted)",
            }}
          >
            {text}
          </button>
        ))}
      </div>
      {onSelect && (
        <Row icon="list-checks" label="Selecteren" onClick={act(onSelect)} />
      )}
      <Row
        icon="pencil-simple"
        label="Notitieboek bewerken"
        onClick={act(onEditNotebook)}
      />
      {onOrderNotebooks && (
        <Row
          icon="arrows-down-up"
          label="Volgorde notitieboeken"
          onClick={act(onOrderNotebooks)}
        />
      )}
      <Row
        icon="archive"
        label="Archief"
        count={archiveCount}
        onClick={act(onArchive)}
      />
      <Row
        icon="trash"
        label="Prullenbak"
        count={trashCount}
        onClick={act(onTrash)}
      />
    </Sheet>
  );
}

const label = {
  margin: "0 0 var(--sp-2)",
  fontSize: "var(--fs-xs)",
  fontWeight: 600,
  color: "var(--text-muted)",
};

function Row({ icon, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "none",
        borderBottom: "1px solid var(--border-soft)",
        background: "transparent",
        color: "var(--text)",
        fontSize: "var(--fs-md)",
        textAlign: "left",
        padding: 0,
      }}
    >
      <Icon name={icon} size={22} style={{ color: "var(--text-muted)" }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count > 0 && (
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          {count}
        </span>
      )}
    </button>
  );
}
