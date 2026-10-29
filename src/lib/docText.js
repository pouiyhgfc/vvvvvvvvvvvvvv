// Platte tekst uit een BlockNote-document, voor zoeken. Anders dan de
// markdown in `body` zonder opmaaktekens (zo vindt "wereld" ook "we**reld**")
// en inclusief tabelcellen, geneste blokken, notitielinks en videolinks.
export function docText(doc) {
  const parts = [];
  const inline = (content) => {
    for (const c of Array.isArray(content) ? content : []) {
      if (c?.type === "text") parts.push(c.text);
      else if (c?.type === "link") inline(c.content);
      else if (c?.type === "noteLink") parts.push(c.props?.title ?? "");
    }
  };
  const walk = (blocks) => {
    for (const b of Array.isArray(blocks) ? blocks : []) {
      if (!b || typeof b !== "object") continue;
      if (b.content?.type === "tableContent")
        for (const row of b.content.rows ?? [])
          for (const cell of row.cells ?? [])
            inline(Array.isArray(cell) ? cell : cell?.content);
      else inline(b.content);
      if (b.type === "video" && b.props?.url) parts.push(b.props.url);
      if (b.props?.caption) parts.push(b.props.caption);
      parts.push("\n");
      walk(b.children);
    }
  };
  walk(doc);
  return parts
    .join("")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// Wat het zoeken doorzoekt: de platte tekst als die er is, anders `body`
// (oude of platte notities).
export const searchableText = (entry) => entry.searchText ?? entry.body ?? "";
