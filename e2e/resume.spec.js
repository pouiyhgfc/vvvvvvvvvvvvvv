import { test, expect } from "@playwright/test";
import { startApp } from "./helpers.js";

// Android sluit een app op de achtergrond soms af; bij terugkomen start hij
// opnieuw. Een herlaadbeurt bootst dat na: je hoort terug te komen waar je was.

async function openNewNote(page) {
  await startApp(page);
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
  await page.click('button[aria-label="Nieuw notitieboek"]');
  await page.getByPlaceholder("Naam notitieboek...").fill("Werk");
  await page.getByRole("button", { name: "Toevoegen" }).click();
  await page.getByRole("button", { name: "Nieuwe notitie" }).click();
  await page.waitForSelector(".ProseMirror");
  await page.getByPlaceholder("Titel…").fill("Terug-test");
  await page.click(".ProseMirror");
  await page.keyboard.type("halverwege een gedachte");
}

test("na een herstart staat je open notitie er weer", async ({ page }) => {
  await openNewNote(page);
  await page.waitForTimeout(700); // automatisch opslaan

  await page.reload();

  await expect(page.getByPlaceholder("Titel…")).toHaveValue("Terug-test");
  await expect(page.locator(".ProseMirror")).toContainText("halverwege");
  // Terug brengt je naar het notitieboek waar je zat.
  await page.click('button[aria-label^="Terug"]');
  await expect(page.getByText("Terug-test", { exact: true })).toBeVisible();
});

test("wat je net typte wordt bewaard zodra je de app wegklikt", async ({
  page,
}) => {
  await openNewNote(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(250); // korter dan het automatisch opslaan

  await page.reload();

  await expect(page.locator(".ProseMirror")).toContainText("halverwege");
});
