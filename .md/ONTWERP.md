# Ontwerp & design-systeem

> Het fundament onder de UI. Zo blijft alles consistent en hoeft elke nieuwe feature
> alleen nog inhoud te leveren, geen eigen stijl. De harde regels staan kort in
> `CLAUDE.md` (sectie "UI-conventies"); hier staan de details en voorbeelden.

## Tokens (CSS-variabelen)

Gedefinieerd in de `<style>` van `index.html`, met een licht en een donker thema
(`html[data-theme="dark"]`). Gebruik altijd tokens, nooit losse hex voor UI-kleur.

- **Accent:** `--accent` (groen), `--accent-strong`, `--accent-contrast`, plus de
  vlakken `--accent-bg`, `--accent-border`, `--accent-text`, `--sel-bg`.
- **Tekst:** `--text`, `--text-muted`, `--text-faint`.
- **Vlakken/randen:** `--bg`, `--card`, `--card2`, `--border`, `--border-soft`, `--border-mid`, `--input-bg`, `--shadow`.
- **Danger:** `--danger-bg`, `--danger-border`, `--danger-text`.
- **Lettertypes:** `--ff-head` (Outfit), `--ff-body` (DM Sans).

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

## Bekende uitzonderingen / nog te doen

- De import-keuze "samenvoegen vs. vervangen" (`App.jsx` → `importData`) is nog een native
  `confirm()`; lastig veilig om te bouwen midden in het `FileReader`-inlezen.
- Emoji's in losse knop-labels (bv. "💾 Opslaan") renderen nog als OS-emoji; mag later via `<Emoji>`.
