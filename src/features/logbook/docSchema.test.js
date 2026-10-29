import { describe, expect, test } from "vitest";
import { sanitizeDoc } from "./docSchema.js";

const known = new Set(["paragraph", "heading"]);
const text = (t) => [{ type: "text", text: t, styles: {} }];

describe("sanitizeDoc", () => {
  test("bekende blokken blijven, onbekende worden een alinea met hun tekst", () => {
    const doc = [
      {
        id: "a",
        type: "heading",
        props: { level: 2 },
        content: text("Kop"),
        children: [],
      },
      {
        id: "b",
        type: "toekomstblok",
        props: { kleur: "rood" },
        content: text("Belangrijk"),
        children: [{ type: "paragraph", content: text("kind") }],
      },
    ];
    expect(sanitizeDoc(doc, known)).toEqual([
      {
        id: "a",
        type: "heading",
        props: { level: 2 },
        content: text("Kop"),
        children: [],
      },
      {
        type: "paragraph",
        content: text("Belangrijk"),
        children: [{ type: "paragraph", content: text("kind"), children: [] }],
      },
    ]);
  });

  test("kapotte invoer valt weg in plaats van te crashen", () => {
    expect(sanitizeDoc(null, known)).toEqual([]);
    expect(sanitizeDoc([null, { foo: 1 }, "x"], known)).toEqual([]);
  });
});
