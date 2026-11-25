  /* ---------- panel de personalización ---------- */
  function renderSheet() {
    var n = cur(); if (!n) return;
    renderBgPick($("bgPick"), n.bg, true, function (k) { n.bg = k; changed(n); renderBg(); renderSheet(); renderList(); });
    var cum = CU_RE0.exec(n.bg || ""); $("cuCtl").hidden = !cum;
    if (cum) {
      $("cuMode").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.m === cum[2] ? "true" : "false"); });
      $("cuSize").value = cum[3]; $("cuOp").value = cum[4];
    }
    var sw = $("swatches"); sw.textContent = "";
    COLORS.forEach(function (c) {
      var b = el("button", "sw" + (c.rgb ? "" : " none")); b.type = "button";
      if (c.rgb) b.style.setProperty("--c", rgba(c.rgb, 1));
      b.title = c.n; b.setAttribute("aria-label", c.n);
      b.setAttribute("aria-pressed", n.color === c.k ? "true" : "false");
      b.addEventListener("click", function () { n.color = c.k; changed(n); renderTint(); renderSheet(); });
      sw.appendChild(b);
    });
    var te = $("tagedit"); te.textContent = "";
    n.tags.forEach(function (t) {
      var c = el("span", "chip"); c.textContent = "#" + t;
      var x = el("button"); x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Quitar etiqueta " + t);
      x.style.cssText = "border:0;background:transparent;padding:0 2px;font-size:16px;line-height:1;color:var(--muted)";
      x.addEventListener("click", function () { n.tags = n.tags.filter(function (y) { return y !== t; }); changed(n); renderSheet(); renderTaglines(); renderChips(); });
      c.appendChild(x); te.appendChild(c);
    });
    var inp = el("input"); inp.type = "text"; inp.placeholder = n.tags.length >= 8 ? "Máximo 8 etiquetas" : "Agregar etiqueta"; inp.id = "tagInput";
    inp.setAttribute("list", "taglist"); inp.setAttribute("enterkeyhint", "done"); inp.setAttribute("autocapitalize", "none"); inp.setAttribute("aria-label", "Agregar etiqueta");
    inp.disabled = n.tags.length >= 8;
    function commit() {
      var parts = inp.value.split(/[,\n]/).map(cleanTag).filter(Boolean), added = false;
      parts.forEach(function (t) { if (n.tags.indexOf(t) < 0 && n.tags.length < 8) { n.tags.push(t); added = true; } });
      inp.value = "";
      if (added) { changed(n); renderSheet(); renderTaglines(); renderChips(); var f = $("tagInput"); if (f && !f.disabled) f.focus(); }
    }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } });
    inp.addEventListener("change", commit);
    te.appendChild(inp);
    $("typeSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.type === n.type ? "true" : "false"); });
    $("archBtn").textContent = n.archived ? "Desarchivar" : "Archivar";
  }
  function openSheet() {
    if (!cur() || readOnly()) return;
    renderSheet(); $("folderIn").value = cur().folder || ""; renderRem(); $("nlPick").hidden = true; renderNoteLock();
    $("scrim").hidden = false; $("sheet").hidden = false;
    pushLayer("sheet");
  }
  function convertType(t) {
    var n = cur(); if (!n || n.type === t) return;
    if (t === "list") {
      var lines = n.body.split(/\r?\n/).filter(function (l) { return l.trim(); });
      n.items = lines.map(function (l0, k) {
        var sub = k > 0 && /^(\s{2,}|\t)/.test(l0), l = l0.trim();
        var done = /^[-*]?\s*\[(x|X)\]\s*/.test(l), o = { id: uid(), t: l.replace(/^[-*•]?\s*(\[[ xX]?\]\s*)?/, ""), done: done };
        if (sub) o.lv = 1; return o;
      });
      if (!n.items.length) n.items.push({ id: uid(), t: "", done: false });
      n.body = ""; n.type = "list";
    } else {
      n.body = n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + (i.done ? "[x] " : "[ ] ") + i.t + itemMeta(i); }).join("\n");
      n.items = []; n.type = "text";
    }
    changed(n); renderEditor(); renderSheet(); renderAll();
  }
  function noteText(n) {
    var head = n.title.trim() ? n.title.trim() + "\n\n" : "";
    if (n.type === "list") return head + n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + (i.done ? "☑ " : "☐ ") + i.t + itemMeta(i); }).join("\n");
    return head + n.body;
  }
  function capPlugin(name) {
    var cap = window.Capacitor;
    if (!cap || !(cap.isNativePlatform && cap.isNativePlatform())) return null;
    try { return (cap.Plugins && cap.Plugins[name]) || (cap.registerPlugin && cap.registerPlugin(name)) || null; } catch { return null; }
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = el("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch {}
      document.body.removeChild(ta); ok ? resolve() : reject(new Error("copy"));
    });
  }
  function shareNote() {
    var n = cur(); if (!n) return;
    var text = noteText(n), title = n.title.trim() || "Nota de Tronx";
    var share = capPlugin("Share");
    if (share) { share.share({ title: title, text: text, dialogTitle: "Compartir nota" }).catch(function () {}); return; }
    if (navigator.share) { navigator.share({ title: title, text: text }).catch(function () {}); return; }
    copyText(text).then(function () { toast("Se copió el texto de la nota"); }, function () { toast("No se pudo compartir"); });
  }
  function duplicateNote() {
    var n = cur(); if (!n) return;
    var now = Date.now();
    var c = normalize(JSON.parse(JSON.stringify(n)));
    c.id = uid(); c.pinned = false; c.createdAt = now; c.updatedAt = now; delete c.enc;
    c.title = (n.title.trim() || (n.type === "list" ? "Lista" : "Nota")) + " (copia)";
    c.items = c.items.map(function (i) { return copyItem(i, true); });
    notes.set(c.id, c); persistNow(); renderAll(); if (isPinEnc(c)) encSoon(c);
    toast("Nota duplicada", "Abrir", function () { closeLayer("sheet"); setTimeout(function () { openNote(c.id); }, 200); });
  }
  function leaveToList() { closeLayer("editor"); }
  function archiveNote() {
    var n = cur(); if (!n) return;
    var was = n.archived;
    n.archived = !was; n.pinned = false; changed(n); persistNow();
    leaveToList();
    toast(was ? "Nota desarchivada" : "Nota archivada", "Deshacer", function () { n.archived = was; changed(n); persistNow(); renderAll(); });
  }
  function trashNote() {
    var n = cur(); if (!n) return;
    var prevPinned = n.pinned;
    n.trashedAt = Date.now(); n.pinned = false; changed(n); persistNow();
    leaveToList();
    toast("Nota movida a la papelera", "Deshacer", function () { n.trashedAt = null; n.pinned = prevPinned; changed(n); persistNow(); renderAll(); });
  }
  $("moreBtn").addEventListener("click", openSheet);
  $("sheetClose").addEventListener("click", function () { closeLayer("sheet"); });
  $("scrim").addEventListener("click", function () {
    var top = layers[layers.length - 1];
    closeLayer(top === "icons" ? "icons" : "sheet");
  });
  $("typeSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) convertType(b.dataset.type); });
  $("dupBtn").addEventListener("click", duplicateNote);
  $("archBtn").addEventListener("click", archiveNote);
  $("shareBtn").addEventListener("click", shareNote);
  $("copyBtn").addEventListener("click", function () {
    var n = cur(); if (!n) return;
    copyText(noteText(n)).then(function () { toast("Texto copiado"); }, function () { toast("No se pudo copiar"); });
  });
  $("trashBtn").addEventListener("click", trashNote);
  $("pinBtn").addEventListener("click", function () {
    var n = cur(); if (!n || n.trashedAt) return;
    n.pinned = !n.pinned; changed(n); persistNow(); renderEditor(); renderList();
  });
  $("restoreBtn").addEventListener("click", function () {
    var n = cur(); if (!n) return;
    n.trashedAt = null; changed(n); persistNow(); leaveToList(); toast("Nota restaurada");
  });
  armed($("purgeBtn"), function () {
    var n = cur(); if (!n) return;
    notes.delete(n.id); persistNow(); leaveToList(); toast("Nota eliminada para siempre");
  }, "¿Seguro? Tocá de nuevo");
  armed($("emptyTrash"), function () {
    var ids = [];
    notes.forEach(function (n) { if (n.trashedAt) ids.push(n.id); });
    ids.forEach(function (id) { notes.delete(id); });
    if (activeId && !notes.has(activeId)) { activeId = null; $("app").dataset.view = "list"; renderEditor(); }
    persistNow(); renderAll(); toast("Papelera vaciada");
  }, "¿Vaciar? Tocá de nuevo");

  /* ---------- barra lateral ---------- */
  $("newBtn").addEventListener("click", function () { createNote("text"); });
  $("fab").addEventListener("click", function () { var f = $("fab"); if (f.dataset.lp === "1") { f.dataset.lp = ""; return; } createNote("text"); });
  bindLongPress($("fab"), function () { createNote("list"); });
  $("q").addEventListener("focus", function () { document.querySelector(".side").classList.add("typing"); });
  $("q").addEventListener("blur", function () { document.querySelector(".side").classList.remove("typing"); });
  $("newListBtn").addEventListener("click", function () { createNote("list"); });
  $("blankNew").addEventListener("click", function () { createNote("text"); });
  $("blankList").addEventListener("click", function () { createNote("list"); });
  $("backBtn").addEventListener("click", leaveToList);
  $("q").addEventListener("input", function () { query = $("q").value; renderListSoon(); renderSaved(); });
  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () {
      if (selMode) closeLayer("select");
      tab = b.dataset.tab; tagFilter = null; folderFilter = null;
      renderAll();
    });
  });
  document.querySelector('.chromein > .viewseg [data-mode="notes"]').addEventListener("click", function () {
    if (tab !== "notes") document.querySelector('.tab[data-tab="notes"]').click();
  });
  function fltSync() {
    var on = kindFilter !== "all" || whenFilter !== "all", o = $("fltBtn").parentNode;
    $("fltBtn").classList.toggle("on", on);
    if (on && !o.classList.contains("open")) { o.classList.add("open"); }
    $("fltBtn").setAttribute("aria-pressed", o.classList.contains("open") ? "true" : "false");
    $("fltBtn").setAttribute("aria-expanded", o.classList.contains("open") ? "true" : "false");
  }
  window.__fltReady = true;
  $("fltBtn").addEventListener("click", function () { var o = $("fltBtn").parentNode; o.classList.toggle("open"); fltSync(); });
  $("kind").addEventListener("change", function () { kindFilter = $("kind").value; renderList(); renderSaved(); });
  $("when").addEventListener("change", function () { whenFilter = $("when").value; renderList(); renderSaved(); });
  /* búsquedas guardadas + alcance (archivo y papelera) */
  function savedList() { return Array.isArray(settings.saved) ? settings.saved : []; }
  function savedName(o) {
    var parts = []; if (o.q) parts.push("“" + o.q + "”"); if (o.tag) parts.push("#" + o.tag); if (o.folder !== null) parts.push("▣ " + (o.folder || "Sin carpeta"));
    var ko = $("kind").querySelector('[value="' + o.kind + '"]'), wo = $("when").querySelector('[value="' + o.when + '"]');
    if (o.kind !== "all" && ko) parts.push(ko.textContent); if (o.when !== "all" && wo) parts.push(wo.textContent); if (o.all && o.q) parts.push("en todo");
    return (parts.join(" · ") || "Búsqueda").slice(0, 40);
  }
  function renderSaved() {
    var row = $("savedRow"), q = query.trim(); row.textContent = "";
    if (q) {
      var sc = el("button", "chip"); sc.type = "button"; sc.id = "scopeBtn"; sc.textContent = allScope ? "✓ Buscando en todo" : "Buscar también en archivo y papelera";
      sc.setAttribute("aria-pressed", allScope ? "true" : "false"); sc.addEventListener("click", function () { allScope = !allScope; renderList(); renderSaved(); }); row.appendChild(sc);
    }
    savedList().forEach(function (o, i) {
      var c = el("span", "chip"); c.setAttribute("role", "button"); c.tabIndex = 0; c.dataset.i = i; c.title = "Aplicar esta búsqueda";
      var t = el("span"); t.textContent = "★ " + o.n; var x = el("span", "x"); x.textContent = " ✕"; x.title = "Quitar búsqueda guardada"; x.setAttribute("aria-label", "Quitar " + o.n);
      c.appendChild(t); c.appendChild(x); row.appendChild(c);
    });
    if (filtering()) {
      var sv = el("button", "chip"); sv.type = "button"; sv.id = "saveSearch"; sv.textContent = "💾 Guardar búsqueda"; row.appendChild(sv);
    }
    row.hidden = !row.children.length;
  }
  $("savedRow").addEventListener("click", function (e) {
    if (e.target.closest("#saveSearch")) {
      var o = { q: query.trim(), tag: tagFilter, folder: folderFilter, kind: kindFilter, when: whenFilter, all: allScope && !!query.trim() };
      o.n = savedName(o); var l = savedList().filter(function (x) { return x.n !== o.n; }); l.unshift(o); settings.saved = l.slice(0, 12); saveSettings(); renderSaved(); toast("Búsqueda guardada"); return;
    }
    var c = e.target.closest("[data-i]"); if (!c) return; var i = +c.dataset.i, o2 = savedList()[i]; if (!o2) return;
    if (e.target.closest(".x")) { settings.saved = savedList().filter(function (_x, j) { return j !== i; }); saveSettings(); renderSaved(); return; }
    query = o2.q; $("q").value = query; tagFilter = o2.tag; folderFilter = o2.folder; kindFilter = o2.kind; whenFilter = o2.when; allScope = !!o2.all;
    $("kind").value = kindFilter; $("when").value = whenFilter; renderAll();
  });
  $("savedRow").addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.dataset && e.target.dataset.i) e.target.click(); });
  $("folderIn").addEventListener("change", function () {
    var n = cur(); if (!n || n.trashedAt) return;
    n.folder = cleanFolder($("folderIn").value); $("folderIn").value = n.folder; changed(n); renderFolders();
  });
  $("sort").value = settings.sort;
  $("sort").addEventListener("change", function () { settings.sort = $("sort").value; saveSettings(); renderList(); });
  $("viewBtn").addEventListener("click", function () {
    settings.view = settings.view === "grid" ? "list" : "grid"; saveSettings(); renderViewBtn(); renderList();
  });

  /* ---------- ajustes ---------- */
  function renderSettings() {
    renderBkStatus();
    try { renderPinUI(); renderAutoBk(); } catch {}
    $("themeSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === settings.theme ? "true" : "false"); });
    $("fontSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === settings.font ? "true" : "false"); });
    var soundOn = !window.TronxSound || window.TronxSound.isEnabled();
    $("soundSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === soundOn ? "true" : "false"); });
    renderBgPick($("setBg"), settings.noteBg, false, function (k) {
      settings.noteBg = k; saveSettings(); renderSettings(); renderBg(); renderList();
    });
    $("bgAnimSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.bgAnim ? "true" : "false"); });
    $("fabSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.fab ? "true" : "false"); });
    $("swipeSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.swipe ? "true" : "false"); });
    $("encTitleSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.encTitle ? "true" : "false"); });
    var nat = window.TronxNative && typeof window.TronxNative.setSecure === "function"; $("secureSeg").hidden = $("secureHint").hidden = !nat;
    $("secureSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.secureWin ? "true" : "false"); });
    $("listSizeSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", Number(b.dataset.v) === settings.listSize ? "true" : "false"); });
    $("contrastSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.contrast ? "true" : "false"); });
    $("calmSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === calmOn() ? "true" : "false"); });
    $("quickSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.quickNotif ? "true" : "false"); });
    $("dueSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.dueAlert ? "true" : "false"); });
    $("dueEveSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.dueEve ? "true" : "false"); });
    $("dueEveSeg").hidden = !settings.dueAlert; $("dueAt").value = settings.dueAt;
    $("streakSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.streakAlert ? "true" : "false"); });
    $("streakAtF").hidden = !settings.streakAlert; $("streakAt").value = settings.streakAt;
    var vol = window.TronxSound ? window.TronxSound.getVolume() : 0;
    $("volSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", Number(b.dataset.v) === vol ? "true" : "false"); });
    var sw = $("accentSw"); sw.textContent = "";
    Object.keys(ACCENTS).forEach(function (k) {
      var b = el("button", "sw"); b.type = "button";
      b.style.setProperty("--c", (isDark() ? ACCENTS[k].dark : ACCENTS[k].light)[0]);
      b.title = ACCENTS[k].n; b.setAttribute("aria-label", ACCENTS[k].n);
      b.setAttribute("aria-pressed", settings.accent === k ? "true" : "false");
      b.addEventListener("click", function () { settings.accent = k; saveSettings(); applyTheme(); renderSettings(); });
      sw.appendChild(b);
    });
    $("sizeRange").value = settings.size; $("sizeVal").textContent = settings.size + " px";
    var total = 0, trash = 0;
    notes.forEach(function (n) { if (n.trashedAt) trash++; else total++; });
    $("about").textContent = "Tronx " + APP_VERSION + " · " + total + (total === 1 ? " nota" : " notas") + (trash ? " · " + trash + " en la papelera" : "") + " · funciona sin internet";
  }
  function fmtBytes(b) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
  function renderStorage() {
    var box = $("stTxt"), stamp = ++stSeq;
    imgKeys().then(function (keys) {
      var main = keys.filter(function (k) { return !/:t$/.test(k); });
      return Promise.all(keys.map(function (k) { return imgGetRaw(k).then(rawSize, function () { return 0; }); })).then(function (sz) {
        var tot = sz.reduce(function (a, c) { return a + c; }, 0), stk = main.filter(function (k) { return String(k).indexOf("stk:") === 0 && !/:s$/.test(k); }).length;
        var used = usedImageIds().size, notesN = 0; notes.forEach(function (n) { if (!n.trashedAt) notesN++; });
        var txt = notesN + (notesN === 1 ? " nota" : " notas") + " · " + used + (used === 1 ? " imagen en notas" : " imágenes en notas") + " · " + stk + (stk === 1 ? " sticker" : " stickers") + "\nImágenes y stickers ocupan " + fmtBytes(tot);
        return (navigator.storage && navigator.storage.estimate ? navigator.storage.estimate().catch(function () { return null; }) : Promise.resolve(null)).then(function (e) {
          if (stamp !== stSeq) return;
          if (e && e.usage) txt += "\nLa app usa " + fmtBytes(e.usage) + (e.quota ? " de " + fmtBytes(e.quota) + " disponibles" : "");
          box.textContent = txt; box.style.whiteSpace = "pre-line";
        });
      });
    });
  }
  var stSeq = 0;
  $("stClean").addEventListener("click", function () {
    gcImages().then(function (r) { toast(r.n ? "Se liberaron " + fmtBytes(r.bytes) + " (" + r.n + (r.n === 1 ? " imagen" : " imágenes") + " sin uso)" : "No hay nada que liberar: todo se está usando"); renderStorage(); });
  });
  $("setJump").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; var t = $(b.dataset.t); if (t) t.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  $("abNews").addEventListener("click", function () { closeLayer("settings"); setTimeout(openNews, 300); });
  $("abTour").addEventListener("click", function () { closeLayer("settings"); setTimeout(openTour, 300); });
  var resetArm = 0;
  $("abReset").addEventListener("click", function () {
    var b = $("abReset");
    if (!resetArm) { resetArm = 1; b.textContent = "¿Seguro? Tocá de nuevo para restablecer"; setTimeout(function () { resetArm = 0; b.textContent = "Restablecer ajustes de apariencia"; }, 3500); return; }
    resetArm = 0; b.textContent = "Restablecer ajustes de apariencia";
    Object.assign(settings, { theme: "dark", accent: "violet", font: "sans", size: 16, view: "grid", sort: "updated", skin: 0, noteBg: "nebula", bgAnim: true, fab: true, swipe: true, listSize: 100, contrast: false, calm: null });
    saveSettings(); applyTheme(); renderAll(); renderBg(); renderSettings(); toast("Ajustes de apariencia restablecidos");
  });
  function openSettings() { renderSettings(); renderStorage(); $("settings").hidden = false; pushLayer("settings"); }
  $("settingsClose").addEventListener("click", function () { closeLayer("settings"); });
  $("settings").addEventListener("click", function (e) { if (e.target === $("settings")) closeLayer("settings"); });
  var NEWS = [
    { v: "1.76.3", d: "25 nov 2026", t: "Cubo del Destino", lv: "Nova", cat: "nuevo", l: ["Nuevo objeto especial: el Cubo del Destino, un cubo flotante de obsidiana con grietas de energía violeta, símbolos en sus seis caras y partículas cósmicas.", "Al abrirlo tiene una probabilidad fija del 66 % de darte un pin exclusivo, el pin Cubo del Destino, que no sale en ningún sobre.", "Si el destino no acompaña, recibís un premio de consuelo: 200 estrellas, 60 XP y 10 puntos SEIS.", "Se gana en el nivel 8 del Camino SEIS (366 puntos) y se abre desde Eventos > Sobres y marco."] },
    { v: "1.76.0", d: "25 nov 2026", t: "Regalos por iniciar sesión", lv: "Hipernova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Si inicias sesión el 6 de diciembre, te regalamos un sobre de 6 estrellas.", "Si inicias sesión el último día del evento (17 de diciembre), te regalamos un sobre mítico: tiene 66 % de probabilidad de darte el marco exclusivo.", "Los sobres míticos se ven con su propio cartel, y en Eventos se muestran los dos regalos."] },
    { v: "1.75.8", d: "25 nov 2026", t: "Menú renovado", lv: "Destello", cat: "mejora", l: ["MAX ahora está justo debajo de Perfil.", "Iconos nuevos en todo el menú: más claros y de dos tonos.", "Secciones reordenadas (Tu espacio, Explorar, Personalizar y Aplicación) y filas más grandes y cómodas de tocar.", "El fondo del menú se queda quieto y solo se desplazan las opciones.", "La tarjeta de Constelaciones tiene una nebulosa y una constelación dibujada (la Osa Mayor) con estrellas brillantes.", "En el mapa de Constelaciones ahora se ven los nombres de más notas, los nombres de cada constelación van en una pastilla de color que no se pisa con las notas y sus líneas brillan más."] },
    { v: "1.75.3", d: "25 nov 2026", t: "Sobres del evento más nítidos", lv: "Destello", cat: "arreglo", l: ["Al tocar un sobre del evento GTA VI ya no se ve borroso."] },
    { v: "1.75.2", d: "24 nov 2026", t: "Tu nivel en el perfil y logros secretos corregidos", lv: "Eclipse", cat: "mejora", l: ["El perfil muestra una tarjeta con el emblema de tu rango, tu título y tu nivel.","Una barra indica cuánta XP te falta para el siguiente nivel.","Se arreglaron varios errores en los logros secretos.","Ahora se desbloquean en el momento correcto, y los que ya tenías con datos incorrectos se corrigen solos."] },
    { v: "1.75.1", d: "24 nov 2026", t: "Código reorganizado", lv: "Destello", cat: "limpieza", l: ["El código de la app se separó en archivos por tema para que sea más fácil de mantener.","Sin cambios visibles en la aplicación."] },
    { v: "1.75.0", d: "24 nov 2026", t: "Gemas de progreso en los niveles", lv: "Hipernova", cat: "mejora", l: ["Debajo del emblema de cada nivel hay una gema por cada nivel de su rango.","Las gemas se encienden a medida que subís, así ves cuánto te falta para el siguiente rango.","El brillo del emblema crece con cada nivel dentro del rango."] },
    { v: "1.74.9", d: "24 nov 2026", t: "Niveles de versión corregidos", lv: "Destello", cat: "arreglo", l: ["Las versiones recientes mostraban un nivel más alto del que les correspondía.","Ahora cada una muestra su nivel real: Destello, Eclipse o Nova según su alcance, y Hipernova queda para los saltos de ciclo."] },
    { v: "1.74.8", d: "24 nov 2026", t: "Nueva moneda estrella", lv: "Eclipse", cat: "rediseno", l: ["Rediseñamos la moneda estrella: ahora es una moneda dorada con borde grabado, relieve y una estrella brillante en el centro.","Se ve en tu saldo de MAX, en la tienda, en los precios, en las misiones y en los premios de subida de nivel.","Se ve nítida tanto en tamaño chico como grande."] },
    { v: "1.74.7", d: "24 nov 2026", t: "Barra de formato más clara", lv: "Eclipse", cat: "mejora", l: ["La barra de formato de las notas ahora separa las herramientas por grupos: historial, estilo, bloques, insertar, tabla y fecha.","Se difuminan los bordes cuando hay más herramientas para deslizar, así no quedan escondidas.","El botón del formato de la línea donde estás (viñeta, lista, casilla, cita o título) queda marcado.","Los botones responden con una pequeña animación al tocarlos."] },
    { v: "1.74.6", d: "23 nov 2026", t: "Editor de foto de perfil", lv: "Nova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Antes de poner una foto en tu perfil, ahora podés editarla: moverla, acercarla con el control o con dos dedos, y rotarla.","Se ve el círculo exacto que va a quedar en tu perfil.","Botón Restablecer para volver al encuadre inicial.","Un botón Próximamente anticipa nuevas herramientas para tu foto."] },
    { v: "1.74.5", d: "23 nov 2026", t: "Perfil con nuevo diseño", lv: "Nova", nm: "Ha llegado VI", cat: "rediseno", ep: "gta", l: ["El avatar del perfil es más pequeño y pasa a la izquierda.","Tu nombre, la frase y el nivel van al lado del avatar, alineados a la izquierda."] },
    { v: "1.74.4", d: "23 nov 2026", t: "Misiones sin sobres", lv: "Destello", nm: "Ha llegado VI", cat: "arreglo", ep: "gta", l: ["Las misiones normales y las recompensas de racha de la pestaña Misiones ya no entregan sobres: dan solo XP y estrellas.","Los sobres se consiguen en las misiones del evento, en el Camino SEIS y en la recompensa diaria."] },
    { v: "1.74.3", d: "23 nov 2026", t: "Luces: Luz Vice para tu nombre", lv: "Nova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Nueva categoría Luces: efectos de luz para las letras de tu nombre.","Luz Vice: un neón con los colores de GTA VI (rosa, naranja y violeta) que ilumina tu nombre en el perfil y en el menú.","Se consigue como premio del nivel 7 del Camino SEIS, con 299 puntos.","En Eventos > Tienda, en la sección Luces, podés ver cómo queda, equiparla o quitarla cuando quieras."] },
    { v: "1.74.2", d: "23 nov 2026", t: "Camino SEIS y mejoras en los sobres", lv: "Nova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Nuevo Camino SEIS en la Tienda del evento: subís de nivel con los puntos SEIS que ganás en misiones y sobres.","Nivel 1 (6 puntos): sobre de 1 estrella. Nivel 2 (16): 16 puntos SEIS. Nivel 3 (36): 26 puntos SEIS. Nivel 4 (66): 40 puntos SEIS. Nivel 5 (106): 66 puntos SEIS. Nivel 6 (206): sobre especial de 5 estrellas que se mejora con solo 2 toques. Nivel 7 (299): Luz Vice.","Los puntos que dan los niveles no cuentan para llegar al siguiente.","Los premios del Camino SEIS y la recompensa diaria del evento se reclaman a mano con un botón; ya no se entregan solos.","Sobres más nítidos al abrirlos, estrellas rediseñadas con nuevos destellos y fondos renovados.","El pin VI estrena arte, y si te sale un pin repetido ya no recibís puntos SEIS.","Aviso claro cuando tenés 60 sobres guardados.","El botón Atrás del celular ahora retrocede dentro de la app y cierra el sobre abierto; solo sale con doble toque desde la pantalla principal."] },
    { v: "1.74.0", d: "21 nov 2026", t: "Misiones y recompensas diarias del evento", lv: "Hipernova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Nueva pestaña Misiones en el evento GTA VI.","Recompensa diaria con ciclo de 7 días: sobres, puntos SEIS, estrellas y XP, con un sobre de 4 estrellas el día 7.","Seis misiones diarias, renovadas a las 00:00, como escribir 6 palabras, 66 letras o usar Enfoque 6 minutos. Cada una da 6 puntos SEIS y un sobre de 1 estrella.","Seis misiones semanales, renovadas los lunes. Las fáciles dan 16 puntos SEIS y un sobre de 2 estrellas; las difíciles, 24 puntos SEIS y un sobre de 3 estrellas.","Cada misión muestra su progreso, y un aviso en Eventos indica cuándo hay recompensas por reclamar.","Los pines ahora también salen en sobres de 1 a 4 estrellas, con menor probabilidad que en los de 5 y 6.","Los sobres se abren solos al terminar los toques, y al tocar un marco en la Tienda se reproduce su animación.","El botón Atrás retrocede paso a paso en MAX y en las notas, y pide confirmación antes de cerrar la app.","Mejor rendimiento al abrir sobres, en la Tienda y en el marco Fusión nuclear."] },
    { v: "1.73.0", d: "21 nov 2026", t: "Pines y cuenta regresiva GTA VI", lv: "Hipernova", nm: "Ha llegado VI", cat: "nuevo", ep: "gta", l: ["Cuenta regresiva en la pestaña Eventos: el evento GTA VI finaliza el 17 de diciembre", "Nuevo aviso en Eventos: durante estos días se sumarán más recompensas a los sobres", "Seis pines exclusivos de GTA VI, que se muestran junto a tu nombre: Atardecer, Cocodrilo, Casete, GTA, Palmera y VI", "Los pines pueden aparecer en los sobres de 5 y 6 estrellas, con un 15 % y un 35 % de probabilidad; cuanto más raro el pin, menos chances de obtenerlo", "Desde la sección Pines del evento podés equipar o quitar el pin que quieras mostrar", "Si te toca un pin que ya tenés, recibís puntos SEIS a cambio", "Mejor rendimiento al navegar la Tienda y las vistas con marcos animados"] },
    { v: "1.72.0", d: "20 nov 2026", t: "Evento GTA VI", lv: "Hipernova", nm: "Evento GTA VI", cat: "nuevo", l: ["Nueva pestaña Eventos en MAX, con el primer evento: GTA VI", "Nuevo marco Exclusivo GTA VI, con aro metálico, palmeras iluminadas y el VI en acabado cromado dorado; cuesta 6.666.666 ⭐ o se consigue en los sobres", "Sobres de la suerte: se obtienen al completar misiones, de 1 a 3 estrellas según la dificultad", "Tocá el sobre hasta 6 veces: cada toque puede mejorarlo una estrella, con un fondo y efectos propios para cada nivel", "Al abrirlo recibís ⭐, XP y puntos SEIS, y cada sobre tiene una chance de traer el marco, desde 0,002 % hasta 6 % en los de 6 estrellas", "Puntos SEIS y Tienda del evento: comprá sobres, cambialos por ⭐ o XP y subí tu nivel de suerte para mejorar tus chances"] },
    { v: "1.71.0", d: "20 nov 2026", t: "Fusión nuclear y Familias de marcos", lv: "Hipernova", nm: "Marcos de perfil", cat: "nuevo", l: ["Nuevo marco Mítico IV: Fusión nuclear, una armadura de reactor con cámaras de energía, átomo en movimiento y núcleo central", "Animación especial de Fusión nuclear: las cámaras se cargan, el marco se inestabiliza, el núcleo gira cada vez más rápido y la fusión estalla en un destello azul y blanco antes de volver a la calma", "La animación ocurre de forma completamente aleatoria: a veces pasa mucho tiempo sin nada y nunca sigue un intervalo fijo", "En la Tienda de MAX los marcos ahora se agrupan por Familias: Clásicos y Familia nuclear", "Podés ver la animación especial cuando quieras desde la vista previa del marco", "Se pausa con el modo calmo y no consume recursos cuando no está activa", "Pronto llegará un nuevo marco a la Familia nuclear"] },
    { v: "1.70.0", d: "18 nov 2026", t: "Tienda de MAX: marcos de perfil", lv: "Hipernova", nm: "Marcos de perfil", cat: "nuevo", l: ["La Tienda de MAX ya está abierta: canjeá tus estrellas por marcos animados para tu avatar", "Cinco marcos al lanzamiento: Neón pulsante, Aurora, Constelación, Sol y Nebulosa cósmica", "Vista previa en tu propio avatar antes de comprar y botón para equipar o quitar el marco", "Los marcos Míticos tienen grados, de I a VI: a mayor grado, mayor exclusividad", "Tu marco se ve en el perfil y en el menú, y se pausa con el modo calmo"] },
    { v: "1.69.0", d: "18 nov 2026", t: "Celebraciones, resumen semanal y recordatorio de racha", lv: "Hipernova", nm: "Celebraciones y racha", cat: "nuevo", l: ["Pantalla de celebración para los logros de rareza Platino o superior y para los secretos", "Resumen semanal en MAX: palabras, notas, enfoque y días activos frente a la semana anterior", "Recordatorio de racha opcional, desde Ajustes: te avisa solo si ese día todavía no escribiste"] },
    { v: "1.68.0", d: "18 nov 2026", t: "👀 Se han descubierto nuevos secretos... ¿Serás el primero en encontrarlos?", lv: "Hipernova", nm: "Nuevos secretos", cat: "nuevo", l: ["Nuevos logros secretos: permanecen ocultos hasta que los descubrís", "Sin pistas: explorá, creá y probá cosas distintas", "Nueva pestaña Secretos en tu perfil", "Medalla Estelar renovada, con una constelación que se dibuja sola", "Leyenda de Tronx ahora también requiere los secretos"] },
    { v: "1.67.0", d: "18 nov 2026", t: "Nuevas rarezas de logros y guía de MAX", lv: "Hipernova", cat: "nuevo", l: ["Cuatro rarezas nuevas de logros: Platino, Diamante, Estelar y Cósmico, con efectos animados propios", "35 logros nuevos para metas de largo plazo: notas, palabras, rachas, enfoque, tareas y nivel", "Nueva categoría Maestría, con logros ligados al nivel de MAX", "Más misiones diarias y semanales, con rotación más variada", "Guía de MAX la primera vez que entrás, disponible luego desde Inicio", "Los efectos se desactivan con el modo calmo"] },
    { v: "1.66.0", d: "17 nov 2026", t: "Nivel 50: Singularidad renovado", lv: "Hipernova", cat: "mejora", l: ["Nuevo emblema del nivel 50 con temática de ángel cósmico: halo, alas doradas, nebulosa y esfera armilar", "En las pantallas de nivel, las alas aletean periódicamente y los anillos giran alrededor del núcleo", "Las animaciones se desactivan con el modo calmo"] },
    { v: "1.65.0", d: "16 nov 2026", t: "Insignias con íconos propios y nivel 40 renovado", lv: "Hipernova", cat: "mejora", l: ["Insignias de logros con un ícono dibujado para cada logro", "Nivel 40 (Agujero negro) con una composición más equilibrada, partículas cósmicas y una versión optimizada para tamaños reducidos", "Resplandor exterior de los emblemas más sutil"] },
    { v: "1.64.0", d: "16 nov 2026", t: "Insignias de logros y emblemas animados", lv: "Hipernova", cat: "mejora", l: ["Insignias rediseñadas: cada categoría tiene su propia forma y cada nivel su metal (bronce, plata u oro)", "Nivel 40 (Agujero negro) con disco de acreción en rotación", "Nivel 50 (Singularidad) con efectos de luz animados", "Las animaciones se desactivan con el modo calmo"] },
    { v: "1.63.1", d: "16 nov 2026", t: "Foto de perfil en el menú", lv: "Hipernova", cat: "arreglo", l: ["Corregida la visualización de la foto de perfil en el menú, que ocupaba toda la pantalla; ahora se muestra como avatar circular"] },
    { v: "1.63.0", d: "15 nov 2026", t: "Llega MAX", lv: "Hipernova", nm: "Llega MAX", cat: "nuevo", l: ["MAX: nuevo centro con Inicio, Tienda, Misiones, Niveles y Novedades, accesible desde el menú", "Sistema de niveles por experiencia (XP): 50 niveles y 8 rangos, con emblemas y pantalla de celebración al subir", "Misiones diarias y semanales, bonus diario y premios por racha", "XP por crear notas, escribir, usar el modo enfoque y desbloquear logros, además de estrellas ⭐", "La Tienda estará disponible próximamente"] },
    { v: "1.62.6", d: "14 nov 2026", t: "Perfil renovado y Sala de logros", lv: "Supernova", cat: "nuevo+mejora", l: ["Perfil a pantalla completa con portada, avatar ampliado, frase personal y nivel", "Avatar a partir de una foto de la galería, iniciales con color o emoji", "Sala de logros con medallas de bronce, plata y oro, progreso general y barras de avance", "Logros agrupados por categoría: Escritura, Constancia, Orden, Enfoque y Seguridad", "Perfil organizado en Resumen, Logros y Actividad, con editor propio y portada a elección"] },
    { v: "1.62.2", d: "14 nov 2026", t: "Inicio más cómodo", lv: "Nova", cat: "rediseno", l: ["Buscador, Archivo y Papelera en una sola fila, con contador en cada ícono", "La pestaña Notas se retira del encabezado y se accede desde la barra inferior", "Barra inferior renovada, con selector plano y botón + de esquinas suaves", "El botón Notas de la barra inferior regresa a la lista desde Archivo o Papelera"] },
    { v: "1.61.9", d: "14 nov 2026", t: "Inicio renovado", lv: "Nova", cat: "rediseno", l: ["Navegación inferior flotante: Notas y Constelaciones al alcance del pulgar, junto al botón +", "Encabezado más compacto, con más notas visibles sin desplazarse", "Pestañas Notas, Archivo y Papelera con estilo de píldora", "Tarjetas con altura natural: la vista previa se lee completa, sin recortes"] },
    { v: "1.61.7", d: "14 nov 2026", t: "Nueva pantalla de inicio", lv: "Eclipse", cat: "rediseno", l: ["Cabecera compacta, mayor espaciado y tarjetas más amplias", "Buscador con ícono y bordes más suaves", "Filtros plegables, con indicador cuando hay uno activo", "Estado vacío con ilustración y mensaje claro", "Botón flotante de nueva nota más grande en el teléfono"] },
    { v: "1.61.6", d: "14 nov 2026", t: "Correcciones", lv: "Destello", cat: "arreglo", l: ["Corregido el botón «Buscar notas duplicadas», que no respondía", "Corregido el marcador del día actual en el mapa de actividad"] },
    { v: "1.61.5", d: "14 nov 2026", t: "Copias de seguridad, duplicadas y tablet", lv: "Nova", cat: "nuevo+mejora", l: ["Copia automática con fecha en Documentos/Tronx y rotación de las más antiguas", "Restauración de una nota individual desde cualquier copia, sin afectar al resto", "Detección y unión de notas duplicadas, conservando etiquetas y carpeta", "Diseño optimizado para tablet y pantalla horizontal", "Tamaño de letra ajustable en la lista de notas", "Accesibilidad: alto contraste, movimiento reducido y etiquetas para lectores de pantalla"] },
    { v: "1.60.9", d: "13 nov 2026", t: "Escritura y seguridad", lv: "Nova", cat: "nuevo+mejora", l: ["Enlaces entre notas que se actualizan al renombrar, con lista de menciones", "Tablas con botones para agregar filas y columnas", "Markdown ampliado: código, tachado, subtítulos y enlaces", "Protección con frase de paso, además del PIN", "Cifrado opcional del título y de las imágenes en notas protegidas", "Opción para ocultar el contenido en la vista de apps recientes"] },
    { v: "1.60.3", d: "13 nov 2026", t: "Accesos rápidos y listas avanzadas", lv: "Supernova", cat: "nuevo+mejora", l: ["Widget de pantalla de inicio con acceso a nota, lista y dictado", "Atajos al mantener pulsado el ícono de la app", "Notificación fija para crear una nota al instante", "Tareas repetitivas: diarias, semanales y mensuales", "Progreso de subtareas en cada tarea", "Orden de la lista por fecha de vencimiento", "Vista Mi día con tareas atrasadas, de hoy y de la semana"] },
    { v: "1.59.6", d: "13 nov 2026", t: "Búsqueda avanzada, enfoque y cifrado", lv: "Nova", cat: "nuevo+mejora", l: ["Búsqueda avanzada por fecha y por notas con imágenes, con búsquedas guardadas", "Búsqueda también en Archivo y Papelera", "Modo enfoque para escribir sin distracciones, con cronómetro y contador de palabras", "Más logros e historial de actividad en el perfil", "Cifrado del texto de las notas protegidas con PIN propio", "Copias de seguridad más cómodas: recordatorio configurable, copia sin imágenes y estado de la última copia"] },
    { v: "1.59.0", d: "13 nov 2026", t: "Captura rápida y calendario semanal", lv: "Hipernova", cat: "nuevo+mejora", l: ["Mejoras visuales en los temas Blanco y Universo", "Recepción de texto desde otras apps mediante Compartir > Tronx", "Dictado por voz para escribir notas", "Avisos por fecha en cada tarea, con hora configurable y aviso opcional el día anterior", "Calendario con vista semanal y arrastre de avisos y tareas a otro día"] },
    { v: "1.58.4", d: "12 nov 2026", t: "Tema Blanco renovado", lv: "Nova", cat: "rediseno", l: ["Mayor contraste en textos y tarjetas, fondos con más color y sombras más definidas", "El menú lateral (Explorador) acompaña al tema: claro en Blanco y oscuro en Universo"] },
    { v: "1.58.1", d: "12 nov 2026", t: "Niveles y categorías de versiones", lv: "Nova", cat: "nuevo+mejora", l: ["Cada versión muestra un nivel según su alcance, con insignia y color propios", "Categorías por contenido: funciones nuevas, mejoras, correcciones, rediseño, limpieza, seguridad y datos", "Leyenda «Niveles y categorías» y búsqueda por nivel o categoría en las novedades"] },
    { v: "1.58.0", d: "12 nov 2026", t: "Constelaciones mejoradas", lv: "Hipernova", nm: "Mapa Estelar", cat: "mejora", l: ["«Quizás se relacionan»: sugerencias de notas similares (mismas etiquetas o palabras) en la vista previa de cada estrella, para conectarlas con un toque", "Filtro por etiqueta: las demás estrellas se atenúan, combinable con el buscador", "Mapa compartible como imagen"] },
    { v: "1.57.0", d: "12 nov 2026", t: "Ajustes mejorados", lv: "Eclipse", nm: "Panel de Mando", cat: "mejora", l: ["Accesos rápidos en la parte superior de Ajustes: Sonido, Copias, Plantillas, Markdown, PIN, Espacio y Acerca", "Nueva sección «Espacio»: cantidad de notas, imágenes y stickers con su tamaño, y opción «Liberar espacio» para eliminar imágenes sin uso", "«Acerca de Tronx» con accesos a Novedades y a la guía", "«Restablecer ajustes de apariencia», sin afectar notas, copias, PIN ni stickers"] },
    { v: "1.56.0", d: "12 nov 2026", t: "Novedades mejoradas", lv: "Eclipse", nm: "Señales del Universo", cat: "mejora", l: ["Aviso tras actualizar que lleva directamente a las novedades (una vez por versión)", "Marcador de lo nuevo desde la última visita y plegado de las versiones anteriores", "Buscador dentro de las novedades"] },
    { v: "1.55.1", d: "9 nov 2026", t: "Limpieza de código", lv: "Destello", nm: "Polvo Estelar", cat: "limpieza", l: ["Eliminación de código, estilos e identificadores sin uso", "Sin cambios visibles en la aplicación"] },
    { v: "1.55.0", d: "9 nov 2026", t: "Stickers propios", lv: "Nova", nm: "Sticker Cósmico", cat: "nuevo", l: ["Mis stickers (menú y selector de íconos): creación con dibujo, foto o emoji/texto", "Personalización de forma, relleno y degradado, borde, brillo y animación (flotar, latir, girar…)", "Uso como ícono de nota, como fondo (mosaico, centro o esquina, con tamaño e intensidad) o dentro de la nota como imagen móvil y escalable", "Edición, duplicado y eliminación; hasta 40 stickers, incluidos en la copia de seguridad"] },
    { v: "1.54.0", d: "9 nov 2026", t: "Plantillas propias", lv: "Nova", nm: "Moldes Estelares", cat: "nuevo", l: ["Personalizar → «Guardar como plantilla»: guarda cualquier nota (texto o lista, con subtareas), con opción de incluir título, etiquetas y color o ícono", "Las plantillas propias aparecen primero al crear una nota vacía", "{fecha} y {hora} se completan automáticamente al usar la plantilla", "«Mis plantillas» (también en Ajustes): usar, renombrar y eliminar, con opción de deshacer", "Hasta 30 plantillas, incluidas en la copia de seguridad"] },
    { v: "1.53.0", d: "9 nov 2026", t: "Botón flotante y gestos en tarjetas", lv: "Eclipse", nm: "Atajo Orbital", cat: "nuevo+mejora", l: ["Botón flotante + para crear una nota (con pulsación larga, una lista); se oculta en la papelera, al seleccionar y al escribir en el buscador", "En la vista de lista, deslizar una tarjeta a la derecha la fija y a la izquierda la archiva, con opción de deshacer", "Ambas funciones se pueden desactivar en Personalización → Pantalla de inicio"] },
    { v: "1.52.0", d: "9 nov 2026", t: "Exportar e importar Markdown", lv: "Nova", nm: "Puente de Archivos", cat: "nuevo", l: ["Ajustes → Markdown → «Exportar todo»: un .zip con una nota por archivo .md, organizado en carpetas e incluyendo etiquetas, fechas y estado de fijado", "Las listas se exportan como casillas, con sus subtareas", "Las notas protegidas y las de la papelera no se exportan", "«Importar .md, .txt o .zip»: admite archivos sueltos o comprimidos, toma el título del archivo o del primer #, lee etiquetas y fechas y respeta las carpetas", "Los elementos ya existentes se omiten para evitar duplicados"] },
    { v: "1.51.0", d: "9 nov 2026", t: "Huella para abrir Tronx", lv: "Eclipse", nm: "Llave Dactilar", cat: "seguridad", l: ["Nuevo ajuste «Abrir también con huella» en Bloqueo con PIN (disponible si el teléfono cuenta con huella)", "Con el ajuste activo, la huella se solicita al abrir o volver a la app; el PIN sigue siendo válido en todo momento", "Al quitar el PIN se desactiva la huella", "Corregido el bucle de bloqueo tras el aviso de huella"] },
    { v: "1.50.0", d: "9 nov 2026", t: "Listas mejoradas", lv: "Nova", nm: "Listas Cuánticas", cat: "mejora", l: ["Subtareas: sangría con ⇥ (o Tab); al marcar la tarea principal se marcan sus subtareas", "Reordenamiento arrastrando desde el asa ⋮⋮ o con ▲▼; los bloques con subtareas se mueven juntos", "Fecha por elemento con indicador visual (hoy, mañana, atrasada)", "Botón para ocultar o mostrar los elementos completados", "Subtareas y fechas incluidas en copias, historial, duplicado y exportaciones (texto, Markdown e imagen)"] },
    { v: "1.49.0", d: "9 nov 2026", t: "Inicio más limpio y con más espacio", lv: "Eclipse", nm: "Horizonte Despejado", cat: "rediseno", l: ["Los controles (vista, búsqueda, pestañas y filtros) se ocultan al desplazar la lista y reaparecen al subir o al tocar el buscador", "Las tarjetas muestran sus etiquetas", "Tarjetas más compactas, con más notas por pantalla"] },
    { v: "1.48.0", d: "9 nov 2026", t: "Estadísticas, rachas y logros", lv: "Nova", nm: "Sala de Trofeos", cat: "nuevo", l: ["El Perfil vuelve a estar disponible desde el menú", "Nueva sección «Tu escritura»: racha actual y mejor racha, palabras escritas, últimos 7 días, días activos y día más productivo", "Mapa de actividad de las últimas 12 semanas", "16 logros con barra de progreso y aviso al desbloquearlos", "La racha se muestra en el acceso al Perfil del menú"] },
    { v: "1.47.0", d: "9 nov 2026", t: "Compartir como imagen", lv: "Eclipse", nm: "Instantánea Galáctica", cat: "nuevo", l: ["Nuevo botón «Compartir como imagen» en Personalizar", "Tres estilos: Universo, Papel y Color de la nota", "Conserva títulos, listas, citas, resaltados e imágenes con sus ajustes", "Opción de incluir u omitir la marca Tronx"] },
    { v: "1.46.0", d: "9 nov 2026", t: "Papelera sin vencimiento y copias programables", lv: "Nova", nm: "Memoria de Cristal", cat: "nuevo+mejora", l: ["La papelera ya no elimina notas automáticamente: permanecen hasta que se eliminan o se vacía la papelera", "Copia automática configurable (Ajustes → Copia automática): frecuencia (6 h, 12 h, diaria, cada 2 o 3 días o semanal) y hora del día", "Opciones «Al salir de la app» y «Solo si hubo cambios» para evitar copias innecesarias", "Cantidad de copias a conservar en la app: 3, 7, 14 o 30", "Las copias programadas se realizan con la app abierta; si estaba cerrada, se hacen al abrirla"] },
    { v: "1.45.1", d: "9 nov 2026", t: "Correcciones", lv: "Destello", nm: "Reparación Estelar", cat: "arreglo", l: ["Notas protegidas: ahora también solicitan PIN o huella al abrirse desde la papelera y se vuelven a bloquear tras 20 segundos en segundo plano, incluso con el PIN general activo", "Resaltado de colores: expresiones como «x == y» ya no se interpretan como resaltado; solo se resalta el texto pegado a los =="] },
    { v: "1.45.0", d: "9 nov 2026", t: "Ajustes de imagen", lv: "Eclipse", nm: "Lente Cósmica", cat: "mejora", l: ["Recorte y encuadre: zoom del 100 % al 400 % y dos deslizadores para elegir la zona visible", "Ajustes finos de brillo, contraste, saturación y desenfoque, combinables con el filtro elegido", "Botón «Restablecer ajustes» para volver a los valores originales", "El PDF respeta el recorte y los ajustes (el desenfoque es aproximado)"] },
    { v: "1.44.0", d: "9 nov 2026", t: "Mapa de enlaces", lv: "Nova", nm: "Hilos del Destino", cat: "nuevo", l: ["Nueva opción «Mapa de enlaces» en el menú: gráfico de notas conectadas por [[enlaces]] y por subnotas (línea punteada)", "Al tocar una nota se resaltan sus conexiones y se puede abrir; admite desplazamiento, pellizco para ampliar y botones + y −", "Listado de notas sin conexiones y de enlaces a notas inexistentes, que se pueden crear con un toque", "Las notas protegidas no revelan sus enlaces"] },
    { v: "1.43.0", d: "9 nov 2026", t: "Orden y etiquetas", lv: "Eclipse", nm: "Orden Galáctico", cat: "mejora", l: ["Nuevos criterios de orden: más antiguas, título Z–A, próximo aviso y más largas", "Gestor de etiquetas y carpetas (botón ⚙ junto a los filtros): permite renombrar, combinar o eliminar una etiqueta o carpeta en todas las notas a la vez", "Al asignar a una etiqueta el nombre de otra, ambas se combinan; todas las acciones se pueden deshacer"] },
    { v: "1.42.0", d: "9 nov 2026", t: "Calendario", lv: "Nova", nm: "Calendario Solar", cat: "nuevo", l: ["Nueva opción «Calendario» en el menú: mes completo con puntos naranjas en los días con avisos y grises en los días con notas creadas", "Al tocar un día se muestran sus avisos con la hora (incluidos los repetitivos) y se puede abrir la nota", "«Nueva nota con aviso este día» crea una nota con el aviso programado a las 9:00", "Las notas protegidas se identifican con 🔒"] },
    { v: "1.41.0", d: "9 nov 2026", t: "Recordatorios más completos", lv: "Eclipse", nm: "Alarmas Estelares", cat: "mejora", l: ["Nuevas repeticiones: «Cada mes» (si el día no existe, se usa el último del mes) y «Días elegidos…» (por ejemplo, lunes, miércoles y viernes)", "Hasta 5 avisos por nota con «Agregar otro aviso», que se pueden quitar individualmente", "Los avisos mensuales y por días se programan por adelantado (6 meses o 14 repeticiones) y se renuevan al abrir la app", "La tarjeta de la lista muestra «+N» si la nota tiene más avisos"] },
    { v: "1.40.0", d: "9 nov 2026", t: "Buscar y reemplazar", lv: "Eclipse", nm: "Buscador de Materia", cat: "nuevo", l: ["Nuevo botón «🔎 Buscar» en la barra de la nota: cuenta las coincidencias y permite recorrerlas con ▲ ▼", "Distinción de mayúsculas con el botón Aa", "Reemplazo individual o total, con aviso y opción de deshacer", "Si hay texto seleccionado, se usa como término de búsqueda"] },
    { v: "1.39.0", d: "9 nov 2026", t: "Notas protegidas (PIN y huella)", lv: "Nova", nm: "Cámara Acorazada", cat: "seguridad", l: ["Nuevo en Personalizar → Protección: cada nota puede protegerse con un PIN propio, con la huella del teléfono o con cualquiera de los dos (opcional)", "Las notas protegidas se muestran con 🔒 en la lista, sin vista previa y sin búsqueda por contenido", "Se solicita de nuevo la clave tras 20 segundos en segundo plano o al cerrar la nota", "Los recordatorios de notas protegidas no muestran su contenido en la notificación", "Es una barrera de privacidad: en esta versión no cifra la nota"] },
    { v: "1.38.0", d: "9 nov 2026", t: "Resaltado de colores", lv: "Eclipse", cat: "mejora", l: ["Nuevo botón «🖍 Resaltar» en la barra de la nota: amarillo, verde, rosa, celeste o naranja", "Se selecciona el texto y se elige un color; dentro de un texto resaltado se puede cambiar el color o quitar el resaltado", "Visible en el modo Leer; en el PDF y en las notificaciones se muestra como texto normal"] },
    { v: "1.37.0", d: "8 nov 2026", t: "Posponer avisos y más plantillas", lv: "Eclipse", cat: "nuevo+mejora", l: ["Botón «Posponer 10 min» en la notificación de cada recordatorio", "Cinco plantillas nuevas: Receta, Estudio, Película, Gastos y Hábitos", "Los avisos pospuestos se guardan con la nota y se mantienen aunque se cierre la app"] },
    { v: "1.36.0", d: "8 nov 2026", t: "Mayor fluidez con muchas imágenes", lv: "Eclipse", cat: "mejora", l: ["Miniaturas más livianas y almacenadas aparte: las notas con muchas fotos se abren con mucha menos carga", "Las imágenes se decodifican de forma progresiva y solo cuando se necesitan", "Las notas y las copias de seguridad no cambian"] },
    { v: "1.35.0", d: "8 nov 2026", t: "Copia automática", lv: "Eclipse", cat: "seguridad", l: ["Tronx guarda una copia de las notas cuando cambian (como máximo cada 6 horas) y conserva las últimas 7 dentro de la app", "También intenta guardar un archivo en Documentos/Tronx (tronx-copia-auto.json) para conservarlo tras una reinstalación", "En Ajustes se consulta el estado, se puede copiar al instante, activar o desactivar la función y recuperar cualquier copia"] },
    { v: "1.34.0", d: "8 nov 2026", t: "Información en las imágenes", lv: "Eclipse", cat: "mejora", l: ["Cada imagen puede incluir un texto informativo, que se edita desde su panel", "Ubicación configurable: abajo, arriba o sobre la imagen (abajo o arriba)", "Visibilidad configurable: solo al tocar la imagen o siempre; en modo Leer, un toque muestra u oculta el texto", "El texto también aparece como pie de imagen en el PDF", "Corregido el botón Editar del modo Leer, que se veía casi invisible"] },
    { v: "1.33.2", d: "8 nov 2026", t: "Notificaciones renovadas", lv: "Destello", cat: "rediseno", l: ["El título de la notificación es el de la nota, sin el reloj ni los dos puntos sobrantes", "Texto limpio, sin símbolos de formato; al desplegar la notificación se muestra más contenido, con casillas y líneas", "Ícono propio de Tronx en la barra de estado y canal «Recordatorios», configurable desde los ajustes de Android (sonido, vibración e importancia)"] },
    { v: "1.33.1", d: "8 nov 2026", t: "Permiso de notificaciones", lv: "Destello", cat: "arreglo", l: ["En Personalizar > Recordatorio se muestra el estado real del permiso de notificaciones, con un botón «Permitir notificaciones»", "Si Android lo tiene bloqueado, Tronx indica dónde activarlo; también avisa si esta versión se compiló sin el componente de avisos"] },
    { v: "1.33.0", d: "8 nov 2026", t: "Cámara, dibujo y PDF con imágenes", lv: "Eclipse", cat: "nuevo", l: ["Botón Foto: toma una foto y la agrega a la nota como imagen", "Botón Dibujo: trazo libre con colores, tres grosores, goma y fondo transparente, blanco, papel u oscuro; el dibujo se trata como una imagen más (mover, escalar y girar)", "El PDF ahora incluye las imágenes, con su forma, filtro y opacidad", "La búsqueda de texto en una subnota también muestra la nota principal"] },
    { v: "1.32.0", d: "8 nov 2026", t: "Limpieza interna", lv: "Eclipse", cat: "limpieza", l: ["Eliminación de código y dibujos en desuso, con una app algo más liviana y ordenada", "Sin cambios visibles"] },
    { v: "1.31.0", d: "8 nov 2026", t: "Recordatorios con aviso", lv: "Eclipse", cat: "nuevo", l: ["Avisos en cualquier nota desde Personalizar > Recordatorio, con fecha y hora o atajos (en 1 hora, esta noche, mañana, lunes)", "Repetición diaria o semanal", "Notificación incluso con la app cerrada; al tocarla se abre la nota", "Las notas con aviso muestran un reloj en la lista y cuentan con el filtro «Con recordatorio»", "La primera vez, Android solicita permiso para mostrar notificaciones"] },
    { v: "1.30.0", d: "8 nov 2026", t: "Texto alrededor de las imágenes", lv: "Eclipse", cat: "nuevo", l: ["Nueva opción «Texto alrededor» en el panel de cada imagen", "En modo Leer, la imagen se acomoda al lado donde fue colocada y el texto la rodea; con forma circular, el texto sigue la curva", "Durante la edición, la imagen se mantiene en la posición elegida"] },
    { v: "1.29.0", d: "8 nov 2026", t: "Compartir y proteger", lv: "Eclipse", cat: "nuevo", l: ["Exportación de cualquier nota a PDF o Markdown (.md) desde Personalizar; el PDF incluye el texto, sin imágenes", "Historial de versiones: se guarda una versión cada vez que termina la edición (hasta 10) y se puede restaurar desde Personalizar > Historial", "Bloqueo con PIN de 4 dígitos en Ajustes: se solicita al abrir la app y al volver tras unos segundos. Funciona como barrera de privacidad, no cifra las notas y no se puede recuperar si se olvida"] },
    { v: "1.28.0", d: "8 nov 2026", t: "Imágenes en las notas", lv: "Eclipse", cat: "nuevo", l: ["Una o varias imágenes desde el botón Imagen de la barra de formato", "Ubicación libre: arrastrar, cambiar el tamaño con el punto inferior derecho y girar con el punto inferior izquierdo o con dos dedos", "Personalización: tamaño, giro, opacidad, forma (cuadrada, 4:3, 16:9 o círculo), borde, sombra, espejo y filtros (B/N, sepia, cálido, frío, desvaído y vivo)", "Posibilidad de colocarlas delante o detrás del texto, traerlas al frente o al fondo, bloquearlas, duplicarlas o eliminarlas", "Las imágenes se incluyen en las copias de seguridad"] },
    { v: "1.27.0", d: "8 nov 2026", t: "Más contenido en las notas", lv: "Eclipse", cat: "nuevo", l: ["Enlaces entre notas: se escriben con [[ o con el botón Enlace; en modo Leer abren la nota y, si no existe, la crean", "Cada nota muestra al pie las notas que la enlazan", "Subnotas con + Subnota, dentro de cualquier nota; en la lista aparecen dentro de su nota principal", "Tablas sencillas: botón Tabla, Enter agrega filas y en modo Leer se visualizan como tabla"] },
    { v: "1.26.0", d: "8 nov 2026", t: "Mejor organización", lv: "Eclipse", cat: "mejora", l: ["Carpetas: cada nota puede asignarse a una carpeta desde Personalizar, con filtro de la lista en un toque", "Selección múltiple: con el botón de casilla o una pulsación larga se eligen varias notas para fijarlas, archivarlas, moverlas de carpeta o enviarlas a la papelera, con opción de deshacer", "Nuevo filtro por tipo: solo notas, solo listas, listas sin terminar, fijadas o con color", "La búsqueda resalta las coincidencias dentro de cada tarjeta"] },
    { v: "1.25.0", d: "8 nov 2026", t: "Escritura mejorada", lv: "Eclipse", cat: "mejora", l: ["Nueva barra de formato: negrita, cursiva, título, cita, viñetas, lista numerada y casillas", "Deshacer y rehacer propios, que también revierten los cambios de la barra", "Modo Leer: muestra la nota con formato y permite tildar las casillas", "El contador indica el tiempo de lectura y la barra queda fija sobre el teclado"] },
    { v: "1.24.0", d: "7 nov 2026", t: "Guía de bienvenida y menú mejorado", lv: "Nova", cat: "nuevo+mejora", l: ["Nueva guía de bienvenida de 8 pasos con todo lo que ofrece Tronx; se muestra una vez y puede volver a verse desde el menú, en Guía de Tronx", "El menú incorpora niveles según la cantidad de notas (Polvo estelar, Tripulante, Navegante, Cartógrafo, Astrónomo y Capitán estelar), con barra de progreso", "Atajos rápidos en el menú: Nota, Lista, Buscar y Papelera", "Consejos que cambian cada día y al tocarlos"] },
    { v: "1.23.3", d: "7 nov 2026", t: "Lista más fluida", lv: "Destello", cat: "mejora", l: ["Las insignias de las tarjetas se animan de a cuatro y se detienen durante el desplazamiento, lo que devuelve la fluidez a la lista"] },
    { v: "1.23.2", d: "7 nov 2026", t: "Brújula más limpia", lv: "Destello", cat: "rediseno", l: ["La brújula usa el borde del medallón como aro; se quitaron los círculos adicionales que la hacían parecer doble"] },
    { v: "1.23.1", d: "7 nov 2026", t: "Brújula mejorada", lv: "Destello", cat: "mejora", l: ["Brújula estelar rediseñada: aro de latón con grados, letras N E S O, rosa de los vientos con facetas de luz y sombra, y aguja roja y blanca que oscila hasta asentarse"] },
    { v: "1.23.0", d: "7 nov 2026", t: "Cinco insignias nuevas", lv: "Nova", cat: "nuevo", l: ["Nuevas insignias: Sistema solar, Púlsar, Ojo cósmico, Reloj de arena y Satélite, hasta sumar 21", "El Fénix se reemplaza por la Medusa estelar; quienes lo tenían elegido ven ahora la Medusa", "Estrella y Aurora mejoradas: la estrella con puntas finas, manchas y protuberancias; la aurora con cortinas de rayos de luz"] },
    { v: "1.22.1", d: "7 nov 2026", t: "Fénix y Nebulosa nuevos", lv: "Destello", cat: "nuevo", l: ["Fénix rediseñado: alas de plumas de fuego, cresta, cola en llamas y brasas que ascienden", "Nebulosa rediseñada: nubes de colores que giran en sentidos opuestos, banda de polvo oscuro y cúmulo brillante"] },
    { v: "1.22.0", d: "7 nov 2026", t: "Insignias detalladas", lv: "Nova", cat: "nuevo", l: ["«Detalles» pasa a llamarse «Insignias detalladas» y se rediseña desde cero como medallones: aro metálico, cara de cristal y gema", "16 insignias, cada una con su escena y animaciones propias; nuevas: Cohete, Ovni, Constelación, Eclipse, Cristal, Aurora, Fénix y Brújula estelar", "Mayor fluidez: cada insignia anima pocas piezas y se pausa cuando no está visible", "Las insignias elegidas anteriormente se conservan"] },
    { v: "1.21.0", d: "7 nov 2026", t: "Segunda fila de insignias", lv: "Eclipse", cat: "nuevo", l: ["Nebulosa con pilares de polvo, Luna con fases y cráteres, Agujero negro con disco giratorio y Cometa con dos colas y partículas, cada uno con animaciones propias", "«Luna cósmica» pasa a llamarse «Luna»", "El selector pausa las animaciones que no se ven"] },
    { v: "1.20.0", d: "7 nov 2026", t: "Tierra realista y galaxia espiral", lv: "Eclipse", cat: "rediseno", l: ["La Tierra usa un mapa real simplificado, con América, África, Europa, Asia y Australia, desiertos, selvas y hielo polar; es igual en el menú y en las insignias", "«Planeta» pasa a llamarse «Saturno» y «Planeta Tierra», «Tierra»", "Galaxia rediseñada: brazos espirales con polvo oscuro, miles de estrellas de colores, núcleo cálido y zonas de formación estelar"] },
    { v: "1.19.0", d: "7 nov 2026", t: "Insignias y novedades", lv: "Nova", cat: "nuevo+mejora", l: ["Los stickers pasan a llamarse «Detalles»", "Primera fila rediseñada: Tierra, Galaxia, Estrella y Planeta con anillos, cada uno con su animación", "Al mantener pulsado un detalle se muestra su información", "Nueva sección Novedades en el menú"] },
    { v: "1.18.0", d: "6 nov 2026", t: "Tierra y estrellas en movimiento", lv: "Eclipse", cat: "rediseno", l: ["Nuevo detalle: Planeta Tierra, de giro lento y avatar predeterminado", "Las estrellas del fondo del menú se mueven y titilan suavemente"] },
    { v: "1.17.0", d: "6 nov 2026", t: "Encabezado del menú", lv: "Eclipse", cat: "rediseno", l: ["Rediseño del botón del menú y del encabezado Explorador, con contadores de notas, constelaciones y vínculos"] },
    { v: "1.16.0", d: "6 nov 2026", t: "Temas Blanco y Universo", lv: "Eclipse", cat: "rediseno", l: ["«Claro» pasa a llamarse «Blanco» y se rediseña; «Oscuro» pasa a llamarse «Universo»"] },
    { v: "1.15.0", d: "6 nov 2026", t: "Menú rediseñado", lv: "Eclipse", cat: "rediseno", l: ["Nuevo estilo del menú con Constelaciones como tarjeta principal", "Constelaciones abre de forma más liviana"] },
    { v: "1.11.0", d: "6 nov 2026", t: "Mayor fluidez", lv: "Eclipse", cat: "mejora", l: ["La lista reutiliza tarjetas, escribir y buscar son notablemente más fluidos y se eliminaron los sonidos de clic"] },
  ];
  var VLEVELS = {
    "Destello": { c: "148,163,184", d: "Un retoque mínimo o un arreglo pequeño", i: '<path d="M12 3.5l1.7 6.8 6.8 1.7-6.8 1.7L12 20.5l-1.7-6.8L3.5 12l6.8-1.7z"/>' },
    "Eclipse": { c: "129,140,248", d: "Cada versión chica normal", i: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14.5" cy="12" r="6.2"/>' },
    "Nova": { c: "34,211,238", d: "Una versión chica con algo notable", i: '<polygon points="12.0,2.0 14.5,9.5 22.0,12.0 14.5,14.5 12.0,22.0 9.5,14.5 2.0,12.0 9.5,9.5"/>' },
    "Supernova": { c: "251,146,60", d: "Varias funciones juntas en el mismo ciclo", i: '<polygon points="12.0,1.5 14.0,7.2 19.4,4.6 16.8,10.0 22.5,12.0 16.8,14.0 19.4,19.4 14.0,16.8 12.0,22.5 10.0,16.8 4.6,19.4 7.2,14.0 1.5,12.0 7.2,10.0 4.6,4.6 10.0,7.2"/>' },
    "Hipernova": { c: "236,72,153", d: "El salto de ciclo (1.x.0)", i: '<polygon points="12.0,2.5 14.1,8.4 20.2,7.2 16.2,12.0 20.2,16.8 14.1,15.6 12.0,21.5 9.9,15.6 3.8,16.8 7.8,12.0 3.8,7.2 9.9,8.4"/><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1"/>' },
    "Cuásar": { c: "167,139,250", d: "Un ciclo especialmente grande", i: '<circle cx="12" cy="12" r="3.2"/><path d="M11 1.5h2l-.7 8h-.6zM11 22.5h2l-.7-8h-.6z"/><ellipse cx="12" cy="12" rx="9.5" ry="2.2" fill="none" stroke="currentColor" stroke-width="1.3"/>' },
    "Singularidad": { c: "124,58,237", d: "Un cambio profundo en cómo funciona la app", i: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.4"/>' },
    "Big Bang": { c: "250,204,21", d: "El salto de 1.x a 2.0", i: '<circle cx="12" cy="12" r="3.6"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5M4.6 4.6l3.5 3.5M15.9 15.9l3.5 3.5M19.4 4.6l-3.5 3.5M8.1 15.9l-3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>' },
    "Multiverso": { c: "45,212,191", d: "Un salto histórico (3.0 o más)", i: '<circle cx="9" cy="9" r="5.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="9" r="5.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="15" r="5.8" fill="none" stroke="currentColor" stroke-width="1.5"/>' }
  };
  var VLEVEL_ORDER = ["Destello", "Eclipse", "Nova", "Supernova", "Hipernova", "Cuásar", "Singularidad", "Big Bang", "Multiverso"];
  var CATS = {
    "nuevo": { n: "Funciones nuevas", e: "✨" },
    "mejora": { n: "Mejoras", e: "🚀" },
    "nuevo+mejora": { n: "Funciones nuevas + mejoras", e: "✨🚀" },
    "arreglo": { n: "Arreglos", e: "🛠️" },
    "rediseno": { n: "Rediseño", e: "🎨" },
    "limpieza": { n: "Limpieza", e: "🧹" },
    "seguridad": { n: "Seguridad y datos", e: "🔒" },
    "mezcla": { n: "Mezcla total", e: "🌌" }
  };
  var newsPrev = null, newsQ = "";
  function verCmp(a, b) {
    var x = String(a).split("."), y = String(b).split(".");
    for (var i = 0; i < 3; i++) { var d = (+x[i] || 0) - (+y[i] || 0); if (d) return d; }
    return 0;
  }
  function lvBadge(name) {
    var L = VLEVELS[name]; if (!L) return null;
    var b = el("span", "lvb"); b.style.setProperty("--lc", L.c);
    var ic = el("span", "lvi"); ic.setAttribute("aria-hidden", "true"); ic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor">' + L.i + "</svg>"; b.appendChild(ic);
    b.appendChild(document.createTextNode(name)); b.title = L.d;
    return b;
  }
  function nwRich(node, text) {
    text.split(/(\bVI\b)/).forEach(function (p) { if (p === "VI") { var e = el("span", "nwvi"); e.textContent = p; node.appendChild(e); } else if (p) node.appendChild(document.createTextNode(p)); });
  }
  function newsCard(n, fresh) {
    var L = VLEVELS[n.lv], c = el("article", "nw" + (n.v === APP_VERSION ? " cur" : "") + (n.ep ? " ep-" + n.ep : "") + (L ? " lvl lv-" + VLEVEL_ORDER.indexOf(n.lv) : ""));
    if (L) c.style.setProperty("--lc", L.c);
    if (L) { var top = el("div", "nwlv"); top.appendChild(lvBadge(n.lv)); if (fresh) { var nw = el("span", "new"); nw.textContent = "Nuevo"; top.appendChild(nw); } c.appendChild(top); }
    var h = el("header"); var v = el("span", "v"); v.textContent = "v" + n.v; h.appendChild(v);
    if (fresh && !L) { var nw2 = el("span", "new"); nw2.textContent = "Nuevo"; h.appendChild(nw2); }
    var ct = CATS[n.cat]; if (ct) { var cc = el("span", "nwcat c-" + n.cat.replace("+", "p")); cc.textContent = ct.n; h.appendChild(cc); }
    var d = el("span", "dt"); d.textContent = n.d; h.appendChild(d); c.appendChild(h);
    var t = el("h4"); if (n.ep) nwRich(t, n.nm || n.t); else t.textContent = n.nm || n.t; c.appendChild(t);
    if (n.nm) { var sub = el("p", "nwsub"); if (n.ep) nwRich(sub, n.t); else sub.textContent = n.t; c.appendChild(sub); }
    var ul = el("ul"); n.l.forEach(function (x) { var li = el("li"); if (n.ep) nwRich(li, x); else li.textContent = x; ul.appendChild(li); }); c.appendChild(ul);
    return c;
  }
  function newsLegend() {
    var dt = el("details", "nwleg"), sm = el("summary"); sm.textContent = "Niveles y categorías de las versiones"; dt.appendChild(sm);
    var p = el("p", "hint"); p.textContent = "El nivel indica el alcance de cada actualización y la categoría, el tipo de cambios que incluye."; dt.appendChild(p);
    VLEVEL_ORDER.forEach(function (k) {
      var r = el("div", "nwlr"); r.appendChild(lvBadge(k)); var x = el("span"); x.textContent = VLEVELS[k].d; r.appendChild(x); dt.appendChild(r);
    });
    var ch = el("div", "nwlc"); Object.keys(CATS).forEach(function (k) { var c = el("span", "nwcat c-" + k.replace("+", "p")); c.textContent = CATS[k].n; ch.appendChild(c); }); dt.appendChild(ch);
    return dt;
  }
  function renderNews() {
    var b = $("newsBody"); b.textContent = "";
    var q = newsQ.trim().toLowerCase(), prev = newsPrev, fresh = [], old = [];
    if (!q) b.appendChild(newsLegend());
    NEWS.forEach(function (n) {
      if (q && (n.t + " " + (n.nm || "") + " " + (n.lv || "") + " " + (CATS[n.cat] ? CATS[n.cat].n : "") + " " + n.l.join(" ") + " v" + n.v).toLowerCase().indexOf(q) < 0) return;
      (prev && verCmp(n.v, prev) > 0 ? fresh : old).push(n);
    });
    if (!q && fresh.length) {
      var hd = el("p", "nwhead"); hd.textContent = fresh.length === 1 ? "Lo nuevo desde tu última visita" : fresh.length + " versiones nuevas desde tu última visita (v" + prev + ")"; b.appendChild(hd);
    }
    fresh.forEach(function (n) { b.appendChild(newsCard(n, true)); });
    if (!q && fresh.length && old.length) { var h2 = el("p", "nwhead"); h2.textContent = "Versiones anteriores"; b.appendChild(h2); }
    old.forEach(function (n, i) {
      if (q || i < 3 || fresh.length === 0 && i < 6) { b.appendChild(newsCard(n, false)); return; }
      var dt = el("details", "nwold"), sm = el("summary"); sm.textContent = "v" + n.v + " · " + n.t; dt.appendChild(sm);
      var ul = el("ul"); n.l.forEach(function (x) { var li = el("li"); li.textContent = x; ul.appendChild(li); }); dt.appendChild(ul); b.appendChild(dt);
    });
    if (!fresh.length && !old.length) { var em = el("p", "hint"); em.textContent = "No hay novedades que coincidan con «" + newsQ.trim() + "»."; b.appendChild(em); }
  }
  function openNews() {
    newsPrev = settings.newsSeen || null; newsQ = ""; $("newsSearch").value = "";
    renderNews(); $("news").hidden = false; pushLayer("news");
    if (settings.newsSeen !== APP_VERSION) { settings.newsSeen = APP_VERSION; saveSettings(); updateMenuBadge(); try { renderMenu(); } catch {} }
  }
  $("newsSearch").addEventListener("input", function () { newsQ = $("newsSearch").value; renderNews(); });
  /* tras actualizar: aviso suave una sola vez por versión */
  setTimeout(function () {
    var lk = $("lock"); if (lk && !lk.hidden) return;
    if (settings.newsSeen && settings.newsSeen !== APP_VERSION && settings.newsToast !== APP_VERSION) {
      settings.newsToast = APP_VERSION; saveSettings(); toast("Tronx se actualizó a la versión " + APP_VERSION, "Ver novedades", openNews);
    }
  }, 2200);
  $("newsClose").addEventListener("click", function () { closeLayer("news"); });
  $("news").addEventListener("click", function (e) { if (e.target === $("news")) closeLayer("news"); });
