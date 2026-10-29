import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Automatische toegankelijkheidscheck (WCAG 2.1 AA: contrast, namen van
// knoppen en velden, rollen) per scherm, in licht en donker.
const screens = [
  ["Vandaag", async () => {}],
  ["Planning", (page) => openTab(page, "Planning")],
  ["Notities", (page) => openTab(page, "Notities")],
  [
    "Notitie",
    async (page) => {
      await openTab(page, "Notities");
      await page.getByText("Dinsdag", { exact: true }).click();
      await page.waitForSelector(".ProseMirror");
    },
  ],
  ["Hifd", (page) => openTab(page, "Hifd")],
  ["Statistieken", (page) => openTab(page, "Statistieken")],
  ["Meer", (page) => openTab(page, "Meer")],
];

for (const theme of ["light", "dark"]) {
  for (const [name, open] of screens) {
    test(`${name} (${theme})`, async ({ page }) => {
      await loadDemo(page, { theme });
      await open(page);
      await page.waitForTimeout(400);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        // Afvinkvakjes in de editor komen uit BlockNote zelf.
        .exclude('.bn-block-content input[type="checkbox"]')
        // + en ⠿ in de editorgoot zijn 22×40 px: de goot is 44 px, zodat de
        // tekst op een telefoon breed blijft. Bewuste uitzondering.
        .exclude('button[aria-label="Nieuw blok invoegen"]')
        .exclude('button[aria-label^="Blok-menu"]')
        .analyze();
      const summary = violations.map(
        (v) =>
          `${v.id} (${v.nodes.length}): ${v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(" "))
            .join(" | ")}`,
      );
      expect(summary).toEqual([]);
    });
  }
}

// Met een toetsenbord: een sheet krijgt de focus, Escape sluit en zet de
// focus terug op de knop waar je vandaan kwam.
test("focus gaat de sheet in en weer terug", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Notities");
  const button = page.getByRole("button", { name: "Meer opties" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
});
