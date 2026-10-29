import { db } from "./db.js";
import { uid } from "./date.js";

// Afbeeldingen in notities, lokaal in Dexie (`files`). In de notitie staat
// "rtfile:<id>"; resolveFileUrl maakt daar bij het tonen een object-URL van.
const FILE_PREFIX = "rtfile:";
const MAX_SIDE = 1600;

// Verkleint naar max. 1600 px en slaat op als JPEG (foto's van een telefoon
// zijn anders 3–8 MB per stuk; zo ±200–500 KB).
export async function saveImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  const id = uid();
  await db.files.put({ id, blob, createdAt: new Date().toISOString() });
  return FILE_PREFIX + id;
}

const urls = new Map();
export async function resolveFileUrl(url) {
  if (!url?.startsWith(FILE_PREFIX)) return url;
  const id = url.slice(FILE_PREFIX.length);
  if (!urls.has(id)) {
    const rec = await db.files.get(id);
    if (!rec) return "";
    urls.set(id, URL.createObjectURL(rec.blob));
  }
  return urls.get(id);
}

// Alle bestand-id's waarnaar een BlockNote-document verwijst.
export function fileIdsInDoc(blocks = []) {
  const ids = [];
  const walk = (list) => {
    for (const b of Array.isArray(list) ? list : []) {
      const url = b?.props?.url;
      if (typeof url === "string" && url.startsWith(FILE_PREFIX))
        ids.push(url.slice(FILE_PREFIX.length));
      walk(b?.children);
    }
  };
  walk(blocks);
  return ids;
}

// Na definitief verwijderen: bestanden waar geen notitie of sjabloon meer
// naar verwijst, gaan ook weg.
export async function deleteUnusedFiles(ids) {
  if (!ids.length) return;
  const entries = await db.logEntries.toArray();
  const templates = (await db.blobs.get("entryTemplates"))?.data ?? [];
  const used = new Set(
    [...entries, ...templates].flatMap((e) => fileIdsInDoc(e.doc)),
  );
  await db.files.bulkDelete(ids.filter((id) => !used.has(id)));
}

// Backup: bestanden als base64 (data-URL), zodat alles in één JSON past.
export async function filesForBackup() {
  const files = await db.files.toArray();
  return Promise.all(
    files.map(
      ({ id, blob }) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ id, data: reader.result });
          reader.readAsDataURL(blob);
        }),
    ),
  );
}

// Terug van base64 naar Blob, vóór de import-transactie (fetch mag niet
// binnen een Dexie-transactie).
export function filesFromBackup(list = []) {
  return Promise.all(
    list.map(async ({ id, data }) => ({
      id,
      blob: await (await fetch(data)).blob(),
      createdAt: new Date().toISOString(),
    })),
  );
}
