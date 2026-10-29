import { useEffect, useRef } from "react";
import { dk, periodForHour } from "../lib/date.js";

// Houdt Vandaag bij de klok: springt naar het nieuwe dagdeel en, als je op
// gisteren stond, na middernacht naar vandaag. Zelf een ander dagdeel of een
// andere dag kiezen blijft staan.
export function useDayRollover(date, setDate, tab, setTab) {
  // Het dagdeel dat we het laatst automatisch kozen. Pas als de klok een
  // nieuw dagdeel ingaat, springt de tab mee; zelf wisselen blijft staan.
  const autoPeriod = useRef(tab);
  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
      const period = periodForHour(now.getHours());
      if (period !== autoPeriod.current) {
        autoPeriod.current = period;
        setTab(period);
      }
      const todayKey = dk(now);
      const currentKey = dk(date);
      if (currentKey !== todayKey) {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (currentKey === dk(yesterday)) setDate(new Date());
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") checkDate();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkDate);
    const interval = setInterval(checkDate, 60000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkDate);
      clearInterval(interval);
    };
  }, [date, setDate, setTab]);
}
