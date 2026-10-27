import Emoji from "../../ui/Emoji.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Keuze bij "Nieuw": leeg document of een sjabloon. `onPick(null)` = leeg.
export default function TemplatePickerSheet({
  templates,
  onPick,
  onDelete,
  onClose,
}) {
  return (
    <Sheet title="Nieuwe entry" onClose={onClose}>
      <div
        onClick={() => {
          onPick(null);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 4px",
          borderBottom: "1px solid var(--border-soft)",
          cursor: "pointer",
        }}
      >
        <Emoji char="📄" size={18} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          Leeg document
        </span>
      </div>
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 4px",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <div
            onClick={() => {
              onPick(tpl);
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              minWidth: 0,
            }}
          >
            <Emoji char={tpl.icon} size={18} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {tpl.name}
            </span>
          </div>
          <button
            onClick={() => onDelete(tpl)}
            aria-label="Sjabloon verwijderen"
            style={{
              color: "var(--text-faint)",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Emoji char="🗑️" size={14} />
          </button>
        </div>
      ))}
    </Sheet>
  );
}
