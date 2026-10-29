import { expect, test } from "@playwright/test";
import { NOW } from "./fixtures/demo.js";
import { loadDemo, openTab, settle } from "./helpers.js";

// Screenshot-nulmeting per scherm, licht en donker, op een telefoonformaat.
// Bij een pure structuur-wijziging moeten deze identiek blijven; bij een
// bewuste ontwerpwijziging werk je ze bij met `npm run test:visual -- -u`.

const screens = [
  ["dag", async () => {}],
  ["week", (page) => openTab(page, "Planning")],
  ["stats", (page) => openTab(page, "Statistieken")],
  [
    "stats-maand",
    async (page) => {
      await openTab(page, "Statistieken");
      await page.getByRole("tab", { name: "Maand" }).click();
    },
  ],
  [
    "stats-jaar",
    async (page) => {
      await openTab(page, "Statistieken");
      await page.getByRole("tab", { name: "Jaar" }).click();
    },
  ],
  ["notities", (page) => openTab(page, "Notities")],
  [
    "notitie-open",
    async (page) => {
      await openTab(page, "Notities");
      await page.getByText("Dinsdag", { exact: true }).click();
      await page.waitForSelector(".ProseMirror");
    },
  ],
  ["hifd-vandaag", (page) => openTab(page, "Hifd")],
  [
    "hifd-voortgang",
    async (page) => {
      await openTab(page, "Hifd");
      await page.getByRole("tab", { name: "Voortgang" }).click();
    },
  ],
  ["meer", (page) => openTab(page, "Meer")],
];

for (const theme of ["light", "dark"]) {
  test.describe(theme, () => {
    test.beforeEach(async ({ page }) => {
      await loadDemo(page, { theme });
    });

    for (const [name, open] of screens) {
      test(name, async ({ page }) => {
        await open(page);
        await settle(page);
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          fullPage: true,
        });
      });
    }
  });
}

// Het welkomstscherm van een nieuw toestel (alleen licht: het thema kies je pas
// in de app).
test("welkom", async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welkom" })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot("welkom-light.png", { fullPage: true });
});
