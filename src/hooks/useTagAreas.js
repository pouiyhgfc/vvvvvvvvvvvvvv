import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db.js";
import { DEFAULT_AREAS } from "../lib/constants.js";
import { tagKey, tagsByArea } from "../lib/tags.js";

// Koppeling tag → focusgebied (blob `tagMeta`) met de gebieden erbij.
// `areaOf(tag)` geeft het gebied ({ name, color }) of null.
export function useTagAreas() {
  const data = useLiveQuery(async () => ({
    meta: (await db.blobs.get("tagMeta"))?.data ?? {},
    areas: (await db.blobs.get("areas"))?.data ?? DEFAULT_AREAS,
  }));
  const meta = data?.meta;
  const areas = data?.areas ?? [];
  const byArea = useMemo(() => tagsByArea(meta), [meta]);
  const areaOf = (tag) => {
    const name = meta?.[tagKey(tag)]?.area;
    return name ? (areas.find((a) => a.name === name) ?? null) : null;
  };
  return { areas, areaOf, byArea };
}
