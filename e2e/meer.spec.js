import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// De beheer-secties onder Meer: elke sectie opent zijn eigen sheet.
const section = (page, title) =>
  page.locator("section").filter({
    has: page.locator("button[aria-expanded]", { hasText: title }),
  });

test.beforeEach(async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Meer");
});

test("een routine hernoemen onder Meer", async ({ page }) => {
  const routines = section(page, "Routines");
  await routines.locator("button[aria-expanded]").first().click();
  await routines.getByText("Bewegen", { exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Routine bewerken" });
  await sheet.getByRole("textbox").first().fill("Wandelen");
  await sheet.getByRole("button", { name: /Opslaan/ }).click();
  await expect(sheet).toBeHidden();
  await openTab(page, "Vandaag");
  await expect(page.getByText("Wandelen", { exact: true })).toBeVisible();
});

test("een focusgebied toevoegen", async ({ page }) => {
  const areas = section(page, "Focusgebieden");
  await areas.locator("button[aria-expanded]").click();
  await areas.getByRole("button", { name: /Gebied/ }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox").first().fill("Muziek");
  await sheet.getByRole("button", { name: /Opslaan|Toevoegen/ }).click();
  await expect(areas.getByText("Muziek", { exact: true })).toBeVisible();
});

test("de huidige week opslaan als weekschema", async ({ page }) => {
  const weeks = section(page, "Weekschema's");
  await weeks.getByRole("button", { name: /opslaan/i }).click();
  const sheet = page.getByRole("dialog", { name: "Weekschema opslaan" });
  await sheet.getByRole("textbox").fill("Studieweek");
  await sheet.getByRole("button", { name: /Opslaan/ }).click();
  await expect(page.getByText("✓ Weekschema opgeslagen")).toBeVisible();
  await weeks.locator("button[aria-expanded]").click();
  await expect(weeks.getByText("Studieweek", { exact: true })).toBeVisible();
});

test("gevarenzone vraagt altijd eerst om bevestiging", async ({ page }) => {
  const danger = section(page, "Gevarenzone");
  await danger.locator("button[aria-expanded]").click();
  await danger.getByRole("button", { name: /Wis alle dagdata/ }).click();
  await expect(page.getByText("Alle dagdata wissen?")).toBeVisible();
  await page.getByRole("button", { name: "Annuleer" }).click();
  await expect(page.getByText("Alle dagdata wissen?")).toBeHidden();
});
