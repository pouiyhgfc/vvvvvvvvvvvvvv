import { describe, expect, test } from "vitest";
import { upcomingReminders } from "./reminders.js";

const now = new Date(2026, 9, 28, 10, 0); // wo 28 okt, 10:00

describe("upcomingReminders", () => {
  test("plant alleen wat nog komt, met de minuten vooraf", () => {
    const events = [
      {
        id: "a",
        title: "Les",
        date: "2026-10-28",
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        id: "b",
        title: "Sport",
        date: "2026-10-28",
        startTime: "18:00",
        endTime: "19:00",
      },
    ];
    const r = upcomingReminders(events, 15, now);
    expect(r).toHaveLength(1);
    expect(r[0].at).toEqual(new Date(2026, 9, 28, 17, 45));
    expect(r[0].body).toBe("18:00–19:00");
  });

  test("een wekelijks blok krijgt per week een eigen, vaste id", () => {
    const events = [
      {
        id: "w",
        title: "RTE",
        date: "2026-10-21",
        startTime: "13:00",
        endTime: "15:00",
        repeat: "weekly",
      },
    ];
    const r = upcomingReminders(events, 0, now);
    expect(r.map((x) => x.at.getDate())).toEqual([28, 4]);
    expect(new Set(r.map((x) => x.id)).size).toBe(2);
    expect(upcomingReminders(events, 0, now)[0].id).toBe(r[0].id);
  });
});
