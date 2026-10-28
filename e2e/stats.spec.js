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
