import Icon from "./Icon.jsx";

export default function DragHandle({ onPointerDown }) {
  // Groot genoeg raakdoel voor een vinger (min. ~40px) met behoud van compacte
  // weergave; touchAction:none zodat een sleep op het handvat niet scrollt.
  return (
    <span
      className="drag-handle"
      onPointerDown={onPointerDown}
      aria-hidden="true"
      style={{
        color: "var(--text-faint)",
        padding: "10px 8px",
        margin: "-6px -4px",
        borderRadius: 6,
        userSelect: "none",
        touchAction: "none",
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "stretch",
      }}
    >
      <Icon name="dots-six-vertical" size={20} />
    </span>
  );
}
