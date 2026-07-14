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
