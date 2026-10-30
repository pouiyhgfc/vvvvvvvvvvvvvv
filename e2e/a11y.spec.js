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

// Toetsenbord: een knop krijgt een zichtbare focusrand, een invoerveld een
// groene rand.
test("focusrand op knoppen en invoervelden", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Meer");
  const exportBtn = page.getByRole("button", { name: /Exporteer alles/ });
  await exportBtn.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(exportBtn).toBeFocused();
  expect(
    await exportBtn.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");

  await page.getByRole("button", { name: "Tags" }).click();
  await page.getByRole("button", { name: /#hifd/ }).click();
  const field = page.getByRole("textbox", { name: "Nieuwe naam" });
  await field.focus();
  const [border, accent] = await field.evaluate((el) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--accent)";
    document.body.append(probe);
    const a = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).borderTopColor, a];
  });
  expect(border).toBe(accent);
});
