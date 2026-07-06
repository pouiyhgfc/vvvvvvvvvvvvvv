# PLAN — BlockNote Notion-waardig maken (Routine Tracker PWA)

> **Voor het uitvoerende model (Claude Code / Sonnet):** dit is een compleet uitvoeringsplan in dezelfde conventie als `PLAN-MOBIELE-EDITOR-EN-AUDIT.md`. Werk **één stap per keer**, verander **nooit** functionaliteit én structuur tegelijk, draai na elke wijziging `npm run build` (+ lint) en zeg pas "klaar" als het schoon bouwt. Wijzig **geen** Dexie-sleutels of dataformaat zonder expliciete migratie. Gebruik de gedeelde primitives in `src/ui/` en de bestaande CSS-tokens; bouw geen tweede stijlsysteem. Emoji's via `<Emoji>`. Werk `UITVOERING.md` bij en stel per fase een commit-boodschap voor.

---

## Context (verplichte achtergrond)

**Doel van dit plan:** de editor in het logboek meer als Notion laten voelen — met name (a) blok-interacties op mobiel (tik/selecteer een blok → kopiëren, dupliceren, verwijderen, type wijzigen, "/" openen) en (b) betere tabelbediening. Plus alles wat daarbij hoort en nu ontbreekt.

**Wat er nu staat (geverifieerd in de code):**

- `src/features/logbook/RichEditor.jsx` — één `useCreateBlockNote`-instance, NL-locale, Evergreen-tokens via `EVERGREEN_TOKENS`. Slash-menu en opmaak-toolbar zijn vervangen (`slashMenu={false}`, `formattingToolbar={false}`) door een gecureerde set (`SLASH_KEYS`, `TOOLBAR_KEYS`). **Zijmenu, link-toolbar, tabel-handvatten en emoji-picker zijn nog de defaults.** Ref exposeert `getMarkdown()`.
- `src/features/logbook/MobileToolbar.jsx` — **compleet gebouwde, touch-only werkbalk** (VisualViewport-positionering boven het toetsenbord; stijlen, koppen, lijsten, in-/uitspringen, undo/redo, "/"-opener, en tabel-acties via `editor._tiptapEditor.commands`). Geverifieerd tegen de 0.51.4-typings. **Wordt echter door niets geïmporteerd of gerenderd** (`grep` bevestigt: geen enkele consument).
- `src/features/logbook/EntryPage.jsx` — mount `RichEditor` lazy (Suspense) met `ref`, `initialContent`, `onChange`, `theme`.
- Datamodel (`src/lib/db.js`): `logEntries: "&id, date, createdAt"`, records `{ id, notebookId, date, createdAt, doc, text }`. **`doc`** = BlockNote-blocks (bron van waarheid). **`text`** = `blocksToMarkdownLossy(doc)`, gebruikt als **zoekindex**.
- Versies: `@blocknote/{core,react,mantine}` ^0.51.4, React ^19.2, Vite ^6.3, Dexie ^4.4.

**De muur (laag 5 — buiten scope):** hoe tekst het document in komt (Android-toetsenbord, IME, cursorsprongen, native selectie) is ProseMirror en **niet** aanpasbaar via de BlockNote-API. Dit plan verbetert laag 1–4 (uiterlijk, UI-componenten, schema, editor-API). Als je resterende pijn cursor-/IME-gedrag is, lost geen enkele stap hieronder dat op — dat is een engine-keuze, geen customization-keuze.

**Ontwerpprincipe (leidend voor dit hele plan): pop-ups, geen vaste balk.** We volgen Notion's model: contextmenu's die opkomen bij het blok of de selectie waar je mee bezig bent, niet één werkbalk die permanent aan het toetsenbord plakt. De bestaande `MobileToolbar` (vaste balk boven het toetsenbord) wordt **niet** aangesloten en gaat uit dit ontwerp. Het werk erin is niet verspild: de tegen de typings geverifieerde API-bindingen (type wisselen, lijsten togglen, in-/uitspringen, tabel-commando's, "/"-opener, undo/redo) worden **hergebruikt binnen de pop-ups** (CLAUDE.md: hergebruiken, geen parallelle kopie). Notion's systeem bestaat uit twee pop-ups: een **blok-menu** (via een handvat, zonder tekstselectie — robuust) en een **opmaak-bubbel** (bij een tekstselectie — het enige stuk dat op Android lastig blijft, want dat concurreert met native selectie + toetsenbord).

---

## Beslissingen die je eerst moet maken (forks)

Deze bepalen de scope van de fasen. Kies bewust; het plan noemt per fase wat de keuze betekent.

**D1 — Componentbibliotheek: Mantine houden of overstappen?**
Je gebruikt `@blocknote/mantine`. Alternatieven met identieke functionaliteit: `@blocknote/ariakit` (lichter, minder afhankelijkheden) en `@blocknote/shadcn` (Tailwind). Voor een mobiele PWA is Mantine relatief zwaar, en je stuurt de meeste UI toch al zelf aan (`MobileToolbar`, gecureerde toolbar). *Advies:* **houd Mantine voor nu** — een swap raakt élk menu en is een eigen project. Zet 'm op de backlog, niet in dit plan. (Als je 'm tóch wilt: het is een geïsoleerde fase, want alleen de `BlockNoteView`-import en enkele component-imports veranderen.)

**D2 — Hoe open je het blok-menu (de pop-up)?**
Het blok-menu is een pop-up (bottom sheet of zwevend menu), niet een vaste balk. Hoe roep je 'm op?
- **(a) Handvat (⠿) in de linkermarge** dat verschijnt voor het actieve blok (touch-variant van Notion's ⠿). Tik = plaats cursor; tik op het handvat = pop-up opent. *Robuust, botst niet met native selectie. Notion's eigen model.*
- **(b) Long-press op het blok** → pop-up. *Voelt direct, maar botst met Android's native woord-selectie (long-press = woord selecteren). Fragiel.*

*Advies:* **(a).** Het handvat is precies wat Notion doet en vermijdt het selectie-conflict. (b) alleen als aanvulling en als je bereid bent ermee te vechten. Fase B is op (a) geschreven.

**D2b — Opmaak (vet/cursief/kleur/link): hoe?**
Dit is het enige echt lastige stuk op Android. Twee routes:
- **(a) Notion-bubbel:** een zwevende pop-up die bij een tekstselectie boven de selectie verschijnt (BlockNote's default `FormattingToolbar`, maar met mobiele positionering die rekening houdt met VisualViewport zodat 'm niet achter het toetsenbord valt). *Meest Notion-exact, maar concurreert met de native selectie-UI van Android — hier zit het risico op "gaar".*
- **(b) In het blok-menu gevouwen:** geen aparte selectie-bubbel; een "Opmaak"-rij (B/I/U/kleur/link) zit in dezelfde pop-up als de blok-acties, en werkt op de huidige selectie of het hele blok. *Minder Notion-exact, maar robuust — geen gevecht met native selectie.*

*Advies:* begin met **(b)** (robuust, snel klaar, past in het pop-up-principe). Probeer **(a)** pas als (b) in de praktijk te beperkt voelt; behandel het als een aparte, geïsoleerde poging met echt-toestel-test, want dit is de plek waar het op Android alsnog kan tegenvallen. **Dit is de beslissing die ik van je nodig heb voordat Fase B helemaal vastligt.**

**D3 — Echte Notion-kolommen (blokken naast elkaar)?**
Dat vereist `@blocknote/xl-multi-column`, dat onder **GPL-3.0 / betaald voor closed source** valt. Je PWA is persoonlijk; als je 'm nooit closed-source distribueert is GPL-3.0 acceptabel. *Advies:* alleen doen als je het echt wilt (Fase D5, optioneel). Tabellen zelf zitten in de gratis kern — geen probleem.

**D4 — Hoe ver ga je met tabellen?**
Kolombreedtes: **native mogelijk** (sleep-handles, `columnWidths`). Rijhoogtes: **niet ondersteund** in het model — rijen groeien met hun inhoud; alleen `min-height` via CSS. Merge/split/headers/celkleur: via de `tables`-optie. *Beslis:* accepteer je "geen instelbare rijhoogte" of wil je de CSS-min-height-workaround (Fase C2)?

---

## Fase 0 — API-verificatie (verplichte eerste stap, GEEN code)

Bevestig tegen de **geïnstalleerde** 0.51.4-typings (net als B0 in het vorige plan). Noteer de bevindingen in `UITVOERING.md`. Verifieer:

1. **Blok manipuleren:** `editor.insertBlocks(blocks, referenceBlock, "after")`, `editor.removeBlocks([block])`, `editor.replaceBlocks(...)` — exacte signaturen.
2. **Blok verplaatsen:** bestaat er een publieke move-API (bv. `moveBlocksUp/Down`) of moet herordenen via `removeBlocks` + `insertBlocks`? Noteer welke.
3. **Blok dupliceren:** kun je een blok uit `editor.document` lezen, de `id` weglaten, en via `insertBlocks` opnieuw invoegen (nieuwe id's worden dan toegekend)? Bevestig gedrag met geneste children.
4. **Zijmenu-API:** `SideMenu`, `SideMenuController`, `DragHandleButton`, `DragHandleMenu`, `RemoveBlockItem`, `BlockColorsItem` — bestaan in `@blocknote/react` 0.51.4. Bevestig hoe je de zichtbaarheid op **selectie** i.p.v. **hover** kunt sturen (via `SideMenuController`-props of eigen positionering).
5. **Tabel-optie:** `useCreateBlockNote({ tables: { splitCells, cellBackgroundColor, cellTextColor, headers } })` — bevestig de sleutels en dat ze bestaande opgeslagen tabel-blokken niet breken.
6. **Tabel-content-model:** `columnWidths: number[]` bestaat; er is **geen** `rowHeights`. Bevestig.
7. **Private API-risico:** `editor._tiptapEditor.commands.*` en `editor.getExtension("suggestionMenu")` — nog aanwezig in 0.51.4 (zijn ze). Markeer als breekpunt bij een toekomstige upgrade.
8. **Custom-blok-valkuil:** bevestig issue #1802 (lege custom blokken tonen geen plaatshouder / cursor kan verdwijnen) nog relevant is voor Fase D — bepaalt of we `createReactBlockSpec` of de `createStronglyTypedTiptapNode`-route nemen.

- [ ] **Fase 0 afgerond** (bevindingen genoteerd in UITVOERING.md; onzekere API's opgelost vóór code)

---

## Fase A — Bindingen redden & latente bugs (klein, geïsoleerd, eerst)

Deze fase levert al veel op zonder nieuwe UI, want er staat werk klaar dat niet is aangesloten.

### A1 — Bindingen redden uit `MobileToolbar`, dan de vaste balk retireren
De vaste balk gaat níét aan (ontwerpprincipe: pop-ups). Maar de geverifieerde editor-aanroepen erin zijn waardevol. Haal ze eruit vóór je de rest bouwt, zodat Fase B ze hergebruikt:

- Maak `src/features/logbook/editorActions.js` met pure, benoemde functies die de `editor` als argument nemen: `setBlockType(editor, type, props)`, `toggleListType(editor, type)`, `toggleStyle(editor, key)`, `nest(editor)`/`unnest(editor)`, `openSlashMenu(editor)` (via `getExtension("suggestionMenu")`), `undo`/`redo`. Kopieer de exacte vormen 1-op-1 uit `MobileToolbar.jsx` (ze zijn al tegen de typings geverifieerd).
- **Retireer** `MobileToolbar.jsx` uit het ontwerp: sluit 'm niet aan. Laat het bestand voorlopig staan tot Fase B werkt (dan pas verwijderen, in de opschoonronde, ná verificatie via Knip dat niets het meer gebruikt — CLAUDE.md).
- **Let op:** dit is puur extraheren, geen gedragswijziging en geen nieuwe UI.

### A2 — Geavanceerde tabel-features aanzetten (latente bug)
`tableCellMergeButton` staat in `TOOLBAR_KEYS`, maar zonder de `tables`-optie doet die niets. Zet aan in `useCreateBlockNote`:
```js
tables: { splitCells: true, cellBackgroundColor: true, cellTextColor: true, headers: true }
```
Controleer dat bestaande opgeslagen tabel-blokken nog laden (Fase 0.5). Dit repareert de merge-knop én geeft headers/celkleuren die je `MobileToolbar` al deels aanstuurt (`toggleHeaderRow`).

### A3 — Private tabel-API inkapselen
`MobileToolbar` roept `editor._tiptapEditor.commands[...]` direct aan — dat breekt bij een BlockNote-upgrade. Verplaats deze aanroepen naar één klein helperbestand (`src/features/logbook/tableCommands.js`) met een guard (`if (!editor._tiptapEditor) return`) en benoemde functies. Zo raakt een upgrade straks één plek i.p.v. de hele toolbar. **Geen gedragsverandering** — puur inkapselen.

- [ ] **Fase A afgerond** (bindingen in `editorActions.js`; vaste balk niet aangesloten; merge-knop werkt; private tabel-API geïsoleerd)

---

## Fase B — Het pop-up blok-menu (de kern van je Notion-wens)

Doel: Notion's systeem. Een handvat bij het actieve blok → tik → **pop-up menu** met alle acties. Geen vaste balk. Gebouwd op **D2 = (a) handvat** en **D2b** voor opmaak.

### B1 — Handvat bij het actieve blok
- Nieuwe hook `useActiveBlock(editor)`: houdt het actieve blok bij via `editor.getTextCursorPosition().block` + `editor.onSelectionChange`. Ruim de listener netjes op (zoals `MobileToolbar` al deed).
- Toon een klein handvat (⠿) in de linkermarge van het actieve blok. Positioneer aan de blok-DOM-node (`editor.domElement` → `[data-id="<block.id>"]`), niet op hover.
- **Onderzoek eerst (Fase 0.4) of BlockNote's `SideMenuController` + `DragHandleButton` de positionering al voor je doet** en of je 'm op selectie i.p.v. hover kunt laten tonen. Zo ja: hergebruik dat i.p.v. zelf rekenen. Zo nee: eigen absolute positionering t.o.v. de blok-node.
- Tik op ⠿ → open de pop-up (B2). Ook een **"+"** naast het handvat is Notion-achtig: opent direct het slash-menu (`openSlashMenu` uit `editorActions.js`).

### B2 — De pop-up (bottom sheet)
Eén pop-up-component, gebouwd op het **bestaande sheet-patroon uit `src/ui`** (zoals `LogEntrySheet`/`NotebookSheet`) — geen nieuw overlay-systeem. Komt op vanaf onder, sluit bij tik buiten/veeg omlaag. Inhoud (alles via `editorActions.js`, dus geen dubbele logica):
- **Type wijzigen** — een rij: Tekst / Kop 1-3 / Opsomming / Genummerd / Checklist / Citaat (`setBlockType`, `toggleListType`). Dit is Notion's "Turn into".
- **Dupliceren** — `insertBlocks([blokZonderId], block, "after")` (exacte vorm uit Fase 0.3).
- **Kopiëren** — blok naar klembord (markdown via `blocksToMarkdownLossy([block])`).
- **Verwijderen** — `removeBlocks([block])`.
- **Omhoog / Omlaag** — één positie verplaatsen (move-API of remove+insert uit Fase 0.2). Robuuster dan slepen op touch.
- **Opmaak** — afhankelijk van **D2b**: bij (b) een rij B/I/U/kleur/link hier in de pop-up (`toggleStyle`); bij (a) niet hier, maar via de aparte selectie-bubbel (B3).
- **Tabel-acties** — alleen tonen als `block.type === "table"`: rij/kolom invoegen/wissen, kopregel, merge/split, celkleur (via de ingekapselde tabel-helper uit A3).
- Na elke actie: `editor.focus()` en de pop-up sluiten, zodat de cursor niet "wegspringt".

### B3 — Opmaak op selectie (alleen als D2b = a)
Als je de Notion-bubbel wilt: render BlockNote's `FormattingToolbar` (je bestaande `CuratedToolbar`) via de `FormattingToolbarController`, maar corrigeer de positie op touch met de VisualViewport-offset (hergebruik de reken-logica die nu in `MobileToolbar` staat) zodat de bubbel niet achter het toetsenbord valt. **Behandel dit als een aparte poging met echt-toestel-test** — dit is de plek waar het op Android alsnog "gaar" kan worden. Valt het tegen: schakel terug naar D2b = (b) (opmaak in de pop-up) en accepteer dat als de robuuste oplossing.

- [ ] **Fase B afgerond** (handvat + pop-up: type wijzigen, dupliceren, kopiëren, verwijderen, verplaatsen werkt op touch; opmaak volgens D2b)

---

## Fase C — Tabellen touch-vriendelijk

### C1 — Kolombreedte-handles vergroten
De resize-handles zijn native aanwezig maar dun (muisgericht). Vergroot het raakvlak via CSS op de tabel-handle-elementen (`.bn-*`, exacte selector in de DOM opzoeken), zonder het uiterlijk zwaar te maken. Test op een echt toestel.

### C2 — Rijhoogte (beslissing D4)
Er is **geen** rijhoogte in het model. Als je hoogte wilt: voeg een `min-height` toe op tabelcellen via CSS. Documenteer expliciet dat dit een benadering is, geen per-rij-instelling. Wil je dat niet: sla deze stap over en noteer "rijhoogte = bewust niet ondersteund" in UITVOERING.md.

### C3 — Tabel-acties in het pop-up menu
Je `MobileToolbar` toont tabel-acties al als `block.type === "table"`. Breng dezelfde acties (rij/kolom invoegen/wissen, kopregel, merge/split, celkleur) naar het pop-up blok-menu uit Fase B, zodat tabelbewerking op één plek zit en niet alleen in de toetsenbordbalk. Hergebruik `tableCommands.js` (A3).

- [ ] **Fase C afgerond**

---

## Fase D — Notion-blokken die je (nog) mist

Kies wat je wilt; elk punt is los te doen. Let op de custom-blok-valkuil uit Fase 0.8 (#1802): voor blokken die zich als tekstblok gedragen mogelijk de `createStronglyTypedTiptapNode`-route i.p.v. `createReactBlockSpec`.

### D1 — Callout / notitie-blok
Notion-callout via `createReactBlockSpec` (patroon = het Alert-voorbeeld): een blok met icoon + gekleurde achtergrond, `content: "inline"`. Voeg toe aan schema, aan het gecureerde slash-menu (`SLASH_KEYS`) en optioneel aan het pop-up menu.

### D2 — Toggle / inklapbaar blok
`createReactBlockSpec` + `ToggleWrapper` (BlockNote levert dit patroon). Geef een stabiele `id` mee zodat de open/dicht-staat een herlaad overleeft. Handig voor je Hifd-/reflectie-entries.

### D3 — Plaatshouder-teksten
Notion toont "Typ '/' voor commando's" in lege blokken. Bevestig of de default-plaatshouders in je NL-locale goed vertaald zijn; voeg per-bloktype hints toe waar nuttig. (Voor custom blokken: let op #1802 — lege custom blokken tonen soms géén plaatshouder.)

### D4 — Link bewerken op mobiel
De link-toolbar is nu default (hover/desktop). Voeg in het pop-up blok-menu (of in de opmaak-bubbel bij D2b=a) een expliciete "link"-knop toe die op de selectie een link zet/bewerkt via de editor-API, zodat het op touch werkt zonder hover.

### D5 — (optioneel) Multi-column
Alleen als D3-beslissing = ja. `@blocknote/xl-multi-column` (`withMultiColumn`, `multiColumnDropCursor`, slash-items). **Licentie:** GPL-3.0/betaald — bevestig dat dat past bij hoe je de app distribueert. Eigen, geïsoleerde fase.

- [ ] **Fase D afgerond** (of per punt bewust uitgesteld — noteren in UITVOERING.md)

---

## Audit — wat je waarschijnlijk over het hoofd hebt gezien

Niet alles hieronder is een taak; sommige zijn bewuste keuzes of risico's om te kennen.

1. **`MobileToolbar` was niet aangesloten — en dat is prima, want de vaste-balk-vorm wilde je niet.** Het stond klaar maar werd nooit gerenderd; in dit ontwerp retireren we de balk en verhuizen we alleen de geverifieerde bindingen naar de pop-ups. → Fase A1 + B.
2. **Merge-knop zonder tabel-optie = dode knop.** `tableCellMergeButton` zonder `tables.splitCells`. → Fase A2.
3. **Zoekindex mist tabellen en custom blokken.** `text` = `blocksToMarkdownLossy` — markdown is lossy; tabel-inhoud, callouts en custom blokken komen er slecht of niet in, dus je logboek-zoek vindt ze niet. Overweeg een aparte, betere plain-text-extractie voor de index (alle tekst-nodes plat trekken uit `doc`) los van de markdown-export.
4. **Schema-evolutie / achterwaartse compatibiliteit.** Custom blokken toevoegen is veilig (oude entries missen ze gewoon). Maar een custom blok later **weghalen** breekt opgeslagen `doc`'s die het blok bevatten. Introduceer een `docSchemaVersion` per entry en een validatie/opschoon-stap bij het laden, vóór je custom blokken toevoegt. Raakt het datamodel → migratie + jouw controle (CLAUDE.md-regel).
5. **Private-API-breekrisico.** `editor._tiptapEditor` en `getExtension` zijn niet-publiek. Bij de BlockNote-upgrade (Fase D in je bestaande plan) is dit het eerste wat kan breken. → ingekapseld in A3, maar houd het op de radar.
6. **RTL voor Arabisch/Tarifit.** Je leert Arabisch en Tarifit; als je die in entries typt, is tekstrichting relevant. Er is een bekende BlockNote-bug met gespiegelde drag/resize in RTL. Beslis of je per-blok of per-entry een `dir`-instelling wilt. Nu buiten scope, maar goed om bewust te parkeren.
7. **Multi-block-select ontbreekt.** Notion laat je meerdere blokken tegelijk selecteren en bewerken. Fase B doet één blok. Meerdere blokken tegelijk (vooral op touch) is een aparte, grotere klus — bewust buiten scope houden of expliciet inplannen.
8. **Undo/redo bindingen bestaan al** (✓, geverifieerd) — neem ze mee naar de pop-up (of een klein hoekje van de UI) en houd desktop en touch symmetrisch.
9. **Afbeeldingen bewust uit.** Je liet media-uploads weg (geen backend). Prima keuze; noteer het zodat je het later niet als "missend" behandelt. Wil je het ooit: image-blok kan lokaal via een blob-URL/Dexie-opslag, zonder backend.
10. **Laag 5 blijft staan.** Al het bovenstaande maakt de editor Notion-achtiger in *bediening en uiterlijk*, maar raakt cursor-/IME-gedrag op Android niet. Verwachtingsmanagement: als dát je hoofdpijn is, is dit plan de verkeerde hefboom en gaat het gesprek terug naar engine-keuze.
11. **Performance & opruimen.** Lazy-load van `RichEditor` is goed. Let er bij Fase B op dat elke `onSelectionChange`/`onChange`-listener netjes wordt opgeruimd (het patroon uit `MobileToolbar` is correct — neem het over) en dat de handle-positionering niet op elke render herberekent.
12. **Toegankelijkheid.** Het `aria-label`-patroon uit `MobileToolbar` is goed (✓). Doe hetzelfde in de pop-up en zorg dat focus terugkeert naar het blok na een actie (`editor.focus()`), anders "verspringt" de cursor na kopiëren/verwijderen.

---

## Volgorde & werkafspraken (samenvatting voor het uitvoerende model)

1. **Fase 0** (verificatie, geen code) — eerst, altijd.
2. **Fase A** (bindingen redden uit `MobileToolbar` + latente bugs) — kleinste risico; doe deze vóór alle nieuwe UI.
3. **Fase B** (pop-up blok-menu) — de kern van de Notion-wens.
4. **Fase C** (tabellen touch) — bouwt op A2/A3 en B.
5. **Fase D** (extra blokken) — los, naar wens.
6. Audit-punten 3, 4 en 6 (zoekindex, schema-versie, RTL) inplannen zodra ze een fase raken; 4 (schema-versie) **vóór** het eerste custom blok in Fase D.

Per stap: `npm run build` groen + `npm run lint` schoon vóór "klaar". Geen datamodel-wijziging zonder migratie en jouw controle. `UITVOERING.md` bijwerken en een korte commit-boodschap voorstellen. Niet pushen zonder vragen.

---

## Klaar-om-te-plakken Claude Code-prompts (per fase)

**Fase 0:**
> Lees `PLAN-NOTION-EDITOR.md` Fase 0. Verifieer élk punt tegen de geïnstalleerde `@blocknote/*` 0.51.4-typings in `node_modules`. Schrijf geen app-code. Noteer de bevindingen (met exacte signaturen) in `UITVOERING.md` en meld welke onzekere API's zijn opgelost.

**Fase A:**
> Voer `PLAN-NOTION-EDITOR.md` Fase A uit, stap A1 → A2 → A3, één stap per keer. In A1 extraheer je de geverifieerde editor-aanroepen uit `MobileToolbar.jsx` naar `editorActions.js` en sluit je de vaste balk NIET aan (die retireren we). Verander per stap alleen wat de stap zegt, draai `npm run build` + `npm run lint`, en bevestig dat bestaande opgeslagen entries (incl. tabellen) nog laden. Werk `UITVOERING.md` bij.

**Fase B:**
> Voer `PLAN-NOTION-EDITOR.md` Fase B uit: een handvat bij het actieve blok dat een **pop-up menu** opent (Notion-model, D2=a), gebouwd op het bestaande sheet-patroon in `src/ui`. Alle acties via `editorActions.js` (geen dubbele logica). Opmaak volgens beslissing D2b=[a/b — vul in]. Eén stap per keer, build + lint groen, `editor.focus()` en sluiten na elke actie.

Pas de prompts voor C en D aan zodra je de beslissingen D1–D4 en D2b hebt gemaakt.
