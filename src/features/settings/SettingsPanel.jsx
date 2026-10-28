import Icon from "../../ui/Icon.jsx";
import Section from "../../ui/Section.jsx";
import AreasSection from "./AreasSection.jsx";
import BackupSection from "./BackupSection.jsx";
import DangerSection from "./DangerSection.jsx";
import DisplaySection from "./DisplaySection.jsx";
import PlanTemplatesSection from "./PlanTemplatesSection.jsx";
import RoutinesSection from "./RoutinesSection.jsx";
import TagManager from "./TagManager.jsx";
import WeekSchedulesSection from "./WeekSchedulesSection.jsx";

// Meer: alle instellingen als inklapbare secties; elke sectie beheert zijn
// eigen sheets en bevestigingen.
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
  return (
    <div style={{ padding: 16 }}>
      <h2
        style={{
          fontFamily: "var(--ff-head)",
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Instellingen
      </h2>

      <DisplaySection
        settings={settings}
        setSettings={setSettings}
        notifPerm={notifPerm}
        toggleNotifications={toggleNotifications}
        total={total}
      />
      <AreasSection
        areas={areas}
        setAreas={setAreas}
        setRoutines={setRoutines}
      />
      {/* TAGS */}
      <Section title="Tags" icon={<Icon name="hash" size={20} />}>
        <TagManager />
      </Section>

      <BackupSection
        exportData={exportData}
        importData={importData}
        exportRoutines={exportRoutines}
        exportWeekplanning={exportWeekplanning}
        exportNotities={exportNotities}
        dataInfo={dataInfo}
        total={total}
        templateCount={calTemplates.length}
        weekTemplateCount={weekScheduleTemplates.length}
      />
      <PlanTemplatesSection
        calTemplates={calTemplates}
        setCalTemplates={setCalTemplates}
      />
      <WeekSchedulesSection
        weekScheduleTemplates={weekScheduleTemplates}
        setWeekScheduleTemplates={setWeekScheduleTemplates}
        calEvents={calEvents}
        setCalEvents={setCalEvents}
        date={date}
      />
      <RoutinesSection
        routines={routines}
        setRoutines={setRoutines}
        areaNames={areaNames}
        areaStyles={areaStyles}
      />
      <DangerSection
        setRoutines={setRoutines}
        clearAllDays={clearAllDays}
        clearEverything={clearEverything}
      />
    </div>
  );
}
