import { App } from "@capacitor/app";
import { isNativeApp } from "./platform.js";

// Android-app: zonder dit sluit de terugknop de app meteen (en start hij bij
// openen opnieuw). Nu gaat "terug" door de geschiedenis van de app (zie
// useBackHandler); op het beginscherm gaat de app naar de achtergrond, zodat
// hij bij openen staat waar je was.
export function setupNativeBack() {
  if (!isNativeApp) return;
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) history.back();
    else App.minimizeApp();
  });
}
