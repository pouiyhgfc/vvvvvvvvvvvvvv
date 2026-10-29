import { describe, expect, it } from "vitest";
import { videoEmbed } from "./videoEmbed.js";

const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

describe("videoEmbed", () => {
  it("herkent de gangbare YouTube-links", () => {
    expect(videoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      src: yt,
      vertical: false,
    });
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ?si=abc").src).toBe(yt);
    expect(videoEmbed("https://m.youtube.com/watch?v=dQw4w9WgXcQ").src).toBe(
      yt,
    );
    expect(videoEmbed("https://youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      src: yt,
      vertical: true,
    });
  });

  it("neemt een starttijd mee", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ?t=90").src).toBe(
      `${yt}?start=90`,
    );
  });

  it("herkent Instagram, Vimeo en TikTok", () => {
    expect(
      videoEmbed("https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=x"),
    ).toEqual({
      src: "https://www.instagram.com/p/C1a2B3c4D5e/embed",
      vertical: true,
    });
    expect(videoEmbed("https://vimeo.com/76979871").src).toBe(
      "https://player.vimeo.com/video/76979871",
    );
    expect(
      videoEmbed("https://www.tiktok.com/@iemand/video/7300000000000000000")
        .src,
    ).toBe("https://www.tiktok.com/embed/v2/7300000000000000000");
  });

  it("geeft null bij onbekende of kapotte links", () => {
    expect(videoEmbed("https://voorbeeld.nl/film")).toBeNull();
    expect(videoEmbed("geen link")).toBeNull();
    expect(videoEmbed("https://www.youtube.com/")).toBeNull();
  });
});
