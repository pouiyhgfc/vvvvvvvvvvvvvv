import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db.js";
import {
  cleanTags,
  renameTag,
  setTagArea,
  tagKey,
  tagsByArea,
  tagStats,
} from "./tags.js";

const note = (id, tags, extra = {}) => ({
  id,
  notebookId: "logboek",
  date: "2026-10-27",
  title: id,
  body: "",
  tags,
  createdAt: "2026-10-27T08:00:00Z",
  updatedAt: "2026-10-27T08:00:00Z",
  ...extra,
});

describe("tags", () => {
  beforeEach(async () => {
    await db.logEntries.clear();
  });

  test("hoofdletters, spaties en # maken geen verschil", () => {
    expect(tagKey(" #Thoughts ")).toBe("thoughts");
    expect(tagKey("gezond   leven")).toBe("gezond leven");
  });

  test("tagStats telt per tag en kiest de meest gebruikte schrijfwijze", () => {
    const stats = tagStats([
      note("a", ["Thoughts", "islam"]),
      note("b", ["Thoughts"]),
      note("c", ["thoughts", "Islam"]),
    ]);
    expect(stats).toEqual([
      { key: "thoughts", count: 3, name: "Thoughts" },
      { key: "islam", count: 2, name: "islam" },
    ]);
  });

  test("cleanTags haalt dubbele weg en neemt de bestaande schrijfwijze", () => {
    const known = [{ key: "hifd", name: "hifd" }];
    expect(cleanTags(["HIFD", " studie", "#Studie", ""], known)).toEqual([
      "hifd",
      "studie",
    ]);
  });

  test("renameTag hernoemt, voegt samen en verwijdert in alle notities", async () => {
    await db.logEntries.bulkPut([
      note("a", ["Thoughts", "islam"]),
      note("b", ["thoughts", "gedachten"]),
      note("c", ["islam"], { deletedAt: "2026-10-01T00:00:00Z" }),
    ]);
    expect(await renameTag("thoughts", "gedachten")).toBe(2);
    expect((await db.logEntries.get("a")).tags).toEqual(["gedachten", "islam"]);
    expect((await db.logEntries.get("b")).tags).toEqual(["gedachten"]);

    expect(await renameTag("islam", "")).toBe(2);
    expect((await db.logEntries.get("a")).tags).toEqual(["gedachten"]);
    expect((await db.logEntries.get("c")).tags).toEqual([]);
  });
});

describe("tags koppelen aan een focusgebied", () => {
  const meta = async () => (await db.blobs.get("tagMeta"))?.data ?? {};
  beforeEach(async () => {
    await db.logEntries.clear();
    await db.blobs.delete("tagMeta");
  });

  test("koppelen, groeperen per gebied en ontkoppelen", async () => {
    await setTagArea("duah", "Ibadah");
    await setTagArea("islam", "Ibadah");
    await setTagArea("sport", "Lichaam");
    expect(tagsByArea(await meta())).toEqual({
      Ibadah: new Set(["duah", "islam"]),
      Lichaam: new Set(["sport"]),
    });
    await setTagArea("sport", null);
    expect(await meta()).not.toHaveProperty("sport");
  });

  test("hernoemen neemt de koppeling mee, verwijderen haalt hem weg", async () => {
    await db.logEntries.bulkPut([note("a", ["workout"]), note("b", ["duah"])]);
    await setTagArea("workout", "Lichaam");
    await setTagArea("duah", "Ibadah");

    await renameTag("workout", "Sport");
    expect(await meta()).toMatchObject({ sport: { area: "Lichaam" } });
    expect(await meta()).not.toHaveProperty("workout");

    await renameTag("duah", "");
    expect(await meta()).not.toHaveProperty("duah");
  });

  test("bij samenvoegen wint de koppeling van de bestaande tag", async () => {
    await db.logEntries.bulkPut([note("a", ["hifz"]), note("b", ["hifd"])]);
    await setTagArea("hifz", "Studie");
    await setTagArea("hifd", "Hifd & Quran");
    await renameTag("hifz", "hifd");
    expect(await meta()).toEqual({ hifd: { area: "Hifd & Quran" } });
  });
});
