import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DEFAULT_ROUTINES,
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_AREAS,
  DEFAULT_SETTINGS,
  DEFAULT_NOTEBOOKS,
  buildAreaStyles,
  MONTHS_NL,
  DAYS_NL,
} from "./lib/constants.js";
import { dk, fmtDate, isToday, getMonday } from "./lib/date.js";
import { buzz } from "./lib/storage.js";
import { showToast } from "./lib/toast.js";
import { useNotifications } from "./lib/notify.js";
import { db, seedHifd } from "./lib/db.js";
import {
  exportData as doExportData,
  exportRoutines as doExportRoutines,
  exportWeekplanning as doExportWeekplanning,
  exportNotities,
  importData as readImportFile,
  performFullImport,
} from "./lib/backup.js";
import NavBtn from "./ui/NavBtn.jsx";
import TrackerView from "./features/tracker/TrackerView.jsx";
import WeekView from "./features/planner/WeekView.jsx";
import StatsView from "./features/stats/StatsView.jsx";
import SettingsPanel from "./features/settings/SettingsPanel.jsx";
import LogbookView from "./features/logbook/LogbookView.jsx";
import EntryPage from "./features/logbook/EntryPage.jsx";
import HifdView from "./features/hifd/HifdView.jsx";
import ToastHost from "./ui/Toast.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import Banner from "./ui/Banner.jsx";
import Button from "./ui/Button.jsx";
import BackupReminder from "./features/settings/BackupReminder.jsx";
import MoreView from "./features/settings/MoreView.jsx";
import TabBar from "./ui/TabBar.jsx";
import BackButton from "./ui/BackButton.jsx";

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
  { id: "tracker", label: "Vandaag", icon: "today" },
  { id: "week", label: "Planning", icon: "calendar" },
  { id: "logbook", label: "Notities", icon: "notes" },
  { id: "hifd", label: "Hifd", icon: "book" },
  { id: "meer", label: "Meer", icon: "more" },
];

export default function App({ startupErrors = [] }) {
  // --- Dexie reactive queries ---
  const settingsRecord = useLiveQuery(() => db.settings.get("singleton"));
  const settings = settingsRecord ?? DEFAULT_SETTINGS;

  const areasBlob = useLiveQuery(() => db.blobs.get("areas"));
  const areas = areasBlob?.data ?? DEFAULT_AREAS;

  const routinesBlob = useLiveQuery(() => db.blobs.get("routines"));
  const routines = routinesBlob?.data ?? DEFAULT_ROUTINES;

  const calTemplatesBlob = useLiveQuery(() => db.blobs.get("calTemplates"));
  const calTemplates = calTemplatesBlob?.data ?? DEFAULT_CAL_TEMPLATES;

  const weekScheduleTemplatesBlob = useLiveQuery(() =>
    db.blobs.get("weekTemplates"),
  );
  const weekScheduleTemplates = weekScheduleTemplatesBlob?.data ?? [];

  const calEvents = useLiveQuery(() => db.calEvents.toArray()) ?? [];

  const allDaysRaw = useLiveQuery(() => db.days.toArray());
  const allDays = useMemo(() => {
    if (!allDaysRaw) return {};
    const m = {};
    allDaysRaw.forEach((e) => {
      m[e.date] = e;
    });
    return m;
  }, [allDaysRaw]);

  // --- UI state ---
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );
  const [date, setDate] = useState(new Date());
  const [tab, setTab] = useState("ochtend");
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
  const day = dayRecord ?? { checked: {}, energy: 7, mood: "Goed", notes: "" };

  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
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

  const areaStyles = useMemo(() => buildAreaStyles(areas), [areas]);
  const areaNames = areas.map((a) => a.name);

  // --- Dexie-backed setters (same API as the old React setters) ---
  const setSettings = (updater) => {
    const current = settingsRecord ?? DEFAULT_SETTINGS;
    const next = typeof updater === "function" ? updater(current) : updater;
    db.settings.put({ id: "singleton", ...next });
  };

  const setAreas = (updater) => {
    const next = typeof updater === "function" ? updater(areas) : updater;
    db.blobs.put({ key: "areas", data: next });
  };

  const setRoutines = (updater) => {
    const next = typeof updater === "function" ? updater(routines) : updater;
    db.blobs.put({ key: "routines", data: next });
  };

  const setCalTemplates = (updater) => {
    const next =
      typeof updater === "function" ? updater(calTemplates) : updater;
    db.blobs.put({ key: "calTemplates", data: next });
  };

  const setWeekScheduleTemplates = (updater) => {
    const next =
      typeof updater === "function" ? updater(weekScheduleTemplates) : updater;
    db.blobs.put({ key: "weekTemplates", data: next });
  };

  const setCalEvents = (updater) => {
    const next = typeof updater === "function" ? updater(calEvents) : updater;
    db.transaction("rw", db.calEvents, async () => {
      await db.calEvents.clear();
      if (next.length) await db.calEvents.bulkPut(next);
    });
  };

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

  const streak = (() => {
    const threshold = Math.max(
      1,
      Math.ceil(total * ((settings.streakPct || 50) / 100)),
    );
    let s = 0;
    const d = new Date();
    const todayCount = Object.values(checked).filter(Boolean).length;
    if (isToday(date) && todayCount >= threshold) s++;
    else if (!isToday(date)) {
      const t = allDays[dk(new Date())];
      if (
        t?.checked &&
        Object.values(t.checked).filter(Boolean).length >= threshold
      )
        s++;
    }
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const data = allDays[dk(d)];
      const done = data?.checked
        ? Object.values(data.checked).filter(Boolean).length
        : 0;
      if (done < threshold) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const toggleNotifications = async () => {
    if (typeof Notification === "undefined") {
      showToast("Meldingen worden niet ondersteund door deze browser.");
      return;
    }
    if (settings.notifEnabled) {
      setSettings((s) => ({ ...s, notifEnabled: false }));
      return;
    }
    let perm = Notification.permission;
    if (perm !== "granted") perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      setSettings((s) => ({ ...s, notifEnabled: true }));
      // Android-PWA's tonen meldingen alleen via de service worker;
      // de `new Notification()`-constructor faalt daar stil.
      const title = "🔔 Meldingen aan";
      const body = "Je krijgt nu herinneringen voor je weekplanning.";
      if (navigator.serviceWorker) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(title, {
              body,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            }),
          )
          .catch(() => {
            try {
              new Notification(title, { body });
            } catch {}
          });
      } else {
        try {
          new Notification(title, { body });
        } catch {}
      }
    } else {
      showToast(
        "Meldingen zijn geblokkeerd. Sta ze toe in de browser-/app-instellingen om herinneringen te krijgen.",
      );
    }
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

  const runFullImport = async (data, merge) => {
    try {
      // Vangnet: vóór "vervangen" de huidige staat downloaden, zodat een
      // verkeerde backup nooit het enige exemplaar van je data wist.
      if (!merge) await exportData();
      await performFullImport(data, merge);
    } catch (err) {
      showToast("❌ Fout bij importeren: " + err.message);
    } finally {
      setPendingImport(null);
    }
  };

  const clearAllDays = async () => {
    const count = await db.days.count();
    await db.days.clear();
    showToast(`✓ ${count} dagen gewist`);
  };

  const clearEverything = async () => {
    await db.transaction(
      "rw",
      db.settings,
      db.blobs,
      db.days,
      db.calEvents,
      db.logEntries,
      db.hifd,
      db.hifdLogV2,
      db.meta,
      async () => {
        await db.settings.put({ id: "singleton", ...DEFAULT_SETTINGS });
        await db.blobs.put({ key: "areas", data: DEFAULT_AREAS });
        await db.blobs.put({ key: "routines", data: DEFAULT_ROUTINES });
        await db.blobs.put({
          key: "calTemplates",
          data: DEFAULT_CAL_TEMPLATES,
        });
        await db.blobs.put({ key: "weekTemplates", data: [] });
        await db.blobs.put({ key: "notebooks", data: DEFAULT_NOTEBOOKS });
        await db.days.clear();
        await db.calEvents.clear();
        await db.logEntries.clear();
        await db.hifd.clear();
        await db.hifdLogV2.clear();
        await db.meta.delete("hifd_seeded");
      },
    );
    await seedHifd();
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("rt_notified_")) keysToDelete.push(k);
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
    showToast("✓ Alles gewist. App is gereset.");
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

  // Datum-kaart: label + subtitel op basis van actieve view en statsPeriod
  const getDateCard = () => {
    if (view === "tracker") {
      const d = date.getDate();
      const monthName = MONTHS_NL[date.getMonth()].toLowerCase();
      const sub = isToday(date) ? "Vandaag" : DAYS_NL[date.getDay()];
      return { main: `${d} ${monthName}`, sub };
    }
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
  };
  const { main: dateMain, sub: dateSub } = getDateCard();

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
      {view === "tracker" && <BackupReminder onExport={exportData} />}

      {/* MEER: statistieken-ingang + instellingen */}
      {view === "meer" && (
        <MoreView onOpenStats={() => setView("stats")}>
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

      {/* DATUM-KAART */}
      {view !== "logbook" && view !== "meer" && (
        <div style={{ padding: "12px 14px 0", background: "var(--bg)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "10px 12px",
            }}
          >
            <NavBtn onClick={() => goNav(-1)}>◀</NavBtn>
            <div
              style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
              onClick={() => setDate(new Date())}
            >
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-.01em",
                  lineHeight: 1.1,
                }}
              >
                {dateMain}
              </div>
              {dateSub && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {dateSub}
                </div>
              )}
            </div>
            <NavBtn onClick={() => goNav(1)}>▶</NavBtn>
          </div>
        </div>
      )}

      {/* TRACKER */}
      {view === "tracker" && (
        <TrackerView
          day={day}
          saveDay={saveDay}
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
        <WeekView
          date={date}
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
          date={date}
          setDate={setDate}
          setView={setView}
          statsPeriod={statsPeriod}
          setStatsPeriod={setStatsPeriod}
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

      {pendingImport && (
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
      )}

      <TabBar
        items={TABS}
        active={view === "stats" ? "meer" : view}
        onSelect={setView}
      />
      <ToastHost />
    </div>
  );
}
