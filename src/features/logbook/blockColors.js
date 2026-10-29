// BlockNote's eigen highlight-namen. De hexen komen 1-op-1 uit BlockNote's
// stylesheet (data-kleuren, geen thema-tokens) — er bestaan geen CSS-vars
// voor, dus de stippen tonen de letterlijke achtergrond die het blok krijgt.
export const BLOCK_COLORS = [
  { label: "Geen", value: "default", hex: null },
  { label: "Grijs", value: "gray", hex: "#ebeced" },
  { label: "Bruin", value: "brown", hex: "#e9e5e3" },
  { label: "Rood", value: "red", hex: "#fbe4e4" },
  { label: "Oranje", value: "orange", hex: "#f6e9d9" },
  { label: "Geel", value: "yellow", hex: "#fbf3db" },
  { label: "Groen", value: "green", hex: "#ddedea" },
  { label: "Blauw", value: "blue", hex: "#ddebf1" },
  { label: "Paars", value: "purple", hex: "#eae4f2" },
  { label: "Roze", value: "pink", hex: "#f4dfeb" },
];

// De pastels zijn altijd licht, dus de letter is vast donker (thema-
// onafhankelijk, hoort bij de data-kleur zelf).
export const BLOCK_COLOR_TEXT = "#403f3d";
