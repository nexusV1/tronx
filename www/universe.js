/* Pantalla de inicio de Tronx.
 *
 * Todo el universo se dibuja en un único <canvas>, sin miles de elementos del DOM:
 *   cielo profundo, nebulosas, miles de estrellas en tres capas de profundidad,
 *   una galaxia espiral prerenderizada que gira despacio y, de vez en cuando,
 *   un agujero negro que cruza el centro y absorbe las estrellas cercanas.
 * El título y la descripción se separan en letras sueltas: cuando el agujero negro pasa por el texto,
 * las letras cercanas se deforman, se absorben una a una en espiral y después se reconstruyen.
 * La calidad baja sola si el dispositivo no llega a una cantidad de cuadros por segundo razonable.
 * El botón funciona aunque falle el canvas.
 */
(function () {
  "use strict";

  var splash = document.getElementById("splash");
  var canvas = document.getElementById("universe");
  var btn = document.getElementById("enterBtn");
  var appEl = document.getElementById("app");
  if (!splash || !btn) return;

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var entering = false, finished = false, running = false, warpOn = false, warp = 0;
  var raf = 0;
  var api = (window.TronxUniverse = {
    blackHole: function () {},
    enter: enter,
    stats: function () { return { running: false }; }
  });

  /* ---------- entrada a la app ---------- */
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function finish() {
    if (finished) return;
    finished = true;
    stop();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (splash.parentNode) splash.parentNode.removeChild(splash);
    if (appEl) {
      appEl.removeAttribute("inert");
      appEl.removeAttribute("aria-hidden");
      appEl.classList.add("reveal");
    }
    try { document.dispatchEvent(new CustomEvent("tronx:enter")); } catch (e) {}
  }
  function enter() {
    if (entering) return;
    entering = true;
    btn.disabled = true;
    splash.classList.add("entering");
    if (running && !reduce) {
      warpOn = true;
      setTimeout(function () { splash.classList.add("leaving"); }, 650);
      setTimeout(finish, 1180);
    } else {
      setTimeout(function () { splash.classList.add("leaving"); }, 220);
      setTimeout(finish, 720);
    }
  }
  btn.addEventListener("click", enter);

  var ctx = null;
  try { ctx = canvas && canvas.getContext("2d", { alpha: false }); } catch (e) { ctx = null; }
  if (!ctx) return;

  /* ---------- calidad adaptativa ---------- */
  var dpr = window.devicePixelRatio || 1;
  var TIERS = [
    { stars: 2600, flares: 26, galaxy: 9000, res: Math.min(dpr, 1.5), lens: true, neb: true },
    { stars: 1100, flares: 14, galaxy: 6600, res: 1, lens: true, neb: true },
    { stars: 560, flares: 8, galaxy: 3000, res: 0.75, lens: false, neb: false }
  ];
  var tier = 0;
  if (reduce) tier = 1;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) tier = Math.max(tier, 1);
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) tier = Math.max(tier, 1);

  var W = 0, H = 0, res = 1, gcx = 0, gcy = 0;
  var clock = 0, last = null;
  var skyCv = null, galaxyCv = null, flareCv = null, nebCvs = [], lensCv = null, lensCtx = null;

  /* ---------- utilidades ---------- */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
  function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function mk(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  /* ---------- sprites prerenderizados ---------- */
  function buildGalaxy(count) {
    var g = 760, c = mk(g, g), x = c.getContext("2d"), R = g / 2, i;
    x.globalCompositeOperation = "lighter";
    var h = x.createRadialGradient(R, R, 0, R, R, R);
    h.addColorStop(0, "rgba(120,120,255,0.24)");
    h.addColorStop(0.35, "rgba(90,80,210,0.12)");
    h.addColorStop(1, "rgba(40,30,120,0)");
    x.fillStyle = h; x.fillRect(0, 0, g, g);

    var arms = 2, twist = 5.4;
    for (i = 0; i < count; i++) {
      var rn = Math.pow(Math.random(), 0.72) * 0.92 + 0.015;
      var r = rn * R;
      var arm = ((Math.random() * arms) | 0) * (Math.PI * 2 / arms);
      var disk = Math.random() < 0.3;   // estrellas del disco, entre los brazos
      var th = disk ? Math.random() * 6.2832 : arm + rn * twist + (0.1 + 0.42 * rn) * gauss();
      var px = R + Math.cos(th) * r, py = R + Math.sin(th) * r;
      var cr, cg, cb;
      if (rn < 0.2) { cr = 255; cg = 226; cb = 182; }
      else if (rn < 0.5) { var m = (rn - 0.2) / 0.3; cr = 255 - 70 * m; cg = 226 - 20 * m; cb = 182 + 73 * m; }
      else { cr = 150 + rand(-20, 40); cg = 170 + rand(-20, 20); cb = 255; }
      var q = Math.random();
      if (rn > 0.32 && q < 0.05) { cr = 255; cg = 140; cb = 205; }
      else if (rn > 0.4 && q > 0.965) { cr = 120; cg = 235; cb = 255; }
      var a = ((1 - rn) * 0.62 + 0.2) * rand(0.55, 1) * (disk ? 0.6 : 1);
      var s = (0.8 + Math.random() * 1.6) * (rn < 0.3 ? 0.8 : 1);
      x.fillStyle = "rgba(" + (cr | 0) + "," + (cg | 0) + "," + (cb | 0) + "," + a.toFixed(3) + ")";
      x.fillRect(px - s / 2, py - s / 2, s, s);
    }
    // resplandor: la misma imagen reducida y ampliada vuelve a sumarse como bruma luminosa
    var hz = c, hs = g, hc;
    while (hs > 100) { hs = Math.round(hs / 2); hc = mk(hs, hs); hc.getContext("2d").drawImage(hz, 0, 0, hs, hs); hz = hc; }
    x.globalAlpha = 0.95; x.drawImage(hz, 0, 0, g, g); x.globalAlpha = 1;
    // regiones de formación estelar a lo largo de los brazos
    for (i = 0; i < 46; i++) {
      var n2 = rand(0.25, 0.88), th2 = ((Math.random() * arms) | 0) * (Math.PI * 2 / arms) + n2 * twist + 0.05 * gauss();
      var bx = R + Math.cos(th2) * n2 * R, by = R + Math.sin(th2) * n2 * R, br = rand(5, 16);
      var bg = x.createRadialGradient(bx, by, 0, bx, by, br);
      var pink = Math.random() < 0.55;
      bg.addColorStop(0, pink ? "rgba(255,140,200,0.34)" : "rgba(130,190,255,0.34)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = bg; x.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    // bandas de polvo
    x.globalCompositeOperation = "source-over";
    for (i = 0; i < count * 0.13; i++) {
      var rn3 = rand(0.18, 0.85);
      var th3 = ((Math.random() * arms) | 0) * (Math.PI * 2 / arms) + rn3 * twist + 0.2 + 0.05 * gauss();
      var dx = R + Math.cos(th3) * rn3 * R, dy = R + Math.sin(th3) * rn3 * R, ds = rand(2, 6);
      x.fillStyle = "rgba(3,2,14," + rand(0.05, 0.12).toFixed(3) + ")";
      x.fillRect(dx - ds / 2, dy - ds / 2, ds, ds);
    }
    // núcleo luminoso
    x.globalCompositeOperation = "lighter";
    var core = x.createRadialGradient(R, R, 0, R, R, R * 0.24);
    core.addColorStop(0, "rgba(255,244,224,0.98)");
    core.addColorStop(0.3, "rgba(255,206,150,0.6)");
    core.addColorStop(0.7, "rgba(170,120,255,0.2)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = core; x.fillRect(0, 0, g, g);
    return c;
  }

  function buildNebula(palette) {
    var s = 512, c = mk(s, s), x = c.getContext("2d");
    x.globalCompositeOperation = "lighter";
    for (var i = 0; i < 10; i++) {
      var cx = rand(110, s - 110), cy = rand(110, s - 110), r = rand(90, 240);
      var col = palette[(Math.random() * palette.length) | 0];
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(" + col + "," + rand(0.14, 0.3).toFixed(3) + ")");
      g.addColorStop(0.55, "rgba(" + col + ",0.07)");
      g.addColorStop(1, "rgba(" + col + ",0)");
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }
    return c;
  }

  function buildFlare() {
    var s = 96, c = mk(s, s), x = c.getContext("2d"), m = s / 2;
    var g = x.createRadialGradient(m, m, 0, m, m, m);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.12, "rgba(210,225,255,0.65)");
    g.addColorStop(0.4, "rgba(150,170,255,0.14)");
    g.addColorStop(1, "rgba(120,140,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "lighter";
    var h = x.createLinearGradient(0, m, s, m);
    h.addColorStop(0, "rgba(255,255,255,0)"); h.addColorStop(0.5, "rgba(255,255,255,0.95)"); h.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = h; x.fillRect(0, m - 0.8, s, 1.6);
    var v = x.createLinearGradient(m, 0, m, s);
    v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(0.5, "rgba(255,255,255,0.95)"); v.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = v; x.fillRect(m - 0.8, 0, 1.6, s);
    return c;
  }

  function buildSky() {
    var c = mk(canvas.width, canvas.height), x = c.getContext("2d");
    x.scale(res, res);
    x.fillStyle = "#02030a"; x.fillRect(0, 0, W, H);
    var g1 = x.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, Math.max(W, H) * 0.72);
    g1.addColorStop(0, "rgba(46,24,104,0.62)");
    g1.addColorStop(0.45, "rgba(18,12,60,0.5)");
    g1.addColorStop(1, "rgba(2,3,10,0)");
    x.fillStyle = g1; x.fillRect(0, 0, W, H);
    var g2 = x.createRadialGradient(W * 0.88, H * 0.9, 0, W * 0.88, H * 0.9, Math.max(W, H) * 0.6);
    g2.addColorStop(0, "rgba(8,86,120,0.42)"); g2.addColorStop(1, "rgba(2,20,40,0)");
    x.fillStyle = g2; x.fillRect(0, 0, W, H);
    var g3 = x.createRadialGradient(W * 0.1, H * 0.1, 0, W * 0.1, H * 0.1, Math.max(W, H) * 0.55);
    g3.addColorStop(0, "rgba(70,20,110,0.34)"); g3.addColorStop(1, "rgba(20,5,40,0)");
    x.fillStyle = g3; x.fillRect(0, 0, W, H);
    return c;
  }

  /* ---------- estrellas ---------- */
  var COLORS = ["#e4edff", "#ffeacb", "#aaf1ff", "#d2bcff"];
  var N = 0, cStart = [0, 0, 0, 0, 0];
  var sx, sy, sz, sb, ss, sp, ox, oy, vx, vy, sa, bs, sl, ab;
  var NF = 0, fx, fy, fs, fp, fv;
  var LAYER_VX = [0, -2.2, -6.5], LAYER_VY = [0, 0.1, 0.7];

  function makeStars() {
    var T = TIERS[tier];
    N = T.stars;
    sx = new Float32Array(N); sy = new Float32Array(N); sz = new Float32Array(N); sb = new Float32Array(N);
    ss = new Float32Array(N); sp = new Float32Array(N); ox = new Float32Array(N); oy = new Float32Array(N);
    vx = new Float32Array(N); vy = new Float32Array(N); sa = new Float32Array(N); bs = new Float32Array(N);
    sl = new Uint8Array(N); ab = new Uint8Array(N);
    var share = [0.55, 0.2, 0.15, 0.1], idx = 0, c, i;
    for (c = 0; c < 4; c++) {
      cStart[c] = idx;
      var cnt = c === 3 ? N - idx : Math.floor(N * share[c]);
      for (i = 0; i < cnt; i++, idx++) {
        var r = Math.random(), layer = r < 0.56 ? 0 : r < 0.88 ? 1 : 2;
        sl[idx] = layer;
        sx[idx] = Math.random() * W; sy[idx] = Math.random() * H;
        sz[idx] = layer === 0 ? rand(0.55, 1.05) : layer === 1 ? rand(0.85, 1.5) : rand(1.2, 2.3);
        sb[idx] = layer === 0 ? rand(0.22, 0.6) : layer === 1 ? rand(0.4, 0.82) : rand(0.62, 1);
        ss[idx] = rand(0.6, 2.8); sp[idx] = rand(0, 6.283);
        sa[idx] = 1;
      }
    }
    cStart[4] = N;
    NF = T.flares;
    fx = new Float32Array(NF); fy = new Float32Array(NF); fs = new Float32Array(NF); fp = new Float32Array(NF); fv = new Float32Array(NF);
    for (i = 0; i < NF; i++) {
      fx[i] = Math.random() * W; fy[i] = Math.random() * H;
      fs[i] = rand(9, 22); fp[i] = rand(0, 6.283); fv[i] = rand(0.35, 1.1);
    }
  }

  /* ---------- tamaño y niveles de calidad ---------- */
  function applyDims() {
    var r = splash.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width || window.innerWidth));
    H = Math.max(1, Math.round(r.height || window.innerHeight));
    res = TIERS[tier].res;
    canvas.width = Math.round(W * res);
    canvas.height = Math.round(H * res);
    gcx = W * 0.5; gcy = H * 0.34;
    skyCv = buildSky();
    hole.r = Math.min(W, H) * 0.055;
    makeStars();
  }
  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (finished) return;
      applyDims();
      if (TX.ready) { if (textActive()) TX.dirty = true; else measureText(); }
      if (!running) draw();
    }, 160);
  }
  function onVisibility() {
    if (finished) return;
    if (document.hidden) { stop(); }
    else if (!reduce) { last = null; running = true; raf = requestAnimationFrame(frame); }
  }

  var fAcc = 0, fCount = 0, fTotal = 0;
  function monitor(dt) {
    fCount++; fAcc += dt; fTotal++;
    if (fTotal < 24) { fCount = 0; fAcc = 0; return; }
    if (fCount >= 45) {
      var avg = fAcc / fCount;
      if (avg > 0.034 && tier < TIERS.length - 1) {
        tier++;
        applyDims();
      }
      fCount = 0; fAcc = 0;
    }
  }

  /* ---------- agujero negro ---------- */
  var hole = { active: false, restoring: false, t: 0, dur: 18, dir: 1, x: -999, y: -999, r: 20, alpha: 0, restoreT: 0, kind: "galaxy", yAim: 0 };
  var nextHoleAt = rand(7, 13);

  function startHole(kind) {
    if (hole.active || hole.restoring || entering || reduce) return;
    if (TX.busy) return;
    hole.r = Math.min(W, H) * 0.055;
    if (TX.ready && !TX.busy) measureText();
    if (kind !== "text" && kind !== "galaxy") kind = (TX.ready && Math.random() < 0.7) ? "text" : "galaxy";
    if (kind === "text" && !TX.ready) kind = "galaxy";
    hole.kind = kind;
    hole.dur = kind === "text" ? 21 : 18;
    if (kind === "text") hole.yAim = TX.minY + (TX.maxY - TX.minY) * rand(0.12, 0.95);
    hole.active = true; hole.t = 0; hole.dir = Math.random() < 0.5 ? 1 : -1;
    updateHolePos(0);
  }
  function updateHolePos(p) {
    var margin = hole.r * 6;
    var x0 = hole.dir > 0 ? -margin : W + margin, x1 = hole.dir > 0 ? W + margin : -margin;
    hole.x = x0 + (x1 - x0) * p;
    var base = gcy - Math.sin(p * Math.PI) * H * 0.045 + Math.sin(p * 9) * H * 0.006;
    if (hole.kind === "text") {
      // sube hasta la franja del texto mientras cruza por delante de él y luego vuelve al nivel de la galaxia
      var hw = (TX.maxX - TX.minX) / 2, tcx = (TX.maxX + TX.minX) / 2;
      var b = smooth((hw + hole.r * 3 + 190 - Math.abs(hole.x - tcx)) / 150);
      base += (hole.yAim - base) * b + Math.sin(p * 11) * H * 0.004 * b;
    }
    hole.y = base;
    hole.alpha = smooth(p / 0.1) * smooth((1 - p) / 0.1);
  }
  function endHole() {
    hole.active = false; hole.restoring = true; hole.restoreT = 0;
    hole.alpha = 0; hole.x = hole.y = -999;
    for (var i = 0; i < N; i++) {
      if (ab[i]) { ab[i] = 0; ox[i] = 0; oy[i] = 0; vx[i] = 0; vy[i] = 0; sa[i] = -rand(0, 3.5); }
    }
    nextHoleAt = clock + rand(32, 80);
  }
  function physics(dt) {
    var hx = hole.x, hy = hole.y, Rh = hole.r, Rinf = Rh * 6, Rinf2 = Rinf * Rinf, rh2 = Rh * Rh;
    var on = hole.active && hole.alpha > 0.04;
    for (var i = 0; i < N; i++) {
      if (ab[i]) continue;
      var dx = hx - (sx[i] + ox[i]), dy = hy - (sy[i] + oy[i]), d2 = dx * dx + dy * dy;
      if (on && d2 < Rinf2) {
        var d = Math.sqrt(d2) + 0.001, s = 1 - d / Rinf;
        if (d2 < rh2) { ab[i] = 1; sa[i] = 0; vx[i] = 0; vy[i] = 0; continue; }
        var nx = dx / d, ny = dy / d;
        var inward = (140 * s + 2200 * s * s * s) * hole.alpha, swirl = 300 * s * hole.alpha;
        vx[i] += (nx * inward - ny * swirl) * dt;
        vy[i] += (ny * inward + nx * swirl) * dt;
        var damp = 1 - Math.min(0.9, 2.4 * dt * s);
        vx[i] *= damp; vy[i] *= damp;
        bs[i] = s;
      } else {
        if (bs[i] > 0.001) bs[i] *= 1 - Math.min(1, 3 * dt); else bs[i] = 0;
        if (vx[i] !== 0 || vy[i] !== 0) {
          var f = 1 - Math.min(0.95, 1.6 * dt);
          vx[i] *= f; vy[i] *= f;
          if (Math.abs(vx[i]) + Math.abs(vy[i]) < 0.05) { vx[i] = 0; vy[i] = 0; }
        }
      }
      if (vx[i] !== 0 || vy[i] !== 0) { ox[i] += vx[i] * dt; oy[i] += vy[i] * dt; }
    }
  }
  function restore(dt) {
    hole.restoreT += dt;
    var k = Math.exp(-1.7 * dt), still = true;
    for (var i = 0; i < N; i++) {
      if (ox[i] !== 0 || oy[i] !== 0) {
        ox[i] *= k; oy[i] *= k; vx[i] = 0; vy[i] = 0;
        if (Math.abs(ox[i]) + Math.abs(oy[i]) < 0.15) { ox[i] = 0; oy[i] = 0; } else still = false;
      }
      if (sa[i] < 1) { sa[i] = Math.min(1, sa[i] + dt * 0.45); still = false; }
      if (bs[i] > 0) bs[i] = Math.max(0, bs[i] - dt * 2);
    }
    if (still || hole.restoreT > 12) {
      hole.restoring = false;
      for (var j = 0; j < N; j++) { ox[j] = 0; oy[j] = 0; sa[j] = 1; bs[j] = 0; }
    }
  }

  /* ---------- letras: absorción y reconstrucción ---------- */
  var ABS_DUR = 0.62, BUILD_DUR = 0.8;
  var TX = { chars: [], ready: false, busy: false, dirty: false, lastAbsorb: -9, lastBuild: -9,
             minX: 0, maxX: 0, minY: 0, maxY: 0, gone: 0 };

  function splitText(el) {
    if (!el) return;
    var text = el.textContent, parts = text.split(/(\s+)/), frag = document.createDocumentFragment();
    for (var k = 0; k < parts.length; k++) {
      var w = parts[k];
      if (!w) continue;
      if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); continue; }
      var ws = document.createElement("span");
      ws.className = "tx-w";
      for (var i = 0; i < w.length; i++) {
        var c = document.createElement("span");
        c.className = "tx-c";
        c.textContent = w.charAt(i);
        ws.appendChild(c);
        TX.chars.push({ el: c, x: 0, y: 0, st: 0, t: 0, a0: 0, r0: 0, fx: false, pa: Math.random() * 6.28 });
      }
      frag.appendChild(ws);
    }
    el.textContent = "";
    el.appendChild(frag);
  }
  function initText() {
    if (reduce) return;
    try {
      splitText(splash.querySelector(".logo"));
      splitText(splash.querySelector(".tagline"));
      TX.ready = TX.chars.length > 0;
      if (TX.ready) measureText();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { if (!finished && !textActive()) measureText(); });
      }
    } catch (e) { TX.ready = false; }
  }
  function textActive() {
    if (TX.gone > 0) return true;
    for (var i = 0; i < TX.chars.length; i++) if (TX.chars[i].st !== 0 || TX.chars[i].fx) return true;
    return false;
  }
  function measureText() {
    var sr = splash.getBoundingClientRect(), n = TX.chars.length, i, c, r;
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < n; i++) {
      c = TX.chars[i];
      r = c.el.getBoundingClientRect();
      c.x = r.left - sr.left + r.width / 2;
      c.y = r.top - sr.top + r.height / 2;
      if (r.left - sr.left < x0) x0 = r.left - sr.left;
      if (r.right - sr.left > x1) x1 = r.right - sr.left;
      if (c.y < y0) y0 = c.y;
      if (c.y > y1) y1 = c.y;
    }
    TX.minX = x0; TX.maxX = x1; TX.minY = y0; TX.maxY = y1;
    TX.dirty = false;
  }
  function setFx(c, tr, op) {
    if (!c.fx) { c.el.classList.add("fx"); c.fx = true; }
    c.el.style.transform = tr;
    c.el.style.opacity = op;
  }
  function clearFx(c) {
    if (!c.fx) return;
    c.el.style.transform = "";
    c.el.style.opacity = "";
    c.el.classList.remove("fx");
    c.fx = false;
  }
  function f2(v) { return (Math.round(v * 100) / 100).toString(); }

  function textUpdate(dt) {
    var n = TX.chars.length, i, c, dx, dy, d, s;
    var hx = hole.x, hy = hole.y, Rh = hole.r, Rcap = Rh * 2.1, Rinf = Rh * 7;
    var on = hole.active && hole.alpha > 0.5;
    var best = null, bestD = 1e9, gone = 0, busy = false;
    var far = Rinf * 2.2;
    var holeOver = !hole.active || hole.alpha < 0.05;
    var buildGap = 0.05, goneNow = TX.gone;
    if (goneNow > 0) buildGap = Math.min(0.06, Math.max(0.02, 2.6 / goneNow));
    var canBuild = clock - TX.lastBuild >= buildGap, buildStarted = false;

    for (i = 0; i < n; i++) {
      c = TX.chars[i];
      if (c.st === 0) {
        if (on) {
          dx = hx - c.x; dy = hy - c.y; d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (d < Rinf) {
            s = d <= Rcap ? 1 : smooth((Rinf - d) / (Rinf - Rcap));
            var ang = Math.atan2(dy, dx), pull = Math.min(16, 0.17 * d) * s * s;
            var tilt = (dx > 0 ? 1 : -1) * 0.42 * s;
            setFx(c, "translate(" + f2(Math.cos(ang) * pull) + "px," + f2(Math.sin(ang) * pull) + "px) rotate(" + f2(tilt) + "rad) rotate(" + f2(ang) +
                  "rad) scale(" + f2(1 + 0.5 * s * s) + "," + f2(1 - 0.22 * s * s) + ") rotate(" + f2(-ang) + "rad)", "1");
            busy = true;
            if (d < Rcap && d < bestD) { best = c; bestD = d; }
            continue;
          }
        }
        clearFx(c);
      } else if (c.st === 1) {
        c.t += dt;
        var p = c.t / ABS_DUR;
        if (p >= 1 || !hole.active) {
          c.st = 2; c.el.style.transform = "scale(0)"; c.el.style.opacity = "0";
          gone++;
        } else {
          var e = Math.pow(p, 1.6), r = c.r0 * (1 - e), an = c.a0 + e * 3.4;
          var px = hx + r * Math.cos(an) - c.x, py = hy + r * Math.sin(an) - c.y;
          var sc = Math.pow(Math.max(0, 1 - e), 1.15) + 0.02;
          setFx(c, "translate(" + f2(px) + "px," + f2(py) + "px) rotate(" + f2((an - c.a0) * 0.7) + "rad) scale(" + f2(sc * (1 + 0.8 * e)) + "," + f2(sc * (1 - 0.35 * e)) + ")",
                f2(1 - smooth((e - 0.5) / 0.5)));
          gone++; busy = true;
        }
      } else if (c.st === 2) {
        gone++; busy = true;
        if (canBuild && !buildStarted && (holeOver || Math.sqrt((hx - c.x) * (hx - c.x) + (hy - c.y) * (hy - c.y)) > far)) {
          c.st = 3; c.t = 0; buildStarted = true; TX.lastBuild = clock;
          c.el.style.transform = "scale(0.6)"; c.el.style.opacity = "0";
        }
      } else {
        c.t += dt;
        var q = c.t / BUILD_DUR;
        if (q >= 1) { c.st = 0; clearFx(c); }
        else {
          var u = smooth(q);
          setFx(c, "translate(0," + f2((1 - u) * 6) + "px) scale(" + f2(0.6 + 0.4 * u) + ")", f2(smooth((q - 0.15) / 0.7)));
          gone++; busy = true;
        }
      }
    }
    if (best && clock - TX.lastAbsorb >= 0.045) {
      best.st = 1; best.t = 0;
      best.a0 = Math.atan2(best.y - hy, best.x - hx);
      best.r0 = Math.sqrt((best.x - hx) * (best.x - hx) + (best.y - hy) * (best.y - hy));
      TX.lastAbsorb = clock;
      gone++;
    }
    TX.gone = gone;
    TX.busy = busy || hole.active;
    if (!TX.busy && TX.dirty) measureText();
  }

  // partículas luminosas que convergen sobre cada letra que se está reconstruyendo
  function drawTextFx() {
    if (!TX.ready || TX.gone === 0 || !flareCv) return;
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < TX.chars.length; i++) {
      var c = TX.chars[i];
      if (c.st !== 3) continue;
      var q = Math.min(1, c.t / BUILD_DUR), e = smooth(q);
      var a = Math.sin(Math.PI * Math.min(1, q * 1.1)) * 0.7;
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      for (var k = 0; k < 3; k++) {
        var ang = c.pa + k * 2.094 + q * 1.5, rad = (1 - e) * 24 + 1;
        ctx.drawImage(flareCv, c.x + Math.cos(ang) * rad - 6, c.y + Math.sin(ang) * rad - 6, 12, 12);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- actualización ---------- */
  function update(dt) {
    var i, L;
    for (i = 0; i < N; i++) {
      L = sl[i];
      if (L === 0) continue;
      sx[i] += LAYER_VX[L] * dt; sy[i] += LAYER_VY[L] * dt;
      if (sx[i] < -4) sx[i] += W + 8;
      if (sy[i] > H + 4) sy[i] -= H + 8;
    }
    for (i = 0; i < NF; i++) { fx[i] -= 1.6 * dt; if (fx[i] < -20) fx[i] += W + 40; }
    if (TX.ready && (hole.active || TX.busy)) textUpdate(dt);
    if (hole.active) {
      hole.t += dt;
      var p = hole.t / hole.dur;
      if (p >= 1) endHole(); else { updateHolePos(p); physics(dt); }
    } else if (hole.restoring) {
      restore(dt);
    } else if (!entering && clock >= nextHoleAt) {
      startHole();
    }
    if (warpOn) warp = Math.min(1, warp + dt / 0.95);
  }

  /* ---------- dibujo ---------- */
  function drawStars(t, nearPass) {
    var T = TIERS[tier], c, i, ex, ey, a, s;
    for (c = 0; c < 4; c++) {
      ctx.fillStyle = COLORS[c];
      for (i = cStart[c]; i < cStart[c + 1]; i++) {
        if ((sl[i] === 2) !== nearPass) continue;
        var vis = sa[i]; if (vis <= 0) continue; if (vis > 1) vis = 1;
        a = sb[i] * (0.62 + 0.38 * Math.sin(t * ss[i] + sp[i])) * vis * (1 + bs[i] * 1.7);
        if (a < 0.04) continue;
        if (a > 1) a = 1;
        s = sz[i] * (1 + bs[i] * 0.9);
        ex = sx[i] + ox[i]; ey = sy[i] + oy[i];
        ctx.globalAlpha = a;
        ctx.fillRect(ex - s * 0.5, ey - s * 0.5, s, s);
      }
    }
    ctx.globalAlpha = 1;
    if (nearPass && T.flares) {
      ctx.globalCompositeOperation = "lighter";
      for (i = 0; i < NF; i++) {
        var f = Math.sin(t * fv[i] + fp[i]); f = f > 0 ? f * f * f * f * f * f : 0;
        var fa = 0.16 + 0.84 * f; if (fa < 0.05) continue;
        var fz = fs[i] * (0.55 + 0.6 * f);
        ctx.globalAlpha = fa;
        ctx.drawImage(flareCv, fx[i] - fz / 2, fy[i] - fz / 2, fz, fz);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawNebulae(t) {
    if (!TIERS[tier].neb) return;
    var big = Math.max(W, H);
    ctx.globalCompositeOperation = "lighter";
    var defs = [
      { i: 0, x: 0.22, y: 0.2, s: 1.15, a: 0.62, ph: 0, sp: 0.11 },
      { i: 1, x: 0.8, y: 0.74, s: 1.2, a: 0.58, ph: 2.1, sp: 0.09 },
      { i: 2, x: 0.5, y: 0.48, s: 1.35, a: 0.5, ph: 4.2, sp: 0.07 },
      { i: 3, x: 0.78, y: 0.16, s: 0.95, a: 0.42, ph: 1.0, sp: 0.13 }
    ];
    for (var k = 0; k < defs.length; k++) {
      var d = defs[k], sz2 = big * d.s * (1 + 0.04 * Math.sin(t * 0.06 + d.ph));
      var px = W * d.x + Math.sin(t * 0.035 + d.ph) * W * 0.035, py = H * d.y + Math.cos(t * 0.03 + d.ph) * H * 0.03;
      ctx.globalAlpha = d.a * (0.55 + 0.45 * Math.sin(t * d.sp + d.ph));
      ctx.drawImage(nebCvs[d.i], px - sz2 / 2, py - sz2 / 2, sz2, sz2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function holeBoost() {
    if (!hole.active) return 0;
    var d = Math.hypot(hole.x - gcx, hole.y - gcy);
    return smooth(1 - d / (hole.r * 9)) * hole.alpha;
  }

  function drawGalaxy(t, boost) {
    var S = Math.min(Math.max(W, H * 0.75), H * 1.05) * 1.18;
    S = Math.max(S, Math.min(W, H) * 1.15);
    var s = S * (1 + 0.05 * boost);
    var ox2 = hole.active ? (hole.x - gcx) * 0.025 * boost : 0, oy2 = hole.active ? (hole.y - gcy) * 0.05 * boost : 0;
    ctx.save();
    ctx.translate(gcx + ox2, gcy + oy2);
    ctx.rotate(-0.42);
    ctx.scale(1, 0.6 - 0.04 * boost);
    ctx.rotate(t * (0.02 + 0.03 * boost));
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(1, (warpOn ? 1 - warp * 0.8 : 1) * (1 + 0.2 * boost));
    ctx.drawImage(galaxyCv, -s / 2, -s / 2, s, s);
    ctx.restore();
    var cr = S * 0.15, pulse = 0.5 + 0.08 * Math.sin(t * 0.7) + 0.18 * boost;
    var g = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, cr);
    g.addColorStop(0, "rgba(255,238,210," + pulse.toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,200,150,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g; ctx.fillRect(gcx - cr, gcy - cr, cr * 2, cr * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function drawLens(hx, hy, Rh, alpha) {
    var Rl = Rh * 3.4, px = res;
    var sx0 = Math.max(0, Math.floor((hx - Rl) * px)), sy0 = Math.max(0, Math.floor((hy - Rl) * px));
    var sx1 = Math.min(canvas.width, Math.ceil((hx + Rl) * px)), sy1 = Math.min(canvas.height, Math.ceil((hy + Rl) * px));
    var sw = sx1 - sx0, sh = sy1 - sy0;
    if (sw < 8 || sh < 8) return;
    if (!lensCv) { lensCv = mk(sw, sh); lensCtx = lensCv.getContext("2d"); }
    if (lensCv.width !== sw || lensCv.height !== sh) { lensCv.width = sw; lensCv.height = sh; }
    lensCtx.setTransform(1, 0, 0, 1, 0, 0);
    lensCtx.clearRect(0, 0, sw, sh);
    lensCtx.drawImage(canvas, sx0, sy0, sw, sh, 0, 0, sw, sh);
    var cx = hx * px, cy = hy * px;
    // 8 anillos con ampliación creciente hacia el centro: la imagen se curva sin cortes visibles
    var radii = [], mags = [], K = 8, j;
    for (j = 0; j <= K; j++) radii.push(Rl * (1 - 0.72 * (j / K)));
    for (j = 0; j < K; j++) { var u = (j + 0.5) / K; mags.push(1 + 0.04 * u + 0.78 * u * u * u); }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    for (var i = 0; i < K; i++) {
      var ro = radii[i] * px, ri = radii[i + 1] * px, m = mags[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, ro, 0, 6.2832);
      ctx.arc(cx, cy, ri, 0, 6.2832, true);
      ctx.clip();
      ctx.drawImage(lensCv, 0, 0, sw, sh, cx + (sx0 - cx) * m, cy + (sy0 - cy) * m, sw * m, sh * m);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawHole(t) {
    var a = hole.alpha; if (a <= 0.01) return;
    var hx = hole.x, hy = hole.y, Rh = hole.r;
    if (TIERS[tier].lens) drawLens(hx, hy, Rh, a);
    // disco de acreción, inclinado
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(hx, hy); ctx.rotate(-0.3); ctx.scale(1, 0.25);
    var R2 = Rh * 3.9, dg = ctx.createRadialGradient(0, 0, Rh * 1.1, 0, 0, R2);
    dg.addColorStop(0, "rgba(255,214,150,0)");
    dg.addColorStop(0.08, "rgba(255,240,205," + (0.8 * a).toFixed(3) + ")");
    dg.addColorStop(0.3, "rgba(255,160,70," + (0.8 * a).toFixed(3) + ")");
    dg.addColorStop(0.62, "rgba(200,80,210," + (0.4 * a).toFixed(3) + ")");
    dg.addColorStop(1, "rgba(80,40,160,0)");
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, R2, 0, 6.2832); ctx.fill();
    ctx.restore();
    // halo del anillo de fotones
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var rg = ctx.createRadialGradient(hx, hy, Rh * 0.95, hx, hy, Rh * 2.4);
    rg.addColorStop(0, "rgba(255,244,222,0)");
    rg.addColorStop(0.1, "rgba(255,248,230," + (0.85 * a).toFixed(3) + ")");
    rg.addColorStop(0.28, "rgba(255,180,100," + (0.7 * a).toFixed(3) + ")");
    rg.addColorStop(0.6, "rgba(160,100,255," + (0.3 * a).toFixed(3) + ")");
    rg.addColorStop(1, "rgba(80,50,180,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(hx, hy, Rh * 2.4, 0, 6.2832); ctx.fill();
    ctx.restore();
    // horizonte de sucesos
    var hg = ctx.createRadialGradient(hx, hy, Rh * 0.82, hx, hy, Rh * 1.04);
    hg.addColorStop(0, "rgba(0,0,0," + a.toFixed(3) + ")");
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, Rh * 1.04, 0, 6.2832); ctx.fill();
    // filo luminoso
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,246,228," + (0.8 * a).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1.5, Rh * 0.075);
    ctx.beginPath(); ctx.arc(hx, hy, Rh * 1.02, 0, 6.2832); ctx.stroke();
    ctx.restore();
  }

  function drawWarp() {
    var e = warp * warp, cx = W / 2, cy = H * 0.5;
    var n = Math.min(N, 1100), c, i;
    ctx.globalCompositeOperation = "lighter";
    for (c = 0; c < 4; c++) {
      ctx.strokeStyle = COLORS[c];
      ctx.beginPath();
      var lo = cStart[c], hi = Math.min(cStart[c + 1], lo + Math.ceil(n * (cStart[c + 1] - cStart[c]) / N));
      for (i = lo; i < hi; i++) {
        var dx = sx[i] + ox[i] - cx, dy = sy[i] + oy[i] - cy;
        var p0 = 1 + e * 1.4, p1 = p0 + e * 3.2 + 0.02;
        ctx.moveTo(cx + dx * p0, cy + dy * p0);
        ctx.lineTo(cx + dx * p1, cy + dy * p1);
      }
      ctx.globalAlpha = Math.min(1, 0.25 + warp * 0.9);
      ctx.lineWidth = 1 + warp * 1.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var fl = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * (0.1 + 0.8 * e));
    fl.addColorStop(0, "rgba(220,235,255," + (0.55 * e).toFixed(3) + ")");
    fl.addColorStop(1, "rgba(120,140,255,0)");
    ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  function draw() {
    var t = clock;
    ctx.setTransform(res, 0, 0, res, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(skyCv, 0, 0, W, H);
    drawNebulae(t);
    if (!warpOn) drawStars(t, false);
    var boost = holeBoost();
    drawGalaxy(t, boost);
    if (!warpOn) {
      drawStars(t, true);
      drawTextFx();
      if (hole.active) drawHole(t);
    } else {
      drawWarp();
    }
  }

  /* ---------- bucle ---------- */
  function frame(ts) {
    raf = 0;
    if (!running) return;
    var now = ts / 1000, dt = last === null ? 0.016 : Math.min(0.05, now - last);
    last = now; clock += dt;
    monitor(dt);
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- arranque ---------- */
  function start() {
    var T0 = TIERS[tier];
    flareCv = buildFlare();
    galaxyCv = buildGalaxy(T0.galaxy);
    nebCvs = [
      buildNebula(["110,60,220", "190,60,200", "70,70,230"]),
      buildNebula(["30,170,210", "40,110,230", "60,200,190"]),
      buildNebula(["60,60,200", "120,50,190", "40,90,200"]),
      buildNebula(["200,70,170", "130,60,220", "50,130,230"])
    ];
    applyDims();
    clock = rand(0, 40);
    nextHoleAt = clock + rand(7, 13);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    initText();
    api.blackHole = startHole;
    api.stats = function () {
      var gone = 0;
      for (var i = 0; i < N; i++) if (ab[i]) gone++;
      return { running: running, tier: tier, stars: N, absorbed: gone, hole: hole.active, restoring: hole.restoring, w: W, h: H, res: res, kind: hole.kind, text: { ready: TX.ready, chars: TX.chars.length, gone: TX.gone, busy: TX.busy } };
    };
    if (reduce) { draw(); return; }
    running = true;
    raf = requestAnimationFrame(frame);
  }
  try { start(); } catch (e) {
    running = false;
    if (window.console) console.error("Tronx: no se pudo iniciar el universo", e);
  }
})();
