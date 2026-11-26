import { expect, test } from "vitest";
import { notesAsMarkdown } from "./noteHelpers.js";

test("meerdere notities worden één tekst, met titel en datum", () => {
  const md = notesAsMarkdown([
    { title: "Dinsdag", date: "2026-10-27", body: "Vroeg op." },
    { title: "", date: "2026-10-25", body: "Wandeling." },
  ]);
  expect(md).toBe(
    "# Dinsdag\n_Dinsdag 27 oktober 2026_\n\nVroeg op.\n\n---\n\n" +
      "# Zondag 25 oktober 2026\n\nWandeling.\n",
  );
});
