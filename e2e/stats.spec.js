import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Statistieken: elke periode moet zonder fout renderen.
test("week, maand en jaar tonen zonder fout", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await loadDemo(page);
  await openTab(page, "Statistieken");
  for (const tab of ["Week", "Maand", "Jaar"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await page.getByRole("tab", { name: "Maand" }).click();
  await expect(page.getByText("75%+")).toBeVisible();
  expect(errors).toEqual([]);
});

// Hifd in Statistieken: na een revisie met fouten staat die surah bij de
// zwakke plekken.
test("Hifd-kaart toont dekking, revisies en zwakke plekken", async ({
  page,
}) => {
  await loadDemo(page);
  await openTab(page, "Hifd");
  const card = page
    .locator("section")
    .filter({ hasText: "zeg uit het hoofd op" });
  await card.getByRole("button", { name: "3+" }).click();
  await card.getByRole("button", { name: /^Zwak/ }).click();

  await openTab(page, "Statistieken");
  const hifd = page.getByRole("region", { name: "Hifd · laatste 30 dagen" });
  await expect(hifd).toBeVisible();
  await expect(hifd.getByText("revisies")).toBeVisible();
  await expect(hifd.getByText(/Al-Fatihah/)).toBeVisible();
});
