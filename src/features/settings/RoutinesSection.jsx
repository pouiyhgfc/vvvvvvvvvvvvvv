import { useState } from "react";
import { PERIOD_LABELS } from "../../lib/constants.js";
import { uid } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { arrMove } from "../../hooks/useSortable.js";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import { SortableRoutineList } from "../../ui/SortableList.jsx";
import RoutineSheet from "./RoutineSheet.jsx";
import Icon from "../../ui/Icon.jsx";
import AddButton from "./AddButton.jsx";
import { introP } from "./settingsStyles.js";

// Routines per dagdeel: slepen om te ordenen, tikken om te bewerken.
export default function RoutinesSection({
  routines,
  setRoutines,
  areaNames,
  areaStyles,
}) {
  const [openPeriods, setOpenPeriods] = useState({
    ochtend: true,
    middag: true,
    avond: true,
  });
  const [routineSheet, setRoutineSheet] = useState(null); // { period, routine }

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

  return (
    <>
      <Section title="Routines" icon={<Emoji char="📋" size={20} />}>
        <p style={introP}>
          Sleep met ⠿ om te ordenen. Tik een routine aan om te bewerken of te
          verwijderen.
        </p>

        {Object.entries(PERIOD_LABELS).map(([period, label]) => {
          const isOpen = openPeriods[period];
          return (
            <div
              key={period}
              style={{ borderTop: "1px solid var(--border-soft)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenPeriods((p) => ({ ...p, [period]: !p[period] }))
                  }
                  style={{
                    flex: 1,
                    minHeight: 52,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: "var(--fs-md)",
                    fontWeight: 600,
                    textAlign: "start",
                    padding: 0,
                  }}
                >
                  <Icon
                    name="caret-down"
                    size={16}
                    style={{
                      color: "var(--text-muted)",
                      transition: "transform .2s",
                      transform: isOpen ? "none" : "rotate(-90deg)",
                    }}
                  />
                  {label}
                  <span
                    style={{
                      fontSize: "var(--fs-sm)",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                    }}
                  >
                    {routines[period].length}
                  </span>
                </button>
                <AddButton
                  label={`Routine toevoegen aan ${label.toLowerCase()}`}
                  onClick={() => setRoutineSheet({ period, routine: null })}
                />
              </div>
              {isOpen && (
                <div>
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
    </>
  );
}
