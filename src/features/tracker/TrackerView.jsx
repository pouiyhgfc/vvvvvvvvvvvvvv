import { useState, lazy, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DAILY_LOG_TEMPLATE_DOC } from "../../lib/constants.js";
import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";
import TodayHeader from "./TodayHeader.jsx";
import DaySummary from "./DaySummary.jsx";
import RoutineCard from "./RoutineCard.jsx";
import TodayLogCard from "./TodayLogCard.jsx";

const EntryPage = lazy(() => import("../logbook/EntryPage.jsx"));

export default function TrackerView({
  date,
  onNav,
  onToday,
  banner,
  routines,
  tab,
  setTab,
  checked,
  pctTotal,
  pDone,
  pPct,
  pop,
  toggle,
  areaStyles,
  streak,
  dateKey,
}) {
  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  const todayEntry = useLiveQuery(
    () =>
      db.logEntries
        .where("date")
        .equals(dateKey)
        .filter((e) => (e.notebookId || "logboek") === "logboek" && isActive(e))
        .first(),
    [dateKey],
  );
  const [entryPage, setEntryPage] = useState(null);

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <TodayHeader date={date} onNav={onNav} onToday={onToday} />
      {banner}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-3)",
          padding: "0 var(--sp-4)",
        }}
      >
        <DaySummary
          pctTotal={pctTotal}
          pDone={pDone}
          pPct={pPct}
          routines={routines}
          streak={streak}
        />
        <RoutineCard
          routines={routines}
          tab={tab}
          setTab={setTab}
          checked={checked}
          pDone={pDone}
          pop={pop}
          toggle={toggle}
          areaStyles={areaStyles}
        />
        <TodayLogCard
          entry={todayEntry}
          onOpen={() => setEntryPage(todayEntry || "new")}
        />
      </div>

      {entryPage && (
        <Suspense fallback={null}>
          <EntryPage
            entry={entryPage === "new" ? null : entryPage}
            // Nieuw dagelijks logboek start met het reflectie-sjabloon; een
            // bestaand logboek opent zoals opgeslagen. Diepe kopie zodat elk
            // nieuw entry verse blocks krijgt (geen gedeelde/gemuteerde doc).
            draft={
              entryPage === "new"
                ? { doc: structuredClone(DAILY_LOG_TEMPLATE_DOC) }
                : undefined
            }
            notebookId="logboek"
            date={dateKey}
            theme={theme}
            onClose={() => setEntryPage(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
