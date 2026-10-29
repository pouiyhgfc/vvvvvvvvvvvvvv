import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/noto-naskh-arabic";
import "./styles/base.css";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ToastHost from "./ui/Toast.jsx";
import {
  markExistingInstall,
  migrateFromLocalStorage,
  migrateNotesToLogEntries,
  migrateNotesOrderV1,
  seedHifd,
  migrateHifdSrsV2,
  purgeTrash,
  fillSearchText,
} from "./lib/db.js";
import { runStartup } from "./lib/startup.js";

// Volgorde is belangrijk: elke stap bouwt voort op de vorige.
const STARTUP_STEPS = [
  ["bestaande installatie herkennen", markExistingInstall],
  ["gegevens overzetten naar de database", migrateFromLocalStorage],
  ["dagnotities naar het logboek", migrateNotesToLogEntries],
  ["volgorde van notities", migrateNotesOrderV1],
  ["Hifd-lijst aanmaken", seedHifd],
  ["Hifd-revisieschema bijwerken", migrateHifdSrsV2],
  ["prullenbak opschonen", purgeTrash],
  ["zoektekst van notities", fillSearchText],
];

(async () => {
  const startupErrors = await runStartup(STARTUP_STEPS);
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
  // ToastHost buiten App: blijft staan als App wisselt tussen welkomstscherm
  // en de app zelf (anders valt een melding als "Import gelukt" weg).
  createRoot(document.getElementById("root")).render(
    <>
      <App startupErrors={startupErrors} />
      <ToastHost />
    </>,
  );
})();
