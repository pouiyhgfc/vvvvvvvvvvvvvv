# Taken — implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een takenlijst (korte en lange termijn), met optionele datum, tijd, deadline en stappen.
Je opent hem via een kaartje op Vandaag, en taken met een datum staan in Planning.

**Architecture:** Een nieuwe Dexie-tabel `tasks` is de enige bron. Pure regels staan in
`src/features/tasks/tasks.js` (met unit-tests), en schrijven gaat via `taskStore.js`. De UI
leest met `useLiveQuery`. Planning en meldingen krijgen taken als *afgeleide* gegevens; er
worden nooit kopieën in `calEvents` gemaakt.

**Tech Stack:** React 19, Dexie 4 (`useLiveQuery`), Vitest + fake-indexeddb, Playwright.

**Spec:** `.md/ONTWERP-TAKEN.md`

## Global Constraints

- **Datamodel:** alleen `db.version(7).stores({ tasks: "&id, parentId, date, deadline, doneAt" })`;
  bestaande tabellen blijven onaangeroerd.
- **Backup:** `BACKUP_VERSION` 14. Oude backups zonder `tasks` importeren gewoon.
- **UI:**
  - alleen de bouwstenen uit `src/ui/` (Sheet, Field, Button, Card, ListRow, ConfirmDialog);
  - kleuren via tokens; geen harde hexkleuren in JSX (de lint faalt anders);
  - `dir="auto"` op titels;
  - tikvlakken ≥ 44 px.
- **Teksten:** Nederlands en exact zoals in de spec: "Te doen", "Taken", "Korte termijn",
  "Lange termijn", "Gedaan", "te laat", "naar vandaag", "+ Taak voor vandaag", "Meer opties",
  "+ Stap toevoegen", "Hele taak afvinken?", "Deadline: …".
- **Bestanden:** geen bestand boven 400 regels (lint); `npm run lint`, `npm test`,
  `npm run build`, `npm run deadcode` en Playwright groen; jscpd ≤ 1%.
- **Commits:** één stap per commit; functionaliteit en structuur niet mengen; push naar `main`.

## Review Focus

1. **Tijd zonder datum:** het tijdveld is uitgeschakeld zolang er geen datum is, en
   `normalizeTask` wist `time` als `date` leeg is (test in Taak 1).
2. **Hoofdtaak verwijderen:** de stappen gaan mee; er blijven geen losse stappen in de
   database achter (test in Taak 1).
3. **Lege titel:** "Toevoegen" is uitgeschakeld en Enter in het snelveld doet niets (e2e in
   Taak 3).
4. **Gedane stap terugzetten onder een gedane hoofdtaak:** de stap staat weer open, de
   hoofdtaak blijft gedaan, en het percentage klopt (test in Taak 1).
5. **Middernacht:** "vandaag" komt van de getoonde `date` op Vandaag, niet van een vaste waarde.
   Een taak van gisteren is vandaag "te laat" (test in Taak 1).

---

### Taak 1: Datamodel, regels en opslag

**Files:**
- Modify: `src/lib/db.js` (onder `db.version(6)`)
- Create: `src/features/tasks/tasks.js`, `src/features/tasks/tasks.test.js`
- Create: `src/features/tasks/taskStore.js`, `src/features/tasks/taskStore.test.js`

**Interfaces — Produces:**
- `tasks.js` (puur; `today` is overal een `"YYYY-MM-DD"`-string):
  - `normalizeTask(fields) → task`: trimt de titel; zonder `date` worden `time` en
    `durationMin` `null`; met `time` zonder duur wordt `durationMin` 30.
  - `isOverdue(task, today) → boolean`: nog niet gedaan, en `date < today` of
    `deadline < today`.
  - `progress(steps) → number | null`: percentage gedaan, afgerond; `null` zonder stappen.
  - `shortList(tasks, today)` en `longList(tasks)` → hoofdtaken die nog open zijn
    (`!parentId && !doneAt`), gefilterd op `horizon`.
    - Kort: te laat eerst, dan op `date`, dan zonder datum op `order`.
    - Lang: op `deadline`, dan zonder deadline op `order`.
  - `doneList(tasks) → task[]`: gedane hoofdtaken zonder `date`, nieuwste `doneAt` eerst.
  - `stepsOf(tasks, id) → task[]`: de stappen van één taak, op `order`.
  - `onDate(tasks, day) → { timed, untimed, deadlines }`: alles (ook stappen, ook gedaan) met
    `date === day`, gesplitst op wel of geen `time`; `deadlines` = open taken met
    `deadline === day`.
  - `cardList(tasks, day, today) → { items, deadlines }`:
    - items: open taken met `date === day`, plus de te-late als `day === today`;
    - deadlines: als `day === today`, open deadlines in `[today, today+3]`.
  - `daysLeft(deadline, today) → number`.
- `taskStore.js` (Dexie):
  - `addTask(fields) → id`: zet `id`, `createdAt` en `doneAt: null`, en `order` = max + 1
    binnen dezelfde lijst of hoofdtaak.
  - `updateTask(id, fields)`
  - `toggleDone(id)`
  - `moveToToday(id, today)`
  - `deleteTask(id)`: verwijdert de taak en zijn stappen in één transactie.
- `useTasks()`: `useLiveQuery(() => db.tasks.toArray()) ?? []`, in `taskStore.js`.

- [ ] **Stap 1: Schrijf de unit-tests** in `tasks.test.js`:
  - `isOverdue` voor gisteren, vandaag en gedaan;
  - `progress` voor 0, 2 van 5 (= 40) en geen stappen (= `null`);
  - de volgorde van `shortList` en `longList`;
  - `onDate` met een gedane taak met tijd (zit in `timed`);
  - `cardList` voor vandaag en voor een andere dag;
  - `normalizeTask` met `{ title: " x ", time: "10:00" }` en zonder `date` geeft `time: null`
    (Review Focus 1).

  In `taskStore.test.js` (fake-indexeddb, zoals `db.test.js`):
  - `deleteTask` op een hoofdtaak met 2 stappen laat 0 rijen achter (Review Focus 2);
  - `toggleDone` op een stap onder een gedane hoofdtaak: de stap is open en de hoofdtaak
    blijft gedaan (Review Focus 4);
  - `addTask` geeft opeenvolgende `order`-waarden.
- [ ] **Stap 2: Draai de tests en zie ze falen.**
  `npx vitest run src/features/tasks` → FAIL (de modules bestaan nog niet).
- [ ] **Stap 3: Bouw `db.version(7)`, `tasks.js` en `taskStore.js`** volgens de interfaces
  hierboven, met een comment bij de versie, zoals bij v6.
- [ ] **Stap 4: Draai de tests en zie ze slagen.**
  `npx vitest run src/features/tasks` en `npm test` → PASS.
- [ ] **Stap 5: Commit:** "Taken: datamodel (Dexie v7) en regels".

### Taak 2: Backup, import en alles wissen

**Files:**
- Modify: `src/lib/validateBackup.js`, `src/lib/backup.js`, `src/lib/resetData.js`,
  `src/lib/backup.test.js`, `e2e/flows.spec.js` (versie)

**Interfaces — Consumes:** de tabel `db.tasks` uit Taak 1.

- [ ] **Stap 1: Schrijf de tests** in `backup.test.js`:
  - roundtrip met 2 taken (`backup.tasks` heeft lengte 2, en na vervangen staan ze er weer);
  - een oude backup zonder `tasks` geeft geen fout;
  - `validateBackup({ tasks: [{ id: 1 }] })` meldt een probleem.

  Zet in `backup.test.js` en `flows.spec.js` de verwachte versie op 14.
- [ ] **Stap 2: Draai de tests en zie ze falen.**
- [ ] **Stap 3: Bouw het:**
  - `BACKUP_VERSION = 14` met een comment, en in `LISTS`:
    `tasks: (t) => typeof t.id === "string" && typeof t.title === "string"`;
  - export `tasks: await db.tasks.toArray()`;
  - in `performFullImport`: `db.tasks` erbij in de transactie; bij vervangen eerst `clear()`;
    daarna `bulkPut` als er taken in de backup staan;
  - in `clearEverything`: `db.tasks.clear()`.
- [ ] **Stap 4: Draai `npm test` en zie het slagen.**
- [ ] **Stap 5: Commit:** "Taken: mee in backup (v14) en bij alles wissen".

### Taak 3: Subpagina "Taken" en de taak-sheet

**Files:**
- Create in `src/features/tasks/`:
  - `TaskRow.jsx`: afvinkrondje, titel, labels (datum, tijd, "te laat" + "naar vandaag",
    deadline "nog N d", percentage) en ▸ om open te klappen;
  - `TaskSheet.jsx`: titel, "Meer opties" en stappen;
  - `TasksPage.jsx`
- Modify: `src/App.jsx` (view `"taken"`, zoals `"stats"`)
- Test: `e2e/tasks.spec.js`

**Interfaces:**
- Consumes: alles uit Taak 1.
- Produces:
  - `<TaskSheet task={task|null} parent={task|null} defaults={{date?, horizon?}} onClose />`
  - `<TaskRow task steps today onToggle onOpen onToday />`
  - `<TasksPage today={dk(date)} onBack />`

- [ ] **Stap 1: Schrijf `e2e/tasks.spec.js`:**
  - Op de subpagina een korte-termijntaak "Fiets" toevoegen, alleen met titel. Hij staat onder
    "Korte termijn". Afvinken zet hem onder "Gedaan (1)", en terugzetten werkt.
  - "Toevoegen" is uitgeschakeld bij een lege titel (Review Focus 3).
  - Een lange-termijntaak met 2 stappen, waarvan 1 gedaan, toont "50%". Open- en dichtklappen
    toont en verbergt de stappen.
  - Een taak met datum gisteren toont "te laat". "naar vandaag" haalt het label weg.
  - `history.back()` vanaf de subpagina geeft Vandaag.

  Open de subpagina voorlopig via `page.evaluate` of de route uit Taak 4. Taak 4 voegt de
  ingang toe; schrijf deze test dus samen met Taak 4 als dat eenvoudiger is.
- [ ] **Stap 2: Draai de test en zie hem falen.**
- [ ] **Stap 3: Bouw het:**
  - de componenten volgens de spec ("Schermen" → "Subpagina" en "Sheet");
  - in de sheet: "Meer opties" standaard dicht; tijd en duur uitgeschakeld zonder datum;
    herinnering-keuze geen / 0 / 1 / 3 / 7 dagen;
  - de stappenlijst alleen bij een bestaande hoofdtaak;
  - verwijderen via `ConfirmDialog`, met "met N stappen";
  - na de laatste gedane stap een `ConfirmDialog` "Hele taak afvinken?";
  - in App: `view === "taken"` rendert `TasksPage` met een `BackButton` "Vandaag", en de
    TabBar markeert dan "tracker". De bestaande `useBackHandler(view !== "tracker")` dekt
    "terug".
- [ ] **Stap 4: Draai de e2e-test, lint en build, en zie ze slagen.**
- [ ] **Stap 5: Commit:** "Taken: lijst (subpagina) en taak-sheet".

### Taak 4: Kaartje "Te doen" op Vandaag

**Files:**
- Create: `src/features/tasks/TodayTasksCard.jsx`
- Modify: `src/features/tracker/TrackerView.jsx` (onder `UpNextCard`), `src/App.jsx`
  (`onOpenTasks={() => setView("taken")}`)
- Test: `e2e/tasks.spec.js`

**Interfaces:**
- Consumes: `cardList`, `toggleDone`, `addTask`, `TaskRow`, `TaskSheet`.
- Produces: `<TodayTasksCard date={Date} onOpenAll />`

- [ ] **Stap 1: Breid de e2e-test uit:**
  - op Vandaag "+ Taak voor vandaag" typen en Enter: de taak staat op het kaartje;
  - afvinken: weg van het kaartje;
  - "Te doen ›" opent "Taken";
  - een deadline over 2 dagen toont "Deadline: … over 2 dagen".
- [ ] **Stap 2: Draai de test en zie hem falen.**
- [ ] **Stap 3: Bouw het kaartje** volgens de spec. Het snelveld maakt
  `addTask({ title, horizon: "kort", date: dk(date) })`; na Enter wordt het veld leeg en
  blijft de focus erin. Op een andere dag dan vandaag is de tekst "+ Taak voor deze dag".
  Een stap toont "· <titel hoofdtaak>".
- [ ] **Stap 4: Draai de e2e-test en de visuele test, en zie ze slagen.**
  De baselines van Vandaag veranderen bewust: draai `-u` en bekijk de screenshots.
- [ ] **Stap 5: Commit:** "Taken: kaartje Te doen op Vandaag".

### Taak 5: Taken in Planning

**Files:**
- Create: `src/features/tasks/DayTasks.jsx`: strook met taken zonder tijd en
  deadline-labels voor één dag, gebruikt in de dagweergave en in de weeklijst.
- Modify:
  - `src/features/planner/PlanningView.jsx`: `useTasks`; geeft `onDate(...)` door;
    `DayTasks` boven `DayTimeline`; de taak-sheet openen;
  - `DayTimeline.jsx`: extra prop `tasks` (= `timed`). Een taakblok heeft een stippelrand, een
    afvinkrondje, is doorgestreept als hij gedaan is, en kan niet slepen of resizen. Tikken
    roept `onEditTask` aan;
  - `WeekList.jsx`: per dag `DayTasks` (compact, ook met tijd);
  - `WeekStrip.jsx`: het bolletje telt `onDate` mee.
- Test: `e2e/tasks.spec.js`, `src/features/tasks/tasks.test.js` (`onDate` is al gedekt)

**Interfaces — Consumes:** `useTasks`, `onDate`, `toggleDone`, `TaskSheet`.

- [ ] **Stap 1: Breid de e2e-test uit:**
  - een taak voor vandaag, afgevinkt op Vandaag, staat doorgestreept in Planning → Dag;
  - een taak met tijd 14:00 staat als blok `[data-task]` in de tijdlijn;
  - een taak zonder datum staat niet in Planning;
  - een deadline staat in Week als "Deadline: …".
- [ ] **Stap 2: Draai de test en zie hem falen.**
- [ ] **Stap 3: Bouw het** volgens de interfaces hierboven. Gebruik `Card` en `ListRow` waar
  het past; geen nieuwe kleuren.
- [ ] **Stap 4: Draai de e2e-tests, de visuele test (`-u` voor de Planning-baselines, en
  bekijk ze) en `npm run lint`, en zie ze slagen.**
- [ ] **Stap 5: Commit:** "Taken: in de planning (dag, week, tijdlijn)".

### Taak 6: Herinneringen

**Files:**
- Modify: `src/features/tasks/tasks.js`, `src/features/tasks/tasks.test.js`, `src/App.jsx`

**Interfaces:**
- Produces: `taskEvents(tasks, today) → event[]`, met dezelfde vorm als `calEvents` die
  `eventsOnDate`, `upcomingReminders` en `useNotifications` gebruiken
  (`id, date, startTime, endTime, title, desc`):
  - een open taak met datum en tijd: `{ id: "task-"+id, date, startTime: time,
    endTime: time + durationMin }`;
  - een open taak met `deadline` en `remindDays`: `{ id: "deadline-"+id,
    date: deadline − remindDays, startTime: "09:00", endTime: "09:00",
    title: "Deadline: "+title }`.
- In App: `const reminderEvents = useMemo(() => [...calEvents, ...taskEvents(tasks, dk(new Date()))], …)`.
  Die gaan naar `useNotifications` en `useNativeNotifications`, niet naar Planning.

- [ ] **Stap 1: Schrijf de tests voor `taskEvents`:**
  - een taak met tijd geeft 1 event met de juiste `endTime` (10:00 + 45 min = "10:45");
  - een gedane taak geeft niets;
  - een deadline 2026-12-10 met `remindDays` 3 geeft `date` "2026-12-07".
- [ ] **Stap 2: Draai de tests en zie ze falen.**
- [ ] **Stap 3: Bouw `taskEvents` en geef de events door in App.**
- [ ] **Stap 4: Draai `npm test`, lint en build, en zie ze slagen.**
- [ ] **Stap 5: Commit:** "Taken: herinneringen (tijd en deadline)".

### Taak 7: Afronden

- [ ] **Stap 1:** Voeg "Taken" toe aan de schermen in `e2e/a11y.spec.js`, open via het kaartje.
  Draai axe in licht en donker, en zie het slagen.
- [ ] **Stap 2:** Volledige controle: `npm run lint`, `npm test`, `npm run build`,
  `npm run deadcode`, `npx playwright test` en jscpd (≤ 1%).
- [ ] **Stap 3:** Review van de hele wijziging tegen de spec en de code-kwaliteitsregels in
  `CLAUDE.md`. Los de bevindingen op.
- [ ] **Stap 4:** Bijwerken:
  - `.md/UITVOERING.md`: backlog-regel als idee van de eigenaar, aangevinkt, met de status;
  - `.md/ONTWERP-TAKEN.md`: status "gebouwd".
- [ ] **Stap 5:** Commit, push en wacht op een groene CI en Android-build.
