---
paths:
  - "src/**/*.{jsx,css}"
  - "src/styles/**"
  - "index.html"
---

# UI-conventies (verplicht)

De UI draait op gedeelde primitives in `src/ui/`. Gebruik die altijd; bouw geen losse variant ernaast. Details en voorbeelden: `.md/ONTWERP.md`.

- **Kleuren via tokens.** Hardcode nooit een kleur voor accent/selectie/focus: gebruik `var(--accent)` en de bestaande `--accent-bg/-border/-text`, `--sel-bg`, `--danger-*`. Alleen echte datakleuren (event-/template-kleur, `EVENT_COLORS`, de heatmap-schaal) blijven letterlijke hex. Het accent is thema-bewust: tekst/iconen óp het accent altijd `var(--accent-contrast)`, nooit een harde `#fff`.
- **Fonts.** `var(--ff-head)`/`var(--ff-display)` (Outfit) voor titels en getallen in kaarten, `var(--ff-body)` (DM Sans) voor alle overige tekst. Arabisch valt automatisch terug op Noto Naskh Arabic (staat in elke stapel); gebruik `var(--ff-arabic)` alleen voor puur Arabische tekst zoals surahnamen. Typeschaal via `--fs-xs` … `--fs-2xl`, nooit kleiner dan 12 px.
- **Toevoegen/bewerken in een `Sheet`** (`ui/Sheet.jsx`) met `IconField`, `ColorPicker` en `Field`/`TextInput`/`TextArea`/`Select`. Verwijderen zit als knop ín die sheet en loopt via `ConfirmDialog`.
- **Geen native dialogs.** Geen `confirm()`/`alert()`/`prompt()`. Bevestigen → `ui/ConfirmDialog.jsx`; korte meldingen → `showToast()` uit `lib/toast.js`.
- **Iconen zijn lijniconen** (Phosphor regular + een paar eigen, één stijl). UI-icoon: `<Icon name="…" />`. Data-iconen (routines, sjablonen, notitieboeken) blijven als emoji opgeslagen en lopen via `<Emoji char="…" />`, dat ze via `lib/emojiGlyph.js` als lijnicoon toont (vlag → lettertegel). Nooit een kale emoji in JSX. Nieuw icoon: koppel het in `EMOJI_GLYPH` en draai `npm run glyphs` (schrijft `src/ui/glyphs.js`; eigen tekeningen staan in `scripts/build-glyphs.mjs`).
- **Opmaak:** de bouwstenen in `src/ui/` (Button, Field, Card, ListRow) hebben een eigen `*.module.css` (besluit eigenaar 30-10-2026), voor `:active`/`:focus-visible`. In schermen blijft het inline `style` met tokens; geen CSS Modules daar zonder overleg.
- **Knoppen via `ui/Button.jsx`** (`primary/secondary/danger/dangerSolid/ghost`); **instellingen-secties via `ui/Section.jsx`**.
- Het thema wisselt via `html[data-theme="dark"]` (eigen knop in Instellingen), **niet** via `prefers-color-scheme`.
- Tekst die Arabisch of Tarifit kan bevatten: houd rekening met schrijfrichting (`dir="auto"`). Fonts laden met `latin-ext`, want Tarifit gebruikt ɛ, ɣ, č, ḍ, ṛ, ẓ.
