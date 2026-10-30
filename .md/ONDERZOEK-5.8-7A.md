# Onderzoek 5.8 en 7a (30-10-2026)

_Geen code veranderd; dit zijn twee korte beslisstukken._

## 5.8 Meerdere blokken selecteren op touch

**Nu:** op Android selecteer je tekst over meerdere blokken met de gewone tekstselectie
(lang indrukken, grepen slepen). Daarna werkt ⠿ → Kopiëren al voor de hele selectie (zie
`editorActions.js`). Wat ontbreekt: meerdere blokken in één keer verplaatsen, kleuren of
verwijderen zonder tekst te slepen.

**Wat BlockNote biedt:** een publieke API `editor.setSelection(beginBlok, eindBlok)` en
`editor.getSelection()` (geeft alle blokken in de selectie, ook geneste). Geen eigen
touch-UI daarvoor; de documentatie zegt niets over mobiel.

**Mogelijke aanpak (alleen publieke API):**

1. In het blokmenu (⠿) een knop **"Selecteren vanaf hier"**.
2. Daarna tik je op het ⠿ van een ander blok: `setSelection(begin, eind)`.
3. Het blokmenu werkt dan op alle geselecteerde blokken: kopiëren, verwijderen, kleur,
   omhoog/omlaag.

**Inschatting:** middelgroot (± een dag), raakt `BlockHandle` en `BlockMenuSheet`, en het
gevoel is alleen op een echte telefoon te testen.

**Advies:** pas bouwen als je het echt mist. Voor kopiëren werkt de gewone selectie al.

## 7a AI in de browser zelf (zonder server)

**Chrome's ingebouwde AI** (Prompt-, Summarizer-, Writer-API met Gemini Nano): werkt alleen op
desktop (Windows, macOS, Linux, Chromebook Plus). Volgens de Chrome-documentatie wordt "Chrome
for Android, iOS, and ChromeOS on non-Chromebook Plus devices" **nog niet ondersteund**. Ook op
desktop zijn de eisen hoog: 22 GB vrije schijfruimte, meer dan 4 GB videogeheugen, 16 GB
werkgeheugen. "Gemini in Chrome" op Android (mei 2026) is een assistent in de browser, geen API
voor web-apps.

**Een eigen model meesturen** (WebLLM of transformers.js via WebGPU): kan op recente
Android-telefoons met kleine modellen (± 0,5–1,5 miljard parameters). Nadelen: eerste keer
honderden MB's tot ruim 1 GB downloaden, traag, het kost veel batterij, en de kwaliteit ligt
ver onder Claude. Voor een weekreview of samenvatting in het Nederlands is dat te zwak.

**Advies:** niet nu. "Stuur naar Claude" (delen/kopiëren) blijft de manier. Opnieuw bekijken
zodra Chrome de Prompt-API op Android aanbiedt; de knoppen in de app kunnen dan dezelfde
blijven.

## Bronnen

- [Chrome: Get started with built-in AI](https://developer.chrome.com/docs/ai/get-started) —
  platformen en hardware-eisen.
- [Google: Gemini in Chrome naar Android](https://blog.google/products-and-platforms/products/chrome/bringing-chrome-ai-to-android/?hl=es)
  (12-05-2026).
- [BlockNote: Cursor & Selections](https://www.blocknotejs.org/docs/reference/editor/cursor-selections).
- [WebLLM-paper](https://arxiv.org/html/2412.15803v1) en
  [WebGPU-modellen op de telefoon (mei 2026)](https://callsphere.ai/blog/llm-comparison-browser-side-llm-webgpu-small-models-may-2026).
