# CLAUDE.md — vaste instructies voor Claude Code

Dit bestand staat in de root en wordt daardoor in elke sessie automatisch geladen (check met `/context` → "Memory files"). Regels die maar voor één deel van de code gelden staan in `.claude/rules/` en laden alleen als je bestanden in dat deel leest.

## Project

Persoonlijke life-OS (PWA): routine-tracker, weekplanner, logboek/notities (BlockNote) en Hifd (Koranmemorisatie). React 19 + Vite, lokaal-first (Dexie/IndexedDB), gedeployed op Vercel vanuit `main`. Geen backend. UI-taal: Nederlands.

## Documentatie (map `.md/`)

- `.md/PLAN-VERBETERING.md` — het huidige grote plan (fasen 0–7) met vakjes. **Begin hier.**
- `.md/UITVOERING.md` — levende roadmap, backlog en eerdere fasen.
- `.md/ONTWERP.md` — design-systeem: tokens, primitives, patronen.
- `.md/CODEKWALITEIT.md` — checks, hooks en opschonen.
- `.md/PLAN.md` — achtergrond en waarom.

## Commando's

- `npm run dev` — dev-server (bouwt ook de emoji's)
- `npm run build` — productiebuild
- `npm run lint` — ESLint
- `npm run deadcode` — Knip (ongebruikte bestanden/exports/dependencies)
- `npm test` — unit-tests (Vitest, `src/**/*.test.js`)
- `npm run test:e2e` — Playwright

## Zelf installeren

- Installeer wat nodig is zelf (`npm install …`, `npx …`); geef mij geen lijst met handmatige stappen.
- App-code in `dependencies`, build-/check-tooling in `devDependencies`. Leg bij een nieuwe dependency kort uit waarom.
- Alleen systeemsoftware die niet via npm kan (zoals Node.js zelf): geef het exacte commando.
- Controleer na het installeren dat het project nog bouwt.

## Codekwaliteit (geen slop)

Schrijf code die ik over een half jaar nog snap en zelf kan aanpassen.

- De **eenvoudigste oplossing die werkt**. Geen abstractie, optie of "voor later"-code die niet gevraagd is.
- **Geen dode code**: geen uitgecommentarieerde blokken, ongebruikte imports, variabelen of functies.
- **Korte componenten en functies met één taak.** Groeit iets boven ~300 regels, stel dan voor het op te splitsen.
- **Hergebruik** bestaande helpers (`src/lib/`) en primitives (`src/ui/`); bouw geen kopie of variant ernaast.
- Geen onnodige dependency als een paar regels eigen code volstaat.
- Commentaar alleen voor het **waarom** bij niet-vanzelfsprekende keuzes.
- Verwijder door Knip gemelde code **alleen na verificatie** dat hij echt nergens (ook niet dynamisch) gebruikt wordt.

## Werkwijze

- **Eén stap per keer.** Verander **nooit** functionaliteit én structuur in dezelfde stap of commit.
- Zeg pas "klaar" als `npm run lint` schoon is en `npm run build` slaagt (de Stop-hook checkt dit ook).
- Kleine, geïsoleerde wijzigingen; raak geen modules aan die niet bij de taak horen.
- Push niet zonder dat te vragen. Werk je lokaal én in een cloud-sessie: eerst `git pull`, nooit tegelijk aan hetzelfde.

## Niet aanraken zonder expliciete opdracht

- **Dexie-/localStorage-sleutels en dataformaat** niet stilletjes wijzigen. Datamodel wijzigen = expliciete migratie, en ik controleer eerst dat mijn data intact is. Details: `.claude/rules/data.md`.
- De service worker blijft **vite-plugin-pwa met `injectManifest`**, inclusief de `notificationclick`-handler. Details: `.claude/rules/pwa.md`.
- Verwijder geen bestaande backup-/export-/import-functionaliteit.
- Introduceer geen nieuw stijlsysteem zonder overleg (CSS-variabelen, licht/donker thema).

## Documentatie bijhouden

- **Nieuw idee van mij** → als `- [ ]` in "💡 Ideeën & Backlog" in `.md/UITVOERING.md`. Verzin niets bij.
- **Idee uitwerken** (op verzoek) → volledige fase onderaan `.md/UITVOERING.md` volgens het sjabloon daar.
- **Stap afgerond en de controle slaagt** → vakje op `- [x]` in het plan waar het bij hoort. Vink niets af wat nog niet écht werkt.
- **Na elke fase** → statusregel bovenaan `.md/UITVOERING.md` bijwerken en een korte commit-boodschap voorstellen.
- Houd dit bestand kort: alleen afspraken, conventies en valkuilen. Nieuwe blijvende afspraken hier toevoegen; domeinspecifieke in de passende `.claude/rules/`-file.

## Bij twijfel

Vraag het, of doe de kleinst mogelijke veilige stap. Liever klein en controleerbaar dan groot en onomkeerbaar.
