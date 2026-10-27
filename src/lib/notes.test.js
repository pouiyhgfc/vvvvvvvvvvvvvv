import { describe, expect, test } from "vitest";
import { bodyPreview } from "./notes.js";

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
