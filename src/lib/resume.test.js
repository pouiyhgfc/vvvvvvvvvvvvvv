import { beforeEach, expect, test, vi } from "vitest";
import { forgetResume, loadResume, rememberResume } from "./resume.js";

const store = new Map();
vi.stubGlobal("localStorage", {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
});

beforeEach(() => {
  store.clear();
  vi.useRealTimers();
});

test("onthoudt waar je was", () => {
  rememberResume({ view: "logboek" });
  rememberResume({ note: "n1" });
  expect(loadResume()).toMatchObject({ view: "logboek", note: "n1" });
});

test("na een uur begin je gewoon op Vandaag", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 26, 18, 0));
  rememberResume({ view: "logboek" });
  vi.setSystemTime(new Date(2026, 10, 26, 19, 1));
  expect(loadResume()).toEqual({});
});

test("vergeten wist alles", () => {
  rememberResume({ view: "hifd" });
  forgetResume();
  expect(loadResume()).toEqual({});
});
