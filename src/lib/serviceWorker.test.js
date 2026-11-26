import { beforeEach, expect, test, vi } from "vitest";

const registerSW = vi.fn();
vi.mock("virtual:pwa-register", () => ({ registerSW }));
const platform = { isNativeApp: false };
vi.mock("./platform.js", () => platform);

const unregister = vi.fn(async () => true);
const cacheDelete = vi.fn(async () => true);
vi.stubGlobal("navigator", {
  serviceWorker: { getRegistrations: async () => [{ unregister }] },
});
vi.stubGlobal("caches", {
  keys: async () => ["workbox-precache-v2"],
  delete: cacheDelete,
});

const { setupServiceWorker } = await import("./serviceWorker.js");

beforeEach(() => vi.clearAllMocks());

test("in de PWA wordt de service worker geregistreerd", async () => {
  platform.isNativeApp = false;
  await setupServiceWorker();
  expect(registerSW).toHaveBeenCalled();
  expect(unregister).not.toHaveBeenCalled();
});

// Was een bug: in de Android-app serveerde een oude service worker na een
// update nog de vorige versie van de app.
test("in de Android-app wordt een oude service worker opgeruimd", async () => {
  platform.isNativeApp = true;
  await setupServiceWorker();
  expect(registerSW).not.toHaveBeenCalled();
  expect(unregister).toHaveBeenCalled();
  expect(cacheDelete).toHaveBeenCalledWith("workbox-precache-v2");
});
