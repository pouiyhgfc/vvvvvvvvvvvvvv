# Plan & Roadmap — van Routine Tracker naar persoonlijk life-OS

> Doel: één lokale app waarin je je hele leven kunt bijhouden (routines + planning + logboek + kennis/notities), die jij zelf makkelijk kunt uitbreiden. Notion-vervanging, maar dan gericht op jou.

---

## 0. Waar je nu staat (eerlijke herijking)

Je app is geen naïef prototype. Je hebt al:

- **Een build-stap** — `build.cmd` draait esbuild en bouwt `app.jsx` om naar geminificeerde `app.js`. Geen trage in-browser transpilatie.
- **Een echte PWA** — `manifest.json` (standalone, maskable icons) + `sw.js` (precache van shell, React-CDN en fonts, offline-fallback). Dus: installeerbaar op je beginscherm én offline.
- **Meldingen** — via Notification Triggers (`showTrigger`) in de service worker, met een interval-fallback terwijl de app open is.
- **Een volwassen feature-set** — tracker (ochtend/middag/avond, energie, mood, notities, ringen, streak), weekkalender met drag & drop, herhalende events, templates en weekschema-templates, maandheatmap, statistieken, focusgebieden met eigen kleuren, emoji-picker, en volledige backup/export/import.

**Conclusie:** het webfundament staat. De vraag is niet "is HTML genoeg", maar: hoe maak je dit onderhoudbaar en uitbreidbaar genoeg om je hele leven erop te draaien.

---

## 1. De echte knelpunten

1. **Onderhoudbaarheid.** Alles zit in één `app.jsx` van ~1766 regels. Bouwen is handmatig (`build.cmd`) en je moet handmatig de cache-versie in `sw.js` ophogen, anders laadt de oude app. Dit is de grootste rem op "zelf makkelijk veranderen".
2. **Datafundament.** `localStorage` werkt nu (KB's aan data), maar is synchroon, beperkt in omvang, en kan door de browser gewist worden. Zodra je een logboek en notities/kennisbank toevoegt — tekst die jaren meegroeit — wil je iets robuusters.
3. **Dev-workflow.** Geen hot reload tijdens het bouwen; elke wijziging = handmatig bouwen + uploaden. Voor vibecoden in VS Code wil je sneller kunnen itereren.

---

## 2. Aanbevolen architectuur

Geen herschrijving van je logica — wel een beter fundament eronder:

- **Vite + React** in plaats van losse esbuild + CDN. Geeft je hot reload (direct zien wat je verandert), automatisch gehashte bestandsnamen (nooit meer handmatig cache bumpen), en npm-dependencies in plaats van CDN-scripts.
- **vite-plugin-pwa** neemt je service worker en precache over — automatisch, geen handmatige `ASSETS`-lijst of versienummer meer.
- **Dexie (IndexedDB)** als datalaag, achter een dun `db`-moduletje. Groter, async, doorzoekbaar, en met `navigator.storage.persist()` zodat je data niet wordt weggegooid.
- **Modulestructuur** in `/src` zodat jij en Claude per onderdeel kunnen werken zonder de rest te raken.
- **Blijft lokaal** en blijft op Vercel deployen vanuit GitHub, precies zoals nu. Backup/export/import houden — dat is je veiligheidsnet.

Voorgestelde mappen:

```
src/
  main.jsx
  App.jsx
  lib/
    db.js          # Dexie: tabellen + migratie van localStorage
    date.js        # dk(), fmtDate(), getMonday() ...
    notify.js      # meldingenlogica
  hooks/
    useSortable.js
  features/
    tracker/       # dag-tracker
    planner/       # weekkalender + templates
    logbook/       # NIEUW
    notes/         # NIEUW
    stats/
    settings/
  ui/
    EmojiPicker.jsx, Ring.jsx, NavBtn.jsx ...
```

---

## 3. Datamodel (Dexie-tabellen)

Migreer je huidige `rt_*` sleutels één keer naar tabellen:

- `areas`, `routines`, `days` (checked / energy / mood / notes), `calEvents`, `calTemplates`, `weekTemplates`, `settings`.

Nieuw, voor de Notion-vervanging:

- `logEntries` — `{ id, date, body, tags[], mood, createdAt }`
- `notes` — `{ id, title, body (markdown), tags[], folder, links[], createdAt, updatedAt }`

Migratie: bij eerste start lees je alle bestaande `rt_day_*` en de losse sleutels uit `localStorage` en schrijf je ze naar Dexie. Daarna draait alles op IndexedDB; de oude data blijft als fallback staan tot je zeker weet dat het goed ging.

---

## 4. Nieuwe modules (waar je Notion voor gebruikte)

1. **Logboek** — een chronologische, doorzoekbare geschiedenis van je dagelijkse reflecties. Bouwt direct voort op de dag-notities die je nú al schrijft in de tracker. Kleinste stap, meteen nut.
2. **Notities / kennisbank** — markdown-notities met tags en (optioneel) mappen, plus zoeken en snelle invoer ("quick capture"). Dit is de kern van wat Notion voor je deed: je info op één plek, maar gericht en snel.
3. **(Later, optioneel)** — koppelingen tussen notities en je focusgebieden/routines, en een "Vandaag"-dashboard dat tracker, planning en logboek samenbrengt.

---

## 5. Meldingen — eerlijke verwachting

Wat je hebt werkt deels, en dat is geen bug van jou maar een platformgrens:

- Notification Triggers (`showTrigger`) is een **experimentele API, alleen in Chromium** (Chrome/Edge/Android). Niet in Safari/Firefox.
- Op **iPhone** vuren PWA-meldingen in de praktijk vrijwel alleen terwijl de app open is. Betrouwbare getimede achtergrond-herinneringen zijn een bekende zwakte van PWA's, vooral op iOS.

Opties, als je het écht betrouwbaar wilt:
- **Android, geïnstalleerd als app** geeft je nu de beste kans op achtergrondmeldingen.
- Pas later, als losse grote stap: een echt push-systeem (server + Web Push) of een native wrapper (Capacitor). Niet nu doen.
- Voor nu: houd wat je hebt en documenteer de grens, zodat je niet vertrouwt op iets dat op je telefoon misschien niet afgaat.

---

## 6. Gefaseerde roadmap

Elke fase eindigt met een werkende app + een commit + een deploy. Niets half af.

- **Fase 0 — Veiligheid.** Exporteer nu een volledige backup via je eigen knop. Zet de repo netjes onder Git met een commit van de huidige werkende versie. Maak een branch om in te werken.
- **Fase 1 — Fundament (geen nieuwe features).** Migreer naar Vite + vite-plugin-pwa. Splits `app.jsx` in de modules hierboven. Doel: exact dezelfde app, maar onderhoudbaar en met hot reload. Bevestig dat alle data nog intact is.
- **Fase 2 — Datalaag.** Introduceer Dexie achter een dunne `db`-module. Migreer `localStorage` → IndexedDB. Zet `persist()` aan. Backup/import laten doorwerken.
- **Fase 3 — Logboek.** Eerste echte Notion-vervanging, voortbouwend op je dag-notities.
- **Fase 4 — Notities / kennisbank.** Markdown, tags, zoeken, quick capture.
- **Fase 5 — Optioneel.** "Vandaag"-dashboard, koppelingen, en eventueel sync tussen telefoon en laptop (Dexie Cloud of een simpele export-sync).

---

## 7. Beslissingen voor jou (met mijn advies)

1. **Refactor naar Vite + modules?** → *Advies: ja.* Dit is dé sleutel tot "zelf makkelijk uitbreiden" en prettig vibecoden. Het is een investering van één fase, daarna gaat alles sneller.
2. **Eerst Logboek of eerst Notities?** → *Advies: Logboek eerst.* Kleinste stap vanaf wat je al hebt, direct bruikbaar.
3. **Strikt lokaal, of later sync tussen apparaten?** → *Advies: nu lokaal + backup; sync als losse latere fase.*
4. **Dexie meteen of pas later?** → *Advies: in Fase 2, dus net vóór je notities/logboek serieus gaan groeien.*

---

## 8. Werkwijze in VS Code + Claude

- Open de repo in VS Code en werk met Claude Code.
- Geef Claude dit plan + alleen het bestand waaraan je werkt. Werk **fase voor fase**, met een commit per stap.
- Vraag om kleine, geïsoleerde wijzigingen en test elke stap op je telefoon via een Vercel preview-deploy.
- Houd de huidige werkende app in een aparte branch tot Fase 1 helemaal staat — zo kun je altijd terug.
- Eerste concrete prompt-idee voor Claude Code: *"Zet dit project om naar Vite + React met vite-plugin-pwa, behoud exact het huidige gedrag en alle localStorage-data, en splits app.jsx in de modulestructuur uit PLAN.md. Verander nog geen functionaliteit."*
