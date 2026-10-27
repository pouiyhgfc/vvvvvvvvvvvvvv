import { GLYPHS } from "./glyphs.js";

// Eén lijnicoon uit src/ui/glyphs.js (kleur = currentColor). Met `letters`
// in plaats van `name` wordt het een lettertegel, zoals voor talen (ع, Fr).
export default function Icon({ name, letters, size = 24, style }) {
  const glyph = GLYPHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      aria-hidden="true"
      style={{ flexShrink: 0, ...style }}
    >
      {letters ? (
        <LetterTile letters={letters} />
      ) : (
        <>
          {glyph?.d && <path d={glyph.d} fill="currentColor" />}
          {glyph?.s && <path d={glyph.s} {...STROKE} />}
        </>
      )}
    </svg>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 16,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ARABIC = /[؀-ۿ]/;

function LetterTile({ letters }) {
  // Naskh-letters zijn kleiner en staan hoger dan Latijnse; dat corrigeren we.
  const arabic = ARABIC.test(letters);
  return (
    <>
      <rect x="28" y="28" width="200" height="200" rx="56" {...STROKE} />
      <text
        x="128"
        y="128"
        dy={arabic ? "0.15em" : "0.35em"}
        textAnchor="middle"
        fill="currentColor"
        fontSize={arabic ? 150 : letters.length > 1 ? 104 : 128}
        fontWeight="600"
        fontFamily={arabic ? "var(--ff-arabic)" : "var(--ff-head)"}
      >
        {letters}
      </text>
    </>
  );
}
