import { describe, expect, test } from "vitest";
import { INITIAL_EASE, nextSrs } from "./hifd.js";

const card = (over = {}) => ({
  easeFactor: INITIAL_EASE,
  interval: 0,
  reps: 0,
  lapses: 0,
  ...over,
});

describe("nextSrs", () => {
  test("een lege kaart start op 1 dag, daarna 3 dagen", () => {
    const first = nextSrs({}, "goed");
    expect(first).toEqual({ easeFactor: 2.5, interval: 1, reps: 1, lapses: 0 });
    expect(nextSrs(first, "goed").interval).toBe(3);
  });

  test("vanaf de derde herhaling groeit het interval met de ease", () => {
    const c = card({ interval: 3, reps: 2 });
    expect(nextSrs(c, "goed")).toMatchObject({ interval: 8, easeFactor: 2.5 });
    expect(nextSrs(c, "sterk")).toMatchObject({
      interval: 10,
      easeFactor: 2.6,
    });
    expect(nextSrs(c, "redelijk")).toMatchObject({ interval: 4 });
    expect(nextSrs(c, "redelijk").easeFactor).toBeCloseTo(2.35);
  });

  test("zwak zet terug naar 1 dag, verlaagt de ease en telt een lapse", () => {
    const c = card({ interval: 20, reps: 6, lapses: 1 });
    expect(nextSrs(c, "zwak")).toEqual({
      easeFactor: 2.3,
      interval: 1,
      reps: 0,
      lapses: 2,
    });
  });

  test("ease zakt nooit onder 1,3", () => {
    expect(nextSrs(card({ easeFactor: 1.4 }), "zwak").easeFactor).toBe(1.3);
    expect(
      nextSrs(card({ easeFactor: 1.35, interval: 3, reps: 2 }), "redelijk")
        .easeFactor,
    ).toBe(1.3);
  });

  test("interval wordt afgekapt op 30 dagen", () => {
    expect(nextSrs(card({ interval: 25, reps: 5 }), "sterk").interval).toBe(30);
  });

  test("past de invoer niet aan", () => {
    const c = card({ interval: 3, reps: 2 });
    const copy = { ...c };
    nextSrs(c, "sterk");
    expect(c).toEqual(copy);
  });
});
