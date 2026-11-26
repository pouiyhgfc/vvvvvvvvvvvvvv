import { saveText } from "./nativeFiles.js";
import { isNativeApp } from "./platform.js";

// Een tekstbestand downloaden. In de Android-app werkt een gewone download
// niet; daar schrijft saveText het naar Documenten/Routine.
export function downloadText(filename, text, type) {
  if (isNativeApp) return saveText(filename, text);
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
