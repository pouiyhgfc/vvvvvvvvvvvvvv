import { test, expect } from "@playwright/test";

// Regressietests voor vastzetten, archief en prullenbak in het Logboek.
// Elke test start met een schone IndexedDB (nieuwe browsercontext).

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

// Klikt de bevestigknop in de (gescopede) ConfirmDialog, om verwarring met
// gelijknamige knoppen op de achterliggende pagina te voorkomen.
function confirmDialogButton(page, name) {
  return page.getByRole("alertdialog").getByRole("button", { name });
}

test("vastzetten toont de entry in de Vastgezet-sectie en overleeft herladen", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "Pin-test-A");
  await createNote(page, "Pin-test-B");

  await page.getByText("Pin-test-A", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await page.click('button[aria-label="Vastzetten"]');
  await page.click('button[aria-label="Terug"]');

  await expect(page.getByText("Vastgezet", { exact: true })).toBeVisible();
  const posA = await page
    .getByText("Pin-test-A", { exact: true })
    .boundingBox();
  const posB = await page
    .getByText("Pin-test-B", { exact: true })
    .boundingBox();
  expect(posA.y).toBeLessThan(posB.y);

  // Reload zet de app-view terug op het standaardtabblad (Dag) — opnieuw
  // naar Notities navigeren voordat we de lijst controleren.
  await page.reload();
  await page.getByRole("button").filter({ hasText: "Notities" }).click();
  await expect(page.getByText("Vastgezet", { exact: true })).toBeVisible();
  const posA2 = await page
    .getByText("Pin-test-A", { exact: true })
    .boundingBox();
  const posB2 = await page
    .getByText("Pin-test-B", { exact: true })
    .boundingBox();
  expect(posA2.y).toBeLessThan(posB2.y);
});

test("archiveren haalt de entry uit de lijst; herstellen zet 'm terug", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "Archive-test");

  await page.getByText("Archive-test", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await page.click('button[aria-label="Archiveren"]');

  await expect(page.getByText("Archive-test", { exact: true })).toHaveCount(0);

  await page.click('button[aria-label="Archief"]');
  await expect(page.getByText("Archief")).toBeVisible();
  await expect(page.getByText("Archive-test", { exact: true })).toBeVisible();

  await page.click('button[aria-label="Terugzetten"]');
  await page.click('button[aria-label="Sluiten"]');

  await expect(page.getByText("Archive-test", { exact: true })).toBeVisible();
});

test("verwijderen gaat naar de prullenbak; herstellen en definitief verwijderen werken", async ({
  page,
}) => {
  await openLogbook(page);
  await createNote(page, "Trash-test");

  await page.getByText("Trash-test", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await page.click('button[aria-label="Naar prullenbak"]');
  await confirmDialogButton(page, "Naar prullenbak").click();

  await expect(page.getByText("Trash-test", { exact: true })).toHaveCount(0);

  await page.click('button[aria-label="Prullenbak"]');
  await expect(
    page.getByRole("heading", { name: "Prullenbak", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Trash-test", { exact: true })).toBeVisible();

  await page.click('button[aria-label="Herstellen"]');
  await page.click('button[aria-label="Sluiten"]');
  await expect(page.getByText("Trash-test", { exact: true })).toBeVisible();

  // Opnieuw naar de prullenbak, en nu definitief verwijderen.
  await page.getByText("Trash-test", { exact: true }).click();
  await page.waitForSelector(".ProseMirror");
  await page.click('button[aria-label="Naar prullenbak"]');
  await confirmDialogButton(page, "Naar prullenbak").click();

  await page.click('button[aria-label="Prullenbak"]');
  await page.click('button[aria-label="Definitief verwijderen"]');
  await confirmDialogButton(page, "Verwijderen").click();

  await expect(page.getByText("Trash-test", { exact: true })).toHaveCount(0);
});

test("prullenbak legen verwijdert alle items definitief", async ({ page }) => {
  await openLogbook(page);
  await createNote(page, "Empty-test-1");
  await createNote(page, "Empty-test-2");

  for (const title of ["Empty-test-1", "Empty-test-2"]) {
    await page.getByText(title, { exact: true }).click();
    await page.waitForSelector(".ProseMirror");
    await page.click('button[aria-label="Naar prullenbak"]');
    await confirmDialogButton(page, "Naar prullenbak").click();
  }

  await page.click('button[aria-label="Prullenbak"]');
  await page.getByRole("button", { name: "Prullenbak legen" }).click();
  await confirmDialogButton(page, "Verwijderen").click();

  await expect(page.getByText("Prullenbak is leeg.")).toBeVisible();
});

test("een verwijderde 'vandaag'-entry verdwijnt uit het widget op Dag", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Nieuw logboek voor vandaag aanmaken"),
  ).toBeVisible();

  await page.getByText("Nieuw logboek voor vandaag aanmaken").click();
  await page.waitForSelector(".ProseMirror");
  await page.click(".ProseMirror");
  await page.keyboard.type("Test-inhoud voor vandaag");
  await page.click('button[aria-label="Terug"]');
  await page.waitForTimeout(700);

  await expect(page.getByText("Logboek voor vandaag openen")).toBeVisible();

  await page.getByText("Logboek voor vandaag openen").click();
  await page.waitForSelector(".ProseMirror");
  await page.click('button[aria-label="Naar prullenbak"]');
  await confirmDialogButton(page, "Naar prullenbak").click();

  await expect(
    page.getByText("Nieuw logboek voor vandaag aanmaken"),
  ).toBeVisible();
});
