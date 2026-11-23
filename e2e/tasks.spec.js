import { expect, test } from "@playwright/test";
import { loadDemo, openTab } from "./helpers.js";

// Taken: kaartje "Te doen" op Vandaag en de volledige lijst als subpagina.
// Demo-klok: dinsdag 27 oktober 2026.

const card = (page) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("button", { name: /Te doen/ }) });
const quickAdd = (page, text) =>
  page
    .getByPlaceholder("+ Taak voor vandaag")
    .fill(text)
    .then(() => page.keyboard.press("Enter"));
const openList = (page) =>
  page.getByRole("button", { name: /Te doen/ }).click();

async function newTask(page, title, options = {}) {
  await page.getByRole("button", { name: "Nieuwe taak" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox", { name: "Titel" }).fill(title);
  if (Object.keys(options).length) {
    await sheet.getByRole("button", { name: "Meer opties" }).click();
    if (options.lijst)
      await sheet
        .getByRole("combobox", { name: "Lijst" })
        .selectOption(options.lijst);
    if (options.datum) await sheet.getByLabel("Datum").fill(options.datum);
    if (options.tijd) await sheet.getByLabel("Tijd").fill(options.tijd);
    if (options.deadline)
      await sheet.getByLabel("Deadline").fill(options.deadline);
  }
  await sheet.getByRole("button", { name: /Toevoegen/ }).click();
  await expect(sheet).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await loadDemo(page);
});

test("snel toevoegen op Vandaag en afvinken haalt hem van het kaartje", async ({
  page,
}) => {
  await quickAdd(page, "Mail begeleider");
  await expect(card(page).getByText("Mail begeleider")).toBeVisible();
  await expect(page.getByPlaceholder("+ Taak voor vandaag")).toHaveValue("");
  await card(page)
    .getByRole("button", { name: "Afvinken: Mail begeleider" })
    .click();
  await expect(card(page).getByText("Mail begeleider")).toBeHidden();
});

test("lijst: toevoegen zonder datum, afvinken naar Gedaan en terugzetten", async ({
  page,
}) => {
  await openList(page);
  await expect(page.getByRole("heading", { name: "Taken" })).toBeVisible();

  await page.getByRole("button", { name: "Nieuwe taak" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("button", { name: /Toevoegen/ })).toBeDisabled();
  await page.keyboard.press("Escape");

  await newTask(page, "Fiets laten maken");
  await page
    .getByRole("button", { name: "Afvinken: Fiets laten maken" })
    .click();
  await page.getByRole("button", { name: "Gedaan (1)" }).click();
  await page
    .getByRole("button", { name: "Terugzetten: Fiets laten maken" })
    .click();
  await expect(page.getByRole("button", { name: /Gedaan/ })).toBeHidden();
  await expect(page.getByText("Fiets laten maken")).toBeVisible();
});

test("lange termijn met stappen toont het percentage en klapt open", async ({
  page,
}) => {
  await openList(page);
  await newTask(page, "Afstudeerstage", {
    lijst: "lang",
    deadline: "2027-01-15",
  });
  await page.getByRole("button", { name: /^Afstudeerstage/ }).click();
  const sheet = page.getByRole("dialog");
  for (const step of ["Onderwerp kiezen", "Literatuur zoeken"]) {
    await sheet.getByPlaceholder("+ Stap toevoegen").fill(step);
    await page.keyboard.press("Enter");
  }
  await sheet
    .getByRole("button", { name: "Afvinken: Onderwerp kiezen" })
    .click();
  await sheet.getByRole("button", { name: "Sluiten" }).click();

  await expect(page.getByText("50%")).toBeVisible();
  await expect(page.getByText(/nog 80 d/)).toBeVisible();
  const expand = page.getByRole("button", {
    name: "Stappen van Afstudeerstage",
  });
  await expect(page.getByText("Literatuur zoeken")).toBeHidden();
  await expand.click();
  await expect(page.getByText("Literatuur zoeken")).toBeVisible();
});

test("te laat → naar vandaag, en terug brengt je naar Vandaag", async ({
  page,
}) => {
  await openList(page);
  await newTask(page, "Boodschappen", { datum: "2026-10-25" });
  await expect(page.getByText("te laat")).toBeVisible();
  await page.getByRole("button", { name: "naar vandaag" }).click();
  await expect(page.getByText("te laat")).toBeHidden();

  await page.evaluate(() => history.back());
  await expect(card(page).getByText("Boodschappen")).toBeVisible();
});

test("een deadline binnenkort staat op het kaartje", async ({ page }) => {
  await openList(page);
  await newTask(page, "Verslag H2", { deadline: "2026-10-29" });
  await page.evaluate(() => history.back());
  await expect(
    card(page).getByText(/Deadline: Verslag H2 — over 2 dagen/),
  ).toBeVisible();
});

test.describe("in de planning", () => {
  test("gedaan blijft doorgestreept op de dag staan", async ({ page }) => {
    await quickAdd(page, "Mail begeleider");
    await card(page)
      .getByRole("button", { name: "Afvinken: Mail begeleider" })
      .click();
    await openTab(page, "Planning");
    const done = page.getByRole("button", {
      name: "Terugzetten: Mail begeleider",
    });
    await expect(done).toBeVisible();
  });

  test("met tijd een blok, zonder datum niet, deadline als label", async ({
    page,
  }) => {
    await openList(page);
    await newTask(page, "Literatuur zoeken", {
      datum: "2026-10-27",
      tijd: "14:00",
    });
    await newTask(page, "Ooit doen");
    await newTask(page, "Verslag H2", { deadline: "2026-10-29" });
    await openTab(page, "Planning");

    await expect(page.locator('[data-task="Literatuur zoeken"]')).toContainText(
      "14:00 – 14:30",
    );
    await expect(page.getByText("Ooit doen")).toBeHidden();
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(page.getByText("Deadline: Verslag H2")).toBeVisible();
    await expect(page.getByText("Literatuur zoeken")).toBeVisible();
  });
});
