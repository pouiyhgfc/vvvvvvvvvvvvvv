import { test, expect } from "@playwright/test";

// Regressietests rond het dataverlies dat we onderzochten:
//  1. De `blocksToMarkdownLossy(...).then`-fout brak de markdown-input-rules
//     volledig (typen van "### " maakte geen kop). Test 1 bewaakt dat.
//  2. Enter met alléén een cursor mag NOOIT tekst wissen (alleen splitsen).
//     Tekstverlies bij Enter kwam van een actieve SELECTIE (Enter vervangt die),
//     niet van een losse cursor — test 2 legt het cursor-gedrag vast.

async function openEditor(page) {
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.click(".ProseMirror");
}

// Samengevoegde tekst van alle blokken (bron van waarheid voor editor-inhoud).
function editorText(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bn-block-content")]
      .map((el) => el.textContent)
      .join(""),
  );
}

test("markdown-shortcut maakt een kop (input-rules werken)", async ({
  page,
}) => {
  await openEditor(page);
  await page.keyboard.type("### Mijn kop", { delay: 20 });
  await expect(page.locator(".bn-block-content").first()).toHaveAttribute(
    "data-content-type",
    "heading",
  );
});

test("Enter met cursor vooraan een kop wist geen tekst", async ({ page }) => {
  await openEditor(page);
  await page.keyboard.type("### Hallo wereld dit is tekst", { delay: 15 });
  const before = await editorText(page);
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  const after = await editorText(page);
  // Enter splitst hooguit in twee blokken; geen enkel teken mag verdwijnen.
  expect(after).toBe(before);
});

test("typen geeft geen uncaught console-errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openEditor(page);
  await page.keyboard.type("### Kop\nRegel twee tekst", { delay: 15 });
  expect(errors).toEqual([]);
});

test("undo/redo-knoppen zijn uit als er niets te herstellen valt", async ({
  page,
}) => {
  await openEditor(page);
  await expect(
    page.locator('button[aria-label="Ongedaan maken"]'),
  ).toBeDisabled();
  await expect(page.locator('button[aria-label="Opnieuw"]')).toBeDisabled();
  await page.keyboard.type("Hallo", { delay: 15 });
  await expect(
    page.locator('button[aria-label="Ongedaan maken"]'),
  ).toBeEnabled();
});

// Tabel-acties draaien op prosemirror-tables direct (BlockNote 0.51 heeft geen
// tiptap table-commands). Deze test bewaakt dat rij/kolom toevoegen+wissen werkt.
test("tabel: rij/kolom toevoegen en wissen via het blok-menu", async ({
  page,
}) => {
  const HANDLE =
    'button[aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"]';
  const dims = () =>
    page.evaluate(() => {
      const t = document.querySelector("table");
      return { rows: t.rows.length, cols: t.rows[0].cells.length };
    });
  await openEditor(page);
  await page.click('button[aria-label="Nieuw blok invoegen"]');
  await page.getByText("Tabel", { exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.locator("table td, table th").first().click();
  const start = await dims();

  await page.click(HANDLE);
  await page.waitForTimeout(200);
  await page.click('button[aria-label="Rij onder invoegen"]');
  await page.waitForTimeout(150);
  await page.click('button[aria-label="Kolom rechts invoegen"]');
  await page.waitForTimeout(150);
  const grown = await dims();
  expect(grown.rows).toBe(start.rows + 1);
  expect(grown.cols).toBe(start.cols + 1);

  await page.click('button[aria-label="Rij wissen"]');
  await page.waitForTimeout(150);
  await page.click('button[aria-label="Kolom wissen"]');
  await page.waitForTimeout(150);
  const shrunk = await dims();
  expect(shrunk.rows).toBe(start.rows);
  expect(shrunk.cols).toBe(start.cols);
});

// Meervoudige selectie via een genuine sleep-gebaar (niet Ctrl+A) moet alle
// blokken kopiëren. Bewaakt de DOM-selectie-tracking in BlockHandle — die pikt
// een selectie op die ProseMirror op touch niet altijd synct.
test("sleep-selectie over meerdere blokken kopieert alle blokken", async ({
  page,
}) => {
  await page.context().grantPermissions(["clipboard-write"]);
  await openEditor(page);
  await page.keyboard.type("Regel een");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Regel twee");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Regel drie");
  await page.waitForTimeout(150);
  const b1 = await page.locator(".bn-block-content").nth(0).boundingBox();
  const b3 = await page.locator(".bn-block-content").nth(2).boundingBox();
  await page.mouse.move(b1.x + 4, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.move(b3.x + b3.width - 6, b3.y + b3.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await page.waitForTimeout(150);
  await page.click(
    'button[aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"]',
  );
  await page.click('button[aria-label="Kopiëren"]');
  // De bevestigings-toast meldt het aantal: ">1" => "N blokken gekopieerd".
  await expect(page.getByText(/blokken gekopieerd/)).toBeVisible();
});

test("kopiëren heft de selectie op zodat een volgende Enter niets wist", async ({
  page,
}) => {
  await openEditor(page);
  await page.keyboard.type("Regel een");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Regel twee");
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+a");
  await page.click(
    'button[aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"]',
  );
  await page.click('button[aria-label="Kopiëren"]');
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
  const text = await editorText(page);
  expect(text).toContain("Regel een");
  expect(text).toContain("Regel twee");
});
