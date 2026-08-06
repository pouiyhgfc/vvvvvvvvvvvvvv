# Uitvoering & Roadmap (levend document)

> Companion bij `PLAN.md` (het waarom) en `CLAUDE.md` (de vaste regels).
>
> **Hoe dit document werkt:**
>
> - De **vakjes** `- [ ]` zijn je voortgang. Klaar en gecontroleerd → `- [x]`.
> - **💡 Ideeën & Backlog** is de parkeerplaats voor nieuwe ideeën. Brainstorm je iets? Zeg het tegen Claude; hij zet het hier neer als onaangevinkt punt. Wil je het uitwerken? Dan maakt hij er onderaan een volledige fase van (met prompt + controle).
> - Claude houdt dit bestand bij volgens de regels in `CLAUDE.md` (sectie "Documentatie bijhouden").

**Status — huidige fase:** _Notities beter organiseren — vastzetten, archief/prullenbak (zacht verwijderen, 30 dagen bewaartermijn), verplaatsen tussen notitieboeken (los en bulk), datumgroepen naast de handmatige sleepvolgorde, multi-select met bulkacties, en slepen dat nu ook tijdens zoeken/filteren de volgorde van verborgen entries intact laat. Build/lint/20× e2e schoon. Zie de fase onderaan. Daarvóór:_ _Editor-stabiliteit — `blocksToMarkdownLossy().then`-fout gefixt (brak de markdown-input-rules); Enter-dataverlies gediagnosticeerd als standaard "selectie-vervangen" (vangnet = ↩ undo). Playwright-e2e toegevoegd (`npm run test:e2e`, 3 regressietests). Daarvóór: editor-bugfixes — robuust kopiëren (tabel via HTML + meervoudige selectie), tekst-secties verborgen voor tabellen, undo/redo (↶/↷), "Reflectie"-sjabloon bij het dagelijkse logboek, ConfirmDialog-import hersteld. Build/lint/e2e schoon. Zie de fasen onderaan. Nog eerder:_ _Touch blok-handvat (⠿) gebouwd — de vervanger voor de teruggedraaide `MobileToolbar`. Eigen handvat bij het actieve blok (BlockNote's zijmenu is hover-only + native HTML5-drag → touch-dood): **tik** = bottom-sheet met blok-acties (turn into / dupliceren / kopiëren / omhoog-omlaag / kleur / opmaak / tabel-acties / verwijderen), **ingedrukt houden** = vrij verslepen met ghost + drop-indicator. Plus: dode merge-knop gerepareerd (`tables`-optie aan), private tabel-API ingekapseld (`tableCommands.js`), gedeelde editor-acties (`editorActions.js`), betrouwbare "/"-ingang via "+"-knop, grotere kolom-resize-hitzone. Build/lint/deadcode schoon. **Wacht op verificatie op een echt Android-toestel** (handvat-positie, tik vs long-press, verslepen, "/"). Zie `.md/PLAN-NOTION-EDITOR.md` + `.md/STAPPENPLAN-NOTION-EDITOR.md`._

---

## 💡 Ideeën & Backlog

> Onaangevinkte ideeën die nog geen volledige fase zijn. Volgorde = ongeveer prioriteit, maar niets is verplicht.

- [ ] **"Vandaag"-dashboard** — startscherm dat tracker-voortgang, planning van vandaag en snelle logboek-invoer samenbrengt.
- [ ] **Koppelingen** — notities/logboek linken aan focusgebieden of routines.
- [ ] **Globaal zoeken** — één zoekbalk over logboek + notities tegelijk.
- [ ] **Commandopalet** — snel naar elk onderdeel of elke notitie springen.
- [x] **Hifd-module** — je memorisatiesysteem als aparte feature op deze datalaag.
- [ ] **Sync telefoon ↔ laptop** — pas als je het echt nodig hebt (Dexie Cloud of export/import-flow).
- [ ] **Betrouwbaardere meldingen** — Android-installatie of later Capacitor-wrapper.
- [ ] **Automatische backup-herinnering** — maandelijkse prompt om te exporteren.
- [x] **Mobiele editor-werkbalk** — opgelost via het touch blok-handvat (⠿) i.p.v. een vaste balk:
      tik = blok-menu (sheet), ingedrukt houden = verslepen. De oude `MobileToolbar`-balk crashte
      (VisualViewport + vaste positionering); de nieuwe aanpak vermijdt dat. Zie de fase onderaan.

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

## Fase UI — Overhaul: fundament, Twemoji & popup-UI (afgerond)

**Doel:** de UI consistent maken en een gedeeld fundament leggen, zodat nieuwe features automatisch dezelfde stijl erven. Zie `ONTWERP.md` (design-systeem) en `CLAUDE.md` (sectie "UI-conventies").

- [x] **1 — Tokens.** `--accent` + sweep van hardcoded groen → `var(--accent)`.
- [x] **2 — Primitives.** `Sheet`, `ConfirmDialog`, `Button`, `Field`, `IconField`, `ColorPicker`, `Section`, `Emoji`, `Toast`.
- [x] **3 — Twemoji.** Lokaal gebundelde emoji-set (incl. vlaggen), custom `ⵣ`, alle hoofd-iconen via `<Emoji>`.
- [x] **4 — Weekplanner.** `EventModal` herbouwd op de primitives (referentie).
- [x] **5 — Routines/templates/gebieden.** Inline-edit → Sheets + `ConfirmDialog`.
- [x] **6 — Logboek + gevarenzone.** Sheets/ConfirmDialog/Toast; logboek-invoer in een Sheet.
- [x] **7 — Instellingen-accordion.** Secties in `Section`; minder scroll.
- [x] **8 — Documentatie.** `CLAUDE.md` UI-conventies + nieuwe `ONTWERP.md`.

**Controle:**

- [x] `npm run build`, `npm run lint` en `npm run deadcode` schoon.
- [ ] Op Android/Vercel-preview: vlaggen 🇸🇦🇫🇷🇨🇳 en `ⵣ` renderen identiek; toevoegen/bewerken/verwijderen overal via dezelfde popup; donkere modus klopt; data intact.

**Nog open (klein):**

- [ ] Import "samenvoegen/vervangen" is nog een native `confirm()`.
- [ ] Emoji's in losse knop-labels (bv. "💾 Opslaan") mogen later via `<Emoji>`.

---

## Fase Notitieboeken — werkruimte + rijke editor (afgerond)

**Doel:** de Logboek-tab uitbreiden tot een notitieboeken-werkruimte (zelf tabs maken) met een Notion-achtige editor. Zie `ONTWERP.md` (sectie "Notitieboeken & rijke editor").

- [x] **1** — Ghost-click op het tijd-veld in de planner opgevangen.
- [x] **2** — Notitieboeken-laag: sub-tabs, `NotebookSheet`, entries per notitieboek; dag-notities alleen in Logboek.
- [x] **3** — Zoeken matcht ook de datum (ISO, "25 juni", weekdag).
- [x] **4** — Volledige pagina (`EntryPage`) + lazy **BlockNote**-editor; React 18 → 19.
- [x] **5** — Backup v6: `logEntries` + `notebooks` in export/import.
- [x] **6** — Documentatie (`CLAUDE.md` + `ONTWERP.md`).

**Controle:**

- [x] `npm run build` / `lint` / `deadcode` schoon.
- [ ] Mobiel: editor (tabellen/opsommingen/checklist) prettig in gebruik; entry maken/bewerken/verwijderen; zoeken op tekst, tag én datum; notitieboek toevoegen/verwijderen; backup export → import; oude v5-backup importeert nog.

---

## Fase Design-integratie — "Evergreen" overal toepassen (afgerond)

**Doel:** het Evergreen-ontwerp (uit de tijdelijke `nieuwe/`-mockups) overal toepassen, leunend op de bestaande tokens/primitives. Zie `ONTWERP.md`.

- [x] **1 — Fundament:** Schibsted Grotesk (`--ff-display`) toegevoegd; volledig Evergreen-palet (licht + donker) in `index.html`; accent + `--accent-contrast` thema-bewust; `theme-color` bijgewerkt.
- [x] **2 — Primitives + header:** Button/NavBtn/Section/Ring/segment-schakelaar verfijnd; nieuwe gradient-header met tegel-nav (rand + lichter, niet vervaagd).
- [x] **3 — Schermen:** Tracker (streak-chip, voltooid = groen), Week (display-weekkop), heatmap-top + merk-groen defaults naar `#0e7a52`.
- [x] **4 — Editor:** BlockNote-vlak transparant op het Evergreen-vlak; `EntryPage` erft de tokens.
- [x] **5 — Documentatie:** `ONTWERP.md` + `CLAUDE.md` (font-tiers, thema-bewust accent).

**Controle:**

- [x] `npm run build` / `lint` / `deadcode` schoon.
- [ ] Mobiel (Android): elk scherm in licht én donker; header-tegels leesbaar met rand; dark-mode accentcontrast; editor in het Logboek.

---

## Fase Design-integratie deel 2 — structuur uit mockups (afgerond)

**Doel:** de structurele ideeën uit de mockups overnemen zonder de token-laag te doorbreken.

- [x] **1 — Prominente datum-kaart** (`App.jsx`): grote datum in `--ff-display` + context-subtitel ("Vandaag", "Deze week", …), pijlen stappen per eenheid (dag/week/maand/jaar afhankelijk van view+statsPeriod).
- [x] **2 — StatsView rebuild** (`StatsView.jsx`): Week/Maand/Jaar-segment; Week = grote Ring + "X van Y" + streak-chip + mini-ringen per gebied + dagstaafjes; Maand = groene-gradient heatmap (aantikken → tracker); Jaar = heatmap + 3 statkaarten + maandbalken.
- [x] **3 — Header-nav bijgewerkt** (`App.jsx`): Maand-tegel weg, Log→Notities; 5 tegels: Dag · Week · Stats · Notities · Config.
- [x] **4 — Notities herstijld** (`LogbookView.jsx`): gekleurde tag-pillen (hash→EVENT_COLORS); drag-to-reorder via `useSortable` + additief `order`-veld; dag-notities onderaan, niet sleepbaar.
- [x] **5 — MonthView verwijderd** (`src/features/month/MonthView.jsx` weg; logica geporteerd naar StatsView).

**Controle:**

- [x] `npm run build` / `lint` schoon.
- [ ] Mobiel: datum-kaart klopt per view/periode; Stats Week/Maand/Jaar toont juiste data; maand-dag aantikken → tracker; Notities-entries slepen en volgorde blijft na herladen; tag-pillen kleuren correct; bestaande data intact.

---

## Fase Mobiele editor + audit (bezig)

**Doel:** de rijke editor volledig bruikbaar maken op touch (eigen vaste werkbalk i.p.v.
hover/typ-triggers) en een reeks audit-bugs oplossen. Volledig plan met details,
API-verificatie en controles per stap: `.md/PLAN-MOBIELE-EDITOR-EN-AUDIT.md`. Volgorde:
A → B → C → F → E; Fase D (BlockNote-upgrade) is bewust uitgesteld tot expliciet verzoek.

### Fase A — audit-fixes

- [x] A1 — Zoeken in logboek matcht ook de titel
- [x] A2 — `confirm()` in WeekView → `ConfirmDialog`
- [x] A3 — Import samenvoegen/vervangen → `ConfirmDialog`
- [x] A4 — "Wis ALLES" wist echt alles (incl. Hifd-reseed)
- [x] A5 — Boot-robuustheid: migratie mag app-start niet blokkeren
- [x] A6 — Hardcoded UI-kleuren → tokens
- [x] A7 — Hifd-log datacollision fix (db-migratie v4/v5, backup vooraf bevestigd door eigenaar)
- [x] A8 — Kale emoji's in JSX → `<Emoji>` (incl. de "Opslaan"/"Toevoegen"-knoplabels in alle sheets)
- [x] **Fase A afgerond** — `npm run build` + `npm run lint` schoon na elke stap. Export-versie
      is nu 8. **Nog te verifiëren door de eigenaar (kan niet lokaal getest worden zonder
      browser/echte data):** na de A7-migratie tonen de Voortgang-tab en de log-historie in de
      SurahSheet dezelfde aantallen als vóór de migratie; een oude backup (versie ≤7) importeert
      zonder fouten.

### Fase B — mobiele editor-werkbalk (teruggedraaid)

- [x] B0 — BlockNote-API geverifieerd tegen 0.51.4
- [x] B1 — `MobileToolbar.jsx`: vaste werkbalk boven het toetsenbord — **gebouwd, maar op de
      telefoon crashte de editor er vaak mee en de werkbalk was onduidelijk. Op verzoek van de
      eigenaar volledig teruggedraaid**: `MobileToolbar.jsx` verwijderd, `RichEditor.jsx` en
      `EntryPage.jsx` weer naar het gedrag van vóór Fase B (altijd de zwevende
      `FormattingToolbarController` + typen van `/` voor het slash-menu, ook op touch), de
      touch-tabel-CSS uit `richEditor.css` en de vermelding in `ONTWERP.md` ook weg.
- [x] B2 — Contextuele tabel-bediening — teruggedraaid samen met B1.
- [x] B3 — Documentatie — teruggedraaid samen met B1.
- [x] **Fase B afgerond (teruggedraaid)** — `npm run build` + `npm run lint` +
      `npm run deadcode` schoon. De editor gedraagt zich op elk apparaat weer exact als vóór
      dit hele plan. Een mobiele werkbalk blijft een open probleem — bij een volgende poging
      eerst met de eigenaar overleggen wat er precies misging (crash-moment, foutmelding)
      vóórdat er weer code voor gebouwd wordt.

### Fase C — logboek-UX

- [ ] ~~C1 — Body-preview op entry-kaarten~~ — gebouwd, maar de eigenaar wil geen
      beschrijving/preview onder de titel op de kaarten; weer verwijderd.
- [x] C2 — Zichtbare opslag-status in `EntryPage`
- [x] C3 — Race-fix: `body` kan achterlopen op `doc`
- [x] **Fase C afgerond** (C1 bewust overgeslagen op verzoek) — `npm run build` +
      `npm run lint` + `npm run deadcode` schoon.

### Fase F — nieuwe features

- [x] F1 — PWA app-shortcuts + share-target (incl. `draft`-prop op `EntryPage`)
- [x] F2 — Entry-sjablonen in het logboek
- [x] **Fase F afgerond** — `npm run build`, `npm run lint`, `npm run deadcode` schoon.
      **Nog te verifiëren door de eigenaar:** PWA opnieuw installeren/updaten op de telefoon
      zodat de manifest-shortcuts en share-target zichtbaar worden; shortcuts en delen-naar
      testen; sjabloon opslaan → "+ Nieuw" toont de keuze-sheet → nieuwe entry uit sjabloon
      aanmaken → sjabloon bewerken beïnvloedt eerder gemaakte entries niet.

### Fase E — opschoonronde

- [x] E1 — Backup/export-logica uit `App.jsx` naar `src/lib/backup.js`
- [x] E2 — `notify.js` leesbaar maken + dood pad opruimen (TimestampTrigger bevestigd
      stopgezet door Chrome, verwijderd met waarom-commentaar)
- [x] E3 — Knip + lint-sweep
- [x] **Fase E afgerond** — `npm run build`, `npm run lint`, `npm run deadcode` schoon.
      **Nog te verifiëren door de eigenaar:** alle vier exports + import getest op de
      telefoon (routine-backup, routines, weekplanning, notities); meldingen werken nog
      zoals voorheen (alleen bij open app, elke 30s gecheckt).

### Fase D — BlockNote-upgrade

- [ ] **Bewust uitgesteld** — alleen op expliciet verzoek van de eigenaar, eigen branch.

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

## Fase — Touch blok-handvat (⠿): tik-menu + long-press verslepen

**Wat het doet:** vervangt de teruggedraaide `MobileToolbar`. BlockNote's eigen zijmenu is
hover-gedreven en zijn slepen is native HTML5-drag → allebei dood op touch. Daarom een eigen
handvat bij het actieve blok (`sideMenu={false}`). **Tik op ⠿** = bottom-sheet met blok-acties;
**ingedrukt houden** = vrij verslepen (ghost volgt de vinger, drop-indicator toont de landingsplek,
loslaten herordent via remove+insert). Een **"+"** naast ⠿ opent het slash-menu programmatisch
(betrouwbaar op touch, waar getypt "/" door een IME kan worden ingeslikt).

**Nieuwe/gewijzigde bestanden:**

- `src/features/logbook/editorActions.js` — gedeelde, geverifieerde editor-acties (bindingen hersteld uit git `fae4d31`).
- `src/features/logbook/tableCommands.js` — private tabel-API (`_tiptapEditor.commands`) ingekapseld met guard.
- `src/features/logbook/BlockHandle.jsx` — handvat op het actieve blok + pointer-based tik/long-press + verslepen.
- `src/features/logbook/BlockMenuSheet.jsx` — bottom-sheet (turn into / opmaak / kleur / acties / tabel).
- `RichEditor.jsx` — `sideMenu={false}`, `tables`-optie aan (dode merge-knop gerepareerd), handvat gemount.
- `richEditor.css` — container `position: relative`; grotere kolom-resize-hitzone.

**Controle (afvinken) — vraagt een echt Android-toestel:**

- [ ] Handvat verschijnt netjes links van het actieve blok (positie klopt bij scrollen/typen).
- [ ] Tik op ⠿ → sheet opent; elke actie werkt; cursor springt niet weg.
- [ ] Ingedrukt houden → ghost + drop-indicator → loslaten herordent correct.
- [ ] "/" typen én de "+"-knop openen beide het slash-menu.
- [ ] Bestaande entry met tabel laadt nog (na `tables`-optie); merge/split werkt.

**Bewuste keuzes / beperkingen:**

- Blok verwijderen in de sheet gaat direct (geen `ConfirmDialog`) — het is een lichte, met undo
  omkeerbare editor-actie, geen entiteit-verwijdering. Zeg het als je hier tóch een bevestiging wilt.
- Verslepen v1 mikt op siblings op hetzelfde niveau; in/uit nesting slepen is nog niet gedekt.
- Auto-scroll bij de schermrand tijdens slepen (C4) is overgeslagen — later toe te voegen.

**Commit (voorstel):**
`Touch blok-handvat: tik-menu (sheet) + long-press verslepen; tabel-optie aan, editor-acties gedeeld`

- [x] **Fase afgerond** (build/lint/deadcode schoon; wacht op toestel-verificatie)

---

## Fase — Editor-bugfixes: kopiëren (tabel + meervoud), undo/redo, Reflectie-sjabloon

**Wat het doet:** vier gemelde problemen in de logboek-editor opgelost.

- **Bug 1 — tabel raakte kwijt via het blok-menu.** Twee oorzaken:
  1. **Hoofdoorzaak (blok-sheet):** de sheet toonde óók voor een tabel de tekst-secties
     (Type/Opmaak/Kleur). Tik je daar "Tekst" (of een kleur/opmaak), dan draait
     `updateBlock(tabel, {type:"paragraph"})` → de tabel-inhoud wordt vernietigd. Nu staan
     Type/Opmaak/Kleur achter `!isTable`; een tabel krijgt alleen de generieke Acties + de
     Tabel-sectie. (Naast onze ⠿ blijft BlockNote's eigen `TableHandles` bestaan voor
     rij/kolom op desktop — dat waren de "twee zes-puntjes-menu's".)
  2. **Kopiëren:** `copyBlock` schreef alléén verliesvrije markdown; een tabel reist zo niet
     terug. Vervangen door `copyBlocks` dat **HTML** (`blocksToFullHTML`) én markdown schrijft
     via `ClipboardItem`, en wordt **geawait** vóór `focus()`/sluiten.
- **Bug 3 — alleen het bovenste blok werd gekopieerd.** De selectie wordt nu in
  `BlockHandle.onPointerDown` vastgelegd (vóór het tikken de selectie laat vallen) en
  doorgegeven aan de sheet; "Kopiëren" neemt een meervoudige selectie mee, anders het cursor-blok.
  **Mobiel-vervolg (2 rondes):** op touch collapst de selectie al bij de tik op ⠿, dus bij de
  tik is de selectie weg. `BlockHandle` onthoudt daarom de laatst geziene meervoudige selectie
  als fallback. **Belangrijk:** de eerste poging las `editor.getSelection()` (ProseMirror), maar
  op een echt toestel synct de native touch-selectie **niet** naar ProseMirror → bleef één blok.
  Opgelost door de **DOM-selectie** te lezen (`window.getSelection()` → blokken via `[data-id]`),
  bijgehouden op het DOM-`selectionchange`-event (dat vuurt óók bij touch). Een nieuwe cursor ín
  de editor wist het onthouden meervoud. Tests: `e2e/mobile-copy.spec.js` +
  `e2e/editor.spec.js` (echte sleep-selectie).
- **Bug 2 — geen "ongedaan maken".** `RichEditor`-ref uitgebreid met `undo()`/`redo()`
  (`editor.undo()`/`redo()`); **↶ / ↷**-knoppen in de `EntryPage`-topbalk naast Terug.
  (Sluit aan op de bewuste keuze dat blok-verwijderen zónder `ConfirmDialog` gaat.)
- **Reflectie-sjabloon voor het dagelijkse logboek.** `DAILY_LOG_TEMPLATE_DOC` in
  `constants.js`, wordt ALLEEN ingeladen via de knop "Nieuw logboek voor vandaag" in de
  dagelijkse routine (`TrackerView`) — bewust NIET in de algemene "+ Nieuw"-kiezer van het
  logboek. Kop "Vandaag:" + 4 genummerde secties (Feitelijke Observatie / Foutieve Logica /
  Ontkrachting / Preventie-Protocol). TrackerView geeft per keer een `structuredClone` mee.
- **Bonus:** ontbrekende `ConfirmDialog`-import in `LogbookView.jsx` toegevoegd — een
  eigen sjabloon verwijderen crashte de view (ReferenceError).

**Gewijzigde bestanden:** `editorActions.js` (copyBlocks), `BlockHandle.jsx` (selectie
vastleggen), `BlockMenuSheet.jsx` (async copy-handler), `RichEditor.jsx` (undo/redo op ref),
`EntryPage.jsx` (↶/↷-knoppen), `constants.js` (`DAILY_LOG_TEMPLATE_DOC`), `TrackerView.jsx`
(sjabloon bij "Nieuw logboek voor vandaag"), `LogbookView.jsx` (ontbrekende ConfirmDialog-import).

**Controle (afvinken) — vraagt een echt toestel:**

- [ ] Tabel selecteren → ⠿ → Kopiëren → elders plakken geeft de tabel; de tabel blijft staan.
- [ ] Meerdere blokken selecteren → ⠿ → Kopiëren → alles wordt gekopieerd (niet alleen de eerste rij).
- [ ] ↶ herstelt de vorige stap, ↷ voert 'm opnieuw uit; wijziging wordt opgeslagen.
- [ ] Dagelijkse routine → "Nieuw logboek voor vandaag" opent met het reflectie-sjabloon (4 secties);
      een bestaand dag-logboek opent zonder sjabloon; de algemene "+ Nieuw" toont het sjabloon NIET.

**Commit (voorstel):**
`Editor: robuust kopiëren (tabel + meervoud), undo/redo-knoppen, Reflectie-sjabloon`

- [x] **Fase afgerond** (build/lint/deadcode schoon; wacht op toestel-verificatie)

---

## Fase — Editor-stabiliteit: markdown-input-rules hersteld + Enter-dataverlies onderzocht

**Aanleiding:** melding dat op **desktop** tekst verdween bij Enter. Met Playwright (nieuwe
dev-dependency) de echte app aangestuurd en headless gereproduceerd.

**Vondsten:**

- **Echte bug — `blocksToMarkdownLossy(...).then is not a function`.** In deze BlockNote-versie
  geeft `blocksToMarkdownLossy` een **string** terug (geen Promise). De `onChange` in
  `RichEditor` deed `.then` → **uncaught fout bij élke toetsaanslag**, die de markdown-input-rules
  volledig brak (typen van `### ` maakte geen kop). Fix: `Promise.resolve(...).then(...)` — vangt
  string én Promise af. Bewezen: kop-shortcut werkt weer, geen console-errors meer.
- **Enter-dataverlies = actieve selectie.** Met alléén een cursor wist Enter in ~20 scenario's
  (koppen, lijsten, geneste blokken, klik vs. Home, met context) **nooit** tekst. Met een
  **selectie** (bv. na "alles selecteren → kopiëren", die selectie blijft staan) **vervangt**
  Enter de selectie deterministisch → alles weg. Dit is standaard editor-gedrag (Word/Docs/Notion);
  het vangnet is de **↩ undo-knop**. Niet "gefixt" want Enter-vervangt-selectie is gewenst gedrag.

**Nieuw:** `playwright.config.js` + `e2e/editor.spec.js` (3 regressietests: kop-shortcut werkt,
cursor+Enter wist niets, geen console-errors). Draai met `npm run test:e2e`. Bewezen: falen op de
oude code (`.then`), slagen op de fix.

**Gewijzigd:** `RichEditor.jsx` (onChange), `package.json` (`test:e2e` + `@playwright/test`),
`.gitignore` (test-artefacten).

- [x] **Fase afgerond** (build/lint/e2e schoon)

---

## Fase — Editor-UX: template-clutter, kopieer-veiligheid, undo/redo-staat

Drie kleine verbeteringen (alle drie met e2e-dekking):

- **Sjabloon maakt geen lege entry meer.** Een draft mét `doc` (dagelijks-logboek- of
  keuze-sjabloon) telt niet meer meteen als wijziging (`dirtyRef = !!draft && !draft.doc`):
  "openen + terug" zonder te typen slaat niets op; typ je iets, dan wordt het alsnog opgeslagen.
  Een share-target-draft (title/body, geen `doc`) blijft wél meteen opslaan.
- **Kopiëren heft de selectie op.** Na `copyBlocks` zet `BlockMenuSheet` de cursor naar het eind
  van het laatste blok, zodat een volgende Enter de (voorheen geselecteerde) tekst niet wist —
  precies de val die het eerdere Enter-dataverlies veroorzaakte.
- **↶/↷ grijzen uit** als er niets te herstellen valt. `RichEditor`-ref exposeert
  `canUndo`/`canRedo` (via tiptap `can()`); `EntryPage` houdt dit in state bij vanuit de
  onChange-handler (geen ref-lezen tijdens render — `react-hooks/refs`).

**Gewijzigd:** `EntryPage.jsx`, `BlockMenuSheet.jsx`, `RichEditor.jsx`, `e2e/editor.spec.js`.

- [x] **Fase afgerond** (build/lint/e2e schoon)

---

## Fase — BlockNote-QA + tabel-acties gerepareerd

Grondige functionele doorlichting van de editor met Playwright. Alles getest en werkend:
bloktypes (kop/lijst/checklist/citaat/code/scheiding/tabel/emoji via `+`-menu), blok-menu
(turn-into, opmaak, kleur, dupliceren, omhoog/omlaag, verwijderen), undo/redo, en een
**opslaan→herladen→heropenen roundtrip** (rijk document mét tabel bleef identiek — data-integriteit OK).

**Echte bug gevonden + gefixt — tabel rij/kolom-acties deden niets.** `tableCommands.js` riep
`editor._tiptapEditor.commands.addRowAfter()` e.d. aan, maar BlockNote 0.51 heeft **geen**
`@tiptap/extension-table` — die commands bestaan niet, dus het was een stille no-op (geen error,
geen effect). Herschreven naar de echte **prosemirror-tables**-commands, gedispatcht op de
onderliggende ProseMirror-view (`editor._tiptapEditor.view`). `prosemirror-tables@1.8.5` toegevoegd
als expliciete dependency (dezelfde gehoiste kopie die BlockNote intern gebruikt → geen dubbele
instantie). Nu werken rij/kolom toevoegen+wissen, kopregel togglen en tabel wissen.

**Nieuw/gewijzigd:** `tableCommands.js` (prosemirror-tables), `package.json` (prosemirror-tables),
`e2e/editor.spec.js` (tabel-test), `e2e/roundtrip.spec.js` (data-integriteit).

**Terminologie-nootje (geen bug):** het `+`-slashmenu noemt lijsten "Puntenlijst"/"Controlelijst"
(BlockNote NL-locale), de blok-sheet noemt ze "Opsomming"/"Checklist". Beide werken.

- [x] **Fase afgerond** (build/lint/8× e2e schoon)

---

## Fase — Notities beter sorteren, verplaatsen, archief/prullenbak, multi-select

Op verzoek: notities in het Logboek beter kunnen ordenen, verplaatsen tussen notitieboeken,
meerdere tegelijk selecteren, en niets meer per ongeluk kwijtraken.

- **`order` genormaliseerd** (`migrateNotesOrderV1`, eenmalig bij app-start) zodat elke
  log-entry een expliciete positie heeft, ook zonder ooit gesleept te zijn.
- **Vastzetten** (📌, in de `EntryPage`-topbalk): eigen sectie bovenaan, met eigen
  sleep-container (twee `useSortable`-instanties i.p.v. één — voorkomt kruisen met de rest).
- **Archief + prullenbak** (`archivedAt`/`deletedAt`, `src/lib/notes.js` met
  `isActive`/`isArchived`/`isTrashed`): verwijderen is voortaan zacht; alle leesqueries
  (Logboek-lijst, tags, tracker-"vandaag"-widget) filteren nu op `isActive`. Prullenbak ruimt
  na 30 dagen zichzelf op (`purgeTrash`, bij elke app-start). Bereikbaar via 🗄️/🗑️ naast de
  notitieboek-tabs (over alle notitieboeken heen), met herstellen/definitief
  verwijderen/legen.
- **Verplaatsen tussen notitieboeken**: select in `EntryPage`'s meta-rij (bug tegelijk
  gefixt — `persist()` schreef `notebookId` voorheen alleen bij _aanmaken_, nooit bij een
  update) en als bulkactie.
- **Datumgroepen**: sorteermodus-schakelaar (↕ Eigen | 📅 Datum, opgeslagen in
  `settings.logbookSort`) — Datum groepeert op Vandaag/Gisteren/Deze week/Deze
  maand/maand-jaar, Eigen is de handmatige sleepvolgorde. Vastgezet blijft in beide bovenaan.
- **Multi-select**: long-press of de ☑-knop, checkbox i.p.v. sleephandvat, actiebalk onderin
  (vastzetten/archiveren/verplaatsen/prullenbak). Dagnotities (uit de tracker, geen
  `logEntries`-record) zijn nooit selecteerbaar.
- **Slepen tijdens zoeken/filteren werkt nu ook** (`reorderWithinFull`): het gesleepte item
  krijgt zijn nieuwe plek t.o.v. zijn zichtbare buur in de _volledige_ lijst, zodat
  weggefilterde entries hun relatieve volgorde behouden i.p.v. door elkaar te raken.

**Nieuw/gewijzigd:** `src/lib/db.js` (`migrateNotesOrderV1`, `purgeTrash`), `src/lib/notes.js`
(nieuw), `src/main.jsx`, `LogbookView.jsx`, `EntryPage.jsx`, `TrackerView.jsx`,
`ConfirmDialog.jsx` (`role="alertdialog"`), `backup.js` (versie 8→9), `e2e/notes-trash.spec.js`

- `e2e/notes-organize.spec.js` (nieuw, 10 tests).

* [x] **Fase afgerond** (build/lint/20× e2e schoon)

---

## Gouden regels tijdens het bouwen

1. Eén fase per keer; vink pas af en commit als de controle slaagt.
2. Geef Claude steeds alleen de relevante module + dit bestand.
3. Kleine, geïsoleerde wijzigingen; test elke stap op je telefoon via de Vercel-preview.
4. Verander nooit functionaliteit én structuur tegelijk.
5. Blijf op dezelfde Vercel-URL, en houd je laatste export als vangnet.
