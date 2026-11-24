  /* ---------- menú cósmico ---------- */
  var menuTimer = 0, menuFullTimer = 0, pausedAnims = [];
  function relTime(ts) {
    var d = Math.floor((Date.now() - ts) / 86400000);
    return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días";
  }
  function backupOverdue() {
    var real = 0; notes.forEach(function (n) { if (!n.trashedAt) real++; });
    var last = Math.max(settings.lastBackup || 0, settings.firstRun || 0);
    return real >= 3 && Math.floor((Date.now() - last) / 86400000) >= bkDays();
  }
  function newsUnseen() { return settings.newsSeen !== APP_VERSION; }
  function updateMenuBadge() { $("mbDot").hidden = !(backupOverdue() || newsUnseen()); }
  function renderMenu() {
    var p = getProfile(), st = universeStats(), over = backupOverdue();
    paintAvatar($("mnAv"), p); frApply($("mnAv").parentNode, $("mnAv"), frEq(), 60);
    $("mnName").textContent = p.name || "Explorador"; mxPinTag($("mnName"), 18);
    var lv = maxLevel();
    $("mnRank").textContent = "Nivel " + lv.L + " · " + lv.title;
    $("mnLvT").textContent = lv.max ? "Nivel máximo alcanzado" : "Faltan " + lv.left.toLocaleString("es") + " XP para el nivel " + (lv.L + 1);
    $("mnSubMax").textContent = maxMenuSub();
    $("mnLvB").style.width = lv.pct + "%";
    $("mnTipT").textContent = TIPS[tipI];
    $("mnSub").textContent = "Tu universo de notas";
    $("mnStN").textContent = st.notes; $("mnStC").textContent = st.groups; $("mnStL").textContent = st.links;
    var sk = streakInfo().cur; $("mnSubPf").textContent = sk > 0 ? "Racha de " + sk + (sk === 1 ? " día" : " días") : "Tu avatar, rachas y logros";
    $("mnSubMap").textContent = st.groups || st.links ? st.groups + (st.groups === 1 ? " constelación" : " constelaciones") + " · " + st.links + (st.links === 1 ? " vínculo" : " vínculos") : "El mapa galáctico de tus notas";
    $("mnSubSet").textContent = "Sonido del agujero negro: " + (window.TronxSound && !window.TronxSound.isEnabled() ? "silenciado" : "activado");
    $("mnSubBk").textContent = settings.lastBackup ? "Última copia: " + relTime(settings.lastBackup) : "Todavía no hiciste una copia";
    $("mnBkDot").hidden = !over;
    $("mnNewsDot").hidden = !newsUnseen();
    $("mnSubNews").textContent = newsUnseen() ? "Nuevo en la versión " + APP_VERSION : "Versión " + APP_VERSION + " · lo nuevo";
    $("mnFoot").textContent = "Tronx " + APP_VERSION + " · funciona sin internet";
  }
  // Mientras el menú está abierto, lo que hay debajo (stickers y fondos animados) se pausa: toda la potencia va al menú.
  function pauseBehind() {
    try {
      pausedAnims = document.getAnimations().filter(function (a) {
        var t = a.effect && a.effect.target; return a.playState === "running" && t && !(t.closest && t.closest("#menu"));
      });
      pausedAnims.forEach(function (a) { a.pause(); });
    } catch { pausedAnims = []; }
  }
  function resumeBehind() { pausedAnims.forEach(function (a) { try { a.play(); } catch {} }); pausedAnims = []; }
  function openMenu() {
    var m = $("menu");
    if (!m.hidden && !m.classList.contains("closing")) return;
    renderMenu();
    clearTimeout(menuTimer); clearTimeout(menuFullTimer);
    m.classList.remove("on", "closing"); m.hidden = false;
    try { if (navigator.vibrate) navigator.vibrate(10); } catch {}
    requestAnimationFrame(function () {
      m.classList.add("on");
      $("menuBtn").setAttribute("aria-expanded", "true");
      pushLayer("menu");
      // el trabajo pesado va después de que arranca la animación, no antes
      menuFullTimer = setTimeout(function () { pauseBehind(); try { $("mnClose").focus({ preventScroll: true }); } catch {} }, 360);
    });
  }
  function closeMenuUI() {
    var m = $("menu");
    if (m.hidden || m.classList.contains("closing")) return;
    clearTimeout(menuFullTimer);
    resumeBehind();
    m.classList.remove("on"); m.classList.add("closing");
    $("menuBtn").setAttribute("aria-expanded", "false");
    clearTimeout(menuTimer);
    menuTimer = setTimeout(function () { m.hidden = true; m.classList.remove("closing"); }, 260);
    try { $("menuBtn").focus({ preventScroll: true }); } catch {}
  }
  // Con teclado, Tab se queda dentro del menú (sin tocar el resto de la app, que sería lento)
  $("menu").addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = $("menu").querySelectorAll("button:not([disabled])"); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* ---------- nivel, consejos y guía de bienvenida ---------- */
  var TIPS = [
    "Mantené pulsada una insignia en el selector para ver su información.",
    "Lo que mandás a la papelera queda ahí hasta que la vacíes.",
    "Tronx funciona sin internet: todo se guarda en tu teléfono.",
    "En Constelaciones podés agrupar notas por tema sin moverlas de la lista.",
    "Hacé una copia de seguridad desde el menú para no perder tus notas.",
    "Fijá una nota para que quede siempre arriba de la lista.",
    "Podés crear listas con casillas desde el botón junto a Nueva nota.",
    "Las etiquetas te ayudan a filtrar tus notas con un toque.",
    "Mirá Novedades en el menú para ver qué trae cada versión.",
    "Elegí el tema Blanco o Universo, el color y la letra desde Ajustes."
  ];
  var tipI = Math.floor(Date.now() / 86400000) % TIPS.length;
  var TOURKEY = "tronx.tour";
  var TOUR = [
    { k: "Bienvenido", i: "tierra", t: "Tronx, tu universo de notas", d: "Escribí ideas, listas e historias. Todo se guarda en tu teléfono y funciona sin internet.", c: ["Sin internet", "Privado", "Gratis"] },
    { k: "Notas y listas", i: "cristal", t: "Todo en su lugar", d: "Creá notas libres o listas con casillas. Ponele color y etiquetas, fijá las importantes y archivá las que ya no usás.", c: ["Colores", "Etiquetas", "Fijar", "Archivo"] },
    { k: "Insignias detalladas", i: "galaxia", t: "21 insignias animadas", d: "Elegí una para cada nota. Mantené pulsada una insignia para ver qué es y cómo se mueve.", c: ["Planetas", "Criaturas", "Instrumentos"] },
    { k: "Constelaciones", i: "constelacion", t: "Tus notas, un mapa", d: "Agrupá notas por tema y unilas con líneas. Recorré el mapa con zoom y buscá cualquier estrella.", c: ["Grupos", "Vínculos", "Búsqueda"] },
    { k: "Buscar y ordenar", i: "brujula", t: "Encontrá lo que quieras", d: "Buscá en todo el texto, ordená por fecha, título o color y cambiá entre lista y cuadrícula.", c: ["Búsqueda", "Orden", "Vistas"] },
    { k: "Tus datos", i: "satelite", t: "Siempre a salvo", d: "Exportá una copia cuando quieras e importala en otro teléfono. Lo que borrás queda en la papelera hasta que la vacíes.", c: ["Copia", "Papelera"] },
    { k: "Estilo", i: "luna", t: "Hacela tuya", d: "Elegí el tema Universo o Blanco, el color de acento y la tipografía desde Ajustes y Personalizar.", c: ["Universo", "Blanco", "Acentos"] },
    { k: "Lo que viene", i: "nebulosa", t: "Esto recién empieza", d: "La Tienda de MAX y la Vinculación están en desarrollo. Mirá Novedades en el menú para ver qué trae cada versión.", c: ["Tienda", "Vinculación", "MAX"] }
  ];
  var tourI = 0, tourDir = 1;
  function renderTour() {
    var s = TOUR[tourI], st = $("trStage"), dots = $("trDots");
    if (dots.children.length !== TOUR.length) { dots.textContent = ""; TOUR.forEach(function () { dots.appendChild(el("i")); }); }
    [].forEach.call(dots.children, function (d, i) { d.classList.toggle("on", i === tourI); });
    st.textContent = "";
    var art = el("div", "tr-art"); art.appendChild(iconSpan("s:" + s.i)); st.appendChild(art);
    var mid = el("div"); var kk = el("div", "tr-kick"); kk.textContent = s.k; var tt = el("h2", "tr-title"); tt.textContent = s.t; mid.appendChild(kk); mid.appendChild(tt); st.appendChild(mid);
    var dd = el("p", "tr-text"); dd.textContent = s.d; st.appendChild(dd);
    var ch = el("div", "tr-chips"); s.c.forEach(function (x) { var c = el("span"); c.textContent = x; ch.appendChild(c); }); st.appendChild(ch);
    st.style.setProperty("--dx", (tourDir * 26) + "px");
    st.classList.remove("go"); void st.offsetWidth; st.classList.add("go");
    $("trBack").hidden = tourI === 0;
    $("trNext").textContent = tourI === TOUR.length - 1 ? "Empezar" : "Siguiente";
    $("trSkip").hidden = tourI === TOUR.length - 1;
  }
  function tourGo(d) {
    var n = tourI + d;
    if (n >= TOUR.length) { lsSet(TOURKEY, "1"); closeLayer("tour"); return; }
    if (n < 0) return;
    tourDir = d; tourI = n; renderTour();
  }
  function openTour() {
    if (!$("tour").hidden) return;
    tourI = 0; tourDir = 1; renderTour();
    $("tour").hidden = false; pushLayer("tour");
    try { $("trNext").focus({ preventScroll: true }); } catch {}
  }
  $("trNext").addEventListener("click", function () { tourGo(1); });
  $("trBack").addEventListener("click", function () { tourGo(-1); });
  $("trSkip").addEventListener("click", function () { lsSet(TOURKEY, "1"); closeLayer("tour"); });
  (function () {
    var sx = 0, sy = 0, on = false, stg = $("trStage");
    stg.addEventListener("pointerdown", function (e) { on = true; sx = e.clientX; sy = e.clientY; });
    stg.addEventListener("pointerup", function (e) {
      if (!on) return; on = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) tourGo(dx < 0 ? 1 : -1);
    });
    stg.addEventListener("pointercancel", function () { on = false; });
    document.addEventListener("keydown", function (e) {
      if ($("tour").hidden) return;
      if (e.key === "ArrowRight") tourGo(1); else if (e.key === "ArrowLeft") tourGo(-1);
    });
  })();
  document.addEventListener("tronx:enter", function () {
    if (lsGet(TOURKEY) === "1") return;
    setTimeout(function () { if (lsGet(TOURKEY) !== "1") openTour(); }, 650);
  });
  $("mnTour").addEventListener("click", function () { closeMenuThen(openTour); });
  $("mnTip").addEventListener("click", function () { tipI = (tipI + 1) % TIPS.length; $("mnTipT").textContent = TIPS[tipI]; });
  $("qaNote").addEventListener("click", function () { closeMenuThen(function () { $("newBtn").click(); }); });
  $("qaList").addEventListener("click", function () { closeMenuThen(function () { $("newListBtn").click(); }); });
  $("qaFind").addEventListener("click", function () { closeMenuThen(function () { try { $("q").focus(); $("q").scrollIntoView({ block: "center" }); } catch {} }); });
  $("qaTrash").addEventListener("click", function () { closeMenuThen(function () { var t = document.querySelector('.tab[data-tab="trash"]'); if (t) t.click(); }); });

  function closeMenuThen(fn) { closeLayer("menu"); setTimeout(fn, 300); }
  $("menuBtn").addEventListener("click", openMenu);
  $("mnClose").addEventListener("click", function () { closeLayer("menu"); });
  $("mnScrim").addEventListener("click", function () { closeLayer("menu"); });
  function soon(name) { toast(name + " está en desarrollo"); }
  function openProfile() { pfCat = "Todos"; renderProfile(); pfShow("sum"); $("profile").hidden = false; pushLayer("profile"); }
  $("mnMe").addEventListener("click", function () { closeMenuThen(openProfile); });
  $("mnProfile").addEventListener("click", function () { closeMenuThen(openProfile); });
  $("mnCustom").addEventListener("click", openCustom);
  $("mnStickers").addEventListener("click", function () { closeMenuThen(function () { openStkMgr(""); }); });
  $("mnNews").addEventListener("click", openNews);
  $("mnSettings").addEventListener("click", openSettings);
  $("mnBackup").addEventListener("click", function () {
    openSettings();
    setTimeout(function () { try { $("backupH").scrollIntoView({ block: "start", behavior: "smooth" }); } catch {} }, 80);
  });
  $("mnMap").addEventListener("click", function () { closeMenuThen(function () { if (window.TronxMap) window.TronxMap.open(); }); });

  /* ---------- vinculación: conectar notas entre sí (se ven unidas en Constelaciones) ---------- */
  function noteLabel(n) { return (n.title || "").trim() || (n.type === "list" ? "Lista sin título" : "Sin título"); }
  function linkables() {
    var arr = []; notes.forEach(function (n) { if (!n.trashedAt) arr.push(n); });
    arr.sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    return arr.slice(0, 600);
  }
  function linkKey(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  function linkedSet() {
    var o = {}, m = window.TronxMap ? window.TronxMap.exportData() : { links: [] };
    m.links.forEach(function (p) { o[linkKey(p[0], p[1])] = 1; });
    return o;
  }
  function fillSelect(sel, arr, keep, skip) {
    var prev = keep || sel.value; sel.textContent = "";
    arr.forEach(function (n) {
      if (n.id === skip) return;
      var o = el("option"); o.value = n.id; o.textContent = noteLabel(n).slice(0, 48); sel.appendChild(o);
    });
    if (prev && sel.querySelector('option[value="' + prev + '"]')) sel.value = prev;
  }
  function renderLinks() {
    var arr = linkables(), a = $("lkA"), b = $("lkB");
    fillSelect(a, arr, a.value, null);
    fillSelect(b, arr, b.value, a.value);
    var linked = linkedSet(), msg = $("lkMsg"), go = $("lkGo");
    if (arr.length < 2) { msg.textContent = "Necesitás al menos dos notas para vincularlas."; go.disabled = true; }
    else if (linked[linkKey(a.value, b.value)]) { msg.textContent = "Esas dos notas ya están vinculadas."; go.disabled = true; }
    else { msg.textContent = ""; go.disabled = false; }
    var list = $("lkList"); list.textContent = "";
    var rows = [];
    Object.keys(linked).forEach(function (k) {
      var ids = k.split("|"), n1 = notes.get(ids[0]), n2 = notes.get(ids[1]);
      if (n1 && n2 && !n1.trashedAt && !n2.trashedAt) rows.push([n1, n2]);
    });
    rows.sort(function (x, y) { return noteLabel(x[0]).localeCompare(noteLabel(y[0]), "es"); });
    $("lkH").textContent = "Vinculadas (" + rows.length + ")";
    if (!rows.length) { var li0 = el("li"), p0 = el("p", "lkempty"); p0.textContent = "Todavía no vinculaste ninguna nota."; li0.appendChild(p0); list.appendChild(li0); }
    rows.forEach(function (r) {
      var li = el("li"), pair = el("div", "pair"), s1 = el("span"), em = el("em"), s2 = el("span");
      s1.textContent = noteLabel(r[0]); em.textContent = "vinculada con"; s2.textContent = noteLabel(r[1]);
      pair.appendChild(s1); pair.appendChild(em); pair.appendChild(s2);
      var rm = el("button", "btn small danger"); rm.type = "button"; rm.textContent = "Quitar"; rm.setAttribute("data-nosound", "");
      rm.setAttribute("aria-label", "Quitar el vínculo entre " + noteLabel(r[0]) + " y " + noteLabel(r[1]));
      rm.addEventListener("click", function () {
        if (!window.TronxMap || !window.TronxMap.unlink(r[0].id, r[1].id)) return;
        renderLinks(); renderMenu();
        toast("Vínculo quitado", "Deshacer", function () { if (window.TronxMap.link(r[0].id, r[1].id)) { if (!$("links").hidden) renderLinks(); renderMenu(); } });
      });
      li.appendChild(pair); li.appendChild(rm); list.appendChild(li);
    });
  }
  $("lkA").addEventListener("change", renderLinks);
  $("lkB").addEventListener("change", renderLinks);
  $("lkGo").addEventListener("click", function () {
    if (!window.TronxMap || !window.TronxMap.link($("lkA").value, $("lkB").value)) return;
    renderLinks(); renderMenu();
    toast("Notas vinculadas", "Ver en Constelaciones", function () { closeTo(0); setTimeout(function () { window.TronxMap.open(); }, 380); });
  });
  $("lkMap").addEventListener("click", function () { closeTo(0); setTimeout(function () { if (window.TronxMap) window.TronxMap.open(); }, 380); });
  $("linksClose").addEventListener("click", function () { closeLayer("links"); });
  $("links").addEventListener("click", function (e) { if (e.target === $("links")) closeLayer("links"); });
  $("mnLink").addEventListener("click", function () { soon("La vinculación"); });
  $("themeSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    settings.theme = b.dataset.v; saveSettings(); applyTheme(); renderSettings();
  });
  $("soundSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (window.TronxSound) window.TronxSound.setEnabled(b.dataset.v === "on");
    saveSettings(); renderSettings();
  });
  function testSound() {
    var snd = window.TronxSound;
    if (!snd || !snd.supported) { toast("Este teléfono no permite reproducir este sonido"); return; }
    if (!snd.preview()) { toast("Ya está sonando"); return; }
    setTimeout(function () { if (snd.state() !== "running") toast("El audio del teléfono sigue en pausa. Tocá otra vez"); }, 500);
  }
  $("volSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !window.TronxSound) return;
    window.TronxSound.setVolume(Number(b.dataset.v)); saveSettings(); renderSettings(); testSound();
  });
  $("soundTest").addEventListener("click", testSound);
  $("fabSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.fab = b.dataset.v === "on"; saveSettings(); fabUpdate(); renderSettings(); });
  $("encTitleSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; settings.encTitle = b.dataset.v === "on"; saveSettings(); renderSettings();
    notes.forEach(function (n) { if (n.enc && encMeta.has(n)) encSoon(n); });
  });
  function secureApply() { try { if (window.TronxNative && window.TronxNative.setSecure) window.TronxNative.setSecure(!!settings.secureWin); } catch { /* sin puente */ } }
  $("secureSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.secureWin = b.dataset.v === "on"; saveSettings(); renderSettings(); secureApply(); });
  setTimeout(secureApply, 800);
  $("listSizeSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.listSize = Number(b.dataset.v); saveSettings(); applyTheme(); renderSettings(); });
  $("contrastSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.contrast = b.dataset.v === "on"; saveSettings(); applyTheme(); renderSettings(); });
  $("calmSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.calm = b.dataset.v === "on"; saveSettings(); applyTheme(); renderSettings(); });
  $("quickSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; settings.quickNotif = b.dataset.v === "on"; saveSettings(); renderSettings();
    if (!settings.quickNotif) { quickSync(); return; }
    var plug = ln(); if (!plug) { toast("La notificación fija funciona en la app de Android"); return; }
    plug.requestPermissions().then(function (r) { if (r && r.display === "granted") quickSync(); else { settings.quickNotif = false; saveSettings(); renderSettings(); toast("Sin permiso de notificaciones no se puede dejar la notificación fija"); } }).catch(function () {});
  });
  $("dueSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.dueAlert = b.dataset.v === "on"; saveSettings(); renderSettings(); syncSoon(); });
  $("dueEveSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.dueEve = b.dataset.v === "on"; saveSettings(); renderSettings(); syncSoon(); });
  $("streakSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.streakAlert = b.dataset.v === "on"; saveSettings(); renderSettings(); syncSoon(); });
  $("streakAt").addEventListener("change", function () { if (/^\d{2}:\d{2}$/.test(this.value)) { settings.streakAt = this.value; saveSettings(); syncSoon(); } });
  $("dueAt").addEventListener("change", function () { if (/^\d{2}:\d{2}$/.test(this.value)) { settings.dueAt = this.value; saveSettings(); syncSoon(); } });
  $("swipeSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.swipe = b.dataset.v === "on"; saveSettings(); renderSettings(); });
  $("bgAnimSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    settings.bgAnim = b.dataset.v === "on"; saveSettings(); applyTheme(); renderSettings();
  });
  $("fontSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    settings.font = b.dataset.v; saveSettings(); applyTheme(); renderSettings();
  });
  $("sizeRange").addEventListener("input", function () {
    settings.size = Number($("sizeRange").value); $("sizeVal").textContent = settings.size + " px"; applyTheme();
  });
  $("sizeRange").addEventListener("change", saveSettings);

