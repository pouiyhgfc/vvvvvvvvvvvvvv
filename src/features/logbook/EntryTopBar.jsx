import Icon from "../../ui/Icon.jsx";

// Topbalk van een notitie: terug, ongedaan maken/opnieuw (editor-historie)
// en de rest achter ⋯.
export default function EntryTopBar({ hist, onBack, onUndo, onRedo, onMenu }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "var(--sp-2) var(--sp-2) 0",
        minHeight: 52,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Terug"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: 44,
          padding: "0 var(--sp-2) 0 4px",
          border: "none",
          background: "none",
          color: "var(--accent-text)",
          fontSize: "var(--fs-md)",
          fontWeight: 500,
        }}
      >
        <Icon name="caret-left" size={20} />
        Notities
      </button>
      <span style={{ flex: 1 }} />
      {/* Ongedaan maken / opnieuw — editor-historie (ProseMirror). */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!hist.undo}
        aria-label="Ongedaan maken"
        style={iconBtn(hist.undo)}
      >
        <Icon name="arrow-u-up-left" size={22} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!hist.redo}
        aria-label="Opnieuw"
        style={iconBtn(hist.redo)}
      >
        <Icon name="arrow-u-up-right" size={22} />
      </button>
      <button
        type="button"
        onClick={onMenu}
        aria-label="Notitie-opties"
        style={{ ...iconBtn(), color: "var(--text)" }}
      >
        <Icon name="dots-three" size={24} />
      </button>
    </div>
  );
}

const iconBtn = (enabled = true) => ({
  width: 44,
  height: 44,
  borderRadius: "var(--r-pill)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  border: "none",
  background: "none",
  opacity: enabled ? 1 : 0.35,
});
