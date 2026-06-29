export default function DragHandle({ onPointerDown }) {
  // Groot genoeg raakdoel voor een vinger (min. ~40px) met behoud van compacte
  // weergave; touchAction:none zodat een sleep op het handvat niet scrollt.
  return (
    <span
      className="drag-handle"
      onPointerDown={onPointerDown}
      style={{
        fontSize: 17,
        color: "var(--text-faint)",
        padding: "10px 12px",
        margin: "-6px -4px",
        borderRadius: 6,
        userSelect: "none",
        lineHeight: 1,
        touchAction: "none",
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "stretch",
      }}
    >
      ⠿
    </span>
  );
}
