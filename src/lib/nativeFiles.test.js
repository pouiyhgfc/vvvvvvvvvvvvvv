import { beforeEach, describe, expect, test, vi } from "vitest";

const writeFile = vi.fn();
const share = vi.fn();
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: (o) => writeFile(o) },
  Directory: { Documents: "DOCUMENTS", Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
}));
vi.mock("@capacitor/share", () => ({ Share: { share: (o) => share(o) } }));

const { saveText } = await import("./nativeFiles.js");

describe("saveText (Android-app)", () => {
  beforeEach(() => {
    writeFile.mockReset();
    share.mockReset();
  });

  test("slaat op in Documenten/Routine, zonder deel-menu", async () => {
    writeFile.mockResolvedValue({ uri: "file://x" });
    await saveText("backup.json", "{}");
    expect(writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "Routine/backup.json",
        directory: "DOCUMENTS",
        recursive: true,
      }),
    );
    expect(share).not.toHaveBeenCalled();
  });

  test("valt terug op delen als opslaan niet mag", async () => {
    writeFile
      .mockRejectedValueOnce(new Error("geen toegang"))
      .mockResolvedValueOnce({ uri: "file://cache/backup.json" });
    await saveText("backup.json", "{}");
    expect(share).toHaveBeenCalledWith({
      title: "backup.json",
      files: ["file://cache/backup.json"],
    });
  });
});
