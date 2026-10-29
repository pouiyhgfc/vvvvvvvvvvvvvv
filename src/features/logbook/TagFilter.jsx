import AreaDot from "../../ui/AreaDot.jsx";

// Filter op één tag of één focusgebied (nog eens tikken = uit). `tags` komt
// uit tagStats(); gebieden verschijnen alleen als er tags aan gekoppeld zijn.
export default function TagFilter({ tags, active, onChange, areaOf, byArea }) {
  if (!tags.length) return null;
  const areas = [
    ...new Map(
      tags
        .map((t) => areaOf(t.name))
        .filter((a) => a && byArea[a.name])
        .map((a) => [a.name, a]),
    ).values(),
  ];
  const chip = (key, label, color) => {
    const on = active === key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={on}
        onClick={() => onChange(on ? null : key)}
        style={{
          minHeight: 32,
          padding: "0 var(--sp-3)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderRadius: "var(--r-pill)",
          border: "none",
          fontSize: "var(--fs-sm)",
          background: on ? "var(--accent-bg)" : "transparent",
          color: on ? "var(--accent-text)" : "var(--text-muted)",
          fontWeight: on ? 600 : 500,
        }}
      >
        {color && <AreaDot color={color} />}
        {label}
      </button>
    );
  };
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginBottom: "var(--sp-4)",
      }}
    >
      {areas.map((a) => chip(`area:${a.name}`, a.name, a.color))}
      {tags.map((t) => chip(t.key, `#${t.name}`, areaOf(t.name)?.color))}
    </div>
  );
}
