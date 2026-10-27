// Een notitie met alle bloktypen die de app aanbiedt. Basis voor de
// editor-roundtrip-test: na elke BlockNote-upgrade moet een document dat de
// vorige versie opsloeg exact zo terugkomen.
const t = (text, styles = {}) => [{ type: "text", text, styles }];

export const RICH_DOC_INPUT = [
  { type: "heading", props: { level: 1 }, content: t("Kop 1") },
  { type: "heading", props: { level: 2 }, content: t("Kop 2") },
  { type: "heading", props: { level: 3 }, content: t("Kop 3") },
  {
    type: "paragraph",
    content: [
      { type: "text", text: "Vet", styles: { bold: true } },
      { type: "text", text: " en ", styles: {} },
      { type: "text", text: "cursief", styles: { italic: true } },
      { type: "text", text: ", ", styles: {} },
      { type: "text", text: "rood", styles: { textColor: "red" } },
      { type: "text", text: " met ", styles: {} },
      {
        type: "link",
        href: "https://example.com",
        content: [{ type: "text", text: "een link", styles: {} }],
      },
      { type: "text", text: " 🌙", styles: {} },
    ],
  },
  {
    type: "bulletListItem",
    content: t("Punt"),
    children: [{ type: "bulletListItem", content: t("Subpunt") }],
  },
  { type: "numberedListItem", content: t("Eerste") },
  { type: "numberedListItem", content: t("Tweede") },
  { type: "checkListItem", props: { checked: true }, content: t("Gedaan") },
  { type: "checkListItem", props: { checked: false }, content: t("Open") },
  { type: "quote", content: t("Een citaat") },
  {
    type: "codeBlock",
    props: { language: "javascript" },
    content: t("const x = 1;"),
  },
  { type: "divider" },
  {
    type: "table",
    content: {
      type: "tableContent",
      columnWidths: [160, 160],
      headerRows: 1,
      rows: [
        { cells: [t("Kolom A"), t("Kolom B")] },
        { cells: [t("1"), t("2")] },
      ],
    },
  },
  {
    type: "paragraph",
    props: { textAlignment: "center", backgroundColor: "yellow" },
    content: t("Gecentreerd en geel"),
  },
  { type: "paragraph", content: t("العربية في ملاحظة") },
];
