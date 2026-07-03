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
import NavBtn from "./ui/NavBtn.jsx";
import TrackerView from "./features/tracker/TrackerView.jsx";
import WeekView from "./features/planner/WeekView.jsx";
import StatsView from "./features/stats/StatsView.jsx";
import SettingsPanel from "./features/settings/SettingsPanel.jsx";
import LogbookView from "./features/logbook/LogbookView.jsx";
import HifdView from "./features/hifd/HifdView.jsx";
import ToastHost from "./ui/Toast.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import Emoji from "./ui/Emoji.jsx";

export default function App() {
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
  const [showSettings, setShowSettings] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [pendingImport, setPendingImport] = useState(null);

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
        settings.theme === "dark" ? "#0e1210" : "#0a3d2b",
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

  const exportData = async () => {
    const allDaysForExport = {};
    (allDaysRaw ?? []).forEach((e) => {
      const { date: d, ...rest } = e;
      allDaysForExport[d] = rest;
    });
    const logEntries = await db.logEntries.toArray();
    const notebooksBlob = await db.blobs.get("notebooks");
    const hifdData = await db.hifd.toArray();
    const hifdLogData = await db.hifdLogV2.toArray();
    const payload = {
      version: 8,
      exportedAt: new Date().toISOString(),
      routines,
      areas,
      calTemplates,
      calEvents,
      weekScheduleTemplates,
      settings,
      days: allDaysForExport,
      logEntries,
      notebooks: notebooksBlob?.data ?? DEFAULT_NOTEBOOKS,
      hifd: hifdData,
      hifdLog: hifdLogData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routine-backup-${dk(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportRoutines = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      type: "routines",
      routines,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routines-${dk(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportWeekplanning = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      type: "weekplanning",
      calTemplates,
      calEvents,
      weekScheduleTemplates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekplanning-${dk(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportNotities = async () => {
    const logEntries = await db.logEntries.toArray();
    const notebooksBlob = await db.blobs.get("notebooks");
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      type: "notities",
      logEntries,
      notebooks: notebooksBlob?.data ?? DEFAULT_NOTEBOOKS,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notities-${dk(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const type = data.type || "full";
        if (
          !data.routines &&
          !data.days &&
          !data.calEvents &&
          !data.weekScheduleTemplates &&
          !data.logEntries
        ) {
          showToast("❌ Ongeldig backup bestand.");
          return;
        }
        if (type === "notities") {
          if (!Array.isArray(data.logEntries)) {
            showToast("❌ Geen notities gevonden in dit bestand.");
            return;
          }
          await db.transaction("rw", db.blobs, db.logEntries, async () => {
            if (data.logEntries.length)
              await db.logEntries.bulkPut(data.logEntries);
            if (Array.isArray(data.notebooks) && data.notebooks.length)
              await db.blobs.put({ key: "notebooks", data: data.notebooks });
          });
          showToast("✓ Notities geïmporteerd.");
          return;
        }
        if (type === "routines") {
          if (!data.routines) {
            showToast("❌ Geen routines gevonden in dit bestand.");
            return;
          }
          await db.blobs.put({ key: "routines", data: data.routines });
          showToast("✓ Routines geïmporteerd.");
          return;
        }
        if (type === "weekplanning") {
          if (data.calTemplates)
            await db.blobs.put({
              key: "calTemplates",
              data: data.calTemplates,
            });
          if (data.calEvents)
            await db.transaction("rw", db.calEvents, async () => {
              await db.calEvents.clear();
              if (data.calEvents.length)
                await db.calEvents.bulkPut(data.calEvents);
            });
          if (data.weekScheduleTemplates)
            await db.blobs.put({
              key: "weekTemplates",
              data: data.weekScheduleTemplates,
            });
          showToast("✓ Weekplanning geïmporteerd.");
          return;
        }
        if (!data.routines || !data.days) {
          showToast("❌ Ongeldig backup bestand.");
          return;
        }
        setPendingImport(data);
      } catch (err) {
        showToast("❌ Fout bij importeren: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const performFullImport = async (data, merge) => {
    try {
      await db.transaction(
        "rw",
        db.blobs,
        db.days,
        db.calEvents,
        db.settings,
        db.logEntries,
        db.hifd,
        db.hifdLogV2,
        async () => {
          if (!merge) {
            await db.days.clear();
            await db.calEvents.clear();
            await db.logEntries.clear();
            await db.hifd.clear();
            await db.hifdLogV2.clear();
          }
          await db.blobs.put({ key: "routines", data: data.routines });
          if (data.calTemplates)
            await db.blobs.put({
              key: "calTemplates",
              data: data.calTemplates,
            });
          if (data.weekScheduleTemplates)
            await db.blobs.put({
              key: "weekTemplates",
              data: data.weekScheduleTemplates,
            });
          if (data.calEvents && data.calEvents.length)
            await db.calEvents.bulkPut(data.calEvents);
          if (data.settings)
            await db.settings.put({
              id: "singleton",
              ...DEFAULT_SETTINGS,
              ...data.settings,
            });
          if (Array.isArray(data.areas) && data.areas.length)
            await db.blobs.put({ key: "areas", data: data.areas });
          const dayEntries = Object.entries(data.days).map(([d, dayData]) => ({
            date: d,
            ...dayData,
          }));
          if (dayEntries.length) await db.days.bulkPut(dayEntries);
          if (Array.isArray(data.logEntries) && data.logEntries.length)
            await db.logEntries.bulkPut(data.logEntries);
          if (Array.isArray(data.notebooks) && data.notebooks.length)
            await db.blobs.put({ key: "notebooks", data: data.notebooks });
          if (Array.isArray(data.hifd) && data.hifd.length)
            await db.hifd.bulkPut(data.hifd);
          if (Array.isArray(data.hifdLog) && data.hifdLog.length)
            await db.hifdLogV2.bulkPut(
              data.hifdLog.map((r) => ({ ...r, phase: r.phase || "learn" })),
            );
        },
      );
      showToast(
        `✓ Import gelukt! ${Object.keys(data.days).length} dagen geïmporteerd.`,
      );
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
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(140deg,#0a3d2b 0%,#0e7a52 100%)",
          padding: "22px 16px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "rgba(255,255,255,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Emoji char="🌿" size={20} />
          </div>
          <h1
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-.01em",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            Routine
          </h1>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            ["tracker", "✅", "Dag"],
            ["week", "📅", "Week"],
            ["stats", "📊", "Stats"],
            ["logbook", "📓", "Notities"],
            ["hifd", "🌙", "Hifd"],
            ["settings", "⚙️", "Config"],
          ].map(([v, ic, label]) => {
            const active =
              (view === v && v !== "settings") ||
              (v === "settings" && showSettings);
            return (
              <button
                key={v}
                onClick={() => {
                  v === "settings"
                    ? setShowSettings(!showSettings)
                    : setView(v);
                  if (v !== "settings") setShowSettings(false);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 2px 12px",
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "#ffffff" : "rgba(255,255,255,.14)",
                    border: active
                      ? "1px solid #ffffff"
                      : "1px solid rgba(255,255,255,.30)",
                    transition: "background .2s, border-color .2s",
                  }}
                >
                  <Emoji char={ic} size={17} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--ff-body)",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
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
      )}

      {/* DATUM-KAART */}
      {!showSettings && view !== "logbook" && (
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
      {view === "tracker" && !showSettings && (
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
      {view === "week" && !showSettings && (
        <WeekView
          date={date}
          calTemplates={calTemplates}
          calEvents={calEvents}
          setCalEvents={setCalEvents}
          weekScheduleTemplates={weekScheduleTemplates}
        />
      )}

      {/* STATS VIEW */}
      {view === "stats" && !showSettings && (
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
      {view === "logbook" && !showSettings && <LogbookView />}

      {/* HIFD VIEW */}
      {view === "hifd" && !showSettings && <HifdView />}

      {pendingImport && (
        <ConfirmDialog
          title="Backup importeren"
          message="Wil je deze backup samenvoegen met je huidige data, of je huidige data volledig vervangen?"
          danger={false}
          actions={[
            {
              label: "Samenvoegen",
              variant: "primary",
              onClick: () => performFullImport(pendingImport, true),
            },
            {
              label: "Volledig vervangen",
              variant: "dangerSolid",
              onClick: () => performFullImport(pendingImport, false),
            },
          ]}
          onCancel={() => setPendingImport(null)}
        />
      )}

      <ToastHost />
    </div>
  );
}
