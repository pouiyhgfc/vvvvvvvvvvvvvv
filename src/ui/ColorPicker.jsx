import { EVENT_COLORS } from "../lib/constants.js";

// Swatch-rij + custom kleur (conic-gradient 🎨). Eén bron voor alle kleurkiezers.
export default function ColorPicker({
  value,
  onChange,
  colors = EVENT_COLORS,
  size = 28,
}) {
  const v = (value || "").toLowerCase();
  const isPreset = colors.includes(v);
  return (
    <div
      style={{
        display: "flex",
        gap: 7,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            background: c,
            border:
              v === c ? "3px solid var(--text)" : "2.5px solid transparent",
            boxShadow: v === c ? "0 0 0 2px var(--card) inset" : "none",
            flexShrink: 0,
            transition: "all .15s",
          }}
        />
      ))}
      <label
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          flexShrink: 0,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          border: isPreset
            ? "1.5px dashed var(--border)"
            : "3px solid var(--text)",
          background: isPreset
            ? "conic-gradient(red,orange,yellow,lime,aqua,blue,magenta,red)"
            : value,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.46),
        }}
      >
        {isPreset && (
          <span style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,.4))" }}>
            🎨
          </span>
        )}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        />
      </label>
    </div>
  );
}
