import { describe, expect, it } from "vitest";
import { linkedNoteIds } from "./noteLinks.js";

const link = (id) => ({ type: "noteLink", props: { id, title: id } });

describe("linkedNoteIds", () => {
  it("vindt links in tekst, geneste blokken en tabellen, zonder dubbelen", () => {
    const doc = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "zie " }, link("a")],
      },
      {
        type: "bulletListItem",
        content: [],
        children: [{ type: "paragraph", content: [link("b"), link("a")] }],
      },
      {
        type: "table",
        content: {
          type: "tableContent",
          rows: [{ cells: [{ type: "tableCell", content: [link("c")] }] }],
        },
      },
    ];
    expect(linkedNoteIds(doc)).toEqual(["a", "b", "c"]);
  });

  it("verdraagt een leeg of ontbrekend document", () => {
    expect(linkedNoteIds(undefined)).toEqual([]);
    expect(linkedNoteIds("platte tekst")).toEqual([]);
  });
});
