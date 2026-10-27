---
paths:
  - "src/features/logbook/**"
---

# Logboek en editor (BlockNote)

- **Logboek = notitieboeken-werkruimte.** Notitieboeken staan in de `notebooks`-blob; elke entry heeft een `notebookId` (ontbreekt = `logboek`).
- Een entry is een **BlockNote**-document: sla zowel `doc` (blocks-JSON) als de afgeleide `body` (markdown) op. `body` voedt zoeken en de kaart-preview.
- `RichEditor.jsx` is **lazy**; importeer hem nooit direct in de hoofdbundel.
- Alle drie de `@blocknote/*`-pakketten hebben altijd **dezelfde versie**.
- Alleen de MPL-2.0-pakketten (`core`, `react`, `mantine`). **Geen** `@blocknote/xl-*` (GPL/commercieel).
- Niet-publieke API (`editor._tiptapEditor`) komt nu alleen voor in `tableCommands.js` en de undo/redo-staat in `RichEditor.jsx`. Breid dat niet uit: nieuw gebruik gaat via `tableCommands.js`/`editorActions.js`, zodat een upgrade op één plek breekt.
- BlockNote's eigen slashmenu, formatting toolbar en zijmenu staan uit; de touch-UI is `BlockHandle` + `BlockMenuSheet` + de +-knop (een getypte "/" werkt niet betrouwbaar op Android).
- Dagnotities uit de tracker (`days.notes`) zijn plat, hebben geen `logEntries`-record en dus geen pin/archief/prullenbak.
- Lees-queries buiten de archief-/prullenbak-sheets filteren op `isActive` uit `src/lib/notes.js`.
- Touchgedrag (toetsenbord, selectie, slepen) is alleen echt te testen op een Android-toestel: noem dat expliciet in de controle van je stap.
