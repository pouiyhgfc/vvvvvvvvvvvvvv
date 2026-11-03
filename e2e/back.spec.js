import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// De terugknop (telefoon of browser) sluit eerst de bovenste laag en gaat
// dan naar Vandaag, in plaats van de app te verlaten of te herladen.
const back = (page) => page.evaluate(() => history.back());
const tab = (page, name) =>
  page
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("button", { name });

test.beforeEach(async ({ page }) => {
  await loadDemo(page);
});

test("notitie → terug → lijst → terug → Vandaag", async ({ page }) => {
  await openTab(page, "Notities");
  await page.getByText("Dinsdag", { exact: true }).click();
  await expect(page.locator(".ProseMirror")).toBeVisible();

  await back(page);
  await expect(page.locator(".ProseMirror")).toBeHidden();
  await expect(page.getByText("Dinsdag", { exact: true })).toBeVisible();

  await back(page);
  await expect(page.getByRole("heading", { name: "Vandaag" })).toBeVisible();
});

test("Statistieken → terug → Meer → terug → Vandaag", async ({ page }) => {
  await openTab(page, "Statistieken");
  await expect(page.getByRole("tab", { name: "Week" })).toBeVisible();

  await back(page);
  await expect(
    page.getByRole("button", { name: /Exporteer alles/ }),
  ).toBeVisible();
  await back(page);
  await expect(page.getByRole("heading", { name: "Vandaag" })).toBeVisible();
});

test("terug sluit een sheet; zelf sluiten laat geen dode stap achter", async ({
  page,
}) => {
  await openTab(page, "Notities");
  await page.getByRole("button", { name: "Meer opties" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await back(page);
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(tab(page, "Notities")).toHaveAttribute("aria-current", "page");

  // Sheet met het kruisje sluiten: daarna gaat terug meteen naar Vandaag.
  await page.getByRole("button", { name: "Meer opties" }).click();
  await page.getByRole("button", { name: "Sluiten" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await back(page);
  await expect(page.getByRole("heading", { name: "Vandaag" })).toBeVisible();
});
