# Ontwerp & design-systeem

> Het fundament onder de UI. Zo blijft alles consistent en hoeft elke nieuwe feature
> alleen nog inhoud te leveren, geen eigen stijl. De harde regels staan kort in
> `.claude/rules/ui.md` (en `editor.md` voor het logboek); hier staan de details en voorbeelden.

## Ontwerp v2 — richting B "Zacht" (doel van fase 4)

Gekozen op 27-10-2026 (zie `.md/PLAN-VERBETERING.md`, fase 2). Mockups: Design-canvas
"Routine redesign — richtingen" op claude.ai, rijen **B**. Dit hoofdstuk is de bouwtekening;
de secties daaronder beschrijven de huidige stand en verdwijnen scherm voor scherm tijdens
fase 4.

**Gevoel:** rustig en minimaal. Weinig opties per scherm, maar alles wat nodig is werkt.
Witte kaarten met ruime hoeken op een licht groengrijze ondergrond; Evergreen-groen is de
enige accentkleur. Geen verlopen, geen emoji als UI-icoon.

### Kleuren (tokens)

| Token               | Licht                           | Donker                       | Gebruik                                       |
| ------------------- | ------------------------------- | ---------------------------- | --------------------------------------------- |
| `--bg`              | `#eef1ec`                       | `#0f1411`                    | ondergrond van elk scherm                     |
| `--card`            | `#ffffff`                       | `#182019`                    | kaarten, tabbalk, sheets                      |
| `--sunken`          | `#f1f3f0`                       | `#1f2822`                    | invoervelden, chips, keuzeknoppen             |
| `--track`           | `#e3ebe5`                       | `#26312b`                    | voortgangsbalken, segment-achtergrond, lijnen |
| `--control-border`  | `#c3ccc6`                       | `#4a554e`                    | lege checkbox, rand van bedieningselementen   |
| `--text`            | `#17201b`                       | `#e8ece9`                    | tekst                                         |
| `--text-muted`      | `#56605a`                       | `#9aa39d`                    | bijschriften, tijden, labels (≥ 4,5:1)        |
| `--accent`          | `#0e7a52`                       | `#1fa06a`                    | primaire knop, actieve tab, voortgang         |
| `--accent-text`     | `#0a5a3c`                       | `#5fd6a0`                    | groene tekst op `--card`/`--accent-bg`        |
| `--accent-bg`       | `#e1f1e8`                       | `#10251b`                    | zachte groene vlakken (pill "Nu", tags)       |
| `--accent-contrast` | `#ffffff`                       | `#06140d`                    | tekst/iconen óp `--accent`                    |
| `--danger-text`     | `#b42318`                       | `#f0867c`                    | verwijderen, "Zwak"                           |
| `--danger-bg`       | `#fdf0ee`                       | `#2a1614`                    | rode vlakken                                  |
| `--shadow-float`    | `0 6px 24px rgba(20,40,30,.10)` | `0 6px 24px rgba(0,0,0,.45)` | tabbalk, zwevende knop                        |

Datakleuren (gebieden, event-kleuren, heatmap) blijven letterlijke hex uit de data.

### Typografie

Twee families: **Outfit** (koppen, cijfers in kaarten) en **DM Sans** (alle overige tekst);
**Noto Naskh Arabic** voor Arabisch. Schibsted Grotesk vervalt. Fonts lokaal via
`@fontsource`, met `latin` + `latin-ext` (Tarifit: ɛ ɣ č ḍ ṛ ẓ).

| Token      | Grootte | Gebruik                                |
| ---------- | ------- | -------------------------------------- |
| `--fs-xs`  | 12 px   | kleinste labels, tab-labels, chips     |
| `--fs-sm`  | 14 px   | bijschriften, tijden, secundaire tekst |
| `--fs-md`  | 16 px   | lopende tekst, lijstrijen, invoer      |
| `--fs-lg`  | 18 px   | kaarttitels (Outfit)                   |
| `--fs-xl`  | 20 px   | sheet-titels, grote getallen (Outfit)  |
| `--fs-2xl` | 30 px   | paginatitel (Outfit)                   |

Niets kleiner dan 12 px. Regelhoogte 1,45 voor tekst, 1,2 voor koppen; Arabisch 1,6–1,8.

### Maten

- **Ruimte:** 4 · 8 · 12 · 16 · 20 · 24 px (`--sp-1` … `--sp-6`). Schermrand 16 px, kaart-padding 16–18 px, 12 px tussen kaarten.
- **Hoeken:** 10 px (segmenten, kleine knoppen) · 14 px (invoer, knoppen) · 20 px (kaarten) · 24 px (sheets, hero-kaarten) · rond (pills).
- **Tikvlak:** minimaal 44 × 44 px.
- **Beweging:** 150–220 ms ease-out; geen beweging bij `prefers-reduced-motion`.

### Iconen

Eén set lijniconen: Phosphor (regular, MIT) plus eigen tekeningen in dezelfde stijl
(tasbih, gebedskleed, yaz). Paden staan in `ui/glyphs.js` (gegenereerd door
`npm run glyphs`), getekend door `ui/Icon.jsx` in `currentColor`. Routines, sjablonen en
notitieboeken houden hun emoji in het `icon`-veld (geen migratie); `<Emoji>` toont dat via
`lib/emojiGlyph.js` als lijnicoon, een vlag als lettertegel met de taal (ع, 中, Fr). Een
onbekend emoji valt terug op Twemoji. Emoji ín notities (BlockNote) blijven gewoon werken.

### Navigatie en schermen

- **Zwevende tabbalk** onderin (wit, `--shadow-float`, hoek 22 px) met vijf plekken:
  Vandaag · Planning · Notities · Hifd · Meer. De groene kop van nu verdwijnt.
- **Vandaag:** voortgangskaart (ring + dagdelen) · "Nu en straks" (planning) · open routines
  van het huidige dagdeel · logboek van vandaag. Alle routines via "Alle 13".
- **Planning:** zie plan fase 4e (dag-tijdlijn, week als lijst, één toevoeg-sheet).
- **Notities:** zoekveld, notitieboeken als pills, kaarten met titel + 2 regels + tags.
- **Notitie open:** witte pagina, terug/undo/redo/meer bovenin, opmaakbalk boven het toetsenbord.
- **Hifd:** samenvatting, één revisiekaart tegelijk (Arabische naam groot, vier knoppen 2 × 2),
  "Aan het leren".
- **Meer:** Statistieken · Inrichten (routines, focusgebieden, planning) · App (donker, meldingen,
  Hifd) · Je data (backup en herstel, wissen).

### Componenten (nieuw of te vernieuwen in `src/ui/`)

`Card`, `ListRow`, `Segmented` (tabs in een track), `Pill`, `ProgressRing`, `ProgressBar`,
`TabBar`, `Icon`, `EmptyState`; bestaande `Sheet`, `Button`, `Field`, `ConfirmDialog`,
`Toast`, `Banner` krijgen de nieuwe tokens. `Section` (inklapbaar) wordt een gewone kaart met
kop of een eigen subpagina onder Meer, en krijgt een echte `<button>` als kop.

---

## Huidige stand (vóór fase 4)

## Tokens (CSS-variabelen)

Gedefinieerd in `src/styles/base.css`, met een licht en een donker thema
(`html[data-theme="dark"]`). Gebruik altijd tokens, nooit losse hex voor UI-kleur.

Het palet is **Evergreen**: warm-groene neutralen, diep groen accent (`#0e7a52`).

- **Accent:** `--accent` (groen), `--accent-strong`, `--accent-contrast`, plus de
  vlakken `--accent-bg`, `--accent-border`, `--accent-text`, `--sel-bg`. Let op: `--accent`
  én `--accent-contrast` zijn **thema-bewust** — in dark wordt het accent feller (`#1fa06a`) met
  dónkere tekst erop (`--accent-contrast: #06140d`). Gebruik dus altijd `--accent-contrast` voor
  tekst/iconen óp het accent, nooit een harde `#fff`.
- **Tekst:** `--text`, `--text-muted`, `--text-faint`.
- **Vlakken/randen:** `--bg`, `--card`, `--card2`, `--border`, `--border-soft`, `--border-mid`, `--input-bg`, `--shadow`.
- **Danger:** `--danger-bg`, `--danger-border`, `--danger-text`.
- **Lettertypes (drie tiers):** `--ff-display` (Schibsted Grotesk) voor de **grootste titels**
  (paginatitel in de header, datum-/weekkop); `--ff-head` (Outfit) voor **kaart- en sectietitels**
  - nav-labels; `--ff-body` (DM Sans) voor **lopende tekst**.

Uitzondering — letterlijke hex blijft alléén voor **data**: opgeslagen event-/template-kleuren,
het `EVENT_COLORS`-palet en de maand-heatmap-schaal. Die volgen het accent niet.

## Primitives (`src/ui/`)

| Component                                  | Gebruik                                                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sheet`                                    | Bottom-sheet modal. Props: `title`, `subtitle?`, `onClose`, `footer?`, `children`. Sluit op backdrop/Escape, vergrendelt achtergrond-scroll. |
| `ConfirmDialog`                            | Gecentreerd bevestigen. Props: `title`, `message`, `confirmLabel?`, `danger?`, `onConfirm`, `onCancel`, of `actions[]` voor meerkeuze.       |
| `Button`                                   | `variant`: `primary`/`secondary`/`danger`/`dangerSolid`/`ghost`; `size`: `md`/`sm`; `full`.                                                  |
| `Field`, `TextInput`, `TextArea`, `Select` | Velden met label/hint en centrale groene focus-border.                                                                                       |
| `IconField`                                | Icoonknop + uitklap-icoonkiezer (`ICON_CATEGORIES`). Plaats in een `flexWrap:"wrap"`-rij. Props: `value`, `onChange`.                      |
| `ColorPicker`                              | Swatch-rij + custom kleur (🎨). Props: `value`, `onChange`, `colors?`.                                                                       |
| `Section`                                  | Inklapbare instellingen-sectie. Props: `title`, `icon?`, `right?`, `tone?` (`default`/`accent`/`danger`), `defaultOpen?`.                    |
| `Emoji`                                    | Toont een data-emoji als lijnicoon (onbekend: Twemoji). Props: `char`, `size?`, `style?`.                                                    |
| `Toast` (`ToastHost` + `showToast`)        | Korte in-app melding i.p.v. `alert`. `ToastHost` staat één keer in `App`.                                                                    |

### Voorbeeld — een create/edit-sheet

```jsx
<Sheet
  title="Nieuw item"
  onClose={close}
  footer={
    <Button full onClick={save} disabled={!name.trim()}>
      ✓ Toevoegen
    </Button>
  }
>
  <div
    style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
  >
    <IconField value={icon} onChange={setIcon} />
    <TextInput
      value={name}
      autoFocus
      onChange={(e) => setName(e.target.value)}
      style={{ flex: 1, minWidth: 140 }}
    />
  </div>
  <Field label="Kleur">
    <ColorPicker value={color} onChange={setColor} />
  </Field>
</Sheet>
```

Verwijderen hoort als `danger`-knop in de `footer` van dezelfde sheet en opent een
`ConfirmDialog`. Zie `features/planner/EventModal.jsx` of `features/settings/RoutineSheet.jsx`
als referentie.

## Emoji-pipeline (Twemoji, lokaal)

Doel: emoji's renderen op élk toestel identiek (vlaggen renderen anders per Android-toestel).

1. In de data blijft het **unicode-teken** staan (bv. `"🤲"`) — geen migratie, backups blijven werken.
2. `<Emoji char>` berekent de codepoint-bestandsnaam via `lib/emojiCodepoint.js` en toont
   `/emoji/<codepoint>.svg`; faalt dat, dan valt hij terug op het rauwe teken.
3. `scripts/build-emoji.mjs` kopieert alleen de **gebruikte** SVG's uit `@twemoji/svg`
   (devDependency) naar `public/emoji/` (gitignored). Draait automatisch bij `dev`/`build`,
   of los met `npm run emoji`.
4. **Nieuwe emoji toevoegen:** zet hem in `EMOJI_CATEGORIES` (`constants.js`) of in de
   `UI_EMOJIS`-lijst in het script, en draai `npm run emoji`.
5. **Niet-emoji glyph** (zoals `ⵣ`): maak een SVG in `src/emoji-custom/` met de codepoint als
   bestandsnaam (bv. `2d63.svg`); het script neemt die mee.

## Patronen

- **Lijst bewerken:** rij is weergave-only (slepen via `DragHandle` + tik om te bewerken).
  Toevoegen/bewerken/verwijderen gebeurt in een `Sheet`. Zie `ui/SortableList.jsx`.
- **Instellingen:** elke sectie in een `Section` (accordion). Korte secties mogen `defaultOpen`.

## Notitieboeken & rijke editor

De Logboek-tab is een werkruimte met **notitieboeken** ([LogbookView.jsx](src/features/logbook/LogbookView.jsx)):

- Notitieboeken: blob `notebooks` = `[{ id, name, icon, color }]`, fallback `DEFAULT_NOTEBOOKS`. Beheren via `NotebookSheet`; een notitieboek verwijderen verhuist zijn entries (incl. gearchiveerde/verwijderde) naar `logboek`.
- Entries (`db.logEntries`): `notebookId` (ontbreekt = `logboek`), `title`, `doc` (BlockNote blocks-JSON), `body` (afgeleide markdown voor zoeken/preview), `tags`, `mood`, `date`, `createdAt`, `updatedAt`, `order` (handmatige sortering, per notitieboek — genormaliseerd door `migrateNotesOrderV1`), `pinnedAt` (vastgezet, nullable ISO), `archivedAt`/`deletedAt` (archief/prullenbak, nullable ISO — zie `src/lib/notes.js` voor `isActive`/`isArchived`/`isTrashed`; alle leesqueries buiten de archief/prullenbak-sheets filteren op `isActive`).
- Dag-notities uit de tracker (`days.notes`) verschijnen alleen in `logboek` en blijven plat (geen rijke editor) — bewerken via `LogEntrySheet`; ze hebben geen `logEntries`-record en dus geen pin/archief/prullenbak.
- Een log-entry openen = volledige pagina `EntryPage` met **auto-save** (debounced + bij Terug); pin/archief/prullenbak-knoppen zitten in de pagina-topbalk, plus een notitieboek-select in de meta-rij om te verplaatsen. Verwijderen is zacht (`deletedAt`) — prullenbak ruimt na 30 dagen automatisch op (`purgeTrash`, draait bij app-start in `main.jsx`).
- **Sorteermodus** (`settings.logbookSort`, "eigen" | "datum"): "eigen" is de handmatige sleepvolgorde (twee `useSortable`-containers: vastgezet-sectie + de rest — voorkomt kruisen); "datum" groepeert op Vandaag/Gisteren/Deze week/Deze maand/maand-jaar. Vastgezet staat in beide bovenaan. Slepen werkt ook tijdens zoeken/tag-filteren (`reorderWithinFull` in `LogbookView.jsx`): het gesleepte item krijgt zijn plek t.o.v. zijn zichtbare buur in de _volledige_ lijst, zodat weggefilterde entries hun relatieve volgorde behouden.
- **Multi-select**: long-press op een kaart of de ☑-knop naast "+ Nieuw". Checkbox vervangt dan het sleephandvat; actiebalk onderin voor vastzetten/archiveren/verplaatsen/prullenbak op de hele selectie. Dagnotities zijn nooit selecteerbaar (geen `logEntries`-record).

**Editor-pipeline (BlockNote):** `RichEditor.jsx` is **lazy** geladen en toont de editor; bij wijziging geeft hij `{ doc, text }` terug (`text` = `blocksToMarkdownLossy`). Oude platte entries laden via `plainToBlocks`. Thema volgt `settings.theme`. Nieuwe emoji's niet nodig hier. BlockNote-kern is MPL-2.0 — vermijd de GPL "XL"-pakketten.

## Bekende uitzonderingen / nog te doen

- De BlockNote-editor-chunk (~1,7 MB) wordt geprecached door de PWA (offline-voordeel, maar zwaardere service-worker-install). Optioneel later uitsluiten via `manualChunks` + `globIgnores`.
