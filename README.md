# Routine Tracker

Persoonlijke life-OS als PWA: routines bijhouden, weekplanning, een logboek met notitieboeken (rijke editor) en Hifd voor Koranmemorisatie. Alles staat lokaal in de browser (IndexedDB); er is geen server en geen account. Backup gaat via export/import in Instellingen.

## Draaien

Vereist Node.js 20.19+ of 22.12+.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # productiebuild in dist/
```

Checks: `npm run lint`, `npm run deadcode` (Knip), `npm run test:e2e` (Playwright).

## Techniek

React 19, Vite, Dexie (IndexedDB), BlockNote (editor), vite-plugin-pwa met een eigen service worker (`src/sw.js`). Gedeployed op Vercel vanuit `main`.

## Documentatie

- `CLAUDE.md` en `.claude/rules/` — regels voor Claude Code
- `.md/PLAN-VERBETERING.md` — het huidige plan
- `.md/UITVOERING.md` — roadmap, backlog en afgeronde fasen
- `.md/ONTWERP.md` — design-systeem
- `.md/CODEKWALITEIT.md` — checks en hooks
