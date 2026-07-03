# PLAN — Mobiele editor-werkbalk + audit-fixes (Routine Tracker PWA)

> **Voor het uitvoerende model (Claude Code / Sonnet):** dit is een compleet uitvoeringsplan.
> Lees eerst `.md/CLAUDE.md` (vaste regels), `.md/ONTWERP.md` (design-systeem) en de sectie
> "Context" hieronder. Volg de fases **in volgorde**, één stap per keer. Na elke stap:
> `npm run build` en `npm run lint` moeten schoon zijn vóór je verdergaat. Werk `UITVOERING.md`
> bij volgens de regels in `CLAUDE.md` (fases toevoegen, vakjes afvinken, statusregel bijwerken).

---

## Context (verplichte achtergrond)

**Project:** persoonlijke life-OS PWA. React 19 + Vite, Dexie (IndexedDB, lokaal-first),
vite-plugin-pwa met `injectManifest` (eigen `src/sw.js` — **nooit** naar `generateSW`),
deploy op Vercel. UI-taal Nederlands. Gebruik ALLEEN op een telefoon (Android, geïnstalleerde PWA).

**Design-systeem (Evergreen):** alle UI-kleuren via CSS-tokens uit `index.html`
(`--accent`, `--accent-contrast`, `--card`, `--border`, `--danger-*`, …). Tekst/iconen óp het
accent altijd `var(--accent-contrast)`, nooit `#fff` (in dark theme is dat donker).
Drie font-tiers: `--ff-display`, `--ff-head`, `--ff-body`. Primitives in `src/ui/`
(`Sheet`, `ConfirmDialog`, `Button`, `Field`, `Emoji`, …) — altijd hergebruiken, nooit
`confirm()`/`alert()`. Iconen in JSX altijd via `<Emoji char="…" />`, nooit kale emoji.

**Editor-stack (Logboek):** BlockNote **0.51.4** (`@blocknote/core`, `/react`, `/mantine`),
lazy geladen via `src/features/logbook/RichEditor.jsx`. Entries in `db.logEntries` met
`doc` (blocks-JSON) + `body` (markdown-afgeleide via `blocksToMarkdownLossy`, voedt
zoeken/preview). Volledige-pagina-editor: `src/features/logbook/EntryPage.jsx`
(auto-save, debounced 500ms + bij Terug). Styling: `src/features/logbook/richEditor.css`,
tokens via `EVERGREEN_TOKENS` in `RichEditor.jsx`.

**Kernprobleem (aanleiding van dit plan):** de editor is op de telefoon slecht bruikbaar:

1. Het slash-menu (`/`-trigger) werkt onbetrouwbaar/niet op Android — Gboard/IME geeft
   toetsaanslagen via compositie door, waardoor de trigger-detectie faalt.
2. De zwevende opmaakbalk positioneert t.o.v. de tekstselectie, niet t.o.v. het virtuele
   toetsenbord → onbereikbaar of verstopt.
3. Het blok-zijmenu (+ en sleep-handvat) verschijnt op **hover** — bestaat niet op touch.
4. Tabellen: celselectie en rijen/kolommen toevoegen zijn drag/hover-gebaseerd → onwerkbaar.

**Strategische keuze:** we fixen de triggers niet, we maken ze **overbodig** met een eigen
vaste werkbalk boven het toetsenbord (zoals Notion mobiel doet), aangestuurd via de
programmatische BlockNote-API. Geen hover, geen typ-triggers.

**BlockNote-versie NIET upgraden in fase A–C.** De upgrade is een aparte, riskante fase (D):
nieuwere versies hebben o.a. de CSS-scoping verplaatst (`.bn-container` → `.bn-root`) en de
markdown-conversie herschreven (raakt onze `body`-afleiding). Bouw alles eerst op 0.51.4.

**Commando's:** `npm run dev`, `npm run build`, `npm run lint`, `npm run deadcode` (knip).

---

## Fase A — Bugfixes uit de code-audit (klein, geïsoleerd, eerst)

Elke stap is een losse, kleine wijziging. Eén stap per commit-moment. Geen structuurwijzigingen.

### A1 — Zoeken in het logboek negeert de titel

**Bestand:** `src/features/logbook/LogbookView.jsx`, `filtered`-useMemo (rond regel 118–130).
Het zoekfilter checkt `e.body`, `e.tags` en de datum-string, maar **niet `e.title`**.
Entries met alleen een titel zijn onvindbaar.

**Doen:** voeg `e.title?.toLowerCase().includes(q)` toe aan de filter-conditie.

**Controle:**
- [ ] Entry met alleen titel "Testtitel" is via de zoekbalk vindbaar
- [ ] Build + lint schoon

### A2 — Native `confirm()` in WeekView vervangen door `ConfirmDialog`

**Bestand:** `src/features/planner/WeekView.jsx`. Twee schendingen van de eigen conventie
(geen native dialogs):

1. **±regel 227** — na het slepen van een herhalend event:
   `confirm("… OK = hele reeks verplaatsen / Annuleren = alleen deze")`.
   Vervang door `ConfirmDialog` met de `actions[]`-prop (meerkeuze, zie
   `src/ui/ConfirmDialog.jsx`): actie "Hele reeks", actie "Alleen deze dag", plus annuleren.
   Let op: de drop-berekening (nieuwe datum/tijden) is al gedaan vóór de vraag; bewaar het
   voorgenomen resultaat in component-state (bv. `pendingMove`) en voer de gekozen variant
   uit in de dialog-callback. De bestaande logica (reeks verplaatsen vs. `exDates` +
   eenmalige kopie) ongewijzigd overnemen.
2. **±regel 388** — weektemplate inladen: `confirm("… inladen en huidige week vervangen?")`.
   Vervang door een standaard `ConfirmDialog` (title/message/onConfirm).

**Controle:**
- [ ] Herhalend event slepen toont de eigen dialog met drie keuzes; beide varianten werken als voorheen
- [ ] Weektemplate laden vraagt bevestiging via `ConfirmDialog`
- [ ] `grep -rn "confirm(" src/features/planner/` levert niets meer op
- [ ] Build + lint schoon

### A3 — Import-keuze "samenvoegen vs. vervangen" uit native `confirm()` halen

**Bestand:** `src/App.jsx`, `importData` (±regel 437). Dit staat in `ONTWERP.md` als bekende
uitzondering; zo lossen we hem op: **lees en parse het bestand eerst volledig in**, valideer,
bewaar de geparste data in state (bv. `pendingImport`), en toon dáárna een `ConfirmDialog`
met `actions[]`: "Samenvoegen" / "Volledig vervangen" / annuleren. De transactie-logica
zelf niet wijzigen — alleen de vraag verplaatsen naar ná het inlezen.
Werk daarna de "Bekende uitzonderingen"-sectie in `ONTWERP.md` bij (punt vervalt).

**Controle:**
- [ ] Volledige backup importeren toont de eigen dialog; beide modi werken (test met een test-export)
- [ ] Deel-imports (routines/weekplanning/notities) werken ongewijzigd
- [ ] Build + lint schoon

### A4 — "Wis ALLES" wist niet alles

**Bestanden:** `src/App.jsx` (`clearEverything`), `src/features/settings/SettingsPanel.jsx`.
De knop heet "💥 Wis ALLES (reset naar fabrieksinstellingen)" en de toast zegt "Alles gewist",
maar `clearEverything` laat `logEntries`, de `notebooks`-blob, `hifd` en `hifdLog` staan.
Dat is misleidend voor een destructieve actie.

**Doen:** breid de transactie uit met `db.logEntries.clear()`, `db.hifd.clear()`,
`db.hifdLog.clear()`, en reset de blobs `notebooks` naar `DEFAULT_NOTEBOOKS`.
**Let op de Hifd-seed:** verwijder daarna de meta-flag `hifd_seeded` en roep `seedHifd()`
(uit `src/lib/db.js`) opnieuw aan, anders start Hifd met een lege tabel.
De migratie-flags (`migrated`, `migrated_notes_v1`, `hifd_srs_v2`) laten staan.

**Controle:**
- [ ] Na "Wis ALLES": logboek leeg, notitieboeken terug naar standaard, Hifd toont opnieuw 114 surahs op "todo"
- [ ] Build + lint schoon

### A5 — Boot-robuustheid: migratie mag de app-start nooit blokkeren

**Bestanden:** `src/lib/db.js` (`migrateFromLocalStorage`), `src/main.jsx`.
`migrateNotesToLogEntries`, `seedHifd` en `migrateHifdSrsV2` vangen hun fouten;
`migrateFromLocalStorage` **niet**. Eén corrupt localStorage-item (`JSON.parse`-throw)
= witte app vóór de eerste render.

**Doen:** dezelfde bescherming als de andere migraties: hele functie in `try/catch` met
`console.error`, en per localStorage-item een veilige parse (helper `safeParse(raw, fallback)`)
zodat één corrupt item de rest niet meesleept. Gedrag bij gezonde data identiek houden.

**Controle:**
- [ ] Handmatige test: zet in DevTools `localStorage.setItem("rt_settings", "{kapot")` in een
      vers profiel (of na het wissen van de `migrated`-flag) → app start met defaults i.p.v. wit scherm
- [ ] Build + lint schoon

### A6 — Hardcoded UI-kleuren naar tokens

Schendingen van de token-regel (alleen échte data-kleuren mogen hex zijn):

1. `src/features/planner/WeekView.jsx` ±regels 310 en 375: template-knoppen met
   `#7c3aed` / `#dc2626`. Gebruik de bestaande `--purple-bg/-border/-text`-tokens voor de
   paarse variant en `--danger-*` voor de rode.
2. `src/features/settings/SettingsPanel.jsx`: `addBtn` heeft `color: "white"` op
   `background: var(--accent)` → moet `color: "var(--accent-contrast)"` zijn (dark-theme-regel).
3. Doe een snelle sweep: `grep -rn '"white"\|#fff' src/features/ src/ui/` en beoordeel per
   geval (witte tekst op een **data**-kleur zoals event-kleur mag blijven; op tokens niet).

**Controle:**
- [ ] Genoemde plekken gebruiken tokens; visueel gecheckt in licht én donker thema
- [ ] Build + lint schoon

### A7 — Hifd-log datacollision: leer- en revisie-log overschrijven elkaar

**Probleem.** `db.hifdLog` heeft primary key `&[surah+date]` (db-versie 3): één record per
surah per dag. Maar `logLearnSession` (phase `"learn"`) en `rateReview` (phase `"review"`)
in `src/features/hifd/HifdView.jsx` doen allebei een `put({ surah, date, … })` op diezelfde
sleutel. Gebeuren beide op één dag voor dezelfde surah, dan overschrijft de tweede de eerste:
revisiegeschiedenis gaat verloren én `reviewsDoneToday` (telt records met
`phase === "review"`) daalt weer, waardoor de daglimiet stilletjes overschreden kan worden.
(`markMemorized` schrijft óók een learn-log en heeft hetzelfde risico.)

**Fix: `phase` opnemen in de primary key → `&[surah+date+phase]`.** Dat behoudt de
bedoelde upsert-semantiek "één log per surah per dag **per fase**".

**LET OP — dit raakt het datamodel.** Conform `CLAUDE.md`: expliciete migratie schrijven en
de eigenaar laten verifiëren dat zijn data intact is vóór dit gemerged wordt. Dexie kan de
primary key van een bestaande tabel NIET wijzigen; daarom een tabel-vervanging:

1. **`src/lib/db.js`:**
   ```js
   db.version(4)
     .stores({ hifdLogV2: "&[surah+date+phase], surah, date" })
     .upgrade(async (tx) => {
       const rows = await tx.table("hifdLog").toArray();
       // Oude records hebben het phase-VELD al; alleen de key kende het niet.
       await tx.table("hifdLogV2").bulkPut(
         rows.map((r) => ({ ...r, phase: r.phase || "learn" })),
       );
     });
   db.version(5).stores({ hifdLog: null }); // oude tabel verwijderen
   ```
2. **Alle code-verwijzingen hernoemen:** `grep -rn "hifdLog" src/` en vervang
   `db.hifdLog` → `db.hifdLogV2` (HifdView: `logLearnSession`, `rateReview`,
   `markMemorized`, `reviewsDoneToday`, `selectedLog`; App.jsx: export én import;
   db.js: `clearEverything`-uitbreiding uit A4 zo nodig meenemen).
3. **Export/import (`src/App.jsx`):** bump `version` naar **8**. Houd de JSON-sleutel in de
   backup-payload gewoon **`hifdLog`** (leest/schrijft nu de nieuwe tabel) zodat oude
   backups importeerbaar blijven — bij import records zonder `phase` op `"learn"` zetten.
4. **Verificatiestap (verplicht in de output benoemen):** vraag de eigenaar vóóraf een
   export-backup te maken; controleer na de migratie dat de Voortgang-tab en de
   log-historie in de SurahSheet dezelfde aantallen tonen als vóór de migratie.

**Controle:**
- [ ] Zelfde surah op één dag: leersessie loggen én revisie beoordelen → beide records
      bestaan naast elkaar; `reviewsDoneToday` blijft kloppen
- [ ] Bestaande log-historie zichtbaar in SurahSheet na migratie
- [ ] Oude backup (versie ≤7) importeert zonder fouten; nieuwe export/import round-trip werkt
- [ ] Build + lint schoon

### A8 — Kale emoji's in JSX naar `<Emoji>`

De conventie (zie `CLAUDE.md`/`ONTWERP.md`): iconen in JSX altijd via `<Emoji char="…" />`
zodat ze op elk toestel identiek renderen. Schendingen:

1. `src/features/tracker/TrackerView.jsx` ±regel 390: `<span style={{fontSize:18}}>{todayEntry ? "📖" : "📝"}</span>`
   → `<Emoji char={todayEntry ? "📖" : "📝"} size={18} />`.
2. `src/features/settings/SettingsPanel.jsx`: label-teksten met kale emoji
   (±regel 398 `🔥 Streak-drempel`, ±701/931 `💾 …`, `🌙 Hifd revisies per dag`)
   → emoji als `<Emoji … size={13} />` vóór de tekst in het label-JSX.
3. De knoplabels `"💾 Opslaan"` / `"✓ Toevoegen"` in de sheets staan in `ONTWERP.md` als
   bekende uitzondering; pak ze in dezelfde sweep mee (`<Emoji>` + tekst) en verwijder die
   uitzondering uit `ONTWERP.md`. Het losse `✓`-vinkje in de tracker-checkbox
   (TrackerView ±236) is een typografisch teken op een gekleurde achtergrond — mag blijven.

**Emoji-pipeline:** controleer dat elke gebruikte emoji in `EMOJI_CATEGORIES`
(`src/lib/constants.js`) of de `UI_EMOJIS`-lijst in `scripts/build-emoji.mjs` staat;
voeg ontbrekende toe en draai `npm run emoji` (draait ook automatisch bij build).

**Controle:**
- [ ] `grep -rn "📖\|📝\|💾\|🔥\|🌙" src/ | grep -v "Emoji char"` toont geen JSX-render-plekken meer (strings in toasts mogen blijven)
- [ ] Alle iconen renderen (geen kapotte/lege SVG's) in licht en donker thema
- [ ] Build + lint schoon

- [ ] **Fase A afgerond** (alle bovenstaande vakjes aangevinkt; commit-boodschap voorstellen)

---

## Fase B — Mobiele editor-werkbalk (hoofdfase)

**Doel:** de rijke editor volledig bedienbaar maken op touch, zonder hover of typ-triggers,
met een vaste werkbalk die boven het virtuele toetsenbord plakt. Desktopgedrag blijft ongewijzigd.

**Nieuwe bestanden:** `src/features/logbook/MobileToolbar.jsx` (+ evt. `mobileToolbar.css`).
**Aan te passen:** `src/features/logbook/RichEditor.jsx` (toolbar mounten, floating toolbar
op touch uitschakelen). NIET aanpassen: datamodel, `EntryPage`-opslaglogica, service worker.

### B0 — API-verificatie (verplichte eerste stap, geen code)

De onderstaande API-aannames gelden voor BlockNote 0.51.x maar MOETEN eerst geverifieerd
worden tegen de geïnstalleerde package (lees de d.ts-bestanden in
`node_modules/@blocknote/core/types/` en de README/voorbeelden in `node_modules/@blocknote/react/`):

| Doel | Verwachte API (verifiëren!) |
| --- | --- |
| Inline-stijl togglen | `editor.toggleStyles({ bold: true })` etc. |
| Actieve stijlen lezen | `editor.getActiveStyles()` |
| Huidig blok bij cursor | `editor.getTextCursorPosition().block` |
| Bloktype wisselen | `editor.updateBlock(block, { type: "heading", props: { level: 2 } })` |
| Blok invoegen | `editor.insertBlocks([{ type: … }], referenceBlock, "after")` |
| In-/uitspringen | `editor.nestBlock()` / `editor.unnestBlock()` (+ `canNestBlock()`) |
| Undo/redo | `editor.undo()` / `editor.redo()` |
| Slash-menu programmatisch openen | `editor.openSuggestionMenu("/")` |
| Focus | `editor.focus()`, focus-events via `editor.onEditorContentChange` is NIET focus — gebruik DOM-`focusin`/`focusout` op de container |
| Tabelcommando's | geen nette publieke API in 0.51; gebruik de onderliggende TipTap-commands: `editor._tiptapEditor.commands.addRowAfter()`, `addRowBefore()`, `addColumnAfter()`, `addColumnBefore()`, `deleteRow()`, `deleteColumn()`, `toggleHeaderRow()`, `deleteTable()` — namen verifiëren in `node_modules/@tiptap/pm` / prosemirror-tables-typings |

Noteer afwijkingen en pas het plan daarop aan vóór je B1 begint. Schrijf de geverifieerde
API-lijst als commentaarblok bovenin `MobileToolbar.jsx`.

**Controle:**
- [ ] Alle bovenstaande API's geverifieerd of gecorrigeerd, vastgelegd in het commentaarblok

### B1 — `MobileToolbar.jsx`: vaste werkbalk boven het toetsenbord

**Activering:** alleen op touch-apparaten: `window.matchMedia("(pointer: coarse)").matches`,
éénmalig bepaald bij mount (constante, geen listener nodig). Op desktop rendert de component
`null` en blijft alles zoals nu.

**Zichtbaarheid:** tonen zolang de editor focus heeft. Implementeer met `focusin`/`focusout`
op de editor-container (ref), met een korte time-out (~100ms) bij `focusout` zodat een tap
op de werkbalk zelf de balk niet sluit. **Cruciaal:** geef elke werkbalk-knop
`onPointerDown={(e) => e.preventDefault()}` zodat de tap de editor-focus (en dus het
toetsenbord) niet steelt; de actie zelf in `onClick`.

**Positionering (het lastigste deel):** `position: fixed; left: 0; right: 0;` en de
onderkant meebewegen met het virtuele toetsenbord via de **VisualViewport API**:

```js
// In een useEffect; alleen op coarse pointer.
const vv = window.visualViewport;
if (!vv) return; // fallback: bottom: 0 (balk staat dan onder in beeld zonder toetsenbord-tracking)
const update = () => {
  // Afstand tussen onderkant layout-viewport en onderkant visual viewport
  // = hoogte van het toetsenbord (plus evt. browser-UI).
  const offset = window.innerHeight - vv.height - vv.offsetTop;
  el.style.transform = `translateY(${-Math.max(0, offset)}px)`;
};
vv.addEventListener("resize", update);
vv.addEventListener("scroll", update);
update();
```

Gebruik `transform` (niet `bottom`) om layout-thrash te vermijden. Enige flikkering bij
het openen van het toetsenbord is bekend gedrag van deze API en acceptabel.
Zorg dat de scroll-zone van `EntryPage` onderaan extra `padding-bottom` (~56px) krijgt
zodat de balk de laatste regel niet afdekt (mag via een prop of vaste waarde; kleinste
veilige ingreep kiezen).

**Inhoud van de balk** — één horizontaal scrollende rij (`overflow-x: auto`,
`-webkit-overflow-scrolling: touch`), knoppen minimaal **44×44px**, gescheiden door subtiele
dividers (`--border-soft`). Volgorde:

1. **＋** → `editor.openSuggestionMenu("/")` (opent het bestaande, al gecureerde slash-menu —
   hergebruik, geen eigen blokkenlijst bouwen)
2. **Bloktype-cycler of -popover**: Tekst / H1 / H2 / H3 (via `updateBlock` op het cursorblok;
   markeer de actieve op basis van `getTextCursorPosition().block`)
3. **B / I / U / S** (toggleStyles; actieve staat via `getActiveStyles()`)
4. **Checklist / • lijst / 1. lijst** (updateBlock naar `checkListItem` / `bulletListItem` /
   `numberedListItem`; nogmaals tikken = terug naar `paragraph`)
5. **⇤ / ⇥** uitspringen / inspringen (`unnestBlock` / `nestBlock`, disabled-state via `canNestBlock`)
6. **↶ / ↷** undo / redo
7. **Tabel-sectie** — zie B2

**Styling:** `background: var(--card)`, `border-top: 1px solid var(--border)`, iconen als
tekst-glyphs of kleine inline SVG's in `currentColor` (GEEN kale emoji; als een emoji-icoon
gewenst is, via `<Emoji>`); actieve knop krijgt `background: var(--sel-bg)` en
`color: var(--accent-text)`. Fonts via tokens. `z-index` boven de EntryPage (die zit op 250 →
werkbalk 260).

**State-updates:** de actieve-staat van knoppen moet meebewegen met de cursor. Aansluiten op
`editor.onSelectionChange` of (indien niet beschikbaar in 0.51) een `useSyncExternalStore`/
listener op `editor.onChange` + `selectionchange` op `document`. Kies de eenvoudigste
werkende variant; geen polling.

**Integratie in `RichEditor.jsx`:** render `<MobileToolbar editor={editor} />` binnen
`BlockNoteView` (children, naast de bestaande controllers). Op coarse pointer:
`FormattingToolbarController` NIET renderen (de statische balk vervangt hem); op desktop
alles laten zoals het is. De `SuggestionMenuController` altijd laten staan (de ＋-knop
gebruikt hem).

**Controle (op een echte telefoon of Chrome DevTools device-mode met touch):**
- [ ] Werkbalk verschijnt bij focus, verdwijnt bij blur, plakt boven het toetsenbord
- [ ] Tikken op werkbalk-knoppen sluit het toetsenbord NIET
- [ ] ＋ opent het slash-menu; alle typen (kop, lijst, checklist, quote, code, tabel, divider) invoegbaar zonder `/` te typen
- [ ] B/I/U/S togglen en tonen actieve staat; bloktype wisselen werkt; in-/uitspringen werkt op lijsten
- [ ] Undo/redo werkt
- [ ] Desktop: gedrag identiek aan vóór deze fase (zwevende toolbar, slash via `/`)
- [ ] Donker thema klopt (contrast op accent!)
- [ ] Build + lint schoon

### B2 — Contextuele tabel-bediening

**In `MobileToolbar.jsx`:** wanneer het cursorblok van type `table` is (check
`getTextCursorPosition().block.type`), toon aan het einde van de balk een extra sectie
(of vervang de blok-sectie) met: **rij ↑ / rij ↓ / kolom ← / kolom → / rij wissen /
kolom wissen / kopregel aan-uit / tabel wissen** — via de in B0 geverifieerde
TipTap-commando's. "Tabel wissen" via `ConfirmDialog`? Nee — dialogen horen bij de app-laag;
binnen de editorcontext is een directe actie met undo (↶) acceptabel; houd het simpel.

**Extra touch-CSS in `richEditor.css`:** ruimere celpadding op coarse pointer
(`@media (pointer: coarse)`: `padding: 10px 12px;` en `font-size: 14px` voor cellen) zodat
tikken in een cel betrouwbaar wordt.

**Controle:**
- [ ] In een tabel verschijnt de tabel-sectie; alle acties werken; buiten een tabel verdwijnt hij
- [ ] Cellen zijn op touch comfortabel te raken
- [ ] Build + lint schoon

### B3 — Documentatie

- Werkbalk-conventie kort toevoegen aan `ONTWERP.md` (sectie Patronen): "op touch draait de
  editor op de vaste MobileToolbar; de zwevende toolbar is desktop-only".
- `UITVOERING.md`: fase toevoegen volgens sjabloon, vakjes afvinken, statusregel bijwerken.

- [ ] **Fase B afgerond**

---

## Fase C — Logboek-UX-verbeteringen (klein maar merkbaar)

### C1 — Body-preview op entry-kaarten

`ONTWERP.md` belooft dat `body` de kaart-preview voedt, maar `LogbookView.jsx` toont alleen
datum/titel/tags. Entries zonder titel zijn nu een kale datumregel.

**Doen:** toon onder de titel (of in plaats van, als titel leeg) een snippet van `entry.body`:
eerste ~2 regels, `display: -webkit-box; WebkitLineClamp: 2; WebkitBoxOrient: "vertical";
overflow: hidden;`, `fontSize: 12`, `color: var(--text-muted)`. Strip ruwe markdown-tekens
licht (`#`, `*`, `-`, `>` aan regelbegin) met een kleine helper — geen dependency toevoegen.
Geldt ook voor dag-notities (die hebben al platte `body`).

**Controle:**
- [ ] Kaarten tonen 1–2 regels preview; lange teksten netjes afgekapt; lege body = geen lege ruimte
- [ ] Build + lint schoon

### C2 — Zichtbare opslag-status in `EntryPage`

Auto-save is nu onzichtbaar; op mobiel wil je zekerheid vóór je wegnavigeert.

**Doen:** klein statuslabel in de topbalk (midden), gevoed door de bestaande refs/flow:
"Opslaan…" zodra `dirtyRef` true wordt, "Opgeslagen ✓" nadat `persist()` is doorlopen
(kleine state `saveState: "idle" | "saving" | "saved"`; na 1,5s terug naar leeg).
`fontSize: 11`, `color: var(--text-faint)`. Geen extra opslaglogica wijzigen.

**Controle:**
- [ ] Typen toont "Opslaan…", valt terug op "Opgeslagen ✓"; Terug-knop blijft direct werken
- [ ] Build + lint schoon

### C3 — Race bij snel sluiten: `body` kan achterlopen op `doc`

In `RichEditor.jsx` wordt bij elke wijziging eerst synchroon `{ doc }` gemeld en pas async
`{ doc, text }` (markdown). Sluit je direct na de laatste toetsaanslag, dan slaat
`persist()` de nieuwste `doc` op met een verouderde `body` → zoeken/preview mist de laatste
wijziging tot de volgende bewerking.

**Doen (kleinste veilige fix):** geef `EntryPage` toegang tot een conversie op het moment
van sluiten: laat `RichEditor` via een ref (`useImperativeHandle` of een prop-callback die
de editor-instantie doorgeeft) een `getMarkdown()` beschikbaar maken die
`editor.blocksToMarkdownLossy(editor.document)` awaited. In `close()` in `EntryPage`:
vóór `persist()` eerst `contentRef.current.text = await getMarkdown()` (met try/catch;
bij een fout gewoon doorgaan met de bestaande waarde). Geen wijziging aan het datamodel.

**Controle:**
- [ ] Typ tekst en tik direct op Terug → heropen: preview/zoeken bevatten de laatste tekst
- [ ] Build + lint schoon

- [ ] **Fase C afgerond**

---

## Fase D — BlockNote-upgrade (apart, riskant, eigen branch)

**Pas uitvoeren na expliciete goedkeuring van de eigenaar, en pas nadat B stabiel draait.**

**Waarom:** nieuwere BlockNote-versies bevatten relevante fixes voor precies onze
mobiel-problemen (zwevende UI wordt naar `document.body` geportald tegen clipping;
doorontwikkeling van de mobiele toolbar-ondersteuning).

**Bekende breaking points t.o.v. 0.51.4 (uit de release notes — bij uitvoering de notes van
álle tussenliggende versies nalopen):**

1. **CSS-scoping:** thema-properties (fonts, kleuren, CSS-variabelen) moeten op `.bn-root`
   i.p.v. `.bn-container`; layout-properties blijven op `.bn-container`. Raakt:
   `EVERGREEN_TOKENS` (nu via `style` op `BlockNoteView`) en mogelijk selectors in
   `richEditor.css` (menu-/toolbar-selectors renderen in een portal!).
2. **Markdown-conversie volledig herschreven** → onze `body`-afleiding
   (`blocksToMarkdownLossy`) kan andere output geven. `body` voedt zoeken + preview,
   dus: na de upgrade een verificatiestap draaien (open 5 bestaande entries, controleer
   dat preview/zoeken kloppen; nieuwe entry maken en controleren).
3. Portal-gedrag van menu's kan z-index/positionering t.o.v. `EntryPage` (z-index 250) en
   de MobileToolbar (260) beïnvloeden.

**Procedure:** (1) eigenaar maakt export-backup via de app; (2) nieuwe branch
`blocknote-upgrade`; (3) `npm install` nieuwste `@blocknote/*` (alle drie dezelfde versie);
(4) release notes doorlopen en breaking changes toepassen; (5) volledige regressietest:
bestaande entry openen/bewerken/opslaan, nieuwe entry, alle slash-bloktypen, MobileToolbar
compleet, tabellen, donker thema, export/import; (6) pas mergen na goedkeuring.

- [ ] **Fase D afgerond** (of bewust uitgesteld — noteren in UITVOERING.md)

---

## Fase E — Opschoonronde (structuur, géén functionaliteit)

Pas na A–C, als aparte ronde conform de regel "eerst werkend, dan opruimen".

### E1 — Backup/export-logica uit `App.jsx`

`App.jsx` is 844 regels; ~300 daarvan zijn export/import. Verplaats naar `src/lib/backup.js`:
`exportData`, `exportRoutines`, `exportWeekplanning`, `exportNotities`, `importData` (de
parse/transactie-delen), plus één gedeelde helper `downloadJSON(filename, payload)` die de
vier keer gedupliceerde Blob/anchor-boilerplate vervangt. `App.jsx` houdt dunne wrappers
die de benodigde state doorgeven. **Gedrag identiek; alleen verhuizen en ontdubbelen.**

### E2 — `src/lib/notify.js` leesbaar maken + dood pad opruimen

1. Herformatteer naar de projectstijl (het bestand is nu geminificeerd geschreven —
   Prettier draaien volstaat grotendeels).
2. Het `TimestampTrigger`-pad (Notification Triggers) is een Chrome-experiment dat nooit
   definitief is geland; **verifieer eerst** met een korte web-check of het in huidige
   Chrome/Android nog bestaat. Zo nee: pad verwijderen en bij de interval-fallback een
   `waarom`-commentaar zetten (meldingen alleen bij open app; robuuste meldingen staan als
   backlog-idee). Zo ja: alleen documenteren, laten staan.

### E3 — Knip + lint-sweep

`npm run deadcode` draaien; gemelde ongebruikte code alleen verwijderen na verificatie
(ook dynamisch gebruik checken), conform `CLAUDE.md`.

**Controle:**
- [ ] Build + lint schoon; export/import getest (alle vier de varianten + import)
- [ ] `App.jsx` substantieel korter; geen functionele wijziging waargenomen

- [ ] **Fase E afgerond**

---

## Fase F — Nieuwe features (na C, vóór E)

### F1 — PWA app-shortcuts + share-target

**Doel:** (a) lang drukken op het app-icoon → snelkoppelingen "Nieuwe notitie" en "Vandaag";
(b) tekst/links vanuit andere Android-apps via het deel-menu direct in een nieuwe
logboek-entry. Beide werken alleen in de geïnstalleerde PWA (Android) — dat is precies
de gebruikscontext.

**F1a — Manifest (`vite.config.js`, in het `manifest`-object van VitePWA):**

```js
shortcuts: [
  {
    name: "Nieuwe notitie",
    url: "/?action=new-note",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  {
    name: "Vandaag",
    url: "/?action=today",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
],
share_target: {
  action: "/share",
  method: "GET",
  params: { title: "title", text: "text", url: "url" },
},
```

**F1b — Routing/afhandeling in de app.** Er is geen router; los het op met één kleine hook
of effect in `src/App.jsx` die **éénmalig bij mount** draait:

1. Lees `location.pathname` + `URLSearchParams`.
2. `?action=today` → `setView("tracker")` + `setDate(new Date())`.
3. `?action=new-note` → open een nieuwe entry: state `launchDraft = {}` die verderop een
   `EntryPage` (notebookId `"logboek"`, vandaag) opent — hergebruik het bestaande
   `EntryPage`-mechanisme; voeg hiervoor zo min mogelijk nieuwe state toe.
4. Pad `/share` (of aanwezige `title`/`text`/`url`-params) → `launchDraft` met
   `title` = gedeelde titel en `body` = `text` + (indien aanwezig) nieuwe regel + `url`.
5. Daarna ALTIJD de URL schoonmaken: `history.replaceState(null, "", "/")` —
   anders herhaalt de actie bij een refresh.

**F1c — `EntryPage` uitbreiden met een `draft`-prop (optioneel object `{ title?, body?, doc? }`):**
initialiseert `title`-state en `initialContent` (body-string gaat door de bestaande
`toBlocks`-fallback in `RichEditor`), en zet `dirtyRef.current = true` zodat de auto-save
de entry direct aanmaakt. Bestaand gedrag zonder `draft` exact ongewijzigd.

**F1d — Vercel-rewrite.** `/share` moet naar `index.html` rewriten. Controleer `vercel.json`;
als er nog geen SPA-catch-all in staat, voeg toe:
`{ "rewrites": [{ "source": "/share", "destination": "/index.html" }] }` (of een algemene
catch-all als die er nog niet is — niets bestaands overschrijven).

**Let op:** het manifest wijzigt → de PWA moet op de telefoon opnieuw geïnstalleerd of
ge-update worden voor shortcuts/share zichtbaar zijn. Vermeld dat expliciet in de output.

**Controle:**
- [ ] `npm run build` → gegenereerde `manifest.webmanifest` in `dist/` bevat `shortcuts` en `share_target`
- [ ] `/?action=new-note` opent direct een lege nieuwe entry; `/?action=today` opent de tracker op vandaag; URL is daarna weer schoon `/`
- [ ] `/share?title=Test&text=Hallo&url=https://x.nl` opent een nieuwe entry met titel "Test" en body "Hallo\nhttps://x.nl", en auto-save maakt hem aan
- [ ] Desktop/browser-gedrag ongewijzigd; build + lint schoon

### F2 — Entry-sjablonen in het logboek

**Doel:** terugkerende notitie-structuren (bv. dagelijkse reflectie, weekreview) met één tik
starten als voorgestructureerde entry.

**Datamodel — géén schemawijziging:** blob `entryTemplates` in `db.blobs`:
`[{ id, name, icon, doc }]` waarbij `doc` BlockNote-blocks-JSON is. Fallback: lege lijst.

**F2a — Sjabloon opslaan vanuit `EntryPage`.** Voeg in de topbalk (tussen Terug en
Verwijderen) een ⋯-knop toe die een klein menu/`Sheet` opent met één actie:
"Opslaan als sjabloon" → `Sheet` met naam- (`TextInput`) en icoon-veld (`IconField`),
slaat `{ id: uid(), name, icon, doc: contentRef.current.doc }` toe aan de blob.
Bevestiging via `showToast`.

**F2b — Nieuw uit sjabloon in `LogbookView`.** Gedrag van "+ Nieuw": als er geen sjablonen
zijn → exact zoals nu (direct lege entry). Zijn er wél sjablonen → open een keuze-`Sheet`:
bovenaan "Leeg document", daaronder de sjablonen (icoon + naam, rij-tik = kiezen), per rij
een klein verwijder-icoon dat via `ConfirmDialog` het sjabloon wist. Keuze van een sjabloon
→ open `EntryPage` met `draft = { doc: deepCopyZonderIds(template.doc) }` (hergebruik de
`draft`-prop uit F1c).

**Belangrijk — id's strippen:** BlockNote-blocks bevatten `id`-velden. Kopieer het
sjabloon-doc diep en verwijder recursief alle `id`-properties zodat BlockNote verse id's
genereert en twee entries nooit block-id's delen. Kleine helper in
`src/features/logbook/` (geen dependency).

**F2c — Backup.** Neem `entryTemplates` mee in `exportData` (volledige export) en in
`importData` (indien `Array.isArray(data.entryTemplates)` → blob schrijven). Geen aparte
versie-bump nodig bovenop die van A7; wél de `notities`-deelexport meenemen (sjablonen
horen logisch bij notities).

**Controle:**
- [ ] Entry schrijven → opslaan als sjabloon → "+ Nieuw" toont de keuze; sjabloon kiezen geeft een nieuwe entry met de structuur, die als zelfstandige entry opslaat
- [ ] Sjabloon bewerken beïnvloedt eerder gemaakte entries NIET (id-strip + deep copy werkt)
- [ ] Sjabloon verwijderen via `ConfirmDialog`; zonder sjablonen werkt "+ Nieuw" als vanouds
- [ ] Volledige export/import en notities-export/import nemen sjablonen mee
- [ ] Build + lint schoon

- [ ] **Fase F afgerond**

---

## Volgorde & werkafspraken (samenvatting voor het uitvoerende model)

1. **A → B → C → F**, daarna E; D alleen op expliciet verzoek, eigen branch.
   Binnen F geldt: F1c (`draft`-prop op `EntryPage`) eerst bouwen, want F2 hergebruikt hem.
2. Eén stap per keer; na elke stap `npm run build` + `npm run lint` schoon vóór "klaar".
3. Nooit functionaliteit en structuur in dezelfde stap; nooit datamodel/Dexie-sleutels
   stilletjes wijzigen; service worker (`injectManifest`, `notificationclick`) niet aanraken.
4. `UITVOERING.md` bijhouden: deze fases toevoegen volgens het fase-sjabloon, vakjes
   afvinken zodra de controle écht slaagt, statusregel bovenaan bijwerken, commit-boodschap
   voorstellen per fase.
5. Bij twijfel of een API-afwijking in B0: kleinste veilige stap kiezen en de afwijking
   documenteren, niet improviseren met grote omwegen.
