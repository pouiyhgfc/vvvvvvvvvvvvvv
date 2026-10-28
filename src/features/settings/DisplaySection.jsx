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
  return (
    <>
      {/* WEERGAVE & MELDINGEN */}
      <Section
        title="Weergave en meldingen"
        icon={<Emoji char="🎨" size={20} />}
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
              <Emoji char="🌙" size={13} /> Donkere modus
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
              Meldingen weekplanning
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
                  Geblokkeerd in browserinstellingen.
                </span>
              )}
              {notifPerm === "unsupported" && (
                <span
                  style={{ color: "#dc2626", display: "block", marginTop: 2 }}
                >
                  Niet ondersteund op dit apparaat.
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
              Tijd vooraf:{" "}
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
            <Emoji char="🔥" size={12} /> Streak-drempel: {settings.streakPct}%
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
        <div
          style={{
            paddingTop: 12,
            borderTop: "1px solid var(--border-soft)",
            marginTop: 12,
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
            <Emoji char="🌙" size={12} /> Hifd revisies per dag:{" "}
            {settings.hifdDailyCap ?? 4}
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={settings.hifdDailyCap ?? 4}
            onChange={(e) =>
              setSettings((s) => ({ ...s, hifdDailyCap: +e.target.value }))
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
            Maximaal aantal gememoriseerde surahs ter revisie per dag.
          </div>
        </div>
      </Section>
    </>
  );
}
