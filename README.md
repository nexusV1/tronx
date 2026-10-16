# Tronx

App de notas para Android. Funciona sin internet y sin cuenta: las notas se guardan en el teléfono.

Está hecha con HTML, CSS y JavaScript (carpeta `www/`) y se empaqueta como APK con [Capacitor](https://capacitorjs.com). La carpeta `android/` no se sube a GitHub: Codemagic la genera en cada build.

## Qué hace (versión 1.3)

- Pantalla de inicio con un universo animado (galaxia, estrellas, nebulosas y un agujero negro ocasional) y el botón «Iniciar universo». Aparece siempre al abrir la app. Si el teléfono va justo, baja sola la calidad; con «reducir animaciones» activado se muestra estática.
- Cada nota tiene un campo de título y otro de contenido, separados. Si dejás el título vacío, la nota se muestra por su texto.

- Notas de texto y listas con casillas (Enter agrega un elemento, las casillas se tachan).
- Colores por nota (8 colores) y etiquetas, con filtro por etiqueta arriba de la lista.
- Fijar notas, archivarlas y papelera con 30 días para recuperarlas (con Deshacer).
- Buscar por título, texto, elementos de lista y etiquetas.
- Ordenar (recientes, nuevas, título, color) y ver como lista o cuadrícula.
- Duplicar, compartir y copiar el texto de una nota.
- Ajustes: tema claro/oscuro/automático, 5 colores para la app, letra de las notas (Sans, Serif, Mono) y tamaño.
- Copia de seguridad: exportar e importar un archivo `.json`.
- El botón Atrás de Android cierra la nota, el panel o los ajustes antes de salir.
- Las notas de la versión 1.0 se migran solas.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Tronx 1.2"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tronx.git
git push -u origin main
```

## Compilar el APK en Codemagic

1. En Codemagic, agregá la aplicación y elegí el repositorio de GitHub.
2. Elegí **codemagic.yaml** como configuración (no el editor visual).
3. Iniciá el workflow **Tronx APK (prueba)**. Al terminar, descargá el `.apk` desde Artifacts e instalalo en el teléfono (hay que permitir instalar apps de orígenes desconocidos).

Para un APK firmado, subí tu keystore en Codemagic (Teams > Code signing identities > Android keystores) con la referencia `tronx_keystore` y usá el workflow **Tronx APK (firmado)**.

El número de versión interno (`versionCode`) sale del número de build de Codemagic. El nombre de versión sale de `version` en `package.json`.

## Probar en la computadora

Abrí `www/index.html` en el navegador. Para ver las fuentes, antes corré `npm install` y `npm run build:web`. En el navegador no existen el menú de compartir ni la carpeta de caché del teléfono: exportar descarga el archivo y compartir copia el texto.

## Compilar en tu computadora (opcional)

Requisitos: Node 20 o superior, JDK 21 y Android Studio con el SDK de Android.

```bash
npm install
npm run build:web
npx cap add android
node scripts/patch-android.mjs
npx capacitor-assets generate --android
npx cap sync android
cd android && ./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/`.

## Copia de seguridad

Las notas viven solo en el teléfono. Si desinstalás la app o borrás sus datos, se pierden. En Ajustes > Copia de seguridad, **Exportar copia** abre el menú de compartir de Android para guardar el archivo (Drive, WhatsApp, correo, archivos). **Importar copia** suma las notas de un archivo; si una nota ya existe, queda la más reciente.

## Cambiar el ícono

El ícono actual se generó con un script de dibujo; para cambiarlo, reemplazá los archivos de `resources/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, `splash-dark.png`) y volvé a compilar.

## Estructura

```
www/index.html          la app completa
www/universe.js         fondo animado y pantalla de inicio
www/universe.css        estilos de la pantalla de inicio
resources/              ícono y pantalla de inicio
scripts/copy-fonts.mjs  copia las fuentes locales
scripts/patch-android.mjs  versión y firma
capacitor.config.json   nombre y paquete (com.tronx.notas)
codemagic.yaml          workflows de Codemagic
```

## Cambios

**1.3.0**: pantalla de inicio recompuesta (título pequeño y morado arriba a la izquierda, descripción discreta, botón morado nuevo con icono) e ícono nuevo de la app (hoja con órbita y núcleo luminoso), con capas adaptativas de Android y pantalla de arranque a juego. El fondo espacial no cambió.

**1.2.0**: pantalla de inicio inmersiva con universo animado y agujero negro, botón «Iniciar universo» y campos separados de título y contenido. Las notas guardadas se conservan.

**1.1.0**: colores, etiquetas, listas con casillas, archivo, papelera, ajustes, copia de seguridad, vista en cuadrícula y orden. Corrige un error de la 1.0 por el que la pantalla de bienvenida tapaba el editor.

**1.0.0**: primera versión.
