import { useState } from "react";
import {
  PERIOD_LABELS,
  PERIOD_COLORS,
  DEFAULT_ROUTINES,
} from "../../lib/constants.js";
import { getMonday, dk, uid, applyWeekTemplate } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { arrMove } from "../../hooks/useSortable.js";
import { showToast } from "../../lib/toast.js";
import {
  SortableTemplateList,
  SortableWeekTplList,
  SortableRoutineList,
} from "../../ui/SortableList.jsx";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import RoutineSheet from "./RoutineSheet.jsx";
import TemplateSheet from "./TemplateSheet.jsx";
import AreaSheet from "./AreaSheet.jsx";
import WeekTemplateSheet from "./WeekTemplateSheet.jsx";
import Section from "../../ui/Section.jsx";
import Emoji from "../../ui/Emoji.jsx";

const addBtn = {
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 6,
  background: "var(--accent)",
  color: "white",
  fontWeight: 600,
};
const introP = {
  fontSize: 11,
  color: "var(--text-muted)",
  marginBottom: 10,
  lineHeight: 1.5,
};
const emptyList = {
  textAlign: "center",
  padding: "14px 0",
  color: "var(--text-faint)",
  fontSize: 12,
};

export default function SettingsPanel({
  settings,
  setSettings,
  notifPerm,
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
  date,
  total,
  areaNames,
  areaStyles,
  toggleNotifications,
  clearAllDays,
  clearEverything,
  exportData,
  exportRoutines,
  exportWeekplanning,
  exportNotities,
  importData,
  dataInfo,
}) {
  const [openPeriods, setOpenPeriods] = useState({
    ochtend: true,
    middag: true,
    avond: true,
  });
  const [routineSheet, setRoutineSheet] = useState(null); // { period, routine }
  const [tplSheet, setTplSheet] = useState(null); // "new" | template
  const [areaSheet, setAreaSheet] = useState(null); // "new" | { area, index }
  const [weekTplSheet, setWeekTplSheet] = useState(null); // tpl
  const [savingWeek, setSavingWeek] = useState(false);
  const [weekName, setWeekName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(null); // "days" | "all"

  // --- Routines ---
  const saveRoutine = (data) => {
    buzz();
    const { period } = routineSheet;
    setRoutines((prev) => ({
      ...prev,
      [period]: data.id
        ? prev[period].map((r) => (r.id === data.id ? { ...r, ...data } : r))
        : [...prev[period], { id: uid(), ...data }],
    }));
    setRoutineSheet(null);
  };
  const deleteRoutine = () => {
    const { period, routine } = routineSheet;
    setRoutines((prev) => ({
      ...prev,
      [period]: prev[period].filter((r) => r.id !== routine.id),
    }));
    setRoutineSheet(null);
  };
  const reorderRoutine = (period, from, to) =>
    setRoutines((prev) => ({
      ...prev,
      [period]: arrMove(prev[period], from, to),
    }));

  // --- Weekplanner templates ---
  const saveTemplate = (data) => {
    buzz();
    setCalTemplates((prev) =>
      data.id
        ? prev.map((t) => (t.id === data.id ? { ...t, ...data } : t))
        : [...prev, { id: uid(), ...data }],
    );
    setTplSheet(null);
  };
  const deleteTemplate = () => {
    setCalTemplates((prev) => prev.filter((t) => t.id !== tplSheet.id));
    setTplSheet(null);
  };

  // --- Focusgebieden ---
  const saveArea = (data) => {
    buzz();
    if (areaSheet === "new") {
      setAreas((prev) => [...prev, data]);
    } else {
      const i = areaSheet.index;
      const old = areas[i]?.name;
      setAreas((prev) => prev.map((a, idx) => (idx === i ? data : a)));
      if (old && old !== data.name)
        setRoutines((prev) => {
          const n = {};
          for (const k in prev)
            n[k] = prev[k].map((r) =>
              r.area === old ? { ...r, area: data.name } : r,
            );
          return n;
        });
    }
    setAreaSheet(null);
  };
  const deleteArea = () => {
    const i = areaSheet.index;
    setAreas((prev) => prev.filter((_, idx) => idx !== i));
    setAreaSheet(null);
  };

  // --- Weekschema templates ---
  const weekEventCount = calEvents.filter((e) => {
    const monStr = dk(getMonday(date));
    const sunStr = dk(new Date(getMonday(date).getTime() + 6 * 86400000));
    return e.date >= monStr && e.date <= sunStr;
  }).length;

  const saveCurrentWeek = () => {
    if (!weekName.trim()) return;
    const mon = getMonday(date);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const monStr = dk(mon),
      sunStr = dk(sun);
    const weekEvents = calEvents.filter(
      (e) => e.date >= monStr && e.date <= sunStr,
    );
    const tplEvents = weekEvents.map((ev) => ({
      ...ev,
      id: uid(),
      dayOffset: Math.round((new Date(ev.date + "T00:00") - mon) / 86400000),
    }));
    setWeekScheduleTemplates((prev) => [
      ...prev,
      {
        id: uid(),
        name: weekName.trim(),
        createdAt: new Date().toISOString(),
        events: tplEvents,
      },
    ]);
    setSavingWeek(false);
    setWeekName("");
    showToast("✓ Weekschema opgeslagen");
  };
  const loadWeek = (tpl) => {
    const newEvs = applyWeekTemplate(tpl, getMonday(date));
    setCalEvents((prev) => [...prev, ...newEvs]);
    setWeekTplSheet(null);
    showToast(`✓ ${newEvs.length} events toegevoegd`);
  };
  const replaceWeek = (tpl) => {
    const mon = getMonday(date);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const monStr = dk(mon),
      sunStr = dk(sun);
    const newEvs = applyWeekTemplate(tpl, mon);
    setCalEvents((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.date >= monStr &&
            e.date <= sunStr &&
            (!e.repeat || e.repeat === "none")
          ),
      ),
      ...newEvs,
    ]);
    setWeekTplSheet(null);
    showToast(`✓ ${newEvs.length} events ingeladen`);
  };

  return (
    <div
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border-mid)",
        padding: 16,
        animation: "fadeUp .2s ease",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--ff-head)",
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        ⚙️ Instellingen
      </h2>

      {/* WEERGAVE & MELDINGEN */}
      <Section
        title="Weergave & Meldingen"
        icon={<Emoji char="🎨" size={16} />}
        defaultOpen
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              🌙 Donkere modus
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              Schakelt de app naar een donker thema — rustiger voor je ogen 's
              avonds.
            </div>
          </div>
          <label className="switch" style={{ marginTop: 2 }}>
            <input
              type="checkbox"
              checked={settings.theme === "dark"}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  theme: e.target.checked ? "dark" : "light",
                }))
              }
            />
            <span className="slider-tg" />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            paddingTop: 12,
            paddingBottom: settings.notifEnabled ? 12 : 0,
            borderBottom: settings.notifEnabled
              ? "1px solid var(--border)"
              : "none",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              🔔 Meldingen weekplanning
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              Herinnering vóór een gepland event. Op Android (geïnstalleerde
              app) ook op de achtergrond; op iPhone alleen terwijl de app open
              is.
              {notifPerm === "denied" && (
                <span
                  style={{ color: "#dc2626", display: "block", marginTop: 2 }}
                >
                  ⚠️ Geblokkeerd in browserinstellingen.
                </span>
              )}
              {notifPerm === "unsupported" && (
                <span
                  style={{ color: "#dc2626", display: "block", marginTop: 2 }}
                >
                  ⚠️ Niet ondersteund op dit apparaat.
                </span>
              )}
            </div>
          </div>
          <label className="switch" style={{ marginTop: 2 }}>
            <input
              type="checkbox"
              checked={settings.notifEnabled}
              onChange={toggleNotifications}
            />
            <span className="slider-tg" />
          </label>
        </div>
        {settings.notifEnabled && (
          <div
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                display: "block",
                marginBottom: 6,
              }}
            >
              ⏰ Tijd vooraf:{" "}
              {settings.notifLeadMin === 0
                ? "op starttijd"
                : `${settings.notifLeadMin} min vooraf`}
            </label>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={settings.notifLeadMin}
              onChange={(e) =>
                setSettings((s) => ({ ...s, notifLeadMin: +e.target.value }))
              }
            />
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Hoeveel minuten vóór elk event je een melding krijgt.
            </div>
          </div>
        )}

        <div style={{ paddingTop: 12 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 6,
            }}
          >
            🔥 Streak-drempel: {settings.streakPct}%
          </label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={settings.streakPct}
            onChange={(e) =>
              setSettings((s) => ({ ...s, streakPct: +e.target.value }))
            }
          />
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            Minimaal{" "}
            {Math.max(1, Math.ceil(total * (settings.streakPct / 100)))} van{" "}
            {total} routines afvinken telt als een voltooide dag voor je streak.
          </div>
        </div>
      </Section>

      {/* FOCUSGEBIEDEN */}
      <Section
        title="Focusgebieden"
        icon={<Emoji char="🎯" size={16} />}
        right={
          <button onClick={() => setAreaSheet("new")} style={addBtn}>
            + Gebied
          </button>
        }
      >
        <p style={introP}>
          Tik een gebied aan om naam en kleur te wijzigen. De kleur wordt
          gebruikt voor routines in dit gebied (kalender-events hebben een eigen
          kleur).
        </p>
        {areas.map((ar, i) => (
          <div
            key={i}
            onClick={() => setAreaSheet({ area: ar, index: i })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 10px",
              borderRadius: 8,
              background: "var(--card)",
              borderLeft: `4px solid ${ar.color}`,
              marginBottom: 5,
              boxShadow: "0 1px 2px var(--shadow)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: ar.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {ar.name}
            </span>
            <span style={{ fontSize: 16, color: "var(--text-faint)" }}>›</span>
          </div>
        ))}
      </Section>

      {/* BACKUP */}
      <Section
        title="Backup & Data"
        icon={<Emoji char="💾" size={16} />}
        tone="accent"
        defaultOpen
      >
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Alles in één
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <button
              onClick={exportData}
              style={{
                padding: "8px",
                borderRadius: 7,
                background: "var(--accent)",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              📤 Exporteer alles
            </button>
            <label
              style={{
                padding: "8px",
                borderRadius: 7,
                background: "#0369a1",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              📥 Importeer
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    importData(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--accent-border)",
            paddingTop: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Losse export
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            <button
              onClick={exportRoutines}
              style={{
                padding: "7px 8px",
                borderRadius: 7,
                background: "#d97706",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              📋 Export Routines
            </button>
            <button
              onClick={exportWeekplanning}
              style={{
                padding: "7px 8px",
                borderRadius: 7,
                background: "#7c3aed",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              📆 Export Weekplanning
            </button>
            <button
              onClick={exportNotities}
              style={{
                gridColumn: "1 / -1",
                padding: "7px 8px",
                borderRadius: 7,
                background: "#0891b2",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              📓 Export Notities
            </button>
          </div>
        </div>
        <div
          style={{ fontSize: 10, color: "var(--accent-text)", lineHeight: 1.6 }}
        >
          <div>
            📊 <b>{dataInfo.dayCount}</b> dagen · <b>{total}</b> routines ·{" "}
            <b>{calTemplates.length}</b> templates ·{" "}
            <b>{weekScheduleTemplates.length}</b> weekschema's ·{" "}
            <b>{dataInfo.kb} KB</b>
          </div>
          <div style={{ opacity: 0.8 }}>
            Alles staat lokaal op dit apparaat. Niemand kan meekijken.
          </div>
        </div>
      </Section>

      {/* WEEKPLANNER TEMPLATES */}
      <Section
        title="Weekplanner Templates"
        icon={<Emoji char="📅" size={16} />}
        right={
          <button onClick={() => setTplSheet("new")} style={addBtn}>
            + Nieuw
          </button>
        }
      >
        <p style={introP}>
          Snelkeuze-activiteiten voor de weekkalender. Tik een template aan om
          te bewerken; sleep met ⠿ om te ordenen.
        </p>
        {calTemplates.length === 0 && (
          <div style={emptyList}>Nog geen templates.</div>
        )}
        <SortableTemplateList
          items={calTemplates}
          onReorder={(from, to) =>
            setCalTemplates((prev) => arrMove(prev, from, to))
          }
          onEdit={(t) => setTplSheet(t)}
        />
      </Section>

      {/* WEEKSCHEMA TEMPLATES */}
      <Section
        title="Weekschema Templates"
        icon={<Emoji char="📅" size={16} />}
        right={
          <button
            onClick={() => {
              setSavingWeek(true);
              setWeekName("");
            }}
            style={addBtn}
          >
            💾 Huidig opslaan
          </button>
        }
      >
        <p style={introP}>
          Sla je huidige weekplanning op als template en laad hem later in voor
          elke week.
        </p>
        {weekScheduleTemplates.length === 0 && (
          <div style={emptyList}>Nog geen weekschema templates.</div>
        )}
        <SortableWeekTplList
          items={weekScheduleTemplates}
          onReorder={(from, to) =>
            setWeekScheduleTemplates((prev) => arrMove(prev, from, to))
          }
          onEdit={(tpl) => setWeekTplSheet(tpl)}
        />
      </Section>

      {/* ROUTINES */}
      <Section title="Routines Beheren" icon={<Emoji char="📋" size={16} />}>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          Sleep met ⠿ om te ordenen. Tik een routine aan om te bewerken of te
          verwijderen.
        </p>

        {Object.entries(PERIOD_LABELS).map(([period, label]) => {
          const isOpen = openPeriods[period];
          return (
            <div
              key={period}
              style={{
                marginTop: 12,
                borderTop: "1px solid var(--border)",
                paddingTop: 10,
              }}
            >
              <div
                onClick={() =>
                  setOpenPeriods((p) => ({ ...p, [period]: !p[period] }))
                }
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: PERIOD_COLORS[period],
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      display: "inline-block",
                      transition: "transform .2s",
                      transform: isOpen ? "rotate(90deg)" : "none",
                    }}
                  >
                    ▸
                  </span>
                  {label}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-faint)",
                    }}
                  >
                    ({routines[period].length})
                  </span>
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoutineSheet({ period, routine: null });
                  }}
                  style={addBtn}
                >
                  + Toevoegen
                </button>
              </div>
              {isOpen && (
                <div style={{ marginTop: 8 }}>
                  <SortableRoutineList
                    items={routines[period]}
                    onReorder={(from, to) => reorderRoutine(period, from, to)}
                    onEdit={(r) => setRoutineSheet({ period, routine: r })}
                    areaStyles={areaStyles}
                  />
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* DANGER ZONE */}
      <Section
        title="Gevarenzone"
        icon={<Emoji char="⚠️" size={16} />}
        tone="danger"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "var(--card)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: 11,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            🔄 Reset routines naar standaard{" "}
            <span style={{ opacity: 0.7, fontWeight: 400 }}>
              (dagdata blijft)
            </span>
          </button>
          <button
            onClick={() => setConfirmClear("days")}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "var(--card)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: 11,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            🗑️ Wis alle dagdata{" "}
            <span style={{ opacity: 0.7, fontWeight: 400 }}>
              (routines blijven)
            </span>
          </button>
          <button
            onClick={() => setConfirmClear("all")}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "#dc2626",
              border: "1px solid #dc2626",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "left",
            }}
          >
            💥 Wis ALLES (reset naar fabrieksinstellingen)
          </button>
        </div>
      </Section>

      {/* SHEETS & DIALOGS */}
      {routineSheet && (
        <RoutineSheet
          routine={routineSheet.routine}
          periodLabel={PERIOD_LABELS[routineSheet.period]}
          areaNames={areaNames}
          onSave={saveRoutine}
          onDelete={routineSheet.routine ? deleteRoutine : undefined}
          onClose={() => setRoutineSheet(null)}
        />
      )}
      {tplSheet && (
        <TemplateSheet
          template={tplSheet === "new" ? null : tplSheet}
          onSave={saveTemplate}
          onDelete={tplSheet !== "new" ? deleteTemplate : undefined}
          onClose={() => setTplSheet(null)}
        />
      )}
      {areaSheet && (
        <AreaSheet
          area={areaSheet === "new" ? null : areaSheet.area}
          onSave={saveArea}
          onDelete={
            areaSheet !== "new" && areas.length > 1 ? deleteArea : undefined
          }
          onClose={() => setAreaSheet(null)}
        />
      )}
      {weekTplSheet && (
        <WeekTemplateSheet
          tpl={weekTplSheet}
          onRename={(name) => {
            setWeekScheduleTemplates((prev) =>
              prev.map((t) => (t.id === weekTplSheet.id ? { ...t, name } : t)),
            );
            setWeekTplSheet(null);
          }}
          onLoad={() => loadWeek(weekTplSheet)}
          onReplace={() => replaceWeek(weekTplSheet)}
          onDelete={() => {
            setWeekScheduleTemplates((prev) =>
              prev.filter((t) => t.id !== weekTplSheet.id),
            );
            setWeekTplSheet(null);
          }}
          onClose={() => setWeekTplSheet(null)}
        />
      )}
      {savingWeek && (
        <Sheet
          title="Weekschema opslaan"
          subtitle={`${weekEventCount} events van deze week`}
          onClose={() => setSavingWeek(false)}
          footer={
            <Button full disabled={!weekName.trim()} onClick={saveCurrentWeek}>
              💾 Opslaan
            </Button>
          }
        >
          <Field label="Naam">
            <TextInput
              value={weekName}
              autoFocus
              onChange={(e) => setWeekName(e.target.value)}
              placeholder="Naam voor dit weekschema..."
            />
          </Field>
        </Sheet>
      )}
      {confirmReset && (
        <ConfirmDialog
          title="Routines resetten?"
          message="Alle routines terugzetten naar standaard? Je dagdata blijft bewaard."
          confirmLabel="Resetten"
          danger={false}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setRoutines(DEFAULT_ROUTINES);
            setConfirmReset(false);
            showToast("✓ Routines gereset");
          }}
        />
      )}
      {confirmClear === "days" && (
        <ConfirmDialog
          title="Alle dagdata wissen?"
          message="Al je afgevinkte dagen, energie, mood en notities worden gewist (routines blijven). Exporteer eerst een backup — dit kan niet ongedaan worden gemaakt."
          confirmLabel="Wis dagdata"
          onCancel={() => setConfirmClear(null)}
          onConfirm={() => {
            setConfirmClear(null);
            clearAllDays();
          }}
        />
      )}
      {confirmClear === "all" && (
        <ConfirmDialog
          title="ALLES wissen?"
          message="Dit zet de hele app terug naar fabrieksinstellingen: routines, gebieden, templates, weekplanning én alle dagdata. Exporteer eerst een backup — dit is definitief."
          confirmLabel="Wis alles"
          onCancel={() => setConfirmClear(null)}
          onConfirm={() => {
            setConfirmClear(null);
            clearEverything();
          }}
        />
      )}
    </div>
  );
}
