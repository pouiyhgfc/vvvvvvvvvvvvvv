---
paths:
  - "src/lib/db.js"
  - "src/lib/backup.js"
  - "src/lib/notes.js"
  - "src/lib/hifd.js"
  - "src/lib/storage.js"
  - "src/main.jsx"
---

# Data en migraties

Mijn data bestaat alleen lokaal op mijn telefoon. Een fout hier is niet terug te draaien met een deploy.

- **Schema wijzigen = nieuwe `db.version(n)`**, nooit een bestaande versie aanpassen. Een primary key verander je niet: maak een nieuwe tabel, kopieer in `.upgrade()`, en haal de oude tabel in een latere versie weg (zie `hifdLog` → `hifdLogV2`).
- **Eenmalige datamigraties** (functies in `db.js`, aangeroepen in `main.jsx`) zijn idempotent en zetten hun `meta`-vlag pas ná succes. Volgorde in `main.jsx` is belangrijk.
- **Nieuwe velden naast oude** ("dual-write") tot ik akkoord geef; oude velden pas later opruimen.
- **Backup-formaat:** wijzigt de data, dan gaat `version` in `exportData` omhoog en moeten oude backups nog steeds importeren.
- Bestaande Hifd-voortgang (status, `nextDue`, interval, ease) gaat bij een algoritmewissel **nooit** terug naar "nieuw".
- `localStorage` wordt alleen nog gebruikt voor `rt_notified_*` (meldingen), als bron voor de eenmalige migratie en bij het wissen van alle data (`App.jsx`). Nieuwe data hoort in Dexie.
