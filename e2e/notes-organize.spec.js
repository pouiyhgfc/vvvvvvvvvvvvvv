import { test, expect } from "@playwright/test";

// Regressietests voor verplaatsen, datumgroepen, multi-select/bulkacties en
// slepen tijdens zoeken. Elke test start met een schone IndexedDB.

async function openLogbook(page) {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
}

async function createNote(page, title) {
  await page.getByRole("button", { name: "+ Nieuw" }).click();
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
    .selectOption({ label: "📓 Werk" });
  await page.waitForTimeout(300);
  await page.click('button[aria-label="Terug"]');

  await expect(page.getByText("Move-test", { exact: true })).toHaveCount(0);

  await page.getByRole("button").filter({ hasText: "Werk" }).click();
  await expect(page.getByText("Move-test", { exact: true })).toBeVisible();
});

test("Datum-modus toont groepskoppen en geen sleephandvatten", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "Datum-test");

  await expect(page.locator(".drag-handle")).toHaveCount(1);

  await page.getByRole("button", { name: "Datum" }).click();
  await expect(page.getByText("Vandaag", { exact: true })).toBeVisible();
  await expect(page.locator(".drag-handle")).toHaveCount(0);

  await page.getByRole("button", { name: "Eigen" }).click();
  await expect(page.locator(".drag-handle")).toHaveCount(1);
});

test("multi-select en bulk archiveren via de actiebalk", async ({ page }) => {
  await openLogbook(page);
  await createNote(page, "Bulk-A");
  await createNote(page, "Bulk-B");

  await page.click('button[aria-label="Selecteren"]');
  await page.getByText("Bulk-A", { exact: true }).click();
  await page.getByText("Bulk-B", { exact: true }).click();
  await expect(page.getByText("2 geselecteerd")).toBeVisible();

  await page.click('button[aria-label="Archiveren"]');

  await expect(page.getByText("Bulk-A", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Bulk-B", { exact: true })).toHaveCount(0);

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

  await page.click('button[aria-label="Selecteren"]');
  await page.getByText("BulkMove-A", { exact: true }).click();
  await page.getByText("BulkMove-B", { exact: true }).click();

  await page.click('button[aria-label="Verplaatsen naar…"]');
  // Scopen op <span>: de notitieboek-tab is ook een element met tekst
  // "Project" (een <button>), dus getByText zou ambigu zijn.
  await page.locator("span").filter({ hasText: "Project" }).click();

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

  await page.fill('input[placeholder="Zoek in tekst of tags..."]', "DragTest");
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

  await page.fill('input[placeholder="Zoek in tekst of tags..."]', "");

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
