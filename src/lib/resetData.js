import { db, seedHifd } from "./db.js";
import {
  DEFAULT_AREAS,
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_NOTEBOOKS,
  DEFAULT_ROUTINES,
  DEFAULT_SETTINGS,
} from "./constants.js";
import { showToast } from "./toast.js";

// Gevarenzone: dagdata wissen of de hele app terugzetten. De bevestiging
// zit in DangerSection.
export async function clearAllDays() {
  const count = await db.days.count();
  await db.days.clear();
  showToast(`✓ ${count} dagen gewist`);
}

export async function clearEverything() {
  await db.transaction(
    "rw",
    db.settings,
    db.blobs,
    db.days,
    db.calEvents,
    db.logEntries,
    db.hifd,
    db.hifdLogV2,
    db.meta,
    async () => {
      await db.settings.put({ id: "singleton", ...DEFAULT_SETTINGS });
      await db.blobs.put({ key: "areas", data: DEFAULT_AREAS });
      await db.blobs.put({ key: "routines", data: DEFAULT_ROUTINES });
      await db.blobs.put({
        key: "calTemplates",
        data: DEFAULT_CAL_TEMPLATES,
      });
      await db.blobs.put({ key: "weekTemplates", data: [] });
      await db.blobs.put({ key: "notebooks", data: DEFAULT_NOTEBOOKS });
      await db.days.clear();
      await db.calEvents.clear();
      await db.logEntries.clear();
      await db.hifd.clear();
      await db.hifdLogV2.clear();
      await db.meta.delete("hifd_seeded");
    },
  );
  await seedHifd();
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("rt_notified_")) keysToDelete.push(k);
  }
  keysToDelete.forEach((k) => localStorage.removeItem(k));
  showToast("✓ Alles gewist. App is gereset.");
}
