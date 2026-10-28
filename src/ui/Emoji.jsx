import { glyphForEmoji } from "../lib/emojiGlyph.js";
import Icon from "./Icon.jsx";

// Eén render-punt voor álle emoji/iconen in de app. Een bekend emoji wordt
// een lijnicoon (zie lib/emojiGlyph.js); een onbekend teken (bv. uit oude
// data) toont het systeem zelf.
export default function Emoji({ char, size = 16, style }) {
  if (!char) return null;
  const glyph = glyphForEmoji(char);
  if (glyph)
    return (
      <Icon
        {...glyph}
        size={size}
        style={{ verticalAlign: "-0.125em", ...style }}
      />
    );
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
