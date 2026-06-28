export const HEAT = ["#f1efe9", "#d4ede5", "#8ecfb8", "#4db38f", "#0e7a52"];

export function heatColor(pct) {
  if (pct === 0) return HEAT[0];
  if (pct < 25) return HEAT[1];
  if (pct < 50) return HEAT[2];
  if (pct < 75) return HEAT[3];
  return HEAT[4];
}
