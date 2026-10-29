import { expect, test } from "@playwright/test";
import { NOW } from "./fixtures/demo.js";
import { openTab } from "./helpers.js";

// Een nieuw toestel start leeg met het welkomstscherm; je kiest zelf wat erin
// komt. Hifd is een module die je aan- en uitzet.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

test("welkomstscherm: pakketten kiezen en Hifd aan/uit", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welkom" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  await expect(nav).toBeHidden();

  await page.getByRole("button", { name: /Basisroutines/ }).click();
  await page.getByRole("button", { name: /Gebed en Quran/ }).click();
  await page.getByRole("button", { name: /^Hifd/ }).click();
  await page.getByRole("button", { name: "Beginnen" }).click();

  await expect(page.getByText("Fajr", { exact: true })).toBeVisible();
  await expect(page.getByText("Glas water")).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Hifd" })).toBeVisible();

  // Na herladen geen welkomstscherm meer.
  await page.reload();
  await expect(page.getByText("Fajr", { exact: true })).toBeVisible();

  // Hifd uitzetten in Meer haalt het tabblad weg.
  await openTab(page, "Meer");
  await page.getByRole("button", { name: /Weergave en meldingen/ }).click();
  await page.getByText(/^Koran memoriseren en herhalen/).click();
  await expect(nav.getByRole("button", { name: "Hifd" })).toBeHidden();
});

test("welkomstscherm: basis zonder Hifd, nieuw logboek is kort", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Beginnen" }).click();
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  await expect(page.getByText("Glas water", { exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Hifd" })).toHaveCount(0);

  await page
    .getByRole("button", { name: "Nieuw logboek voor vandaag aanmaken" })
    .click();
  await expect(page.locator(".ProseMirror")).toContainText("Wat ging goed?");
});
