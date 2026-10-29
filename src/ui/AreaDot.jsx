// Stip in de kleur van een focusgebied (datakleur).
export default function AreaDot({ color }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
