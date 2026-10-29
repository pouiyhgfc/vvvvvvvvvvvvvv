import { describe, expect, it } from "vitest";
import { fileIdsInDoc } from "./files.js";

describe("fileIdsInDoc", () => {
  it("vindt lokale afbeeldingen, ook in geneste blokken", () => {
    const doc = [
      { type: "image", props: { url: "rtfile:a" }, children: [] },
      {
        type: "paragraph",
        props: {},
        children: [{ type: "image", props: { url: "rtfile:b" }, children: [] }],
      },
      { type: "image", props: { url: "https://voorbeeld.nl/x.png" } },
    ];
    expect(fileIdsInDoc(doc)).toEqual(["a", "b"]);
  });

  it("verdraagt een ontbrekend of kapot document", () => {
    expect(fileIdsInDoc(undefined)).toEqual([]);
    expect(fileIdsInDoc([null, { props: null }])).toEqual([]);
  });
});
