import { useState } from "react";
import { getMonday, dk, uid, applyWeekTemplate } from "../../lib/date.js";
import { showToast } from "../../lib/toast.js";
import { arrMove } from "../../hooks/useSortable.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import Section from "../../ui/Section.jsx";
import Sheet from "../../ui/Sheet.jsx";
import { SortableWeekTplList } from "../../ui/SortableList.jsx";
import WeekTemplateSheet from "./WeekTemplateSheet.jsx";
import { addBtn, introP, emptyList } from "./settingsStyles.js";

// Weekschema's: de huidige week opslaan en later weer inladen.
export default function WeekSchedulesSection({
  weekScheduleTemplates,
  setWeekScheduleTemplates,
  calEvents,
  setCalEvents,
  date,
}) {
  const [weekTplSheet, setWeekTplSheet] = useState(null); // tpl
  const [savingWeek, setSavingWeek] = useState(false);
  const [weekName, setWeekName] = useState("");

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
    <>
      {/* WEEKSCHEMA TEMPLATES */}
      <Section
        title="Weekschema's"
        icon={<Emoji char="📅" size={20} />}
        right={
          <button
            onClick={() => {
              setSavingWeek(true);
              setWeekName("");
            }}
            style={addBtn}
          >
            <Emoji char="💾" size={11} /> Huidig opslaan
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
              <Emoji char="💾" size={14} /> Opslaan
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
    </>
  );
}
