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
3. Subí tu keystore en Codemagic (Teams > Code signing identities > Android keystores) con la referencia `tronx_keystore` e iniciá el workflow **Tronx APK (firmado)**. Al terminar, descargá el `.apk` desde Artifacts e instalalo en el teléfono (hay que permitir instalar apps de orígenes desconocidos).

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
- Hay un único workflow, **Tronx APK (firmado)**, que firma con tu keystore fijo (`tronx_keystore`). Con ese, cada versión actualiza la anterior y las notas se conservan.

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

**1.12.0**: menú más fluido y sin adornos de más. Se quitó la onda de "supernova" al abrirlo y el giro permanente del aro del avatar; el panel entra con un deslizamiento corto sin rebote y las opciones aparecen más rápido. Además se eliminó el workflow de prueba de Codemagic: queda solo **Tronx APK (firmado)**, que usa tu clave fija y se instala encima de la versión anterior.

**1.13.0**: en el menú, Perfil y Vinculación muestran la etiqueta "En desarrollo" y al tocarlos solo avisan (no abren su panel; el código sigue en la app para activarlos más adelante). Se agregó el apartado MAX, también "En desarrollo". Se corrigió que las opciones del menú podían salirse del panel en pantallas angostas.

**1.14.0**: volver del editor a la lista es más fluido en el celular. La lista ya no se destruye al abrir una nota (se oculta conservando su maquetación) y sus stickers quedan en pausa mientras escribís. En el banco de pruebas (150 notas, CPU x4) el peor cuadro al volver bajó de ~170–280 ms a ~100–115 ms y los fps de 41–44 a 48–50.

**1.15.0**: menú rediseñado. Constelaciones pasa a ser una tarjeta grande con su propio color, las demás opciones son filas limpias con íconos de colores, hay separadores por sección, el encabezado muestra tus notas y constelaciones en una etiqueta y los fondos son más ricos (aurora violeta, rosa y cian). Abrir Constelaciones desde el menú ya no congela tanto: el mapa aparece primero y se arma en el cuadro siguiente (peor cuadro de ~250 ms a ~117 ms en el banco de pruebas con la CPU frenada), y con el mapa abierto la app de atrás no se maqueta ni se pinta. Personalización, Ajustes y Copia de seguridad ya abrían sin trabarse y siguen igual.

**1.16.0**: el tema claro pasa a llamarse **Blanco** y el oscuro **Universo** (Personalización > Tema). El tema Blanco se rediseñó: fondos blancos y grises muy claros en lugar de lavanda, tarjetas blancas con borde fino y sombra suave, texto más nítido y resplandores de los fondos de nota (Nebulosa, Aurora, Galaxia y Estrellas) a la mitad de intensidad. Universo no cambia. Tu elección de tema se conserva.

**1.17.0**: encabezado del menú y botón del menú rediseñados, con un estilo más sobrio y profesional. El botón de arriba a la izquierda es ahora un cuadrado redondeado con tres rayas limpias (sin el puntito en el ícono; solo queda el aviso de copia pendiente en la esquina) y se resalta mientras el menú está abierto. El encabezado "Explorador" muestra el avatar con un aro fino, un rango, el nombre y un panel con tres contadores (notas, constelaciones y vínculos). La tarjeta de Constelaciones es más contenida, con una constelación dibujada a un costado, y el fondo del menú es más calmo. Funciona en los temas Blanco y Universo.

**1.18.0**: nuevo sticker **Planeta Tierra** (océano, continentes, nubes, casquetes polares y atmósfera) que gira muy lento sobre su eje, con las nubes un poco más rápidas que el suelo. Es ahora el avatar por defecto del menú (si ya habías elegido otro avatar, se respeta) y aparece también en el selector de stickers. Las estrellas del fondo del menú ahora tienen dos capas que se desplazan despacio en direcciones distintas y titilan suavemente (solo mientras el menú está abierto y respetando "reducir animaciones").

**1.19.0**: los stickers pasan a llamarse **Detalles**. La primera fila (Tierra, Galaxia, Estrella, Planeta con anillos) se rediseñó con animaciones propias: la galaxia tiene brazos, barra central y núcleo que giran por separado; la estrella late, emite ondas y tiene destellos que giran en sentidos opuestos; el planeta tiene bandas de nubes que se desplazan, una tormenta y un anillo que centellea. **Mantené pulsado** un detalle en el selector para ver su ficha (tipo, descripción, qué hace su animación y un dato curioso) con el botón "Usar este detalle". Nueva sección **Novedades** en el menú (Aplicación) con el historial de cambios y un punto de aviso cuando hay una versión nueva sin ver. Tus datos y ajustes se conservan sin migración.

**1.20.0**: la **Tierra** se redibujó con un mapa real simplificado (América, África, Europa, Asia, Australia, desiertos, selvas, hielo polar y nubes) que gira lento; es idéntica en el menú y en Detalles. "Planeta Tierra" pasa a llamarse **Tierra** y "Planeta con anillos" pasa a llamarse **Saturno**. La **Galaxia** se rediseñó con brazos espirales logarítmicos, bandas de polvo oscuro, estrellas de colores según la distancia al núcleo, zonas rosadas de formación estelar y núcleo cálido. Sin migración de datos.

**1.21.0**: segunda fila de Detalles rediseñada con animaciones propias: **Nebulosa** (nubes que derivan, pilares de polvo que se mecen y estrellas jóvenes que titilan), **Luna** (antes "Luna cósmica": mares y cráteres, y cambia de fase lentamente), **Agujero negro** (disco con destellos que giran en sentidos opuestos, anillo de fotones, partícula en órbita y materia que cae) y **Cometa** (cola azul de gas y cola dorada de polvo, con partículas que salen disparadas). Las fichas de mantener pulsado se actualizaron. El selector pausa las animaciones que no están a la vista y todas mientras se ve una ficha. Sin migración de datos.
El menú ahora está ordenado en tres secciones (Tu espacio / Explorar / Aplicación) y cada opción muestra información real: cuántas constelaciones y vínculos tenés, el estado del sonido y cuándo fue tu última copia (con un punto de aviso si hace más de 7 días). **Vinculación** es ahora un panel propio para conectar dos notas y quitar vínculos (con «Deshacer»), que se ven unidos en Constelaciones.
Sonidos de interfaz sintetizados (`uisound.js`, sin archivos de audio): clic corto, elegir una opción, abrir/cerrar el menú, confirmar y quitar. Se activan o silencian en Ajustes → «Clics de la interfaz» y usan el volumen elegido.
