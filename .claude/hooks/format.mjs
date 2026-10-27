// PostToolUse-hook: formatteert het zojuist bewerkte bestand met Prettier.
// Faalt stil: een formatteerfout mag de sessie nooit blokkeren.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const file = input.tool_input?.file_path;
  if (file && /\.(jsx?|mjs|css|json|md)$/.test(file)) {
    spawnSync("npx", ["prettier", "--write", file], {
      stdio: "ignore",
      shell: true,
    });
  }
} catch {
  // geen geldige invoer → niets te doen
}
