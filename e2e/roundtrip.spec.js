import { test, expect } from "@playwright/test";

// Data-integriteit: een rijk document (kop, alinea, lijst, tabel-met-inhoud)
// opslaan → app herladen → entry heropenen via het Logboek → moet identiek zijn.
// Vangt serialisatie-/deserialisatie-regressies (bv. in de tabel).
function snapshot(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".bn-block-content")].map((e) => ({
      type:
        e.getAttribute("data-content-type") +
        (e.getAttribute("data-level") || ""),
      text: e.textContent,
    })),
  );
}

test("rijk document overleeft opslaan → herladen → heropenen", async ({
  page,
}) => {
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.getByPlaceholder("Titel…").fill("RT-titel-uniek");
  await page.click(".ProseMirror");
  await page.keyboard.type("### Kop hier");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Gewone alinea tekst");
  await page.keyboard.press("Enter");
  await page.keyboard.type("- Eerste lijstpunt");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter"); // uit de lijst
  await page.click('button[aria-label="Nieuw blok invoegen"]');
  await page.getByText("Tabel", { exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.locator("table td, table th").first().click();
  await page.keyboard.type("celwaarde");
  await page.waitForTimeout(200);
  const before = await snapshot(page);

  await page.click('button[aria-label="Terug"]');
  await page.waitForTimeout(800); // opslaan afwachten

  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
  await page.getByText("RT-titel-uniek").first().click();
  await page.waitForSelector(".ProseMirror");
  await page.waitForTimeout(400);
  const after = await snapshot(page);

  expect(after).toEqual(before);
});
