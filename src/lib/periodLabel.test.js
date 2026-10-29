import { describe, expect, test } from "vitest";
import { periodLabel } from "./periodLabel.js";

describe("periodLabel", () => {
  const d = new Date(2026, 9, 28, 12);
  test("week over twee maanden, maand en jaar", () => {
    expect(periodLabel("week", "week", d).main).toBe("26 oktober – 1 november");
    expect(periodLabel("stats", "month", d).main).toBe("Oktober 2026");
    expect(periodLabel("stats", "year", d).main).toBe("2026");
  });
});
