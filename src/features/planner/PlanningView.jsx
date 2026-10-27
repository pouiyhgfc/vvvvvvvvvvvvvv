import { useState } from "react";
import { dk, eventsOnDate, getMonday, isToday, uid } from "../../lib/date.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Icon from "../../ui/Icon.jsx";
import BlockSheet from "./BlockSheet.jsx";
import DayTimeline from "./DayTimeline.jsx";
import WeekList from "./WeekList.jsx";
import WeekStrip from "./WeekStrip.jsx";
import WeekScheduleSheet from "./WeekScheduleSheet.jsx";
import { deleteOccurrence, isRecurring, updateOccurrence } from "./planner.js";

const shiftDate = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Planning: standaard één dag (weekstrip + tijdlijn), of de week als lijst.
// Eén sheet voor toevoegen/bewerken. Bij een herhalend blok vraagt de app
// altijd of het om deze ene dag gaat of om alle keren.
export default function PlanningView({
  calTemplates,
  calEvents,
  setCalEvents,
  weekScheduleTemplates,
}) {
  const [mode, setMode] = useState("dag");
  const [day, setDay] = useState(() => new Date());
  const [sheet, setSheet] = useState(null);
  const [askScope, setAskScope] = useState(null); // { occ, changes }
  const [scheduleSheet, setScheduleSheet] = useState(false);

  const dayEvents = eventsOnDate(calEvents, day);

  const apply = (occ, changes, scope) =>
    setCalEvents((prev) => updateOccurrence(prev, occ, changes, scope));

  // Wijziging van een bestaand blok: bij herhalen eerst de scope vragen.
  const change = (occ, changes) => {
    if (isRecurring(occ)) setAskScope({ occ, changes });
    else apply(occ, changes);
  };

  const addAt = (date, startMin) => setSheet({ mode: "add", date, startMin });
  const nextHour = () => {
    if (!isToday(day)) return 9 * 60;
    const now = new Date();
    return Math.min(23 * 60, (now.getHours() + 1) * 60);
  };

  const save = (fields) => {
    if (sheet.mode === "add") {
      setCalEvents((prev) => [...prev, { ...fields, id: uid(), exDates: [] }]);
    } else {
      change(sheet.occ, fields);
    }
    setSheet(null);
  };

  const remove = (scope) => {
    const occ = sheet.occ;
    setCalEvents((prev) => deleteOccurrence(prev, occ, scope));
    setSheet(null);
  };

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <header
        style={{
          padding: "var(--sp-6) var(--sp-5) var(--sp-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Planning
        </h1>
        {weekScheduleTemplates.length > 0 && (
          <button
            type="button"
            aria-label="Weekschema laden"
            onClick={() => setScheduleSheet(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-pill)",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="dots-three" size={24} />
          </button>
        )}
        <div
          role="tablist"
          aria-label="Weergave"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: "var(--r-md)",
            background: "var(--track)",
          }}
        >
          {[
            ["dag", "Dag"],
            ["week", "Week"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              style={{
                minHeight: 36,
                padding: "0 var(--sp-3)",
                borderRadius: "var(--r-sm)",
                border: "none",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                background: mode === key ? "var(--card)" : "transparent",
                color: mode === key ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div
        style={{
          padding: "0 var(--sp-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-3)",
        }}
      >
        {mode === "dag" ? (
          <>
            <WeekStrip
              date={day}
              onSelect={setDay}
              onShift={(n) => setDay((d) => shiftDate(d, n))}
              calEvents={calEvents}
            />
            <DayTimeline
              date={day}
              events={dayEvents}
              onAdd={(min) => addAt(day, min)}
              onEdit={(occ) => setSheet({ mode: "edit", occ })}
              onMove={change}
              onResize={change}
            />
          </>
        ) : (
          <WeekList
            date={day}
            onShift={(n) => setDay((d) => shiftDate(d, n))}
            calEvents={calEvents}
            onOpenDay={(d) => {
              setDay(d);
              setMode("dag");
            }}
            onEdit={(occ) => setSheet({ mode: "edit", occ })}
          />
        )}
      </div>

      <button
        type="button"
        aria-label="Nieuw blok"
        onClick={() => addAt(day, nextHour())}
        style={{
          position: "fixed",
          right: "max(16px, calc(50vw - 254px))",
          bottom: "calc(96px + env(safe-area-inset-bottom))",
          width: 56,
          height: 56,
          borderRadius: "var(--r-md)",
          border: "none",
          background: "var(--accent)",
          color: "var(--accent-contrast)",
          boxShadow: "var(--shadow-float)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 90,
        }}
      >
        <Icon name="plus" size={28} />
      </button>

      {sheet && (
        <BlockSheet
          key={sheet.mode === "edit" ? sheet.occ.id + sheet.occ.date : "add"}
          initial={sheet}
          templates={calTemplates}
          onSave={save}
          onDelete={remove}
          onClose={() => setSheet(null)}
        />
      )}

      {askScope && (
        <ConfirmDialog
          title="Herhalend blok wijzigen"
          message={`"${askScope.occ.title}" komt ${askScope.occ.repeat === "daily" ? "elke dag" : "elke week"} terug. Wat wil je wijzigen?`}
          danger={false}
          onCancel={() => setAskScope(null)}
          actions={[
            {
              label: "Alleen deze dag",
              variant: "secondary",
              onClick: () => {
                apply(askScope.occ, askScope.changes, "one");
                setAskScope(null);
              },
            },
            {
              label: "Alle keren",
              variant: "primary",
              onClick: () => {
                apply(askScope.occ, askScope.changes, "all");
                setAskScope(null);
              },
            },
          ]}
        />
      )}

      {scheduleSheet && (
        <WeekScheduleSheet
          templates={weekScheduleTemplates}
          monday={getMonday(day)}
          onApply={(events, replace) => {
            const mon = dk(getMonday(day));
            const sun = dk(shiftDate(getMonday(day), 6));
            setCalEvents((prev) => [
              ...(replace
                ? prev.filter(
                    (e) => !(e.date >= mon && e.date <= sun && !isRecurring(e)),
                  )
                : prev),
              ...events,
            ]);
            setScheduleSheet(false);
          }}
          onClose={() => setScheduleSheet(false)}
        />
      )}
    </div>
  );
}
