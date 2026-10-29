# PLAN — Verbeterplan 2026 (redesign, editor, slop, Hifd, AI)

> Het grote plan na de audit van oktober 2026. Hoort bij `CLAUDE.md` (vaste regels) en
> `.md/UITVOERING.md` (levende roadmap). De vakjes hieronder zijn de voortgang van dít plan;
> `UITVOERING.md` verwijst hierheen in zijn statusregel.
>
> **Voor elk model dat dit uitvoert:** werk één fase per keer en binnen een fase één stap per
> keer. Verander nooit functionaliteit én structuur in dezelfde commit. Zeg pas "klaar" als
> `npm run lint`, `npm test`, `npm run build` en de e2e-tests groen zijn. Raak het datamodel
> alleen aan met een expliciete migratie (zie de vaste regels).

---

## Uitgangspunten (besloten met de eigenaar, 27-10-2026)

- **Alles gebeurt, maar veilig.** Editor Notion-soepel, opmaak + slop, Hifd én een redesign.
- **Redesign: ja.** Eerst mockups, pas daarna code. Het design system wordt gebouwd vóór of
  tijdens de slop-opruiming, zodat geen scherm twee keer herschreven wordt.
- **Lokaal blijven.** Geen backend, geen API-sleutels. AI alleen via de route zonder API:
  "Stuur naar Claude" (delen/kopiëren naar de Claude-app).
- **Hifd: eerst onderzoek, dan kiezen.** Bestaande voortgang blijft altijd behouden.
- **Direct op `main`.** De eigenaar heeft een backup van zijn data. Ter compensatie: elke
  commit is klein, gaat pas omhoog als alle checks groen zijn, en is los terug te draaien.

## Veiligheidsregels voor dit hele plan

1. **Vangnet eerst.** Fase 1 (tests + screenshots) komt vóór elke verbouwing.
2. **Twee soorten commits, nooit gemengd.**
   - _Structuur_ (opsplitsen, verplaatsen, styles naar CSS): screenshots moeten **identiek**
     blijven.
   - _Gedrag/uiterlijk_ (redesign, nieuwe functie): screenshots veranderen bewust; nieuwe
     baselines worden in dezelfde commit meegeleverd zodat de eigenaar ze kan bekijken.
3. **Data is heilig.** Elke schemawijziging: Dexie-`version()` met migratie + unit-test met
   oude fixture-data + backup-formaat-versie omhoog + import van oude backups blijft werken.
   Nieuwe velden komen **naast** oude velden ("dual-write") tot de eigenaar akkoord geeft.
4. **Terugdraaien:** Vercel → Deployments → vorige deploy → "Instant Rollback" (de app is
   direct terug), daarna `git revert <commit>` zodat `main` klopt.
5. **Telefoontest door de eigenaar** na elke fase die touch, toetsenbord of editor raakt.
   Per fase staat er een korte testlijst. Een fase is pas af als die lijst is afgevinkt.
6. **Optioneel preview-eerst** voor de twee riskantste stappen (BlockNote 0.55 in fase 3 en de
   Hifd-migratie in fase 6): eerst een branch → Vercel-preview op de telefoon → dan pas `main`.
   De eigenaar beslist per keer.

## Wat we uit de twee research-rapporten overnemen (getoetst)

| Bewering                                                             | Oordeel                                                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.md/CLAUDE.md` wordt niet automatisch geladen                       | **Klopt.** Submap-CLAUDE.md's laden pas als Claude een bestand in die map leest (code.claude.com/docs/en/memory). → Fase 0                |
| `.claude/rules/` met `paths`-frontmatter                             | **Klopt.** → Fase 0                                                                                                                       |
| Hook `PreCommand` + `interruptOnFailure`                             | **Bestaat niet.** Geldige events o.a. `PreToolUse`, `PostToolUse`, `Stop`; exit 2 blokkeert. → eigen hooks in Fase 0                      |
| `navigator.storage.persist()` ontbreekt                              | **Onwaar**, staat in `src/main.jsx`. Wel: de uitkomst wordt nergens getoond. → Fase 1                                                     |
| Migraties markeren zich "succesvol" bij half werk                    | **Niet voor deze code** (vlag pas na succes). Wel: fouten zijn onzichtbaar voor de eigenaar. → Fase 1                                     |
| Vitest + unit-tests, backup-validatie, CI                            | **Goed advies.** → Fase 1                                                                                                                 |
| Bij BlockNote blijven, eigen touch-UI houden                         | **Eens.** → Fase 3/5                                                                                                                      |
| BlockNote-upgrade brengt Tiptap 3 en `.bn-container`-scoping         | **Onjuist.** Tiptap 3 zit er al in. Het echte nieuws: 0.55 maakt de mobiele toolbar officieel en repareert Enter op Android/iOS. → Fase 3 |
| Zoekindex via `document.map(b => b.content).join(" ")`               | **Bugt** (`[object Object]`, mist geneste blokken/tabellen). → eigen extractor in Fase 5                                                  |
| FSRS-migratie met `createEmptyCard()`                                | **Gevaarlijk:** zet gememoriseerde surahs terug naar "nieuw". → Fase 6 met schaduwmodus                                                   |
| Design tokens met Tailwind-grijzen + `prefers-color-scheme`          | **Breekt** het Evergreen-palet en de eigen thema-knop (`data-theme`). → eigen tokens in Fase 2/4                                          |
| "WCAG eist 16 px minimum"                                            | **Onjuist** (WCAG kent geen minimum), maar de richting klopt: 8–10 px is te klein op een telefoon. → Fase 2/4                             |
| `latin-ext` weglaten bij fonts                                       | **Niet doen:** Tarifit in Latijns schrift gebruikt ɛ, ɣ, č, ḍ, ṛ, ẓ (latin-ext). Inter weghalen mag wel. → Fase 3/4                       |
| Toetsenbord: `visualViewport` + `interactive-widget=resizes-content` | **Bruikbaar.** → Fase 3/5                                                                                                                 |
| Playwright mobiel + screenshot-regressie, jscpd                      | **Bruikbaar.** → Fase 1/4                                                                                                                 |

---

## Fase-overzicht

| Fase | Onderwerp                                            | Risico      | Telefoontest |
| ---- | ---------------------------------------------------- | ----------- | ------------ |
| 0    | Claude-workflow: CLAUDE.md laadbaar, hooks, opruimen | Laag        | Nee          |
| 1    | Vangnet: tests, screenshots, backup-veiligheid, CI   | Laag        | Kort         |
| 2    | Redesign-richting: mockups, geen code                | Geen        | Nee          |
| 3    | BlockNote 0.51 → 0.56 in stappen                     | Hoog        | Ja           |
| 4    | Redesign bouwen + slop opruimen, scherm voor scherm  | Middel      | Ja           |
| 5    | Editor: Notion-functies                              | Middel      | Ja           |
| 6    | Hifd: onderzoek → algoritme → ervaring               | Hoog (data) | Ja           |
| 7    | "Stuur naar Claude" + stack-upgrade (Vite 8)         | Middel      | Ja           |

Fase 2 mag parallel aan fase 3 lopen (de ene is ontwerp, de andere code).

---

## Fase 0 — Claude-workflow op orde

**Doel:** elke sessie (Claude Code lokaal of in de cloud) volgt automatisch de regels.
**Waarom eerst:** de regels in `.md/CLAUDE.md` werden waarschijnlijk vaak niet geladen; dat
verklaart een deel van de slop (inline styles, harde kleuren, dubbele helpers).

- [x] **0.1** `CLAUDE.md` naar de root, kort (< 120 regels): project, werkwijze, codekwaliteit,
      data-regels, documentatie-regels, verwijzingen naar `.md/`-docs met volledige paden.
- [x] **0.2** Domeinregels naar `.claude/rules/` met `paths`-frontmatter, zodat ze alleen laden
      als ze ertoe doen: `ui.md` (src/**/\*.jsx, CSS), `editor.md` (src/features/logbook/**),
      `data.md` (db.js, backup.js, main.jsx, hifd), `pwa.md` (sw.js, vite.config.js, notify.js).
- [x] **0.3** Hooks: Prettier na bewerken (blijft), lint bij Stop (blijft), plus `npm run build`
      bij Stop **alleen als er bronbestanden gewijzigd zijn**. `CODEKWALITEIT.md` bijwerken (jq is
      niet meer nodig).
- [x] **0.4** Restanten uit het esbuild-tijdperk weg uit de root: `build.cmd`, `manifest.json`,
      `icon.svg`, `icon-192.png`, `icon-512.png` (identieke kopieën staan in `public/`),
      `generate-icons.html`. Eerst verifiëren dat niets ernaar verwijst.
- [x] **0.5** `README.md` vullen: wat de app is, hoe je hem draait, waar de docs staan.
- [x] **Fase 0 afgerond** (`/context` toont `CLAUDE.md` onder Memory files; build/lint groen)

**Controle:** start een Claude Code-sessie in de repo en draai `/context` → `CLAUDE.md` staat
onder "Memory files". Bewerk een `.jsx`-bestand → `ui.md` wordt geladen.

---

## Fase 1 — Vangnet

**Doel:** elke latere stap is automatisch controleerbaar, en dataverlies wordt zichtbaar of
onmogelijk.

### 1a — Unit-tests (Vitest + fake-indexeddb)

- [x] Vitest en fake-indexeddb als devDependencies; script `npm test`.
- [x] `nextSrs`: alle vier beoordelingen, ease-grenzen (1,3), max-interval 30, lapses.
- [x] Migraties met fixture-data: `migrateFromLocalStorage` (incl. corrupte JSON),
      `migrateNotesToLogEntries`, `migrateNotesOrderV1`, `migrateHifdSrsV2`, `purgeTrash`,
      Dexie v3→v5 (`hifdLog` → `hifdLogV2`).
- [x] Backup: export → import (vervangen én samenvoegen) geeft exact dezelfde data terug;
      een oude backup (v1, zonder logboek/Hifd) importeert. Gevonden: "vervangen" met een
      backup zonder Hifd leegt de Hifd-tabel → vastgelegd als `test.fails`, fix in 1c.
- [x] Pure helpers in `lib/date.js` (`dk`, `getMonday`, `eventsOnDate` met herhalingen).

### 1b — E2E en screenshots (Playwright)

- [x] Tweede Playwright-project "mobiel" (Pixel 7-emulatie, touch aan).
- [x] Vaste testdata (seed via de import-functie) en een vaste datum (`page.clock`), zodat
      screenshots stabiel zijn.
- [x] Screenshot-baseline per tab (Tracker, Planner, Logboek, notitie open, Hifd Vandaag +
      Voortgang, Statistieken, Instellingen) in licht én donker; animaties uit.
- [x] Baselines alleen op Linux maken en vergelijken (CI of cloud-sessie). Lokaal op Windows
      geven fonts andere pixels; daar draai je alleen de functionele e2e.
- [x] E2E-flows die nog ontbreken: routine afvinken, event aanmaken/slepen, Hifd beoordelen,
      volledige backup-roundtrip via de UI.

  Gevonden voor fase 2/4: inklapbare sectiekoppen zijn geen `<button>` (niet bereikbaar met
  toetsenbord/schermlezer); in Hifd-kaarten husselt de Arabische surahnaam de volgorde van
  "#1 · 7 verzen" door elkaar (bidi); datumkop verschilt per scherm.

### 1c — Data zichtbaar veilig

- [x] Startmigraties: fouten niet alleen in de console, maar verzamelen en tonen als
      waarschuwing ("Migratie X mislukt — maak nu een export") zodat het niet ongemerkt blijft.
- [x] Uitkomst van `persist()` tonen in Instellingen ("Opslag beschermd: ja/nee").
- [x] Import-validatie: eigen kleine validator (geen extra dependency) die per onderdeel type
      en verplichte velden checkt en een duidelijke foutmelding geeft vóór er iets wordt
      overschreven.
- [x] Vóór een "vervangen"-import automatisch eerst een veiligheidsexport downloaden.
- [x] Backup-herinnering (backlog-idee): `lastExportAt` in `db.meta` (hoort bij het toestel,
      gaat niet mee in een backup); na 30 dagen of zonder backup een melding op Dag, met
      "Over een week" en "Exporteer nu".
- [x] Extra gevonden en gerepareerd: "vervangen" met een backup zonder Hifd leegde Hifd;
      een backup met een ontbrekend dagdeel liet de app permanent crashen (wit scherm).

### 1d — CI (GitHub Actions)

- [x] Workflow bij elke push naar `main` (ubuntu-24.04): `npm ci`, lint, knip, `npm test`,
      build, functionele e2e. Faalt er iets, dan zie je dat in GitHub; de deploy op Vercel kun
      je dan terugdraaien. De screenshot-vergelijking draait **niet** in CI (andere fonts op
      GitHubs machine) maar in de cloud-sessie (`npm run test:visual`).
- [x] jscpd (duplicatie-detector) als rapport, nog niet blokkerend (nulmeting: 2,6% van de
      regels in `src/`).

- [x] **Fase 1 afgerond** (alle tests groen in CI; screenshots als baseline gecommit)

**Telefoontest:** Instellingen → opslag beschermd = ja; export maken en terugzetten werkt.

---

## Fase 2 — Redesign-richting (ontwerp, geen code)

**Doel:** vastleggen hoe de app eruit moet zien, vóórdat we tokens en componenten bouwen.

- [x] **2.1 Nulmeting:** de screenshots uit fase 1 + een korte analyse per scherm (wat werkt,
      wat rommelig is: 14 lettergroottes, 8–10 px tekst, wisselende kaartstijlen).
- [x] **2.2 Brief met de eigenaar:** gevoel van de app, wat Evergreen moet blijven, dichtheid,
      donker thema, navigatie, wel/geen "Vandaag"-startscherm (backlog-idee), iconen.
- [x] **2.3 Twee à drie richtingen** als mockups voor drie sleutelschermen: Vandaag/Tracker,
      Logboek + open notitie, Hifd. De eigenaar reageert, er wordt één richting gekozen.

  **Besluit (27-10-2026): richting B — "Zacht".** Ronde witte kaarten op een licht groengrijze
  ondergrond (#eef1ec), Evergreen-groen als enige accent, Outfit voor koppen + DM Sans voor
  tekst, Noto Naskh Arabic voor Arabisch. Geen emoji meer als UI-icoon: lijniconen; routines
  krijgen een kleurbolletje van hun gebied. Zwevende tabbalk onderin met vijf plekken
  (Vandaag, Planning, Notities, Hifd, Meer); Stats en Instellingen onder "Meer". "Vandaag" is
  een overzicht: voortgang, wat nu/straks gepland staat, open routines, logboek van vandaag.
  Brief van de eigenaar: rustig en minimaal, niet te veel opties, alles moet goed werken.
  Mockups: Design-canvas "Routine redesign — richtingen" (claude.ai).

- [x] **2.4 Volledige set** in de gekozen richting: ook Planner, Statistieken, Instellingen,
      sheets, lege staten, licht + donker.
- [x] **2.5 Beslissingen vastleggen** in een nieuwe `ONTWERP.md`:
  - **Fonts:** blijft het bij drie families of gaan we naar twee? Plus een Arabisch font
    (voor notities bv. Noto Naskh/Sans Arabic; voor Koran-tekst in Hifd een Uthmani/Naskh-font
    met open licentie, zoals Amiri Quran — onderzoeken in deze stap).
  - **Iconen:** emoji blijft voor wat de gebruiker zelf kiest (routines, notitieboeken);
    UI-knoppen en navigatie eventueel als lijniconen (bv. Lucide, ISC-licentie).
  - **Tokens:** typeschaal (rem, minimaal ~12 px voor labels, ~16 px voor lopende tekst),
    spacing, radius, schaduw, beweging (duur/easing, `prefers-reduced-motion`), tikvlakken ≥ 44 px.
  - **Componentspecificaties:** knop, kaart, lijstrij, sheet, tabbalk, sectie, lege staat.
- [x] **Fase 2 afgerond** (richting gekozen; `ONTWERP.md` v2 gecommit)

---

## Fase 3 — BlockNote 0.51 → 0.56

**Doel:** de mobiele fixes van BlockNote binnenhalen vóórdat we editorcode opruimen, zodat we
geen code opschonen die daarna overbodig blijkt.

Per stap: alle drie de `@blocknote/*`-pakketten op dezelfde versie, changelog nalopen,
`npm run build` + lint + editor-e2e + doc-roundtrip-test (bestaande documenten laden en
opslaan zonder verlies) groen.

- [x] **3.0** Voorbereiding: doc-roundtrip-test met fixtures (tabellen, geneste lijsten,
      checklists, kleuren, emoji, links); `_tiptapEditor`-gebruik opsommen (undo/redo-staat,
      `tableCommands.js`).
- [x] **3.1 → 0.52.x:** Yjs is losgekoppeld (wij gebruiken geen collaboratie → verwacht geen
      werk; verifiëren).
- [x] **3.2 → 0.54.x:** 0.53 breekt alleen de shadcn-variant (wij gebruiken Mantine). Nieuwe
      blokken (math, diagram) niet aanzetten.
- [x] **3.3 → 0.55.x (de belangrijke):** geüpgraded; de drie vragen hieronder wachten op de
      telefoontest van de eigenaar. mobiele formatting toolbar boven het toetsenbord is
      nu officieel; Enter-fixes voor Android/iOS. Testen:
  - werkt BlockNote's eigen mobiele toolbar beter dan onze uitgeschakelde toolbar?
  - werkt een getypte "/" nu wel op Android?
  - welk deel van `BlockHandle`/`BlockMenuSheet` blijft nodig?
- [x] **3.4 → 0.56.x:** side-menu-hover herschreven (wij zetten het zijmenu uit → weinig
      impact), Mod+A, backspace in geneste blokken, markdown-autolinks.
- [x] **3.5** `@blocknote/core/fonts/inter.css` weg (we overschrijven het font toch) → precache
      kleiner; meten vóór/na.
- [x] **3.6** Toetsenbord: `interactive-widget=resizes-content` in de viewport-meta testen,
      zodat de editor niet onder het toetsenbord verdwijnt.
- [ ] **Fase 3 afgerond** (telefoontest afgevinkt) — code staat op 0.56.0, alle checks groen;
      wacht op de telefoontest hieronder.

**Telefoontest:** typen (ook Arabisch en Tarifit), "/" typen, Enter in lijst en checklist, een
selectie overtypen, kopiëren/plakken, tabelacties, blokhandvat tikken/slepen, toolbar blijft
boven het toetsenbord, terug-knop slaat op.

**Let op bij terugdraaien:** gebruik geen nieuwe bloktypen voordat fase 3 stabiel is; dan
blijven documenten ook in de oude versie te openen.

---

## Fase 4 — Redesign bouwen + slop opruimen (scherm voor scherm)

**Doel:** het gekozen ontwerp uit fase 2 als design system, en in dezelfde gang de code
opschonen. Per scherm eerst structuur (screenshots identiek), dan uiterlijk (screenshots
bewust anders).

### 4a — Fundament

- [x] Tokens uit `index.html` naar `src/styles/base.css` (zelfde waarden →
      screenshots identiek), daarna de nieuwe tokens uit `ONTWERP.md` v2 toevoegen.
- [ ] **Stijlaanpak (besluit):** inline styles → **CSS Modules** per component (Vite ondersteunt
      dit zonder extra dependency, de stijlen blijven bij het component en lekken niet).
      Alleen echte datakleuren (event-/routinekleur, heatmap) blijven inline of als
      CSS-variabele.
- [x] Fonts volgens `ONTWERP.md` v2; alleen de nodige gewichten; `latin-ext` blijft (Tarifit).
- [ ] RTL: `dir="auto"` op tekstvelden en titels; logische CSS-eigenschappen
      (`margin-inline-start` i.p.v. `margin-left`) waar het ertoe doet.

### 4b — Gedeelde helpers en primitives

- [ ] Dubbele helpers samenvoegen (`fmtDay`, `SectionLabel`, `parseTags`) in `src/lib/` of
      `src/ui/`.
- [ ] `src/ui/`-primitives eerst naar de nieuwe stijl (Button, Sheet, Field, Section, Toast,
      ConfirmDialog, Ring, NavBtn) — dan erven alle schermen het automatisch.
      _Stand 28-10: Button, Sheet, Field, Section, SortableList, Card klaar; NavBtn weg.
      Toast, ConfirmDialog en Ring nog nalopen._
- [ ] Eventueel nieuwe primitives uit de componentspecs (Card, ListRow, EmptyState).
- [x] **Iconen (besluit eigenaar 27-10-2026):** emoji vervangen door één set lijniconen
      (Phosphor regular, MIT, plus eigen tasbih, gebedskleed en yaz). Data bewaart het emoji;
      `<Emoji>` toont het als icoon, een vlag als lettertegel (ع, 中). Icoonkiezer met negen
      groepen. Emoji-voorvoegsels uit knoppen, labels en meldingen gehaald.
- [x] **App-icoon:** "Ring" (voortgangsring met vinkje), randloze PNG's voor Android.
- [x] Twemoji opruimen: `build-emoji`, `public/emoji/`, `emoji-custom/` en `@twemoji/svg`
      zijn alleen nog terugval voor onbekende emoji; nagaan of dat ooit voorkomt en dan weg.
      _Gedaan 28-10: elk teken uit de lijsten heeft een icoon (test); onbekende tekens kregen
      toch al het rauwe teken (de SVG bestond niet). Eén build-stap en één dependency minder._

### 4c — Schermen (klein → groot)

Volgorde: Statistieken → Planner → Tracker (+ "Vandaag" indien gekozen) → Instellingen → Hifd
→ Logboek. Per scherm:

1. Opsplitsen in componenten van < ~300 regels met één taak (structuur-commit).
2. Inline styles → CSS Module met dezelfde waarden (structuur-commit, screenshots identiek).
3. Nieuw ontwerp toepassen (uiterlijk-commit, nieuwe baselines).

- [ ] Statistieken (`StatsView`, 748 regels)
- [ ] Planner (`WeekView` 784, `EventModal` 359) → wordt **opnieuw gebouwd**, zie 4e.
- [x] Tracker (`TrackerView` 420) + eventueel Vandaag-dashboard _(opgesplitst, 108 regels)_
- [x] Instellingen (`SettingsPanel` 986 → één bestand per sectie) _(107 regels + 7 secties,
      nieuw ontwerp; e2e-tests in `meer.spec.js`)_
- [x] Hifd (`HifdView` 1.052 → RecallCard, LearningCard, VandaagView, VoortgangView, SurahSheet
      als eigen bestanden) _(305 regels)_
- [ ] Logboek (`LogbookView` 1.538 → notitieboek-tabs, lijst/kaarten, multi-select-balk,
      archief/prullenbak, sorteerlogica als hook; `EntryPage` 596)
      _Stand 28-10: EntryPage 349, LogbookView nog 948._

### 4e — Planning opnieuw (besluit eigenaar 27-10-2026)

De eigenaar: slepen werkt slecht, zeven kolommen zijn te krap op een telefoon, een blok
toevoegen is omslachtig, herhalen/sjablonen zijn verwarrend en wat gepland staat is niet
zichtbaar vanaf het overzicht. Gebruik: vaste lessen/afspraken + de dag inplannen (time
blocking). Ontwerp: canvas-rij "B — Weekplanning, opnieuw".

- [x] **Dag als standaard:** weekstrip (ma–zo, bolletje als er iets gepland is) + één brede
      tijdlijn voor de gekozen dag, met een "nu"-lijn. **Week** wordt een lijst per dag i.p.v.
      zeven smalle kolommen.
- [ ] **Slepen opnieuw:** ingedrukt houden = verplaatsen (in stappen van 15 min), handvat
      onderaan = langer/korter maken; trilfeedback bij oppakken. Tik op leeg vlak = nieuw blok
      op dat tijdstip.
- [x] **Blok toevoegen in één sheet:** titel, snelkeuze (de huidige event-sjablonen),
      begintijd, duur-knoppen (30 m–3 u), herhalen (eenmalig / elke week / elke dag), melding.
- [x] **Herhalen begrijpelijk:** bij bewerken of verwijderen van een herhalend blok altijd de
      keuze "alleen deze" of "alle"; op het blok een klein herhaal-icoon.
- [x] **Zichtbaar vanaf Vandaag:** kaart "Nu en straks" op het Vandaag-overzicht.
- [x] **Weekschema-sjablonen** (hele week opslaan/laden) staan niet meer in de weg: laden
      via ⋯ in de Planning-kop ("Erbij" of "Vervangen"), opslaan/beheren onder Meer →
      Weekschema's. Functie en data blijven bestaan. (Melding per blok uit de mockup: niet
      gebouwd, dat zou een nieuw dataveld zijn.)
- [x] **Data blijft gelijk:** `calEvents` (date, startTime, endTime, repeat, exDates, color, …),
      `calTemplates` en `weekTemplates` houden hun formaat; geen migratie nodig. Het oude
      `icon`-veld blijft bewaard maar wordt niet meer getoond.
- [x] Tests: unit-tests voor tijdrekenen/overlap/herhalingen (planner.test.js), e2e voor
      toevoegen, verplaatsen, herhalend bewerken/verwijderen (planning.spec.js).
- [ ] Telefoontest slepen en langer/korter maken (eigenaar).

### 4d — Bewaking tegen nieuwe slop

- [ ] ESLint: `max-lines` (waarschuwing vanaf 400), verbod op harde hexkleuren in JSX via
      `no-restricted-syntax`, React 19-regels uit `eslint-plugin-react-hooks`.
- [ ] jscpd blokkerend maken in CI zodra de duplicatie is opgeruimd.
- [ ] Toegankelijkheid: contrast in beide thema's, tikvlakken, focusvolgorde in sheets.
- [ ] **Fase 4 afgerond** (alle schermen in nieuw ontwerp; geen inline styles buiten datakleuren)

**Telefoontest per scherm:** alles tikbaar, niets valt weg onder de notch of het toetsenbord,
donker thema leesbaar, scrollen en sheets voelen soepel.

---

## Fase 5 — Editor: Notion-functies

**Doel:** de editor voelt als Notion, op een opgeschoonde basis.

- [x] **5.0 Schema-veiligheid:** `docSchemaVersion` per entry + validatie/opschoning bij laden,
      vóór er custom blokken komen (migratie + test).
      _29-10: `docSchema.js`. Opslaan zet `docSchemaVersion: 1`; ontbreekt hij, dan is het 1 (geen
      bulkmigratie nodig). Bij laden worden onbekende bloktypes een alinea met dezelfde tekst._
- [ ] **5.1 Zoekindex:** eigen plain-text-extractor over het hele document (incl. geneste
      blokken en tabelcellen), berekend bij opslaan in plaats van bij elke toetsaanslag; nieuw
      afgeleid veld `searchText` (migratie vult het voor bestaande entries). `body` (markdown)
      blijft voor preview en export.
- [x] **5.2 Toggles:** toggle-lijst en inklapbare koppen zitten al in BlockNote, maar staan uit
      in `SLASH_KEYS` → aanzetten in slashmenu en blok-sheet. Snelle winst.
      _Gedaan: "Uitklapbare lijst" en "Uitklapbare kop 2" in het +-menu, "Uitklaplijst" in het
      blokmenu. Open/dicht onthoudt BlockNote zelf in localStorage (`toggle-<blok-id>`)._
- [x] **5.3 Callout-blok** (eigen blok via `createReactBlockSpec`), met emoji en kleur.
      _29-10: drie varianten (info, tip, let op) met lijnicoon i.p.v. emoji; tik op het icoon._
- [ ] **5.4 Afbeeldingen lokaal:** `uploadFile` slaat een verkleinde afbeelding (max ~1600 px)
      op in een nieuwe Dexie-tabel `files`; `resolveFileUrl` maakt er een object-URL van. Backup
      neemt bestanden mee (formaatversie omhoog) — met waarschuwing over de bestandsgrootte.
- [ ] **5.5 Links tussen notities + backlinks:** eigen inline-element "notitielink" met een
      zoek-pop-up (bijv. via "@"), en onderaan een notitie "Gelinkt vanuit…".
- [x] **5.6 Kleine Notion-dingen:** inhoudsopgave uit koppen, zoeken binnen een notitie,
      datum invoegen.
      _Gedaan: ⋯ → "Zoeken in notitie" (treffers gemarkeerd via CSS Highlight API, raakt de
      notitie niet) en "Inhoud" (alleen als er koppen zijn); +-menu → "Datum van vandaag"._
- [x] **5.7 RTL in de editor:** per blok automatische schrijfrichting (`unicode-bidi: plaintext`)
      testen met Arabisch en Tarifit.
- [x] **5.7b Werkbalk boven het toetsenbord:** blok invoegen, checklist, opsomming, genummerd,
      vet, cursief, in-/uitspringen, toetsenbord sluiten. Enter op een lege ingesprongen
      lijstregel gaat één niveau terug. _Nog op Android te testen._
- [x] **5.7c Overzicht "Alles":** alle notities over de notitieboeken heen, op datum.
- [ ] **5.8 Onderzoek:** multi-block-selectie op touch (groot; pas na 0.56 beoordelen).
- [ ] **5.9 Tags met structuur** (besluit eigenaar 27-10-2026: tags blijven, maar beter). Nu: los
      intypen, komma-gescheiden, eindeloze lijst zonder samenhang (#hifd naast gebied
      "Quran/Hifd").
  - **Kiezen i.p.v. typen:** tag-kiezer met je bestaande tags als chips + zoeken; "nieuwe tag"
    alleen als hij nog niet bestaat. Geen dubbelingen meer door hoofdletters/spaties
    (`Hifd`, `hifd `, `hifd` → één tag).
  - **Tagbeheer onder Meer:** lijst met aantal notities per tag; hernoemen, samenvoegen
    (`hifz` + `hifd`), verwijderen.
  - **Optioneel koppelen aan een focusgebied** (tag `hifd` → Quran/Hifd): de tag krijgt de kleur
    van het gebied en filteren op een gebied toont ook die notities. Niet verplicht.
  - **Data:** `tags` blijft een lijst tekst per entry (geen migratie nodig); tagbeheer en
    gebiedskoppeling in een nieuwe blob `tagMeta` (meegenomen in de backup, formaatversie +1).
    Hernoemen/samenvoegen past `tags` in de entries aan in één transactie, na bevestiging.
  - Tests: normaliseren, samenvoegen, hernoemen (unit); tag kiezen + filteren (e2e).
  - _Stand 28-10-2026: kiezen, normaliseren en tagbeheer (hernoemen/samenvoegen/verwijderen)
    werken en zijn getest. Koppelen aan een focusgebied (`tagMeta`) is nog niet gebouwd._
- [ ] **Fase 5 afgerond**

**Bewust niet:** kolommen (`@blocknote/xl-multi-column` is GPL), AI- en exportpakketten uit de
XL-reeks (GPL/commercieel).

**Telefoontest:** toggle in- en uitklappen, callout, afbeelding toevoegen en na herstart nog
zien, notitielink volgen, zoeken vindt tekst uit een tabel, Arabische alinea staat rechts.

---

## Fase 6 — Hifd

**Doel:** een revisiesysteem dat past bij Koranmemorisatie, zonder ooit voortgang te verliezen.

### 6a — Onderzoek (geen code)

- [x] FSRS (ts-fsrs 5.x, FSRS-6) vs. de huidige SM-2-variant vs. de traditionele indeling
      **sabaq** (nieuw), **sabqi** (recent, dagelijks) en **manzil** (vaste rotatie over alles).
- [x] **Granulariteit:** is een hele surah als één "kaart" realistisch (Al-Baqarah = 286 verzen)?
      Alternatieven: per pagina, per ruku', per rub' al-hizb. Wat betekent dat voor de data?
- [x] Het max-interval van 30 dagen: is dat juist goed (manzil-cyclus) of te strikt?
- [x] Wat meten we om het algoritme te kunnen beoordelen (fouten per vers, tijd, retentie)?
- [x] Uitkomst: een beslisdocument met advies; de eigenaar kiest. _(Gekozen 29-10: optie B.)_
      _Beslisdocument: [`.md/HIFD-ONDERZOEK.md`](HIFD-ONDERZOEK.md) (28-10). Wacht op de keuze._

### 6b — Bouwen (na de keuze)

- [ ] Datamodel uitbreiden met een migratie die het **huidige schema meeneemt** (geen reset naar
      "nieuw"); nieuwe velden naast de oude.
- [x] **Schaduwmodus 2–4 weken:** _(gestart 29-10 met optie B; dezelfde dag op verzoek van de
      eigenaar omgeschakeld: sabqi + manzil is nu leidend. De SRS-velden worden nog bijgewerkt,
      dus terugschakelen kan.)_ het nieuwe algoritme rekent mee en toont zijn advies naast het
      huidige; het oude blijft leidend. Pas na akkoord omschakelen. Terug kan altijd.
- [ ] Unit-tests met fixtures van echte voortgang (gememoriseerd, lerend, veel lapses).
- [ ] Ervaring: revisiesessie-flow, voorspelde intervallen op de knoppen (bestaat al),
      voortgang en retentie in Statistieken.
- [ ] **Fase 6 afgerond**

**Telefoontest:** bestaande gememoriseerde surahs staan na de update nog op dezelfde
revisiedatum; beoordelen werkt; schaduwadvies is zichtbaar.

---

## Fase 7 — "Stuur naar Claude" + stack-upgrade

### 7a — AI zonder API

- [x] **Weekreview / muhasaba:** periode kiezen, aanvinken welke data meegaat (routines,
      mood/energie, entries uit gekozen notitieboeken, Hifd-voortgang), sjabloon bewerkbaar
      (op basis van SPARPROMPT). Knoppen: **Delen** (Android-deelmenu → Claude-app) en
      **Kopiëren**.
- [x] **Antwoord terugzetten:** "Plak antwoord" maakt een entry in een notitieboek "Muhasaba"
      met datum.
- [x] **Per notitie:** "Vraag Claude" met vaste opdrachten (samenvatten, structureren,
      actiepunten).
- [x] Privacy: data verlaat de app alleen bij een expliciete tik op Delen/Kopiëren; standaard
      zo weinig mogelijk aangevinkt.
      _28-10: Meer → "Weekreview naar Claude". Periode (deze/vorige week, 30 dagen), onderdelen
      (standaard alleen routines), opdracht aanpasbaar (wordt nog niet bewaard), Delen/Kopiëren,
      antwoord bewaren als notitie in "Muhasaba". Telefoontest: delen naar de Claude-app._
- [ ] Onderzoek: is AI in de browser zelf (zonder server) inmiddels bruikbaar op Android-Chrome?
      Zo ja: optioneel later.

### 7b — Stack-upgrade (één pakket per commit)

- [x] Vite 6 → 8 (Rolldown), `@vitejs/plugin-react` 4 → 6, `vite-plugin-pwa` 0.21 → 2.0
      (ondersteunt Vite 8; vraagt Node ≥ 20.19 → Node-versie in Vercel controleren). Behoud
      `injectManifest` en de `notificationclick`-handler.
- [x] React 19.3, Dexie 4.4.x, ESLint/Knip/Prettier/Playwright bijwerken.
      _29-10: Playwright 1.64.1, CI-image mee. De cloud-sessie heeft alleen de Chromium van 1.63;
      daar wijst een symlink (`/opt/pw-browsers/chromium*-1248` → `-1243`) naar dezelfde
      browser, dus de schermtests blijven pixelgelijk. Terug kan altijd naar 1.63._
- [x] Bundel: editor-chunk en precache meten; eventueel `manualChunks`.
      _29-10 (Vite 8): hoofdbundel 620 kB (193 kB gzip), editor 980 kB (295 kB gzip, lazy),
      emoji-data van BlockNote 429 kB (lazy, alleen bij het emoji-item), precache 2,3 MB.
      Geen `manualChunks` nodig: de zware delen laden al pas als je ze gebruikt._
- [x] Meldingen: blijven "alleen als de app open is" (besluit: geen backend). Grens
      documenteren in Instellingen.
      _Ingehaald door de Android-app (Capacitor): daar plant Android ze in, ook als de app
      dicht is. De tekst onder Meer zegt per platform wat er geldt._
- [ ] **Fase 7 afgerond**

**Telefoontest:** delen naar de Claude-app werkt; antwoord plakken maakt een entry; app
installeert/update na de Vite-upgrade zonder witte pagina.

---

## Open beslissingen (eigenaar)

1. Designrichting, fonts en iconen → in fase 2.
2. Preview-eerst ja/nee voor stap 3.3 en fase 6b → per keer.
3. Hifd-granulariteit en algoritme → na het onderzoek in 6a.
4. Afbeeldingen in de backup meenemen (groter bestand) of apart → in 5.4.

## Waar het werk gebeurt

- **Cloud-sessie (claude.ai):** grote fasen, onderzoek, mockups, tests met screenshots; pusht
  direct naar `main`.
- **Claude Code lokaal:** kleine aanpassingen. Altijd eerst `git pull`, en nooit tegelijk met
  een cloud-sessie aan hetzelfde werken.
- Beide lezen `CLAUDE.md` + dit plan, dus elke sessie weet waar we staan.

## Bronnen

- Claude Code memory/CLAUDE.md: https://code.claude.com/docs/en/memory
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- BlockNote changelog: https://github.com/TypeCellOS/BlockNote/blob/main/CHANGELOG.md
- vite-plugin-pwa 2.0: https://openpwa.net/news/vite-plugin-pwa-v2-0-0-released/
- ts-fsrs: https://github.com/open-spaced-repetition/ts-fsrs
