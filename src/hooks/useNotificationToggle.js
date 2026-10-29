import { useState } from "react";
import { isNativeApp } from "../lib/platform.js";
import { notifyNow, requestNativePermission } from "../lib/nativeNotify.js";
import { showToast } from "../lib/toast.js";

// Meldingen aan/uit met de juiste toestemmingsvraag: in de Android-app via
// Android zelf, in de PWA via de browser.
export function useNotificationToggle(settings, setSettings) {
  const [notifPerm, setNotifPerm] = useState(
    isNativeApp
      ? "default"
      : typeof Notification !== "undefined"
        ? Notification.permission
        : "unsupported",
  );

  const toggleNotifications = async () => {
    // In de Android-app plant Android zelf de meldingen in (nativeNotify).
    if (isNativeApp) {
      if (settings.notifEnabled) {
        setSettings((s) => ({ ...s, notifEnabled: false }));
        return;
      }
      const perm = await requestNativePermission();
      setNotifPerm(perm);
      if (perm === "granted") {
        setSettings((s) => ({ ...s, notifEnabled: true }));
        notifyNow(
          "Meldingen aan",
          "Je krijgt nu herinneringen voor je planning.",
        );
      } else {
        showToast(
          "Meldingen zijn geblokkeerd. Sta ze toe in de app-instellingen.",
        );
      }
      return;
    }
    if (typeof Notification === "undefined") {
      showToast("Meldingen worden niet ondersteund door deze browser.");
      return;
    }
    if (settings.notifEnabled) {
      setSettings((s) => ({ ...s, notifEnabled: false }));
      return;
    }
    let perm = Notification.permission;
    if (perm !== "granted") perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      setSettings((s) => ({ ...s, notifEnabled: true }));
      // Android-PWA's tonen meldingen alleen via de service worker;
      // de `new Notification()`-constructor faalt daar stil.
      const title = "Meldingen aan";
      const body = "Je krijgt nu herinneringen voor je weekplanning.";
      if (navigator.serviceWorker) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(title, {
              body,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            }),
          )
          .catch(() => {
            try {
              new Notification(title, { body });
            } catch {}
          });
      } else {
        try {
          new Notification(title, { body });
        } catch {}
      }
    } else {
      showToast(
        "Meldingen zijn geblokkeerd. Sta ze toe in de browser-/app-instellingen om herinneringen te krijgen.",
      );
    }
  };

  return { notifPerm, toggleNotifications };
}
