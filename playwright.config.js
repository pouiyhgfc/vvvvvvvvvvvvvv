import { defineConfig, devices } from "@playwright/test";

// Twee projecten tegen de Vite dev-server (hergebruikt een draaiende server):
// - "chromium": functionele e2e-tests op desktop (`npm run test:e2e`).
// - "mobiel": screenshot-nulmeting op telefoonformaat (`npm run test:visual`).
//   Alleen in de cloud-sessie draaien, waar de baselines gemaakt zijn: op
//   andere machines (Windows, macOS, GitHub Actions) renderen fonts een paar
//   pixels anders en falen de vergelijkingen onterecht.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // In CI ook als GitHub-annotaties, zodat fouten direct bij de run staan.
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:5173" },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: {
    // Streng: baselines komen uit dezelfde omgeving, dus elke kleur telt.
    toHaveScreenshot: {
      animations: "disabled",
      threshold: 0.02,
      maxDiffPixelRatio: 0.001,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /visual\.spec\.js/,
    },
    {
      name: "mobiel",
      use: {
        ...devices["Pixel 7"],
        locale: "nl-NL",
        timezoneId: "Asia/Taipei",
      },
      testMatch: /visual\.spec\.js/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
