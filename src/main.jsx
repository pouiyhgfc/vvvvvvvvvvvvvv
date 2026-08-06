import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/schibsted-grotesk";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import {
  migrateFromLocalStorage,
  migrateNotesToLogEntries,
  migrateNotesOrderV1,
  seedHifd,
  migrateHifdSrsV2,
  purgeTrash,
} from "./lib/db.js";

(async () => {
  await migrateFromLocalStorage();
  await migrateNotesToLogEntries();
  await migrateNotesOrderV1();
  await seedHifd();
  await migrateHifdSrsV2();
  await purgeTrash();
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
  createRoot(document.getElementById("root")).render(<App />);
})();
