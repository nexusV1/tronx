// Copia las fuentes desde node_modules a www/fonts para que la app funcione sin internet.
// Si falta alguna, avisa y sigue: la app usa las fuentes del sistema.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const out = "www/fonts";
mkdirSync(out, { recursive: true });

const wanted = [
  ["bricolage-grotesque", [700, 800]],
  ["ibm-plex-sans", [400, 500, 600]],
  ["ibm-plex-mono", [400, 500]],
];

let missing = 0;
for (const [family, weights] of wanted) {
  for (const w of weights) {
    const file = `${family}-latin-${w}-normal.woff2`;
    const from = join("node_modules", "@fontsource", family, "files", file);
    if (existsSync(from)) {
      copyFileSync(from, join(out, file));
    } else {
      missing += 1;
      console.warn(`Falta la fuente ${file}; se usará una fuente del sistema.`);
    }
  }
}
console.log(missing ? `Fuentes copiadas con ${missing} faltantes.` : "Fuentes copiadas.");
