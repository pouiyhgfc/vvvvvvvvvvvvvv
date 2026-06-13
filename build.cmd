@echo off
REM Bouwt app.js uit app.jsx (JSX -> JS, geminificeerd).
REM Voer dit uit na elke wijziging in app.jsx, daarna alles opnieuw uploaden.
npx --yes esbuild@0.21.5 app.jsx --outfile=app.js --minify --loader:.jsx=jsx
echo.
echo Klaar: app.js opnieuw gebouwd.
echo LET OP: verhoog ook de cache-versie in sw.js (bv. v3 -^> v4) zodat de nieuwe app.js geladen wordt.
