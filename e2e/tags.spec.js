import { expect, test } from "@playwright/test";
import { exportBackup, loadDemo, openTab } from "./helpers.js";

// Tagbeheer onder Meer. Demo: "Dinsdag" heeft #hifd en #studie, "Zondag"
// #wandelen.

test("een tag hernoemen naar een bestaande voegt ze samen", async ({
  page,
}) => {
  await loadDemo(page);
  await openTab(page, "Meer");
  await page.getByRole("button", { name: "Tags" }).click();
  await page.getByRole("button", { name: /#studie/ }).click();
  await page.getByRole("textbox", { name: "Nieuwe naam" }).fill("HIFD");
  await expect(page.getByText(/#hifd bestaat al/)).toBeVisible();
  await page.getByRole("button", { name: "Samenvoegen" }).click();
  await expect(page.getByText(/Samengevoegd met #hifd/)).toBeVisible();

  const backup = await exportBackup(page);
  const dinsdag = backup.logEntries.find((e) => e.title === "Dinsdag");
  expect(dinsdag.tags).toEqual(["hifd"]);
});

test("een tag verwijderen haalt hem uit de notities, niet de notities zelf", async ({
  page,
}) => {
  await loadDemo(page);
  await openTab(page, "Meer");
  await page.getByRole("button", { name: "Tags" }).click();
  await page.getByRole("button", { name: /#wandelen/ }).click();
  await page.getByRole("button", { name: "Tag verwijderen" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Verwijderen" })
    .click();
  // Pas exporteren als het weghalen klaar is (anders soms een race).
  await expect(page.getByText(/Tag weggehaald uit/)).toBeVisible();

  const backup = await exportBackup(page);
  const zondag = backup.logEntries.find((e) => e.title === "Zondag");
  expect(zondag.tags).toEqual([]);
  expect(backup.logEntries).toHaveLength(3);
});
