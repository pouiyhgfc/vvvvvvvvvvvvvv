import { useEffect, useRef } from "react";

// De terugknop van de telefoon (en van de browser) volgt de app: elke open
// laag (sheet, dialoog, notitie, subpagina) zet een stap in de geschiedenis,
// en "terug" sluit de bovenste laag in plaats van de app te verlaten.
//
// Sluit de app zelf een laag (bv. via een knop), dan halen we die stap weer
// weg. Nieuwe stappen wachten tot dat klaar is, anders loopt de geschiedenis
// door elkaar als je in één tik iets sluit en iets anders opent.
const layers = [];
let expectedPops = 0; // eigen history.go(), niet de gebruiker
let queuedPushes = 0; // lagen die nog op hun stap wachten
let stepsBack = 0; // te verwijderen stappen, samengevoegd per tik

const pushStep = () => history.pushState({ rtLayer: true }, "");

function onPopState(e) {
  if (expectedPops > 0) {
    expectedPops--;
    if (expectedPops === 0) for (; queuedPushes > 0; queuedPushes--) pushStep();
    return;
  }
  const top = layers.pop();
  if (top) top.close();
  // Oude stap van vóór een herlaadbeurt: geen laag meer bij, dus doorlopen.
  else if (e.state?.rtLayer) history.back();
}

function open(layer) {
  layers.push(layer);
  if (expectedPops > 0 || stepsBack > 0) queuedPushes++;
  else pushStep();
}

function closedByApp(layer) {
  const i = layers.indexOf(layer);
  if (i < 0) return; // al gesloten via "terug"
  layers.splice(i, 1);
  if (queuedPushes > 0) {
    queuedPushes--; // zijn stap was nog niet gezet
    return;
  }
  // Meerdere lagen tegelijk dicht (bv. notitie mét open sheet): één sprong.
  if (stepsBack++ === 0)
    queueMicrotask(() => {
      expectedPops++;
      history.go(-stepsBack);
      stepsBack = 0;
    });
}

if (typeof window !== "undefined")
  window.addEventListener("popstate", onPopState);

// Zolang `active` waar is, sluit "terug" deze laag via `onBack`.
export function useBackHandler(active, onBack) {
  const latest = useRef(onBack);
  useEffect(() => {
    latest.current = onBack;
  });
  useEffect(() => {
    if (!active) return undefined;
    const layer = { close: () => latest.current() };
    open(layer);
    return () => closedByApp(layer);
  }, [active]);
}
