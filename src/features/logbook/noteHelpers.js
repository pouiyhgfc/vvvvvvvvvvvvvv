import { DAYS_NL, MONTHS_NL, EVENT_COLORS } from "../../lib/constants.js";
import { isToday, getMonday } from "../../lib/date.js";

export function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++)
    h = (h * 31 + tag.charCodeAt(i)) & 0xffff;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}

export function fmtDay(str) {
  const d = new Date(str + "T12:00:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

// Vormen waarop je een entry op datum kunt vinden: ISO, "25 juni",
// "25 juni 2026" en de weekdag.
export function dateSearchString(str) {
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

// Rijstijl voor archief-/prullenbak-items (Sheet-content).
export const metaRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 4px",
  borderBottom: "1px solid var(--border-soft)",
};
export const metaBtn = {
  width: 30,
  height: 30,
  borderRadius: 99,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  flexShrink: 0,
};
