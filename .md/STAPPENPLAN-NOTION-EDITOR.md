# STAPPENPLAN — Notion-editor fixen & verbeteren (uitvoerbaar met Sonnet)

> **Voor het uitvoerende model (Sonnet):** dit is het **uitvoerbare** stappenplan. Het hoort bij `PLAN-NOTION-EDITOR.md` (achtergrond/waarom). Waar dit bestand en het oude plan botsen, **wint dit bestand** — het is bijgewerkt na verificatie tegen de geïnstalleerde `@blocknote/*` 0.51.4-typings (2026-07-06). Werk **één stap per keer**, verander **nooit** functionaliteit én structuur tegelijk, draai na elke stap `npm run build` + `npm run lint` en zeg pas "klaar" als het schoon bouwt. Wijzig **geen** Dexie-sleutels of dataformaat zonder expliciete migratie + controle door de gebruiker. Hergebruik `src/ui/`-primitives en de bestaande CSS-tokens. Emoji's via `<Emoji>`. Werk `UITVOERING.md` bij en stel per fase een commit-boodschap voor. Push niet zonder te vragen.

---

## 0. Wat er is veranderd t.o.v. `PLAN-NOTION-EDITOR.md` (lees dit eerst)

Deze correcties zijn geverifieerd in de code/typings en in `node_modules`. Ze veranderen de aanpak wezenlijk — volg **niet** blind het oude plan.

1. **`MobileToolbar.jsx` bestaat niet meer.** Git-status = `D`; commit `24f2453` = _"Revert: MobileToolbar volledig teruggedraaid (crashte op de telefoon)"_. Het oude plan (Fase A1) zegt "extraheer bindingen uit `MobileToolbar.jsx`" — dat bestand staat **niet** in de working tree. Het is wél te herstellen uit git: `git show fae4d31:src/features/logbook/MobileToolbar.jsx`. Bovenaan dat bestand staat een **geverifieerde API-bindingstabel** — die is het waardevolle deel. **Extraheer uit de git-versie, niet uit de working tree.**
2. **De vaste balk-vorm is bewust afgeschoten** (hij crashte op een echt toestel). We bouwen 'm niet opnieuw. In plaats daarvan hergebruiken we BlockNote's **ingebouwde** componenten (punt 3). Dit past bij CLAUDE.md: eenvoudigste oplossing, geen parallelle kopie.
3. **BlockNote 0.51.4 levert de kern al ingebouwd** — het oude plan wilde veel hand-rollen dat overbodig is:
   - `ExperimentalMobileFormattingToolbarController` — een opmaak-bubbel die zichzelf **boven het toetsenbord** positioneert via de VisualViewport API. Dit is precies D2b=(a) uit het oude plan, maar **kant-en-klaar**. (Wél gemarkeerd "experimental": kan flikkeren door vertraging in de VisualViewport API. Daarom: proberen, en op een echt toestel testen.)
   - `SideMenuController`, `DragHandleButton`, `DragHandleMenu`, `RemoveBlockItem`, `BlockColorsItem`, `SideMenu` — de bouwstenen voor het blok-menu, mét correcte positionering. Zelf een bottom-sheet + handvat-positionering rekenen is dus **plan B**, niet plan A.
4. **Er is een publieke move-API:** `editor.moveBlocksUp()` / `editor.moveBlocksDown()`. De oude twijfel (remove+insert-hack) vervalt.
5. **Lijsten/koppen togglen kan met de publieke API** (`editor.updateBlock(block, { type, props })`, types `paragraph` / `heading` (props.level 1-3) / `bulletListItem` / `numberedListItem` / `checkListItem`). Het oude plan reikte hiervoor deels naar het **private** `editor._tiptapEditor.commands` — dat is voor deze acties **niet nodig**. Private API blijft alleen nog nodig voor sommige **tabel**-commando's (zie A3).
6. **`rowHeights` bestaat niet** in het tabel-model (`columnWidths` wel). Rijhoogte = bewust niet ondersteund (D4).

---

## 1. Beslissingen (gemaakt — Sonnet hoeft niet te wachten)

| Fork                                     | Keuze                                                                                                                                                                                         | Reden                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **D1** Mantine houden of swappen?        | **Houden.** Swap → backlog.                                                                                                                                                                   | Raakt élk menu; eigen project. Nu geen waarde.                                      |
| **D2** Hoe opent het blok-menu?          | **(a) Handvat bij het actieve blok**, maar **gebouwd op BlockNote's `SideMenuController` + `DragHandleButton`** (getoond op basis van het _actieve_ blok i.p.v. hover), niet zelf-gerekend.   | Robuust, botst niet met native selectie, minimale eigen code.                       |
| **D2b** Opmaak (vet/cursief/kleur/link)? | **Eerst (a): de ingebouwde `ExperimentalMobileFormattingToolbarController` proberen** (echt-toestel-test). Werkt hij te schokkerig → **terugvallen op (b): een opmaak-rij ín het blok-menu.** | De ingebouwde component maakt route (a) nu goedkoop; hand-rollen was het dure deel. |
| **D3** Echte kolommen (multi-column)?    | **Nee** (GPL-3.0/betaald). Backlog.                                                                                                                                                           | Persoonlijke PWA; niet de moeite/licentie waard nu.                                 |
| **D4** Tabellen — rijhoogte?             | **Accepteer "geen instelbare rijhoogte".** Alleen C1 (grotere kolom-handles).                                                                                                                 | `rowHeights` bestaat niet; CSS-hack is troebel.                                     |

> De enige beslissing die pas ná een echt-toestel-test valt, is **D2b (a) vs (b)**. Fase B is zo geschreven dat (b) altijd werkt en (a) een losse, terugdraaibare poging is.

---

## 2. Fase 0 — Verificatie (grotendeels al gedaan; vastleggen)

Deze punten zijn al geverifieerd tegen `node_modules/@blocknote/*` 0.51.4. **Sonnet: neem ze over in `UITVOERING.md` en bevestig alleen de twee open punten (⚠️) door ze in de typings/DOM na te kijken.**

- **Blok-API:** `insertBlocks(blocks, referenceBlock, "after")`, `removeBlocks([block])`, `replaceBlocks(...)`, `updateBlock(block, {type, props})` — ✅ aanwezig.
- **Verplaatsen:** `moveBlocksUp()`, `moveBlocksDown()` — ✅ publiek aanwezig.
- **Cursor/selectie:** `getTextCursorPosition().block`, `onSelectionChange(cb)`, `onChange(cb)`, `getActiveStyles()`, `toggleStyles({bold:true})` — ✅.
- **Slash programmatisch:** `editor.getExtension("suggestionMenu")?.openSuggestionMenu("/", { deleteTriggerCharacter: true })` — ✅ (privaat pad; markeren als upgrade-breekpunt).
- **Zijmenu-componenten:** `SideMenuController`, `SideMenu`, `DragHandleButton`, `DragHandleMenu`, `RemoveBlockItem`, `BlockColorsItem` — ✅ geëxporteerd uit `@blocknote/react`.
- **Mobiele toolbar:** `ExperimentalMobileFormattingToolbarController` — ✅ geëxporteerd.
- **Tabel-optie:** `tables: { splitCells, cellBackgroundColor, cellTextColor, headers }` — ✅ sleutels bestaan.
- **Tabel-model:** `columnWidths: number[]` ✅; `rowHeights` ❌ (bestaat niet).
- ⚠️ **Open 1 — Duplicatie met children:** bevestig dat een blok uit `editor.document` zonder `id` via `insertBlocks` opnieuw invoegen ook geneste `children` correct kloont (nieuwe id's). Test met een lijst-met-subitems.
- ⚠️ **Open 2 — Side-menu op selectie i.p.v. hover:** bevestig in de DOM/typings óf `SideMenuController` de zichtbaarheid op selectie kan sturen, óf dat we de `sideMenu`-render-prop zelf tonen op basis van `getTextCursorPosition().block`. Dit bepaalt B1.

- [ ] **Fase 0 vastgelegd** (bevindingen + 2 open punten opgelost in `UITVOERING.md`)

**Paste-prompt Fase 0:**

> Lees `STAPPENPLAN-NOTION-EDITOR.md` §2. De meeste punten zijn al geverifieerd; neem ze over in `UITVOERING.md`. Los alleen de twee ⚠️-punten op door in `node_modules/@blocknote/*` 0.51.4-typings en de gerenderde DOM te kijken. Schrijf geen app-code. Meld de exacte bevindingen.

---

## 3. Fase A — Fundering: bindingen redden + latente bugs (klein, eerst)

### A1 — `editorActions.js` uit de git-versie van `MobileToolbar`

- Herstel de bron: `git show fae4d31:src/features/logbook/MobileToolbar.jsx` (niet de working tree — die is leeg).
- Maak `src/features/logbook/editorActions.js` met pure, benoemde functies die `editor` als eerste argument nemen. Kopieer de exacte, al-geverifieerde vormen uit de bindingstabel bovenin de git-versie:
  - `setBlockType(editor, type, props)` → `editor.updateBlock(editor.getTextCursorPosition().block, { type, props })`
  - `toggleStyle(editor, key)` → `editor.toggleStyles({ [key]: true })`
  - `nest(editor)` / `unnest(editor)` → met `canNestBlock()`/`canUnnestBlock()`-guard
  - `moveUp(editor)` / `moveDown(editor)` → `moveBlocksUp()` / `moveBlocksDown()`
  - `openSlashMenu(editor)` → `getExtension("suggestionMenu")?.openSuggestionMenu("/", { deleteTriggerCharacter: true })`
  - `undo(editor)` / `redo(editor)`
- **Belangrijk:** puur extraheren. Géén nieuwe UI, géén vaste balk aansluiten. `MobileToolbar.jsx` blijft verwijderd.

### A2 — Geavanceerde tabel-features aanzetten (dode merge-knop repareren)

`tableCellMergeButton` staat al in `TOOLBAR_KEYS` maar doet niets zonder de `tables`-optie. In `useCreateBlockNote` in `RichEditor.jsx`:

```js
tables: { splitCells: true, cellBackgroundColor: true, cellTextColor: true, headers: true }
```

Daarna: bevestig dat **bestaande opgeslagen tabel-entries nog laden** (open een oude entry met een tabel). Dit is de enige stap die opgeslagen `doc`'s raakt — extra voorzichtig.

### A3 — Private tabel-API inkapselen

Alleen tabellen hebben nog `editor._tiptapEditor.commands[...]` nodig (rest gaat via publieke API — zie §0.5). Maak `src/features/logbook/tableCommands.js` met een guard (`if (!editor._tiptapEditor) return;`) en benoemde functies (rij/kolom invoegen/wissen, kopregel togglen, merge/split, celkleur). Zo raakt een BlockNote-upgrade één bestand. **Geen gedragsverandering.**

- [ ] **Fase A afgerond** (`editorActions.js` + `tableCommands.js` bestaan; merge-knop werkt; oude tabel-entries laden; build + lint groen)

**Paste-prompt Fase A:**

> Voer `STAPPENPLAN-NOTION-EDITOR.md` §3 uit: A1 → A2 → A3, één stap per keer. In A1 herstel je de bron met `git show fae4d31:...MobileToolbar.jsx` en extraheer je alleen de geverifieerde bindingen naar `editorActions.js`; sluit geen vaste balk aan. Na A2 open je een bestaande entry mét tabel om te bevestigen dat opgeslagen `doc`'s nog laden. Per stap `npm run build` + `npm run lint` groen. Werk `UITVOERING.md` bij.

---

## 4. Fase B — Het pop-up blok-menu (de kern van de Notion-wens)

Doel: een handvat (⠿) bij het **actieve** blok → tik → menu met alle blok-acties. Gebouwd op BlockNote's ingebouwde zijmenu (D2=a), niet hand-gerekend.

### B1 — Handvat op het actieve blok (niet op hover)

- Hook `useActiveBlock(editor)`: houdt het actieve blok bij via `getTextCursorPosition().block` + `editor.onSelectionChange(...)`. **Ruim de listener op** in de cleanup (het patroon uit de git-`MobileToolbar` is correct — neem het over).
- Render het zijmenu via `SideMenuController` met een eigen `sideMenu`-render-prop die het handvat toont voor het **actieve** blok (uitkomst van Fase 0 ⚠️-2). Hergebruik BlockNote's `DragHandleButton` voor de knop zelf en positionering — reken niet zelf.
- Naast het handvat een **"+"**-knop die direct het slash-menu opent (`openSlashMenu` uit `editorActions.js`) — Notion-achtig.

### B2 — Het menu (`DragHandleMenu`, uitgebreid met eigen items)

Gebruik BlockNote's `DragHandleMenu` als container en vul 'm met `RemoveBlockItem` + `BlockColorsItem` (ingebouwd) plus eigen items via `editorActions.js`. **Geen apart bottom-sheet-systeem** tenzij `DragHandleMenu` op touch te krap blijkt (dan pas het `src/ui`-Sheet-patroon als plan B). Inhoud:

- **Type wijzigen** ("Turn into"): Tekst / Kop 1-3 / Opsomming / Genummerd / Checklist / Citaat → `setBlockType`.
- **Dupliceren** → `insertBlocks([blokZonderId], block, "after")` (Fase 0 ⚠️-1 bevestigd).
- **Kopiëren** → markdown naar klembord via `blocksToMarkdownLossy([block])`.
- **Verwijderen** → `RemoveBlockItem` (ingebouwd).
- **Omhoog / Omlaag** → `moveUp` / `moveDown`.
- **Kleur** → `BlockColorsItem` (ingebouwd).
- **Opmaak** → alleen als D2b=(b): een rij B/I/U/link hier (`toggleStyle`). Bij D2b=(a) zit opmaak in de bubbel (B3), niet hier.
- **Tabel-acties** → alleen als `block.type === "table"`: via `tableCommands.js` (A3).
- **Na elke actie:** `editor.focus()` en het menu sluiten (voorkomt cursor-wegspringen). Geef elk item een `aria-label`.

### B3 — Opmaak-bubbel op selectie (D2b=(a); losse, terugdraaibare poging)

- Voeg `<ExperimentalMobileFormattingToolbarController />` toe als kind van `BlockNoteView` (met `formattingToolbar={false}`, dat staat er al). Hergebruik de bestaande `CuratedToolbar`/`TOOLBAR_KEYS` als inhoud.
- **Echt-toestel-test verplicht.** Werkt het strak → klaar, opmaak-rij uit B2 weglaten. Flikkert/valt het achter het toetsenbord → verwijder deze component weer en zet de opmaak-rij in B2 aan (D2b=(b)). Noteer de uitkomst in `UITVOERING.md`.

- [ ] **Fase B afgerond** (handvat + menu: type wijzigen, dupliceren, kopiëren, verwijderen, verplaatsen, kleur werken op touch; opmaak volgens de gekozen D2b-route)

**Paste-prompt Fase B:**

> Voer `STAPPENPLAN-NOTION-EDITOR.md` §4 uit: B1 → B2 → B3, één stap per keer. Bouw op BlockNote's `SideMenuController` + `DragHandleMenu` (niet hand-gerekend), alle blok-acties via `editorActions.js`. In B3 probeer je eerst `ExperimentalMobileFormattingToolbarController` (D2b=a) en test je op een echt toestel; valt het tegen, val terug op de opmaak-rij in het menu (D2b=b) en noteer dat. Per stap build + lint groen, `editor.focus()` + sluiten na elke actie.

---

## 5. Fase C — Tabellen touch-vriendelijk

### C1 — Kolombreedte-handles vergroten

De resize-handles zijn native maar dun (muisgericht). Vergroot het **raakvlak** via CSS in `richEditor.css` op de tabel-handle-elementen (zoek de exacte `.bn-*`-selector in de DOM op). Uiterlijk niet zwaarder maken; test op een echt toestel.

### C2 — Rijhoogte = bewust niet ondersteund (D4)

`rowHeights` bestaat niet. Noteer in `UITVOERING.md`: _"rijhoogte bewust niet ondersteund — rijen groeien met hun inhoud."_ Geen code.

### C3 — Tabel-acties zitten al in B2

De tabel-acties uit `tableCommands.js` staan al in het blok-menu (B2, `block.type === "table"`). Geen aparte plek. Alleen controleren dat ze op touch werken.

- [ ] **Fase C afgerond**

---

## 6. Fase D — Extra Notion-blokken (los, naar wens)

> **Blokkeer-regel:** vóór het **eerste** custom blok een `docSchemaVersion` per entry + een validatie/opschoon-stap bij het laden invoeren (audit-punt 4). Dat raakt het datamodel → **eerst migratie + controle door de gebruiker.** Niet stilletjes.

- **D1 — Callout/notitie-blok** via `createReactBlockSpec` (Alert-patroon), `content: "inline"`; toevoegen aan schema + `SLASH_KEYS`. Let op #1802 (lege custom blokken tonen soms geen plaatshouder).
- **D2 — Toggle/inklapbaar** via `createReactBlockSpec` + `ToggleWrapper`; stabiele `id` zodat open/dicht een herlaad overleeft.
- **D3 — Plaatshouders** — controleer de NL-locale-teksten in lege blokken; voeg per-bloktype hints toe waar nuttig.
- **D4 — Link op mobiel** — knop in het blok-menu (of in de bubbel bij D2b=a) die een link op de selectie zet/bewerkt via de editor-API (werkt zonder hover).
- **D5 — Multi-column** — **overgeslagen** (GPL, D3-beslissing = nee).

- [ ] **Fase D afgerond** (of per punt bewust uitgesteld — noteren)

---

## 7. Audit-punten die een fase raken (inplannen wanneer relevant)

1. **Zoekindex mist tabellen/custom blokken.** `body` = `blocksToMarkdownLossy` is lossy. Overweeg een aparte plain-text-extractie (alle tekst-nodes plat uit `doc`) los van de markdown-export. → inplannen zodra custom blokken komen (Fase D).
2. **Schema-versie (`docSchemaVersion`).** Verplicht vóór het eerste custom blok (§6-blokkeerregel). Datamodel → migratie + controle.
3. **RTL (Arabisch/Tarifit).** Bekende BlockNote-bug met gespiegelde drag/resize in RTL. Nu buiten scope; bewust geparkeerd.
4. **Multi-block-select** (Notion selecteert meerdere blokken) — buiten scope; Fase B doet één blok.
5. **Afbeeldingen bewust uit** (geen backend). Kan later lokaal via blob-URL/Dexie. Niet als "missend" behandelen.
6. **Laag 5 (cursor/IME op Android)** blijft staan — geen enkele stap hier lost native cursor-/toetsenbordgedrag op. Verwachtingsmanagement.
7. **Performance/cleanup.** Elke `onSelectionChange`/`onChange`-listener netjes opruimen; handle-positionering niet elke render herberekenen.

---

## 8. Volgorde & werkafspraken

1. **Fase 0** (vastleggen + 2 open punten) — eerst.
2. **Fase A** (fundering + latente bugs) — kleinste risico.
3. **Fase B** (blok-menu) — de kern.
4. **Fase C** (tabellen touch).
5. **Fase D** (extra blokken) — los; §6-blokkeerregel vóór het eerste custom blok.

Per stap: `npm run build` groen + `npm run lint` schoon vóór "klaar". Geen datamodel-wijziging zonder migratie + controle. `UITVOERING.md` bijwerken, korte commit-boodschap voorstellen, niet pushen zonder vragen. **Echt-toestel-test** bij B1/B3 en C1 — daar zit het mobiele risico, niet in de build.
