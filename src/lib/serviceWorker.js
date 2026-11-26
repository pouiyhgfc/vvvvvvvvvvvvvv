import { registerSW } from "virtual:pwa-register";
import { isNativeApp } from "./platform.js";

// In de PWA zorgt de service worker voor offline werken en meldingen. In de
// Android-app staan de bestanden al in de app zelf; een service worker zou
// daar na een update nog de oude versie tonen. Daar ruimen we hem op.
export async function setupServiceWorker() {
  if (!isNativeApp) {
    registerSW({ immediate: true });
    return;
  }
  if (!navigator.serviceWorker) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  for (const key of await caches.keys()) await caches.delete(key);
}
