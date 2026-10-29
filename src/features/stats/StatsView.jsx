import { useMemo } from "react";
import HifdStatsCard from "./HifdStatsCard.jsx";
import MonthStats from "./MonthStats.jsx";
import StatsHeader from "./StatsHeader.jsx";
import WeekStats from "./WeekStats.jsx";
import YearStats from "./YearStats.jsx";
import {
  areaWeekStats,
  monthStats,
  streakDays,
  weekStats,
  yearStats,
} from "./statsData.js";

// Statistieken per week, maand of jaar. De berekeningen staan in
// statsData.js, de weergave per periode in een eigen component.
export default function StatsView({
  routines,
  allDays,
  areaStyles,
  streakPct,
  date,
  setDate,
  setView,
  statsPeriod,
  setStatsPeriod,
  periodLabel,
  periodSub,
  onNav,
}) {
  const allR = useMemo(() => Object.values(routines).flat(), [routines]);
  const total = allR.length;

  return (
    <div
      style={{
        padding: "var(--sp-2) var(--sp-4) var(--sp-6)",
        animation: "fadeUp .3s ease",
      }}
    >
      <StatsHeader
        statsPeriod={statsPeriod}
        setStatsPeriod={setStatsPeriod}
        periodLabel={periodLabel}
        periodSub={periodSub}
        onNav={onNav}
        onToday={() => setDate(new Date())}
      />
      {statsPeriod === "week" && (
        <WeekStats
          weekData={weekStats(date, allDays, total)}
          streak={streakDays(allDays, total, streakPct)}
          areaWeekStats={areaWeekStats(date, allDays, allR)}
          areaStyles={areaStyles}
        />
      )}
      {statsPeriod === "month" && (
        <MonthStats
          monthData={monthStats(date, allDays, total)}
          setDate={setDate}
          setView={setView}
        />
      )}
      {statsPeriod === "year" && (
        <YearStats yearData={yearStats(date, allDays, total, streakPct)} />
      )}
      <HifdStatsCard />
    </div>
  );
}
