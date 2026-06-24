# Codekwaliteit & checks

> Hoe je voorkomt dat de AI slordige of overbodige code achterlaat. Drie lagen die samenwerken. Hoort bij `CLAUDE.md` (de regels) en de hooks in `.claude/settings.json` (de afdwinging).

## Het idee: drie lagen

Alleen regels in CLAUDE.md zetten is niet genoeg — in een lange sessie zakken die instructies weg en moet je achteraf alsnog opruimen. Betrouwbaar wordt het pas met drie lagen samen:

1. **CLAUDE.md — de regels (kennis).** Wat "nette code" hier betekent. Stuurt het gedrag, maar is niet waterdicht.
2. **Linters/Knip — de detectie (mechanisch).** Gereedschap dat objectief vindt wat fout of overbodig is.
3. **Hooks — de afdwinging (vangrails).** Shell-commando's die Claude Code automatisch draait op vaste momenten. Deze vergeet hij nooit.

## De tools (drie verschillende dingen)

- **Prettier** → opmaak (inspringen, quotes, komma's). Puur stijl.
- **ESLint** → ongebruikte variabelen/imports en simpele logica-fouten. Beperking: ziet maar één bestand tegelijk.
- **Knip** → het gat dat ESLint mist: **ongebruikte bestanden, exports en dependencies** over je hele project. Dit is jouw "slob-code"-vanger bij uitstek. Let op: verifieer altijd vóór verwijderen — code kan dynamisch gebruikt zijn (vals positief).

## Eenmalige setup

Doe dit na Fase 1a (dan staat Vite er en heeft de React-template ESLint al voor je klaar). Je kunt het Claude Code laten uitvoeren.

1. Installeer Prettier en Knip:

```
npm install -D prettier knip
```

2. Voeg scripts toe aan `package.json`:

```
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "deadcode": "knip"
}
```

3. Installeer `jq` (nodig voor de hooks):
   - macOS: `brew install jq`
   - Windows/Linux: zie https://jqlang.github.io/jq/download/

4. Zet het meegeleverde bestand neer als **`.claude/settings.json`** in de root van je repo.

5. Commit alles zodat het bij het project hoort.

## Wat de hooks doen

- **PostToolUse-hook** → draait na elke bewerking Prettier op het gewijzigde bestand. Snel en veilig; faalt stil (breekt je sessie niet).
- **Stop-hook** → draait `npm run lint` zodra Claude klaar is met antwoorden. Zijn er ESLint-fouten, dan blokkeert de hook (exit 2) en krijgt Claude de fouten terug om ze eerst op te lossen. De `stop_hook_active`-check voorkomt een oneindige lus.

Bewust **niet** in de hooks gestopt:
- **ESLint --fix in dezelfde hook als Prettier** — die twee kunnen elkaars wijzigingen blijven terugdraaien. Daarom: Prettier formatteert, ESLint rapporteert alleen.
- **De volledige build en Knip** — te traag voor na elke bewerking. De build zit al in je fase-controles; Knip draai je handmatig (zie hieronder).

### Platform-let-op
De hook-commando's gaan uit van een bash-achtige shell. Je `build.cmd` doet vermoeden dat je op Windows zit — draai Claude Code dan via **Git Bash of WSL**, of vraag Claude de hooks naar PowerShell te vertalen.

## Knip per fase draaien

Knip is je grote opschoner, maar kan bij de eerste run veel melden en heeft verificatie nodig. Draai 'm daarom niet automatisch, maar **aan het eind van elke fase**:

```
npm run deadcode
```

Loop de meldingen langs, verifieer dat iets echt nergens gebruikt wordt, en laat het dan pas weghalen.

## Je zit middenin de migratie — doe dit nu

Een update van CLAUDE.md stuurt alleen toekomstig werk; het ruimt de code die je al geschreven hebt **niet met terugwerkende kracht** op. Dus:

1. Maak de huidige stap eerst werkend en commit 'm (nooit opruimen op een half-kapotte staat).
2. Zet de setup hierboven klaar.
3. Draai één keer de opschoonronde hieronder over wat je tot nu toe hebt gebouwd.
4. Daarna houden de hooks elke volgende stap automatisch schoon.

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

- CLAUDE.md zegt *hoe* het moet, de linters *vinden* wat fout is, de hooks *dwingen het af*.
- Prettier = opmaak, ESLint = losse fouten per bestand, Knip = dode code over het hele project.
- De Stop-hook is je automatische last-minute check; Knip draai je bewust per fase.
- Opruimen is een aparte stap ná werkend resultaat — niet tegelijk met functionele wijzigingen.
