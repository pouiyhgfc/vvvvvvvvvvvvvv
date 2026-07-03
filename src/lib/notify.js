import { useEffect } from "react";
import { dk, eventsOnDate } from "./date.js";
import { loadJSON, saveJSON } from "./storage.js";

// Meldingen werken alleen zolang de app open is: Chrome heeft de
// Notification Triggers API (TimestampTrigger, die meldingen op de
// achtergrond kon inplannen) gestopt te ontwikkelen — "It wasn't clear that
// we could provide consistent and reliable experiences across platforms"
// (developer.chrome.com/docs/web-platform/notification-triggers, "No longer
// pursuing"). Een 30s-interval terwijl de app open is, is dus de enige
// betrouwbare route; robuustere meldingen (bv. via een native wrapper)
// staan als backlog-idee in UITVOERING.md.
export function useNotifications(settings, calEvents) {
  useEffect(() => {
    if (
      !settings.notifEnabled ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;

    const lead = settings.notifLeadMin || 0;
    const body = (ev) =>
      `${ev.startTime}–${ev.endTime}${ev.desc ? " · " + ev.desc : ""}`;
    const titleOf = (ev) => `${ev.icon || "🔔"} ${ev.title}`;

    const fire = (ev) => {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready
            .then((reg) =>
              reg.showNotification(titleOf(ev), {
                body: body(ev),
                tag: ev.id,
                icon: "/icon-192.png",
                badge: "/icon-192.png",
              }),
            )
            .catch(() => {
              new Notification(titleOf(ev), { body: body(ev) });
            });
        } else {
          new Notification(titleOf(ev), { body: body(ev) });
        }
      } catch {}
    };

    const check = () => {
      const now = new Date();
      const notifiedKey = `rt_notified_${dk(now)}`;
      const notified = loadJSON(notifiedKey, []);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      let changed = false;

      eventsOnDate(calEvents, now).forEach((ev) => {
        if (notified.includes(ev.id)) return;
        const [h, m] = (ev.startTime || "00:00").split(":").map(Number);
        const fireMin = h * 60 + m - lead;
        if (nowMin >= fireMin && nowMin <= fireMin + 2) {
          fire(ev);
          notified.push(ev.id);
          changed = true;
        }
      });

      if (changed) saveJSON(notifiedKey, notified);

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("rt_notified_") && k !== notifiedKey)
          localStorage.removeItem(k);
      }
    };

    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [settings.notifEnabled, settings.notifLeadMin, calEvents]);
}
