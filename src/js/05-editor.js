  /* ---------- editor ---------- */
  var titleEl = $("title"), bodyEl = $("body"), itemsEl = $("items");
  function readOnly() { var n = cur(); return !!(n && n.trashedAt); }
  function updateMeta() {
    var n = cur();
    if (!n) { $("meta").textContent = ""; return; }
    var txt = "Editada " + when(n.updatedAt) + " · ";
    if (n.type === "list") {
      var real = n.items.filter(function (i) { return i.t.trim(); }), done = real.filter(function (i) { return i.done; }).length;
      txt += done + " de " + real.length + (real.length === 1 ? " elemento" : " elementos");
    } else {
      var words = (n.body.trim().match(/\S+/g) || []).length;
      txt += words + (words === 1 ? " palabra" : " palabras") + " · " + n.body.length + " caracteres" + (words > 40 ? " · ~" + Math.max(1, Math.round(words / 200)) + " min de lectura" : "");
    }
    $("meta").textContent = txt;
  }
  function renderTint() {
    var n = cur(), pane = $("pane"), c = n ? colorOf(n.color) : COLORS[0];
    if (c.rgb) pane.style.setProperty("--tint", rgba(c.rgb, 0.12)); else pane.style.removeProperty("--tint");
  }
  /* fondo del editor */
  function renderBg() {
    var n = cur(), fx = $("bgfx"), k = n ? resolveBg(n) : "none";
    if (k === "none") { fx.hidden = true; fx.removeAttribute("data-bg"); return; }
    var cm = CU_RE0.exec(k);
    if (cm) {
      fx.hidden = false; fx.setAttribute("data-bg", "mine");
      var u = stkUrls[cm[1]];
      if (u) fx.style.setProperty("--cuimg", 'url("' + u + '")'); else { fx.style.removeProperty("--cuimg"); stkLoad(cm[1]).then(function (x) { if (x && cur() === n) renderBg(); }); }
      var sz = +cm[3], md = cm[2];
      fx.style.setProperty("--cur", md === "t" ? "repeat" : "no-repeat");
      fx.style.setProperty("--cusize", md === "t" ? Math.round(sz * 2.2 + 20) + "px" : sz + "%");
      fx.style.setProperty("--cupos", md === "e" ? "right 4% bottom 3%" : "center");
      fx.style.setProperty("--cuo", String(+cm[4] / 100));
      return;
    }
    fx.hidden = false; fx.setAttribute("data-bg", k);
  }
  /* barra de progreso de las listas */
  function renderProg() {
    var n = cur(), p = $("prog");
    var real = n && n.type === "list" ? n.items.filter(function (i) { return i.t.trim(); }) : [];
    p.hidden = !real.length;
    if (real.length) p.style.setProperty("--p", Math.round(real.filter(function (i) { return i.done; }).length / real.length * 100) + "%");
  }
  /* plantillas: solo aparecen mientras la nota está vacía */
  function dayLabel() { return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date()); }
  var TEMPLATES = [
    { n: "Diario", e: "🌙", icon: "s:luna", type: "text", tag: "diario", title: function () { return "Diario · " + dayLabel(); },
      body: "Hoy me siento:\n\nLo mejor del día:\n\nAlgo que aprendí:\n\nMañana quiero:\n" },
    { n: "Reunión", e: "📝", icon: "e:📝", type: "text", tag: "reunión", title: "Reunión",
      body: "Fecha y hora:\nParticipantes:\n\nTemas a tratar:\n• \n\nAcuerdos:\n• \n\nPróximos pasos:\n• " },
    { n: "Idea", e: "💡", icon: "s:estrella", type: "text", tag: "ideas", title: "Idea: ",
      body: "La idea en una frase:\n\nPor qué me importa:\n\nPrimer paso:\n\nQué necesito:\n" },
    { n: "Historia", e: "🚀", icon: "s:cohete", type: "text", tag: "historias", title: "Historia: ",
      body: "Personaje:\n\nLugar:\n\nConflicto:\n\nEscena:\n" },
    { n: "Pendientes", e: "✅", icon: "e:✅", type: "list", tag: "pendientes", title: "Pendientes de hoy",
      items: ["Lo más importante", "Responder mensajes", "Hacer ejercicio", "Tomar agua"] },
    { n: "Compras", e: "🛒", icon: "e:🛒", type: "list", tag: "compras", title: "Lista de compras",
      items: ["Frutas y verduras", "Lácteos", "Pan", "Carne o pollo", "Limpieza"] },
    { n: "Receta", e: "🍳", icon: "e:🍳", type: "text", tag: "recetas", title: "Receta: ",
      body: "Porciones:\nTiempo:\n\nIngredientes:\n• \n\nPasos:\n1. \n\nNotas:\n" },
    { n: "Estudio", e: "📚", icon: "e:📚", type: "text", tag: "estudio", title: "Estudio: ",
      body: "Tema:\n\nIdeas clave:\n• \n\nDudas:\n• \n\nPara repasar:\n" },
    { n: "Película", e: "🎬", icon: "e:🎬", type: "text", tag: "películas", title: "Para ver: ",
      body: "Título:\nDónde verla:\nPor qué quiero verla:\n\nMi opinión:\n" },
    { n: "Gastos", e: "💰", icon: "e:💰", type: "text", tag: "gastos", title: "Gastos del mes",
      body: "| Concepto | Monto |\n| --- | --- |\n|  |  |\n|  |  |\n\nTotal:\n" },
    { n: "Hábitos", e: "🔥", icon: "e:🔥", type: "list", tag: "hábitos", title: "Hábitos de hoy",
      items: ["Dormir 8 horas", "Leer 10 minutos", "Caminar", "Estirar", "Escribir el diario"] },
    { n: "Valija", e: "✈️", icon: "e:✈️", type: "list", tag: "viajes", title: "Valija",
      items: ["Documentos", "Cargador y auriculares", "Ropa", "Artículos de higiene", "Medicamentos", "Dinero y tarjetas"] }
  ];
  /* plantillas propias: se guardan aparte y viajan en la copia de seguridad */
  var TPLKEY = "tronx.tpl.v1", myTpls = [];
  function cleanTpl(x) {
    if (!x || typeof x !== "object") return null;
    var items = Array.isArray(x.items) ? x.items.slice(0, 200).map(function (i) { var o = { t: String((i && i.t) != null ? i.t : i || "").slice(0, 500) }; if (i && i.lv === 1) o.lv = 1; return o; }) : [];
    var type = x.type === "list" ? "list" : "text";
    var t = { id: String(x.id || uid()), n: String(x.n || "").trim().slice(0, 24) || "Plantilla", e: String(x.e || "📄").slice(0, 4) || "📄", type: type,
      title: String(x.title || "").slice(0, 300), body: type === "text" ? String(x.body || "").slice(0, 50000) : "", items: type === "list" ? items : [],
      tags: (Array.isArray(x.tags) ? x.tags : []).map(cleanTag).filter(Boolean).slice(0, 8), icon: x.icon ? cleanIcon(x.icon) : "", color: x.color ? colorOf(x.color).k : "", bg: cleanBg(x.bg) };
    return t;
  }
  function loadTpls() { try { var a = JSON.parse(lsGet(TPLKEY) || "[]"); myTpls = Array.isArray(a) ? a.map(cleanTpl).filter(Boolean).slice(0, 30) : []; } catch { myTpls = []; } }
  function saveTpls() { lsSet(TPLKEY, JSON.stringify(myTpls)); tplDirty = true; }
  var tplDirty = true;
  function tplFill(s) {
    var d = new Date();
    return String(s).replace(/\{fecha\}/gi, dayLabel()).replace(/\{hora\}/gi, ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2));
  }
  function applyTemplate(t) {
    var n = cur(); if (!n || n.trashedAt || !isEmptyNote(n)) return;
    n.type = t.type;
    n.title = typeof t.title === "function" ? t.title() : t.title;
    n.body = t.type === "text" ? t.body : "";
    n.items = t.type === "list" ? t.items.map(function (s) { return { id: uid(), t: s, done: false }; }) : [];
    if (t.icon && !n.icon) n.icon = cleanIcon(t.icon);
    if (t.tag && n.tags.indexOf(t.tag) < 0 && n.tags.length < 8) n.tags.push(t.tag);
    if (t.mine) {
      n.title = tplFill(n.title); n.body = tplFill(n.body); n.items.forEach(function (i) { i.t = tplFill(i.t); });
      if (t.items) n.items = t.items.map(function (i) { var o = { id: uid(), t: tplFill(i.t), done: false }; if (i.lv === 1) o.lv = 1; return o; }); if (n.items.length) n.items[0].lv = 0;
      t.tags.forEach(function (g) { if (n.tags.indexOf(g) < 0 && n.tags.length < 8) n.tags.push(g); });
      if (t.color) n.color = t.color; if (t.bg) n.bg = t.bg;
    }
    changed(n); persistNow(); renderEditor(); renderChips(); renderList();
    if (t.type === "text") { bodyEl.focus(); bodyEl.setSelectionRange(bodyEl.value.length, bodyEl.value.length); }
  }
  function renderTpls() {
    var n = cur(), box = $("tpls"), show = !!n && !n.trashedAt && isEmptyNote(n);
    box.hidden = !show;
    var row = $("tplRow");
    if (!show || (row.childNodes.length && !tplDirty)) return;
    row.textContent = ""; tplDirty = false;
    myTpls.map(function (m) { return { n: m.n, e: m.e, mine: true, type: m.type, title: m.title, body: m.body, items: m.items, tags: m.tags, tag: "", icon: m.icon, color: m.color, bg: m.bg }; }).concat(TEMPLATES).forEach(function (t, ti) {
      var b = el("button", "chip tpl" + (t.mine ? " mine" : "")); b.type = "button";
      var e = el("span"); e.setAttribute("aria-hidden", "true"); e.textContent = t.e;
      var l = el("span"); l.textContent = t.n;
      b.appendChild(e); b.appendChild(l);
      b.addEventListener("click", function () { applyTemplate(t); });
      row.appendChild(b);
    });
    var mg = el("button", "chip tpl"); mg.type = "button"; mg.textContent = "⚙ Mis plantillas"; mg.addEventListener("click", openTplMgr); row.appendChild(mg);
  }
  /* guardar la nota actual como plantilla */
  var TS = { title: true, tags: true, look: true };
  function openTplSave() {
    var n = cur(); if (!n || n.trashedAt) return;
    if (isEmptyNote(n)) { toast("La nota está vacía: escribí algo para guardarla como plantilla"); return; }
    if (myTpls.length >= 30) { toast("Ya tenés 30 plantillas: borrá alguna para guardar otra"); return; }
    closeLayer("sheet");
    setTimeout(function () {
      var ic = n.icon && n.icon.indexOf("e:") === 0 ? n.icon.slice(2) : "📄";
      $("tsEmoji").value = ic; $("tsName").value = (n.title || "").trim().slice(0, 24); $("tsSave").disabled = !$("tsName").value.trim();
      [["tsTitle", "title"], ["tsTags", "tags"], ["tsLook", "look"]].forEach(function (p) { TS[p[1]] = true; $(p[0]).setAttribute("aria-pressed", "true"); });
      $("tsTags").hidden = !n.tags.length;
      $("tplSave").hidden = false; pushLayer("tplSave");
    }, 240);
  }
  registerLayer("tplSave", function () { $("tplSave").hidden = true; });
  $("tplSaveBtn").addEventListener("click", openTplSave);
  $("tsClose").addEventListener("click", function () { closeLayer("tplSave"); });
  $("tplSave").addEventListener("click", function (e) { if (e.target === $("tplSave")) closeLayer("tplSave"); });
  $("tsName").addEventListener("input", function () { $("tsSave").disabled = !$("tsName").value.trim(); });
  [["tsTitle", "title"], ["tsTags", "tags"], ["tsLook", "look"]].forEach(function (p) {
    $(p[0]).addEventListener("click", function () { TS[p[1]] = !TS[p[1]]; $(p[0]).setAttribute("aria-pressed", TS[p[1]] ? "true" : "false"); });
  });
  $("tsSave").addEventListener("click", function () {
    var n = cur(); if (!n || !$("tsName").value.trim()) return;
    var t = cleanTpl({ id: uid(), n: $("tsName").value, e: $("tsEmoji").value.trim() || "📄", type: n.type, title: TS.title ? n.title : "", body: n.body,
      items: n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return { t: i.t, lv: i.lv }; }), tags: TS.tags ? n.tags : [], icon: TS.look ? n.icon : "", color: TS.look ? n.color : "", bg: TS.look ? n.bg : "" });
    myTpls.unshift(t); saveTpls(); closeLayer("tplSave"); toast("Plantilla «" + t.n + "» guardada");
  });
  /* gestionar las plantillas propias */
  function renderTplMgr() {
    var box = $("tmList"); box.textContent = "";
    myTpls.forEach(function (t) {
      var r = el("div", "tmrow"), em = el("span", "em"), mid = el("div"), b = el("b"), sub = el("span", "sub"), bt = el("div", "tmb");
      em.textContent = t.e; b.textContent = t.n; sub.textContent = (t.type === "list" ? "Lista · " + t.items.length + " elementos" : "Texto · " + (t.body.match(/\S+/g) || []).length + " palabras") + (t.tags.length ? " · #" + t.tags.join(" #") : "");
      mid.appendChild(b); mid.appendChild(sub);
      function mb(txt, cls, fn) { var x = el("button", "btn small" + (cls ? " " + cls : "")); x.type = "button"; x.textContent = txt; x.addEventListener("click", fn); bt.appendChild(x); }
      mb("Usar", "primary", function () {
        closeLayer("tplMgr"); if (hasLayer("settings")) closeLayer("settings");
        setTimeout(function () { createNote(t.type); applyTemplate({ n: t.n, e: t.e, mine: true, type: t.type, title: t.title, body: t.body, items: t.items, tags: t.tags, tag: "", icon: t.icon, color: t.color, bg: t.bg }); }, 320);
      });
      mb("Renombrar", "", function () {
        if (r.querySelector("input.rn")) return;
        var inp = el("input", "rn"); inp.type = "text"; inp.maxLength = 24; inp.value = t.n; inp.setAttribute("aria-label", "Nuevo nombre"); r.appendChild(inp); inp.focus(); inp.select();
        function done(ok) { if (ok && inp.value.trim()) { t.n = inp.value.trim().slice(0, 24); saveTpls(); } renderTplMgr(); }
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") done(true); else if (e.key === "Escape") { e.stopPropagation(); done(false); } });
        inp.addEventListener("blur", function () { done(true); });
      });
      mb("Borrar", "danger", function () {
        var i = myTpls.indexOf(t); if (i < 0) return; myTpls.splice(i, 1); saveTpls(); renderTplMgr();
        toast("Plantilla borrada", "Deshacer", function () { myTpls.splice(Math.min(i, myTpls.length), 0, t); saveTpls(); if (!$("tplMgr").hidden) renderTplMgr(); });
      });
      r.appendChild(em); r.appendChild(mid); r.appendChild(bt); box.appendChild(r);
    });
    $("tmHint").textContent = myTpls.length ? "Tocá «Usar» para crear una nota nueva con la plantilla. También aparecen al crear una nota vacía." : "Todavía no tenés plantillas propias. Abrí una nota, tocá Personalizar → «Guardar como plantilla» y la vas a ver acá.";
  }
  function openTplMgr() { renderTplMgr(); $("tplMgr").hidden = false; pushLayer("tplMgr"); }
  registerLayer("tplMgr", function () { $("tplMgr").hidden = true; renderTpls(); });
  $("tmClose").addEventListener("click", function () { closeLayer("tplMgr"); });
  $("tplMgr").addEventListener("click", function (e) { if (e.target === $("tplMgr")) closeLayer("tplMgr"); });
  loadTpls();
  function renderTaglines() {
    var n = cur(), box = $("taglines");
    box.textContent = "";
    if (!n) return;
    n.tags.forEach(function (t) { var s = el("span", "tag"); s.textContent = "#" + t; box.appendChild(s); });
    box.hidden = n.tags.length === 0;
  }
  function focusItem(i) {
    var inp = itemsEl.querySelector('.row[data-i="' + i + '"] .itext');
    if (inp) { inp.focus(); var v = inp.value; inp.setSelectionRange(v.length, v.length); }
  }
  function autosize(t) { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }
  var CHECK = '<span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
  function blockEnd(items, i) { var e = i + 1; if (items[i].lv !== 1) while (e < items.length && items[e].lv === 1) e++; return e; }
  function moveItem(n, idx, d) {
    var L = n.items, it = L[idx], to;
    if (it.lv === 1) {
      to = idx + d; if (to < 1 || to >= L.length || L[to].lv !== 1) return;
      L.splice(idx, 1); L.splice(to, 0, it);
    } else {
      var e = blockEnd(L, idx), blk;
      if (d < 0) {
        if (idx === 0) return; var q = idx - 1; while (q > 0 && L[q].lv === 1) q--;
        blk = L.splice(idx, e - idx); L.splice.apply(L, [q, 0].concat(blk)); to = q;
      } else {
        if (e >= L.length) return; var e2 = blockEnd(L, e);
        blk = L.splice(idx, e - idx); to = e2 - blk.length; L.splice.apply(L, [to, 0].concat(blk));
      }
    }
    L[0].lv = 0; changed(n); renderItems(); focusItem(to);
  }
  function setLevel(n, idx, lv) {
    var it = n.items[idx]; if (lv === 1 && idx === 0) return false;
    if ((it.lv === 1 ? 1 : 0) === lv) return false;
    if (lv === 1) it.lv = 1; else delete it.lv;
    changed(n); renderItems(); focusItem(idx); return true;
  }
  /* ordena los bloques (tarea + subtareas): primero las que vencen antes, después las sin fecha, al final las hechas */
  function sortByDue(n) {
    var blocks = [], L = n.items;
    for (var i = 0; i < L.length; i++) { if (L[i].lv === 1 && blocks.length) blocks[blocks.length - 1].push(L[i]); else blocks.push([L[i]]); }
    function key(b) { var m = Infinity; b.forEach(function (x) { if (x.due && x.due < m) m = x.due; }); return (b[0].done ? 2e15 : 0) + (m === Infinity ? 1e15 : m); }
    var ks = blocks.map(function (b, i) { return { b: b, k: key(b), i: i }; }).sort(function (a, c) { return a.k - c.k || a.i - c.i; });
    n.items = [].concat.apply([], ks.map(function (x) { return x.b; })); if (n.items.length) delete n.items[0].lv;
  }
  function pickDate(n, it, row) {
    var inp = el("input", "dpick"); inp.type = "date"; inp.tabIndex = -1; inp.setAttribute("aria-label", "Fecha del elemento");
    if (it.due) inp.value = dayKey(it.due);
    inp.addEventListener("change", function () {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(inp.value);
      if (m) it.due = new Date(+m[1], +m[2] - 1, +m[3], 12).getTime(); else delete it.due;
      changed(n); renderItems();
    });
    inp.addEventListener("blur", function () { setTimeout(function () { if (inp.parentNode) inp.remove(); }, 300); });
    row.appendChild(inp);
    try { if (inp.showPicker) inp.showPicker(); else inp.click(); } catch { inp.click(); }
  }
  function dragItem(e, n, idx, row) {
    if (e.button > 0) return; e.preventDefault();
    var grip = e.currentTarget, rows = [].slice.call(itemsEl.querySelectorAll(".row[data-i]")), L = n.items, s = idx, en = blockEnd(L, idx), target = null;
    try { grip.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    row.classList.add("dragging");
    rows.forEach(function (r) { var k = +r.dataset.i; if (k > s && k < en) r.classList.add("dragging"); });
    function clear() { rows.forEach(function (r) { r.classList.remove("dropline", "dropend"); }); }
    function over(ev) {
      var y = ev.clientY, box = itemsEl.getBoundingClientRect(), pick = null, last = null;
      if (y < box.top + 36) itemsEl.scrollTop -= 14; else if (y > box.bottom - 36) itemsEl.scrollTop += 14;
      clear();
      for (var i = 0; i < rows.length; i++) {
        var k = +rows[i].dataset.i; if (k >= s && k < en) continue;
        if (L[k].lv === 1 && L[s].lv !== 1) { last = rows[i]; continue; }
        var r = rows[i].getBoundingClientRect(); last = rows[i];
        if (y < r.top + r.height / 2) { pick = rows[i]; break; }
      }
      if (pick) { pick.classList.add("dropline"); target = +pick.dataset.i; }
      else { target = L.length; var lastTop = last; if (lastTop) lastTop.classList.add("dropend"); }
    }
    function done(ev, cancel) {
      grip.removeEventListener("pointermove", over); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", cn);
      rows.forEach(function (r) { r.classList.remove("dragging"); }); clear();
      if (cancel || target == null || (target >= s && target <= en)) return;
      var blk = L.splice(s, en - s), t = target >= en ? target - blk.length : target;
      L.splice.apply(L, [t, 0].concat(blk)); L[0].lv = 0;
      changed(n); renderItems();
    }
    function up(ev) { done(ev, false); } function cn(ev) { done(ev, true); }
    grip.addEventListener("pointermove", over); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", cn);
  }
  function renderItems() {
    var n = cur(); itemsEl.textContent = "";
    if (!n || n.type !== "list") return;
    var ro = readOnly(), hide = !!n.hideDone && !ro;
    n.items.forEach(function (it, idx) {
      if (hide && it.done) return;
      var row = el("div", "row" + (it.done ? " done" : "") + (it.lv === 1 ? " lv1" : "")); row.dataset.i = idx;
      if (!ro) {
        var gr = el("span", "grip"); gr.textContent = "⋮⋮"; gr.setAttribute("role", "button"); gr.setAttribute("aria-label", "Arrastrar para reordenar");
        gr.addEventListener("pointerdown", function (e) { dragItem(e, n, idx, row); });
        row.appendChild(gr);
      }
      var cb = el("button", "check"); cb.type = "button"; cb.innerHTML = CHECK;
      cb.setAttribute("role", "checkbox"); cb.setAttribute("aria-checked", it.done ? "true" : "false");
      cb.setAttribute("aria-label", "Marcar como hecho"); cb.disabled = ro;
      cb.addEventListener("click", function () { tickItem(n, it); changed(n); renderItems(); syncSoon(); });
      var inp = el("textarea", "itext"); inp.rows = 1; inp.value = it.t; inp.placeholder = it.lv === 1 ? "Subtarea" : "Elemento";
      inp.readOnly = ro; inp.setAttribute("enterkeyhint", "next"); inp.setAttribute("aria-label", it.lv === 1 ? "Texto de la subtarea" : "Texto del elemento");
      inp.addEventListener("input", function () { it.t = inp.value.replace(/\n/g, " "); autosize(inp); changed(n); });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var ni = { id: uid(), t: "", done: false }; if (it.lv === 1) ni.lv = 1;
          n.items.splice(idx + 1, 0, ni);
          changed(n); renderItems(); focusItem(idx + 1);
        } else if (e.key === "Backspace" && inp.value === "" && it.lv === 1) {
          e.preventDefault(); setLevel(n, idx, 0);
        } else if (e.key === "Backspace" && inp.value === "" && n.items.length > 1) {
          e.preventDefault();
          n.items.splice(idx, 1); if (n.items.length) n.items[0].lv = 0;
          changed(n); renderItems(); focusItem(Math.max(0, idx - 1));
        } else if (e.key === "Tab" && !ro) {
          if (e.shiftKey ? setLevel(n, idx, 0) : setLevel(n, idx, 1)) e.preventDefault();
        }
      });
      var del = el("button", "x"); del.type = "button"; del.textContent = "×"; del.setAttribute("aria-label", "Quitar elemento"); del.disabled = ro;
      del.addEventListener("click", function () {
        n.items.splice(idx, 1);
        if (!n.items.length) n.items.push({ id: uid(), t: "", done: false }); else n.items[0].lv = 0;
        changed(n); renderItems();
      });
      row.appendChild(cb); row.appendChild(inp);
      if (it.lv !== 1) {
        var kids = 0, kd = 0; for (var q = idx + 1; q < n.items.length && n.items[q].lv === 1; q++) if (n.items[q].t.trim()) { kids++; if (n.items[q].done) kd++; }
        if (kids) { var pg = el("span", "subprog" + (kd === kids ? " full" : "")); pg.textContent = kd + "/" + kids; pg.title = "Subtareas hechas"; pg.setAttribute("aria-label", kd + " de " + kids + " subtareas hechas"); row.appendChild(pg); }
      }
      if (it.due) {
        var dc = el("span", "due " + dueStatus(it)), db = el("button"), dx = el("button");
        db.type = "button"; db.textContent = dueText(it.due) + (it.rep ? " ↻" : ""); db.setAttribute("aria-label", "Cambiar fecha: " + dueText(it.due) + (it.rep ? ", se repite " + REP_NAME[it.rep] : "")); db.disabled = ro;
        db.addEventListener("click", function () { pickDate(n, it, row); });
        dx.type = "button"; dx.textContent = "×"; dx.setAttribute("aria-label", "Quitar fecha"); dx.disabled = ro;
        dx.addEventListener("click", function () { delete it.due; changed(n); renderItems(); });
        dc.appendChild(db); dc.appendChild(dx); row.appendChild(dc);
      }
      if (!ro) {
        row.appendChild(del);
        // acciones del elemento que estás editando: nivel, subir / bajar y fecha
        var mv = el("span", "mv");
        function mb(txt, label, dis, fn) { var b = el("button"); b.type = "button"; b.textContent = txt; b.setAttribute("aria-label", label); b.disabled = dis; b.addEventListener("click", fn); mv.appendChild(b); return b; }
        mb("⇤", "Sacar de la subtarea", it.lv !== 1, function () { setLevel(n, idx, 0); });
        mb("⇥", "Convertir en subtarea", idx === 0 || it.lv === 1, function () { setLevel(n, idx, 1); });
        var sp = el("span", "sep"); mv.appendChild(sp);
        var upDis = idx === 0 || (it.lv === 1 && n.items[idx - 1].lv !== 1), dnDis = it.lv === 1 ? !(n.items[idx + 1] && n.items[idx + 1].lv === 1) : blockEnd(n.items, idx) >= n.items.length;
        mb("▲", "Subir elemento", upDis, function () { moveItem(n, idx, -1); });
        mb("▼", "Bajar elemento", dnDis, function () { moveItem(n, idx, 1); });
        sp = el("span", "sep"); mv.appendChild(sp);
        var dbn = mb("Fecha", "Poner fecha al elemento", false, function () { pickDate(n, it, row); }); dbn.style.width = "auto"; dbn.style.padding = "0 8px"; dbn.style.fontSize = "13px"; dbn.classList.add("datebtn");
        var rb = mb("↻", it.rep ? "Se repite " + REP_NAME[it.rep] + ". Cambiar repetición" : "Repetir esta tarea", false, function () {
          if (!it.due) { it.due = new Date().setHours(12, 0, 0, 0); }
          var nx = REP_NEXT[it.rep || ""]; if (nx) it.rep = nx; else delete it.rep;
          changed(n); renderItems(); syncSoon(); toast(it.rep ? "Se repite " + REP_NAME[it.rep] : "Sin repetición");
        }); rb.style.width = "auto"; rb.style.padding = "0 8px"; if (it.rep) rb.classList.add("on");
        mv.addEventListener("mousedown", function (e) { e.preventDefault(); });
        row.appendChild(mv);
      }
      itemsEl.appendChild(row);
    });
    if (!ro) {
      var tools = el("div", "itemtools");
      var add = el("button", "btn small"); add.type = "button"; add.textContent = "+ Agregar elemento";
      add.addEventListener("click", function () {
        n.items.push({ id: uid(), t: "", done: false }); changed(n); renderItems(); focusItem(n.items.length - 1);
      });
      tools.appendChild(add);
      if (n.items.some(function (i) { return i.due; }) && n.items.filter(function (i) { return i.lv !== 1 && i.t.trim(); }).length > 1) {
        var sb = el("button", "btn small"); sb.type = "button"; sb.textContent = "Ordenar por fecha";
        sb.addEventListener("click", function () { sortByDue(n); changed(n); renderItems(); toast("Ordenadas por fecha de vencimiento"); });
        tools.appendChild(sb);
      }
      var realN = n.items.filter(function (i) { return i.t.trim(); });
      if (realN.length > 1) {
        var allDone = realN.every(function (i) { return i.done; });
        var all = el("button", "btn small"); all.type = "button"; all.textContent = allDone ? "Desmarcar todo" : "Marcar todo";
        all.addEventListener("click", function () {
          n.items.forEach(function (i) { if (i.t.trim()) i.done = !allDone; });
          changed(n); renderItems();
        });
        tools.appendChild(all);
      }
      var doneCount = n.items.filter(function (i) { return i.done; }).length;
      if (doneCount || n.hideDone) {
        var hb = el("button", "btn small hidebtn"); hb.type = "button"; hb.setAttribute("aria-pressed", n.hideDone ? "true" : "false");
        hb.textContent = n.hideDone ? "Mostrar hechos (" + doneCount + ")" : "Ocultar hechos";
        hb.addEventListener("click", function () { n.hideDone = !n.hideDone; changed(n); renderItems(); });
        tools.appendChild(hb);
      }
      if (doneCount) {
        var clr = el("button", "btn small"); clr.type = "button"; clr.textContent = "Quitar hechos (" + doneCount + ")";
        clr.addEventListener("click", function () {
          n.items = n.items.filter(function (i) { return !i.done; });
          if (!n.items.length) n.items.push({ id: uid(), t: "", done: false }); else n.items[0].lv = 0;
          changed(n); renderItems();
        });
        tools.appendChild(clr);
      }
      itemsEl.appendChild(tools);
    }
    requestAnimationFrame(function () { itemsEl.querySelectorAll(".itext").forEach(autosize); });
  }
  function renderEditor() {
    var n = cur(), has = !!n;
    $("blank").hidden = has;
    $("doc").hidden = !has; $("meta").hidden = !has;
    $("saveBtn").hidden = !has || readOnly();
    $("pinBtn").hidden = !has || readOnly();
    $("moreBtn").hidden = !has || readOnly();
    $("trashbar").hidden = !(has && readOnly());
    $("findBar").hidden = true; var fb0 = document.querySelector('[data-ins="find"]'); fb0 && fb0.setAttribute("aria-pressed", "false"); findIdx = -1;
    $("hlRow").hidden = true; var hb0 = document.querySelector('[data-ins="hl"]'); hb0 && hb0.setAttribute("aria-pressed", "false");
    if (!has) { selImg = null; imgsEl.textContent = ""; $("imgrow").hidden = true; $("imgPanel").hidden = true; contentEl.classList.remove("imgs"); $("rel").hidden = true; $("crumb").hidden = true; $("sugg").hidden = true; titleEl.value = ""; bodyEl.value = ""; itemsEl.textContent = ""; renderTint(); renderBg(); renderProg(); renderTpls(); $("fmt").hidden = true; renderTaglines(); renderIconBtn(); updateMeta(); return; }
    if (!baseline || baseline.id !== n.id) baseline = snapOf(n);
    var ro = readOnly(), isList = n.type === "list";
    $("fmt").hidden = isList || ro;
    titleEl.value = n.title; titleEl.readOnly = ro;
    titleEl.placeholder = isList ? "Poné un título a tu lista" : "Poné un título a tu nota";
    $("contentLabel").textContent = isList ? "Elementos de la lista" : "Contenido";
    bodyEl.hidden = isList; itemsEl.hidden = !isList;
    bodyEl.value = n.body; bodyEl.readOnly = ro;
    setReading(false); histReset();
    $("pinBtn").setAttribute("aria-pressed", n.pinned ? "true" : "false");
    $("pinBtn").textContent = n.pinned ? "Fijada" : "Fijar";
    renderItems(); renderTint(); renderBg(); renderProg(); renderTpls(); renderTaglines(); renderIconBtn(); updateMeta(); renderRel(); selImg = null; renderImages();
  }

  titleEl.addEventListener("focus", function () { var n = cur(); titleEl.dataset.old = n ? n.title : ""; });
  titleEl.addEventListener("input", function () { var n = cur(); if (!n || n.trashedAt) return; n.title = titleEl.value; changed(n); });
  /* al renombrar una nota se actualizan los enlaces [[...]] que apuntaban al nombre anterior */
  titleEl.addEventListener("change", function () {
    var n = cur(), old = (titleEl.dataset.old || "").trim(), nw = titleEl.value.trim(); titleEl.dataset.old = titleEl.value;
    if (!n || n.trashedAt || !old || !nw || old.toLowerCase() === nw.toLowerCase()) return;
    var re = new RegExp("\\[\\[" + old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\]\\]", "gi"), cnt = 0;
    notes.forEach(function (o) {
      if (o.id === n.id || o.trashedAt || o.lock) return;
      if (o.type === "list") { o.items.forEach(function (i) { var t = i.t.replace(re, function () { cnt++; return "[[" + nw + "]]"; }); if (t !== i.t) { i.t = t; o.updatedAt = Date.now(); } }); }
      else { var b = o.body.replace(re, function () { cnt++; return "[[" + nw + "]]"; }); if (b !== o.body) { o.body = b; o.updatedAt = Date.now(); } }
    });
    if (cnt) { persistNow(); renderList(); toast("Actualicé " + cnt + (cnt === 1 ? " enlace" : " enlaces") + " a esta nota"); }
  });
  bodyEl.addEventListener("input", function () { var n = cur(); if (!n || n.trashedAt) return; n.body = bodyEl.value; changed(n); histSoon(); });

  /* Enlaces entre notas, subnotas y tablas */
  function findByTitle(t) {
    t = String(t || "").trim().toLowerCase(); if (!t) return null;
    var hit = null;
    notes.forEach(function (n) { if (!hit && !n.trashedAt && n.title.trim().toLowerCase() === t) hit = n; });
    return hit;
  }
  function chipBtn(label, fn, cls) { var c = el("button", "chip" + (cls ? " " + cls : "")); c.type = "button"; c.textContent = label; c.addEventListener("click", fn); return c; }
  function renderRel() {
    var n = cur(), box = $("rel"), cr = $("crumb");
    box.textContent = ""; cr.textContent = "";
    if (!n || n.trashedAt) { box.hidden = true; cr.hidden = true; return; }
    var pr = n.parent && notes.get(n.parent);
    cr.hidden = !(pr && !pr.trashedAt);
    if (!cr.hidden) { var cb = el("button"); cb.type = "button"; cb.textContent = "↳ dentro de «" + (pr.title.trim() || "Sin título") + "»"; cb.addEventListener("click", function () { openNote(pr.id); }); cr.appendChild(cb); }
    var kids = Array.from(notes.values()).filter(function (k) { return k.parent === n.id && !k.trashedAt; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
    var back = [], tl = n.title.trim().toLowerCase();
    if (tl) notes.forEach(function (o) {
      if (o.id === n.id || o.trashedAt || o.lock) return;
      var txt = o.type === "list" ? o.items.map(function (i) { return i.t; }).join("\n") : o.body;
      if (txt.toLowerCase().indexOf("[[" + tl + "]]") >= 0) back.push(o);
    });
    var ment = [];
    if (tl.length >= 4) notes.forEach(function (o) {
      if (o.id === n.id || o.trashedAt || o.lock || back.indexOf(o) >= 0 || ment.length >= 6) return;
      var txt = (o.type === "list" ? o.items.map(function (i) { return i.t; }).join("\n") : o.body).toLowerCase();
      if (txt.indexOf(tl) >= 0) ment.push(o);
    });
    if (kids.length) { var l1 = el("span", "lbl"); l1.textContent = "Subnotas"; box.appendChild(l1); }
    kids.forEach(function (k) { box.appendChild(chipBtn(k.title.trim() || "Sin título", function () { openNote(k.id); })); });
    box.appendChild(chipBtn("+ Subnota", function () {
      if (isEmptyNote(n)) { toast("Escribí algo en esta nota antes de agregarle subnotas"); return; }
      createNote("text", { parent: n.id, folder: n.folder });
    }, "add"));
    if (back.length) { var l2 = el("span", "lbl"); l2.textContent = "Enlazada desde"; box.appendChild(l2); }
    back.forEach(function (o) { box.appendChild(chipBtn(o.title.trim() || "Sin título", function () { openNote(o.id); })); });
    if (ment.length) { var l3 = el("span", "lbl"); l3.textContent = "Mencionada en"; box.appendChild(l3); }
    ment.forEach(function (o) { box.appendChild(chipBtn(o.title.trim() || "Sin título", function () { openNote(o.id); })); });
    box.hidden = false;
  }
  function updateSugg() {
    var box = $("sugg"), n = cur();
    var m = (!readMode && n && n.type === "text" && !n.trashedAt) ? bodyEl.value.slice(0, bodyEl.selectionStart).match(/\[\[([^\]\n]*)$/) : null;
    if (!m) { box.hidden = true; return; }
    var term = m[1].toLowerCase(), c = [];
    notes.forEach(function (o) { if (o.id !== n.id && !o.trashedAt && o.title.trim() && o.title.toLowerCase().indexOf(term) >= 0) c.push(o); });
    c.sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    box.textContent = "";
    if (!c.length) { var e = el("span", "lbl"); e.textContent = term ? "Ninguna nota se llama así: al tocar el enlace en Leer se crea" : "Todavía no hay otras notas con título"; box.appendChild(e); }
    c.slice(0, 8).forEach(function (o) {
      box.appendChild(chipBtn(o.title.trim(), function () {
        var v = bodyEl.value, s = bodyEl.selectionStart, a = s - m[1].length, t = o.title.trim();
        var tail = v.slice(s, s + 2) === "]]" ? 2 : 0;
        bodyEl.setRangeText(t + "]]", a, s + tail, "end");
        fireInput(); histNow(); box.hidden = true; bodyEl.focus();
      }));
    });
    box.hidden = false;
  }
  $("sugg").addEventListener("mousedown", function (e) { e.preventDefault(); });
  ["input", "keyup", "click"].forEach(function (ev) { bodyEl.addEventListener(ev, updateSugg); });
  function insertTable() {
    var v = bodyEl.value, s = bodyEl.selectionStart, pre = (s > 0 && v.charAt(s - 1) !== "\n") ? "\n" : "";
    var t = pre + "| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n|  |  |  |\n";
    bodyEl.setRangeText(t, s, bodyEl.selectionEnd, "end");
    var c = s + t.length - 8; bodyEl.setSelectionRange(c, c);
  }
  /* agrega una fila o una columna a la tabla donde está el cursor */
  function tableGrow(col) {
    var v = bodyEl.value, pos = bodyEl.selectionStart, ls = v.split("\n"), off = 0, ci = 0;
    for (var k = 0; k < ls.length; k++) { if (pos <= off + ls[k].length) { ci = k; break; } off += ls[k].length + 1; ci = k; }
    var isT = function (l) { return /^\s*\|.*\|\s*$/.test(l); };
    if (!isT(ls[ci])) { toast("Poné el cursor dentro de una tabla"); return; }
    var a = ci, b = ci; while (a > 0 && isT(ls[a - 1])) a--; while (b < ls.length - 1 && isT(ls[b + 1])) b++;
    if (col) {
      var nc = ls[a].trim().replace(/^\||\|$/g, "").split("|").length + 1;
      for (var r = a; r <= b; r++) {
        var cells = ls[r].trim().replace(/^\||\|$/g, "").split("|"), sep = cells.every(function (c) { return /^\s*:?-{2,}:?\s*$/.test(c); });
        ls[r] = "|" + cells.join("|") + "|" + (sep ? " --- |" : r === a ? " Columna " + nc + " |" : "  |");
      }
    } else {
      var w = ls[ci].trim().replace(/^\||\|$/g, "").split("|").length, at = ci === a && ls[a + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(ls[a + 1]) ? a + 1 : ci;
      ls.splice(at + 1, 0, "|" + new Array(w + 1).join("  |"));
    }
    bodyEl.value = ls.join("\n"); bodyEl.setSelectionRange(pos, pos);
  }
  function insertLink() {
    var v = bodyEl.value, s = bodyEl.selectionStart, e = bodyEl.selectionEnd;
    if (s !== e) { bodyEl.setRangeText("[[" + v.slice(s, e) + "]]", s, e, "end"); return; }
    bodyEl.setRangeText("[[]]", s, e, "end"); bodyEl.setSelectionRange(s + 2, s + 2);
  }

