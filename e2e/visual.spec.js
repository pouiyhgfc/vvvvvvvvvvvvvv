import { expect, test } from "@playwright/test";
import { loadDemo, openTab, settle } from "./helpers.js";

// Screenshot-nulmeting per scherm, licht en donker, op een telefoonformaat.
// Bij een pure structuur-wijziging moeten deze identiek blijven; bij een
// bewuste ontwerpwijziging werk je ze bij met `npm run test:visual -- -u`.

const screens = [
  ["dag", async () => {}],
  ["week", (page) => openTab(page, "Planning")],
  ["stats", (page) => openTab(page, "Statistieken")],
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
