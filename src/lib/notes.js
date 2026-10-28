// Centrale status-helpers voor log-entries (archief/prullenbak). Eén plek
// i.p.v. losse `!e.archivedAt`-checks verspreid over de queries, zodat een
// verwijderde of gearchiveerde entry nergens per ongeluk weer opduikt (bv.
// als "notitie van vandaag" in de tracker).
export const isTrashed = (e) => !!e.deletedAt;
export const isArchived = (e) => !!e.archivedAt && !isTrashed(e);
export const isActive = (e) => !isTrashed(e) && !isArchived(e);

// Voorproefje van een notitie uit de opgeslagen markdown (`body`): de eerste
// echte tekstregel zonder opmaaktekens. Kopjes (zoals "Vandaag:" uit het
// dagsjabloon) alleen als er niets anders is.
export function bodyPreview(body = "") {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const plain = (l) => l.replace(/^((#+|[-*>]|\d+\.|\[.?\])\s*)+/, "").trim();
  const text = lines.find((l) => !l.startsWith("#") && plain(l));
  return plain(text ?? lines[0] ?? "");
}

// Koppen uit een BlockNote-document (ook genest, bv. in een uitklaplijst),
// in volgorde, voor de inhoudsopgave. Lege koppen tellen niet mee.
export function headingsOf(blocks = []) {
  const out = [];
  const text = (content = []) =>
    content.map((c) => c.text ?? text(c.content)).join("");
  const walk = (list) => {
    for (const b of list) {
      const t = b.type === "heading" ? text(b.content).trim() : "";
      if (t) out.push({ id: b.id, level: b.props?.level ?? 1, text: t });
      walk(b.children ?? []);
    }
  };
  walk(Array.isArray(blocks) ? blocks : []);
  return out;
}
