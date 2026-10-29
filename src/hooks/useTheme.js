import { useEffect } from "react";

// Zet het thema op <html> en de kleur van de statusbalk.
export function useTheme(theme) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute("content", theme === "dark" ? "#0f1411" : "#eef1ec");
  }, [theme]);
}
