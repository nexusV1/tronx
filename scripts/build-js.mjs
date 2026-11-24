// Arma www/js/app.js uniendo, en orden, los archivos de src/js/ (01-..., 02-..., etc.).
// El código de la app vive todo dentro de una sola función, así que se escribe por temas en
// varios archivos y este script los une dentro de esa función. El resultado no se sube a GitHub.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = "src/js";
const out = "www/js/app.js";
const parts = readdirSync(dir).filter((f) => /^\d+-.+\.js$/.test(f)).sort();
if (!parts.length) {
  console.error("No hay archivos en src/js/.");
  process.exit(1);
}

let code = "// Archivo generado por scripts/build-js.mjs desde src/js/. No lo edites: edita src/js/.\n";
code += '(function () {\n  "use strict";\n';
for (const f of parts) code += readFileSync(join(dir, f), "utf8");
code += "})();\n";

mkdirSync("www/js", { recursive: true });
writeFileSync(out, code);
console.log(`app.js armado con ${parts.length} archivos.`);
