import { db } from "./db.js";

// "Samenvoegen" en deel-imports vullen alleen aan: wat je al hebt blijft
// zoals het is, ook als de backup een oudere versie ervan bevat.

const unionById = (local = [], incoming = []) => {
  const have = new Set(local.map((x) => x.id));
  return [...local, ...incoming.filter((x) => !have.has(x.id))];
};

function combine(key, local, incoming) {
  if (local === undefined) return incoming;
  if (key === "tagMeta") return { ...incoming, ...local };
  if (key === "routines") {
    const out = { ...local };
    for (const [part, list] of Object.entries(incoming))
      out[part] = unionById(local[part], list);
    return out;
  }
  return unionById(local, incoming);
}

export async function addMissingBlob(key, incoming) {
  const local = (await db.blobs.get(key))?.data;
  await db.blobs.put({ key, data: combine(key, local, incoming) });
}

const keyOf = (table) => {
  const path = table.schema.primKey.keyPath;
  return Array.isArray(path)
    ? (row) => path.map((k) => row[k])
    : (row) => row[path];
};

// Een Hifd-rij staat er altijd (114 surahs); alleen een onaangeroerde rij
// mag de voortgang uit de backup krijgen.
const isUntouchedHifd = (row) =>
  row.status === "todo" && !row.versesKnown && !row.lastReviewed;

export async function addMissingRows(table, rows) {
  if (!rows?.length) return;
  const existing = await table.bulkGet(rows.map(keyOf(table)));
  const replaceable = (row) =>
    !row || (table.name === "hifd" && isUntouchedHifd(row));
  const missing = rows.filter((_, i) => replaceable(existing[i]));
  if (missing.length) await table.bulkPut(missing);
}
