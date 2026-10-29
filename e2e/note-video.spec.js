import { expect, test } from "@playwright/test";
import { exportBackup, loadDemo, openTab } from "./helpers.js";

// Mini-speler: een YouTube-link wordt een ingebouwde speler; alleen de link
// wordt opgeslagen (en staat in de tekst voor zoeken).
test("video-link insluiten als speler", async ({ page }) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>speler</p>" }),
  );
  await loadDemo(page);
  await openTab(page, "Notities");
  await page.getByText("Dinsdag", { exact: true }).click();
  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/video");
  await page.keyboard.press("Enter");

  const input = page.getByRole("textbox", { name: "Videolink" });
  await input.fill("https://youtu.be/dQw4w9WgXcQ?t=30");
  await input.press("Enter");
  const player = editor.locator("iframe");
  await expect(player).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30",
  );
  await expect(
    page.frameLocator(".ProseMirror iframe").getByText("speler"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Terug" }).click();
  const backup = await exportBackup(page);
  const note = backup.logEntries.find((e) => e.title === "Dinsdag");
  expect(note.doc.some((b) => b.type === "video")).toBe(true);
  expect(note.body).toContain("https://youtu.be/dQw4w9WgXcQ?t=30");
});
