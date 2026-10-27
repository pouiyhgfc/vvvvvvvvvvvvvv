---
paths:
  - "src/sw.js"
  - "vite.config.js"
  - "vercel.json"
  - "src/lib/notify.js"
---

# PWA, service worker en meldingen

- vite-plugin-pwa met **`strategies: "injectManifest"`** en een eigen `src/sw.js`. Niet overstappen op `generateSW`: dan verdwijnt de `notificationclick`-handler.
- `sw.js` precachet via `precacheAndRoute(self.__WB_MANIFEST)`; de `install`/`activate`/`notificationclick`-handlers blijven staan.
- Meldingen werken **alleen zolang de app open is** (30-secondeninterval in `notify.js`). Chrome heeft Notification Triggers stopgezet en er is bewust geen backend voor Web Push.
- Het manifest staat in `vite.config.js` (niet als los bestand). Iconen komen uit `public/`.
- `share_target` (`/share`) heeft een rewrite in `vercel.json` nodig; laat die staan.
