import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildAreaStyles } from "./lib/constants.js";
import { dk, periodForHour } from "./lib/date.js";
import { useNotifications } from "./lib/notify.js";
import { useNativeNotifications } from "./lib/nativeNotify.js";
import { db } from "./lib/db.js";
import {
  exportData as doExportData,
  exportRoutines as doExportRoutines,
  exportWeekplanning as doExportWeekplanning,
  exportNotities,
  importData as readImportFile,
} from "./lib/backup.js";
import TrackerView from "./features/tracker/TrackerView.jsx";
import PlanningView from "./features/planner/PlanningView.jsx";
import StatsView from "./features/stats/StatsView.jsx";
import SettingsPanel from "./features/settings/SettingsPanel.jsx";
import LogbookView from "./features/logbook/LogbookView.jsx";
import EntryPage from "./features/logbook/EntryPage.jsx";
import HifdView from "./features/hifd/HifdView.jsx";
import Banner from "./ui/Banner.jsx";
import Button from "./ui/Button.jsx";
import BackupReminder from "./features/settings/BackupReminder.jsx";
import MoreView from "./features/settings/MoreView.jsx";
import TabBar from "./ui/TabBar.jsx";
import { useAppData } from "./hooks/useAppData.js";
import { useNotificationToggle } from "./hooks/useNotificationToggle.js";
import { periodLabel } from "./lib/periodLabel.js";
import { clearAllDays, clearEverything } from "./lib/resetData.js";
import BackButton from "./ui/BackButton.jsx";
import Welcome from "./features/welcome/Welcome.jsx";
import ImportDialog from "./features/settings/ImportDialog.jsx";
import { useLaunchDraft } from "./hooks/useLaunchDraft.js";
import { useTrackerDay } from "./hooks/useTrackerDay.js";
import { useDayRollover } from "./hooks/useDayRollover.js";
import { useTheme } from "./hooks/useTheme.js";

// Vaste plekken in de tabbalk. "stats" is een subpagina van Meer.
const TABS = [
  { id: "tracker", label: "Vandaag", icon: "check-circle" },
  { id: "week", label: "Planning", icon: "calendar-blank" },
  { id: "logbook", label: "Notities", icon: "notebook" },
  { id: "hifd", label: "Hifd", icon: "book-open-text" },
  { id: "meer", label: "Meer", icon: "dots-three" },
];

export default function App({ startupErrors = [] }) {
  const {
    settings,
    setSettings,
    areas,
    setAreas,
    routines,
    setRoutines,
    calTemplates,
    setCalTemplates,
    weekScheduleTemplates,
    setWeekScheduleTemplates,
    calEvents,
    setCalEvents,
    allDaysRaw,
    allDays,
  } = useAppData();

  // --- UI state ---
  const [date, setDate] = useState(new Date());
  const [tab, setTab] = useState(() => periodForHour(new Date().getHours()));
  const [view, setView] = useState("tracker");
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [pendingImport, setPendingImport] = useState(null);
  const [launchDraft, setLaunchDraft] = useLaunchDraft();
  useDayRollover(date, setDate, tab, setTab);
  useTheme(settings.theme);

  const { key, total, checked, pctTotal, pDone, pPct, streak, toggle, pop } =
    useTrackerDay({
      date,
      routines,
      allDays,
      streakPct: settings.streakPct,
    });
  const onboarded = useLiveQuery(
    async () => !!(await db.meta.get("onboarded")),
  );

  useNotifications(settings, calEvents);
  const { notifPerm, toggleNotifications } = useNotificationToggle(
    settings,
    setSettings,
  );
  useNativeNotifications(settings, calEvents);

  const areaStyles = useMemo(() => buildAreaStyles(areas), [areas]);
  const areaNames = areas.map((a) => a.name);

  const goNav = (dir) => {
    const d = new Date(date);
    if (view === "stats" && statsPeriod === "month") {
      d.setMonth(d.getMonth() + dir);
    } else if (view === "stats" && statsPeriod === "year") {
      d.setFullYear(d.getFullYear() + dir);
    } else if (
      view === "week" ||
      (view === "stats" && statsPeriod === "week")
    ) {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setDate(d.getDate() + dir);
    }
    setDate(d);
  };

  // Dunne wrappers: de daadwerkelijke export/import-logica staat in
  // src/lib/backup.js; hier alleen de React-state doorgeven/opvangen.
  const exportData = () =>
    doExportData({
      routines,
      areas,
      calTemplates,
      calEvents,
      weekScheduleTemplates,
      settings,
      allDaysRaw,
    });
  const exportRoutines = () => doExportRoutines(routines);
  const exportWeekplanning = () =>
    doExportWeekplanning({ calTemplates, calEvents, weekScheduleTemplates });
  const importData = (file) => readImportFile(file, setPendingImport);

  const dataInfo = (() => {
    const dayCount = allDaysRaw?.length ?? 0;
    const kb = (
      (JSON.stringify({
        routines,
        areas,
        calTemplates,
        calEvents,
        weekScheduleTemplates,
        settings,
      }).length +
        dayCount * 200) /
      1024
    ).toFixed(1);
    return { dayCount, kb };
  })();

  const { main: dateMain, sub: dateSub } = periodLabel(view, statsPeriod, date);

  const importDialog = pendingImport && (
    <ImportDialog
      data={pendingImport}
      onExport={exportData}
      onDone={() => setPendingImport(null)}
    />
  );

  // Nieuw toestel: eerst het welkomstscherm (kiezen of backup terugzetten).
  if (onboarded === undefined) return null;
  if (!onboarded)
    return (
      <>
        <Welcome onImport={importData} />
        {importDialog}
      </>
    );

  return (
    <div
      style={{
        maxWidth: 540,
        margin: "0 auto",
        background: "var(--bg)",
        minHeight: "100vh",
        paddingTop: "env(safe-area-inset-top)",
        // Ruimte voor de zwevende tabbalk.
        paddingBottom: 112,
      }}
    >
      {startupErrors.length > 0 && (
        <Banner
          tone="danger"
          icon="⚠️"
          actions={
            <Button size="sm" variant="danger" onClick={exportData}>
              Exporteer nu
            </Button>
          }
        >
          Er ging iets mis bij het opstarten ({startupErrors.join(", ")}). De
          app werkt verder, maar maak voor de zekerheid nu een export voordat je
          iets wijzigt.
        </Banner>
      )}

      {/* MEER: statistieken-ingang + instellingen */}
      {view === "meer" && (
        <MoreView
          onOpenStats={() => setView("stats")}
          routines={routines}
          calEvents={calEvents}
        >
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            notifPerm={notifPerm}
            areas={areas}
            setAreas={setAreas}
            routines={routines}
            setRoutines={setRoutines}
            calTemplates={calTemplates}
            setCalTemplates={setCalTemplates}
            weekScheduleTemplates={weekScheduleTemplates}
            setWeekScheduleTemplates={setWeekScheduleTemplates}
            calEvents={calEvents}
            setCalEvents={setCalEvents}
            date={date}
            total={total}
            areaNames={areaNames}
            areaStyles={areaStyles}
            toggleNotifications={toggleNotifications}
            clearAllDays={clearAllDays}
            clearEverything={clearEverything}
            exportData={exportData}
            exportRoutines={exportRoutines}
            exportWeekplanning={exportWeekplanning}
            exportNotities={exportNotities}
            importData={importData}
            dataInfo={dataInfo}
          />
        </MoreView>
      )}

      {view === "stats" && (
        <div style={{ padding: "var(--sp-2) var(--sp-2) 0" }}>
          <BackButton onClick={() => setView("meer")}>Meer</BackButton>
        </div>
      )}

      {/* TRACKER */}
      {view === "tracker" && (
        <TrackerView
          date={date}
          onNav={goNav}
          onToday={() => setDate(new Date())}
          banner={<BackupReminder onExport={exportData} />}
          calEvents={calEvents}
          onOpenPlanning={() => setView("week")}
          dateKey={key}
          routines={routines}
          tab={tab}
          setTab={setTab}
          checked={checked}
          pctTotal={pctTotal}
          pDone={pDone}
          pPct={pPct}
          pop={pop}
          toggle={toggle}
          areaStyles={areaStyles}
          streak={streak}
        />
      )}

      {/* WEEK VIEW */}
      {view === "week" && (
        <PlanningView
          calTemplates={calTemplates}
          calEvents={calEvents}
          setCalEvents={setCalEvents}
          weekScheduleTemplates={weekScheduleTemplates}
        />
      )}

      {/* STATS VIEW */}
      {view === "stats" && (
        <StatsView
          routines={routines}
          allDays={allDays}
          areaStyles={areaStyles}
          streakPct={settings.streakPct}
          date={date}
          setDate={setDate}
          setView={setView}
          statsPeriod={statsPeriod}
          setStatsPeriod={setStatsPeriod}
          periodLabel={dateMain}
          periodSub={dateSub}
          onNav={goNav}
        />
      )}

      {/* LOGBOOK VIEW */}
      {view === "logbook" && <LogbookView />}

      {/* HIFD VIEW */}
      {view === "hifd" && <HifdView />}

      {launchDraft && (
        <EntryPage
          notebookId="logboek"
          date={dk(new Date())}
          theme={settings.theme}
          draft={launchDraft}
          onClose={() => setLaunchDraft(null)}
        />
      )}

      {importDialog}

      <TabBar
        items={
          settings.hifdEnabled === false
            ? TABS.filter((t) => t.id !== "hifd")
            : TABS
        }
        active={view === "stats" ? "meer" : view}
        onSelect={setView}
      />
    </div>
  );
}
