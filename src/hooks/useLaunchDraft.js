import { useEffect, useState } from "react";

// Leest de PWA-shortcut-/share-target-parameters uit de URL (?action=…,
// /share met title/text/url). Puur lezen — geen state, geen side effects.
function parseLaunchAction() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const action = params.get("action");
  const isShareTarget =
    window.location.pathname === "/share" ||
    params.has("title") ||
    params.has("text") ||
    params.has("url");
  return { action, isShareTarget, params };
}

// App-shortcuts ("Nieuwe notitie"/"Vandaag") en de share-target ("/share")
// uit het PWA-manifest: via een lazy state-initializer gelezen (niet via
// setState in een effect) zodat de eerste render meteen klopt. "Vandaag"
// heeft geen eigen code nodig — view "tracker" + datum "vandaag" zijn al
// de standaardwaarden in App.
export function useLaunchDraft() {
  const [launchDraft, setLaunchDraft] = useState(() => {
    const launch = parseLaunchAction();
    if (launch?.action === "new-note") return {};
    if (launch?.isShareTarget) {
      const title = launch.params.get("title") || "";
      const text = launch.params.get("text") || "";
      const url = launch.params.get("url") || "";
      return { title, body: [text, url].filter(Boolean).join("\n") };
    }
    return null;
  });

  // Voorkomt dat de shortcut-/share-actie bij een refresh herhaalt.
  useEffect(() => {
    const launch = parseLaunchAction();
    if (launch?.action || launch?.isShareTarget) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  return [launchDraft, setLaunchDraft];
}
