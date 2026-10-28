import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { upcomingReminders } from "./reminders.js";

// Alleen in de Android-app (Capacitor). In de PWA blijft notify.js gelden.
export const isNativeApp = Capacitor.isNativePlatform();

// Toestemming voor meldingen. Vanaf Android 12 komen ingeplande meldingen
// alleen op de minuut als ook "Wekkers en herinneringen" aan staat; zonder
// komen ze, maar soms een paar minuten later.
export async function requestNativePermission() {
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== "granted") return "denied";
  const { exact_alarm } =
    await LocalNotifications.checkExactNotificationSetting();
  if (exact_alarm !== "granted")
    await LocalNotifications.changeExactNotificationSetting();
  return "granted";
}

export function notifyNow(title, body) {
  return LocalNotifications.schedule({
    notifications: [{ id: 1, title, body }],
  });
}

// Plant alle herinneringen voor de komende twee weken opnieuw in, telkens
// als de planning of de instelling verandert (en bij elke start van de app).
export function useNativeNotifications(settings, calEvents) {
  useEffect(() => {
    if (!isNativeApp) return;
    let stale = false;
    (async () => {
      const { notifications } = await LocalNotifications.getPending();
      if (stale) return;
      if (notifications.length)
        await LocalNotifications.cancel({
          notifications: notifications.map((n) => ({ id: n.id })),
        });
      if (!settings.notifEnabled) return;
      const reminders = upcomingReminders(
        calEvents,
        settings.notifLeadMin || 0,
      );
      if (!reminders.length) return;
      await LocalNotifications.schedule({
        notifications: reminders.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          schedule: { at: r.at, allowWhileIdle: true },
        })),
      });
    })().catch(() => {});
    return () => {
      stale = true;
    };
  }, [settings.notifEnabled, settings.notifLeadMin, calEvents]);
}
