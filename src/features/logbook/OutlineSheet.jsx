import Sheet from "../../ui/Sheet.jsx";

// Inhoudsopgave van de koppen in een notitie. Tikken scrolt naar de kop,
// zonder de cursor te verzetten (dan springt op een telefoon het toetsenbord
// niet open).
export default function OutlineSheet({ headings, onClose }) {
  const goTo = (id) => {
    onClose();
    document
      .querySelector(`.ProseMirror [data-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <Sheet title="Inhoud" onClose={onClose}>
      {headings.map((h) => (
        <button
          key={h.id}
          type="button"
          dir="auto"
          onClick={() => goTo(h.id)}
          style={{
            width: "100%",
            minHeight: 48,
            display: "block",
            border: "none",
            borderBottom: "1px solid var(--border-soft)",
            background: "transparent",
            color: h.level === 1 ? "var(--text)" : "var(--text-muted)",
            fontSize: "var(--fs-md)",
            fontWeight: h.level === 1 ? 600 : 400,
            textAlign: "start",
            padding: `0 0 0 ${(h.level - 1) * 20}px`,
          }}
        >
          {h.text}
        </button>
      ))}
    </Sheet>
  );
}
