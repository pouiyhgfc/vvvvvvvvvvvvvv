import { expect, test } from "@playwright/test";
import { demoBackup } from "./fixtures/demo.js";
import { importBackup, openTab } from "./helpers.js";

const t = (text, styles = {}) => ({ type: "text", text, styles });

// Zoeken kijkt in de platte tekst van een notitie: ook als een woord half vet
// is, en ook in tabelcellen.
test("zoeken vindt opgemaakte tekst en tabelcellen", async ({ page }) => {
  const backup = demoBackup();
  backup.logEntries.push({
    id: "zoek1",
    notebookId: "logboek",
    date: "2026-10-26",
    title: "Zoekproef",
    body: "**we**reld\n\n| Kolom |\n| --- |\n| Ballastbed |",
    tags: [],
    doc: [
      {
        id: "p1",
        type: "paragraph",
        props: {},
        content: [t("we", { bold: true }), t("reld")],
        children: [],
      },
      {
        id: "tb",
        type: "table",
        props: {},
        content: {
          type: "tableContent",
          columnWidths: [null],
          rows: [{ cells: [[t("Kolom")]] }, { cells: [[t("Ballastbed")]] }],
        },
        children: [],
      },
    ],
    createdAt: "2026-10-26T08:00:00.000Z",
    updatedAt: "2026-10-26T08:00:00.000Z",
  });
  await importBackup(page, backup);
  await openTab(page, "Notities");
  const search = page.getByPlaceholder("Zoeken in notities en tags");
  const hit = page.getByText("Zoekproef", { exact: true });

  await search.fill("wereld");
  await expect(hit).toBeVisible();
  await search.fill("ballastbed");
  await expect(hit).toBeVisible();
  await search.fill("bestaatniet");
  await expect(hit).toBeHidden();
});
