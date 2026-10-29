import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import StorageStatus from "./StorageStatus.jsx";
import { subLabel } from "./settingsStyles.js";

// Backup en data: alles of los exporteren, importeren, en wat er opgeslagen is.
export default function BackupSection({
  exportData,
  importData,
  exportRoutines,
  exportWeekplanning,
  exportNotities,
  dataInfo,
  total,
  templateCount,
  weekTemplateCount,
}) {
  return (
    <>
      <Section
        title="Backup en data"
        icon={<Emoji char="💾" size={20} />}
        defaultOpen
      >
        <StorageStatus />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--sp-2)",
            marginBottom: "var(--sp-3)",
          }}
        >
          <Button onClick={exportData}>Exporteer alles</Button>
          <label
            style={{
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-md)",
              background: "var(--sunken)",
              color: "var(--text)",
              fontSize: "var(--fs-md)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Importeer
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
        <p style={subLabel}>Los exporteren</p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--sp-2)",
            marginBottom: "var(--sp-3)",
          }}
        >
          <Button variant="secondary" size="sm" onClick={exportRoutines}>
            Routines
          </Button>
          <Button variant="secondary" size="sm" onClick={exportWeekplanning}>
            Weekplanning
          </Button>
          <Button variant="secondary" size="sm" onClick={exportNotities}>
            Notities
          </Button>
        </div>
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          <div>
            <b>{dataInfo.dayCount}</b> dagen · <b>{total}</b> routines ·{" "}
            <b>{templateCount}</b> snelkeuzes · <b>{weekTemplateCount}</b>{" "}
            weekschema's · <b>{dataInfo.kb} KB</b>
          </div>
          <div>Alles staat lokaal op dit apparaat. Niemand kan meekijken.</div>
        </div>
      </Section>
    </>
  );
}
