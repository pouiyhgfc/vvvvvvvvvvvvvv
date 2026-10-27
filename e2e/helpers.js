import { expect } from "@playwright/test";
import { NOW, demoBackup } from "./fixtures/demo.js";

// Opent een nav-tab onderin (Dag, Week, Stats, Notities, Hifd, Config).
export async function openTab(page, label) {
  await page.getByRole("button").filter({ hasText: label }).first().click();
}

// Zet de klok vast, laadt de app en zet de demodata terug via de echte
// import-flow (Config → Backup & Data → Importeer → Volledig vervangen).
// "Backup & Data" staat standaard open, dus het bestandsveld is er meteen.
export async function loadDemo(page, options) {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await openTab(page, "Config");
  await page.locator('input[type="file"]').setInputFiles({
    name: "demo-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(demoBackup(options))),
  });
  await page.getByRole("button", { name: "Volledig vervangen" }).click();
  await expect(page.getByText(/Import gelukt/)).toBeVisible();
  await expect(page.getByText(/Import gelukt/)).toBeHidden({ timeout: 10_000 });
  await openTab(page, "Config"); // instellingen weer sluiten
}

// Wacht tot fonts en emoji-SVG's binnen zijn, zodat een screenshot stabiel is.
export async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
