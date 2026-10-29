import { expect, test } from "@playwright/test";
import { exportBackup, loadDemo, openTab } from "./helpers.js";

// De nieuwe planning: dag-tijdlijn, week als lijst, één sheet, en bij een
// herhalend blok altijd de keuze "alleen deze dag" of "alle keren".
// Demo: Railroad Engineering staat elke week op dinsdag 09:10–12:10.

const block = (page, title) => page.locator(`[data-event="${title}"]`);

test.beforeEach(async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Planning");
});

test("de dag toont de blokken en de week staat als lijst per dag", async ({
  page,
}) => {
  await expect(block(page, "Railroad Engineering")).toBeVisible();
  await expect(block(page, "Lunch")).toBeVisible();

  await page.getByRole("tab", { name: "Week" }).click();
  await expect(page.getByText("Psychologie")).toBeVisible();
  await expect(page.getByText("Niets gepland").first()).toBeVisible();

  // Een dag in de weeklijst openen brengt je naar die dag.
  await page.getByRole("button", { name: "Open wo 28" }).click();
  await expect(page.getByRole("tab", { name: "Dag" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(block(page, "Psychologie")).toBeVisible();
});

test("alleen deze dag wijzigen laat de andere weken staan", async ({
  page,
}) => {
  await block(page, "Railroad Engineering").click();
  await page.getByPlaceholder("Bv. Studeren RTE").fill("Tentamen RTE");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await page.getByRole("button", { name: "Alleen deze dag" }).click();
  await expect(block(page, "Tentamen RTE")).toBeVisible();

  await page.getByRole("button", { name: "Volgende week" }).click();
  await page.getByRole("button", { name: "di 3" }).click();
  await expect(block(page, "Railroad Engineering")).toBeVisible();

  const backup = await exportBackup(page);
  const series = backup.calEvents.find((e) => e.id === "ev1");
  expect(series.exDates).toEqual(["2026-10-27"]);
  expect(series.date).toBe("2026-10-27");
});

test("alle keren wijzigen past de reeks aan", async ({ page }) => {
  await page.getByRole("button", { name: "Volgende week" }).click();
  await page.getByRole("button", { name: "di 3" }).click();
  await block(page, "Railroad Engineering").click();
  await page.getByPlaceholder("Bv. Studeren RTE").fill("RTE");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await page.getByRole("button", { name: "Alle keren" }).click();
  await expect(block(page, "RTE")).toBeVisible();

  // De reeks begint nog steeds in de week van de demo, niet een week later.
  const backup = await exportBackup(page);
  const series = backup.calEvents.find((e) => e.id === "ev1");
  expect(series).toMatchObject({ title: "RTE", date: "2026-10-27" });
});

test("ingedrukt houden en slepen verschuift een blok per kwartier", async ({
  page,
}) => {
  const lunch = block(page, "Lunch");
  await lunch.scrollIntoViewIfNeeded();
  const box = await lunch.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + 12;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.move(x, y + 64, { steps: 8 }); // 64 px = 1 uur
  await page.mouse.up();

  await expect(lunch).toContainText("13:30 – 14:15");
  await expect(page.getByText(/geselecteerd|Blok bewerken/)).toHaveCount(0);
});

test("het streepje onderaan maakt een blok langer", async ({ page }) => {
  const lunch = block(page, "Lunch");
  await lunch.scrollIntoViewIfNeeded();
  const handle = lunch.getByLabel("Langer of korter maken");
  const box = await handle.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 32, { steps: 6 }); // 32 px = half uur
  await page.mouse.up();

  await expect(lunch).toContainText("12:30 – 13:45");
});

test("een blok verwijderen vraagt bij herhalen om deze dag of alles", async ({
  page,
}) => {
  await block(page, "Railroad Engineering").click();
  await page.getByRole("button", { name: "Verwijderen" }).click();
  await page.getByRole("button", { name: /^Alleen dinsdag/ }).click();
  await expect(block(page, "Railroad Engineering")).toHaveCount(0);

  await page.getByRole("button", { name: "Volgende week" }).click();
  await page.getByRole("button", { name: "di 3" }).click();
  await expect(block(page, "Railroad Engineering")).toBeVisible();
});
