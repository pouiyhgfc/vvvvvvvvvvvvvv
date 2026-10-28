import { dk } from "../../lib/date.js";
import { MONTHS_NL } from "../../lib/constants.js";

export function today() {
  return dk(new Date());
}

// Korte datum uit een datumsleutel, bv. "12 jul". Alleen de eerste tien
// tekens tellen, zodat ook een volledige ISO-tijd uit oude data werkt.
export function shortDate(key) {
  const d = new Date(String(key).slice(0, 10) + "T00:00");
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;
}
