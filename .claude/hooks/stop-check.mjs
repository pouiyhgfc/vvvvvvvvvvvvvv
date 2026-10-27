// Stop-hook: draait lint altijd, en de build alleen als er bronbestanden
// gewijzigd zijn (een build duurt ~10 s; bij een vraag-en-antwoord is dat zonde).
// Exit 2 = Claude mag nog niet stoppen en krijgt de fout (stderr) terug.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  // geen invoer → gewoon checken
}
// Voorkomt een eindeloze lus als Claude al door deze hook is doorgegaan.
if (input.stop_hook_active) process.exit(0);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: true });
  return { ok: r.status === 0, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function fail(label, output) {
  // Alleen de staart: genoeg om de fout te zien, zonder de context te vullen.
  const tail = output.trim().split("\n").slice(-40).join("\n");
  process.stderr.write(`${label} faalt — los dit eerst op:\n${tail}\n`);
  process.exit(2);
}

const lint = run("npm", ["run", "lint", "--silent"]);
if (!lint.ok) fail("npm run lint", lint.output);

const changed = run("git", [
  "status",
  "--porcelain",
  "--",
  "src",
  "index.html",
  "vite.config.js",
  "package.json",
  "scripts",
]);
if (changed.ok && changed.output.trim()) {
  const build = run("npm", ["run", "build", "--silent"]);
  if (!build.ok) fail("npm run build", build.output);
}
