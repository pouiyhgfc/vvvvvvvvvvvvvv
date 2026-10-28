// Filter op één tag (nog eens tikken = uit). `tags` komt uit tagStats().
export default function TagFilter({ tags, active, onChange }) {
  if (!tags.length) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginBottom: "var(--sp-4)",
      }}
    >
      {tags.map((tag) => {
        const on = active === tag.key;
        return (
          <button
            key={tag.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : tag.key)}
            style={{
              minHeight: 32,
              padding: "0 var(--sp-3)",
              borderRadius: "var(--r-pill)",
              border: "none",
              fontSize: "var(--fs-sm)",
              background: on ? "var(--accent-bg)" : "transparent",
              color: on ? "var(--accent-text)" : "var(--text-muted)",
              fontWeight: on ? 600 : 500,
            }}
          >
            #{tag.name}
          </button>
        );
      })}
    </div>
  );
}
