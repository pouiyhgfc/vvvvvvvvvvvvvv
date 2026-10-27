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
- **Iconen via `<Emoji char="…" />`**, nooit een kale emoji in JSX. Nieuwe emoji's in `EMOJI_CATEGORIES` (`constants.js`); `npm run emoji` kopieert ze. Niet-emoji glyphs: eigen SVG in `src/emoji-custom/` met de codepoint als bestandsnaam.
- **Knoppen via `ui/Button.jsx`** (`primary/secondary/danger/dangerSolid/ghost`); **instellingen-secties via `ui/Section.jsx`**.
- Het thema wisselt via `html[data-theme="dark"]` (eigen knop in Instellingen), **niet** via `prefers-color-scheme`.
- Tekst die Arabisch of Tarifit kan bevatten: houd rekening met schrijfrichting (`dir="auto"`). Fonts laden met `latin-ext`, want Tarifit gebruikt ɛ, ɣ, č, ḍ, ṛ, ẓ.
