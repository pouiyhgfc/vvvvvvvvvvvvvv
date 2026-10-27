import { describe, expect, it } from "vitest";
import { GLYPHS } from "../ui/glyphs.js";
import {
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_ROUTINES,
  ICON_CATEGORIES,
  MOODS,
} from "./constants.js";
import { EMOJI_GLYPH, glyphForEmoji } from "./emojiGlyph.js";

describe("emoji → icoon", () => {
  it("elk icoon in de mapping heeft paden", () => {
    for (const name of Object.keys(EMOJI_GLYPH))
      expect(GLYPHS[name], name).toBeDefined();
  });

  it("elk emoji dat de app kan tonen krijgt een icoon of lettertegel", () => {
    const all = [
      ...ICON_CATEGORIES.flatMap((c) => c.emojis),
      ...Object.values(DEFAULT_ROUTINES).flatMap((p) => p.map((r) => r.icon)),
      ...DEFAULT_CAL_TEMPLATES.map((t) => t.icon),
      ...MOODS.map((m) => m.emoji),
    ];
    const missing = all.filter((e) => !glyphForEmoji(e));
    expect(missing).toEqual([]);
  });

  it("de kiezer toont elk icoon maar één keer", () => {
    const shown = ICON_CATEGORIES.flatMap((c) => c.emojis).map((e) =>
      JSON.stringify(glyphForEmoji(e)),
    );
    const dupes = shown.filter((g, i) => shown.indexOf(g) !== i);
    expect(dupes).toEqual([]);
  });

  it("negeert de variantselector", () => {
    expect(glyphForEmoji("🏋")).toEqual({ name: "barbell" });
    expect(glyphForEmoji("🏋️")).toEqual({ name: "barbell" });
  });

  it("maakt van een vlag een lettertegel met de taal", () => {
    expect(glyphForEmoji("🇸🇦")).toEqual({ letters: "ع" });
    expect(glyphForEmoji("🇨🇳")).toEqual({ letters: "中" });
    expect(glyphForEmoji("🇫🇷")).toEqual({ letters: "Fr" });
    expect(glyphForEmoji("🇳🇱")).toEqual({ letters: "Nl" });
  });

  it("geeft null voor een onbekend emoji", () => {
    expect(glyphForEmoji("🦖")).toBeNull();
  });
});
