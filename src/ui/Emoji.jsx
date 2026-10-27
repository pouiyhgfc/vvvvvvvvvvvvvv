import { useState } from "react";
import { emojiCodepoint } from "../lib/emojiCodepoint.js";
import { glyphForEmoji } from "../lib/emojiGlyph.js";
import Icon from "./Icon.jsx";

// Eén render-punt voor álle emoji/iconen in de app. Een bekend emoji wordt
// een lijnicoon (zie lib/emojiGlyph.js). Een onbekend emoji toont de lokaal
// gebundelde Twemoji-SVG en valt terug op het rauwe teken als die ontbreekt.
export default function Emoji({ char, size = 16, style }) {
  const [failedChar, setFailedChar] = useState(null);
  if (!char) return null;

  const glyph = glyphForEmoji(char);
  if (glyph) {
    return (
      <Icon
        {...glyph}
        size={size}
        style={{ verticalAlign: "-0.125em", ...style }}
      />
    );
  }

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
