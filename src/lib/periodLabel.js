import { MONTHS_NL } from "./constants.js";
import { dk, fmtDate, getMonday } from "./date.js";

// Label + subtitel voor de periode op het scherm (dag, week, maand, jaar),
// bv. { main: "26 – 1 november", sub: "Deze week" }.
export function periodLabel(view, statsPeriod, date) {
  if (view === "week" || (view === "stats" && statsPeriod === "week")) {
    const mon = getMonday(date);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const endMonth = MONTHS_NL[sun.getMonth()].toLowerCase();
    const main =
      mon.getMonth() === sun.getMonth()
        ? `${mon.getDate()} – ${sun.getDate()} ${endMonth}`
        : `${mon.getDate()} ${MONTHS_NL[mon.getMonth()].toLowerCase()} – ${sun.getDate()} ${endMonth}`;
    const isThisWeek = dk(getMonday(date)) === dk(getMonday(new Date()));
    return { main, sub: isThisWeek ? "Deze week" : "" };
  }
  if (view === "stats" && statsPeriod === "month") {
    const now = new Date();
    const isThisMonth =
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    return {
      main: `${MONTHS_NL[date.getMonth()]} ${date.getFullYear()}`,
      sub: isThisMonth ? "Deze maand" : "",
    };
  }
  if (view === "stats" && statsPeriod === "year") {
    const isThisYear = date.getFullYear() === new Date().getFullYear();
    return {
      main: `${date.getFullYear()}`,
      sub: isThisYear ? "Dit jaar" : "",
    };
  }
  return { main: fmtDate(date), sub: "" };
}
