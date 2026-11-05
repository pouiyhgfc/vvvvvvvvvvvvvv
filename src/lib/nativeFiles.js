import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { showToast } from "./toast.js";

const FOLDER = "Routine";

// Android-app: een gewone download werkt in de WebView niet. Daarom schrijven
// we het bestand zelf naar de openbare map Documenten/Routine, waar je het
// met Bestanden terugvindt en bij importeren kiest. Lukt dat niet (oude
// Android zonder toegang), dan via het deel-menu.
export async function saveJSON(filename, payload) {
  const data = JSON.stringify(payload, null, 2);
  try {
    await Filesystem.writeFile({
      path: `${FOLDER}/${filename}`,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    showToast(`Opgeslagen in Documenten/${FOLDER}/${filename}`);
  } catch {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, files: [uri] });
  }
}
