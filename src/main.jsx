import '@fontsource-variable/outfit';
import '@fontsource-variable/dm-sans';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { migrateFromLocalStorage } from './lib/db.js';

(async () => {
  await migrateFromLocalStorage();
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
  createRoot(document.getElementById('root')).render(<App />);
})();
