import { expect, test, devices } from "@playwright/test";

// Editor op een telefoon: alles moet binnen het scherm en met een duim te
// raken zijn, en een "spookklik" na het openen van een menu doet niets.
test.use({ ...devices["Pixel 7"] });

const HANDLE =
  'button[aria-label="Blok-menu (tik) of verslepen (ingedrukt houden)"]';
const PLUS = 'button[aria-label="Nieuw blok invoegen"]';

async function newNote(page, lines) {
  await page.goto("/?action=new-note");
  await page.waitForSelector(".ProseMirror");
  await page.tap(".ProseMirror");
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i]);
    if (i < lines.length - 1) await page.keyboard.press("Enter");
  }
}

const blockTypes = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".ProseMirror .bn-block-content")].map((e) =>
      e.getAttribute("data-content-type"),
    ),
  );

test("de opmaakbalk past binnen het scherm", async ({ page }) => {
  await newNote(page, ["Een regel om op te maken"]);
  await page.keyboard.press("Shift+Home");
  const toolbar = page.locator(".bn-formatting-toolbar");
  await expect(toolbar).toBeVisible();
  const width = page.viewportSize().width;
  for (const box of await toolbar
    .locator("button")
    .evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().toJSON()))) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(width);
  }
  // Link maken is dus ook echt aan te tikken.
  await page.tap('.bn-formatting-toolbar button[aria-label="Maak link"]');
  await expect(page.getByPlaceholder("Bewerk URL")).toBeVisible();
});

test("handvat en plus zijn groot genoeg voor een duim", async ({ page }) => {
  await newNote(page, ["Regel"]);
  for (const sel of [HANDLE, PLUS]) {
    const box = await page.locator(sel).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(40);
  }
});

test("het plus-menu toont geen sneltoetsen of uitleg", async ({ page }) => {
  await newNote(page, ["Regel"]);
  await page.tap(PLUS);
  const menu = page.locator(".bn-suggestion-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText(/CTRL/i).filter({ visible: true })).toHaveCount(
    0,
  );
  await expect(menu.getByText("Gebruikt voor een hoofdkop")).toBeHidden();
});

test("een spookklik in het blokmenu doet niets, een echte tik wel", async ({
  page,
}) => {
  await newNote(page, ["Eerste", "Tweede"]);
  await page.tap(HANDLE);
  await expect(page.getByRole("heading", { name: "Blok" })).toBeVisible();

  // Klik zonder bijbehorende tik ín het paneel = de spookklik van de tik
  // die het menu opende.
  await page.evaluate(() =>
    document
      .querySelector('button[aria-label="Kop 1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })),
  );
  expect(await blockTypes(page)).toEqual(["paragraph", "paragraph"]);
  await expect(page.getByRole("heading", { name: "Blok" })).toBeVisible();

  await page.tap('button[aria-label="Kop 1"]');
  expect(await blockTypes(page)).toEqual(["paragraph", "heading"]);
});

test("een Arabische regel staat rechts, een Nederlandse links", async ({
  page,
}) => {
  await newNote(page, ["سبحان الله وبحمده", "Gewone tekst"]);
  const [ar, nl] = await page.evaluate(() =>
    [...document.querySelectorAll(".ProseMirror .bn-inline-content")].map(
      (e) => {
        const range = document.createRange();
        range.selectNodeContents(e);
        const text = range.getBoundingClientRect();
        const box = e.getBoundingClientRect();
        return { left: text.left - box.left, right: box.right - text.right };
      },
    ),
  );
  expect(ar.right).toBeLessThan(2);
  expect(ar.left).toBeGreaterThan(20);
  expect(nl.left).toBeLessThan(2);
});

test("de werkbalk boven het toetsenbord: lijsten, inspringen, vet", async ({
  page,
}) => {
  await newNote(page, ["een"]);
  const bar = page.getByRole("toolbar", { name: "Opmaak" });
  await expect(bar).toBeVisible();
  const tap = (label) => bar.getByRole("button", { name: label }).tap();

  await tap("Opsomming");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("twee");
  await tap("Inspringen");
  const nested = () =>
    page.evaluate(
      () =>
        document.querySelectorAll(
          ".ProseMirror .bn-block-group .bn-block-group .bn-block",
        ).length,
    );
  expect(await nested()).toBe(1);
  await tap("Uitspringen");
  expect(await nested()).toBe(0);
  expect(await blockTypes(page)).toEqual(["bulletListItem", "bulletListItem"]);

  // Nog eens tikken op hetzelfde lijsttype maakt er weer tekst van.
  await tap("Opsomming");
  expect(await blockTypes(page)).toEqual(["bulletListItem", "paragraph"]);

  await tap("Vet");
  await page.keyboard.type(" vet");
  await expect(page.locator(".ProseMirror strong")).toHaveText(" vet");

  await tap("Toetsenbord sluiten");
  await expect(bar).toBeHidden();
});

test("Enter op een lege ingesprongen regel gaat één niveau terug", async ({
  page,
}) => {
  await newNote(page, ["- een"]);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.type("sub");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter"); // lege subregel → terug naar niveau 0
  await page.keyboard.type("twee");
  expect(await blockTypes(page)).toEqual([
    "bulletListItem",
    "bulletListItem",
    "bulletListItem",
  ]);
  const depthOfTwee = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".ProseMirror .bn-block")].find(
      (b) => b.querySelector(".bn-inline-content")?.textContent === "twee",
    );
    let d = 0;
    for (let p = el.parentElement; p; p = p.parentElement)
      if (p.classList?.contains("bn-block-group")) d++;
    return d;
  });
  expect(depthOfTwee).toBe(1); // alleen de buitenste groep
  // Nog een Enter op een lege regel op niveau 0: uit de lijst (BlockNote).
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  expect((await blockTypes(page)).at(-1)).toBe("paragraph");
});

test("een uitklaplijst klapt zijn inhoud in en uit", async ({ page }) => {
  await newNote(page, [""]);
  await page.tap(PLUS);
  await page
    .locator(".bn-suggestion-menu-item", { hasText: "Uitklapbare lijst" })
    .tap();
  await page.keyboard.type("Boodschappen");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.type("melk");
  const melk = page.locator(".ProseMirror .bn-inline-content", {
    hasText: "melk",
  });
  const knop = page.locator(".bn-toggle-button").first();
  await expect(melk).toBeVisible();
  await knop.tap();
  await expect(knop).toHaveAttribute("aria-expanded", "false");
  await expect(melk).toBeHidden();
  await knop.tap();
  await expect(melk).toBeVisible();
});
