/* Constelaciones: mapa galáctico de tus notas.
   - Cada estrella es una nota real de Tronx (las mismas del listado). No hay datos de ejemplo.
   - Conexiones manuales entre dos notas y constelaciones (grupos con nombre) se guardan en localStorage,
     en la clave "tronx.map.v1", junto a las notas. También viajan en la copia de seguridad.
   - El mapa se dibuja en un solo <canvas>. Solo pide cuadros mientras se mueve algo; en reposo y con las
     animaciones apagadas no consume nada. Se detiene cuando la vista no se ve. */
(function () {
  "use strict";

  var MKEY = "tronx.map.v1";
  var api = null;
  var GCOL = [[167, 139, 250], [96, 165, 250], [52, 211, 153], [251, 191, 36], [244, 114, 182], [45, 212, 191]];
  var GNAME = ["Violeta", "Azul", "Verde", "Ámbar", "Rosa", "Turquesa"];
  var STAR_COLS = [[176, 150, 255], [120, 175, 255], [238, 236, 255], [125, 222, 255]];
  var KMIN = 0.12, KMAX = 3.5;
  var TWEEN_MS = 850;

  /* ---------- utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function lk(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  function button(label, cls, fn) {
    var b = el("button", cls || "btn"); b.type = "button"; b.textContent = label;
    if (fn) b.addEventListener("click", fn);
    return b;
  }

  /* ---------- datos guardados ---------- */
  var S = { links: [], groups: [], pos: {}, sig: "", view: null, tagLines: true, hint: false };
  var linkSet = {};
  var saveTimer = null;

  function addLinkRaw(a, b) {
    a = String(a || ""); b = String(b || "");
    if (!a || !b || a === b) return false;
    var k = lk(a, b);
    if (linkSet[k]) return false;
    linkSet[k] = 1;
    S.links.push(a < b ? [a, b] : [b, a]);
    return true;
  }
  function cleanGroup(g) {
    if (!g || typeof g !== "object") return null;
    var ids = [], seen = {};
    (Array.isArray(g.ids) ? g.ids : []).forEach(function (i) { i = String(i); if (!seen[i]) { seen[i] = 1; ids.push(i); } });
    var c = Number(g.color) | 0;
    return { id: String(g.id || api.uid()), name: String(g.name || "Constelación").slice(0, 40), color: ((c % GCOL.length) + GCOL.length) % GCOL.length, ids: ids };
  }
  function loadStore() {
    var raw = api.lsGet(MKEY), d = null;
    if (raw) { try { d = JSON.parse(raw); } catch (e) { d = null; } }
    if (!d || typeof d !== "object") return;
    (Array.isArray(d.links) ? d.links : []).forEach(function (p) { if (Array.isArray(p)) addLinkRaw(p[0], p[1]); });
    (Array.isArray(d.groups) ? d.groups : []).forEach(function (g) { var c = cleanGroup(g); if (c) S.groups.push(c); });
    if (d.pos && typeof d.pos === "object") {
      Object.keys(d.pos).forEach(function (k) {
        var p = d.pos[k];
        if (Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) S.pos[k] = [Number(p[0]), Number(p[1])];
      });
    }
    if (d.view && isFinite(d.view.x) && isFinite(d.view.y) && isFinite(d.view.k)) S.view = { x: Number(d.view.x), y: Number(d.view.y), k: clamp(Number(d.view.k), KMIN, KMAX) };
    S.sig = typeof d.sig === "string" ? d.sig : "";
    S.tagLines = d.tagLines !== false;
    S.hint = !!d.hint;
  }
  function saveStoreNow() {
    clearTimeout(saveTimer); saveTimer = null;
    var pos = {};
    Object.keys(S.pos).forEach(function (id) { if (api.notes.has(id)) pos[id] = S.pos[id]; });
    nodes.forEach(function (nd) { pos[nd.id] = [Math.round(nd.tx), Math.round(nd.ty)]; });
    S.pos = pos;
    api.lsSet(MKEY, JSON.stringify({ v: 1, links: S.links, groups: S.groups, pos: pos, sig: S.sig, view: S.view, tagLines: S.tagLines, hint: S.hint }));
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveStoreNow, 350); }

  /* ---------- grafo: estrellas y conexiones ---------- */
  var nodes = [], byId = {}, mEdges = [], tEdges = [], gEdges = [], gInfo = [];
  var measureCtx = null;

  function wordsOf(n) {
    if (n.type === "list") { var c = 0; n.items.forEach(function (i) { c += i.t.length; }); return n.items.length * 4 + c / 6; }
    return n.body.length / 6;
  }
  function updateMeta(nd) {
    var n = nd.n, words = wordsOf(n);
    nd.r = 5 + Math.min(7, Math.sqrt(words) * 0.5) + (n.pinned ? 2 : 0);
    var age = Math.max(0, (Date.now() - n.updatedAt) / 86400000);
    nd.bright = (0.55 + 0.45 * Math.exp(-age / 14)) * (n.archived ? 0.5 : 1);
    var rgb = n.color && n.color !== "none" ? api.colorRGB(n.color) : null;
    nd.col = rgb || STAR_COLS[hash(n.id) % STAR_COLS.length];
    var t = (n.title || "").trim() || (n.type === "list" ? "Lista sin título" : "Sin título");
    nd.label = t.length > 24 ? t.slice(0, 23) + "…" : t;
    nd.lw = 0;
  }
  function rebuildGraph() {
    var prev = byId, arr = [];
    api.notes.forEach(function (n) { if (!n.trashedAt) arr.push(n); });
    arr.sort(function (a, b) { return (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : 1); });
    nodes = []; byId = {};
    arr.forEach(function (n) {
      var nd = prev[n.id];
      if (!nd) nd = { id: n.id, x: 0, y: 0, tx: 0, ty: 0, fx: 0, fy: 0, born: 0, placed: false, phase: (hash(n.id) % 628) / 100, sp: 0.7 + (hash(n.id + "s") % 100) / 100 };
      nd.n = n; nd.gs = []; updateMeta(nd);
      nodes.push(nd); byId[n.id] = nd;
    });
    mEdges = [];
    S.links.forEach(function (p) { var a = byId[p[0]], b = byId[p[1]]; if (a && b) mEdges.push([a, b, lk(p[0], p[1])]); });
    // Etiquetas compartidas: cada etiqueta enlaza sus notas en cadena (barato, sin comparar todos contra todos)
    tEdges = [];
    var tags = {}, seen = {};
    mEdges.forEach(function (e) { seen[e[2]] = 1; });
    nodes.forEach(function (nd) { nd.n.tags.forEach(function (t) { (tags[t] = tags[t] || []).push(nd); }); });
    Object.keys(tags).forEach(function (t) {
      var l = tags[t]; if (l.length < 2) return;
      l.sort(function (a, b) { return a.n.createdAt - b.n.createdAt || (a.id < b.id ? -1 : 1); });
      for (var i = 0; i < l.length - 1; i++) {
        var key = lk(l[i].id, l[i + 1].id);
        if (seen[key]) continue;
        seen[key] = 1; tEdges.push([l[i], l[i + 1]]);
      }
    });
    gInfo = [];
    S.groups.forEach(function (g, gi) {
      var m = [];
      g.ids.forEach(function (id) { var nd = byId[id]; if (nd) { m.push(nd); nd.gs.push(gi); } });
      gInfo.push({ g: g, gi: gi, m: m, cx: 0, cy: 0, r: 0 });
    });
  }
  function signature() {
    var s = nodes.map(function (nd) { return nd.id; }).join(",") + "#" + mEdges.map(function (e) { return e[2]; }).join(",") + "#" +
      tEdges.map(function (e) { return e[0].id + ">" + e[1].id; }).join(",") + "#" +
      gInfo.map(function (g) { return g.g.id + ":" + g.m.map(function (nd) { return nd.id; }).join("."); }).join(",");
    return String(hash(s)) + ":" + s.length;
  }

  /* ---------- distribución automática (fuerzas) ----------
     Fruchterman–Reingold con temperatura: repulsión entre todas las estrellas, resortes en las conexiones,
     las constelaciones se agrupan en torno a su centro y se separan entre sí y del resto. Al final, una pasada
     dura elimina cualquier solapamiento. Es determinista (misma entrada, mismo mapa) y arranca "en caliente"
     desde las posiciones guardadas para que una nota nueva no reordene todo el universo. */
  function runLayout(cold) {
    var n = nodes.length, i, j, k;
    if (!n) { gEdges = []; return; }
    var X = new Float32Array(n), Y = new Float32Array(n), FX = new Float32Array(n), FY = new Float32Array(n), R = new Float32Array(n);
    var known = new Uint8Array(n), nKnown = 0, maxR = 0;
    for (i = 0; i < n; i++) {
      nodes[i]._i = i; R[i] = nodes[i].r;
      var p = cold ? null : S.pos[nodes[i].id];
      if (p) { X[i] = p[0]; Y[i] = p[1]; known[i] = 1; nKnown++; maxR = Math.max(maxR, Math.sqrt(p[0] * p[0] + p[1] * p[1])); }
    }
    var adj = []; for (i = 0; i < n; i++) adj.push([]);
    mEdges.forEach(function (e) { adj[e[0]._i].push(e[1]._i); adj[e[1]._i].push(e[0]._i); });
    tEdges.forEach(function (e) { adj[e[0]._i].push(e[1]._i); adj[e[1]._i].push(e[0]._i); });
    var gm = [];
    gInfo.forEach(function (g) { if (g.m.length) gm.push(g.m.map(function (nd) { return nd._i; })); });

    var unknown = [];
    for (i = 0; i < n; i++) if (!known[i]) unknown.push(i);
    unknown.sort(function (a, b) { return nodes[b].n.updatedAt - nodes[a].n.updatedAt || a - b; });
    var spiral = nKnown === 0, sk = 0;
    unknown.forEach(function (ui) {
      var r = rng(hash(nodes[ui].id)), ang, rad, ax = 0, ay = 0, c = 0;
      if (spiral) {
        rad = 64 * Math.sqrt(sk + 0.6); ang = sk * 2.39996323 + r() * 0.3; sk++;
        X[ui] = Math.cos(ang) * rad; Y[ui] = Math.sin(ang) * rad;
      } else {
        adj[ui].forEach(function (q) { if (known[q]) { ax += X[q]; ay += Y[q]; c++; } });
        if (!c) nodes[ui].gs.forEach(function (gi) { gInfo[gi].m.forEach(function (m) { if (known[m._i]) { ax += X[m._i]; ay += Y[m._i]; c++; } }); });
        ang = r() * 6.2832;
        if (c) { ax /= c; ay /= c; rad = 70 + r() * 30; X[ui] = ax + Math.cos(ang) * rad; Y[ui] = ay + Math.sin(ang) * rad; }
        else { rad = maxR + 80 + r() * 40; X[ui] = Math.cos(ang) * rad; Y[ui] = Math.sin(ang) * rad; }
      }
      known[ui] = 1; nKnown++; maxR = Math.max(maxR, Math.sqrt(X[ui] * X[ui] + Y[ui] * Y[ui]));
    });

    var k0 = 82, CUT = k0 * 2.0, CUT2 = CUT * CUT, GRAV = 55 / (52 * Math.sqrt(n) + 60), tS = (unknown.length === n ? 1.6 : (cold ? 1.6 : 0.5)) * k0;
    var iters = cold ? 240 : 130;
    iters = Math.min(iters, Math.max(40, Math.floor(40e6 / (n * n / 2 + 1))));
    var GCX = new Float32Array(gm.length), GCY = new Float32Array(gm.length), GR = new Float32Array(gm.length), mark = new Uint8Array(n);
    var jit = rng(1234567);
    for (var it = 0; it < iters; it++) {
      var t = tS * (1 - it / iters) + 0.5;
      FX.fill(0); FY.fill(0);
      for (i = 0; i < n; i++) {
        var xi = X[i], yi = Y[i], ri = R[i];
        for (j = i + 1; j < n; j++) {
          var dx = xi - X[j], dy = yi - Y[j], d2 = dx * dx + dy * dy;
          if (d2 > CUT2) continue;
          if (d2 < 0.01) { dx = jit() - 0.5; dy = jit() - 0.5; d2 = dx * dx + dy * dy + 0.01; }
          var d = Math.sqrt(d2), minD = ri + R[j] + 30, f = k0 * k0 / d * (1 - d / CUT);
          if (d < minD) f += (minD - d) * 1.5;
          f /= d;
          FX[i] += dx * f; FY[i] += dy * f; FX[j] -= dx * f; FY[j] -= dy * f;
        }
      }
      // resortes: conexiones manuales (fuertes) y por etiqueta (suaves)
      for (k = 0; k < mEdges.length; k++) {
        var a = mEdges[k][0]._i, b = mEdges[k][1]._i, ex = X[a] - X[b], ey = Y[a] - Y[b], ed = Math.sqrt(ex * ex + ey * ey) + 0.01;
        var af = ed / (0.9 * k0); // atracción d²/k aplicada sobre el vector (ex, ey)
        FX[a] -= ex * af; FY[a] -= ey * af; FX[b] += ex * af; FY[b] += ey * af;
      }
      for (k = 0; k < tEdges.length; k++) {
        var a2 = tEdges[k][0]._i, b2 = tEdges[k][1]._i, tx = X[a2] - X[b2], ty = Y[a2] - Y[b2], td = Math.sqrt(tx * tx + ty * ty) + 0.01;
        var tf = 0.22 * td / (1.5 * k0);
        FX[a2] -= tx * tf; FY[a2] -= ty * tf; FX[b2] += tx * tf; FY[b2] += ty * tf;
      }
      // constelaciones: atracción al centro del grupo, separación entre grupos y fuera de los grupos ajenos
      var g, q, m;
      for (g = 0; g < gm.length; g++) {
        m = gm[g]; var cx = 0, cy = 0;
        for (q = 0; q < m.length; q++) { cx += X[m[q]]; cy += Y[m[q]]; }
        cx /= m.length; cy /= m.length; GCX[g] = cx; GCY[g] = cy; GR[g] = k0 * 0.6 * Math.sqrt(m.length) + k0 * 0.55;
        for (q = 0; q < m.length; q++) { FX[m[q]] += (cx - X[m[q]]) * 0.22; FY[m[q]] += (cy - Y[m[q]]) * 0.22; }
      }
      for (g = 0; g < gm.length; g++) {
        for (var h = g + 1; h < gm.length; h++) {
          var gx = GCX[g] - GCX[h], gy = GCY[g] - GCY[h], gd = Math.sqrt(gx * gx + gy * gy) + 0.01, sep = GR[g] + GR[h] + 40;
          if (gd < sep) {
            var push = (sep - gd) * 0.35, ux = gx / gd * push, uy = gy / gd * push;
            for (q = 0; q < gm[g].length; q++) { FX[gm[g][q]] += ux; FY[gm[g][q]] += uy; }
            for (q = 0; q < gm[h].length; q++) { FX[gm[h][q]] -= ux; FY[gm[h][q]] -= uy; }
          }
        }
        m = gm[g];
        for (q = 0; q < m.length; q++) mark[m[q]] = 1;
        var lim = GR[g] * 1.05;
        for (i = 0; i < n; i++) {
          if (mark[i]) continue;
          var ox = X[i] - GCX[g], oy = Y[i] - GCY[g], od = Math.sqrt(ox * ox + oy * oy) + 0.01;
          if (od < lim) { var pp = (lim - od) * 0.35 / od; FX[i] += ox * pp; FY[i] += oy * pp; }
        }
        for (q = 0; q < m.length; q++) mark[m[q]] = 0;
      }
      for (i = 0; i < n; i++) {
        FX[i] -= X[i] * GRAV; FY[i] -= Y[i] * GRAV;
        var fl = Math.sqrt(FX[i] * FX[i] + FY[i] * FY[i]);
        if (fl > 0.0001) { var s = Math.min(fl, t) / fl; X[i] += FX[i] * s; Y[i] += FY[i] * s; }
      }
    }
    // pasada final: nadie se solapa
    for (var pass = 0; pass < 14; pass++) {
      var moved = false;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var qx = X[i] - X[j], qy = Y[i] - Y[j], mn = R[i] + R[j] + 22, q2 = qx * qx + qy * qy;
        if (q2 >= mn * mn) continue;
        var qd = Math.sqrt(q2);
        if (qd < 0.01) { qx = jit() - 0.5; qy = jit() - 0.5; qd = Math.sqrt(qx * qx + qy * qy) + 0.001; }
        var ov = (mn - qd) / 2 + 0.5, nx = qx / qd * ov, ny = qy / qd * ov;
        X[i] += nx; Y[i] += ny; X[j] -= nx; Y[j] -= ny; moved = true;
      }
      if (!moved) break;
    }
    var now = performance.now();
    for (i = 0; i < n; i++) {
      var nd = nodes[i];
      nd.tx = X[i]; nd.ty = Y[i];
      if (nd.placed) { nd.fx = nd.x; nd.fy = nd.y; }
      else { nd.x = nd.fx = nd.tx; nd.y = nd.fy = nd.ty; nd.placed = true; nd.born = now; }
    }
    tweenStart = now; tweening = true;
    buildGroupEdges();
    computeBounds();
  }
  // Líneas de cada constelación: árbol de menor longitud entre sus estrellas (como las constelaciones de verdad)
  function buildGroupEdges() {
    gEdges = [];
    gInfo.forEach(function (info) {
      var m = info.m; if (m.length < 2) return;
      var inT = {}, best = [], c;
      inT[0] = true;
      for (c = 0; c < m.length; c++) best.push(c === 0 ? -1 : 0);
      var dist = m.map(function (nd) { var dx = nd.tx - m[0].tx, dy = nd.ty - m[0].ty; return dx * dx + dy * dy; });
      for (var step = 1; step < m.length; step++) {
        var bi = -1, bd = 1e18;
        for (c = 0; c < m.length; c++) if (!inT[c] && dist[c] < bd) { bd = dist[c]; bi = c; }
        inT[bi] = true; gEdges.push([m[best[bi]], m[bi], info.g.color]);
        for (c = 0; c < m.length; c++) if (!inT[c]) {
          var dx = m[c].tx - m[bi].tx, dy = m[c].ty - m[bi].ty, d2 = dx * dx + dy * dy;
          if (d2 < dist[c]) { dist[c] = d2; best[c] = bi; }
        }
      }
    });
  }
  var bounds = { x0: -300, y0: -300, x1: 300, y1: 300 };
  function computeBounds() {
    if (!nodes.length) { bounds = { x0: -300, y0: -300, x1: 300, y1: 300 }; return; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    nodes.forEach(function (nd) { x0 = Math.min(x0, nd.tx); y0 = Math.min(y0, nd.ty); x1 = Math.max(x1, nd.tx); y1 = Math.max(y1, nd.ty); });
    bounds = { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  /* ---------- estado de la vista ---------- */
  var cmap, canvas, ctx, W = 0, H = 0, dpr = 1;
  var V = { x: 0, y: 0, k: 1 };
  var mapOpen = false, shown = false, active = false;
  var raf = 0, lastT = 0, lastDraw = 0, fly = null, inertia = null, tweening = false, tweenStart = 0;
  var perf = 0, perfAcc = 0, perfN = 0;
  var sel = null, linkFrom = null, hover = null, pulse = null, query = "", matchSet = null;
  var ptrs = {}, nPtr = 0, pinch = null, pan = null, downInfo = null;
  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function ambientOn() {
    var st = api.getSettings();
    return st.bgAnim !== false && !(reduceMQ && reduceMQ.matches) && perf < 3;
  }
  function kick() { if (active && !raf) raf = requestAnimationFrame(tick); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function setActive() {
    var on = mapOpen && shown && !document.hidden;
    if (on === active) return;
    active = on;
    if (on) { lastT = 0; kick(); } else stop();
  }

  function w2s(x, y) { return [(x - V.x) * V.k + W / 2, (y - V.y) * V.k + H / 2]; }
  function clampView() {
    var m = 420, bx0 = bounds.x0 - m, bx1 = bounds.x1 + m, by0 = bounds.y0 - m, by1 = bounds.y1 + m;
    V.x = clamp(V.x, bx0, bx1); V.y = clamp(V.y, by0, by1);
    V.k = clamp(V.k, KMIN, KMAX);
  }
  function zoomAt(px, py, f) {
    var nk = clamp(V.k * f, KMIN, KMAX), wx = (px - W / 2) / V.k + V.x, wy = (py - H / 2) / V.k + V.y;
    V.k = nk; V.x = wx - (px - W / 2) / nk; V.y = wy - (py - H / 2) / nk;
    clampView(); fly = null; inertia = null; kick();
  }
  function flyTo(x, y, k, ms) {
    fly = { x0: V.x, y0: V.y, k0: V.k, x1: x, y1: y, k1: clamp(k, KMIN, KMAX), t0: performance.now(), ms: ms || 700 };
    inertia = null; kick();
  }
  function usable() {
    var top = $("cmTop") ? $("cmTop").offsetHeight : 0;
    var bottom = 0;
    return { top: top, bottom: bottom };
  }
  function fitTarget() {
    if (!nodes.length) return { x: 0, y: 0, k: 1 };
    var u = usable(), pad = 110, bw = bounds.x1 - bounds.x0 + pad * 2, bh = bounds.y1 - bounds.y0 + pad * 2;
    var k = clamp(Math.min((W - 8) / bw, (H - u.top - u.bottom - 30) / bh), KMIN, 1.35);
    var cx = (bounds.x0 + bounds.x1) / 2, cy = (bounds.y0 + bounds.y1) / 2;
    var ucy = u.top + (H - u.top - u.bottom) / 2;
    return { x: cx, y: cy - (ucy - H / 2) / k, k: k };
  }
  function fitView(animate) {
    var t = fitTarget();
    if (animate) flyTo(t.x, t.y, t.k, 800);
    else { V.x = t.x; V.y = t.y; V.k = t.k; kick(); }
  }

  /* ---------- fondo: nebulosas y estrellas lejanas (se dibujan una sola vez) ---------- */
  var bgC = null, tiles = [];
  function buildBg() {
    var sc = 0.5, bw = Math.ceil(W * 1.3 * sc), bh = Math.ceil(H * 1.3 * sc);
    bgC = document.createElement("canvas"); bgC.width = bw; bgC.height = bh;
    var g = bgC.getContext("2d");
    g.fillStyle = "#05061a"; g.fillRect(0, 0, bw, bh);
    function blob(cx, cy, rx, ry, rgb, a) {
      g.save(); g.translate(cx * bw, cy * bh); g.scale(rx * bw, ry * bh);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, "rgba(" + rgb + "," + a + ")"); gr.addColorStop(0.5, "rgba(" + rgb + "," + (a * 0.38) + ")"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore();
    }
    blob(0.2, 0.12, 0.75, 0.55, "112,72,238", 0.4);
    blob(0.9, 0.9, 0.7, 0.55, "38,122,224", 0.3);
    blob(0.88, 0.36, 0.5, 0.35, "214,72,194", 0.17);
    blob(0.14, 0.82, 0.5, 0.35, "30,164,176", 0.12);
    blob(0.5, 0.5, 0.9, 0.18, "170,150,255", 0.07);
    var key = String(bw) + "x" + String(dpr);
    if (tiles.key !== key) {
      tiles = []; tiles.key = key;
      for (var L = 0; L < 2; L++) {
        var S0 = 380, c = document.createElement("canvas"); c.width = c.height = Math.round(S0 * dpr);
        var x = c.getContext("2d"), r = rng(77 + L * 31), cnt = L ? 46 : 70;
        x.scale(dpr, dpr);
        for (var i = 0; i < cnt; i++) {
          var px = r() * S0, py = r() * S0, pr = (L ? 0.7 : 0.45) + r() * (L ? 0.9 : 0.6), pa = (L ? 0.4 : 0.22) + r() * 0.5;
          var tint = r(), col = tint < 0.5 ? "255,255,255" : tint < 0.8 ? "190,205,255" : "215,190,255";
          x.fillStyle = "rgba(" + col + "," + pa + ")"; x.beginPath(); x.arc(px, py, pr, 0, 6.2832); x.fill();
        }
        tiles.push(c);
      }
    }
  }
  var spr = {};
  function glow(rgb) {
    var key = rgb[0] + "," + rgb[1] + "," + rgb[2];
    if (spr[key]) return spr[key];
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32), col = key;
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.1, "rgba(" + col + ",0.95)");
    gr.addColorStop(0.32, "rgba(" + col + ",0.4)"); gr.addColorStop(0.65, "rgba(" + col + ",0.08)"); gr.addColorStop(1, "rgba(" + col + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    spr[key] = c; return c;
  }
  var halos = {};
  function halo(ci) {
    if (halos[ci]) return halos[ci];
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64), col = GCOL[ci].join(",");
    gr.addColorStop(0, "rgba(" + col + ",0.42)"); gr.addColorStop(0.55, "rgba(" + col + ",0.17)"); gr.addColorStop(1, "rgba(" + col + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    halos[ci] = c; return c;
  }

  /* ---------- partículas y estrella fugaz ---------- */
  var motes = [], shoot = null, nextShoot = 0;
  function initMotes() {
    var cnt = perf >= 1 ? 10 : 26, r = rng(9);
    motes = [];
    for (var i = 0; i < cnt; i++) motes.push({ x: r(), y: r(), vx: (r() - 0.5) * 0.004, vy: -0.002 - r() * 0.004, r: 0.6 + r() * 1.3, a: 0.15 + r() * 0.35, ph: r() * 6.28, c: r() < 0.5 ? "190,170,255" : "150,200,255" });
  }

  /* ---------- dibujo ---------- */
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function onScr(ax, ay, bx, by) { return !((ax < -30 && bx < -30) || (ax > W + 30 && bx > W + 30) || (ay < -30 && by < -30) || (ay > H + 30 && by > H + 30)); }

  function draw(now, dt, amb) {
    var c = ctx, i, k = V.k;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    c.fillStyle = "#04050e"; c.fillRect(0, 0, W, H);
    if (bgC) {
      var ex = W * 0.3, ey = H * 0.3, drift = amb ? Math.sin(now / 9000) * ex * 0.06 : 0;
      var ox = -ex / 2 - Math.tanh(V.x * k / 1400) * ex / 2 + drift, oy = -ey / 2 - Math.tanh(V.y * k / 1400) * ey / 2;
      c.drawImage(bgC, ox, oy, W + ex, H + ey);
    }
    for (var L = 0; L < tiles.length; L++) {
      var par = L ? 0.22 : 0.1, S0 = 380, ox2 = (((-V.x * k * par) % S0) + S0) % S0, oy2 = (((-V.y * k * par) % S0) + S0) % S0;
      c.globalAlpha = L ? 1 : 0.9;
      for (var tx = ox2 - S0; tx < W; tx += S0) for (var ty = oy2 - S0; ty < H; ty += S0) c.drawImage(tiles[L], tx, ty, S0, S0);
    }
    c.globalAlpha = 1;

    // posiciones en pantalla
    for (i = 0; i < nodes.length; i++) { var nd = nodes[i]; nd.sx = (nd.x - V.x) * k + W / 2; nd.sy = (nd.y - V.y) * k + H / 2; }

    // halos de constelaciones
    for (i = 0; i < gInfo.length; i++) {
      var gi = gInfo[i], m = gi.m; if (!m.length) continue;
      var cx = 0, cy = 0, q;
      for (q = 0; q < m.length; q++) { cx += m[q].x; cy += m[q].y; }
      cx /= m.length; cy /= m.length;
      var rr = 0;
      for (q = 0; q < m.length; q++) { var dx = m[q].x - cx, dy = m[q].y - cy; rr = Math.max(rr, Math.sqrt(dx * dx + dy * dy)); }
      gi.cx = cx; gi.cy = cy; gi.r = rr + 64;
      var hs = w2s(cx, cy), HR = gi.r * k * 1.3;
      if (hs[0] + HR < 0 || hs[0] - HR > W || hs[1] + HR < 0 || hs[1] - HR > H) continue;
      c.globalAlpha = (focusGroup === gi.g.id ? 1 : 0.7);
      c.drawImage(halo(gi.g.color), hs[0] - HR, hs[1] - HR, HR * 2, HR * 2);
    }
    c.globalAlpha = 1;

    // líneas: etiquetas (punteadas y tenues), constelaciones (color), conexiones manuales (brillantes)
    var e, a, b;
    if (S.tagLines && tEdges.length) {
      c.setLineDash([1.5, 5]); c.lineWidth = 1; c.strokeStyle = "rgba(150,165,255,0.24)"; c.beginPath();
      for (i = 0; i < tEdges.length; i++) { e = tEdges[i]; a = e[0]; b = e[1]; if (onScr(a.sx, a.sy, b.sx, b.sy)) { c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); } }
      c.stroke(); c.setLineDash([]);
    }
    if (gEdges.length) {
      for (var ci = 0; ci < GCOL.length; ci++) {
        var any = false;
        c.beginPath();
        for (i = 0; i < gEdges.length; i++) {
          e = gEdges[i]; if (e[2] !== ci) continue; a = e[0]; b = e[1];
          if (onScr(a.sx, a.sy, b.sx, b.sy)) { c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); any = true; }
        }
        if (any) { c.lineWidth = 1.4; c.strokeStyle = "rgba(" + GCOL[ci].join(",") + "," + (amb ? 0.6 + 0.1 * Math.sin(now / 1500 + ci) : 0.66) + ")"; c.stroke(); }
      }
    }
    if (mEdges.length) {
      c.beginPath();
      for (i = 0; i < mEdges.length; i++) { e = mEdges[i]; a = e[0]; b = e[1]; if (onScr(a.sx, a.sy, b.sx, b.sy)) { c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); } }
      c.lineWidth = 6; c.strokeStyle = "rgba(140,185,255,0.10)"; c.stroke();
      c.lineWidth = 1.7; c.strokeStyle = "rgba(205,225,255,0.82)"; c.stroke();
      if (sel) {
        c.beginPath();
        for (i = 0; i < mEdges.length; i++) { e = mEdges[i]; if (e[0].id !== sel && e[1].id !== sel) continue; c.moveTo(e[0].sx, e[0].sy); c.lineTo(e[1].sx, e[1].sy); }
        c.lineWidth = 2.6; c.strokeStyle = "rgba(255,255,255,0.95)"; c.stroke();
      }
      if (amb) {
        c.globalCompositeOperation = "lighter";
        var sp = glow([200, 225, 255]), cnt = 0;
        for (i = 0; i < mEdges.length && cnt < 70; i++) {
          e = mEdges[i]; a = e[0]; b = e[1]; if (!onScr(a.sx, a.sy, b.sx, b.sy)) continue;
          var ph = ((now * 0.00018 + (hash(e[2]) % 1000) / 1000) % 1), px = a.sx + (b.sx - a.sx) * ph, py = a.sy + (b.sy - a.sy) * ph;
          c.globalAlpha = 0.95 * Math.sin(ph * Math.PI); c.drawImage(sp, px - 6, py - 6, 12, 12); cnt++;
        }
        c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
      }
    }

    // estrellas
    c.globalCompositeOperation = "lighter";
    var anim = tweening ? 0 : 0;
    for (i = 0; i < nodes.length; i++) {
      nd = nodes[i];
      var sx = nd.sx, sy = nd.sy, rad = nd.r * k;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;
      var born = nd.born ? clamp((now - nd.born) / 800, 0, 1) : 1, sc = born < 1 ? ease(born) : 1;
      var s = clamp(rad * 3.4, 9, 70) * sc, al = nd.bright * (matchSet ? (matchSet[nd.id] ? 1 : 0.2) : 1);
      if (amb) al *= 0.86 + 0.14 * Math.sin(now / 1000 * nd.sp + nd.phase);
      c.globalAlpha = Math.min(1, al);
      c.drawImage(glow(nd.col), sx - s, sy - s, s * 2, s * 2);
      c.globalAlpha = Math.min(1, al + 0.2);
      c.fillStyle = "#fff"; c.beginPath(); c.arc(sx, sy, Math.max(0.6, Math.max(1.3, rad * 0.38) * sc), 0, 6.2832); c.fill();
      if (nd.n.pinned || nd.r >= 10.5) {
        var L2 = s * 0.95; c.globalAlpha = Math.min(1, al * 0.55);
        c.fillStyle = "rgba(255,255,255,0.9)"; c.fillRect(sx - L2, sy - 0.5, L2 * 2, 1); c.fillRect(sx - 0.5, sy - L2, 1, L2 * 2);
      }
    }
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    // anillo de color de la constelación
    c.lineWidth = 1.2;
    for (i = 0; i < nodes.length; i++) {
      nd = nodes[i]; if (!nd.gs.length) continue;
      if (nd.sx < -40 || nd.sx > W + 40 || nd.sy < -40 || nd.sy > H + 40) continue;
      c.strokeStyle = "rgba(" + GCOL[S.groups[nd.gs[0]].color].join(",") + ",0.75)";
      c.beginPath(); c.arc(nd.sx, nd.sy, Math.max(4.5, nd.r * k * 0.8 + 3), 0, 6.2832); c.stroke();
    }

    // selección, búsqueda y modo vincular
    function ring(nd2, rad2, rgba, w) { c.lineWidth = w; c.strokeStyle = rgba; c.beginPath(); c.arc(nd2.sx, nd2.sy, rad2, 0, 6.2832); c.stroke(); }
    if (sel && byId[sel]) { var sn = byId[sel]; ring(sn, Math.max(11, sn.r * k + 8) + (amb ? Math.sin(now / 300) * 1.5 : 0), "rgba(255,255,255,0.9)", 1.5); }
    if (linkFrom && byId[linkFrom]) { var ln = byId[linkFrom]; c.setLineDash([4, 4]); ring(ln, Math.max(15, ln.r * k + 12) + Math.sin(now / 250) * 2, "rgba(130,230,255,0.95)", 1.6); c.setLineDash([]); }
    if (pulse && byId[pulse.id]) {
      var pt = (now - pulse.t0) / 1000;
      if (pt < 3) {
        var pn = byId[pulse.id], ph2 = (pt % 1);
        ring(pn, 10 + ph2 * 46, "rgba(190,170,255," + (0.9 * (1 - ph2)) + ")", 2);
      } else pulse = null;
    }

    // etiquetas de notas
    var cands = [];
    for (i = 0; i < nodes.length; i++) {
      nd = nodes[i];
      if (nd.sx < 0 || nd.sx > W || nd.sy < 0 || nd.sy > H) continue;
      var pr = 0;
      if (nd.id === sel) pr = 1e6; else if (matchSet && matchSet[nd.id]) pr = 5e5; else if (hover && nd.id === hover) pr = 4e5;
      else if (k >= 1.05) pr = 100 + nd.r; else if (k >= 0.6) pr = nd.n.pinned ? 80 + nd.r : (nd.r >= 8.5 ? nd.r : 0); else if (nd.n.pinned) pr = 50;
      if (matchSet && !matchSet[nd.id]) pr = 0;
      if (pr > 0) cands.push([pr, nd]);
    }
    cands.sort(function (x, y) { return y[0] - x[0]; });
    c.font = "500 11.5px " + fontBody;
    c.textAlign = "center"; c.textBaseline = "top";
    var placed = [], maxL = 70;
    for (i = 0; i < cands.length && placed.length < maxL; i++) {
      nd = cands[i][1];
      if (!nd.lw) nd.lw = c.measureText(nd.label).width;
      var lx = nd.sx - nd.lw / 2 - 3, ly = nd.sy + Math.max(7, nd.r * k) + 5, lw = nd.lw + 6, lh = 16, hit = false;
      for (q = 0; q < placed.length; q++) { var p = placed[q]; if (lx < p[0] + p[2] && lx + lw > p[0] && ly < p[1] + p[3] && ly + lh > p[1]) { hit = true; break; } }
      if (hit && cands[i][0] < 1e5) continue;
      placed.push([lx, ly, lw, lh]);
      c.globalAlpha = nd.id === sel ? 1 : 0.88;
      c.lineJoin = "round"; c.lineWidth = 3; c.strokeStyle = "rgba(4,5,16,0.85)"; c.strokeText(nd.label, nd.sx, ly);
      c.fillStyle = "#ece9ff"; c.fillText(nd.label, nd.sx, ly);
    }
    // nombres de constelaciones
    c.globalAlpha = 1; c.textBaseline = "alphabetic";
    for (i = 0; i < gInfo.length; i++) {
      gi = gInfo[i]; if (!gi.m.length) continue;
      var gs = w2s(gi.cx, gi.cy - gi.r * 0.92), fs = clamp(11 + k * 3, 11, 15);
      if (gs[0] < -120 || gs[0] > W + 120 || gs[1] < -30 || gs[1] > H + 30) continue;
      c.font = "700 " + fs + "px " + fontDisp;
      if ("letterSpacing" in c) c.letterSpacing = "1.5px";
      var gt = gi.g.name.toUpperCase(), col = GCOL[gi.g.color], gw = c.measureText(gt).width / 2 + 10;
      gs[0] = clamp(gs[0], gw, W - gw); gs[1] = clamp(gs[1], $("cmTop").offsetHeight + 14, H - 24);
      c.lineJoin = "round"; c.lineWidth = 4; c.strokeStyle = "rgba(4,5,16,0.8)"; c.strokeText(gt, gs[0], gs[1]);
      c.fillStyle = "rgba(" + Math.min(255, col[0] + 55) + "," + Math.min(255, col[1] + 55) + "," + Math.min(255, col[2] + 55) + ",0.95)"; c.fillText(gt, gs[0], gs[1]);
      if ("letterSpacing" in c) c.letterSpacing = "0px";
    }
    c.textAlign = "start";

    // partículas y estrella fugaz (solo con animaciones activas)
    if (amb) {
      for (i = 0; i < motes.length; i++) {
        var mo = motes[i];
        mo.x += mo.vx * dt / 16; mo.y += mo.vy * dt / 16;
        if (mo.y < -0.02) { mo.y = 1.02; mo.x = Math.random(); } if (mo.x < -0.02) mo.x = 1.02; if (mo.x > 1.02) mo.x = -0.02;
        c.globalAlpha = mo.a * (0.6 + 0.4 * Math.sin(now / 1200 + mo.ph));
        c.fillStyle = "rgba(" + mo.c + ",1)"; c.beginPath(); c.arc(mo.x * W, mo.y * H, mo.r, 0, 6.2832); c.fill();
      }
      c.globalAlpha = 1;
      if (perf === 0) {
        if (!shoot && now > nextShoot) {
          if (nextShoot) shoot = { t0: now, x: Math.random() * W * 0.7, y: Math.random() * H * 0.35, len: 90 + Math.random() * 70 };
          nextShoot = now + 9000 + Math.random() * 9000;
        }
        if (shoot) {
          var st = (now - shoot.t0) / 900;
          if (st >= 1) shoot = null;
          else {
            var hx = shoot.x + st * shoot.len * 2.2, hy = shoot.y + st * shoot.len * 1.1, tx2 = hx - shoot.len * 0.9, ty2 = hy - shoot.len * 0.45;
            var gr = c.createLinearGradient(tx2, ty2, hx, hy);
            gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255," + (0.9 * (1 - st)) + ")");
            c.strokeStyle = gr; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx2, ty2); c.lineTo(hx, hy); c.stroke();
          }
        }
      }
    }
    c.globalAlpha = 1;
  }
  var focusGroup = null, fontBody = "sans-serif", fontDisp = "sans-serif";

  function tick(now) {
    raf = 0;
    if (!active) return;
    var dt = lastT ? Math.min(64, now - lastT) : 16; lastT = now;
    var amb = ambientOn(), busy = false, i;
    if (fly) {
      var p = clamp((now - fly.t0) / fly.ms, 0, 1), e = ease(p);
      V.x = fly.x0 + (fly.x1 - fly.x0) * e; V.y = fly.y0 + (fly.y1 - fly.y0) * e;
      V.k = Math.exp(Math.log(fly.k0) + (Math.log(fly.k1) - Math.log(fly.k0)) * e);
      if (p >= 1) fly = null;
      busy = true;
    }
    if (inertia && !nPtr) {
      V.x -= inertia.vx * dt / V.k; V.y -= inertia.vy * dt / V.k;
      var dec = Math.exp(-dt / 320); inertia.vx *= dec; inertia.vy *= dec;
      clampView();
      if (Math.abs(inertia.vx) + Math.abs(inertia.vy) < 0.02) inertia = null;
      busy = true;
    }
    if (tweening) {
      var tp = clamp((now - tweenStart) / TWEEN_MS, 0, 1), te = ease(tp);
      for (i = 0; i < nodes.length; i++) { var nd = nodes[i]; nd.x = nd.fx + (nd.tx - nd.fx) * te; nd.y = nd.fy + (nd.ty - nd.fy) * te; }
      if (tp >= 1) tweening = false;
      busy = true;
    }
    if (pulse) busy = true;
    if (nPtr) busy = true;
    for (i = 0; i < nodes.length && !busy; i++) if (nodes[i].born && now - nodes[i].born < 820) busy = true;
    if (linkFrom) busy = true;
    if (!busy && amb) {
      var gap = perf >= 2 ? 50 : 32;
      if (now - lastDraw < gap - 3) { raf = requestAnimationFrame(tick); return; }
    }
    var t0 = performance.now();
    draw(now, dt, amb);
    lastDraw = now;
    var cost = performance.now() - t0;
    perfAcc += cost; perfN++;
    if (perfN >= 60) {
      var avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
      if (avg > 12 && perf < 3) { perf++; resize(); initMotes(); }
    }
    if (busy || amb) raf = requestAnimationFrame(tick);
  }

  function resize() {
    if (!cmap || cmap.hidden) return;
    var r = cmap.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    var cap = perf >= 1 ? 1.25 : 2;
    var nd = Math.min(window.devicePixelRatio || 1, cap);
    if (w === W && h === H && nd === dpr && bgC) return;
    var ocx = V.x, ocy = V.y;
    W = w; H = h; dpr = nd;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    V.x = ocx; V.y = ocy;
    buildBg(); kick();
  }

  /* ---------- hit test y gestos ---------- */
  function hitTest(px, py) {
    var best = null, bd = 1e9;
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i], sx = (nd.x - V.x) * V.k + W / 2, sy = (nd.y - V.y) * V.k + H / 2, d = Math.hypot(sx - px, sy - py);
      if (d < Math.max(nd.r * V.k + 10, 24) && d < bd) { bd = d; best = nd; }
    }
    return best;
  }
  function pt(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function onDown(e) {
    hideResults();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (x) { }
    var p = pt(e);
    ptrs[e.pointerId] = p; nPtr = Object.keys(ptrs).length;
    fly = null; inertia = null;
    if (nPtr === 1) { pan = { x: p.x, y: p.y, t: performance.now(), lx: p.x, ly: p.y, lt: performance.now(), vx: 0, vy: 0 }; downInfo = { x: p.x, y: p.y, t: performance.now(), moved: false }; }
    else if (nPtr === 2) {
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      if (downInfo) downInfo.moved = true;
      pan = null;
    }
    kick();
  }
  function onMove(e) {
    var p = pt(e);
    if (!ptrs[e.pointerId]) {
      if (e.pointerType === "mouse") {
        var h = hitTest(p.x, p.y), id = h ? h.id : null;
        if (id !== hover) { hover = id; canvas.style.cursor = id ? "pointer" : "grab"; kick(); }
      }
      return;
    }
    ptrs[e.pointerId] = p;
    if (nPtr === 2 && pinch) {
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      V.x -= (cx - pinch.cx) / V.k; V.y -= (cy - pinch.cy) / V.k;
      var nk = clamp(V.k * d / pinch.d, KMIN, KMAX), wx = (cx - W / 2) / V.k + V.x, wy = (cy - H / 2) / V.k + V.y;
      V.k = nk; V.x = wx - (cx - W / 2) / nk; V.y = wy - (cy - H / 2) / nk;
      pinch.d = d; pinch.cx = cx; pinch.cy = cy;
      clampView(); kick(); return;
    }
    if (nPtr === 1 && pan) {
      var now = performance.now(), dx = p.x - pan.lx, dy = p.y - pan.ly;
      if (downInfo && !downInfo.moved && Math.hypot(p.x - downInfo.x, p.y - downInfo.y) > 8) downInfo.moved = true;
      if (downInfo && downInfo.moved) {
        V.x -= dx / V.k; V.y -= dy / V.k; clampView();
        var dtm = Math.max(1, now - pan.lt);
        pan.vx = pan.vx * 0.6 + (dx / dtm) * 0.4; pan.vy = pan.vy * 0.6 + (dy / dtm) * 0.4;
        canvas.style.cursor = "grabbing";
      }
      pan.lx = p.x; pan.ly = p.y; pan.lt = now; kick();
    }
  }
  function onUp(e) {
    if (!ptrs[e.pointerId]) return;
    var p = pt(e);
    delete ptrs[e.pointerId]; nPtr = Object.keys(ptrs).length;
    try { canvas.releasePointerCapture(e.pointerId); } catch (x) { }
    canvas.style.cursor = "grab";
    if (nPtr === 0) {
      pinch = null;
      if (downInfo && !downInfo.moved && e.type === "pointerup" && performance.now() - downInfo.t < 600) tap(p.x, p.y);
      else if (pan && downInfo && downInfo.moved && e.type === "pointerup") {
        var sp = Math.hypot(pan.vx, pan.vy);
        if (sp > 0.12 && performance.now() - pan.lt < 90) inertia = { vx: clamp(pan.vx, -3, 3), vy: clamp(pan.vy, -3, 3) };
      }
      pan = null; downInfo = null;
    } else if (nPtr === 1) {
      pinch = null;
      var rest = ptrs[Object.keys(ptrs)[0]];
      pan = { x: rest.x, y: rest.y, t: performance.now(), lx: rest.x, ly: rest.y, lt: performance.now(), vx: 0, vy: 0 };
      if (downInfo) downInfo.moved = true;
    }
    kick();
  }
  function tap(x, y) {
    var h = hitTest(x, y);
    if (linkFrom) {
      if (!h) return;
      if (h.id === linkFrom) { api.closeLayer("maplink"); return; }
      finishLink(h.id); return;
    }
    if (h) select(h.id, true); else if (sel) api.closeLayer("mapcard");
  }

  /* ---------- selección y vista previa ---------- */
  function selectedNode() { return sel ? byId[sel] : null; }
  function select(id, fly2) {
    var nd = byId[id]; if (!nd) return;
    sel = id;
    showCard();
    if (fly2 !== false) {
      var h = $("cmCard").offsetHeight || 260, k = clamp(V.k < 0.85 ? 0.95 : V.k, 0.85, 2.4);
      var usableTop = $("cmTop").offsetHeight, areaH = H - h - usableTop, cyScreen = usableTop + Math.max(60, areaH / 2);
      flyTo(nd.tx, nd.ty - (cyScreen - H / 2) / k, k, 650);
    }
    kick();
  }
  function showCard() {
    if (!sel || !byId[sel]) return;
    if (!api.hasLayer("mapcard")) api.pushLayer("mapcard");
    renderCard();
    $("cmCard").hidden = false;
    cmap.style.setProperty("--cardh", ($("cmCard").offsetHeight || 0) + "px");
    $("cmHint").hidden = true;
  }
  function hideCardUI() {
    sel = null; $("cmCard").hidden = true; cmap.style.setProperty("--cardh", "0px"); kick(); updateOverlays();
  }
  function excerptOf(n) {
    if (n.type === "list") {
      var l = n.items.filter(function (i) { return i.t.trim(); }).slice(0, 4).map(function (i) { return (i.done ? "☑ " : "☐ ") + i.t; });
      return l.length ? l.join("\n") : "Lista sin elementos";
    }
    var t = n.body.replace(/\s+/g, " ").trim();
    return t ? (t.length > 190 ? t.slice(0, 190).trim() + "…" : t) : "Sin texto";
  }
  function connectedTo(id) {
    var out = [];
    S.links.forEach(function (p) { var o = p[0] === id ? p[1] : p[1] === id ? p[0] : null; if (o && byId[o]) out.push(byId[o]); });
    return out;
  }
  function renderCard() {
    var nd = selectedNode(), card = $("cmCard"); if (!nd) return;
    var n = nd.n; card.textContent = "";
    var head = el("div", "cm-chead");
    var ic = api.iconSpan(n.icon, "static"); if (ic) head.appendChild(ic);
    var ttl = el("h2", "cm-ctitle", (n.title || "").trim() || (n.type === "list" ? "Lista sin título" : "Sin título"));
    head.appendChild(ttl);
    var x = button("×", "cm-x", function () { api.closeLayer("mapcard"); }); x.setAttribute("aria-label", "Cerrar vista previa");
    head.appendChild(x); card.appendChild(head);
    var meta;
    if (n.type === "list") {
      var real = n.items.filter(function (i) { return i.t.trim(); }), dn = real.filter(function (i) { return i.done; }).length;
      meta = dn + " de " + real.length + " elementos";
    } else { var w = (n.body.trim().match(/\S+/g) || []).length; meta = w + (w === 1 ? " palabra" : " palabras"); }
    card.appendChild(el("div", "cm-cmeta", "Editada " + api.when(n.updatedAt) + " · " + meta + (n.archived ? " · archivada" : "") + (n.pinned ? " · fijada" : "")));
    card.appendChild(el("p", "cm-cex", excerptOf(n)));
    if (n.tags.length) {
      var tg = el("div", "cm-ctags");
      n.tags.slice(0, 6).forEach(function (t) { tg.appendChild(el("span", "tag", "#" + t)); });
      card.appendChild(tg);
    }
    // conexiones de esta nota
    var cons = connectedTo(nd.id), cs = el("div", "cm-csec");
    cs.appendChild(el("div", "flabel", "Conexiones"));
    var cr = el("div", "cm-chips");
    if (!cons.length) cr.appendChild(el("span", "cm-none", "Sin conexiones todavía"));
    cons.forEach(function (o) {
      var ch = el("span", "chip cm-link");
      var go = el("button", "cm-linkgo", o.label); go.type = "button"; go.title = "Ir a esta nota";
      go.addEventListener("click", function () { select(o.id, true); });
      var rm = el("button", "cm-linkx", "×"); rm.type = "button"; rm.setAttribute("aria-label", "Quitar la conexión con " + o.label);
      rm.addEventListener("click", function () { removeLink(nd.id, o.id); });
      ch.appendChild(go); ch.appendChild(rm); cr.appendChild(ch);
    });
    cs.appendChild(cr); card.appendChild(cs);
    // constelaciones de esta nota
    var gs = el("div", "cm-csec");
    gs.appendChild(el("div", "flabel", "Constelaciones"));
    var gr = el("div", "cm-chips");
    S.groups.forEach(function (g) {
      var on = g.ids.indexOf(nd.id) >= 0, b = el("button", "chip cm-gchip"); b.type = "button";
      b.setAttribute("aria-pressed", on ? "true" : "false");
      var dot = el("span", "cm-dot"); dot.style.background = "rgb(" + GCOL[g.color].join(",") + ")";
      b.appendChild(dot); b.appendChild(document.createTextNode(g.name));
      b.addEventListener("click", function () { toggleMember(g.id, nd.id); renderCard(); cmap.style.setProperty("--cardh", card.offsetHeight + "px"); });
      gr.appendChild(b);
    });
    var nb = el("button", "chip cm-gchip new", "+ Nueva"); nb.type = "button";
    nb.addEventListener("click", function () { openGroups(nd.id); });
    gr.appendChild(nb);
    gs.appendChild(gr); card.appendChild(gs);
    var act = el("div", "cm-cact");
    var op = button("Abrir y editar", "btn primary", function () { api.openNote(nd.id); });
    act.appendChild(op);
    act.appendChild(button("Vincular con otra nota", "btn", startLink));
    card.appendChild(act);
  }

  /* ---------- conexiones ---------- */
  function startLink() {
    var nd = selectedNode(); if (!nd) return;
    if (nodes.length < 2) { api.toast("Necesitás al menos dos notas para conectarlas"); return; }
    linkFrom = nd.id;
    $("cmCard").hidden = true; cmap.style.setProperty("--cardh", "0px");
    $("cmBanTxt").textContent = "Tocá la nota que querés conectar con «" + nd.label + "»";
    $("cmBanner").hidden = false;
    api.pushLayer("maplink");
    kick();
  }
  function endLinkUI() {
    if (!linkFrom) return;
    linkFrom = null; $("cmBanner").hidden = true;
    if (sel && byId[sel]) { $("cmCard").hidden = false; renderCard(); cmap.style.setProperty("--cardh", $("cmCard").offsetHeight + "px"); }
    kick();
  }
  function finishLink(otherId) {
    var from = linkFrom, a = byId[from], b = byId[otherId]; if (!a || !b) return;
    if (linkSet[lk(from, otherId)]) {
      api.toast("«" + a.label + "» y «" + b.label + "» ya están conectadas", "Quitar conexión", function () { removeLink(from, otherId); });
    } else {
      addLink(from, otherId);
      api.toast("Conectadas: «" + a.label + "» y «" + b.label + "»", "Deshacer", function () { removeLink(from, otherId); });
    }
    api.closeLayer("maplink");
  }
  function addLink(a, b) {
    if (!addLinkRaw(a, b)) return false;
    structureChanged(); return true;
  }
  function removeLink(a, b) {
    var k = lk(a, b); if (!linkSet[k]) return false;
    delete linkSet[k];
    S.links = S.links.filter(function (p) { return lk(p[0], p[1]) !== k; });
    structureChanged();
    if (sel && $("cmCard") && !$("cmCard").hidden) { renderCard(); cmap.style.setProperty("--cardh", $("cmCard").offsetHeight + "px"); }
    return true;
  }

  /* ---------- constelaciones (grupos) ---------- */
  function createGroup(name, color, ids) {
    var g = cleanGroup({ id: api.uid(), name: name, color: color, ids: ids || [] });
    S.groups.push(g); structureChanged(); return g;
  }
  function toggleMember(gid, nid) {
    var g = S.groups.filter(function (x) { return x.id === gid; })[0]; if (!g) return;
    var i = g.ids.indexOf(nid);
    if (i >= 0) g.ids.splice(i, 1); else g.ids.push(nid);
    structureChanged();
  }
  function deleteGroup(gid) {
    S.groups = S.groups.filter(function (g) { return g.id !== gid; });
    if (focusGroup === gid) focusGroup = null;
    structureChanged();
  }
  // Algo cambió en las conexiones o grupos: reconstruir, reordenar con suavidad y guardar
  function structureChanged() {
    if (!mapOpen) { saveSoon(); return; }
    refresh(); updateOverlays(); kick();
  }

  var groupsOpen = null, newColor = 0, pendingNote = null, memberFilter = "";
  function openGroups(forNote) {
    pendingNote = forNote || null;
    if (!api.hasLayer("mapgroups")) api.pushLayer("mapgroups");
    $("cmScrim").hidden = false; $("cmSheet").hidden = false;
    renderGroups();
  }
  function closeGroupsUI() { $("cmSheet").hidden = true; $("cmScrim").hidden = true; pendingNote = null; groupsOpen = null; }
  function swatches(current, onPick) {
    var row = el("div", "cm-sw");
    GCOL.forEach(function (c, i) {
      var b = el("button", "cm-swb"); b.type = "button"; b.style.background = "rgb(" + c.join(",") + ")";
      b.title = GNAME[i]; b.setAttribute("aria-label", GNAME[i]); b.setAttribute("aria-pressed", current === i ? "true" : "false");
      b.addEventListener("click", function () { onPick(i); });
      row.appendChild(b);
    });
    return row;
  }
  function renderGroups() {
    var box = $("cmSheetBody"), st = box.scrollTop; box.textContent = "";
    box.appendChild(el("p", "hint", "Agrupá notas por tema. Las notas no se borran ni se mueven de la lista: solo se juntan en el mapa."));
    // crear
    var form = el("div", "cm-create");
    if (pendingNote && byId[pendingNote]) form.appendChild(el("div", "cm-pend", "Se agregará «" + byId[pendingNote].label + "» a la nueva constelación"));
    var inp = el("input"); inp.type = "text"; inp.id = "cmGName"; inp.maxLength = 40; inp.placeholder = "Nombre, por ejemplo: Ideas para mi juego";
    inp.setAttribute("aria-label", "Nombre de la nueva constelación"); inp.setAttribute("enterkeyhint", "done");
    form.appendChild(inp);
    form.appendChild(swatches(newColor, function (i) { newColor = i; var v = inp.value; renderGroups(); $("cmGName").value = v; }));
    var create = button("Crear constelación", "btn primary", function () {
      var name = inp.value.trim();
      if (!name) { api.toast("Escribí un nombre para la constelación"); inp.focus(); return; }
      var g = createGroup(name, newColor, pendingNote ? [pendingNote] : []);
      pendingNote = null; groupsOpen = g.id; newColor = (newColor + 1) % GCOL.length; memberFilter = "";
      api.toast("Constelación «" + g.name + "» creada");
      renderGroups();
      if (sel && !$("cmCard").hidden) renderCard();
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); create.click(); } });
    form.appendChild(create); box.appendChild(form);
    // lista
    if (!S.groups.length) box.appendChild(el("p", "cm-none", "Todavía no creaste ninguna constelación."));
    S.groups.forEach(function (g) {
      var open = groupsOpen === g.id, item = el("div", "cm-g" + (open ? " open" : ""));
      var head = el("button", "cm-ghead"); head.type = "button"; head.setAttribute("aria-expanded", open ? "true" : "false");
      var dot = el("span", "cm-dot"); dot.style.background = "rgb(" + GCOL[g.color].join(",") + ")"; head.appendChild(dot);
      var nm = el("span", "cm-gname", g.name); head.appendChild(nm);
      var cnt = el("span", "cm-gcount", countText(g)); head.appendChild(cnt);
      head.appendChild(el("span", "cm-chev", open ? "▾" : "▸"));
      head.addEventListener("click", function () { groupsOpen = open ? null : g.id; memberFilter = ""; renderGroups(); });
      item.appendChild(head);
      if (open) {
        var body = el("div", "cm-gbody");
        var ren = el("input"); ren.type = "text"; ren.value = g.name; ren.maxLength = 40; ren.setAttribute("aria-label", "Nombre de la constelación");
        ren.addEventListener("input", function () { g.name = ren.value.slice(0, 40) || "Constelación"; nm.textContent = g.name; saveSoon(); kick(); });
        ren.addEventListener("change", function () { if (!ren.value.trim()) ren.value = g.name; if (sel) renderCard(); });
        body.appendChild(ren);
        body.appendChild(swatches(g.color, function (i) { g.color = i; saveSoon(); renderGroups(); kick(); buildGroupEdges(); if (sel) renderCard(); }));
        var row = el("div", "cm-grow");
        row.appendChild(button("Ver en el mapa", "btn small", function () { focusOnGroup(g.id); }));
        var del = button("Eliminar constelación", "btn small danger");
        armedDelete(del, function () { deleteGroup(g.id); groupsOpen = null; api.toast("Constelación eliminada. Tus notas siguen intactas."); renderGroups(); if (sel) renderCard(); });
        row.appendChild(del); body.appendChild(row);
        var fl = el("input"); fl.type = "search"; fl.placeholder = "Buscar notas para agregar o quitar"; fl.value = memberFilter; fl.setAttribute("aria-label", "Filtrar notas");
        body.appendChild(fl);
        var list = el("div", "cm-mlist"); body.appendChild(list);
        var fill = function () {
          list.textContent = "";
          var q = memberFilter.trim().toLowerCase(), arr = nodes.filter(function (nd) { return !q || (nd.label + " " + nd.n.tags.join(" ")).toLowerCase().indexOf(q) >= 0; });
          arr.sort(function (a, b) { var ma = g.ids.indexOf(a.id) >= 0, mb = g.ids.indexOf(b.id) >= 0; return (mb - ma) || a.label.localeCompare(b.label, "es", { sensitivity: "base" }); });
          if (!arr.length) list.appendChild(el("div", "cm-none", nodes.length ? "Ninguna nota coincide" : "Todavía no hay notas"));
          arr.slice(0, 120).forEach(function (nd) {
            var lab = el("label", "cm-mrow"), cb = el("input"); cb.type = "checkbox"; cb.checked = g.ids.indexOf(nd.id) >= 0;
            cb.addEventListener("change", function () { toggleMember(g.id, nd.id); cnt.textContent = countText(g); if (sel && !$("cmCard").hidden) renderCard(); });
            lab.appendChild(cb); var ic = api.iconSpan(nd.n.icon, "static"); if (ic) lab.appendChild(ic);
            lab.appendChild(el("span", "cm-mt", nd.label)); list.appendChild(lab);
          });
        };
        fl.addEventListener("input", function () { memberFilter = fl.value; fill(); });
        fill(); item.appendChild(body);
      }
      box.appendChild(item);
    });
    box.scrollTop = st;
    updateOverlays();
  }
  function countText(g) {
    var c = 0; g.ids.forEach(function (id) { if (byId[id]) c++; });
    return c + (c === 1 ? " nota" : " notas");
  }
  function armedDelete(btn, run) {
    var original = btn.textContent, timer = null, on = false;
    btn.addEventListener("click", function () {
      if (!on) { on = true; btn.textContent = "¿Seguro? Tocá de nuevo"; timer = setTimeout(function () { on = false; btn.textContent = original; }, 3200); return; }
      clearTimeout(timer); on = false; btn.textContent = original; run();
    });
  }
  function focusOnGroup(gid) {
    var info = gInfo.filter(function (g) { return g.g.id === gid; })[0];
    if (!info || !info.m.length) { api.toast("Esta constelación todavía no tiene notas"); return; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    info.m.forEach(function (nd) { x0 = Math.min(x0, nd.tx); y0 = Math.min(y0, nd.ty); x1 = Math.max(x1, nd.tx); y1 = Math.max(y1, nd.ty); });
    var bw = x1 - x0 + 200, bh = y1 - y0 + 200, k = clamp(Math.min(W / bw, (H - $("cmTop").offsetHeight - 40) / bh), 0.3, 1.6);
    focusGroup = gid;
    api.closeLayer("mapgroups");
    var u = $("cmTop").offsetHeight, ucy = u + (H - u) / 2;
    setTimeout(function () { flyTo((x0 + x1) / 2, (y0 + y1) / 2 - (ucy - H / 2) / k, k, 800); }, 60);
    setTimeout(function () { focusGroup = null; kick(); }, 2600);
  }

  /* ---------- búsqueda ---------- */
  function hay(n) {
    return ((n.title || "") + "\n" + n.body + "\n" + n.items.map(function (i) { return i.t; }).join("\n") + "\n" + n.tags.join(" ")).toLowerCase();
  }
  function hideResults() { var r = $("cmRes"); if (r) r.hidden = true; }
  function runSearch() {
    var raw = $("cmQ").value; query = raw.trim().toLowerCase();
    $("cmQx").hidden = !raw;
    var res = $("cmRes"); res.textContent = "";
    if (!query) { matchSet = null; res.hidden = true; kick(); return; }
    var found = nodes.filter(function (nd) { return hay(nd.n).indexOf(query) >= 0; });
    matchSet = {}; found.forEach(function (nd) { matchSet[nd.id] = 1; });
    found.sort(function (a, b) {
      var ta = a.label.toLowerCase().indexOf(query) >= 0 ? 0 : 1, tb = b.label.toLowerCase().indexOf(query) >= 0 ? 0 : 1;
      return ta - tb || b.n.updatedAt - a.n.updatedAt;
    });
    if (!found.length) { var li0 = el("li", "cm-nores", "Ninguna estrella coincide"); res.appendChild(li0); }
    found.slice(0, 6).forEach(function (nd) {
      var li = el("li"), b = el("button", "cm-res"); b.type = "button";
      var ic = api.iconSpan(nd.n.icon, "static"); if (ic) b.appendChild(ic);
      var tx = el("span", "cm-rt"); tx.appendChild(el("span", "cm-rtt", nd.label));
      tx.appendChild(el("span", "cm-rts", excerptOf(nd.n).replace(/\n/g, " · ").slice(0, 60)));
      b.appendChild(tx);
      b.addEventListener("click", function () { pickResult(nd.id); });
      li.appendChild(b); res.appendChild(li);
    });
    if (found.length > 6) res.appendChild(el("li", "cm-nores", "y " + (found.length - 6) + " más resaltadas en el mapa"));
    res.hidden = false; kick();
  }
  function pickResult(id) {
    hideResults();
    pulse = { id: id, t0: performance.now() };
    $("cmQ").blur();
    select(id, true);
  }
  function clearSearch() { $("cmQ").value = ""; runSearch(); }

  /* ---------- superposiciones: vacío, ayuda, conteo ---------- */
  function updateOverlays() {
    var count = nodes.length, hasStruct = S.links.length > 0 || S.groups.length > 0;
    $("cmEmpty").hidden = count > 0;
    $("cmHint").hidden = !(count > 0 && !hasStruct && !S.hint && !sel && !linkFrom && $("cmSheet").hidden);
    var gn = S.groups.length;
    $("cmGn").textContent = gn ? String(gn) : "";
    var t = count + (count === 1 ? " nota" : " notas") + " · " + mEdges.length + (mEdges.length === 1 ? " conexión" : " conexiones") + " · " + gn + (gn === 1 ? " constelación" : " constelaciones");
    $("cmCount").textContent = count ? t : "";
    $("cmTags").setAttribute("aria-pressed", S.tagLines ? "true" : "false");
    $("cmFind").disabled = !count; $("cmQ").disabled = !count;
  }

  /* ---------- refrescar desde las notas ---------- */
  function refresh(cold) {
    rebuildGraph();
    var sig = signature(), firstTime = nodes.some(function (nd) { return !nd.placed; });
    var allPos = nodes.every(function (nd) { return S.pos[nd.id]; });
    if (cold) { S.pos = {}; runLayout(true); }
    else if (sig !== S.sig || (firstTime && !allPos)) runLayout(false);
    else if (firstTime) {
      // mismo grafo que la última vez: se reutilizan las posiciones guardadas sin recalcular
      nodes.forEach(function (nd) { var p = S.pos[nd.id]; nd.x = nd.fx = nd.tx = p[0]; nd.y = nd.fy = nd.ty = p[1]; nd.placed = true; nd.born = 0; });
      buildGroupEdges(); computeBounds();
    }
    S.sig = sig;
    if (sel && !byId[sel]) { api.closeLayer("mapcard"); }
    if (query) runSearch();
    saveSoon();
    if (sel && byId[sel] && !$("cmCard").hidden) renderCard();
    updateOverlays();
    kick();
  }

  /* ---------- abrir, cerrar, suspender ---------- */
  function open() {
    if (mapOpen) return;
    mapOpen = true; shown = true;
    cmap.hidden = false; document.body.classList.add("cm-open");
    api.pushLayer("map");
    applyAccent();
    resize();
    var firstView = !S.view;
    refresh(false);
    if (S.view) { V.x = S.view.x; V.y = S.view.y; V.k = S.view.k; }
    else { var t = fitTarget(); V.x = t.x; V.y = t.y; V.k = t.k * 0.72; flyTo(t.x, t.y, t.k, 1100); }
    initMotes(); nextShoot = performance.now() + 4000;
    setActive(); kick();
    try { $("cmapSegMap").focus({ preventScroll: true }); } catch (e) { }
  }
  function leaveMapUI() {
    if (!mapOpen) return;
    S.view = { x: V.x, y: V.y, k: V.k }; saveStoreNow();
    mapOpen = false; shown = false; cmap.hidden = true;
    document.body.classList.remove("cm-open");
    $("cmSheet").hidden = true; $("cmScrim").hidden = true; $("cmCard").hidden = true; $("cmBanner").hidden = true;
    sel = null; linkFrom = null; hideResults(); ptrs = {}; nPtr = 0; pan = null; pinch = null; downInfo = null;
    setActive();
  }
  function suspend() { if (!mapOpen) return; S.view = { x: V.x, y: V.y, k: V.k }; saveSoon(); shown = false; cmap.hidden = true; setActive(); }
  function resume() {
    if (!mapOpen) return;
    shown = true; cmap.hidden = false; resize(); refresh(false);
    ptrs = {}; nPtr = 0; pan = null; pinch = null; downInfo = null;
    setActive(); kick();
  }

  function applyAccent() {
    if (!cmap) return;
    var cs = getComputedStyle(document.documentElement);
    fontBody = cs.getPropertyValue("--font-body") || "sans-serif"; fontDisp = cs.getPropertyValue("--font-display") || "sans-serif";
    var a = api.accent(), h = a[0].replace("#", "");
    cmap.style.setProperty("--accent", a[0]); cmap.style.setProperty("--accent-ink", a[1]);
    cmap.style.setProperty("--accent-soft", "rgba(" + parseInt(h.slice(0, 2), 16) + "," + parseInt(h.slice(2, 4), 16) + "," + parseInt(h.slice(4, 6), 16) + ",0.24)");
    kick();
  }

  /* ---------- copia de seguridad ---------- */
  function exportData() { return { v: 1, links: S.links.slice(), groups: JSON.parse(JSON.stringify(S.groups)) }; }
  function importData(d) {
    if (!d || typeof d !== "object") return;
    var changed = false;
    (Array.isArray(d.links) ? d.links : []).forEach(function (p) {
      if (Array.isArray(p) && api.notes.has(String(p[0])) && api.notes.has(String(p[1]))) { if (addLinkRaw(p[0], p[1])) changed = true; }
    });
    (Array.isArray(d.groups) ? d.groups : []).forEach(function (g) {
      var c = cleanGroup(g); if (!c) return;
      c.ids = c.ids.filter(function (id) { return api.notes.has(id); });
      var ex = S.groups.filter(function (x) { return x.id === c.id; })[0];
      if (!ex) { S.groups.push(c); changed = true; }
      else c.ids.forEach(function (id) { if (ex.ids.indexOf(id) < 0) { ex.ids.push(id); changed = true; } });
    });
    if (changed) { if (mapOpen) structureChanged(); else saveSoon(); }
  }
  // Quita referencias a notas que ya no existen (borradas para siempre)
  function prune() {
    if (!api) return;
    var changed = false, before = S.links.length;
    S.links = S.links.filter(function (p) { var ok = api.notes.has(p[0]) && api.notes.has(p[1]); if (!ok) delete linkSet[lk(p[0], p[1])]; return ok; });
    if (S.links.length !== before) changed = true;
    S.groups.forEach(function (g) {
      var n0 = g.ids.length; g.ids = g.ids.filter(function (id) { return api.notes.has(id); });
      if (g.ids.length !== n0) changed = true;
    });
    if (changed) { if (mapOpen && shown) structureChanged(); else saveSoon(); }
  }

  /* ---------- arranque ---------- */
  function init(a) {
    api = a;
    cmap = $("cmap"); canvas = $("cmCanvas"); ctx = canvas.getContext("2d");
    loadStore();
    prune();
    api.registerLayer("map", leaveMapUI);
    api.registerLayer("mapcard", hideCardUI);
    api.registerLayer("mapgroups", closeGroupsUI);
    api.registerLayer("maplink", endLinkUI);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", function () { if (hover) { hover = null; kick(); } });
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); var p = pt(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0016)); }, { passive: false });
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvas.addEventListener("keydown", function (e) {
      var step = 70 / V.k, used = true;
      if (e.key === "ArrowLeft") V.x -= step; else if (e.key === "ArrowRight") V.x += step;
      else if (e.key === "ArrowUp") V.y -= step; else if (e.key === "ArrowDown") V.y += step;
      else if (e.key === "+" || e.key === "=") zoomAt(W / 2, H / 2, 1.25); else if (e.key === "-") zoomAt(W / 2, H / 2, 0.8);
      else used = false;
      if (used) { e.preventDefault(); clampView(); kick(); }
    });
    window.addEventListener("resize", function () { if (mapOpen && shown) resize(); });
    if (window.ResizeObserver) new ResizeObserver(function () { if (mapOpen && shown) resize(); }).observe(cmap);
    document.addEventListener("visibilitychange", function () { if (document.hidden && mapOpen) { S.view = { x: V.x, y: V.y, k: V.k }; saveStoreNow(); } setActive(); });
    window.addEventListener("pagehide", function () { if (mapOpen) S.view = { x: V.x, y: V.y, k: V.k }; if (nodes.length || S.links.length || S.groups.length) saveStoreNow(); });
    if (reduceMQ && reduceMQ.addEventListener) reduceMQ.addEventListener("change", function () { kick(); });

    // conmutador Notas | Constelaciones (en la lista y en el mapa)
    document.querySelectorAll(".viewseg button").forEach(function (b) {
      b.addEventListener("click", function () { if (b.dataset.mode === "map") open(); else api.closeLayer("map"); });
    });
    $("cmZoomIn").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1.35); });
    $("cmZoomOut").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1 / 1.35); });
    $("cmFit").addEventListener("click", function () { fitView(true); });
    $("cmGroups").addEventListener("click", function () { openGroups(null); });
    $("cmTags").addEventListener("click", function () { S.tagLines = !S.tagLines; saveSoon(); updateOverlays(); kick(); });
    $("cmRelayout").addEventListener("click", function () {
      refresh(true); fitView(true); api.toast("Mapa reorganizado");
    });
    $("cmFind").addEventListener("click", function () { $("cmQ").focus(); });
    $("cmQ").addEventListener("input", runSearch);
    $("cmQ").addEventListener("focus", function () { if (query) runSearch(); });
    $("cmQ").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); var first = $("cmRes").querySelector("button"); if (first) first.click(); }
      else if (e.key === "Escape") { e.stopPropagation(); if ($("cmQ").value) clearSearch(); else $("cmQ").blur(); }
    });
    $("cmQx").addEventListener("click", function () { clearSearch(); $("cmQ").focus(); });
    $("cmBanCancel").addEventListener("click", function () { api.closeLayer("maplink"); });
    $("cmScrim").addEventListener("click", function () { api.closeLayer("mapgroups"); });
    $("cmSheetClose").addEventListener("click", function () { api.closeLayer("mapgroups"); });
    $("cmEmptyNew").addEventListener("click", function () { api.createNote("text"); });
    $("cmHintGroup").addEventListener("click", function () { S.hint = true; saveSoon(); updateOverlays(); openGroups(null); });
    $("cmHintOk").addEventListener("click", function () { S.hint = true; saveSoon(); updateOverlays(); });
    applyAccent();
  }

  window.TronxMap = {
    init: init, open: open, close: function () { api && api.closeLayer("map"); }, isOpen: function () { return mapOpen; },
    suspend: suspend, resume: resume, prune: prune, exportData: exportData, importData: importData, refreshTheme: applyAccent,
    state: function () {
      return {
        open: mapOpen, shown: shown, active: active, view: { x: V.x, y: V.y, k: V.k }, W: W, H: H, dpr: dpr, perf: perf, sel: sel,
        nodes: nodes.map(function (nd) { return { id: nd.id, sx: (nd.x - V.x) * V.k + W / 2, sy: (nd.y - V.y) * V.k + H / 2, x: nd.x, y: nd.y, tx: nd.tx, ty: nd.ty, r: nd.r }; }),
        links: S.links.slice(), groups: JSON.parse(JSON.stringify(S.groups)), tagEdges: tEdges.length, groupEdges: gEdges.length,
        raf: !!raf
      };
    }
  };
})();
