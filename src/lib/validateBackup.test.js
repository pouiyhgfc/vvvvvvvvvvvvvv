import { describe, expect, test } from "vitest";
import { demoBackup } from "../../e2e/fixtures/demo.js";
import { validateBackup } from "./validateBackup.js";

describe("validateBackup", () => {
  test("een volledige actuele backup is in orde", () => {
    expect(validateBackup(demoBackup())).toEqual([]);
  });

  test("oude backups en deel-exports met ontbrekende velden zijn in orde", () => {
    expect(validateBackup({ version: 1, routines: {}, days: {} })).toEqual([]);
    expect(validateBackup({ version: 1, areas: ["Deen", "Studie"] })).toEqual(
      [],
    );
    expect(
      validateBackup({ version: 1, type: "notities", logEntries: [] }),
    ).toEqual([]);
  });

  test("geen object → afgekeurd", () => {
    expect(validateBackup(null)).toHaveLength(1);
    expect(validateBackup([])).toHaveLength(1);
    expect(validateBackup("tekst")).toHaveLength(1);
  });

  test("een backup van een nieuwere app-versie wordt geweigerd", () => {
    expect(validateBackup({ version: 99, routines: {} })[0]).toMatch(
      /nieuwere versie/,
    );
  });

  test("kapotte onderdelen worden per onderdeel benoemd", () => {
    const problems = validateBackup({
      routines: { ochtend: "fout" },
      days: { gisteren: {} },
      logEntries: [{ id: "ok" }, { title: "geen id" }],
      hifd: [{ surah: 0 }],
      calEvents: {},
    });
    expect(problems).toEqual([
      "Routines hebben een onbekend formaat.",
      "Dagdata heeft een onbekend formaat.",
      '"calEvents" is geen lijst.',
      '1 ongeldige item(s) in "logEntries".',
      '1 ongeldige item(s) in "hifd".',
    ]);
  });
});
