import { expect, test } from "@playwright/test";
import { loadDemo, openTab, startApp } from "./helpers.js";

// Weekreview naar Claude: tekst samenstellen, kopiëren en het antwoord
// bewaren als notitie in Muhasaba.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("weekreview kopiëren en het antwoord bewaren", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Meer");
  await page.getByRole("button", { name: "Weekreview naar Claude" }).click();
  const sheet = page.getByRole("dialog", { name: "Weekreview" });

  // Standaard alleen routines; notities gaan pas mee als je dat aanzet.
  await expect(sheet.getByRole("button", { name: "Routines" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await sheet.getByRole("button", { name: "Kopiëren" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("# Weekreview");
  expect(copied).toContain("## Routines per dag");
  expect(copied).not.toContain("## Notities");

  await sheet.getByLabel("Antwoord van Claude").fill("Je sliep te weinig.");
  await sheet.getByRole("button", { name: "Bewaren in Muhasaba" }).click();
  await expect(page.getByText("Bewaard in Muhasaba")).toBeVisible();

  await openTab(page, "Notities");
  await page.getByRole("button").filter({ hasText: "Muhasaba" }).click();
  await expect(page.getByText(/^Weekreview /)).toBeVisible();
});

test("vraag Claude om een notitie samen te vatten", async ({ page }) => {
  await startApp(page);
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.getByPlaceholder("Titel…").fill("Plan");
  await page.click(".ProseMirror");
  await page.keyboard.type("Morgen vroeg op en RTE leren.");
  await page.getByRole("button", { name: "Notitie-opties" }).click();
  await page.getByRole("button", { name: "Vraag Claude" }).click();
  await page.getByRole("button", { name: "Samenvatten: kopiëren" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Vat deze notitie kort samen");
  expect(copied).toContain("Plan\n\nMorgen vroeg op en RTE leren.");
});
