// Ajusta android/app/build.gradle después de `cap add android`:
//  - versionCode creciente (ver abajo) y versionName con la versión de package.json
//  - firma de release si Codemagic entrega un keystore (CM_KEYSTORE_PATH y relacionadas)
import { readFileSync, writeFileSync } from "node:fs";

const file = "android/app/build.gradle";
let gradle = readFileSync(file, "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// versionCode: siempre crece. Se calcula con los minutos desde 1970 (hoy ~29.7 millones; el máximo de Android es 2.100 millones),
// así una versión nueva siempre es mayor que la anterior aunque el contador de builds de Codemagic se reinicie.
// Si necesitás fijarlo a mano, definí la variable VERSION_CODE en Codemagic.
const fromEnv = parseInt(process.env.VERSION_CODE || "", 10);
const code = fromEnv > 0 ? fromEnv : Math.floor(Date.now() / 60000);

function must(re, replacement, label) {
  if (!re.test(gradle)) {
    console.error(`No se encontró "${label}" en ${file}. Revisá el script scripts/patch-android.mjs.`);
    process.exit(1);
  }
  gradle = gradle.replace(re, replacement);
}

must(/versionCode\s+\d+/, `versionCode ${code}`, "versionCode");
must(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`, "versionName");

if (process.env.CM_KEYSTORE_PATH) {
  const signing = `
    signingConfigs {
        release {
            storeFile file(System.getenv("CM_KEYSTORE_PATH"))
            storePassword System.getenv("CM_KEYSTORE_PASSWORD")
            keyAlias System.getenv("CM_KEY_ALIAS")
            keyPassword System.getenv("CM_KEY_PASSWORD")
        }
    }
`;
  must(/\n\s*buildTypes\s*\{/, `${signing}\n    buildTypes {`, "buildTypes");
  must(/(buildTypes\s*\{\s*release\s*\{)/, "$1\n            signingConfig signingConfigs.release", "buildTypes.release");
  console.log("Firma de release configurada.");
}

writeFileSync(file, gradle);
console.log(`build.gradle actualizado: versionCode ${code}, versionName ${pkg.version}`);
