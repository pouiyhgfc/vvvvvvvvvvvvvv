import { Capacitor } from "@capacitor/core";

// true in de Android-app (Capacitor), false in de PWA/browser.
export const isNativeApp = Capacitor.isNativePlatform();
