  /* ---------- eventos globales ---------- */
  document.addEventListener("visibilitychange", function () { if (document.hidden) persistNow(); });
  window.addEventListener("pagehide", persistNow);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && layers.length) { closeLayer(layers[layers.length - 1]); }
  });

  /* ---------- bienvenida ---------- */
  function welcome() {
    if (lsGet(WKEY) === "1" || notes.size) return;
    lsSet(WKEY, "1");
    var now = Date.now();
    [
      normalize({
        id: uid(), title: "Bienvenido a Tronx", pinned: true, color: "teal", tags: ["bienvenida"], createdAt: now, updatedAt: now,
        body: "Esta es tu primera nota. Podés editarla o mandarla a la papelera.\n\n• Tocá Personalizar para cambiar el color, elegir un fondo, poner etiquetas, archivar, duplicar o compartir.\n• En una nota vacía podés empezar con una plantilla (diario, reunión, compras…).\n• Filtrá por etiqueta con los botones de arriba de la lista.\n• Cambiá entre lista y cuadrícula, y el orden, con los controles de la lista.\n• En Ajustes elegís tema, color de la app, letra y tamaño.\n• Todo queda guardado en este teléfono y funciona sin internet. Hacé una copia de seguridad desde Ajustes."
      }),
      normalize({
        id: uid(), type: "list", title: "Ejemplo de lista", color: "yellow", tags: ["bienvenida"], createdAt: now - 1000, updatedAt: now - 1000,
        items: [
          { t: "Tocar la casilla para marcar un elemento", done: true },
          { t: "Apretar Enter para agregar otro", done: false },
          { t: "Borrar esta lista cuando ya no la necesites", done: false }
        ]
      })
    ].forEach(function (n) { notes.set(n.id, n); });
    persistNow();
  }

  /* ---------- arranque ---------- */
  if (window.TronxStickers) window.TronxStickers.mount();
  applyTheme();
  loadNotes();
  welcome();
  if (!hadFirstRun) saveSettings();
  if (window.TronxMap) window.TronxMap.init({
    notes: notes, openNote: openNote, createNote: createNote, toast: toast, iconSpan: iconSpan, when: when,
    pushLayer: pushLayer, closeLayer: closeLayer, hasLayer: hasLayer, registerLayer: registerLayer,
    lsGet: lsGet, lsSet: lsSet, uid: uid, shareFile: shareFile,
    colorRGB: function (k) { return colorOf(k).rgb || null; },
    getSettings: function () { return settings; },
    accent: function () { return ACCENTS[settings.accent].dark; }
  });
  renderViewBtn();
  renderEditor();
  renderAll();
  $("status").textContent = "";
