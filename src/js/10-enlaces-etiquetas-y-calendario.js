  /* ---------- mapa de enlaces ---------- */
  var LM = { nodes: [], edges: [], vb: null, sel: null, w: 1000, h: 1000 };
  function lmBuild() {
    var byTitle = {}, list = [], missing = {};
    notes.forEach(function (n) { if (n.trashedAt) return; list.push(n); var t = n.title.trim().toLowerCase(); if (t && !byTitle[t]) byTitle[t] = n; });
    var edges = [], seen = {};
    function add(a, b, kind) { if (a === b) return; var k = a < b ? a + "|" + b : b + "|" + a; if (seen[k]) { if (kind === "link") seen[k].kind = "link"; return; } seen[k] = { a: a, b: b, kind: kind }; edges.push(seen[k]); }
    list.forEach(function (n) {
      if (n.parent && notes.has(n.parent) && !notes.get(n.parent).trashedAt) add(n.id, n.parent, "sub");
      if (n.lock) return; // no se lee el contenido de una nota protegida
      var txt = n.type === "list" ? n.items.map(function (i) { return i.t; }).join("\n") : n.body, re = /\[\[([^\]\n]+?)\]\]/g, m;
      while ((m = re.exec(txt))) {
        var t = m[1].trim().toLowerCase(), tgt = byTitle[t];
        if (tgt) add(n.id, tgt.id, "link"); else if (t) missing[m[1].trim()] = (missing[m[1].trim()] || 0) + 1;
      }
    });
    var deg = {}; edges.forEach(function (e) { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });
    var conn = list.filter(function (n) { return deg[n.id]; }).sort(function (a, b) { return deg[b.id] - deg[a.id]; }).slice(0, 150);
    var keep = {}; conn.forEach(function (n) { keep[n.id] = 1; });
    return { conn: conn, edges: edges.filter(function (e) { return keep[e.a] && keep[e.b]; }), deg: deg, orph: list.filter(function (n) { return !deg[n.id]; }), missing: missing, total: list.length };
  }
  function lmLayout(nodes, edges) {
    var n = nodes.length, W = 1000, H = 1000, k = Math.min(130, Math.sqrt(W * H / Math.max(1, n)) * 0.75), idx = {};
    nodes.forEach(function (d, i) { idx[d.id] = i; var a = i / n * Math.PI * 2, r = 120 + (i % 7) * 55; d.x = W / 2 + Math.cos(a) * r; d.y = H / 2 + Math.sin(a) * r; d.dx = d.dy = 0; });
    var es = edges.map(function (e) { return [idx[e.a], idx[e.b]]; });
    var iters = n > 100 ? 90 : 160, t = W / 8;
    for (var it = 0; it < iters; it++) {
      var i, j;
      for (i = 0; i < n; i++) { nodes[i].dx = nodes[i].dy = 0; }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2), f = k * k / d / d;
        nodes[i].dx += dx * f; nodes[i].dy += dy * f; nodes[j].dx -= dx * f; nodes[j].dy -= dy * f;
      }
      es.forEach(function (e) {
        var A = nodes[e[0]], B = nodes[e[1]], dx = A.x - B.x, dy = A.y - B.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = d / k;
        A.dx -= dx * f; A.dy -= dy * f; B.dx += dx * f; B.dy += dy * f;
      });
      for (i = 0; i < n; i++) {
        var N = nodes[i]; N.dx += (W / 2 - N.x) * 0.02; N.dy += (H / 2 - N.y) * 0.02;
        var l = Math.sqrt(N.dx * N.dx + N.dy * N.dy) + 0.01, s = Math.min(l, t) / l; N.x += N.dx * s; N.y += N.dy * s;
      }
      t *= 0.97;
    }
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function lmApplyVB() {
    var v = LM.vb, svg = $("lmSvg"), sc = v.w / (svg.getBoundingClientRect().width || 360);
    svg.setAttribute("viewBox", v.x + " " + v.y + " " + v.w + " " + v.h);
    svg.querySelectorAll("g.nd").forEach(function (g) {
      var c = g.firstChild, t = g.lastChild, r = Number(c.dataset.r) * sc, cy = Number(c.getAttribute("cy"));
      c.setAttribute("r", r); t.style.fontSize = (12 * sc) + "px"; t.setAttribute("y", cy + r + 14 * sc); t.style.strokeWidth = (3 * sc) + "px";
    });
  }
  function lmFit() {
    var ns = LM.nodes; if (!ns.length) { LM.vb = { x: 0, y: 0, w: 1000, h: 1000 }; lmApplyVB(); return; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; ns.forEach(function (d) { x0 = Math.min(x0, d.x); y0 = Math.min(y0, d.y); x1 = Math.max(x1, d.x); y1 = Math.max(y1, d.y); });
    var pad = 70, w = Math.max(200, x1 - x0 + pad * 2), h = Math.max(200, y1 - y0 + pad * 2), box = $("lmSvg").getBoundingClientRect(), ar = (box.width || 360) / (box.height || 300);
    if (w / h < ar) { var nw = h * ar; x0 -= (nw - (x1 - x0 + pad * 2)) / 2; w = nw; } else { var nh = w / ar; y0 -= (nh - (y1 - y0 + pad * 2)) / 2; h = nh; }
    LM.vb = { x: x0 - pad, y: y0 - pad, w: w, h: h }; lmApplyVB();
  }
  function lmSelect(id) {
    LM.sel = id; var svg = $("lmSvg"), nb = {};
    if (id) LM.edges.forEach(function (e) { if (e.a === id) nb[e.b] = 1; if (e.b === id) nb[e.a] = 1; });
    svg.querySelectorAll("g.nd").forEach(function (g) { var gid = g.dataset.id; g.classList.toggle("sel", gid === id); g.classList.toggle("dim", !!id && gid !== id && !nb[gid]); var t = g.querySelector("text"); t.style.display = (!id && !LM.many) || gid === id || nb[gid] ? "" : "none"; });
    svg.querySelectorAll("line").forEach(function (l) { l.classList.toggle("hi", !!id && (l.dataset.a === id || l.dataset.b === id)); });
    var box = $("lmSel"); box.hidden = !id;
    if (id) { var n = notes.get(id); $("lmSelT").textContent = (n.lock ? "🔒 " : "") + noteLabel(n); var c = Object.keys(nb).length; $("lmSelC").textContent = c + (c === 1 ? " conexión" : " conexiones"); }
  }
  function renderLinkMap() {
    var d = lmBuild(), svg = $("lmSvg"); svg.textContent = "";
    LM.nodes = d.conn.map(function (n) { return { id: n.id, n: n }; });
    LM.edges = d.edges; LM.many = LM.nodes.length > 40;
    lmLayout(LM.nodes, LM.edges);
    var pos = {}; LM.nodes.forEach(function (o) { pos[o.id] = o; });
    LM.edges.forEach(function (e) { var A = pos[e.a], B = pos[e.b]; svg.appendChild(sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, "class": e.kind === "sub" ? "sub" : "", "data-a": e.a, "data-b": e.b })); });
    LM.nodes.forEach(function (o) {
      var g = sv("g", { "class": "nd", "data-id": o.id }), c = colorOf(o.n.color), r = Math.min(18, 7 + (d.deg[o.id] || 0) * 2);
      var ci = sv("circle", { cx: o.x, cy: o.y, r: r, "data-r": r }); ci.style.fill = c.rgb ? "rgb(" + c.rgb.join(",") + ")" : "var(--accent)";
      var tx = sv("text", { x: o.x, y: o.y + r + 13 }); tx.textContent = (o.n.lock ? "🔒 " : "") + noteLabel(o.n).slice(0, 18);
      g.appendChild(ci); g.appendChild(tx); g.addEventListener("click", function (ev) { ev.stopPropagation(); lmSelect(LM.sel === o.id ? null : o.id); }); svg.appendChild(g);
    });
    var nl = d.edges.filter(function (e) { return e.kind === "link"; }).length;
    $("lmHint").textContent = d.total ? LM.nodes.length + " notas conectadas · " + nl + " enlaces [[ ]] · " + (d.edges.length - nl) + " subnotas (línea punteada). Tocá una nota para ver con quién se conecta." : "Todavía no tenés notas.";
    if (!LM.nodes.length && d.total) $("lmHint").textContent = "Todavía no hay notas conectadas. Escribí [[Título de otra nota]] en una nota, o creá una subnota, y aparecerán acá.";
    svg.parentNode.hidden = !LM.nodes.length;
    var oc = $("lmOrph"); oc.textContent = ""; $("lmOrphT").hidden = !d.orph.length; oc.hidden = !d.orph.length;
    d.orph.slice(0, 60).forEach(function (n) { var b = el("button", "chip"); b.type = "button"; b.textContent = (n.lock ? "🔒 " : "") + noteLabel(n).slice(0, 28); b.addEventListener("click", function () { closeTo(0); setTimeout(function () { openNote(n.id); }, 380); }); oc.appendChild(b); });
    if (d.orph.length > 60) { var more = el("span", "hint"); more.textContent = "y " + (d.orph.length - 60) + " más"; oc.appendChild(more); }
    var mc = $("lmMiss"), mk = Object.keys(d.missing); mc.textContent = ""; $("lmMissT").hidden = mc.hidden = !mk.length;
    mk.slice(0, 40).forEach(function (t) { var b = el("button", "chip"); b.type = "button"; b.textContent = "[[" + t.slice(0, 26) + "]]"; b.setAttribute("aria-label", "Crear la nota " + t); b.addEventListener("click", function () { closeTo(0); setTimeout(function () { createNote("text", { title: t }); }, 380); }); mc.appendChild(b); });
    LM.sel = null; $("lmSel").hidden = true; lmSelect(null); lmFit();
  }
  function openLinkMap() { $("linkMap").hidden = false; pushLayer("linkMap"); renderLinkMap(); }
  registerLayer("linkMap", function () { $("linkMap").hidden = true; });
  $("lmClose").addEventListener("click", function () { closeLayer("linkMap"); });
  $("linkMap").addEventListener("click", function (e) { if (e.target === $("linkMap")) closeLayer("linkMap"); });
  $("lmOpen").addEventListener("click", function () { var id = LM.sel; if (!id) return; closeTo(0); setTimeout(function () { openNote(id); }, 380); });
  function lmZoom(f) { var v = LM.vb; if (!v) return; var cx = v.x + v.w / 2, cy = v.y + v.h / 2; v.w *= f; v.h *= f; v.x = cx - v.w / 2; v.y = cy - v.h / 2; lmApplyVB(); }
  $("lmIn").addEventListener("click", function () { lmZoom(0.75); });
  $("lmOut").addEventListener("click", function () { lmZoom(1.33); });
  $("lmFit").addEventListener("click", lmFit);
  (function () {
    var svg = $("lmSvg"), drag = null, pts = {}, pinch = 0;
    svg.addEventListener("pointerdown", function (e) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; drag = { x: e.clientX, y: e.clientY, moved: false }; if (Object.keys(pts).length === 2) { var k = Object.keys(pts); pinch = Math.hypot(pts[k[0]].x - pts[k[1]].x, pts[k[0]].y - pts[k[1]].y); } });
    svg.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return;
      var prev = pts[e.pointerId]; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ks = Object.keys(pts), box = svg.getBoundingClientRect();
      if (ks.length === 2 && pinch) { var nd = Math.hypot(pts[ks[0]].x - pts[ks[1]].x, pts[ks[0]].y - pts[ks[1]].y); if (nd > 0) { lmZoom(pinch / nd); pinch = nd; } return; }
      if (!drag || !LM.vb) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      if (!drag.moved) { drag.moved = true; try { svg.setPointerCapture(e.pointerId); } catch {} }
      var sc = LM.vb.w / (box.width || 1); LM.vb.x -= (e.clientX - prev.x) * sc; LM.vb.y -= (e.clientY - prev.y) * sc; lmApplyVB();
    });
    function up(e) { delete pts[e.pointerId]; pinch = 0; if (drag && !drag.moved && !Object.keys(pts).length && e.target === svg) lmSelect(null); if (!Object.keys(pts).length) drag = null; }
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
    svg.addEventListener("wheel", function (e) { e.preventDefault(); lmZoom(e.deltaY > 0 ? 1.15 : 0.87); }, { passive: false });
  })();
  $("mnLinkMap").addEventListener("click", function () { closeMenuThen(openLinkMap); });

  /* ---------- etiquetas y carpetas ---------- */
  function orgCounts(kind) {
    var map = {};
    notes.forEach(function (n) {
      if (n.trashedAt) return;
      if (kind === "tag") n.tags.forEach(function (t) { map[t] = (map[t] || 0) + 1; }); else if (n.folder) map[n.folder] = (map[n.folder] || 0) + 1;
    });
    return map;
  }
  function orgSnap(kind, name) {
    var snap = [];
    notes.forEach(function (n) { if (kind === "tag" ? n.tags.indexOf(name) >= 0 : n.folder === name) snap.push({ n: n, tags: n.tags.slice(), folder: n.folder, at: n.updatedAt }); });
    return snap;
  }
  function orgUndo(snap) { return function () { snap.forEach(function (s) { s.n.tags = s.tags; s.n.folder = s.folder; s.n.updatedAt = s.at; }); schedulePersist(); orgRefresh(); }; }
  function orgRefresh() { renderChips(); renderFolders(); renderList(); renderOrg(); }
  function orgApply(kind, name, neu) {
    var snap = orgSnap(kind, name), nn = kind === "tag" ? cleanTag(neu) : cleanFolder(neu);
    if (nn === name) return;
    snap.forEach(function (s) {
      var n = s.n;
      if (kind === "tag") { n.tags = n.tags.map(function (t) { return t === name ? nn : t; }).filter(function (t, i, a) { return t && a.indexOf(t) === i; }); }
      else n.folder = nn;
      changed(n);
    });
    if (kind === "tag" && tagFilter === name) tagFilter = nn || null;
    if (kind === "folder" && folderFilter === name) folderFilter = nn || null;
    orgRefresh();
    toast(!nn ? "Se quitó «" + name + "» de " + snap.length + (snap.length === 1 ? " nota" : " notas") : "«" + name + "» ahora es «" + nn + "»", "Deshacer", orgUndo(snap));
  }
  function renderOrg() {
    [["tag", "orgTags", "Todavía no usaste etiquetas."], ["folder", "orgFolders", "Todavía no usaste carpetas."]].forEach(function (k) {
      var box = $(k[1]), map = orgCounts(k[0]), names = Object.keys(map).sort(function (a, b) { return a.localeCompare(b, "es"); }); box.textContent = "";
      if (!names.length) { var p0 = el("p", "none"); p0.textContent = k[2]; box.appendChild(p0); return; }
      names.forEach(function (name) {
        var row = el("div", "orow"), nm = el("span", "nm"); nm.textContent = (k[0] === "tag" ? "#" : "▣ ") + name;
        var ct = el("span", "ct"); ct.textContent = map[name];
        var rn = el("button", "btn small"); rn.type = "button"; rn.textContent = "Renombrar";
        var del = el("button", "btn small danger"); del.type = "button"; del.textContent = "Quitar"; del.setAttribute("aria-label", "Quitar " + name + " de todas las notas");
        del.addEventListener("click", function () { orgApply(k[0], name, ""); });
        rn.addEventListener("click", function () {
          var inp = el("input"); inp.type = "text"; inp.value = name; inp.maxLength = k[0] === "tag" ? 24 : 30; inp.setAttribute("aria-label", "Nuevo nombre");
          var ok = el("button", "btn small primary"); ok.type = "button"; ok.textContent = "Guardar";
          row.textContent = ""; row.appendChild(inp); row.appendChild(ok); inp.focus(); inp.select();
          function go() { orgApply(k[0], name, inp.value); }
          ok.addEventListener("click", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); else if (e.key === "Escape") renderOrg(); });
        });
        row.appendChild(nm); row.appendChild(ct); row.appendChild(rn); row.appendChild(del); box.appendChild(row);
      });
    });
  }
  function openOrg() { renderOrg(); $("orgMgr").hidden = false; pushLayer("orgMgr"); }
  registerLayer("orgMgr", function () { $("orgMgr").hidden = true; });
  $("orgClose").addEventListener("click", function () { closeLayer("orgMgr"); });
  $("orgMgr").addEventListener("click", function (e) { if (e.target === $("orgMgr")) closeLayer("orgMgr"); });

  /* ---------- acciones nativas (atajos del ícono, widget), notificación fija y texto del widget ---------- */
  var actSeen = {}, QUICK_ID = 2147000001, QUICK_CH = "acceso-rapido";
  function processActs() {
    var q = window.__tronxActs; if (!Array.isArray(q)) return;
    q.splice(0).forEach(function (a) {
      if (!a || actSeen[a.id]) return; actSeen[a.id] = 1;
      if (a.a === "list") createNote("list"); else if (a.a === "dictate") { createNote("text"); setTimeout(dictate, 500); } else createNote("text");
    });
  }
  window.addEventListener("tronxact", processActs);
  setTimeout(processActs, 900);
  function quickSync() {
    var plug = ln(); if (!plug) return;
    if (!settings.quickNotif) { plug.cancel({ notifications: [{ id: QUICK_ID }] }).catch(function () {}); return; }
    plug.checkPermissions().then(function (r) {
      if (!r || r.display !== "granted") return;
      return plug.createChannel({ id: QUICK_CH, name: "Acceso rápido", description: "Notificación fija para crear una nota", importance: 2, visibility: 1 }).catch(function () {}).then(function () {
        return plug.schedule({ notifications: [{ id: QUICK_ID, title: "Tronx", body: "Tocá para escribir una nota nueva", channelId: QUICK_CH, smallIcon: "ic_stat_tronx", iconColor: "#7c5cff", ongoing: true, autoCancel: false, extra: { quick: "note" } }] });
      });
    }).catch(function () {});
  }
  setTimeout(quickSync, 3000);
  var widgetT = 0;
  function widgetPush() {
    var nat = window.TronxNative; if (!nat || typeof nat.setWidget !== "function") return;
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var d0 = t0.getTime(), list = [];
    notes.forEach(function (n) {
      if (n.trashedAt || n.lock) return;
      n.items.forEach(function (it) { if (it.due && !it.done && it.t.trim() && Math.round((new Date(it.due).setHours(0, 0, 0, 0) - d0) / 86400000) <= 0) list.push(it); });
    });
    list.sort(function (a, b) { return a.due - b.due; });
    try { nat.setWidget(list.length ? "Mi día: " + list.length + (list.length === 1 ? " tarea" : " tareas") : "Mi día: sin tareas pendientes", list.length ? list[0].t.slice(0, 80) : "Tocá Nota, Lista o Dictar"); } catch { /* sin puente */ }
  }
  function widgetSoon() { clearTimeout(widgetT); widgetT = setTimeout(widgetPush, 1500); }
  setTimeout(widgetSoon, 1200);

  /* ---------- modo enfoque ---------- */
  var focusOn = false, focusT0 = 0, focusAcc = 0, focusTick = 0, focusW0 = 0;
  function bodyWords() { var n = cur(); if (!n) return 0; var t = n.type === "list" ? n.items.map(function (i) { return i.t; }).join(" ") : n.body; var m = t.trim().match(/\S+/g); return m ? m.length : 0; }
  function focusPaint() {
    var ms = focusAcc + (document.hidden ? 0 : Date.now() - focusT0), sec = Math.floor(ms / 1000);
    $("fpTime").textContent = Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); $("fpWords").textContent = bodyWords() + " palabras";
  }
  function focusStart() {
    if (focusOn || !cur() || cur().trashedAt) return;
    focusOn = true; focusAcc = 0; focusT0 = Date.now(); focusW0 = bodyWords();
    document.body.classList.add("focus"); $("focusPill").hidden = false; $("focusBtn").setAttribute("aria-pressed", "true");
    focusPaint(); focusTick = setInterval(focusPaint, 1000); pushLayer("focus");
  }
  function focusEnd() {
    if (!focusOn) return;
    focusOn = false; clearInterval(focusTick);
    var min = Math.floor((focusAcc + (document.hidden ? 0 : Date.now() - focusT0)) / 60000), w = Math.max(0, bodyWords() - focusW0);
    document.body.classList.remove("focus"); $("focusPill").hidden = true; $("focusBtn").setAttribute("aria-pressed", "false");
    if (min >= 1) {
      settings.focus.min += min; settings.focus.n++; settings.focusLog.unshift({ t: Date.now(), m: min, w: w }); settings.focusLog = settings.focusLog.slice(0, 30);
      maxFocus(min); achCheck(false); saveSettings(); toast("Enfoque: " + min + (min === 1 ? " minuto" : " minutos") + " · " + w + " palabras nuevas");
    } else toast("Sesión de enfoque cerrada");
  }
  registerLayer("focus", focusEnd);
  document.addEventListener("visibilitychange", function () { if (!focusOn) return; if (document.hidden) focusAcc += Date.now() - focusT0; else focusT0 = Date.now(); });
  $("focusBtn").addEventListener("click", function () { if (focusOn) closeLayer("focus"); else focusStart(); });
  $("fpExit").addEventListener("click", function () { closeLayer("focus"); });

  /* ---------- calendario ---------- */
  var calY = 0, calM = 0, calSel = null;
  function ymd(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function remAt(r, day) { /* hora (ms) en que el aviso r suena el día `day` (Date a medianoche), o 0 */
    var a = new Date(r.at), ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), a.getHours(), a.getMinutes()).getTime();
    if (ts < r.at) return 0;
    if (!r.rep) return ymd(a) === ymd(day) ? r.at : 0;
    if (r.rep === "day") return ts;
    var diff = Math.round((Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
    if (r.rep === "week") return diff % 7 === 0 ? ts : 0;
    if (r.rep === "days") return r.wd.indexOf(day.getDay()) >= 0 ? ts : 0;
    if (r.rep === "month") { var dim = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate(); return day.getDate() === Math.min(a.getDate(), dim) ? ts : 0; }
    return 0;
  }
  function calEvents(day) {
    var rem = [], made = [], due = [];
    notes.forEach(function (n) {
      if (n.trashedAt) return;
      remsOf(n).forEach(function (r) { var t = remAt(r, day); if (t) rem.push({ t: t, n: n, r: r }); });
      (n.items || []).forEach(function (it) { if (it.due && !it.done && ymd(new Date(it.due)) === ymd(day)) due.push({ n: n, it: it }); });
      if (ymd(new Date(n.createdAt)) === ymd(day)) made.push(n);
    });
    rem.sort(function (a, b) { return a.t - b.t; });
    return { rem: rem, made: made, due: due };
  }
  var calMode = "month";
  function weekStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); }
  function renderWeek() {
    var box = $("calWeek"); box.textContent = "";
    var ws = weekStart(calSel || new Date()), we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6), todayK = ymd(new Date());
    var f1 = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(ws).replace(/\./g, ""), f2 = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(we).replace(/\./g, "");
    $("calTitle").textContent = f1 + " – " + f2;
    for (var i = 0; i < 7; i++) {
      var d = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i), ev = calEvents(d), k = ymd(d);
      var dv = el("div", "wk-day"); dv.dataset.k = k; if (k === todayK) dv.classList.add("today"); if (calSel && ymd(calSel) === k) dv.classList.add("sel");
      var h = el("div", "wk-h"), hs = el("strong"); hs.textContent = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric" }).format(d);
      var cnt = ev.rem.length + ev.due.length + ev.made.length, hc = el("span"); hc.textContent = cnt ? String(cnt) : ""; h.appendChild(hs); h.appendChild(hc); dv.appendChild(h);
      (function (dd) { h.addEventListener("click", function () { calSel = dd; renderCal(); }); })(d);
      function it(time, n, drag, kind, ref) {
        var b = el("div", "wk-it"); b.dataset.drag = drag ? "1" : "0"; b.setAttribute("role", "button"); b.tabIndex = 0;
        var t = el("b"), sp = el("span"); t.textContent = time; sp.textContent = (n.lock ? "🔒 " : "") + (kind === "due" ? ref.t : noteLabel(n)); b.appendChild(t); b.appendChild(sp);
        b.addEventListener("click", function () { if (dragSkip) { dragSkip = false; return; } openNote(n.id); });
        b.addEventListener("keydown", function (e) { if (e.key === "Enter") openNote(n.id); });
        if (drag) wkDrag(b, n, kind, ref, d);
        dv.appendChild(b);
      }
      ev.rem.forEach(function (x) { it("⏰ " + tf.format(new Date(x.t)), x.n, !x.r.rep && !x.n.lock, "rem", x.r); });
      ev.due.forEach(function (x) { it("☑", x.n, !x.n.lock, "due", x.it); });
      ev.made.forEach(function (n) { it("📝", n, false, "made", null); });
      box.appendChild(dv);
    }
  }
  var dragSkip = false;
  function wkDrop(n, kind, ref, from, to) {
    if (ymd(from) === ymd(to)) return;
    if (kind === "rem") {
      var a = new Date(ref.at), at = new Date(to.getFullYear(), to.getMonth(), to.getDate(), a.getHours(), a.getMinutes()).getTime();
      if (at <= Date.now()) { toast("Ese día y hora ya pasaron: elegí otro día"); return; }
      ref.at = at; ref.seen = false; ref.snz = 0;
    } else ref.due = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 12).getTime();
    changed(n); syncReminders(); renderCal();
    toast((kind === "rem" ? "Aviso movido al " : "Tarea movida al ") + new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(to));
  }
  /* arrastre con puntero: mouse al mover, táctil tras mantener pulsado (así no molesta al desplazar la pantalla) */
  function wkDrag(node, n, kind, ref, from) {
    node.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    node.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      var sx = e.clientX, sy = e.clientY, on = false, ghost = null, over = null, timer = 0, touch = e.pointerType === "touch";
      function hit(x, y) { var t = document.elementFromPoint(x, y); return t && t.closest ? t.closest(".wk-day") : null; }
      function start() {
        on = true; ghost = node.cloneNode(true); ghost.classList.add("wk-ghost"); document.body.appendChild(ghost); node.style.opacity = "0.4";
        if (navigator.vibrate) { try { navigator.vibrate(15); } catch { /* sin vibración */ } }
      }
      function mv(x, y) { ghost.style.left = x + 10 + "px"; ghost.style.top = y - 16 + "px"; var d = hit(x, y); if (d !== over) { if (over) over.classList.remove("over"); over = d; if (over) over.classList.add("over"); } }
      function onMove(ev) {
        if (!on) {
          if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) { if (touch) { clearTimeout(timer); cleanup(); } else { start(); mv(ev.clientX, ev.clientY); } }
          return;
        }
        ev.preventDefault(); mv(ev.clientX, ev.clientY);
      }
      function noScroll(ev) { if (on) ev.preventDefault(); }
      function cleanup() {
        clearTimeout(timer);
        document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); document.removeEventListener("pointercancel", onCancel); document.removeEventListener("touchmove", noScroll);
      }
      function finish(drop) {
        cleanup();
        if (on) {
          if (ghost) ghost.remove(); node.style.opacity = ""; if (over) over.classList.remove("over");
          dragSkip = true; setTimeout(function () { dragSkip = false; }, 400);
          if (drop && over) { var k = +over.dataset.k, to = new Date(Math.floor(k / 10000), Math.floor(k / 100) % 100 - 1, k % 100); wkDrop(n, kind, ref, from, to); }
        }
      }
      function onUp() { finish(true); }
      function onCancel() { finish(false); }
      document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onUp); document.addEventListener("pointercancel", onCancel);
      document.addEventListener("touchmove", noScroll, { passive: false });
      if (touch) timer = setTimeout(function () { start(); mv(sx, sy); }, 380);
    });
  }
  function renderCal() {
    var wk = calMode === "week";
    $("calWeek").hidden = !wk; $("calGrid").hidden = wk; $("calHead").hidden = wk; $("calDay").hidden = wk; $("calDayT").hidden = wk; $("calDragHint").hidden = !wk;
    $("calMode").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === calMode ? "true" : "false"); });
    $("calPrev").setAttribute("aria-label", wk ? "Semana anterior" : "Mes anterior"); $("calNext").setAttribute("aria-label", wk ? "Semana siguiente" : "Mes siguiente");
    if (wk) { if (!calSel) { var t0 = new Date(); calSel = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()); } renderWeek(); return; }
    var first = new Date(calY, calM, 1), g = $("calGrid"); g.textContent = "";
    var ct = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(first); $("calTitle").textContent = ct.charAt(0).toUpperCase() + ct.slice(1);
    var start = new Date(calY, calM, 1 - ((first.getDay() + 6) % 7)), todayK = ymd(new Date());
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), ev = calEvents(d);
      var b = el("button"); b.type = "button"; b.dataset.k = ymd(d); b.textContent = String(d.getDate());
      if (d.getMonth() !== calM) b.classList.add("out"); if (ymd(d) === todayK) b.classList.add("today");
      b.setAttribute("aria-pressed", calSel && ymd(calSel) === ymd(d) ? "true" : "false");
      b.setAttribute("aria-label", new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(d) + (ev.rem.length ? ", " + ev.rem.length + " avisos" : ""));
      if (ev.rem.length || ev.made.length || ev.due.length) { var ds = el("span", "cdots"); if (ev.rem.length) ds.appendChild(el("i", "cdot rem")); if (ev.due.length) ds.appendChild(el("i", "cdot due")); if (ev.made.length) ds.appendChild(el("i", "cdot made")); b.appendChild(ds); }
      (function (dd) { b.addEventListener("click", function () { calSel = dd; renderCal(); }); })(d);
      g.appendChild(b);
    }
    var sd = calSel || new Date(); if (!calSel) calSel = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
    var ev2 = calEvents(calSel), box = $("calDay"); box.textContent = "";
    $("calDayT").textContent = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(calSel);
    function row(time, n, icon) { var b = el("button"); b.type = "button"; var t = el("b"); t.textContent = time; var s = el("span"); s.textContent = (n.lock ? "🔒 " : "") + noteLabel(n); b.appendChild(t); b.appendChild(s); b.addEventListener("click", function () { openNote(n.id); }); box.appendChild(b); }
    ev2.rem.forEach(function (x) { row("⏰ " + tf.format(new Date(x.t)), x.n); });
    ev2.due.forEach(function (x) { row("☑", x.n); });
    ev2.made.forEach(function (n) { row("📝", n); });
    if (!ev2.rem.length && !ev2.made.length && !ev2.due.length) { var nn = el("p", "none"); nn.textContent = "Nada este día."; box.appendChild(nn); }
  }
  /* ---------- Mi día: tareas con fecha atrasadas, de hoy y de los próximos 7 días ---------- */
  function renderToday() {
    var body = $("tdBody"); body.textContent = "";
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var d0 = t0.getTime(), groups = { late: [], today: [], soon: [] };
    notes.forEach(function (n) {
      if (n.trashedAt || n.lock) return;
      n.items.forEach(function (it) {
        if (!it.due || it.done || !it.t.trim()) return;
        var df = Math.round((new Date(it.due).setHours(0, 0, 0, 0) - d0) / 86400000);
        if (df < 0) groups.late.push({ n: n, it: it }); else if (df === 0) groups.today.push({ n: n, it: it }); else if (df <= 7) groups.soon.push({ n: n, it: it });
      });
    });
    [["late", "Atrasadas"], ["today", "Hoy"], ["soon", "Próximos 7 días"]].forEach(function (g) {
      var arr = groups[g[0]].sort(function (a, b) { return a.it.due - b.it.due; }); if (!arr.length) return;
      var h = el("div", "tdgrp " + g[0]); h.textContent = g[1] + " · " + arr.length; body.appendChild(h);
      var box = el("div"); box.style.display = "grid"; box.style.gap = "6px";
      arr.forEach(function (x) {
        var row = el("div", "tdrow"), cb = el("button", "check"); cb.type = "button"; cb.innerHTML = CHECK; cb.setAttribute("role", "checkbox"); cb.setAttribute("aria-checked", "false"); cb.setAttribute("aria-label", "Marcar como hecha");
        cb.addEventListener("click", function () { tickItem(x.n, x.it); changed(x.n); renderToday(); syncSoon(); });
        var tb = el("button", "tdt"); tb.type = "button"; var b = el("b"), i = el("i"); b.textContent = x.it.t; i.textContent = (x.n.title || "Sin título") + " · " + dueText(x.it.due) + (x.it.rep ? " ↻" : ""); tb.appendChild(b); tb.appendChild(i);
        tb.addEventListener("click", function () { closeLayer("today"); openNote(x.n.id); });
        row.appendChild(cb); row.appendChild(tb); box.appendChild(row);
      });
      body.appendChild(box);
    });
    if (!body.children.length) { var p = el("p", "hint"); p.textContent = "No tenés tareas atrasadas ni para esta semana. Ponele fecha a un elemento de una lista y aparece acá."; body.appendChild(p); }
  }
  function openToday() { renderToday(); $("today").hidden = false; pushLayer("today"); }
  registerLayer("today", function () { $("today").hidden = true; });
  $("tdClose").addEventListener("click", function () { closeLayer("today"); });
  $("today").addEventListener("click", function (e) { if (e.target === $("today")) closeLayer("today"); });
  $("mnToday").addEventListener("click", function () { closeMenuThen(openToday); });
  function openCalendar() {
    var t = new Date(); calY = t.getFullYear(); calM = t.getMonth(); calSel = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    renderCal(); $("calendar").hidden = false; pushLayer("calendar");
  }
  registerLayer("calendar", function () { $("calendar").hidden = true; });
  $("calClose").addEventListener("click", function () { closeLayer("calendar"); });
  $("calendar").addEventListener("click", function (e) { if (e.target === $("calendar")) closeLayer("calendar"); });
  $("calPrev").addEventListener("click", function () { if (calMode === "week") { calSel = new Date(calSel.getFullYear(), calSel.getMonth(), calSel.getDate() - 7); calY = calSel.getFullYear(); calM = calSel.getMonth(); renderCal(); return; } calM--; if (calM < 0) { calM = 11; calY--; } renderCal(); });
  $("calNext").addEventListener("click", function () { if (calMode === "week") { calSel = new Date(calSel.getFullYear(), calSel.getMonth(), calSel.getDate() + 7); calY = calSel.getFullYear(); calM = calSel.getMonth(); renderCal(); return; } calM++; if (calM > 11) { calM = 0; calY++; } renderCal(); });
  $("calToday").addEventListener("click", function () { var t = new Date(); calY = t.getFullYear(); calM = t.getMonth(); calSel = new Date(t.getFullYear(), t.getMonth(), t.getDate()); renderCal(); });
  $("calMode").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; calMode = b.dataset.v; if (calSel) { calY = calSel.getFullYear(); calM = calSel.getMonth(); } renderCal(); });
  $("calNew").addEventListener("click", function () {
    var d = calSel || new Date(), at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0).getTime();
    closeLayer("calendar");
    setTimeout(function () {
      createNote("text", {});
      var n = cur(); if (!n) return;
      if (at > Date.now()) { n.remind = { at: at, rep: "", seen: false, snz: 0, wd: [] }; changed(n); syncReminders(); toast("Aviso para el " + new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(d) + " a las 9:00. Escribí algo para guardar la nota"); }
      else toast("Ese día ya pasó: la nota se creó sin aviso");
    }, 350);
  });
  $("mnCalendar").addEventListener("click", function () { closeMenuThen(openCalendar); });
  function openCustom() { renderSettings(); $("custom").hidden = false; pushLayer("custom"); }
  $("customClose").addEventListener("click", function () { closeLayer("custom"); });
  $("custom").addEventListener("click", function (e) { if (e.target === $("custom")) closeLayer("custom"); });

