# CLAUDE.md — vaste instructies voor Claude Code

Dit bestand wordt automatisch gelezen. Volg deze regels in elke sessie in dit project.

## Project
Persoonlijke life-OS (PWA): routine-tracker + weekplanner, uitgebouwd met logboek en notities. React + Vite, lokaal-first (Dexie/IndexedDB), gedeployed op Vercel. UI-taal: Nederlands. Zie `PLAN.md` (achtergrond/waarom), `UITVOERING.md` (levende roadmap + stappen + prompts) en `CODEKWALITEIT.md` (checks en opschonen).

## Zelf installeren — niet aan mij overlaten
- Alles wat nodig is (npm-packages, plugins, CLI-tools) installeer je **zelf** via de terminal: `npm install …`, `npm create vite`, `npx …`. Geef mij geen lijst met handmatige installatiestappen; voer de commando's uit (ik keur ze goed).
- Voeg elke dependency toe als het juiste type: gewone `dependencies` voor app-code, `devDependencies` voor build/PWA-/check-tooling (bv. vite-plugin-pwa, workbox-precaching, prettier, knip).
- Eén uitzondering: systeemsoftware die niet via npm kan (zoals **Node.js** zelf, of `jq` voor de hooks). Kun je iets niet zelf installeren, geef dan het **exacte** commando dat ik moet draaien.
- Na het installeren: controleer dat het project nog bouwt voordat je verdergaat.

## Codekwaliteit (geen slob-code)
Schrijf code die ik over een half jaar nog snap en zelf kan aanpassen. Concreet:
- Schrijf de **eenvoudigste oplossing die werkt**. Voeg geen abstractie, optie of "voor later"-code toe die ik niet heb gevraagd.
- Laat **geen dode code** achter: geen uitgecommentarieerde blokken, geen ongebruikte imports, variabelen of functies.
- Houd functies en componenten **kort en met één duidelijke taak**. Doet iets te veel of wordt het te lang, splits het op.
- Geen **onnodige dependency** als een paar regels eigen code volstaat. Leg bij een nieuwe dependency kort uit waarom.
- **Hergebruik** bestaande helpers en stijl; bouw geen variant of kopie naast iets dat al bestaat.
- Commentaar alleen voor het **waarom** bij niet-vanzelfsprekende keuzes, niet wat de code regel voor regel doet.
- **Eerst werkend, dan opruimen.** Verander nooit functionaliteit en opmaak/structuur in dezelfde stap. Als iets werkt, doe een aparte opruimronde en benoem kort wat je hebt opgeruimd.
- **Los gemelde checks op.** ESLint en Knip draaien via npm-scripts/hooks (zie CODEKWALITEIT.md). Zeg pas "klaar" als `npm run lint` schoon is en de build slaagt. Verwijder door Knip als "ongebruikt" gemelde code **alleen na verificatie** dat het echt nergens (ook niet dynamisch) wordt gebruikt.

## Documentatie bijhouden (belangrijk)
`UITVOERING.md` is een **levend document**. Houd het bij zonder dat ik het hoef te vragen:
- **Nieuw idee van mij** → voeg het toe aan de sectie "💡 Ideeën & Backlog" in `UITVOERING.md`, kort en feitelijk, als onaangevinkt punt `- [ ]`. Verzin niets bij.
- **Idee uitwerken** (ik vraag erom) → maak er onderaan een volledige fase van met het "Sjabloon voor een nieuwe fase". Verwijder of vink daarna het backlog-punt af.
- **Stap of fase afgerond en de controle slaagt** → zet de bijbehorende vakjes om van `- [ ]` naar `- [x]`, inclusief het "Fase X afgerond"-vakje. Vink niets af wat nog niet écht werkt.
- **Na elke fase** → werk de regel "Status — huidige fase" bovenaan `UITVOERING.md` bij, en stel een korte commit-boodschap voor.
- Houd **CLAUDE.md zelf kort**: hier horen alleen afspraken, conventies en valkuilen — geen verslag van wat we deden. Dat hoort in Git-commits en straks in de logboek-module van de app.
- Voeg nieuwe blijvende afspraken/conventies die we maken hier toe (nieuwe mapnaam, naamgeving, een valkuil die we tegenkwamen), zodat elke volgende sessie ze kent.

## Werkwijze
- Werk **één stap per keer**. Verander **nooit** functionaliteit én structuur tegelijk.
- Na elke wijziging: draai `npm run build` (en zo nodig `npm run dev`) om te bevestigen dat het compileert. Zeg pas "klaar" als het bouwt.
- Maak kleine, geïsoleerde wijzigingen. Raak geen modules aan die niet bij de taak horen.
- Push niet zonder dat te vragen; werk in de huidige branch.

## Niet aanraken zonder expliciete opdracht
- **localStorage-/Dexie-sleutels en dataformaat** niet stilletjes wijzigen. Wijzig je het datamodel, schrijf dan een expliciete migratie en laat mij eerst controleren dat mijn data intact is.
- De service worker draait via **vite-plugin-pwa met `injectManifest`**. Behoud altijd de `notificationclick`-handler en de meldingen-logica. Stap niet over op `generateSW`.
- Verwijder geen bestaande backup-/export-/import-functionaliteit.

## Stijl
- Houd de bestaande codestijl en styling aan (CSS-variabelen, donker/licht thema). Introduceer geen nieuw stijlsysteem zonder overleg.

## Bij twijfel
Vraag het, of doe de kleinst mogelijke veilige stap. Liever klein en controleerbaar dan groot en onomkeerbaar.
