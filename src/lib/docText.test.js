import { describe, expect, it } from "vitest";
import { docText, searchableText } from "./docText.js";

const t = (text, styles = {}) => ({ type: "text", text, styles });

describe("docText", () => {
  it("plakt opgemaakte stukjes aaneen zonder markdown-tekens", () => {
    const doc = [
      { type: "paragraph", content: [t("we"), t("reld", { bold: true })] },
    ];
    expect(docText(doc)).toBe("wereld");
  });

  it("neemt geneste blokken, tabellen, links en notitielinks mee", () => {
    const doc = [
      {
        type: "bulletListItem",
        content: [t("Boven")],
        children: [{ type: "paragraph", content: [t("Onder")] }],
      },
      {
        type: "table",
        content: {
          type: "tableContent",
          rows: [
            {
              cells: [
                { type: "tableCell", content: [t("Cel A")] },
                [t("Cel B")],
              ],
            },
          ],
        },
      },
      {
        type: "paragraph",
        content: [
          { type: "link", href: "https://x.nl", content: [t("linktekst")] },
          { type: "noteLink", props: { id: "n1", title: "Spoorgeometrie" } },
        ],
      },
      { type: "video", props: { url: "https://youtu.be/abc" } },
    ];
    const text = docText(doc);
    for (const part of [
      "Boven",
      "Onder",
      "Cel A",
      "Cel B",
      "linktekst",
      "Spoorgeometrie",
      "https://youtu.be/abc",
    ])
      expect(text).toContain(part);
  });

  it("verdraagt lege en kapotte documenten", () => {
    expect(docText(undefined)).toBe("");
    expect(docText([null, { type: "paragraph" }])).toBe("");
  });

  it("zoeken valt terug op body als er geen platte tekst is", () => {
    expect(searchableText({ body: "oud" })).toBe("oud");
    expect(searchableText({ body: "**x**", searchText: "x" })).toBe("x");
  });
});
