import { defineConfig } from "vitest/config";

// Los van vite.config.js, zodat de PWA-plugin niet meedraait in de unit-tests.
export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
    setupFiles: ["src/test/setup.js"],
    environment: "node",
  },
});
