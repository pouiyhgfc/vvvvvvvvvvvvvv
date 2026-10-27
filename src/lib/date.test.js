import { describe, expect, test } from "vitest";
import {
  addDays,
  applyWeekTemplate,
  dk,
  eventsOnDate,
  getMonday,
  periodForHour,
  minT,
  tMin,
} from "./date.js";

describe("datumhelpers", () => {
  test("dk geeft JJJJ-MM-DD in lokale tijd", () => {
    expect(dk(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("getMonday: zondag hoort bij de week die maandag ervoor begon", () => {
    expect(dk(getMonday(new Date(2026, 10, 1)))).toBe("2026-10-26"); // zo 1 nov
    expect(dk(getMonday(new Date(2026, 9, 26)))).toBe("2026-10-26"); // ma zelf
  });

  test("addDays gaat over maand- en jaargrenzen", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  test("tMin en minT rekenen om en blijven binnen één dag", () => {
    expect(tMin("07:45")).toBe(465);
    expect(minT(465)).toBe("07:45");
    expect(minT(-10)).toBe("00:00");
    expect(minT(2000)).toBe("23:59");
  });
});

describe("eventsOnDate", () => {
  const events = [
    { id: "a", date: "2026-10-27", title: "eenmalig" },
    { id: "b", date: "2026-10-20", repeat: "daily", title: "dagelijks" },
    { id: "c", date: "2026-10-13", repeat: "weekly", title: "di wekelijks" },
    {
      id: "d",
      date: "2026-10-01",
      repeat: "daily",
      exDates: ["2026-10-27"],
      title: "uitzondering",
    },
    { id: "e", date: "2026-11-01", repeat: "daily", title: "start later" },
  ];

  test("eenmalig, dagelijks, wekelijks, uitzonderingen en startdatum", () => {
    const ids = eventsOnDate(events, new Date(2026, 9, 27)).map((e) => e.id);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  test("herhalingen krijgen de gevraagde datum en een _recur-markering", () => {
    const [weekly] = eventsOnDate(events, new Date(2026, 10, 3)).filter(
      (e) => e.id === "c",
    );
    expect(weekly).toMatchObject({ date: "2026-11-03", _recur: true });
  });

  test("wekelijks valt niet op een andere weekdag", () => {
    const ids = eventsOnDate(events, new Date(2026, 9, 28)).map((e) => e.id);
    expect(ids).not.toContain("c");
  });
});

describe("applyWeekTemplate", () => {
  test("zet events op dayOffset vanaf de doelmaandag, met nieuwe id's", () => {
    const tpl = {
      events: [
        { id: "x", dayOffset: 0, title: "ma" },
        { id: "y", dayOffset: 6, title: "zo" },
      ],
    };
    const out = applyWeekTemplate(tpl, new Date(2026, 9, 26));
    expect(out.map((e) => e.date)).toEqual(["2026-10-26", "2026-11-01"]);
    expect(out.every((e) => e.id !== "x" && e.id !== "y")).toBe(true);
  });

  test("oude templates met `date` i.p.v. dayOffset landen op de juiste weekdag", () => {
    const tpl = { events: [{ id: "z", date: "2026-01-07", title: "wo" }] };
    const [ev] = applyWeekTemplate(tpl, new Date(2026, 9, 26));
    expect(ev.date).toBe("2026-10-28");
  });
});

describe("periodForHour", () => {
  test("kiest het dagdeel bij het uur", () => {
    expect(periodForHour(6)).toBe("ochtend");
    expect(periodForHour(11)).toBe("ochtend");
    expect(periodForHour(12)).toBe("middag");
    expect(periodForHour(17)).toBe("middag");
    expect(periodForHour(18)).toBe("avond");
    expect(periodForHour(0)).toBe("ochtend");
  });
});
