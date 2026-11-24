import { expect, test } from "@playwright/test";
import { startApp } from "./helpers.js";

// Na een update kan een oud stuk van de app (zoals de editor) ontbreken.
// Dan hoort er een melding met "Opnieuw laden" te staan, geen wit scherm.
test("een onderdeel dat niet laadt geeft een melding met opnieuw laden", async ({
  page,
}) => {
  await page.route(/RichEditor\.jsx/, (route) => route.abort());
  await startApp(page);
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
  await page.getByRole("button", { name: "Nieuwe notitie" }).click();

  await expect(page.getByText("Er ging iets mis")).toBeVisible();
  await page.unroute(/RichEditor\.jsx/);
  await page.getByRole("button", { name: "Opnieuw laden" }).click();
  await expect(
    page.getByRole("navigation", { name: "Hoofdmenu" }),
  ).toBeVisible();
});
