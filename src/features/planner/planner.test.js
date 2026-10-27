import { describe, expect, test } from "vitest";
import { eventsOnDate } from "../../lib/date.js";
import {
  deleteOccurrence,
  durationMin,
  layoutOverlaps,
  movedTimes,
  resizedEnd,
  updateOccurrence,
} from "./planner.js";

const weekly = {
  id: "w",
  date: "2026-09-08", // dinsdag
  title: "Railroad",
  startTime: "09:10",
  endTime: "12:10",
  repeat: "weekly",
  exDates: [],
  color: "#0e7a52",
};
const once = {
  id: "o",
  date: "2026-10-27",
  title: "Lunch",
  startTime: "12:30",
  endTime: "13:15",
  repeat: "none",
};
const day = (k) => new Date(k + "T12:00");
const occOn = (events, key, id) =>
  eventsOnDate(events, day(key)).find((e) => e.id === id);

describe("planning", () => {
  test("duur, ook over middernacht", () => {
    expect(durationMin("09:10", "12:10")).toBe(180);
    expect(durationMin("23:30", "00:30")).toBe(60);
  });

  test("overlappende blokken krijgen naast elkaar een kolom", () => {
    const m = layoutOverlaps([
      { id: "a", startTime: "09:00", endTime: "10:00" },
      { id: "b", startTime: "09:30", endTime: "10:30" },
      { id: "c", startTime: "11:00", endTime: "12:00" },
    ]);
    expect(m.get("a")).toEqual({ col: 0, totalCols: 2 });
    expect(m.get("b")).toEqual({ col: 1, totalCols: 2 });
    expect(m.get("c")).toEqual({ col: 0, totalCols: 1 });
  });

  test("een reeks bewerken vanuit een latere week laat eerdere weken staan", () => {
    const occ = occOn([weekly], "2026-10-27", "w");
    const next = updateOccurrence([weekly], occ, { title: "RTE" }, "all");
    expect(next[0].date).toBe("2026-09-08");
    expect(next[0].title).toBe("RTE");
    expect(occOn(next, "2026-09-15", "w")?.title).toBe("RTE");
    expect(next[0]._recur).toBeUndefined();
  });

  test("een reeks naar een andere dag verschuift de startdatum evenveel", () => {
    const occ = occOn([weekly], "2026-10-27", "w");
    const next = updateOccurrence([weekly], occ, { date: "2026-10-28" }, "all");
    expect(next[0].date).toBe("2026-09-09"); // woensdag, vanaf dezelfde week
    expect(occOn(next, "2026-10-28", "w")).toBeTruthy();
    expect(occOn(next, "2026-10-27", "w")).toBeUndefined();
  });

  test("alleen deze: uitzondering in de reeks plus een losse kopie", () => {
    const occ = occOn([weekly], "2026-10-27", "w");
    const next = updateOccurrence(
      [weekly],
      occ,
      { startTime: "10:00", endTime: "11:00" },
      "one",
    );
    expect(next).toHaveLength(2);
    expect(next[0].exDates).toEqual(["2026-10-27"]);
    const onDay = eventsOnDate(next, day("2026-10-27"));
    expect(onDay).toHaveLength(1);
    expect(onDay[0]).toMatchObject({
      startTime: "10:00",
      repeat: "none",
      title: "Railroad",
    });
    expect(occOn(next, "2026-11-03", "w")?.startTime).toBe("09:10");
  });

  test("een eenmalig blok wordt gewoon bijgewerkt", () => {
    const next = updateOccurrence([once], once, { title: "Eten" });
    expect(next).toEqual([{ ...once, title: "Eten" }]);
  });

  test("verwijderen: alleen deze dag of alles", () => {
    const occ = occOn([weekly], "2026-10-27", "w");
    expect(deleteOccurrence([weekly], occ, "one")[0].exDates).toEqual([
      "2026-10-27",
    ]);
    expect(deleteOccurrence([weekly, once], occ, "all")).toEqual([once]);
  });

  test("verslepen in stappen van 15 minuten, binnen de dag", () => {
    expect(movedTimes(once, 20)).toEqual({
      startTime: "12:45",
      endTime: "13:30",
    });
    expect(movedTimes(once, -900, 180)).toEqual({
      startTime: "03:00",
      endTime: "03:45",
    });
    expect(movedTimes(once, 900)).toEqual({
      startTime: "23:15",
      endTime: "23:59",
    });
  });

  test("langer of korter maken, minimaal 15 minuten", () => {
    expect(resizedEnd(once, 30)).toBe("13:45");
    expect(resizedEnd(once, -120)).toBe("12:45");
  });
});
