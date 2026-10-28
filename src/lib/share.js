import { Share } from "@capacitor/share";
import { isNativeApp } from "./platform.js";
import { showToast } from "./toast.js";

// Tekst delen via het deel-menu (Android-app of browser); waar dat niet
// kan, kopiëren. Annuleren in het deel-menu is geen fout.
export async function shareText(text, title) {
  try {
    if (isNativeApp) return await Share.share({ title, text });
    if (navigator.share) return await navigator.share({ title, text });
  } catch {
    return;
  }
  return copyText(text);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Gekopieerd");
  } catch {
    showToast("Kopiëren lukte niet");
  }
}
