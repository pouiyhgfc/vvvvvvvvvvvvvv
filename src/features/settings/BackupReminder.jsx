import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import Banner from "../../ui/Banner.jsx";
import Button from "../../ui/Button.jsx";

// Herinnert aan een export als de laatste volledige backup op dit toestel
// ouder is dan 30 dagen (of er nog nooit een was). Beide tijdstippen staan in
// db.meta, dus ze gaan niet mee in een backup: ze horen bij dít toestel.
const DAY = 24 * 60 * 60 * 1000;
const REMIND_AFTER = 30 * DAY;
const SNOOZE = 7 * DAY;

const metaTime = (key) =>
  db.meta.get(key).then((r) => (r ? new Date(r.value).getTime() : null));

// Rekent buiten de render (in de query), zodat het component puur blijft.
async function reminderState() {
  const [last, snoozedUntil] = await Promise.all([
    metaTime("lastExportAt"),
    metaTime("backupReminderSnooze"),
  ]);
  const now = Date.now();
  if (snoozedUntil && snoozedUntil > now) return { due: false };
  if (last && now - last < REMIND_AFTER) return { due: false };
  return { due: true, daysAgo: last ? Math.floor((now - last) / DAY) : null };
}

function snooze() {
  return db.meta.put({
    key: "backupReminderSnooze",
    value: new Date(Date.now() + SNOOZE).toISOString(),
  });
}

export default function BackupReminder({ onExport }) {
  const state = useLiveQuery(reminderState);
  if (!state?.due) return null;

  return (
    <Banner
      icon="💾"
      actions={
        <>
          <Button size="sm" variant="ghost" onClick={snooze}>
            Over een week
          </Button>
          <Button size="sm" onClick={onExport}>
            Exporteer nu
          </Button>
        </>
      }
    >
      {state.daysAgo == null
        ? "Er is op dit toestel nog geen backup gemaakt."
        : `Je laatste backup is ${state.daysAgo} dagen oud.`}{" "}
      Je data staat alleen op dit toestel; een export is je vangnet.
    </Banner>
  );
}
