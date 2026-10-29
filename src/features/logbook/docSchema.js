// Versie van het notitie-document (BlockNote-JSON). Verhoog bij een
// wijziging aan eigen bloktypes en vang oude versies op in sanitizeDoc.
// Ontbreekt `docSchemaVersion` op een notitie, dan is het versie 1.
export const DOC_SCHEMA_VERSION = 1;

const inlineText = (content) =>
  Array.isArray(content)
    ? content.filter((c) => c && (c.type === "text" || c.type === "link"))
    : [];

// Maakt een opgeslagen document veilig om te laden: een bloktype dat de
// editor (nog) niet kent, bijvoorbeeld uit een nieuwere versie van de app,
// wordt een gewone alinea met dezelfde tekst in plaats van de editor te
// laten crashen. Kapotte invoer (geen lijst, geen type) valt weg.
export function sanitizeDoc(blocks, knownTypes) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && typeof b === "object" && typeof b.type === "string")
    .map((b) => {
      const children = sanitizeDoc(b.children ?? [], knownTypes);
      if (knownTypes.has(b.type)) return { ...b, children };
      return {
        type: "paragraph",
        content: inlineText(b.content),
        children,
      };
    });
}
