import { defineConfig, devices } from "@playwright/test";

// E2E-regressietests voor de rijke editor. Draait tegen de Vite dev-server;
// hergebruikt een al draaiende server als die er is.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://localhost:5173" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
