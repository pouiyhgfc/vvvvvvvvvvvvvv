import { dk } from "../../lib/date.js";
import { MONTHS_NL } from "../../lib/constants.js";

export function today() {
  return dk(new Date());
}

// Korte datum uit een datumsleutel, bv. "12 jul".
export function shortDate(key) {
  const d = new Date(key + "T00:00");
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;
}
