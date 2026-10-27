import { expect } from "@playwright/test";
import { NOW, demoBackup } from "./fixtures/demo.js";

// Opent een tab in de tabbalk onderin (Vandaag, Planning, Notities, Hifd,
// Meer). "Statistieken" zit onder Meer.
export async function openTab(page, label) {
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  if (label === "Statistieken") {
    await nav.getByRole("button", { name: "Meer" }).click();
    await page.getByRole("button", { name: /Statistieken/ }).click();
    return;
  }
  await nav.getByRole("button", { name: label }).click();
}

// Zet de klok vast, laadt de app en zet de demodata terug via de echte
// import-flow (Config → Backup & Data → Importeer → Volledig vervangen).
export async function loadDemo(page, options) {
  await importBackup(page, demoBackup(options));
}

// Importeert een backup-object via de UI. "Backup & Data" staat standaard
// open, dus het bestandsveld is er meteen.
export async function importBackup(page, backup) {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await openTab(page, "Meer");
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Volledig vervangen" }).click();
  await expect(page.getByText(/Import gelukt/)).toBeVisible();
  await expect(page.getByText(/Import gelukt/)).toBeHidden({ timeout: 10_000 });
  await openTab(page, "Vandaag");
}

// Wacht tot fonts en emoji-SVG's binnen zijn, zodat een screenshot stabiel is.
export async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

// Klikt "Exporteer alles" en geeft de gedownloade backup terug als object.
export async function exportBackup(page) {
  await openTab(page, "Meer");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exporteer alles/ }).click();
  const file = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(file, "utf8"));
}
