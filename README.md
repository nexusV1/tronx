# Tronx

App de notas para Android. Funciona sin internet y sin cuenta: las notas se guardan en el teléfono.

Está hecha con HTML, CSS y JavaScript (carpeta `www/`) y se empaqueta como APK con [Capacitor](https://capacitorjs.com). La carpeta `android/` no se sube a GitHub: Codemagic la genera en cada build.

## Qué hace (versión 1.8)

- **Constelaciones**: el selector «Notas | Constelaciones» de la barra lateral abre un mapa galáctico donde cada nota es una estrella (el tamaño y el brillo dependen del contenido y de lo reciente). Arrastrá para moverte, pellizcá para acercar y tocá una estrella para ver su título y un fragmento, con botones para abrirla, conectarla con otra, o sumarla a una constelación. Las notas con la misma etiqueta se unen con líneas tenues; las conexiones manuales se pueden quitar sin borrar las notas. Podés crear constelaciones con nombre, buscar una nota y ubicarla en el mapa. Todo usa solo tus notas reales, se guarda en el teléfono (también en la copia de seguridad) y la vista de tarjetas no cambia.
- **Fondos para las notas**: 12 fondos (Nebulosa, Aurora, Galaxia, Estrellas, Medianoche, Atardecer, Océano, Bosque, Rosa cuarzo, Papel, Cuadrícula y Puntos), cada uno en versión clara y oscura. Se elige uno general en Ajustes y cada nota puede tener el suyo en Personalizar. El fondo se ve en el editor y en las tarjetas. Nebulosa, Aurora, Galaxia y los fondos con estrellas se mueven muy despacio; en Ajustes se pueden dejar quietos (también se detienen con «reducir animaciones»).
- **Plantillas**: en una nota vacía aparecen Diario, Reunión, Idea, Historia, Pendientes, Compras y Valija.
- **Barra de formato** en las notas de texto: viñeta, casilla, fecha y hora. Enter continúa la viñeta, la casilla o la numeración, y Enter en una línea vacía sale de la lista.
- Listas: barra de progreso (también en la tarjeta), botones para subir y bajar elementos y «Marcar todo».
- «Guardar como .txt» en Personalizar.
- Aviso discreto para hacer una copia de seguridad si pasaron 7 días (se puede cerrar).

- Notas en cuadrícula de dos columnas, con tarjetas redondeadas en tema espacial (oscuro y violeta por defecto; el claro y los demás colores siguen en Ajustes).
- Cada nota puede tener un emoji o uno de los 12 stickers de Tronx (galaxia, estrella, planeta, nebulosa, luna, agujero negro, cometa, cohete, platillo, constelación, eclipse y cristal). El icono se ve en la tarjeta y en el editor, y se puede cambiar o quitar.
- Botón **Guardar** en el editor: guarda al instante y avisa. Además todo se sigue guardando solo.
- Sonido del agujero negro de la pantalla de inicio, generado en el momento (no hay archivos de audio). Se silencia con el botón de la esquina de esa pantalla o en Ajustes > Sonido.

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
www/stickers.js         los stickers (dibujos SVG)
www/sound.js            el sonido del agujero negro
www/universe.js         fondo animado y pantalla de inicio
www/universe.css        estilos de la pantalla de inicio
www/constellations.js   el mapa de Constelaciones
www/constellations.css  estilos del mapa
resources/              ícono y pantalla de inicio
scripts/copy-fonts.mjs  copia las fuentes locales
scripts/patch-android.mjs  versión y firma
capacitor.config.json   nombre y paquete (com.tronx.notas)
codemagic.yaml          workflows de Codemagic
```

## Actualizar la app sin desinstalarla

Android solo instala una versión nueva encima de la vieja si las dos están firmadas con la **misma clave** y el `versionCode` es mayor. En este proyecto:

- El identificador de la app es `com.tronx.notas` (en `capacitor.config.json`). No lo cambies.
- El `versionCode` lo calcula `scripts/patch-android.mjs` en cada build y siempre crece. El `versionName` sale de `version` en `package.json`.
- El workflow **Tronx APK (prueba)** firma con una clave de depuración que Codemagic crea de nuevo en cada build. Esos APK **no** se pueden instalar uno encima de otro.
- El workflow **Tronx APK (firmado)** firma con tu keystore fijo (`tronx_keystore`). Con ese, cada versión actualiza la anterior y las notas se conservan.

Pasos, una sola vez:
1. En Ajustes > Copia de seguridad, exportá una copia de tus notas (la primera vez hay que desinstalar la versión de prueba, y al desinstalar se borran los datos).
2. En Codemagic: Teams > Code signing identities > Android keystores. Creá o subí un keystore con la referencia `tronx_keystore` y guardá aparte el archivo y sus contraseñas. No los subas a GitHub.
3. Desinstalá Tronx del teléfono, compilá con **Tronx APK (firmado)** e instalá ese APK. Importá la copia de seguridad.
4. De ahí en adelante, compilá siempre con el workflow firmado: se instala encima sin perder nada.

## Cambios

**1.8.0**: nueva función Constelaciones (mapa galáctico interactivo de las notas, con conexiones manuales, constelaciones con nombre, búsqueda con ubicación visual, pantalla de inicio vacía y guardado local incluido en la copia de seguridad). Se pausa cuando no se ve y respeta «reducir animaciones».

**1.7.2**: tipografía de la pantalla de bienvenida rediseñada: título «Tronx» más pequeño y equilibrado con degradado violeta letra por letra y una línea de luz debajo, descripción más ligera (peso regular, blanco lavanda suave, interlineado amplio y ancho controlado) y un resplandor sutil detrás del título. Los tamaños se adaptan de 320 px de ancho a tabletas y a pantalla horizontal. Los textos, el fondo galáctico y la animación del agujero negro no cambian.

**1.7.1**: botón «Iniciar universo» rediseñado: píldora de cristal con un anillo de luz que gira por el borde, un planeta con órbita y una flecha que se mueve. Con «reducir animaciones» queda quieto.

**1.7.0**: fondos para las notas (12, con versión clara y oscura, general o por nota), plantillas, barra de formato con viñetas que continúan al apretar Enter, progreso y reordenado en las listas, «Guardar como .txt» y aviso de copia de seguridad. Se corrigió un defecto del tema claro: el fondo de la lista se veía en cuadrados. Las notas existentes se conservan (ganan un campo `bg`; sin él usan el fondo de Ajustes, Nebulosa por defecto).

**1.5.0**: cuadrícula de dos columnas, tema espacial para las notas, emojis y stickers por nota, botón Guardar, sonido del agujero negro y `versionCode` creciente. Las notas y ajustes existentes se conservan (las notas ganan un campo `icon`; el tema pasa al aspecto Tronx solo si no habías elegido otro).

**1.4.0**: el agujero negro absorbe las letras del título y de la descripción una por una (se deforman, giran en espiral y desaparecen) y después se reconstruyen con pequeñas partículas de luz. Textos un poco más grandes y de color translúcido. Pantalla de arranque nativa con el ícono mucho más pequeño y sin recuadro. Con «reducir animaciones» activado no se separa el texto ni hay agujero negro.

**1.3.0**: pantalla de inicio recompuesta (título pequeño y morado arriba a la izquierda, descripción discreta, botón morado nuevo con icono) e ícono nuevo de la app (hoja con órbita y núcleo luminoso), con capas adaptativas de Android y pantalla de arranque a juego. El fondo espacial no cambió.

**1.2.0**: pantalla de inicio inmersiva con universo animado y agujero negro, botón «Iniciar universo» y campos separados de título y contenido. Las notas guardadas se conservan.

**1.1.0**: colores, etiquetas, listas con casillas, archivo, papelera, ajustes, copia de seguridad, vista en cuadrícula y orden. Corrige un error de la 1.0 por el que la pantalla de bienvenida tapaba el editor.

**1.0.0**: primera versión.

**1.6.0**: el sonido del agujero negro se rehízo para parlantes de celular (mucho más fuerte, con limitador para que no distorsione feo), con volumen Normal / Alto (por defecto) / Muy alto y botón «Probar sonido» en Ajustes. Se quitó el botón del parlante de la pantalla de inicio (el sonido se silencia desde Ajustes). Los 12 stickers se rediseñaron con más detalle y ahora tienen animaciones (giro, pulso, parpadeo, llama, haz de luz, etc.); en las tarjetas solo se animan mientras se ven y se detienen si el teléfono tiene activada la opción de reducir animaciones.

**1.8.1**: Constelaciones mucho más fluido. Al arrastrar el mapa solo se desplaza una imagen ya dibujada (antes se redibujaba todo en cada cuadro); el fondo es un solo bitmap; los efectos de brillo corren a ritmo bajo en reposo y se apagan mientras te movés; se quitó el desenfoque (`backdrop-filter`) de los botones sobre el mapa; la lista de notas y sus stickers animados quedan pausados y ocultos mientras se ve el mapa; y si el teléfono sigue yendo justo, el mapa baja solo la calidad (resolución y efectos). Se ve igual y no cambia ningún dato.

**1.9.0**: nuevo botón de menú arriba a la izquierda que se despliega con una onda de choque cósmica y opciones animadas: Perfil (nombre y avatar de sticker o emoji, con estadísticas de tu universo), Personalización (tema, color, letra, tamaño y fondos), Constelaciones, Vinculación (abre el mapa para conectar notas), Ajustes (sonido) y Copia de seguridad. Los ajustes de apariencia pasaron de Ajustes a Personalización; el botón de Ajustes de la cabecera ahora está dentro del menú. El perfil se guarda solo en el teléfono dentro de los ajustes y no cambia tus notas.

**1.10.0**: el menú ya no se traba. Se animan solo transformaciones y opacidad (sin recortes ni máscaras), el fondo del menú es estático, lo que hay debajo (stickers y fondos animados) se pausa mientras el menú está abierto y se evitó el trabajo que bloqueaba la apertura. En un banco de pruebas con 150 notas y la CPU frenada, el peor cuadro al abrir bajó de ~230 ms a ~70 ms y los cuadros lentos de 7–10 a 1.

**1.11.0**: más optimización y animaciones más fluidas. La lista reutiliza las tarjetas que no cambiaron (antes reconstruía todas en cada tecla), los stickers de las tarjetas se animan solo cuando están por entrar en pantalla, la lista oculta no se redibuja mientras escribís en el celular y la búsqueda no recalcula nada de más. Al pasar de la lista al editor hay una transición corta, y los botones y tarjetas se hunden un poco al tocarlos. Los clics suenan con más cuerpo (chasquido brillante, "pop" y golpecito) y varían un poco de tono en cada toque. Con 150 notas y la CPU frenada x4: escribir pasó de 15 a 60 fps, buscar de 17 a 58 fps (54 ms a 0,3 ms por tecla) y abrir una nota de 98 ms a 16 ms.

**1.11.1**: se quitaron los sonidos de clic de la interfaz (toques, menú y confirmaciones) y su ajuste. Queda solo el sonido del agujero negro, que se sigue pudiendo activar, silenciar y subir o bajar en Ajustes.
El menú ahora está ordenado en tres secciones (Tu espacio / Explorar / Aplicación) y cada opción muestra información real: cuántas constelaciones y vínculos tenés, el estado del sonido y cuándo fue tu última copia (con un punto de aviso si hace más de 7 días). **Vinculación** es ahora un panel propio para conectar dos notas y quitar vínculos (con «Deshacer»), que se ven unidos en Constelaciones.
Sonidos de interfaz sintetizados (`uisound.js`, sin archivos de audio): clic corto, elegir una opción, abrir/cerrar el menú, confirmar y quitar. Se activan o silencian en Ajustes → «Clics de la interfaz» y usan el volumen elegido.
