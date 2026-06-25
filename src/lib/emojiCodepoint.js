// Berekent de Twemoji-bestandsnaam (codepoints, '-'-gescheiden) voor een emoji.
// Volgt exact de twemoji-logica: strip de FE0F-variantselector behalve in
// ZWJ-sequences. Gedeeld door <Emoji> (browser) en het kopieerscript (Node),
// zodat ze gegarandeerd dezelfde bestandsnamen gebruiken.
const ZWJ = "‍";
const FE0F = /️/g;

function toCodePoint(str) {
  const r = [];
  let high = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (high) {
      r.push((0x10000 + ((high - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      high = 0;
    } else if (c >= 0xd800 && c <= 0xdbff) {
      high = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join("-");
}

export function emojiCodepoint(char) {
  return toCodePoint(char.indexOf(ZWJ) < 0 ? char.replace(FE0F, "") : char);
}
