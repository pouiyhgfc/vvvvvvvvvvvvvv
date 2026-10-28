import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";

// Weergave en meldingen: thema, meldingen, streak-drempel en Hifd-limiet.
export default function DisplaySection({
  settings,
  setSettings,
  notifPerm,
  toggleNotifications,
  total,
}) {
  const set = (key) => (e) =>
    setSettings((s) => ({ ...s, [key]: +e.target.value }));
  const cap = settings.hifdDailyCap ?? 4;
  return (
    <Section title="Weergave en meldingen" icon={<Emoji char="🎨" size={20} />}>
      <ToggleRow
        title="Donkere modus"
        desc="Rustiger voor je ogen 's avonds."
        checked={settings.theme === "dark"}
        onChange={(e) =>
          setSettings((s) => ({
            ...s,
            theme: e.target.checked ? "dark" : "light",
          }))
        }
      />
      <ToggleRow
        title="Meldingen planning"
        desc="Herinnering vóór een gepland blok. Op Android (geïnstalleerde app) ook op de achtergrond; op iPhone alleen terwijl de app open is."
        warning={
          notifPerm === "denied"
            ? "Geblokkeerd in je browserinstellingen."
            : notifPerm === "unsupported"
              ? "Niet ondersteund op dit apparaat."
              : null
        }
        checked={settings.notifEnabled}
        onChange={toggleNotifications}
      />
      {settings.notifEnabled && (
        <SliderRow
          label={`Melding: ${
            settings.notifLeadMin === 0
              ? "op de starttijd"
              : `${settings.notifLeadMin} min vooraf`
          }`}
          hint="Hoeveel minuten vóór elk blok je een melding krijgt."
          min={0}
          max={60}
          step={5}
          value={settings.notifLeadMin}
          onChange={set("notifLeadMin")}
        />
      )}
      <SliderRow
        label={`Streak-drempel: ${settings.streakPct}%`}
        hint={`Minimaal ${Math.max(1, Math.ceil(total * (settings.streakPct / 100)))} van ${total} routines afvinken telt als een voltooide dag.`}
        min={10}
        max={100}
        step={5}
        value={settings.streakPct}
        onChange={set("streakPct")}
      />
      <SliderRow
        label={`Hifd-revisies per dag: ${cap}`}
        hint="Maximaal aantal gememoriseerde surahs ter revisie per dag."
        min={1}
        max={10}
        step={1}
        value={cap}
        onChange={set("hifdDailyCap")}
        last
      />
    </Section>
  );
}

const row = (last) => ({
  padding: "var(--sp-3) 0",
  borderBottom: last ? "none" : "1px solid var(--border-soft)",
});
const titleStyle = { fontSize: "var(--fs-md)", color: "var(--text)" };
const descStyle = {
  marginTop: 2,
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
  lineHeight: 1.45,
};

function ToggleRow({ title, desc, warning, checked, onChange }) {
  return (
    <label
      style={{ ...row(false), display: "flex", alignItems: "center", gap: 12 }}
    >
      <span style={{ flex: 1 }}>
        <span style={{ ...titleStyle, display: "block" }}>{title}</span>
        <span style={{ ...descStyle, display: "block" }}>{desc}</span>
        {warning && (
          <span
            style={{
              ...descStyle,
              display: "block",
              color: "var(--danger-text)",
            }}
          >
            {warning}
          </span>
        )}
      </span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider-tg" />
      </span>
    </label>
  );
}

function SliderRow({ label, hint, last, ...input }) {
  return (
    <label style={{ ...row(last), display: "block" }}>
      <span style={{ ...titleStyle, display: "block", marginBottom: 10 }}>
        {label}
      </span>
      <input type="range" {...input} />
      <span style={{ ...descStyle, display: "block", marginTop: 8 }}>
        {hint}
      </span>
    </label>
  );
}
