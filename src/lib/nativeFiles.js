import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Schrijft de backup in de app-cache en opent het deel-menu van Android.
export async function shareJSON(filename, payload) {
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: JSON.stringify(payload, null, 2),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({ title: filename, files: [uri] });
}
