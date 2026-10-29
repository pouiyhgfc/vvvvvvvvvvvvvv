import { expect, test, devices } from "@playwright/test";

// Hulpmiddelen binnen één notitie: zoeken, inhoudsopgave en datum invoegen.
test.use({ ...devices["Pixel 7"] });

const NOW = new Date("2026-10-28T10:00:00+08:00");

async function newNote(page, lines) {
  await page.clock.setFixedTime(NOW);
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.tap(".ProseMirror");
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i]);
    if (i < lines.length - 1) await page.keyboard.press("Enter");
  }
}

const openMenu = (page) => page.tap('button[aria-label="Notitie-opties"]');

test("zoeken in een notitie telt treffers, ook over vet heen", async ({
  page,
}) => {
  // "lk" vet typen: de treffer "melk" loopt dan over twee tekst-nodes.
  await newNote(page, ["Melk halen", "Brood en me"]);
  await page.keyboard.press("Control+b");
  await page.keyboard.type("lk");
  await page.keyboard.press("Control+b");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Niets");
  await expect(page.locator(".ProseMirror strong")).toHaveText("lk");

  await openMenu(page);
  await page.getByRole("button", { name: "Zoeken in notitie" }).tap();
  const zoek = page.getByLabel("Zoeken in deze notitie");
  await zoek.fill("melk");
  await expect(page.getByText("1 van 2")).toBeVisible();
  expect(await page.evaluate(() => CSS.highlights.get("zoek").size)).toBe(2);
  await page.getByRole("button", { name: "Volgende treffer" }).tap();
  await expect(page.getByText("2 van 2")).toBeVisible();

  await zoek.fill("kaas");
  await expect(page.getByText("Geen", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Zoeken sluiten" }).tap();
  expect(await page.evaluate(() => CSS.highlights.has("zoek"))).toBe(false);
  // Markeren raakt de notitie zelf niet.
  await expect(page.locator(".ProseMirror mark")).toHaveCount(0);
});

test("inhoud toont de koppen en scrolt ernaartoe", async ({ page }) => {
  const filler = Array.from({ length: 25 }, (_, i) => `Regel ${i + 1}`);
  await newNote(page, ["# Begin", ...filler, "## Einde", "Laatste regel"]);
  await page.evaluate(() =>
    document
      .querySelector(".ProseMirror")
      .closest("[style*='overflow']")
      ?.scrollTo(0, 0),
  );
  await openMenu(page);
  await page.getByRole("button", { name: "Inhoud" }).tap();
  const sheet = page.getByRole("dialog", { name: "Inhoud" });
  await expect(sheet.getByRole("button", { name: "Begin" })).toBeVisible();
  await expect(
    page.locator(".ProseMirror h2", { hasText: "Einde" }),
  ).not.toBeInViewport();
  await sheet.getByRole("button", { name: "Einde" }).tap();
  await expect(
    page.locator(".ProseMirror h2", { hasText: "Einde" }),
  ).toBeInViewport();
});

test("zonder koppen staat Inhoud niet in het menu", async ({ page }) => {
  await newNote(page, ["Gewoon tekst"]);
  await openMenu(page);
  await expect(page.getByRole("button", { name: "Inhoud" })).toHaveCount(0);
});

test("datum van vandaag invoegen via het plus-menu", async ({ page }) => {
  await newNote(page, ["Gesprek op "]);
  await page.tap('button[aria-label="Nieuw blok invoegen"]');
  await page.keyboard.type("datum");
  await page
    .locator(".bn-suggestion-menu-item", { hasText: "Datum van vandaag" })
    .tap();
  await expect(page.locator(".ProseMirror")).toContainText(
    "woensdag 28 oktober 2026",
  );
});

test("een notitie als sjabloon opslaan en gebruiken", async ({ page }) => {
  await newNote(page, ["Doelen voor deze week"]);
  await openMenu(page);
  await page.getByRole("button", { name: "Opslaan als sjabloon" }).tap();
  await page.getByPlaceholder("Naam sjabloon...").fill("Weekplan");
  await page.getByRole("button", { name: "Opslaan", exact: true }).tap();
  await expect(page.getByText("✓ Sjabloon opgeslagen")).toBeVisible();

  await page.getByRole("button", { name: "Terug" }).tap();
  await page
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("button", { name: "Notities" })
    .tap();
  await page.getByRole("button", { name: "Nieuwe notitie" }).tap();
  await page.getByText("Weekplan", { exact: true }).tap();
  await expect(page.locator(".ProseMirror")).toContainText(
    "Doelen voor deze week",
  );

  // Sjabloon weer weghalen vanuit de keuze bij "Nieuwe notitie".
  await page.getByRole("button", { name: "Terug" }).tap();
  await page.getByRole("button", { name: "Nieuwe notitie" }).tap();
  await page.getByRole("button", { name: /verwijderen/ }).tap();
  await page.getByRole("button", { name: "Verwijderen", exact: true }).tap();
  await expect(page.getByText("Weekplan", { exact: true })).toBeHidden();
});

test("callout invoegen, variant wisselen en bewaren", async ({ page }) => {
  await newNote(page, [""]);
  await page.tap('button[aria-label="Nieuw blok invoegen"]');
  await page.keyboard.type("callout");
  await page.locator(".bn-suggestion-menu-item", { hasText: "Callout" }).tap();
  await page.keyboard.type("Niet vergeten: huiswerk RTE");
  const callout = page.locator(".ProseMirror .callout");
  await expect(callout).toContainText("Niet vergeten: huiswerk RTE");
  await callout.getByRole("button", { name: /Info/ }).tap();
  await expect(callout.getByRole("button", { name: /Tip/ })).toBeVisible();

  // Terug en opnieuw openen: blok en variant zijn bewaard.
  await page.getByRole("button", { name: "Terug" }).tap();
  await page
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("button", { name: "Notities" })
    .tap();
  await page.getByText("Niet vergeten: huiswerk RTE").first().tap();
  await expect(
    page.locator(".ProseMirror .callout").getByRole("button", { name: /Tip/ }),
  ).toBeVisible();
});
