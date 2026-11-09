// Ajusta android/app/build.gradle después de `cap add android`:
//  - versionCode creciente (ver abajo) y versionName con la versión de package.json
//  - firma de release si Codemagic entrega un keystore (CM_KEYSTORE_PATH y relacionadas)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

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

// Permisos para los recordatorios (notificaciones locales). `cap add android` crea el manifiesto desde cero en cada build.
const manifest = "android/app/src/main/AndroidManifest.xml";
try {
  let xml = readFileSync(manifest, "utf8");
  const perms = [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.VIBRATE",
    "android.permission.CAMERA",
    "android.permission.USE_BIOMETRIC",
  ];
  const missing = perms.filter((p) => !xml.includes(`"${p}"`));
  if (missing.length) {
    const lines = missing.map((p) => `    <uses-permission android:name="${p}" />`).join("\n");
    if (!/<application[\s>]/.test(xml)) throw new Error("no se encontró <application>");
    const feat = xml.includes("android.hardware.camera") ? "" : `\n    <uses-feature android:name="android.hardware.camera" android:required="false" />`;
    xml = xml.replace(/(\s*)<application/, `\n${lines}${feat}\n$1<application`);
    writeFileSync(manifest, xml);
  }
  console.log("Permisos de notificaciones listos:", perms.join(", "));
} catch (e) {
  console.warn("No se pudieron agregar los permisos de notificaciones:", e.message);
}

// Ícono de las notificaciones: silueta blanca de una nota (Android lo pinta con el color de acento).
try {
  mkdirSync("android/app/src/main/res/drawable", { recursive: true });
  writeFileSync(
    "android/app/src/main/res/drawable/ic_stat_tronx.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:fillType="evenOdd"
        android:pathData="M6,2h8l6,6v12a2,2 0 0,1 -2,2H6a2,2 0 0,1 -2,-2V4a2,2 0 0,1 2,-2zM7.5,11h9v1.5h-9zM7.5,14.5h9V16h-9zM7.5,7.5h4V9h-4z"/>
</vector>
`
  );
  console.log("Ícono de notificación creado.");
} catch (e) {
  console.warn("No se pudo crear el ícono de notificación:", e.message);
}
