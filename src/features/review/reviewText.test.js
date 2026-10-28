import { describe, expect, test } from "vitest";
import { buildReview, DEFAULT_PROMPT, periodRange } from "./reviewText.js";

const now = new Date(2026, 9, 28, 12); // wo 28 okt
const data = {
  routines: {
    ochtend: [
      { id: "a", name: "Duah" },
      { id: "b", name: "Sport" },
    ],
  },
  days: {
    "2026-10-26": { checked: { a: true, b: true }, mood: "Goed", energy: 7 },
    "2026-10-27": { checked: { a: true } },
  },
  events: [
    {
      id: "e",
      title: "RTE",
      date: "2026-10-21",
      startTime: "13:00",
      endTime: "15:00",
      repeat: "weekly",
    },
  ],
  notes: [
    {
      title: "Gedachten",
      body: "Te laat opgestaan.",
      notebookId: "logboek",
      updatedAt: "2026-10-27T20:00:00Z",
    },
    {
      title: "Oud",
      body: "x",
      notebookId: "logboek",
      updatedAt: "2026-09-01T20:00:00Z",
    },
  ],
  notebookName: () => "Logboek",
  hifd: [
    { versesKnown: 7, status: "memorized" },
    { versesKnown: 3, status: "learning" },
  ],
  hifdLog: [
    { date: "2026-10-27", rating: "goed" },
    { date: "2026-10-01", rating: "zwak" },
  ],
};

describe("weekreview", () => {
  test("periodes lopen ma–zo of de laatste 30 dagen", () => {
    expect(periodRange("week", now)).toMatchObject({
      from: "2026-10-26",
      to: "2026-11-01",
    });
    expect(periodRange("vorige", now)).toMatchObject({
      from: "2026-10-19",
      to: "2026-10-25",
    });
    expect(periodRange("30", now)).toMatchObject({
      from: "2026-09-29",
      to: "2026-10-28",
    });
  });

  test("alleen aangevinkte onderdelen gaan mee", () => {
    const range = periodRange("week", now);
    const onlyRoutines = buildReview({
      prompt: DEFAULT_PROMPT,
      range,
      include: { routines: true },
      data,
    });
    expect(onlyRoutines).toContain(
      "- ma 26 okt: 2/2 (stemming Goed, energie 7)",
    );
    expect(onlyRoutines).toContain("Minst gedaan: Sport (1/7), Duah (2/7)");
    expect(onlyRoutines).not.toContain("## Notities");
    expect(onlyRoutines).not.toContain("Te laat opgestaan");

    const all = buildReview({
      prompt: "Kort graag.",
      range,
      include: { routines: true, planning: true, notes: true, hifd: true },
      data,
    });
    expect(all).toContain("- wo 28 okt 13:00–15:00 RTE");
    expect(all).toContain(
      "### Gedachten (Logboek, di 27 okt)\nTe laat opgestaan.",
    );
    expect(all).not.toContain("### Oud");
    expect(all).toContain(
      "Sessies in deze periode: 1 (goed 1, redelijk 0, zwak 0)",
    );
  });
});
