import { expect, test } from "@playwright/test";
import { exportBackup, importBackup, loadDemo, openTab } from "./helpers.js";

// 1×1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// Een afbeelding staat lokaal (Dexie), verschijnt in de notitie en gaat mee
// in de backup; na terugzetten is hij er nog.
test("afbeelding uploaden, tonen en meenemen in de backup", async ({
  page,
}) => {
  await loadDemo(page);
  await openTab(page, "Notities");
  await page.getByText("Dinsdag", { exact: true }).click();
  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/afbeelding");
  await page.keyboard.press("Enter");
  await page.getByText("Afbeelding toevoegen").click();
  await page.locator('.bn-panel input[type="file"]').setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  const img = editor.locator("img");
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute("src", /^blob:/);

  await page.getByRole("button", { name: "Terug" }).click();
  const backup = await exportBackup(page);
  expect(backup.files).toHaveLength(1);
  expect(backup.files[0].data).toMatch(/^data:image\/jpeg;base64,/);
  const note = backup.logEntries.find((e) =>
    JSON.stringify(e.doc ?? []).includes("rtfile:"),
  );
  expect(note).toBeTruthy();

  await importBackup(page, backup);
  await openTab(page, "Notities");
  await page.getByText("Dinsdag", { exact: true }).click();
  await expect(page.locator(".ProseMirror img")).toHaveAttribute(
    "src",
    /^blob:/,
  );
});
