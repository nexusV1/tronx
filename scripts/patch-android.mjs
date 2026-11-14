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

// Recibir texto desde otras apps ("Compartir" > Tronx), atajos del ícono y widget de inicio.
// MainActivity pasa a la web los textos compartidos y las acciones (nota, lista, dictar) por window.__tronxShared / window.__tronxActs,
// y expone TronxNative.setWidget(línea1, línea2) para que la web actualice el texto del widget.
try {
  let xml = readFileSync(manifest, "utf8");
  if (!xml.includes("android.intent.action.SEND")) {
    const filter = `
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>
        `;
    if (!/<\/activity>/.test(xml)) throw new Error("no se encontró </activity>");
    xml = xml.replace(/<\/activity>/, `${filter}</activity>`);
  }
  if (!xml.includes("android.app.shortcuts")) {
    xml = xml.replace(/<\/activity>/, `    <meta-data android:name="android.app.shortcuts" android:resource="@xml/tronx_shortcuts" />\n        </activity>`);
  }
  if (!xml.includes("TronxWidget")) {
    if (!/<\/application>/.test(xml)) throw new Error("no se encontró </application>");
    xml = xml.replace(
      /<\/application>/,
      `    <receiver android:name=".TronxWidget" android:exported="true" android:label="Tronx">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/tronx_widget_info" />
        </receiver>
    </application>`
    );
  }
  writeFileSync(manifest, xml);

  const javaDir = "android/app/src/main/java/com/tronx/notas";
  const resDir = "android/app/src/main/res";
  mkdirSync(javaDir, { recursive: true });
  for (const d of ["xml", "layout", "drawable", "values"]) mkdirSync(`${resDir}/${d}`, { recursive: true });

  writeFileSync(
    `${javaDir}/MainActivity.java`,
    `package com.tronx.notas;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    public static final String ACT_NOTE = "com.tronx.notas.NEW_NOTE";
    public static final String ACT_LIST = "com.tronx.notas.NEW_LIST";
    public static final String ACT_DICTATE = "com.tronx.notas.DICTATE";

    // Puente para que la web actualice el texto del widget.
    public static class TronxBridge {
        private final Context ctx;
        TronxBridge(Context c) { ctx = c.getApplicationContext(); }

        @JavascriptInterface
        public void setWidget(String line1, String line2) {
            SharedPreferences sp = ctx.getSharedPreferences("tronx_widget", Context.MODE_PRIVATE);
            sp.edit().putString("l1", line1 == null ? "" : line1).putString("l2", line2 == null ? "" : line2).apply();
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, TronxWidget.class));
            if (ids != null && ids.length > 0) TronxWidget.paint(ctx, mgr, ids);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            getBridge().getWebView().addJavascriptInterface(new TronxBridge(this), "TronxNative");
        } catch (Exception ignored) {
        }
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    // Pasa a la web el texto compartido o la acción pedida. Se reintenta unas veces porque en el arranque en frío la página todavía
    // puede estar cargando (la web ignora los repetidos por el id).
    private void handleIntent(Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        final String js;
        final long id = System.currentTimeMillis();
        if (Intent.ACTION_SEND.equals(action)) {
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
            setIntent(new Intent(Intent.ACTION_MAIN));
            if (text == null || text.trim().isEmpty()) return;
            js = "(function(){window.__tronxShared=window.__tronxShared||[];window.__tronxShared.push({id:" + id
                + ",t:" + JSONObject.quote(text) + ",s:" + JSONObject.quote(subject == null ? "" : subject)
                + "});window.dispatchEvent(new Event('tronxshare'));})();";
        } else if (ACT_NOTE.equals(action) || ACT_LIST.equals(action) || ACT_DICTATE.equals(action)) {
            String a = ACT_LIST.equals(action) ? "list" : (ACT_DICTATE.equals(action) ? "dictate" : "note");
            setIntent(new Intent(Intent.ACTION_MAIN));
            js = "(function(){window.__tronxActs=window.__tronxActs||[];window.__tronxActs.push({id:" + id + ",a:'" + a
                + "'});window.dispatchEvent(new Event('tronxact'));})();";
        } else {
            return;
        }
        final int[] delays = {600, 1800, 4000};
        for (final int d : delays) {
            getWindow().getDecorView().postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        getBridge().getWebView().evaluateJavascript(js, null);
                    } catch (Exception ignored) {
                    }
                }
            }, d);
        }
    }
}
`
  );

  writeFileSync(
    `${javaDir}/TronxWidget.java`,
    `package com.tronx.notas;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class TronxWidget extends AppWidgetProvider {
    private static PendingIntent open(Context c, int code, String action) {
        Intent i = new Intent(c, MainActivity.class);
        if (action != null) i.setAction(action);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void paint(Context c, AppWidgetManager mgr, int[] ids) {
        SharedPreferences sp = c.getSharedPreferences("tronx_widget", Context.MODE_PRIVATE);
        String l1 = sp.getString("l1", "");
        String l2 = sp.getString("l2", "");
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tronx);
            v.setTextViewText(R.id.w_l1, l1.isEmpty() ? "Tronx" : l1);
            v.setTextViewText(R.id.w_l2, l2);
            v.setOnClickPendingIntent(R.id.w_root, open(c, 10, null));
            v.setOnClickPendingIntent(R.id.w_note, open(c, 11, MainActivity.ACT_NOTE));
            v.setOnClickPendingIntent(R.id.w_list, open(c, 12, MainActivity.ACT_LIST));
            v.setOnClickPendingIntent(R.id.w_dict, open(c, 13, MainActivity.ACT_DICTATE));
            mgr.updateAppWidget(id, v);
        }
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager mgr, int[] ids) {
        paint(c, mgr, ids);
    }
}
`
  );

  writeFileSync(
    `${resDir}/layout/widget_tronx.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/w_root"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:padding="12dp"
    android:background="@drawable/widget_bg">
    <TextView android:id="@+id/w_l1" android:layout_width="match_parent" android:layout_height="wrap_content"
        android:textColor="#FFFFFF" android:textSize="16sp" android:textStyle="bold" android:maxLines="1" android:ellipsize="end" />
    <TextView android:id="@+id/w_l2" android:layout_width="match_parent" android:layout_height="wrap_content"
        android:layout_marginTop="2dp" android:textColor="#B8B3D9" android:textSize="13sp" android:maxLines="2" android:ellipsize="end" />
    <LinearLayout android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"
        android:gravity="bottom" android:orientation="horizontal">
        <TextView android:id="@+id/w_note" android:layout_width="0dp" android:layout_height="40dp" android:layout_weight="1"
            android:gravity="center" android:text="Nota" android:textColor="#FFFFFF" android:textSize="14sp" android:background="@drawable/widget_btn" />
        <TextView android:id="@+id/w_list" android:layout_width="0dp" android:layout_height="40dp" android:layout_weight="1"
            android:layout_marginStart="6dp" android:gravity="center" android:text="Lista" android:textColor="#FFFFFF" android:textSize="14sp" android:background="@drawable/widget_btn" />
        <TextView android:id="@+id/w_dict" android:layout_width="0dp" android:layout_height="40dp" android:layout_weight="1"
            android:layout_marginStart="6dp" android:gravity="center" android:text="Dictar" android:textColor="#FFFFFF" android:textSize="14sp" android:background="@drawable/widget_btn" />
    </LinearLayout>
</LinearLayout>
`
  );
  writeFileSync(
    `${resDir}/drawable/widget_bg.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#E6120F24" />
    <corners android:radius="20dp" />
</shape>
`
  );
  writeFileSync(
    `${resDir}/drawable/widget_btn.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FF4C3AA8" />
    <corners android:radius="14dp" />
</shape>
`
  );
  writeFileSync(
    `${resDir}/xml/tronx_widget_info.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp" android:minHeight="110dp"
    android:updatePeriodMillis="0"
    android:initialLayout="@layout/widget_tronx"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`
  );
  writeFileSync(
    `${resDir}/xml/tronx_shortcuts.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut android:shortcutId="tronx_note" android:enabled="true" android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/tronx_sc_note" android:shortcutLongLabel="@string/tronx_sc_note_long">
        <intent android:action="com.tronx.notas.NEW_NOTE" android:targetPackage="com.tronx.notas" android:targetClass="com.tronx.notas.MainActivity" />
    </shortcut>
    <shortcut android:shortcutId="tronx_list" android:enabled="true" android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/tronx_sc_list" android:shortcutLongLabel="@string/tronx_sc_list_long">
        <intent android:action="com.tronx.notas.NEW_LIST" android:targetPackage="com.tronx.notas" android:targetClass="com.tronx.notas.MainActivity" />
    </shortcut>
    <shortcut android:shortcutId="tronx_dictate" android:enabled="true" android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/tronx_sc_dictate" android:shortcutLongLabel="@string/tronx_sc_dictate_long">
        <intent android:action="com.tronx.notas.DICTATE" android:targetPackage="com.tronx.notas" android:targetClass="com.tronx.notas.MainActivity" />
    </shortcut>
</shortcuts>
`
  );
  writeFileSync(
    `${resDir}/values/tronx_strings.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="tronx_sc_note">Nueva nota</string>
    <string name="tronx_sc_note_long">Escribir una nota nueva</string>
    <string name="tronx_sc_list">Nueva lista</string>
    <string name="tronx_sc_list_long">Crear una lista de tareas</string>
    <string name="tronx_sc_dictate">Dictar</string>
    <string name="tronx_sc_dictate_long">Dictar una nota por voz</string>
</resources>
`
  );
  console.log("Recepción de texto compartido, atajos y widget listos.");
} catch (e) {
  console.warn("No se pudo preparar compartir, atajos o widget:", e.message);
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
