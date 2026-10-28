import { describe, expect, test } from "vitest";
import { bodyPreview, headingsOf } from "./notes.js";

describe("bodyPreview", () => {
  test("slaat kopjes over en haalt opmaaktekens weg", () => {
    expect(bodyPreview("## Vandaag:\n\nVroeg op.\n\n* punt")).toBe("Vroeg op.");
    expect(bodyPreview("* [x] Week plannen")).toBe("Week plannen");
    expect(bodyPreview("1. Eerste")).toBe("Eerste");
  });

  test("valt terug op het kopje als er verder niets is", () => {
    expect(bodyPreview("# Alleen een kop")).toBe("Alleen een kop");
  });

  test("leeg blijft leeg", () => {
    expect(bodyPreview("")).toBe("");
    expect(bodyPreview(undefined)).toBe("");
  });
});

describe("headingsOf", () => {
  const h = (id, level, text, children = []) => ({
    id,
    type: "heading",
    props: { level },
    content: [{ type: "text", text, styles: {} }],
    children,
  });

  test("vindt koppen in volgorde, ook genest en met links", () => {
    const doc = [
      h("a", 1, "Inleiding"),
      { id: "p", type: "paragraph", content: [], children: [h("b", 2, "Sub")] },
      {
        id: "c",
        type: "heading",
        props: { level: 3 },
        content: [
          { type: "text", text: "Zie ", styles: {} },
          { type: "link", href: "x", content: [{ type: "text", text: "dit" }] },
        ],
        children: [],
      },
      h("leeg", 2, "  "),
    ];
    expect(headingsOf(doc)).toEqual([
      { id: "a", level: 1, text: "Inleiding" },
      { id: "b", level: 2, text: "Sub" },
      { id: "c", level: 3, text: "Zie dit" },
    ]);
  });

  test("oude platte-tekst-notities (geen doc) geven niets", () => {
    expect(headingsOf(null)).toEqual([]);
    expect(headingsOf("tekst")).toEqual([]);
  });
});
