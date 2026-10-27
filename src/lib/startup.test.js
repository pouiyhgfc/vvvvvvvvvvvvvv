import { expect, test, vi } from "vitest";
import { runStartup } from "./startup.js";

test("een mislukte stap stopt de rest niet en wordt gemeld", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const ran = [];
  const failed = await runStartup([
    ["eerste", async () => ran.push(1)],
    [
      "kapot",
      async () => {
        throw new Error("boem");
      },
    ],
    ["derde", async () => ran.push(3)],
  ]);

  expect(ran).toEqual([1, 3]);
  expect(failed).toEqual(["kapot"]);
});
