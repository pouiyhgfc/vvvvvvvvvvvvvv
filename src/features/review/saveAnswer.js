import { db } from "../../lib/db.js";
import { DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { dk, uid } from "../../lib/date.js";

const MUHASABA = {
  id: "muhasaba",
  name: "Muhasaba",
  icon: "🤲",
  color: "#0e7a52",
};

// Bewaart het antwoord van Claude als notitie in het notitieboek Muhasaba
// (dat wordt aangemaakt als het er nog niet is). Alleen `body`: de editor
// maakt er bij openen zelf blokken van, net als bij oude platte notities.
export async function saveAnswer(text, label) {
  const notebooks =
    (await db.blobs.get("notebooks"))?.data ?? DEFAULT_NOTEBOOKS;
  if (!notebooks.some((n) => n.id === MUHASABA.id))
    await db.blobs.put({ key: "notebooks", data: [...notebooks, MUHASABA] });
  const now = new Date().toISOString();
  await db.logEntries.put({
    id: uid(),
    notebookId: MUHASABA.id,
    date: dk(new Date()),
    title: `Weekreview ${label}`,
    body: text.trim(),
    tags: [],
    createdAt: now,
    updatedAt: now,
  });
}
