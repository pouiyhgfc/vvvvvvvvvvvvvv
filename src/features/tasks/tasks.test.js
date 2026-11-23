import { describe, expect, it } from "vitest";
import {
  cardList,
  daysLeft,
  doneList,
  isOverdue,
  longList,
  normalizeTask,
  onDate,
  progress,
  shortList,
  stepsOf,
  taskEnd,
  taskEvents,
} from "./tasks.js";

const today = "2026-11-24";
const t = (id, fields = {}) => ({
  id,
  title: id,
  horizon: "kort",
  parentId: null,
  date: null,
  time: null,
  deadline: null,
  order: 0,
  doneAt: null,
  ...fields,
});

describe("normalizeTask", () => {
  it("trimt de titel en wist tijd zonder datum", () => {
    expect(normalizeTask({ title: " x ", time: "10:00" })).toMatchObject({
      title: "x",
      time: null,
      durationMin: null,
    });
  });
  it("geeft een taak met tijd standaard 30 minuten", () => {
    expect(
      normalizeTask({ title: "x", date: today, time: "10:00" }).durationMin,
    ).toBe(30);
  });
});

describe("isOverdue", () => {
  it("gisteren gepland of deadline voorbij = te laat, tenzij gedaan", () => {
    expect(isOverdue(t("a", { date: "2026-11-23" }), today)).toBe(true);
    expect(isOverdue(t("a", { deadline: "2026-11-20" }), today)).toBe(true);
    expect(isOverdue(t("a", { date: today }), today)).toBe(false);
    expect(isOverdue(t("a", { date: "2026-11-23", doneAt: "x" }), today)).toBe(
      false,
    );
  });
});

describe("progress", () => {
  it("percentage gedane stappen, null zonder stappen", () => {
    const steps = [1, 2, 3, 4, 5].map((i) =>
      t(`s${i}`, { doneAt: i <= 2 ? "x" : null }),
    );
    expect(progress(steps)).toBe(40);
    expect(progress([t("s")])).toBe(0);
    expect(progress([])).toBeNull();
  });
});

describe("lijsten", () => {
  const tasks = [
    t("zonder", { order: 2 }),
    t("later", { date: "2026-11-30" }),
    t("telaat", { date: "2026-11-20" }),
    t("vroeg", { order: 1 }),
    t("klaar", { doneAt: "2026-11-24T10:00", order: 3 }),
    t("stap", { parentId: "zonder" }),
    t("doel", { horizon: "lang" }),
    t("deadline", { horizon: "lang", deadline: "2027-01-15" }),
    t("eerder", { horizon: "lang", deadline: "2026-12-01" }),
  ];
  it("korte termijn: te laat, dan op datum, dan op eigen volgorde", () => {
    expect(shortList(tasks, today).map((x) => x.id)).toEqual([
      "telaat",
      "later",
      "vroeg",
      "zonder",
    ]);
  });
  it("lange termijn: op deadline, dan zonder deadline", () => {
    expect(longList(tasks).map((x) => x.id)).toEqual([
      "eerder",
      "deadline",
      "doel",
    ]);
  });
  it("gedaan: alleen hoofdtaken zonder datum, nieuwste eerst", () => {
    const done = [
      ...tasks,
      t("ouder", { doneAt: "2026-11-01T10:00" }),
      t("metdatum", { date: today, doneAt: "2026-11-24T12:00" }),
    ];
    expect(doneList(done).map((x) => x.id)).toEqual(["klaar", "ouder"]);
  });
  it("stappen van een taak, op volgorde", () => {
    const list = [
      t("b", { parentId: "p", order: 2 }),
      t("a", { parentId: "p", order: 1 }),
      t("x", { parentId: "q" }),
    ];
    expect(stepsOf(list, "p").map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("onDate", () => {
  it("splitst op tijd, toont gedane taken en open deadlines", () => {
    const tasks = [
      t("met", { date: today, time: "14:00", doneAt: "x" }),
      t("zonder", { date: today }),
      t("stap", { date: today, parentId: "p" }),
      t("dl", { deadline: today }),
      t("dlklaar", { deadline: today, doneAt: "x" }),
      t("andere", { date: "2026-11-25" }),
    ];
    const r = onDate(tasks, today);
    expect(r.timed.map((x) => x.id)).toEqual(["met"]);
    expect(r.untimed.map((x) => x.id)).toEqual(["zonder", "stap"]);
    expect(r.deadlines.map((x) => x.id)).toEqual(["dl"]);
  });
});

describe("cardList", () => {
  const tasks = [
    t("vandaag", { date: today }),
    t("telaat", { date: "2026-11-22" }),
    t("klaar", { date: today, doneAt: "x" }),
    t("dl2", { deadline: "2026-11-26" }),
    t("dl9", { deadline: "2026-12-03" }),
    t("morgen", { date: "2026-11-25" }),
  ];
  it("vandaag: taken van vandaag, te laat en deadlines binnen 3 dagen", () => {
    const r = cardList(tasks, today, today);
    expect(r.items.map((x) => x.id)).toEqual(["telaat", "vandaag"]);
    expect(r.deadlines.map((x) => x.id)).toEqual(["dl2"]);
  });
  it("andere dag: alleen de taken van die dag", () => {
    const r = cardList(tasks, "2026-11-25", today);
    expect(r.items.map((x) => x.id)).toEqual(["morgen"]);
    expect(r.deadlines).toEqual([]);
  });
});

it("daysLeft telt kalenderdagen", () => {
  expect(daysLeft("2026-11-26", today)).toBe(2);
  expect(daysLeft(today, today)).toBe(0);
});

it("taskEnd telt de duur op bij de begintijd", () => {
  expect(taskEnd({ time: "10:00", durationMin: 45 })).toBe("10:45");
  expect(taskEnd({ time: "23:45", durationMin: 30 })).toBe("23:59");
});

describe("taskEvents (herinneringen)", () => {
  it("taak met tijd wordt een event, gedane taak niet", () => {
    const ev = taskEvents([
      t("a", { date: today, time: "10:00", durationMin: 45 }),
      t("b", { date: today, time: "11:00", doneAt: "x" }),
    ]);
    expect(ev).toEqual([
      expect.objectContaining({
        id: "task-a",
        date: today,
        startTime: "10:00",
        endTime: "10:45",
        title: "a",
      }),
    ]);
  });
  it("deadline met herinnering: om 09:00, zoveel dagen vooraf", () => {
    const [ev] = taskEvents([
      t("v", { title: "Verslag", deadline: "2026-12-10", remindDays: 3 }),
    ]);
    expect(ev).toMatchObject({
      id: "deadline-v",
      date: "2026-12-07",
      startTime: "09:00",
      title: "Deadline: Verslag",
    });
    expect(taskEvents([t("x", { deadline: "2026-12-10" })])).toEqual([]);
  });
});
