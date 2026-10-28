import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";

const chip = {
  flexShrink: 0,
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 14px",
  borderRadius: "var(--r-pill)",
  border: "none",
  fontSize: "var(--fs-sm)",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

// Notitieboeken als tabs: "Alles", elk boek (nog eens tikken = bewerken) en +.
export default function NotebookTabs({
  notebooks,
  activeId,
  isAll,
  onAll,
  onPick,
  onNew,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--sp-2)",
        overflowX: "auto",
        marginBottom: "var(--sp-3)",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <button
        type="button"
        aria-pressed={isAll}
        onClick={onAll}
        style={{
          ...chip,
          background: isAll ? "var(--text)" : "var(--card)",
          color: isAll ? "var(--bg)" : "var(--text)",
        }}
      >
        Alles
      </button>
      {notebooks.map((n) => {
        const active = n.id === activeId;
        return (
          <button
            key={n.id}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(n, active)}
            style={{
              ...chip,
              background: active ? "var(--text)" : "var(--card)",
              color: active ? "var(--bg)" : "var(--text)",
            }}
          >
            <Emoji char={n.icon} size={16} />
            {n.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onNew}
        aria-label="Nieuw notitieboek"
        style={{
          ...chip,
          background: "var(--card)",
          color: "var(--text-muted)",
        }}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
