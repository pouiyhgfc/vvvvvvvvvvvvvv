# Uitvoering & Roadmap (levend document)

> Companion bij `PLAN.md` (het waarom) en `CLAUDE.md` (de vaste regels).
>
> **Hoe dit document werkt:**
> - De **vakjes** `- [ ]` zijn je voortgang. Klaar en gecontroleerd → `- [x]`.
> - **💡 Ideeën & Backlog** is de parkeerplaats voor nieuwe ideeën. Brainstorm je iets? Zeg het tegen Claude; hij zet het hier neer als onaangevinkt punt. Wil je het uitwerken? Dan maakt hij er onderaan een volledige fase van (met prompt + controle).
> - Claude houdt dit bestand bij volgens de regels in `CLAUDE.md` (sectie "Documentatie bijhouden").

**Status — huidige fase:** _Fase 0, nog niet begonnen._ (Claude werkt deze regel bij.)

---

## 💡 Ideeën & Backlog

> Onaangevinkte ideeën die nog geen volledige fase zijn. Volgorde = ongeveer prioriteit, maar niets is verplicht.

- [ ] **"Vandaag"-dashboard** — startscherm dat tracker-voortgang, planning van vandaag en snelle logboek-invoer samenbrengt.
- [ ] **Koppelingen** — notities/logboek linken aan focusgebieden of routines.
- [ ] **Globaal zoeken** — één zoekbalk over logboek + notities tegelijk.
- [ ] **Commandopalet** — snel naar elk onderdeel of elke notitie springen.
- [ ] **Hifd-module** — je memorisatiesysteem als aparte feature op deze datalaag.
- [ ] **Sync telefoon ↔ laptop** — pas als je het echt nodig hebt (Dexie Cloud of export/import-flow).
- [ ] **Betrouwbaardere meldingen** — Android-installatie of later Capacitor-wrapper.
- [ ] **Automatische backup-herinnering** — maandelijkse prompt om te exporteren.

_Nieuw idee toevoegen? Vraag Claude: "zet dit als idee in de backlog van UITVOERING.md." Uitwerken? Vraag: "werk backlog-idee X uit tot een volledige fase onderaan."_

---

## Belangrijk vooraf: de gekozen tooling (en waarom)

- **Vite (v7 of v8, de nieuwste)** als build-tool. Vraagt **Node 20.19+ of 22.12+** — check met `node -v`. Zo niet, eerst Node updaten.
- **@vitejs/plugin-react** voor JSX + hot reload.
- **vite-plugin-pwa met `strategies: 'injectManifest'`.** Cruciaal: de standaard (`generateSW`) genereert een eigen service worker en dan verlies je je `notificationclick`-handler. Met `injectManifest` houd je je éígen service worker.
- **Dexie 4 + dexie-react-hooks** voor data (pas vanaf Fase 2).
- **@fontsource** om Outfit + DM Sans lokaal mee te bundelen i.p.v. via Google Fonts (privacy-winst).

**Volgorde van de fasen:** eerst 1-op-1 naar Vite porten (1a), dán opsplitsen in modules (1b). Eén ding per keer, steeds testen.

---

## Fase 0 — Veiligheidsnet (geen code)

**Doel:** een backup en een vast terugvalpunt.

1. Open je huidige app → **Instellingen → Exporteer alles**. Bewaar die JSON veilig (niet alleen op je telefoon).
2. In VS Code:

```
git add -A
git commit -m "Werkende versie vóór Vite-migratie"
git checkout -b vite-migratie
```

**Controle (afvinken):**
- [ ] Backup geëxporteerd en veilig bewaard
- [ ] Werkende versie gecommit op `main`
- [ ] Op branch `vite-migratie` (check met `git branch`)

- [ ] **Fase 0 afgerond**

---

## Fase 1a — Omzetten naar Vite (zelfde gedrag, niks nieuws)

**Doel:** exact dezelfde app, maar op Vite, met React + fonts lokaal en je PWA via vite-plugin-pwa. Nog steeds localStorage, nog steeds één bestand.

**Prompt voor Claude Code:**

```
Ik wil dit project omzetten naar Vite + React, met behoud van exact het
huidige gedrag. Lees eerst index.html, app.jsx, sw.js, manifest.json en
build.cmd zodat je het huidige opzet snapt.

Doe daarna het volgende:
1. Zet een Vite + React project op in deze repo (npm create vite, React-
   template, JavaScript). Behoud de bestaande repo en Git-historie.
2. Verplaats mijn app naar de Vite-structuur: app.jsx wordt het React-
   ingangspunt. Vervang het globale React-gebruik (const {useState}=React)
   door echte ES-imports (import React, { useState, useEffect, useRef }
   from 'react') en vervang ReactDOM.render door createRoot uit
   react-dom/client.
3. Haal de twee React-CDN <script>-tags uit index.html; React komt nu uit npm.
4. Vervang de Google Fonts <link> door @fontsource: installeer
   @fontsource/outfit en @fontsource/dm-sans en importeer de juiste gewichten
   in het ingangspunt. Geen externe font-verzoeken meer.
5. Configureer vite-plugin-pwa met strategies: 'injectManifest', zodat mijn
   bestaande sw.js behouden blijft. Pas sw.js aan zodat de app-shell wordt
   geprecached via precacheAndRoute(self.__WB_MANIFEST) van workbox-
   precaching (voeg workbox-precaching als dev-dependency toe), maar BEHOUD
   mijn notificationclick-handler en de activate/claim-logica. De handmatige
   ASSETS-lijst en het vaste cache-versienummer mogen weg.
6. Zet registerType op 'autoUpdate' en injectRegister op 'auto'. Neem mijn
   manifest-gegevens en iconen (icon.svg, icon-192.png, icon-512.png) over.
7. Verander GEEN functionaliteit en GEEN localStorage-sleutels (rt_routines,
   rt_areas, rt_day_*, rt_cal_templates, rt_cal_events,
   rt_week_schedule_tpls, rt_settings, rt_notified_*).
8. Werk package.json bij met dev/build/preview scripts en leg kort uit hoe ik
   de app lokaal draai.

Leg na afloop kort uit welke bestanden je hebt gewijzigd en hoe ik
'npm install' en 'npm run dev' draai.
```

**Wat het doet:** maakt het Vite-fundament, haalt externe CDN-verzoeken weg (React + fonts lokaal), en zet je service worker om naar de vite-plugin-pwa-manier zónder je meldingen te verliezen.

**Controle (afvinken):**
- [ ] `npm install` + `npm run dev` → app ziet er identiek uit, alle tabbladen werken
- [ ] Bestaande routines/dagdata staan er nog
- [ ] `npm run build` slaagt en maakt `dist/`
- [ ] Service worker geregistreerd (DevTools → Application → Service Workers)

**Als het breekt:** witte pagina → console checken (meestal vergeten import); oude versie hangt → service worker "Unregister" + hard refresh; twijfel over data → je backup importeren.

**Commit:**

```
git add -A
git commit -m "Fase 1a: omgezet naar Vite + PWA, fonts en React lokaal"
```

- [ ] **Fase 1a afgerond en gecommit**

---

## Tussenstap — Vercel goed zetten

**Doel:** Vercel moet nu bouwen i.p.v. losse bestanden serveren.

In Vercel-projectinstellingen: **Build Command** = `npm run build`, **Output Directory** = `dist` (meestal auto-gedetecteerd — controleer het). Blijf op **dezelfde URL/het zelfde project**, zodat je localStorage-data behouden blijft.

**Controle (afvinken):**
- [ ] Build Command + Output Directory kloppen in Vercel
- [ ] Preview-deploy werkt op je telefoon
- [ ] Zelfde URL als voorheen (data behouden)

---

## Fase 1b — Opsplitsen in modules

**Doel:** het grote bestand opdelen, zodat je later makkelijk per onderdeel werkt. Geen gedragswijziging.

**Prompt voor Claude Code:**

```
Splits het grote app-bestand op in een nette modulestructuur, zonder enige
gedragswijziging. Gebruik deze indeling:

src/
  main.jsx            (ingangspunt + createRoot)
  App.jsx             (hoofdcomponent + tab-navigatie)
  lib/date.js         (dk, fmtDate, isToday, getMonday, uid)
  lib/storage.js      (loadJSON, saveJSON + alle localStorage-sleutels als
                       constanten op één plek)
  lib/notify.js       (de meldingen-logica)
  lib/constants.js    (DEFAULT_ROUTINES, DEFAULT_AREAS,
                       DEFAULT_CAL_TEMPLATES, MOODS, kleuren,
                       EMOJI_CATEGORIES, enz.)
  hooks/useSortable.js
  features/tracker/   (de dag-tracker-weergave)
  features/planner/   (WeekView + EventModal + week-template-logica)
  features/month/     (MonthView)
  features/stats/     (StatsView)
  features/settings/  (de instellingen-weergave)
  ui/                 (EmojiPicker, Ring, NavBtn, DragHandle, sorteerlijsten)

Verplaats code letterlijk, voeg alleen de juiste import/export toe. Verander
geen logica, geen styling, geen localStorage-sleutels. Werk in kleine stappen
en zeg na elke verplaatsing of de app nog bouwt.
```

**Wat het doet:** verandert niets aan wat de app dóét; verdeelt alleen de code over logische mappen.

**Controle (afvinken):**
- [ ] `npm run dev` → alles werkt nog identiek (elk tabblad nagekeken)
- [ ] `npm run build` slaagt

**Als het breekt:** bijna altijd een verkeerde import/export — de console wijst het bestand aan; alleen die stap terugdraaien.

**Commit:**

```
git add -A
git commit -m "Fase 1b: app opgesplitst in modules"
```

- [ ] **Fase 1b afgerond en gecommit**

---

## Fase 2 — Data naar Dexie (IndexedDB)

**Doel:** datafundament klaar voor groei, met eenmalige migratie van localStorage en bescherming tegen wissen.

**Prompt voor Claude Code:**

```
Voeg Dexie toe als datalaag, met een veilige eenmalige migratie vanaf
localStorage. Installeer dexie en dexie-react-hooks.

1. Maak lib/db.js met een Dexie-database en tabellen afgeleid van mijn
   huidige localStorage-model: settings, areas, routines, days (sleutel =
   datum 'YYYY-MM-DD'; velden checked, energy, mood, notes), calEvents,
   calTemplates, weekTemplates. Kies passende indexen.
2. Maak een migratiefunctie die bij de allereerste start controleert of er al
   gemigreerd is (vlag in Dexie). Zo niet: lees alle rt_*-sleutels uit
   localStorage en schrijf ze naar Dexie. Laat de localStorage-data staan als
   fallback; verwijder niets.
3. Vervang loadJSON/saveJSON door Dexie-lezen/schrijven. Gebruik useLiveQuery
   zodat componenten automatisch re-renderen. Gedrag exact hetzelfde houden.
4. Vraag bij start eenmalig navigator.storage.persist() aan.
5. Werk Exporteer/Importeer bij zodat ze vanuit/naar Dexie werken (zelfde
   JSON-formaat waar mogelijk, zodat oude backups importeerbaar blijven).

Verander geen UI en geen functionaliteit; alleen waar de data vandaan komt.
Laat me na de migratiestap eerst controleren of mijn data correct is
overgekomen, vóór je verder gaat.
```

**Wat het doet:** verhuist data van localStorage naar IndexedDB (groot, doorzoekbaar, met `persist()` beschermd). De migratie zorgt dat je niets kwijtraakt.

**Controle (afvinken):**
- [ ] Na migratie: alle routines, dagdata, events en instellingen staan er nog
- [ ] DevTools → Application → IndexedDB → tabellen bevatten data
- [ ] Iets aanpassen werkt en blijft staan na verversen
- [ ] Backup-export bekeken en klopt

**Als het breekt:** localStorage staat er nog (fallback) + je export; migratie opnieuw na het wissen van de vlag.

**Commit:**

```
git add -A
git commit -m "Fase 2: data naar Dexie (IndexedDB) met migratie en persist"
```

- [ ] **Fase 2 afgerond en gecommit**

---

## Fase 3 — Logboek (eerste Notion-vervanging)

**Doel:** doorzoekbare geschiedenis van je dagelijkse reflecties, voortbouwend op de dag-notities die je al schrijft.

**Prompt voor Claude Code:**

```
Bouw een Logboek-module in features/logbook/, geïntegreerd met de bestaande
Dexie-database.

- Voeg tabel logEntries toe: { id, date, body, tags[], mood, createdAt }.
- Tabblad 'Logboek' in dezelfde stijl als de bestaande tabs.
- Toon entries chronologisch (nieuwste boven), met zoekbalk (body + tags) en
  een eenvoudige tagfilter.
- Toevoegen, bewerken, verwijderen.
- Koppel aan de bestaande dag-notitie: een notitie bij een dag in de tracker
  is ook hier als entry van die datum zichtbaar/bewerkbaar (één bron van
  waarheid, geen dubbele opslag).
- Gebruik useLiveQuery zodat de lijst live meebeweegt.

Stijl consistent met de rest. Raak andere modules niet aan.
```

**Controle (afvinken):**
- [ ] Toevoegen/bewerken/verwijderen werkt
- [ ] Zoeken + tagfilter werken
- [ ] Dag-notitie uit tracker verschijnt in logboek
- [ ] Blijft staan na verversen

**Commit:**

```
git add -A
git commit -m "Fase 3: Logboek-module"
```

- [ ] **Fase 3 afgerond en gecommit**

---

## Fase 4 — Notities / kennisbank

**Doel:** je info op één gerichte plek (de kern van wat Notion voor je deed): markdown-notities met tags, mappen en zoeken.

**Prompt voor Claude Code:**

```
Bouw een Notities/kennisbank-module in features/notes/, op de bestaande
Dexie-database.

- Tabel notes: { id, title, body (markdown), tags[], folder, createdAt,
  updatedAt }.
- Tabblad 'Notities'. Lijst met zoeken (titel + body + tags) en filteren op
  map/tag.
- Maken/bewerken/verwijderen, met markdown-weergave (lichte renderer, geen
  zware dependency).
- 'Snelle notitie' (quick capture): één knop om snel iets vast te leggen.
- useLiveQuery voor live bijwerken.

Stijl consistent met de rest. Raak andere modules niet aan.
```

**Controle (afvinken):**
- [ ] Maken/bewerken/verwijderen werkt
- [ ] Markdown wordt netjes getoond
- [ ] Zoeken/filteren werkt
- [ ] Quick capture werkt
- [ ] Blijft staan na verversen

**Commit:**

```
git add -A
git commit -m "Fase 4: Notities/kennisbank-module"
```

- [ ] **Fase 4 afgerond en gecommit**

---

## Sjabloon voor een nieuwe fase

> Claude vult dit in wanneer je een backlog-idee laat uitwerken. Kopieer en plaats onderaan, geef het een nummer.

```
## Fase N — <naam>

**Doel:** <wat het oplevert, in één zin>

**Prompt voor Claude Code:**
<de concrete prompt>

**Wat het doet:** <korte uitleg>

**Controle (afvinken):**
- [ ] <controlepunt>
- [ ] <controlepunt>

**Commit:**
git add -A
git commit -m "Fase N: <korte omschrijving>"

- [ ] **Fase N afgerond en gecommit**
```

---

## Gouden regels tijdens het bouwen

1. Eén fase per keer; vink pas af en commit als de controle slaagt.
2. Geef Claude steeds alleen de relevante module + dit bestand.
3. Kleine, geïsoleerde wijzigingen; test elke stap op je telefoon via de Vercel-preview.
4. Verander nooit functionaliteit én structuur tegelijk.
5. Blijf op dezelfde Vercel-URL, en houd je laatste export als vangnet.
