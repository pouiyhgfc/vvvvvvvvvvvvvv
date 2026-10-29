import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Arabisch (of Tarifit in Tifinagh) in een tekstveld loopt van rechts naar
// links, Nederlands gewoon van links naar rechts.
test("tekstvelden volgen de schrijfrichting", async ({ page }) => {
  await loadDemo(page);
  await openTab(page, "Notities");
  const search = page.getByPlaceholder("Zoeken in notities en tags");
  const rtl = () => search.evaluate((el) => el.matches(":dir(rtl)"));

  await search.fill("سورة الملك");
  expect(await rtl()).toBe(true);
  await search.fill("Spoorgeometrie");
  expect(await rtl()).toBe(false);

  await search.fill("");
  await page.getByText("Dinsdag", { exact: true }).click();
  const title = page.getByPlaceholder("Titel…");
  await title.fill("دعاء");
  expect(await title.evaluate((el) => el.matches(":dir(rtl)"))).toBe(true);
});
