# Ontwerp & design-systeem

> Het fundament onder de UI. Zo blijft alles consistent en hoeft elke nieuwe feature
> alleen nog inhoud te leveren, geen eigen stijl. De harde regels staan kort in
> `CLAUDE.md` (sectie "UI-conventies"); hier staan de details en voorbeelden.

## Tokens (CSS-variabelen)

Gedefinieerd in de `<style>` van `index.html`, met een licht en een donker thema
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
| `IconField`                                | Emoji-knop + uitklap-`EmojiPicker`. Plaats in een `flexWrap:"wrap"`-rij. Props: `value`, `onChange`.                                         |
| `ColorPicker`                              | Swatch-rij + custom kleur (🎨). Props: `value`, `onChange`, `colors?`.                                                                       |
| `Section`                                  | Inklapbare instellingen-sectie. Props: `title`, `icon?`, `right?`, `tone?` (`default`/`accent`/`danger`), `defaultOpen?`.                    |
| `Emoji`                                    | Rendert één icoon als Twemoji-SVG. Props: `char`, `size?`, `style?`.                                                                         |
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

- Notitieboeken: blob `notebooks` = `[{ id, name, icon, color }]`, fallback `DEFAULT_NOTEBOOKS`. Beheren via `NotebookSheet`; een notitieboek verwijderen verhuist zijn entries naar `logboek`.
- Entries (`db.logEntries`): `notebookId` (ontbreekt = `logboek`), `title`, `doc` (BlockNote blocks-JSON), `body` (afgeleide markdown voor zoeken/preview), `tags`, `mood`, `date`, `createdAt`, `updatedAt`.
- Dag-notities uit de tracker (`days.notes`) verschijnen alleen in `logboek` en blijven plat (geen rijke editor) — bewerken via `LogEntrySheet`.
- Een log-entry openen = volledige pagina `EntryPage` met **auto-save** (debounced + bij Terug); verwijderen zit in de pagina-topbalk.

**Editor-pipeline (BlockNote):** `RichEditor.jsx` is **lazy** geladen en toont de editor; bij wijziging geeft hij `{ doc, text }` terug (`text` = `blocksToMarkdownLossy`). Oude platte entries laden via `plainToBlocks`. Thema volgt `settings.theme`. Nieuwe emoji's niet nodig hier. BlockNote-kern is MPL-2.0 — vermijd de GPL "XL"-pakketten.

## Bekende uitzonderingen / nog te doen

- De import-keuze "samenvoegen vs. vervangen" (`App.jsx` → `importData`) is nog een native
  `confirm()`; lastig veilig om te bouwen midden in het `FileReader`-inlezen.
- Emoji's in losse knop-labels (bv. "💾 Opslaan") renderen nog als OS-emoji; mag later via `<Emoji>`.
- De BlockNote-editor-chunk (~1,7 MB) wordt geprecached door de PWA (offline-voordeel, maar zwaardere service-worker-install). Optioneel later uitsluiten via `manualChunks` + `globIgnores`.
