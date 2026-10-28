import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db.js";
import { cleanTags, renameTag, tagKey, tagStats } from "./tags.js";

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
