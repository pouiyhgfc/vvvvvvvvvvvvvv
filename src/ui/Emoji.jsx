// Eén render-punt voor álle emoji/iconen in de app.
// Fase 2: rendert het rauwe unicode-teken.
// Fase 3: rendert een lokaal gebundelde Twemoji-SVG, zodat elk toestel identiek is.
// Door overal <Emoji> te gebruiken hoeft alleen dit bestand te wijzigen.
export default function Emoji({ char, size = 16, style }) {
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
