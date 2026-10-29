import { useState, useEffect, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildAreaStyles } from "./lib/constants.js";
import { dk, isToday, periodForHour } from "./lib/date.js";
import { buzz } from "./lib/storage.js";
import { showToast } from "./lib/toast.js";
import { useNotifications } from "./lib/notify.js";
import { useNativeNotifications } from "./lib/nativeNotify.js";
import { db } from "./lib/db.js";
import {
  exportData as doExportData,
  exportRoutines as doExportRoutines,
  exportWeekplanning as doExportWeekplanning,
  exportNotities,
  importData as readImportFile,
  performFullImport,
} from "./lib/backup.js";
import TrackerView from "./features/tracker/TrackerView.jsx";
import PlanningView from "./features/planner/PlanningView.jsx";
import StatsView from "./features/stats/StatsView.jsx";
import SettingsPanel from "./features/settings/SettingsPanel.jsx";
import { streakDays } from "./features/stats/statsData.js";
import LogbookView from "./features/logbook/LogbookView.jsx";
import EntryPage from "./features/logbook/EntryPage.jsx";
import HifdView from "./features/hifd/HifdView.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
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

// Leest de PWA-shortcut-/share-target-parameters uit de URL (?action=…,
// /share met title/text/url). Puur lezen — geen state, geen side effects.
function parseLaunchAction() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const action = params.get("action");
  const isShareTarget =
    window.location.pathname === "/share" ||
    params.has("title") ||
    params.has("text") ||
    params.has("url");
  return { action, isShareTarget, params };
}

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
  // Het dagdeel dat we het laatst automatisch kozen. Pas als de klok een
  // nieuw dagdeel ingaat, springt de tab mee; zelf wisselen blijft staan.
  const autoPeriod = useRef(tab);
  const [view, setView] = useState("tracker");
  const [pop, setPop] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [pendingImport, setPendingImport] = useState(null);
  // App-shortcuts ("Nieuwe notitie"/"Vandaag") en de share-target ("/share")
  // uit het PWA-manifest: via een lazy state-initializer gelezen (niet via
  // setState in een effect) zodat de eerste render meteen klopt. "Vandaag"
  // heeft geen eigen code nodig — view "tracker" + datum "vandaag" zijn al
  // de standaardwaarden hierboven.
  const [launchDraft, setLaunchDraft] = useState(() => {
    const launch = parseLaunchAction();
    if (launch?.action === "new-note") return {};
    if (launch?.isShareTarget) {
      const title = launch.params.get("title") || "";
      const text = launch.params.get("text") || "";
      const url = launch.params.get("url") || "";
      return { title, body: [text, url].filter(Boolean).join("\n") };
    }
    return null;
  });

  // Voorkomt dat de shortcut-/share-actie bij een refresh herhaalt.
  useEffect(() => {
    const launch = parseLaunchAction();
    if (launch?.action || launch?.isShareTarget) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const key = dk(date);
  const total = Object.values(routines).flat().length;

  const dayRecord = useLiveQuery(() => db.days.get(key), [key]);
  const onboarded = useLiveQuery(
    async () => !!(await db.meta.get("onboarded")),
  );
  const day = dayRecord ?? { checked: {}, energy: 7, mood: "Goed", notes: "" };

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
  }, [date]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute(
        "content",
        settings.theme === "dark" ? "#0f1411" : "#eef1ec",
      );
  }, [settings.theme]);

  useNotifications(settings, calEvents);
  const { notifPerm, toggleNotifications } = useNotificationToggle(
    settings,
    setSettings,
  );
  useNativeNotifications(settings, calEvents);

  const areaStyles = useMemo(() => buildAreaStyles(areas), [areas]);
  const areaNames = areas.map((a) => a.name);

  const saveDay = (data) => {
    db.days.put({ date: key, ...data });
  };

  const toggle = (id) => {
    const next = {
      ...day,
      checked: { ...day.checked, [id]: !day.checked[id] },
    };
    saveDay(next);
    if (!day.checked[id]) {
      buzz(8);
      setPop(id);
      setTimeout(() => setPop(null), 500);
    }
  };

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

  const checked = day.checked || {};
  const totalDone = Object.values(checked).filter(Boolean).length;
  const pctTotal = total > 0 ? Math.round((totalDone / total) * 100) : 0;
  const pDone = (p) => routines[p].filter((r) => checked[r.id]).length;
  const pPct = (p) =>
    routines[p].length > 0
      ? Math.round((pDone(p) / routines[p].length) * 100)
      : 0;

  // Reeks over de opgeslagen dagen; voor vandaag telt de huidige staat
  // (die kan een tel voorlopen op wat er al in Dexie staat).
  const streak = streakDays(
    isToday(date) ? { ...allDays, [dk(new Date())]: day } : allDays,
    total,
    settings.streakPct || 50,
  );

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

  const runFullImport = async (data, merge) => {
    try {
      // Vangnet: vóór "vervangen" de huidige staat downloaden, zodat een
      // verkeerde backup nooit het enige exemplaar van je data wist.
      if (!merge) await exportData();
      await performFullImport(data, merge);
    } catch (err) {
      showToast("Fout bij importeren: " + err.message);
    } finally {
      setPendingImport(null);
    }
  };

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
    <ConfirmDialog
      title="Backup importeren"
      message="Samenvoegen voegt de backup toe aan je huidige data. Volledig vervangen wist eerst je huidige data — daarvoor wordt automatisch een veiligheidsbackup gedownload."
      danger={false}
      actions={[
        {
          label: "Samenvoegen",
          variant: "primary",
          onClick: () => runFullImport(pendingImport, true),
        },
        {
          label: "Volledig vervangen",
          variant: "dangerSolid",
          onClick: () => runFullImport(pendingImport, false),
        },
      ]}
      onCancel={() => setPendingImport(null)}
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
