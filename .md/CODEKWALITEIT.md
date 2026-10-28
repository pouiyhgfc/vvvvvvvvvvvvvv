# Codekwaliteit & checks

> Hoe je voorkomt dat de AI slordige of overbodige code achterlaat. Drie lagen die samenwerken. Hoort bij `CLAUDE.md` + `.claude/rules/` (de regels) en de hooks in `.claude/settings.json` (de afdwinging).

## Het idee: drie lagen

Alleen regels in CLAUDE.md zetten is niet genoeg — in een lange sessie zakken die instructies weg en moet je achteraf alsnog opruimen. Betrouwbaar wordt het pas met drie lagen samen:

1. **CLAUDE.md — de regels (kennis).** Wat "nette code" hier betekent. Stuurt het gedrag, maar is niet waterdicht.
2. **Linters/Knip — de detectie (mechanisch).** Gereedschap dat objectief vindt wat fout of overbodig is.
3. **Hooks — de afdwinging (vangrails).** Shell-commando's die Claude Code automatisch draait op vaste momenten. Deze vergeet hij nooit.

## De tools (drie verschillende dingen)

- **Prettier** → opmaak (inspringen, quotes, komma's). Puur stijl.
- **ESLint** → ongebruikte variabelen/imports, niet-bestaande namen (`no-undef`, geeft anders pas een wit scherm als die code draait) en simpele logica-fouten. Beperking: ziet maar één bestand tegelijk, en een ontbrekende import van een component (`<Foo />`) vangt hij niet.
- **Knip** → het gat dat ESLint mist: **ongebruikte bestanden, exports en dependencies** over je hele project. Dit is jouw "slob-code"-vanger bij uitstek. Let op: verifieer altijd vóór verwijderen — code kan dynamisch gebruikt zijn (vals positief).

## Waar alles staat

- **Regels:** `CLAUDE.md` in de root (altijd geladen) en `.claude/rules/*.md` (laden alleen bij bestanden die bij hun `paths` passen: UI, editor, data, PWA).
- **Scripts:** `npm run lint` (ESLint), `npm run deadcode` (Knip), `npm run build`, `npm run test:e2e` (Playwright).
- **Hooks:** `.claude/settings.json` roept twee Node-scripts aan in `.claude/hooks/`. Ze werken op Windows, macOS en Linux; er is geen `jq` of bash nodig.

## Wat de hooks doen

- **PostToolUse → `format.mjs`**: na elke bewerking Prettier op het gewijzigde bestand. Faalt stil (breekt je sessie niet).
- **Stop → `stop-check.mjs`**: zodra Claude wil stoppen draait `npm run lint`, en `npm run build` als er bronbestanden gewijzigd zijn (`git status` op `src/`, `index.html`, `vite.config.js`, `package.json`, `scripts/`). Faalt er iets, dan blokkeert de hook (exit 2) en krijgt Claude de laatste 40 regels van de fout terug om eerst op te lossen. De `stop_hook_active`-check voorkomt een oneindige lus.

Bewust **niet** in de hooks gestopt:

- **ESLint --fix in dezelfde hook als Prettier** — die twee kunnen elkaars wijzigingen blijven terugdraaien. Daarom: Prettier formatteert, ESLint rapporteert alleen.
- **Knip en de e2e-tests** — te traag voor elke beurt. Knip draai je per fase (zie hieronder); de tests draaien in de fase-controles en straks in CI (Verbeterplan fase 1).

## Knip per fase draaien

Knip is je grote opschoner, maar kan bij de eerste run veel melden en heeft verificatie nodig. Draai 'm daarom niet automatisch, maar **aan het eind van elke fase**:

```
npm run deadcode
```

Loop de meldingen langs, verifieer dat iets echt nergens gebruikt wordt, en laat het dan pas weghalen.

## Opschoonronde

Een nieuwe regel stuurt alleen toekomstig werk; hij ruimt bestaande code niet met terugwerkende kracht op. Doe daarom een aparte opschoonronde op een werkende, gecommitte staat.

### Opschoon-prompt (kopieer naar Claude Code)

```
De huidige stap werkt en is gecommit. Doe nu een opschoonronde over de code
die we tot nu toe hebben geschreven. Verander GEEN functionaliteit.

1. Verwijder dode code, uitgecommentarieerde blokken en ongebruikte imports/
   variabelen.
2. Splits functies of componenten die te lang zijn of te veel tegelijk doen.
3. Haal onnodige duplicatie weg; hergebruik bestaande helpers in plaats van
   varianten ernaast.
4. Draai 'npm run lint' en 'npm run deadcode' en los echte bevindingen op.
   Verwijder door Knip als 'ongebruikt' gemelde code ALLEEN na verificatie dat
   het echt nergens (ook niet dynamisch) wordt gebruikt — vraag het mij bij
   twijfel.
5. Draai 'npm run build' om te bevestigen dat alles nog werkt.

Leg kort uit wat je hebt opgeruimd en waarom. Werk in kleine stappen.
```

## Samengevat

- CLAUDE.md zegt _hoe_ het moet, de linters _vinden_ wat fout is, de hooks _dwingen het af_.
- Prettier = opmaak, ESLint = losse fouten per bestand, Knip = dode code over het hele project.
- De Stop-hook is je automatische last-minute check; Knip draai je bewust per fase.
- Opruimen is een aparte stap ná werkend resultaat — niet tegelijk met functionele wijzigingen.
