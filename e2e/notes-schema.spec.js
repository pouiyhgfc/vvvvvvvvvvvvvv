import { expect, test } from "@playwright/test";
import { demoBackup } from "./fixtures/demo.js";
import { importBackup, openTab } from "./helpers.js";

// Een notitie met een bloktype dat deze versie niet kent (bv. gemaakt in een
// nieuwere versie) opent gewoon; de tekst blijft staan.
test("onbekend bloktype laat de editor niet vastlopen", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const backup = demoBackup();
  backup.logEntries.push({
    id: "toekomst",
    notebookId: "logboek",
    date: "2026-10-27",
    title: "Uit de toekomst",
    body: "Belangrijk",
    tags: [],
    docSchemaVersion: 9,
    doc: [
      {
        id: "x1",
        type: "toekomstblok",
        props: {},
        content: [{ type: "text", text: "Belangrijk", styles: {} }],
        children: [],
      },
    ],
    createdAt: "2026-10-27T08:00:00.000Z",
    updatedAt: "2026-10-27T08:00:00.000Z",
  });
  await importBackup(page, backup);
  await openTab(page, "Notities");
  await page.getByText("Uit de toekomst", { exact: true }).click();
  await expect(page.locator(".ProseMirror")).toContainText("Belangrijk");
  expect(errors).toEqual([]);
});
