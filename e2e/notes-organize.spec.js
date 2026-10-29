import { test, expect } from "@playwright/test";
import { startApp } from "./helpers.js";

// Regressietests voor verplaatsen, datumgroepen, multi-select/bulkacties en
// slepen tijdens zoeken. Elke test start met een schone IndexedDB.

async function openLogbook(page) {
  await startApp(page);
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
}

async function createNote(page, title) {
  await page.getByRole("button", { name: "Nieuwe notitie" }).click();
  await page.waitForSelector(".ProseMirror");
  await page.getByPlaceholder("Titel…").fill(title);
  await page.click(".ProseMirror");
  await page.keyboard.type("inhoud van de test-entry");
  await page.click('button[aria-label="Terug"]');
  await page.waitForTimeout(700); // debounced auto-save afwachten
}

async function createNotebook(page, name) {
  await page.click('button[aria-label="Nieuw notitieboek"]');
  await page.getByPlaceholder("Naam notitieboek...").fill(name);
  await page.getByRole("button", { name: "Toevoegen" }).click();
}

test("verplaatsen via de notitieboek-select in EntryPage verhuist de entry", async ({
  page,
}) => {
  await openLogbook(page);
  await createNotebook(page, "Werk"); // schakelt meteen naar "Werk"
  await page.getByRole("button").filter({ hasText: "Logboek" }).click();
  await createNote(page, "Move-test");

  await page.getByText("Move-test", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await page
    .getByLabel("Notitieboek", { exact: true })
    .selectOption({ label: "Werk" });
  await page.waitForTimeout(300);
  await page.click('button[aria-label="Terug"]');

  await expect(page.getByText("Move-test", { exact: true })).toHaveCount(0);

  await page.getByRole("button").filter({ hasText: "Werk" }).click();
  await expect(page.getByText("Move-test", { exact: true })).toBeVisible();
});

test("Datum-modus toont groepskoppen en geen sleephandvatten", async ({
  page,
}) => {
  // Na middernacht in Taiwan is het in UTC nog "gisteren": de groepskop moet
  // de lokale dag gebruiken.
  await page.clock.setFixedTime(new Date("2026-10-29T01:30:00+08:00"));
  await openLogbook(page);
  await createNote(page, "Datum-test");

  await expect(page.locator(".drag-handle")).toHaveCount(1);

  await page.click('button[aria-label="Meer opties"]');
  await page.getByRole("button", { name: "Datum" }).click();
  // Niet de tab "Vandaag" in het hoofdmenu, maar de groepskop in de lijst.
  await expect(
    page.getByText("Vandaag", { exact: true }).and(page.locator("div")),
  ).toBeVisible();
  await expect(page.locator(".drag-handle")).toHaveCount(0);

  await page.getByRole("button", { name: "Eigen" }).click();
  await expect(page.locator(".drag-handle")).toHaveCount(1);
});

test("multi-select en bulk archiveren via de actiebalk", async ({ page }) => {
  await openLogbook(page);
  await createNote(page, "Bulk-A");
  await createNote(page, "Bulk-B");

  await page.click('button[aria-label="Meer opties"]');
  await page.click('button[aria-label="Selecteren"]');
  await page.getByText("Bulk-A", { exact: true }).click();
  await page.getByText("Bulk-B", { exact: true }).click();
  await expect(page.getByText("2 geselecteerd")).toBeVisible();

  await page.click('button[aria-label="Archiveren"]');

  await expect(page.getByText("Bulk-A", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Bulk-B", { exact: true })).toHaveCount(0);

  await page.click('button[aria-label="Meer opties"]');
  await page.click('button[aria-label="Archief"]');
  await expect(page.getByText("Bulk-A", { exact: true })).toBeVisible();
  await expect(page.getByText("Bulk-B", { exact: true })).toBeVisible();
});

test("multi-select en bulk verplaatsen naar een ander notitieboek", async ({
  page,
}) => {
  await openLogbook(page);
  await createNotebook(page, "Project");
  await page.getByRole("button").filter({ hasText: "Logboek" }).click();
  await createNote(page, "BulkMove-A");
  await createNote(page, "BulkMove-B");

  await page.click('button[aria-label="Meer opties"]');
  await page.click('button[aria-label="Selecteren"]');
  await page.getByText("BulkMove-A", { exact: true }).click();
  await page.getByText("BulkMove-B", { exact: true }).click();

  await page.click('button[aria-label="Verplaatsen naar…"]');
  // Binnen het blad zoeken: de notitieboek-tab heet ook "Project".
  await page
    .getByRole("dialog", { name: "Verplaatsen naar…" })
    .getByRole("button", { name: "Project" })
    .click();

  await expect(page.getByText("BulkMove-A", { exact: true })).toHaveCount(0);
  await expect(page.getByText("BulkMove-B", { exact: true })).toHaveCount(0);

  await page.getByRole("button").filter({ hasText: "Project" }).click();
  await expect(page.getByText("BulkMove-A", { exact: true })).toBeVisible();
  await expect(page.getByText("BulkMove-B", { exact: true })).toBeVisible();
});

test("slepen tijdens zoeken bewaart de relatieve volgorde van verborgen entries", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "DragTest-A");
  await createNote(page, "Other-B");
  await createNote(page, "DragTest-C");
  // Zonder handmatige sleep staan nieuwe entries nieuwste-eerst: C, B, A.

  await page.fill(
    'input[placeholder="Zoeken in notities en tags"]',
    "DragTest",
  );
  await expect(page.getByText("Other-B", { exact: true })).toHaveCount(0);

  // Sleep de zichtbare rij "DragTest-C" naar onder "DragTest-A" — "Other-B"
  // blijft buiten beeld, maar moet zijn relatieve plek t.o.v. "DragTest-A"
  // (waar 'ie voor stond) behouden.
  const cRow = page
    .locator('[data-srow="1"]')
    .filter({ hasText: "DragTest-C" });
  const aRow = page
    .locator('[data-srow="1"]')
    .filter({ hasText: "DragTest-A" });
  const handleBox = await cRow.locator(".drag-handle").boundingBox();
  const aBox = await aRow.boundingBox();

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    aBox.y + aBox.height / 2 + 5,
    { steps: 10 },
  );
  await page.mouse.up();
  await page.waitForTimeout(300);

  await page.fill('input[placeholder="Zoeken in notities en tags"]', "");

  const posB = await page.getByText("Other-B", { exact: true }).boundingBox();
  const posA = await page
    .getByText("DragTest-A", { exact: true })
    .boundingBox();
  const posC = await page
    .getByText("DragTest-C", { exact: true })
    .boundingBox();
  expect(posB.y).toBeLessThan(posA.y);
  expect(posA.y).toBeLessThan(posC.y);
});

test("rustig slepen aan het handvat start geen selectie", async ({ page }) => {
  await openLogbook(page);
  await createNote(page, "Hold-A");
  await createNote(page, "Hold-B");

  const bRow = page.locator('[data-srow="1"]').filter({ hasText: "Hold-B" });
  const aRow = page.locator('[data-srow="1"]').filter({ hasText: "Hold-A" });
  const handleBox = await bRow.locator(".drag-handle").boundingBox();
  const aBox = await aRow.boundingBox();
  const x = handleBox.x + handleBox.width / 2;

  // Vasthouden langer dan de long-press (450 ms) en dan pas bewegen.
  await page.mouse.move(x, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.move(x, aBox.y + aBox.height / 2 + 5, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  await expect(page.getByText(/geselecteerd/)).toHaveCount(0);
  const posA = await page.getByText("Hold-A", { exact: true }).boundingBox();
  const posB = await page.getByText("Hold-B", { exact: true }).boundingBox();
  expect(posA.y).toBeLessThan(posB.y);
});

test("tags kies je uit je bestaande tags; hoofdletters geven geen dubbele", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "Tag-A");
  await page.getByText("Tag-A", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  const input = page.getByRole("textbox", { name: "Tag toevoegen" });
  await input.fill("Studie");
  await input.press("Enter");
  await page.click('button[aria-label="Terug"]');
  await page.waitForTimeout(700);

  await createNote(page, "Tag-B");
  await page.getByText("Tag-B", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await input.fill("stu");
  // De bestaande tag staat als keuze klaar, met hoe vaak hij voorkomt.
  await page.getByRole("option", { name: /#Studie/ }).click();
  await input.fill("STUDIE");
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: /^Tag .* weghalen$/ }),
  ).toHaveCount(1);
  await page.click('button[aria-label="Terug"]');
  await page.waitForTimeout(700);

  await expect(page.getByRole("button", { name: "#Studie" })).toBeVisible();
  await expect(page.getByText("#STUDIE", { exact: true })).toHaveCount(0);
});

test("Alles toont notities uit alle notitieboeken, laatst bewerkt bovenaan", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "In-logboek");
  await createNotebook(page, "Studie2");
  await createNote(page, "In-studie");
  await page.getByRole("button", { name: "Alles", exact: true }).click();
  await expect(page.getByText("In-logboek", { exact: true })).toBeVisible();
  await expect(page.getByText("In-studie", { exact: true })).toBeVisible();
  const a = await page.getByText("In-studie", { exact: true }).boundingBox();
  const b = await page.getByText("In-logboek", { exact: true }).boundingBox();
  expect(a.y).toBeLessThan(b.y);
  // Op de kaart staat bij Alles het notitieboek erbij; slepen kan hier niet.
  await expect(page.getByText("Studie2 ·")).toBeVisible();
  await expect(page.locator(".drag-handle")).toHaveCount(0);
});
