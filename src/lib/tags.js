import { db } from "./db.js";

// Tags blijven een lijst tekst per notitie (`tags`), maar "Thoughts",
// "thoughts " en "#thoughts" zijn dezelfde tag. Vergelijken gaat via de
// sleutel; tonen en opslaan met de schrijfwijze die je al gebruikt.
export const tagKey = (t) =>
  String(t).trim().replace(/^#+/, "").replace(/\s+/g, " ").toLowerCase();

const tidy = (t) => String(t).trim().replace(/^#+/, "").replace(/\s+/g, " ");

// Alle tags over de notities heen: sleutel → { name, count }. De naam is de
// meest gebruikte schrijfwijze.
export function tagStats(entries) {
  const byKey = new Map();
  for (const e of entries)
    for (const raw of new Set((e.tags || []).map(tidy)))
      if (raw) {
        const key = tagKey(raw);
        const s = byKey.get(key) ?? { key, count: 0, spellings: new Map() };
        s.count++;
        s.spellings.set(raw, (s.spellings.get(raw) ?? 0) + 1);
        byKey.set(key, s);
      }
  return [...byKey.values()]
    .map(({ key, count, spellings }) => ({
      key,
      count,
      name: [...spellings].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Schoont een lijst op: lege weg, dubbele weg (ongeacht hoofdletters) en
// bekende tags in hun bestaande schrijfwijze.
export function cleanTags(tags, known = []) {
  const names = new Map(known.map((k) => [k.key, k.name]));
  const out = new Map();
  for (const raw of tags) {
    const t = tidy(raw);
    if (!t) continue;
    const key = tagKey(t);
    if (!out.has(key)) out.set(key, names.get(key) ?? t);
  }
  return [...out.values()];
}

// Hernoemt een tag in alle notities (ook gearchiveerde en in de prullenbak).
// Bestaat de nieuwe naam al, dan worden ze samengevoegd. Leeg = verwijderen.
// Geeft het aantal aangepaste notities terug.
export async function renameTag(fromKey, toName) {
  const to = tidy(toName);
  return db.transaction("rw", db.logEntries, async () => {
    const hits = await db.logEntries
      .filter((e) => (e.tags || []).some((t) => tagKey(t) === fromKey))
      .toArray();
    await db.logEntries.bulkPut(
      hits.map((e) => ({
        ...e,
        tags: cleanTags(
          (e.tags || []).flatMap((t) =>
            tagKey(t) === fromKey ? (to ? [to] : []) : [t],
          ),
          to ? [{ key: tagKey(to), name: to }] : [],
        ),
      })),
    );
    return hits.length;
  });
}
