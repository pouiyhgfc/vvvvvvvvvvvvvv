import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { demoBackup } from "./fixtures/demo.js";
import { RICH_DOC_INPUT } from "./fixtures/rich-doc.js";
import { exportBackup, importBackup, openTab } from "./helpers.js";

// Vangnet voor BlockNote-upgrades. `rich-doc-saved.json` is een document met
// alle bloktypen zoals de vorige BlockNote-versie het opsloeg. Deze test laadt
// het in de huidige versie, bewerkt het (zodat het opnieuw wordt opgeslagen)
// en eist dat het exact zo terugkomt: dan blijven al je bestaande notities
// werken na een upgrade.
// Nieuwe baseline (alleen bewust, ná controle): RICH_DOC_BASELINE=1.

const SAVED = new URL("./fixtures/rich-doc-saved.json", import.meta.url);
const regenerate = !!process.env.RICH_DOC_BASELINE;

const withoutIds = (value) =>
  JSON.parse(JSON.stringify(value, (k, v) => (k === "id" ? undefined : v)));

test("een opgeslagen document met alle bloktypen overleeft laden en opnieuw opslaan", async ({
  page,
}) => {
  const input = regenerate
    ? RICH_DOC_INPUT
    : JSON.parse(readFileSync(SAVED, "utf8"));
  const backup = demoBackup();
  backup.logEntries = [
    {
      ...backup.logEntries[0],
      id: "rich",
      title: "Alle blokken",
      doc: input,
      body: "",
    },
  ];
  await importBackup(page, backup);

  await openTab(page, "Notities");
  await page.getByText("Alle blokken", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  for (const text of ["Kop 1", "Subpunt", "Kolom A", "const x = 1;", "Gedaan"])
    await expect(page.locator(".ProseMirror").getByText(text)).toBeVisible();

  // Een bewerking die per saldo niets verandert, zodat de editor opslaat.
  await page.locator(".ProseMirror").getByText("Gecentreerd en geel").click();
  await page.keyboard.press("End");
  await page.keyboard.type("x");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(800);
  await page.click('button[aria-label^="Terug"]');
  await page.waitForTimeout(700);

  const saved = (await exportBackup(page)).logEntries.find(
    (e) => e.id === "rich",
  );
  for (const text of ["Kop 1", "Subpunt", "Kolom A", "const x = 1;"])
    expect(saved.body).toContain(text);

  if (regenerate) {
    writeFileSync(SAVED, JSON.stringify(withoutIds(saved.doc), null, 2) + "\n");
    return;
  }
  expect(withoutIds(saved.doc)).toEqual(input);
});
