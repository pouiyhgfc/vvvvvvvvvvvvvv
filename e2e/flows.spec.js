import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Kernflows buiten de editor: afvinken, Hifd beoordelen en een backup die
// via de echte knoppen weer volledig te exporteren is.

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
  await openTab(page, "Config");

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
  await openTab(page, "Week");

  // Middelste uurcel van de eerste dagkolom: een tik (geen sleep) opent de sheet.
  await page.locator(".cal-hour-cell").nth(4).click();
  await page.getByPlaceholder("Naam activiteit...").fill("E2E-afspraak");
  await page.getByRole("button", { name: /Toevoegen/ }).click();
  await expect(page.getByText("E2E-afspraak")).toBeVisible();

  await page.reload();
  await openTab(page, "Week");
  await expect(page.getByText("E2E-afspraak")).toBeVisible();
});

test("een kapotte backup wordt afgekeurd en verandert niets", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Duah", { exact: true }).click();
  await openTab(page, "Config");

  await page.locator('input[type="file"]').setInputFiles({
    name: "kapot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ routines: "fout", days: {} })),
  });

  await expect(page.getByText(/Backup afgekeurd/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Volledig vervangen" }),
  ).toHaveCount(0);
  await openTab(page, "Config");
  await expect(page.getByText("1/13").first()).toBeVisible();
});
