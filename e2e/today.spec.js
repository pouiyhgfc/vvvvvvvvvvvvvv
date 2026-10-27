import { expect, test } from "@playwright/test";

// Vandaag kiest het dagdeel van nu, en schuift mee als de klok een nieuw
// dagdeel ingaat terwijl de app open staat. Zelf wisselen blijft staan
// tot het volgende dagdeel begint.

const tab = (page, name) => page.getByRole("tab", { name: new RegExp(name) });

test("het dagdeel springt om 12 uur vanzelf naar middag", async ({ page }) => {
  // Lokale tijd van de browser (zelfde tijdzone als deze testmachine).
  await page.clock.install({ time: new Date(2026, 9, 27, 11, 58, 30) });
  await page.goto("/");
  await expect(tab(page, "Ochtend")).toHaveAttribute("aria-selected", "true");

  await page.clock.runFor("03:00");
  await expect(tab(page, "Middag")).toHaveAttribute("aria-selected", "true");

  // Zelf terug naar ochtend: blijft staan binnen hetzelfde dagdeel.
  await tab(page, "Ochtend").click();
  await page.clock.runFor("02:00");
  await expect(tab(page, "Ochtend")).toHaveAttribute("aria-selected", "true");
});
