import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import { isToday, getMonday } from "../../lib/date.js";
import { tagKey } from "../../lib/tags.js";
import { searchableText } from "../../lib/docText.js";

export function fmtDay(str) {
  const d = new Date(str + "T12:00:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()].toLowerCase()}`;
}

// Vormen waarop je een entry op datum kunt vinden: ISO, "25 juni",
// "25 juni 2026" en de weekdag.
function dateSearchString(str) {
  const d = new Date(str + "T12:00:00");
  return [
    str,
    `${d.getDate()} ${MONTHS_NL[d.getMonth()]}`,
    `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`,
    DAYS_NL[d.getDay()],
  ]
    .join(" ")
    .toLowerCase();
}

export const nbOf = (e) => e.notebookId || "logboek";

// Groepskop voor de "Datum"-sorteermodus. Kalendergrenzen (niet 24u-blokken):
// "gisteren" blijft gisteren, ook als het al 3 uur 's nachts is.
export function groupLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  if (isToday(d)) return "Vandaag";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  )
    return "Gisteren";
  if (d >= getMonday(now)) return "Deze week";
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return "Deze maand";
  return `${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

// Verwijdert recursief block-id's uit een sjabloon-doc (diepe kopie), zodat
// een nieuwe entry altijd verse id's krijgt en nooit block-id's deelt met
// het sjabloon of met eerder uit hetzelfde sjabloon gemaakte entries.
export function stripBlockIds(blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map(({ id: _id, children, ...rest }) => ({
    ...rest,
    ...(children ? { children: stripBlockIds(children) } : {}),
  }));
}

// Zoeken en tagfilter op de lijst: titel, tekst, tags en datum (ook "25 juni"
// of de weekdag). `tag` is een tag-sleutel, of "area:<naam>" voor alle tags
// die aan dat focusgebied gekoppeld zijn (`byArea` uit tagsByArea).
export function filterNotes(list, { tag, search, byArea = {} }) {
  let out = list;
  if (tag?.startsWith("area:")) {
    const keys = byArea[tag.slice(5)] ?? new Set();
    out = out.filter((e) => e.tags?.some((t) => keys.has(tagKey(t))));
  } else if (tag)
    out = out.filter((e) => e.tags?.some((t) => tagKey(t) === tag));
  if (search.trim()) {
    const q = search.toLowerCase();
    out = out.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        searchableText(e).toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q)) ||
        dateSearchString(e.date).includes(q),
    );
  }
  return out;
}
