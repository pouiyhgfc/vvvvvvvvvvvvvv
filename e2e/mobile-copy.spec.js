import { test, expect, devices } from "@playwright/test";

// Mobiel toestel + klembord-rechten (top-level test.use, verplicht voor
// device-/context-opties).
test.use({
  ...devices["Pixel 7"],
  permissions: ["clipboard-read", "clipboard-write"],
});

// Op touch collapst de selectie zodra je op ⠿ tikt. De blok-sheet moet dan tóch
// alle geselecteerde blokken kopiëren (via de in BlockHandle onthouden
// meervoudige selectie), niet alleen het blok waar de cursor naartoe collapste.
test("gecollapste touch-selectie kopieert nog alle blokken", async ({
  page,
}) => {
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.tap(".ProseMirror");
  await page.keyboard.type("Regel een");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Regel twee");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Regel drie");
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+a");
  await page.waitForTimeout(150); // selectionchange → selBlocksRef vullen
  // Bootst de collapse na die een echte tik op mobiel veroorzaakt.
  await page.evaluate(() => window.getSelection().collapseToEnd());
  await page.waitForTimeout(150);
  await page.tap(
    'button[aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"]',
  );
  await page.tap('button[aria-label="Kopiëren"]');
  await page.waitForTimeout(500); // async klembord-schrijf afwachten
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("een");
  expect(clip).toContain("twee");
  expect(clip).toContain("drie");
});
