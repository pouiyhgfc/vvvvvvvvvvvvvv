import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Link naar een andere notitie: invoegen via het menu, erop tikken opent die
// notitie, en daar staat "Gelinkt vanuit" terug naar de eerste.
test("notitielink en backlink", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Notities");
  await page.getByText("Dinsdag", { exact: true }).click();
  const editor = page.locator(".ProseMirror");
  await editor.getByText("Backup exporteren").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Zie ");
  await page.keyboard.type("/link");
  await page.keyboard.press("Enter");

  await page.getByRole("textbox", { name: "Zoek notitie" }).fill("spo");
  await page.getByRole("button", { name: /Spoorgeometrie/ }).click();
  const chip = editor.getByRole("button", { name: "Spoorgeometrie" });
  await expect(chip).toBeVisible();

  await chip.click();
  const title = page.getByPlaceholder("Titel…");
  await expect(title).toHaveValue("Spoorgeometrie");
  const back = page.getByRole("button", { name: "Dinsdag" });
  await expect(back).toBeVisible();

  await back.click();
  await expect(title).toHaveValue("Dinsdag");
  await expect(
    editor.getByRole("button", { name: "Spoorgeometrie" }),
  ).toBeVisible();

  // Met een toetsenbord kan het ook via "@".
  await editor.getByText("Zie", { exact: false }).click();
  await page.keyboard.press("End");
  await page.keyboard.type("en @zon");
  await page.locator(".bn-suggestion-menu").getByText("Zondag").click();
  await expect(editor.getByRole("button", { name: "Zondag" })).toBeVisible();
});
