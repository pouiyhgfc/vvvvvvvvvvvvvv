import { expect, test } from "@playwright/test";
import { NOW } from "./fixtures/demo.js";
import { loadDemo, openTab } from "./helpers.js";

// Kernflows buiten de editor: afvinken, Hifd beoordelen en een backup die
// via de echte knoppen weer volledig te exporteren is.

// Vaste klok: Vandaag opent op het dagdeel van nu, en deze tests gaan uit van
// de ochtend.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

test("een afgevinkte routine blijft afgevinkt na herladen", async ({
  page,
}) => {
  // De ochtend-teller staat zowel in de voortgangsbalk als op de tab.
  const ochtend = page.getByText("1/13").first();
  await page.goto("/");
  await expect(page.getByText("0/13").first()).toBeVisible();

  await page.getByText("Duah", { exact: true }).click();
  await expect(ochtend).toBeVisible();

  await page.reload();
  await expect(ochtend).toBeVisible();
});

test("een Hifd-revisie beoordelen haalt de surah uit de lijst en telt mee", async ({
  page,
}) => {
  await loadDemo(page);
  await openTab(page, "Hifd");
  await expect(page.getByText("0/4 vandaag")).toBeVisible();
  const fatiha = page
    .locator("div")
    .filter({ hasText: /^Al-Fatihah/ })
    .first();
  await expect(fatiha).toBeVisible();

  await fatiha.getByRole("button", { name: /Goed/ }).click();

  await expect(page.getByText("1/4 vandaag")).toBeVisible();
  await expect(page.getByText("Al-Fatihah", { exact: true })).toBeHidden();
  await page.reload();
  await openTab(page, "Hifd");
  await expect(page.getByText("1/4 vandaag")).toBeVisible();
});

test("'Exporteer alles' levert een volledige backup op", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Meer");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exporteer alles/ }).click();
  const file = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  const backup = JSON.parse(await readFile(file, "utf8"));

  expect(backup.version).toBe(9);
  expect(backup.logEntries).toHaveLength(3);
  expect(backup.hifd).toHaveLength(114);
  expect(backup.hifd.filter((r) => r.status === "memorized")).toHaveLength(6);
  expect(Object.keys(backup.days)).toHaveLength(8);
  expect(backup.notebooks.map((n) => n.id)).toEqual(["logboek", "studie"]);
});

test("een event aanmaken via een tik in de weekkalender blijft staan", async ({
  page,
}) => {
  await page.goto("/");
  await openTab(page, "Planning");

  // Middelste uurcel van de eerste dagkolom: een tik (geen sleep) opent de sheet.
  await page.locator(".cal-hour-cell").nth(4).click();
  await page.getByPlaceholder("Naam activiteit...").fill("E2E-afspraak");
  await page.getByRole("button", { name: /Toevoegen/ }).click();
  await expect(page.getByText("E2E-afspraak")).toBeVisible();

  await page.reload();
  await openTab(page, "Planning");
  await expect(page.getByText("E2E-afspraak")).toBeVisible();
});

test("een kapotte backup wordt afgekeurd en verandert niets", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Duah", { exact: true }).click();
  await openTab(page, "Meer");

  await page.locator('input[type="file"]').setInputFiles({
    name: "kapot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ routines: {}, days: {} })),
  });

  await expect(page.getByText(/Backup afgekeurd/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Volledig vervangen" }),
  ).toHaveCount(0);
  await openTab(page, "Vandaag");
  await expect(page.getByText("1/13").first()).toBeVisible();
});

test("'volledig vervangen' downloadt eerst een veiligheidsbackup", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Duah", { exact: true }).click();
  await openTab(page, "Meer");
  await page.locator('input[type="file"]').setInputFiles({
    name: "leeg.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 9,
        routines: { ochtend: [], middag: [], avond: [] },
        days: {},
      }),
    ),
  });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Volledig vervangen" }).click();
  await expect(page.getByText(/Import gelukt/)).toBeVisible();
  const file = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  const safety = JSON.parse(await readFile(file, "utf8"));

  // De veiligheidsbackup bevat de staat van vóór het vervangen.
  const checkedDays = Object.values(safety.days).filter((d) => d.checked?.o1);
  expect(checkedDays).toHaveLength(1);
});

test("backup-herinnering: verschijnt zonder backup, 'later' en exporteren verbergen hem", async ({
  page,
}) => {
  const reminder = page.getByText(/nog geen backup gemaakt/);
  await page.goto("/");
  await expect(reminder).toBeVisible();

  await page.getByRole("button", { name: "Over een week" }).click();
  await expect(reminder).toBeHidden();
  await page.reload();
  await expect(page.getByText("Duah", { exact: true })).toBeVisible();
  await expect(reminder).toBeHidden();

  // In een schone context: exporteren verbergt hem ook.
  await page.evaluate(() => indexedDB.deleteDatabase("routine-tracker"));
  await page.reload();
  await expect(reminder).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporteer nu" }).click();
  await download;
  await expect(reminder).toBeHidden();
});
