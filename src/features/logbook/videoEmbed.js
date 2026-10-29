// Zet een gedeelde videolink om naar het adres van de ingebouwde speler van
// die site. Onbekende links geven null: dan tonen we alleen de link.
// `vertical` = staand formaat (Shorts, Reels, TikTok).
export function videoEmbed(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const path = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && path[0])
    return youtube(path[0], false, url.searchParams.get("t"));
  if (host === "youtube.com" || host === "music.youtube.com") {
    const t = url.searchParams.get("t");
    if (url.searchParams.get("v"))
      return youtube(url.searchParams.get("v"), false, t);
    if (["shorts", "live", "embed"].includes(path[0]) && path[1])
      return youtube(path[1], path[0] === "shorts", t);
  }
  if (host === "instagram.com") {
    const i = path.findIndex((p) => ["p", "reel", "reels", "tv"].includes(p));
    if (i >= 0 && path[i + 1])
      return {
        src: `https://www.instagram.com/p/${path[i + 1]}/embed`,
        vertical: true,
      };
  }
  if (host === "vimeo.com" && /^\d+$/.test(path[0] ?? ""))
    return {
      src: `https://player.vimeo.com/video/${path[0]}`,
      vertical: false,
    };
  if (host === "tiktok.com") {
    const i = path.indexOf("video");
    if (i >= 0 && /^\d+$/.test(path[i + 1] ?? ""))
      return {
        src: `https://www.tiktok.com/embed/v2/${path[i + 1]}`,
        vertical: true,
      };
  }
  return null;
}

// youtube-nocookie: geen tracking-cookies tot je op afspelen tikt.
function youtube(id, vertical, t) {
  if (!/^[\w-]{6,}$/.test(id)) return null;
  const start = parseInt(t ?? "", 10);
  const query = start > 0 ? `?start=${start}` : "";
  return {
    src: `https://www.youtube-nocookie.com/embed/${id}${query}`,
    vertical,
  };
}
