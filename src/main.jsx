import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/schibsted-grotesk";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { migrateFromLocalStorage, migrateNotesToLogEntries } from "./lib/db.js";

(async () => {
  await migrateFromLocalStorage();
  await migrateNotesToLogEntries();
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
  createRoot(document.getElementById("root")).render(<App />);
})();
