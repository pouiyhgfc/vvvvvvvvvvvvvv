import { useState } from "react";
import { emojiCodepoint } from "../lib/emojiCodepoint.js";

// Eén render-punt voor álle emoji/iconen in de app. Rendert een lokaal
// gebundelde Twemoji-SVG, zodat elk toestel identiek is (incl. vlaggen).
// Valt terug op het rauwe teken als de SVG ontbreekt.
export default function Emoji({ char, size = 16, style }) {
  const [failedChar, setFailedChar] = useState(null);
  if (!char) return null;

  if (failedChar === char) {
    return (
      <span
        style={{
          fontSize: size,
          lineHeight: 1,
          display: "inline-block",
          ...style,
        }}
      >
        {char}
      </span>
    );
  }

  return (
    <img
      src={`/emoji/${emojiCodepoint(char)}.svg`}
      alt={char}
      draggable={false}
      onError={() => setFailedChar(char)}
      style={{
        width: size,
        height: size,
        verticalAlign: "-0.125em",
        display: "inline-block",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
