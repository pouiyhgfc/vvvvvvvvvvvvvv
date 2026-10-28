# Hifd — onderzoek en advies (fase 6a)

_28-10-2026. Geen code veranderd; dit is het beslisstuk voor fase 6b._

## Waar we nu staan

- **Algoritme:** een SM-2-variant (`src/lib/hifd.js`). Per surah een ease factor; "zwak" zet het
  interval terug naar 1 dag; het interval is afgekapt op **30 dagen**.
- **Eenheid:** één surah = één "kaart".
- **Gelogd per sessie:** datum, fase (leren/revisie), beoordeling (goed/redelijk/zwak),
  versesKnown. Geen aantal fouten.
- **Jouw voortgang** staat alleen op je telefoon; die ken ik niet. De afwegingen hieronder
  hangen af van hoe ver je bent (korte surahs uit Juz 'Amma, of al langere).

## 1. FSRS, SM-2 of de traditionele indeling?

**FSRS** (Free Spaced Repetition Scheduler, nu FSRS-6; in JavaScript `ts-fsrs` 5.4.2, MIT):
modelleert per kaart *stabiliteit* en *moeilijkheid* en voorspelt de kans dat je hem nog kent.
In de open benchmark (10.000 Anki-gebruikers, ±727 miljoen herhalingen) voorspelt FSRS-6
geheugen duidelijk beter dan SM-2. Maar:

- Die winst komt uit **gepersonaliseerde parameters**, en die vragen honderden herhalingen
  per gebruiker. Met de revisies die de app tot nu toe logt, is dat er voorlopig niet;
  dan draait FSRS op standaardwaarden die getraind zijn op losse flashcards.
- FSRS is gebouwd voor **atomaire kaarten** (één feit: ken je het wel of niet). Een stuk
  Koran zakt **gedeeltelijk** weg: een paar haperingen in een verder goede recitatie. "Goed /
  zwak" vangt dat maar grof.

**De traditionele indeling** (hifz-scholen) werkt met drie lagen:

- **Sabaq**: het nieuwe stuk van vandaag (½–1 pagina).
- **Sabqi**: het recent geleerde (de laatste dagen/weken), dagelijks herhaald.
- **Manzil**: alles wat je al kent, in een **vaste rotatie**: een vast dagdeel (bijv. 5–7
  pagina's voor wie werkt/studeert, ½–1 juz voor fulltime) zodat alles binnen een cyclus
  (week tot maand) langskomt. Fouten komen extra terug tot ze weg zijn.

Het sterke punt van manzil is **gegarandeerde dekking**: niets raakt langer dan één cyclus
onaangeroerd. Dat is precies wat de huidige 30-dagen-afkapping probeert te bereiken, maar
SM-2 plant los per surah en kan zo bergjes maken (veel tegelijk), of op drukke dagen
achterlopen zonder dat je ziet welk deel het langst niet geweest is.

**Advies:** nog geen FSRS. Bouw de revisie om naar **sabqi + manzil**, met de bestaande
beoordeling als bijsturing:

- **Sabqi:** wat in de laatste 30 dagen gememoriseerd is, komt dagelijks terug.
- **Manzil:** al het oudere in rotatie, gesorteerd op "langst niet herhaald". Een vast
  dagbudget (instelbaar, nu "Hifd-revisies per dag"). Cyclusduur volgt vanzelf uit
  hoeveelheid ÷ budget en wordt getoond ("alles komt elke 12 dagen langs").
- **Zwak** = dat stuk gaat de komende dagen in sabqi tot het weer goed gaat (in plaats van
  "interval naar 1 dag" in een los schema).
- **FSRS later**, als schaduwmodel: zodra er een paar honderd revisies met fouten-aantallen
  zijn, kan FSRS meelopen en tonen wat hij zou plannen. Overstappen alleen als het
  aantoonbaar beter past.

## 2. Granulariteit: per surah, pagina of ruku'?

- Voor korte surahs (bijna heel Juz 'Amma) is **per surah prima**: die zijn korter dan een
  pagina.
- Vanaf de langere surahs klopt het niet meer: Al-Baqarah is 286 verzen, ±48 pagina's. "Ik
  ken Al-Baqarah: goed/zwak" zegt dan niets, en één kaart van 48 pagina's past niet in een
  dagbudget.
- **Pagina** (604 in de Madani-mushaf) is de eenheid waarin hifz-scholen tellen (sabaq ½–1
  pagina, manzil in pagina's/juz) en waarin je zelf reciteert. Ruku' (±558) of rub' al-hizb
  (240) zijn alternatieven, maar minder gangbaar voor revisie.

**Advies:** de **pagina** als revisie-eenheid voor manzil, met de surah als weergave
("Al-Mulk, p. 562–564"). Leren (sabaq) mag per surah of per stuk blijven.

**Wat dat betekent voor de data** (dit is het deel dat jouw akkoord nodig heeft):

- Een kleine vaste tabel pagina → (surah, vers-van, vers-tot), uit de Tanzil-metadata
  (CC BY 3.0, naamsvermelding). Ongeveer 600 regels, geen netwerk nodig.
- Een nieuwe Dexie-tabel voor revisie per pagina, **naast** de huidige `hifd`-tabel
  (dual-write). De migratie zet elke gememoriseerde surah om naar zijn pagina's en neemt de
  laatste revisiedatum mee. Er gaat niets terug naar "nieuw".
- Backupformaat +1; oude backups blijven importeren.

## 3. Het maximale interval van 30 dagen

Het past bij een maandelijkse manzil-cyclus en is voor Koran verstandig: ook een sterk stuk
moet minstens maandelijks langskomen. In het rotatiemodel wordt het geen afkapping meer maar
de **cyclusduur**: kies je budget zo dat de cyclus onder de 30 dagen blijft, en waarschuw als
hij erboven komt ("je manzil is 34 dagen: verhoog je dagbudget of plan een inhaaldag").

## 4. Wat we meten (om later te kunnen kiezen)

- **Per revisie:** beoordeling plus **aantal fouten** (0, 1–2, 3+) en eventueel haperingen.
  Kost één tik extra en is de data die FSRS later nodig heeft.
- **Per pagina/surah:** dagen sinds laatste revisie, fouten-trend.
- **In Statistieken:** cyclusduur, dekking (% van je hifd in de laatste 30 dagen herhaald),
  zwakke plekken (stukken met de meeste fouten).

## Keuze voor jou

| Optie | Wat | Data-wijziging | Advies |
| --- | --- | --- | --- |
| **A** | Huidige SM-2 houden, alleen fouten-aantal loggen | Klein (één veld in de log) | Minimaal |
| **B** | Sabqi + manzil-rotatie, per surah; fouten loggen | Klein | **Nu het beste** |
| **C** | B, en vanaf de lange surahs per pagina | Nieuwe tabel + migratie | Doen zodra je aan langere surahs begint |
| **D** | FSRS | Nieuwe velden + migratie | Later, eerst als schaduwmodel |

Alle opties volgen de afspraak uit het plan: eerst **schaduwmodus** (het nieuwe advies naast het
huidige, 2–4 weken), pas omschakelen na jouw akkoord, en bestaande voortgang blijft staan.

## Bronnen

- [open-spaced-repetition/srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark)
  — FSRS-6: log loss 0,346, AUC 0,703; 10k gebruikers, ±727 mln herhalingen.
- [ts-fsrs op npm](https://npmjs.com/package/ts-fsrs) — 5.4.2, MIT.
- [Quran Hifz Revision Schedule (Quran Sheikh)](https://www.quransheikh.com/quran-hifz-revision-schedule/)
  — sabaq/sabqi/manzil, dagbudgetten per hoeveelheid juz.
- [Saba', Sabqi, Manzil method (IAIN Palopo)](https://ejournal.iainpalopo.ac.id/index.php/jiis/article/view/12297)
- [Anki-forum: FSRS vs SM-2 in de praktijk](https://forums.ankiweb.net/t/why-does-fsrs-provide-fewer-review-than-the-original-anki-sm-2/35567)
