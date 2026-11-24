# Ontwerp: Taken (te-doen-lijst)

_24-11-2026 · status: gebouwd (24-11), plan: [`PLAN-TAKEN.md`](PLAN-TAKEN.md)_

## Waarom

Idries zet zijn dagelijkse to-do's nu in notities, en daar horen ze niet. Hij wil een eigen
plek voor taken die eenmalig zijn en daarna wegvallen: wat hij binnenkort moet doen (korte
termijn), en doelen en deadlines verder weg, zoals voor school (lange termijn). Taken met een
datum moeten in zijn weekplanning staan. Een afgevinkte taak verdwijnt uit de lijst, maar blijft
in de planning zichtbaar als "gedaan op die dag", als geschiedenis.

## Doelen

- **Snel bijwerken per dag.** Een taak toevoegen kost alleen een titel.
- **Twee lijsten:** korte termijn en lange termijn.
- **Datum, tijd en deadline zijn optioneel.**
  - Zonder datum: de taak staat alleen in de lijst.
  - Met datum: de taak staat ook in Planning, op die dag.
  - Met datum en tijd: de taak is ook een blok in de dagtijdlijn.
- **Deadline:** in de lijst "nog N dagen", in Planning een rood label op die dag, en optioneel
  een herinnering een paar dagen vooraf.
- **Uitbouwbaar:** een taak kan stappen krijgen. De hoofdtaak toont dan een percentage en kan
  open- en dichtklappen. Zonder stappen merk je er niets van.
- **Afvinken:** de taak verdwijnt uit de lijst.
  - Met datum: hij blijft doorgestreept in Planning op die dag staan.
  - Zonder datum: hij gaat naar een ingeklapt kopje "Gedaan", vanwaar je hem kunt terugzetten.

## Niet-doelen

- Taken die terugkomen (elke week iets): daarvoor zijn er routines.
- Meer dan één niveau stappen (geen stappen in stappen).
- Delen of samenwerken met anderen; alles blijft lokaal.
- Taken slepen in de dagtijdlijn (blokken uit de planning kunnen dat wel).

## Anti-doelen (dan is het mislukt, ook als het werkt)

- **Te veel tikken:** een taak toevoegen vraagt om meer dan een titel en "Toevoegen".
- **Stappen in de weg:** stappen of percentages die zichtbaar zijn bij taken zonder stappen.
- **Dubbel bijhouden:** een taak die in Planning anders staat dan in de lijst, bijvoorbeeld
  daar nog open terwijl hij al gedaan is.
- **Rommelige tabbalk:** er komt geen zesde tabblad.
- **Bestaande gegevens geraakt:** routines, planning of notities veranderen of verdwijnen.

## Randvoorwaarden

- Volgt `CLAUDE.md`:
  - lokaal in Dexie
  - datamodel alleen uitbreiden met een nieuwe `db.version(n)`, en een nieuwe backupversie;
    oude backups blijven importeren
  - geen bestaande sleutels of formaten wijzigen
  - UI via de bouwstenen in `src/ui/`
  - Nederlands
  - lint, build en tests groen; e2e voor de nieuwe flows
- De terugknop werkt: de subpagina en de sheets gaan via `useBackHandler`.
- Telefoon eerst: tikvlakken ≥ 44 px; `dir="auto"` op titels (Arabisch, Tarifit).

## Aanpakken (gekozen: B)

|       | Wat                                                                          | Afweging                                                                                       |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A     | Eigen tabblad "Taken" plus een kaartje op Vandaag                            | Snel bij de hele lijst, maar zes tabbladen is krap                                             |
| **B** | **Kaartje "Te doen" op Vandaag; tik opent de volledige lijst als subpagina** | **Tabbalk blijft rustig. De lange-termijnlijst zit één tik dieper. Gekozen door de eigenaar.** |
| C     | Taken in Planning                                                            | Doelen zonder datum horen niet in een planning                                                 |

**Koppeling met de planning (keuze Claude).** Taken zijn een eigen soort gegeven. Planning leest
ze en toont ze, maar maakt er geen kopie van in `calEvents`. Zo is er één bron, en klopt
"gedaan" altijd op beide plekken.

## Gegevens

Nieuwe Dexie-tabel `tasks` via `db.version(7).stores({ tasks: "&id, parentId, date, deadline,
doneAt" })`. Bestaande tabellen blijven ongewijzigd.

| Veld                  | Type                   | Betekenis                                                              |
| --------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `id`                  | string                 | `uid()`                                                                |
| `title`               | string                 | verplicht, niet leeg                                                   |
| `horizon`             | `"kort"` \| `"lang"`   | in welke lijst de taak staat; een stap neemt die van de hoofdtaak over |
| `parentId`            | string \| null         | gezet = het is een stap van die taak (één niveau)                      |
| `date`                | `"YYYY-MM-DD"` \| null | wanneer je het doet; daarmee komt de taak in Planning                  |
| `time`                | `"HH:MM"` \| null      | alleen met `date`; daarmee wordt het een blok in de tijdlijn           |
| `durationMin`         | number                 | alleen met `time`; standaard 30                                        |
| `deadline`            | `"YYYY-MM-DD"` \| null | uiterste datum, los van `date`                                         |
| `remindDays`          | number \| null         | herinnering zoveel dagen vóór de deadline (0 = op de dag zelf)         |
| `note`                | string                 | optioneel, kort                                                        |
| `order`               | number                 | handmatige volgorde binnen een lijst of hoofdtaak                      |
| `createdAt`, `doneAt` | ISO-tijd \| null       | `doneAt` gezet = gedaan                                                |

- **Backup:** `BACKUP_VERSION` 14, met `tasks` in de export. De import zet ze terug: vervangen
  wist eerst, samenvoegen doet een `bulkPut`. Validatie: een lijst met objecten die een
  `id` (string) en een `title` (string) hebben. Oude backups hebben geen `tasks`; dat is prima.
- **Alles wissen** maakt `tasks` leeg.
- **Afgeleid:**
  - **Te laat:** `date < vandaag` of `deadline < vandaag`, en nog niet gedaan.
  - **Percentage:** gedane stappen gedeeld door alle stappen. Zonder stappen is er geen
    percentage.
  - **Hoofdtaak met stappen:** vink je niet zelf af, zodat dat niet per ongeluk gebeurt
    (eigenaar, 24-11). Hij is klaar zodra alle stappen klaar zijn, en weer open als je een stap
    terugzet of erbij zet. Een tik op zijn rondje legt dat uit.

## Schermen

### Vandaag: kaartje "Te doen"

Het kaartje staat onder "Nu en straks". Het toont:

- taken (en stappen) met `date` = vandaag,
- taken die te laat zijn,
- deadlines in de komende 3 dagen, als korte regel "Deadline: … over 2 dagen".

Elke regel heeft een afvinkrondje. Tik je op de regel zelf, dan opent de taak. Onderaan staat
een veld "+ Taak voor vandaag": typen en Enter maakt een korte-termijntaak met de datum van
vandaag. Tik je op de kop "Te doen ›", dan opent de subpagina **Taken**. Is er niets voor
vandaag, dan toont het kaartje alleen het veld en de link (keuze Claude: zo kun je altijd snel
iets toevoegen).

```
Te doen ›
◯ Mail begeleider
◯ Boodschappen                     te laat
◯ Literatuur zoeken            14:00–15:00
Deadline: Verslag H2 — over 2 dagen
[+ Taak voor vandaag            ]
```

### Subpagina "Taken"

Openen gaat vanaf het kaartje, net als Statistieken vanaf Meer: met een terugknop en de
`useBackHandler`-laag.

```
‹ Vandaag
Taken                                      [+]
KORTE TERMIJN
◯ Mail begeleider              vandaag
◯ Boodschappen                 te laat · [naar vandaag]
◯ Fiets laten maken
LANGE TERMIJN
▸ Afstudeerstage          40%   deadline 15 jan · nog 52 d
◯ HSK 3 halen
▸ Gedaan (12)
```

- **Volgorde:**
  - Korte termijn: te laat bovenaan, dan op datum, dan taken zonder datum in eigen volgorde.
  - Lange termijn: op deadline (eerst wat het eerst komt), dan taken zonder deadline.
- **Ingeklapt (▸):** met stappen klapt de taak open. Standaard is hij dicht. Open of dicht
  onthouden per toestel mag via `localStorage` (alleen een weergavevoorkeur).
- **Te laat:** naast de taak staat een knop "naar vandaag", die `date` op vandaag zet.
- **Gedaan:** een ingeklapte sectie, nieuwste eerst. Tik op het rondje om terug te zetten.

### Sheet "Taak"

Dit is één sheet voor nieuw, bewerken en stappen. Bovenaan staat alleen de titel en
"Toevoegen". Daaronder, ingeklapt onder "Meer opties":

- korte of lange termijn,
- datum (+ tijd en duur),
- deadline (+ herinnering: geen / op de dag / 1 / 3 / 7 dagen vooraf),
- notitie.

Bij een bestaande hoofdtaak volgen de **stappen**: een lijst met afvinkrondjes en
"+ Stap toevoegen". Tik je een stap aan, dan opent dezelfde sheet voor die stap; een stap heeft
geen eigen stappen. **Verwijderen** staat onderaan de sheet en gaat via `ConfirmDialog`. Bij een
hoofdtaak met stappen staat in de vraag: "met N stappen".

### Planning

- **Dagweergave, taken met tijd:** een blok in `DayTimeline`, met een andere stijl dan
  planningsblokken. Het heeft een stippelrand en een afvinkrondje links; gedaan is
  doorgestreept en vaag. Tik je erop, dan opent de taak-sheet. Slepen en langer maken kan
  niet bij taken.
- **Dagweergave, taken met datum zonder tijd:** boven de tijdlijn staat een strook "Taken" met
  afvinkrondjes; gedaan is doorgestreept.
- **Dagweergave, deadline op die dag:** in dezelfde strook een rood label "Deadline: …".
- **Weeklijst:** per dag onder de blokken dezelfde taakregels (met en zonder tijd) en de
  deadline-labels; gedaan is doorgestreept. Een taak die naar een andere dag verplaatst is,
  staat alleen op die nieuwe dag.
- **Weekstrip:** het bolletje "er is iets gepland" telt taken met een datum ook mee.
- **"Nu en straks" op Vandaag:** blijft alleen planningsblokken tonen. Taken staan in hun eigen
  kaartje.

### Herinneringen (Android-app)

- **Taken met datum en tijd:** dezelfde regel als blokken (`notifLeadMin` vooraf, als meldingen
  aan staan).
- **Deadline met `remindDays`:** om 09:00 op `deadline − remindDays`.

Uitbreiding van `upcomingReminders` (of een zusterfunctie die erbij wordt opgeteld) en van de
hook die Android inplant. Afgevinkte taken krijgen geen herinnering. In de PWA gelden dezelfde
regels zolang de app open is (`notify.js`).

## Tests (minimaal)

- **Unit:**
  - te-laat-regels
  - percentage
  - sortering per lijst
  - welke taken op een dag in Planning staan (datum, tijd, deadline, gedaan)
  - herinneringsmomenten
  - backup-roundtrip met `tasks` en import van een oude backup zonder `tasks`
  - validatie
- **E2E:**
  - op Vandaag een taak toevoegen en afvinken: hij verdwijnt van het kaartje en staat
    doorgestreept in Planning op die dag
  - taak met tijd: blok in de tijdlijn
  - taak zonder datum: niet in Planning; na afvinken onder "Gedaan" en terug te zetten
  - stappen: percentage en open/dicht
  - te laat → "naar vandaag"
  - deadline-label in de weeklijst
  - terugknop vanaf de subpagina
  - axe-check van de subpagina (licht en donker)
  - nieuwe screenshot-baselines voor Vandaag en Planning

## Aan de bouwer

- Precieze stijl binnen de bestaande tokens en bouwstenen. De stippelrand en het afvinkrondje
  zijn de richting, niet de pixels.
- Bestandsindeling: een nieuwe map `src/features/tasks/` met pure regels in `tasks.js` (+ test).
- Of de open/dicht-stand per hoofdtaak in `localStorage` gaat, of alleen in de state.
- Hoe het "+"-veld op het kaartje met het toetsenbord omgaat (Enter = toevoegen en leeg maken,
  focus blijft).

## Keuzes van Claude (ter controle door de eigenaar)

1. **Te laat:** blijft in de lijst met het label "te laat" en de knop "naar vandaag". Verhuist
   niet vanzelf.
2. **Hoofdtaak met stappen:** klaar zodra alle stappen klaar zijn; zelf afvinken kan niet.
3. **Kaartje op Vandaag:** toont vandaag, te laat en deadlines binnen 3 dagen. Staat er altijd,
   ook als het leeg is, met het veld "+ Taak voor vandaag".
4. **Taak met tijd:** duurt standaard 30 minuten en is niet te slepen in de tijdlijn.
5. **Deadline-herinnering:** om 09:00.
6. **Afgevinkte taak met datum:** blijft doorgestreept staan op zijn geplande `date`, ook als je
   hem later afvinkte. Zo klopt de geschiedenis met wat je die dag van plan was.
7. **Andere dag op Vandaag:** het kaartje volgt de getoonde dag. Het toont de taken van die dag
   en het veld wordt "+ Taak voor deze dag". "Te laat" en de komende deadlines staan alleen op
   vandaag.
8. **Stap op het kaartje:** een stap toont kleiner de naam van de hoofdtaak erbij ("· Afstudeerstage").
9. **Taken aanmaken:** alleen via het kaartje en de subpagina, niet vanuit Planning. Tikken op
   een leeg stuk van de tijdlijn blijft een blok maken.
