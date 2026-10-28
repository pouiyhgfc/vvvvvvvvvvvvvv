import { useState } from "react";
import { PERIOD_LABELS, PERIOD_COLORS } from "../../lib/constants.js";
import { uid } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { arrMove } from "../../hooks/useSortable.js";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import { SortableRoutineList } from "../../ui/SortableList.jsx";
import RoutineSheet from "./RoutineSheet.jsx";
import { addBtn } from "./settingsStyles.js";

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

  return (
    <>
      {/* ROUTINES */}
      <Section title="Routines" icon={<Emoji char="📋" size={20} />}>
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
