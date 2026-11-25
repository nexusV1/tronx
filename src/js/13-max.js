  /* ---------- MAX: XP, niveles, misiones y rachas ---------- */
  var MX_TITLES = [[1, "Polvo estelar"], [3, "Chispa errante"], [5, "Navegante"], [7, "Cartógrafo"], [10, "Capitán estelar"], [12, "Comandante"], [15, "Guardián de constelaciones"], [18, "Arquitecto estelar"], [20, "Tejedor de nebulosas"], [25, "Señor de nebulosas"], [30, "Oráculo cósmico"], [33, "Titán estelar"], [36, "Soberano galáctico"], [40, "Dominador del vacío"], [43, "Eón"], [46, "Devorador de estrellas"], [50, "Singularidad"]];
  var MX_RANKS = [[1, "Bronce", 1, "~2 semanas"], [5, "Plata", 2, "~1 mes"], [10, "Oro", 3, "~3 meses"], [15, "Cristal", 4, "~5 meses y medio"], [20, "Nebulosa", 5, "~1 año"], [30, "Supernova", 6, "~2 años"], [40, "Agujero negro", 7, "~3 años y medio"], [50, "Singularidad", 8, "El rango final"]];
  var TIER_XP = [0, 50, 150, 400, 1000, 2500, 6000, 15000], MX_MAXL = 50;
  function xpAt(L) { return L <= 1 ? 0 : Math.round(30 * Math.pow(L - 1, 2.2) / 10) * 10; }
  function lvlOf(xp) { var L = 1; while (L < MX_MAXL && xp >= xpAt(L + 1)) L++; return L; }
  function titleOf(L) { var t = MX_TITLES[0][1]; MX_TITLES.forEach(function (r) { if (L >= r[0]) t = r[1]; }); return t; }
  function rankOf(L) { var r = MX_RANKS[0]; MX_RANKS.forEach(function (x) { if (L >= x[0]) r = x; }); return { i: r[2], name: r[1], from: r[0] }; }
  function maxInit() {
    var st = universeStats(), x = Math.min(st.notes, 300) * 10 + Math.floor((settings.wTot || 0) / 20) + ((settings.focus && settings.focus.min) || 0) + Math.max(settings.streakBest || 0, 0) * 5;
    ACH.forEach(function (a) { if (settings.ach[a.id]) x += TIER_XP[a.tier]; });
    return x;
  }
  var maxNoted = {}, maxSaveT = 0;
  function maxSave() { clearTimeout(maxSaveT); maxSaveT = setTimeout(saveSettings, 800); }
  function getMax() {
    var m = settings.max;
    if (!m || typeof m !== "object") {
      m = { xp: maxInit(), stars: 0, seen: 1, pend: 0, day: "", cap: { n: 0, w: 0, f: 0 }, wAcc: 0, base: 0, tasks: 0, cl: {}, sc: {} };
      m.stars = Math.floor(m.xp / 10); m.seen = lvlOf(m.xp); settings.max = m; saveSettings();
    }
    m.xp = Math.max(0, +m.xp || 0); m.stars = Math.max(0, Math.floor(+m.stars || 0)); m.seen = Math.max(1, Math.floor(+m.seen || 1)); m.pend = Math.floor(+m.pend || 0);
    if (!m.cap || typeof m.cap !== "object") m.cap = { n: 0, w: 0, f: 0 };
    if (!m.cl || typeof m.cl !== "object") m.cl = {}; if (!m.sc || typeof m.sc !== "object") m.sc = {};
    m.wAcc = Math.max(0, +m.wAcc || 0);
    if (!m.pins || typeof m.pins !== "object" || Array.isArray(m.pins)) m.pins = {}; if (!m.inv || typeof m.inv !== "object" || Array.isArray(m.inv)) m.inv = {}; if (!m.eq || typeof m.eq !== "object" || Array.isArray(m.eq)) m.eq = {};
    var k = dayKey(Date.now());
    if (m.day !== k) {
      m.day = k; m.cap = { n: 0, w: 0, f: 0 }; m.tasks = 0; m.base = achState().done;
      var lim = Date.now() - 21 * 86400000; Object.keys(m.cl).forEach(function (x) { if (!(m.cl[x] > lim)) delete m.cl[x]; });
      maxSave();
    }
    return m;
  }
  function grantXp(xp, stars) {
    var m = getMax(), t = m.bk || m, before = t.seen;
    t.xp += Math.max(0, xp); t.stars += Math.max(0, stars || 0);
    var L = lvlOf(t.xp);
    if (L > t.seen) {
      var bonus = 0; for (var i = t.seen + 1; i <= L; i++) bonus += 10 * i;
      t.stars += bonus; t.pend = L; t.seen = L; t.pendFrom = before; t.pendStars = (t.pendStars || 0) + bonus;
      if (!m.bk && typeof toast === "function") toast("¡Subiste al nivel " + L + "!");
    }
    maxSave(); if (!m.bk) tryCelebrate();
  }
  /* Probador de niveles: cambia el nivel solo para ver los emblemas; el progreso real queda guardado en m.bk */
  function mxTestGo(L) {
    var m = getMax(); L = Math.max(1, Math.min(MX_MAXL, L));
    if (!m.bk) m.bk = { xp: m.xp, stars: m.stars, seen: m.seen, pend: m.pend || 0, pendFrom: m.pendFrom || 0, pendStars: m.pendStars || 0 };
    m.xp = xpAt(L); m.seen = L; m.pend = 0; m.pendFrom = 0; m.pendStars = 0;
    saveSettings(); mxRender(); $("mxSc").scrollTop = 0;
  }
  function mxTestRestore() {
    var m = getMax(), b = m.bk; if (!b) return;
    m.xp = b.xp; m.stars = b.stars; m.seen = b.seen; m.pend = b.pend || 0; m.pendFrom = b.pendFrom || 0; m.pendStars = b.pendStars || 0;
    delete m.bk; saveSettings(); mxRender(); $("mxSc").scrollTop = 0;
    if (typeof toast === "function") toast("Volviste a tu nivel real: " + lvlOf(m.xp));
    if (m.pend) tryCelebrate();
  }
  function maxNote(isNew, words) {
    var m = getMax();
    if (isNew && m.cap.n < 5) { m.cap.n++; grantXp(10, 5); }
    m.wAcc += Math.max(0, words);
    while (m.wAcc >= 100) { m.wAcc -= 100; if (m.cap.w < 6) { m.cap.w++; grantXp(5, 2); } }
  }
  function maxFocus(min) {
    var m = getMax(), g = Math.max(0, Math.min(min, 90 - m.cap.f));
    if (g > 0) { m.cap.f += g; grantXp(g, Math.floor(g / 2)); }
  }
  function maxLevel() {
    var m = getMax(), L = lvlOf(m.xp), a = xpAt(L), b = L < MX_MAXL ? xpAt(L + 1) : a;
    return { L: L, xp: m.xp, a: a, b: b, left: Math.max(0, b - m.xp), pct: L >= MX_MAXL ? 100 : Math.max(0, Math.min(100, Math.round((m.xp - a) / (b - a) * 100))), title: titleOf(L), rank: rankOf(L), max: L >= MX_MAXL, stars: m.stars };
  }
  var embN = 0;
  function bhEmblem(n, size, anim) {
    var small = !anim && size <= 90, id = "bhe" + (++embN), s = "", i, hp = function (r) { var p = []; for (var k = 0; k < 6; k++) { var a = (-90 + k * 60) * Math.PI / 180; p.push((100 + r * Math.cos(a)).toFixed(1) + "," + (100 + r * Math.sin(a)).toFixed(1)); } return p.join(" "); };
    s += '<defs><radialGradient id="' + id + 's"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient><clipPath id="' + id + 'k"><polygon points="' + hp(82) + '"/></clipPath><filter id="' + id + 'g"><feGaussianBlur stdDeviation="4.5"/></filter><linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0abfc"/><stop offset=".5" stop-color="#a21caf"/><stop offset="1" stop-color="#3b0764"/></linearGradient></defs>';
    s += '<circle cx="100" cy="100" r="99" fill="#d946ef" opacity=".24" filter="url(#' + id + 'g)">' + (anim ? '<animate attributeName="opacity" values=".25;.5;.25" dur="4s" repeatCount="indefinite"/>' : "") + "</circle>";
    s += '<polygon points="' + hp(92) + '" fill="url(#' + id + 'f)" stroke="#3a1408" stroke-width="3"/><polygon points="' + hp(83) + '" fill="#000"/><g clip-path="url(#' + id + 'k)">';
    for (i = 0; i < (anim ? 24 : 1); i++) s += '<image class="bhf"' + (anim ? ' data-a="1"' : "") + ' href="' + (small ? "bh/small.webp" : "bh/f" + (i < 10 ? "0" : "") + i + ".webp") + '" x="14" y="14" width="172" height="172" opacity="' + (i ? 0 : 1) + '"/>';
    if (anim) s += '<g class="bhs">' + bhStars().map(function () { return '<g class="bs" opacity="0"><path class="tr" d="" fill="none" stroke-linecap="round"/><g class="hd"><path d="M-3 0H3M0-3V3" stroke-width=".35" stroke-linecap="round" opacity=".6"/><ellipse rx="1" ry="1" stroke="none"/></g></g>'; }).join("") + "</g>";
    s += '</g><polygon points="' + hp(83) + '" fill="none" stroke="#ffe2c4" stroke-opacity=".6" stroke-width="2"/>';
    if (size <= 56) s += '<rect x="48" y="142" width="104" height="40" rx="20" fill="#000" fill-opacity=".78" stroke="#ffb482" stroke-opacity=".8"/><text x="100" y="172" text-anchor="middle" font-weight="900" font-size="32" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" font-family="Inter,system-ui,sans-serif">' + (n | 0) + "</text>";
    else if (small) s += '<rect x="54" y="146" width="92" height="32" rx="16" fill="#000" fill-opacity=".78" stroke="#ffb482" stroke-opacity=".8"/><text x="100" y="170" text-anchor="middle" font-weight="900" font-size="26" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" font-family="Inter,system-ui,sans-serif">' + (n | 0) + "</text>";
    else s += '<rect x="64" y="152" width="72" height="24" rx="12" fill="#000" fill-opacity=".75" stroke="#ffb482" stroke-opacity=".8"/><text x="100" y="170" text-anchor="middle" font-weight="900" font-size="19" fill="#fff" font-family="Inter,system-ui,sans-serif">' + (n | 0) + "</text>";
    return '<svg viewBox="-6 -4 212 204" width="' + size + '" height="' + Math.round(size * 0.962) + '" aria-hidden="true" style="overflow:visible">' + s + "</svg>";
  }
  var BH_S = null;
  function bhStars() {
    if (BH_S) return BH_S;
    var r = 777, rnd = function () { r = (r * 1664525 + 1013904223) % 4294967296; return r / 4294967296; }; BH_S = [];
    var yy = [28, 52, 74, 96, 120, 138, 36, 108, 64];
    for (var i = 0; i < 9; i++) BH_S.push({ d: 0, x: rnd() * 240 - 20, y: yy[i] + rnd() * 6, sp: 3 + rnd() * 5, sz: 0.6 + rnd() * 0.5, ph: rnd() * 6.28, c: ["#ffffff", "#d7e6ff", "#ffeedd"][i % 3] });
    BH_S.push({ d: 1, pd: 13, ph: 0.15, a0: 3.6, sg: 1, r0: 80, sz: 0.9, c: "#ffffff" });
    BH_S.push({ d: 1, pd: 17, ph: 0.62, a0: 0.5, sg: -1, r0: 78, sz: 0.8, c: "#e8f0ff" });
    return BH_S;
  }
  var BH_RS = 31, BH_TE = 38;
  function bhDoom(q, u) {
    var r = BH_RS + (q.r0 - BH_RS) * Math.pow(1 - u, 2.2), a = q.a0 + q.sg * (2.4 * u + 3.6 * u * u * u);
    return [100 + r * Math.cos(a), 100 + r * Math.sin(a) * 0.92, a];
  }
  // El agujero negro "viaja": las estrellas se deslizan, su gravedad las curva y alguna cae en espiral y es devorada
  function bhStarsDraw(g, t) {
    var st = bhStars(), el = g.childNodes, i, q, e, hd, x, y, ang, sx, sy, o, wr = function (v) { return ((v + 20) % 240 + 240) % 240 - 20; };
    for (i = 0; i < st.length; i++) {
      q = st[i]; e = el[i]; if (!e) break; hd = e.lastChild;
      if (!q.d) {
        var px = wr(q.x - q.sp * t), py = q.y + 3 * Math.sin(t * 0.3 + q.ph), dx = px - 100, dy = py - 100, b = Math.sqrt(dx * dx + dy * dy) || 0.01, th = (b + Math.sqrt(b * b + 4 * BH_TE * BH_TE)) / 2, k = th / b;
        x = 100 + dx * k; y = 100 + dy * k; ang = Math.atan2(dy, dx) * 57.2958 + 90;
        var near = BH_TE / (b + BH_TE); sx = q.sz * (1 + 3.2 * near * near); sy = q.sz * 0.8;
        o = (0.55 + 0.45 * near) * (0.78 + 0.22 * Math.sin(t * 1.7 + q.ph * 3));
        hd.setAttribute("fill", q.c); hd.setAttribute("stroke", q.c); e.firstChild.setAttribute("d", "");
      } else {
        var u = ((t / q.pd + q.ph) % 1), p = bhDoom(q, u), tr = "", kk, pp;
        x = p[0]; y = p[1]; ang = p[2] * 57.2958 + 90 * q.sg;
        sx = q.sz * (1 + 0.8 * u); sy = q.sz;
        o = Math.min(1, u * 12) * (u < 0.94 ? 1 : Math.max(0, 1 - (u - 0.94) / 0.06));
        if (u > 0.9) { sx *= 1 + (u - 0.9) * 14; sy *= 1 + (u - 0.9) * 14; }
        var col = u < 0.5 ? q.c : u < 0.8 ? "#ffdcae" : "#ff9a4a";
        for (kk = 0; kk < 9; kk++) { pp = bhDoom(q, Math.max(0, u - kk * 0.014)); tr += (kk ? "L" : "M") + pp[0].toFixed(1) + " " + pp[1].toFixed(1); }
        e.firstChild.setAttribute("d", tr); e.firstChild.setAttribute("stroke", col); e.firstChild.setAttribute("stroke-width", (0.9 + u * 0.8).toFixed(2)); e.firstChild.setAttribute("opacity", (0.35 * Math.min(1, u * 6)).toFixed(2));
        hd.setAttribute("fill", col); hd.setAttribute("stroke", col);
      }
      hd.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + ang.toFixed(0) + ")");
      hd.lastChild.setAttribute("rx", (sx * 0.95).toFixed(2)); hd.lastChild.setAttribute("ry", (sy * 0.8).toFixed(2)); hd.firstChild.setAttribute("transform", "scale(" + (0.7 + q.sz * 0.7).toFixed(2) + ")");
      e.setAttribute("opacity", o.toFixed(2));
    }
  }
  var bhRaf = 0, bhT0 = 0, bhLast = 0;
  function bhLoop(ts) {
    var ims = document.querySelectorAll(".bhf[data-a]");
    if (!ims.length || calmOn()) { bhRaf = 0; return; }
    var vis = !$("max").hidden || !$("lvlup").hidden;
    if (vis) {
      if (!bhT0) bhT0 = ts;
      var n = 24, x = (((ts - bhT0) / 6000) % 1) * n, a = Math.floor(x) % n, b = (a + 1) % n, f = x - Math.floor(x), top = Math.max(a, b), bot = Math.min(a, b), tf = top === b ? f : 1 - f;
      for (var i = 0; i < ims.length; i += n) {
        for (var k = 0; k < n && ims[i + k]; k++) ims[i + k].setAttribute("opacity", k === bot ? 1 : k === top ? tf : 0);
      }
      if (ts - bhLast >= 30) { bhLast = ts; var gs = document.querySelectorAll(".bhs"); for (var j = 0; j < gs.length; j++) bhStarsDraw(gs[j], (ts - bhT0) / 1000); }
    }
    bhRaf = requestAnimationFrame(bhLoop);
  }
  function bhStart() { if (!bhRaf && !calmOn()) { bhT0 = 0; bhRaf = requestAnimationFrame(bhLoop); } }
  // ===== Nivel 50 · Singularidad (ángel cósmico) =====
  var ANG_TT = 20, ANG_FL = 0.14, ANG_EV = [0.15, 0.65], ANG_ST = 1.3 / 20, PI = Math.PI;
  function angB(p) { p = ((p % 1) + 1) % 1; var u = p / ANG_FL; if (u >= 1) return 0; return Math.pow(Math.sin(PI * u), 2) * (24 - 28 * Math.sin(PI * 4 * u)) * (1.08 - 0.2 * u); }
  function angF(p) { return angB(p - ANG_EV[0]) + angB(p - ANG_EV[1]); }
  function angOn(ph) { for (var i = 0; i < 2; i++) { var d = (((ph - ANG_EV[i]) % 1) + 1) % 1; if (d < ANG_FL + 0.04) return true; } return false; }
  var ANG_ROWS = [
    { n: 8, a0: -82, a1: -2, L0: 112, L1: 90, w: 14, g: "a", dx: 52, dy: -8 },
    { n: 7, a0: -72, a1: 4, L0: 94, L1: 74, w: 12.5, g: "b", dx: 54, dy: -6 },
    { n: 6, a0: -60, a1: 12, L0: 73, L1: 56, w: 11, g: "d", dx: 56, dy: -4 },
    { n: 5, a0: -48, a1: 20, L0: 52, L1: 38, w: 9, g: "b", dx: 58, dy: -2 }];
  var ANG_FE = null;
  function angFeathers() {
    if (ANG_FE) return ANG_FE; ANG_FE = [];
    ANG_ROWS.forEach(function (r, ri) { for (var k = 0; k < r.n; k++) { var t = k / (r.n - 1); ANG_FE.push({ ri: ri, g: r.g, w: r.w, dx: r.dx, dy: r.dy, L: r.L0 + (r.L1 - r.L0) * t, a: r.a0 + (r.a1 - r.a0) * t }); } });
    return ANG_FE;
  }
  function angTr(fe, ph, F0, sp) { return "translate(" + fe.dx + " " + fe.dy + ") rotate(" + (fe.a * sp + 0.6 * (angF(ph - 0.016 * (fe.L / 112) - 0.004 * fe.ri) - F0) - 0.25 * F0 * (fe.L / 112)).toFixed(1) + ")"; }
  function angWing(id, sd, ph) {
    var F0 = angF(ph), sp = 1 + 0.12 * F0 / 44, fe = angFeathers(), o = '<g class="aw" data-sd="' + sd + '" transform="rotate(' + (sd * F0).toFixed(2) + " " + (sd > 0 ? 152 : 48) + ' 98)"><g transform="translate(100 98) scale(' + (sd * 0.95) + ' .95)">';
    fe.forEach(function (f) {
      var L = f.L, w = f.w;
      o += '<g transform="' + angTr(f, ph, F0, sp) + '"><path d="M0 0 C' + (L * .25).toFixed(1) + " " + (-w * .85).toFixed(1) + " " + (L * .7).toFixed(1) + " " + (-w) + " " + L.toFixed(1) + " 0 C" + (L * .75).toFixed(1) + " " + (w * .5).toFixed(1) + " " + (L * .28).toFixed(1) + " " + (w * .65).toFixed(1) + ' 0 0Z" fill="url(#' + id + f.g + ')" stroke="#7a4a00" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 -.5 L' + (L * .9).toFixed(1) + ' -.5" stroke="#fff6c9" stroke-width="1.1" stroke-linecap="round" opacity=".75"/></g>';
    });
    return o + "</g></g>";
  }
  function angWingUpd(g, ph) {
    var sd = +g.getAttribute("data-sd"), F0 = angF(ph), sp = 1 + 0.12 * F0 / 44, fe = angFeathers(), ch = g.firstChild.childNodes, i;
    g.setAttribute("transform", "rotate(" + (sd * F0).toFixed(2) + " " + (sd > 0 ? 152 : 48) + " 98)");
    for (i = 0; i < fe.length; i++) ch[i].setAttribute("transform", angTr(fe[i], ph, F0, sp));
  }
  function angRot(x, y, tx, ps) { var y1 = y * Math.cos(tx), z1 = y * Math.sin(tx); return [x * Math.cos(ps) - y1 * Math.sin(ps), x * Math.sin(ps) + y1 * Math.cos(ps), z1]; }
  function angRing(ri, ph) {
    var P2 = 2 * PI, dir = ri % 2 ? -1 : 1, w = P2 * ph * 2, ps = ri * PI / 3 + dir * (w + 0.35 * Math.sin(w * 2 + ri)), tx = 1.0 + 0.55 * Math.sin(w + ri * 2.1), R = 49 + 2.5 * Math.sin(w * 2 + ri * 1.7), pts = [], M = 72, i, k;
    for (i = 0; i <= M; i++) { var th = i / M * P2, p = angRot(R * Math.cos(th), R * Math.sin(th), tx, ps); pts.push([100 + p[0], 98 + p[1], p[2]]); }
    var seg = function (sg) { var s = "", on = false; pts.forEach(function (p) { var ok = sg > 0 ? p[2] >= 0 : p[2] < 0; if (ok) { s += (on ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); on = true; } else on = false; }); return s; };
    var fd = seg(1), bd = seg(-1), c0 = P2 * (ph * [2, 2, 4][ri] * dir + ri / 3), cp = "", cz = 0;
    for (k = 0; k <= 10; k++) { var t2 = c0 - k * 0.075 * dir, p2 = angRot(R * Math.cos(t2), R * Math.sin(t2), tx, ps); cp += (k ? "L" : "M") + (100 + p2[0]).toFixed(1) + " " + (98 + p2[1]).toFixed(1); if (!k) cz = p2[2]; }
    return { gl: fd + bd, bd: bd, fd: fd, cm: cp, cz: cz };
  }
  function angPart(ph) {
    var o = "";
    ANG_EV.forEach(function (e0) {
      var u = (((ph - e0) % 1) + 1) % 1 / ANG_FL;
      if (u < 1) for (var i = 0; i < 16; i++) {
        var rr = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1), r2 = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1), sd = i % 2 ? 1 : -1;
        o += '<circle cx="' + (100 + sd * (62 + rr * 70)).toFixed(1) + '" cy="' + (40 + r2 * 90 + 28 * u * (.5 + rr)).toFixed(1) + '" r="' + (1 + 1.8 * r2).toFixed(1) + '" fill="#fff3b0" opacity="' + (Math.sin(PI * u) * (.35 + .65 * r2)).toFixed(2) + '"/>';
      }
    });
    return o;
  }
  function angCore(id, ph, anim) {
    var o = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">', gl = "", bk = "", fr = "", cm = "", ri, d;
    var rg = [0, 1, 2].map(function (r) { return angRing(r, ph); });
    for (ri = 0; ri < 3; ri++) {
      d = rg[ri];
      gl += '<path class="ag' + ri + '" d="' + d.gl + '" stroke="#ffd76a" stroke-width="7" opacity=".16"/>';
      bk += '<path class="ab' + ri + '" d="' + d.bd + '" stroke="#5a3300" stroke-width="3.2" opacity=".55"/><path class="ab' + ri + '" d="' + d.bd + '" stroke="#c48a14" stroke-width="1.6" opacity=".7"/>';
      fr += '<path class="af' + ri + '" d="' + d.fd + '" stroke="#6b4300" stroke-width="3.8"/><path class="af' + ri + '" d="' + d.fd + '" stroke="url(#' + id + 'g)" stroke-width="2.2"/>';
      if (anim) cm += '<path class="ac' + ri + '" d="' + d.cm + '" stroke="#fff6c9" stroke-width="3.2" opacity="' + (d.cz >= 0 ? .95 : .4) + '"/><path class="ac' + ri + '" d="' + d.cm + '" stroke="#fff" stroke-width="1.3" opacity="' + (d.cz >= 0 ? 1 : .5) + '"/>';
    }
    var pu = .5 + .5 * Math.sin(2 * PI * ph * 3);
    var star = '<circle class="ao" cx="100" cy="98" r="' + (21 + 3 * pu).toFixed(1) + '" fill="url(#' + id + 'o)" stroke="none"/><circle cx="100" cy="98" r="9" fill="#fff" stroke="none"/><path class="as" d="M100 66 L103 95 L100 98 L97 95Z M100 130 L103 101 L100 98 L97 101Z M68 98 L95 95 L100 98 L95 101Z M132 98 L105 95 L100 98 L105 101Z" fill="#fff6c9" stroke="none" transform="rotate(' + (ph * 180).toFixed(1) + ' 100 98)"/>';
    return o + "<g>" + gl + "</g>" + bk + star + fr + cm + "</g>";
  }
  function angDraw(sv, ph) {
    var q = function (c) { return sv.querySelectorAll(c); }, ri, d, i, e, on = angOn(ph);
    for (ri = 0; ri < 3; ri++) {
      d = angRing(ri, ph);
      q(".ag" + ri).forEach(function (x) { x.setAttribute("d", d.gl); });
      q(".ab" + ri).forEach(function (x) { x.setAttribute("d", d.bd); });
      q(".af" + ri).forEach(function (x) { x.setAttribute("d", d.fd); });
      e = q(".ac" + ri); for (i = 0; i < e.length; i++) { e[i].setAttribute("d", d.cm); e[i].setAttribute("opacity", i ? (d.cz >= 0 ? 1 : .5) : (d.cz >= 0 ? .95 : .4)); }
    }
    var o = sv.querySelector(".ao"); if (o) o.setAttribute("r", (21 + 3 * (.5 + .5 * Math.sin(2 * PI * ph * 3))).toFixed(1));
    var s = sv.querySelector(".as"); if (s) s.setAttribute("transform", "rotate(" + (ph * 180).toFixed(1) + " 100 98)");
    if (on || sv._on) {
      q(".aw").forEach(function (g) { angWingUpd(g, ph); });
      var pg = sv.querySelector(".ap"); if (pg) pg.innerHTML = angPart(ph);
    }
    sv._on = on;
  }
  function angEmblem(n, size, anim) {
    var id = "ang" + (++embN), s = "", ph = anim ? 0 : ANG_ST, i, big = size > 90, mid = !big && size > 56;
    var yt = big ? 150 : mid ? 144 : 140, yb = big ? 172 : mid ? 178 : 182, fs = big ? 26 : mid ? 34 : 42, ym = (yt + yb) / 2;
    s += '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffd76a"/><stop offset="1" stop-color="#b8740a"/></linearGradient>' +
      '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8740a"/><stop offset=".6" stop-color="#f0b01c"/><stop offset="1" stop-color="#ffe68a"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8920f"/><stop offset=".6" stop-color="#ffd05a"/><stop offset="1" stop-color="#fff1b8"/></linearGradient>' +
      '<linearGradient id="' + id + 'd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8a820"/><stop offset=".6" stop-color="#ffdd7a"/><stop offset="1" stop-color="#fff8d6"/></linearGradient>' +
      '<radialGradient id="' + id + 'h"><stop offset=".6" stop-color="#ffb347" stop-opacity="0"/><stop offset=".85" stop-color="#ff9a3d" stop-opacity=".28"/><stop offset="1" stop-color="#ff7a2f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'o"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#ffe9a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><circle cx="100" cy="98" r="58"/></clipPath></defs>';
    s += '<circle cx="100" cy="98" r="100" fill="url(#' + id + 'h)"/>';
    s += angWing(id, 1, ph) + angWing(id, -1, ph) + '<g class="ap">' + (anim ? angPart(ph) : "") + "</g>";
    s += '<circle cx="100" cy="98" r="68" fill="url(#' + id + 'g)" stroke="#8a5a00" stroke-width="2.6"/><circle cx="100" cy="98" r="62.5" fill="#1b0a3a" stroke="#8a5a00" stroke-width="1.4"/><circle cx="100" cy="98" r="61" fill="none" stroke="#fff6c9" stroke-opacity=".8" stroke-width="1"/>';
    s += '<g clip-path="url(#' + id + 'c)"><image href="bh/neb.webp" x="40" y="38" width="120" height="120"/>' + angCore(id, ph, anim) + "</g>";
    s += '<ellipse cx="100" cy="20" rx="30" ry="7.5" fill="none" stroke="#8a5a00" stroke-width="6.5"/><ellipse cx="100" cy="20" rx="30" ry="7.5" fill="none" stroke="url(#' + id + 'g)" stroke-width="4"/><ellipse cx="100" cy="20" rx="30" ry="7.5" fill="none" stroke="#fff6c9" stroke-width="1.2" opacity=".8"/>';
    s += '<path d="M44 ' + yt + " L156 " + yt + " L148 " + yb + " L52 " + yb + 'Z" fill="#2a0c4e" stroke="#ffd76a" stroke-width="2.5" stroke-linejoin="round"/><path d="M44 ' + yt + " L30 " + (yt + 8) + " L38 " + (yt + 16) + " L30 " + (yt + 24) + " L52 " + yb + "Z M156 " + yt + " L170 " + (yt + 8) + " L162 " + (yt + 16) + " L170 " + (yt + 24) + " L148 " + yb + 'Z" fill="#2a0c4e" stroke="#ffd76a" stroke-width="2" stroke-linejoin="round"/>';
    s += '<text x="100" y="' + (yb - (big ? 2 : 4)) + '" text-anchor="middle" font-weight="900" font-size="' + fs + '" fill="url(#' + id + 'g)" stroke="#2a0c4e" stroke-width="' + (big ? 3 : 4) + '" paint-order="stroke" font-family="Inter,system-ui,sans-serif">' + (n | 0) + "</text>";
    if (big) [[56, ym], [144, ym]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#ffd76a" stroke="#8a5a00" stroke-width="1"/>'; });
    [[38, 196, 3.0], [162, 196, 3.0], [22, 168, 2.2], [178, 168, 2.2]].forEach(function (p) { var u = p[2]; s += '<path d="M' + p[0] + " " + (p[1] - u * 2.4) + " L" + (p[0] + u * .7) + " " + (p[1] - u * .7) + " L" + (p[0] + u * 2.4) + " " + p[1] + " L" + (p[0] + u * .7) + " " + (p[1] + u * .7) + " L" + p[0] + " " + (p[1] + u * 2.4) + " L" + (p[0] - u * .7) + " " + (p[1] + u * .7) + " L" + (p[0] - u * 2.4) + " " + p[1] + " L" + (p[0] - u * .7) + " " + (p[1] - u * .7) + 'Z" fill="#fff6c9" stroke="#8a5a00" stroke-width="1"/>'; });
    return '<svg' + (anim ? ' class="angsvg"' : "") + ' viewBox="-34 -22 268 244" width="' + size + '" height="' + Math.round(size * 244 / 268) + '" aria-hidden="true" style="overflow:visible">' + s + "</svg>";
  }
  var angRaf = 0, angT0 = 0, angLast = 0;
  function angLoop(ts) {
    var els = document.querySelectorAll(".angsvg");
    if (!els.length || calmOn()) { angRaf = 0; return; }
    var vis = !$("max").hidden || !$("lvlup").hidden;
    if (vis && ts - angLast >= 30) {
      if (!angT0) angT0 = ts; angLast = ts;
      var ph = (((ts - angT0) / 1000) % ANG_TT) / ANG_TT;
      for (var i = 0; i < els.length; i++) angDraw(els[i], ph);
    }
    angRaf = requestAnimationFrame(angLoop);
  }
  function angStart() { if (!angRaf && !calmOn()) { angT0 = 0; angRaf = requestAnimationFrame(angLoop); } }
  function emblemAnim(tier, n, size) { var a = !calmOn() && (tier === 7 || tier === 8); var s = emblemSvg(tier, n, size, a); if (a && tier === 7) setTimeout(bhStart, 30); if (a && tier === 8) setTimeout(angStart, 30); return s; }
  function emblemSvg(tier, n, size, anim) {
    if (tier === 7) return bhEmblem(n, size, anim);
    if (tier === 8) return angEmblem(n, size, anim);
    var P = { 1: ["#f0a56a", "#a8531f", "#5a2a0c", "#ffd2a8"], 2: ["#f4f6fb", "#9aa3b8", "#4b5468", "#ffffff"], 3: ["#ffe58a", "#e0a014", "#8a5a00", "#fff6c9"], 4: ["#b8f4ff", "#22b8d6", "#0a5a7a", "#ffffff"], 5: ["#e0b8ff", "#9b4dff", "#3a1286", "#ffd0f5"], 6: ["#fff3a8", "#ff8a1f", "#a3123a", "#fff9d6"], 7: ["#6b3fd6", "#1a0b3d", "#000000", "#ff9a3d"], 8: ["#ffffff", "#ffd76a", "#f0509a", "#ffffff"] }[tier] || ["#f0a56a", "#a8531f", "#5a2a0c", "#ffd2a8"];
    var id = "emb" + (++embN), c = P, s = "", i;
    s += '<defs><linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient><linearGradient id="' + id + 'i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient><radialGradient id="' + id + 'h"><stop offset="0" stop-color="' + c[1] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c[1] + '" stop-opacity="0"/></radialGradient></defs>';
    if (tier >= 3 && tier !== 8) s += '<circle cx="100" cy="100" r="98" fill="url(#' + id + 'h)" stroke="none"/>';
    if (tier >= 6 && !(anim && tier === 8)) for (i = 0; i < 12; i++) s += '<polygon points="100,2 106,40 94,40" fill="' + c[0] + '" stroke="none" opacity=".75" transform="rotate(' + (i * 30) + ' 100 100)"/>';
    if (tier === 5) s += '<ellipse cx="100" cy="100" rx="96" ry="30" fill="none" stroke="' + c[0] + '" stroke-width="3" opacity=".8" transform="rotate(-24 100 100)"/><circle cx="18" cy="122" r="5" fill="#fff" stroke="none"/><circle cx="182" cy="78" r="4" fill="#ffd0f5" stroke="none"/>';
    if (tier >= 2 && tier !== 7) { var w = '<path d="M52 92 L8 66 L22 100 L8 134 L52 108Z" fill="url(#' + id + 'm)" stroke="' + c[2] + '" stroke-width="2"/>'; s += w + '<g transform="translate(200 0) scale(-1 1)">' + w + '</g>'; }
    if (tier >= 3) s += '<path d="M64 36 L74 10 L88 30 L100 4 L112 30 L126 10 L136 36Z" fill="url(#' + id + 'm)" stroke="' + c[2] + '" stroke-width="2.5"/>';
    s += '<polygon points="100,18 168,57 168,143 100,182 32,143 32,57" fill="url(#' + id + 'm)" stroke="' + c[2] + '" stroke-width="3"/>';
    s += '<polygon points="100,34 154,65 154,135 100,166 46,135 46,65" fill="url(#' + id + 'i)" stroke="' + c[3] + '" stroke-opacity=".65" stroke-width="2.5"/>';
    if (tier >= 4) s += '<polygon points="100,34 154,65 100,100" fill="#fff" stroke="none" opacity=".22"/><polygon points="46,65 100,100 46,135" fill="#fff" stroke="none" opacity=".1"/><polygon points="154,135 100,100 154,65" fill="#000" stroke="none" opacity=".1"/><polygon points="100,166 46,135 100,100" fill="#000" stroke="none" opacity=".18"/>';
    else s += '<polygon points="100,34 154,65 154,100 46,100 46,65" fill="#fff" stroke="none" opacity=".16"/>';
    if (tier === 7) s += '<ellipse cx="100" cy="100" rx="70" ry="16" fill="none" stroke="' + c[3] + '" stroke-width="6" opacity=".95" transform="rotate(-18 100 100)"/><circle cx="100" cy="100" r="30" fill="#000" stroke="#c084fc" stroke-width="2.5"/>';
    var fs = n >= 10 ? 64 : 76, tc = tier === 7 ? "#fff" : tier === 8 ? "#5b1240" : "#fff";
    s += '<text x="100" y="' + (tier === 7 ? 150 : 123) + '" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="900" font-size="' + (tier === 7 ? 34 : fs) + '" fill="' + tc + '" stroke="' + (tier === 8 ? "none" : c[2]) + '" stroke-width="4" paint-order="stroke" style="letter-spacing:-2px">' + (n | 0) + '</text>';
    if (tier >= 4) s += '<path d="M92 160 L100 170 L108 160" fill="none" stroke="' + c[3] + '" stroke-width="3"/>';
    if (anim && tier === 8) {
      var rays = '<g><animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="24s" repeatCount="indefinite"/>';
      for (i = 0; i < 16; i++) rays += '<polygon points="100,-6 104,44 96,44" fill="#ffe9a8" opacity="' + (i % 2 ? 0.3 : 0.55) + '" transform="rotate(' + (i * 22.5) + ' 100 100)"/>';
      rays += "</g>";
      var sh = '<defs><clipPath id="' + id + 'q"><polygon points="100,18 168,57 168,143 100,182 32,143 32,57"/></clipPath><linearGradient id="' + id + 'w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
      s = sh + rays + s;
      s += '<g clip-path="url(#' + id + 'q)"><rect x="-60" y="0" width="46" height="200" fill="url(#' + id + 'w)" transform="skewX(-20)" opacity=".75"><animate attributeName="x" values="-90;260" dur="3.6s" repeatCount="indefinite"/></rect></g>';
      [[40, 40, 3], [164, 52, 2.6], [30, 130, 2.2], [170, 138, 3], [100, 8, 2.6], [60, 176, 2.2], [150, 176, 2.4]].forEach(function (p, k) {
        var u = p[2], x = p[0], y = p[1];
        s += '<path d="M' + x + " " + (y - u * 2.6) + " L" + (x + u * 0.7) + " " + (y - u * 0.7) + " L" + (x + u * 2.6) + " " + y + " L" + (x + u * 0.7) + " " + (y + u * 0.7) + " L" + x + " " + (y + u * 2.6) + " L" + (x - u * 0.7) + " " + (y + u * 0.7) + " L" + (x - u * 2.6) + " " + y + " L" + (x - u * 0.7) + " " + (y - u * 0.7) + 'Z" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="' + (1.8 + k * 0.35) + 's" begin="' + (k * 0.45) + 's" repeatCount="indefinite"/></path>';
      });
    }
    /* progreso dentro del rango: una gema por nivel del rango; se encienden las alcanzadas y el brillo crece */
    var rs = 0, re = 0; MX_RANKS.forEach(function (x, k) { if (x[2] === tier) { rs = x[0]; re = MX_RANKS[k + 1] ? MX_RANKS[k + 1][0] : rs + 10; } });
    var cnt = re - rs, j = Math.max(0, Math.min(cnt - 1, (n || rs) - rs)), glow = 2 + (cnt > 1 ? j / (cnt - 1) : 0) * 9;
    if (cnt > 1) {
      var gs = cnt > 5 ? 6 : 8.2, sp = cnt > 5 ? 15.5 : 23, x0 = 100 - (cnt - 1) * sp / 2, pg = '';
      for (i = 0; i < cnt; i++) {
        var gx = x0 + i * sp, gy = 205, on = i <= j, d = "M" + gx + " " + (gy - gs) + " L" + (gx + gs) + " " + gy + " L" + gx + " " + (gy + gs) + " L" + (gx - gs) + " " + gy + "Z";
        pg += '<path d="' + d + '" fill="' + (on ? "url(#" + id + "m)" : "#0b0820") + '" fill-opacity="' + (on ? 1 : 0.55) + '" stroke="' + (on ? c[3] : c[1]) + '" stroke-opacity="' + (on ? 0.9 : 0.45) + '" stroke-width="1.4"/>';
        if (on) pg += '<circle cx="' + (gx - gs * 0.25) + '" cy="' + (gy - gs * 0.3) + '" r="' + (gs * 0.22) + '" fill="#fff" stroke="none" opacity=".85"/>';
      }
      s += pg;
    }
    return '<svg viewBox="-6 -4 212 ' + (cnt > 1 ? 226 : 204) + '" width="' + size + '" height="' + Math.round(size * (cnt > 1 ? 1.066 : 0.962)) + '" aria-hidden="true" style="overflow:visible;filter:drop-shadow(0 0 ' + glow.toFixed(1) + 'px ' + c[1] + ')">' + s + '</svg>';
  }
  /* misiones */
  function mxCtx() {
    var m = getMax(), now = Date.now(), d = new Date(now), t0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), dow = (d.getDay() + 6) % 7, w0 = t0 - dow * 86400000;
    var c = { t0: t0, w0: w0, dk: dayKey(now), wk: dayKey(w0 + 43200000), notesD: 0, notesW: 0, wordsD: settings.act[dayKey(now)] || 0, wordsW: 0, lettersD: settings.actL[dayKey(now)] || 0, daysW: 0, focusD: 0, focusW: 0, sessD: 0, sessW: 0, touchD: 0, listsD: 0 };
    notes.forEach(function (n) { if (n.trashedAt) return; if (n.createdAt >= t0) { c.notesD++; if (n.items && n.items.length) c.listsD++; } if (n.createdAt >= w0) c.notesW++; if (n.updatedAt >= t0) c.touchD++; });
    for (var i = 0; i <= dow; i++) { var v = settings.act[dayKey(dayShift(now, -i))]; if (v != null) { c.wordsW += v; c.daysW++; } }
    (settings.focusLog || []).forEach(function (f) { if (f.t >= t0) { c.focusD += f.m; c.sessD++; } if (f.t >= w0) { c.focusW += f.m; c.sessW++; } });
    var dn = achState().done - m.base; if (dn > m.tasks) { m.tasks = dn; maxSave(); }
    c.tasksD = m.tasks; c.dn = Math.floor(t0 / 86400000);
    return c;
  }
  var MX_D = {
    d1: { n: "Creá una nota nueva", t: 1, xp: 20, e: "📝", g: function (c) { return c.notesD; } },
    d6: { n: "Creá 3 notas", t: 3, xp: 45, e: "🗒️", g: function (c) { return c.notesD; } },
    d2: { n: "Escribí 200 palabras", t: 200, xp: 40, e: "✍️", g: function (c) { return c.wordsD; } },
    d3: { n: "Escribí 500 palabras", t: 500, xp: 80, e: "📖", g: function (c) { return c.wordsD; } },
    d4: { n: "Tildá 5 casillas de una lista", t: 5, xp: 25, e: "☑️", g: function (c) { return c.tasksD; } },
    d5: { n: "Sumá 10 minutos de enfoque", t: 10, xp: 30, e: "🎯", g: function (c) { return c.focusD; } },
    d7: { n: "Completá una sesión de enfoque", t: 1, xp: 25, e: "⏱️", g: function (c) { return c.sessD; } },
    d8: { n: "Escribí 1.000 palabras", t: 1000, xp: 150, e: "📚", g: function (c) { return c.wordsD; } },
    d9: { n: "Tildá 15 casillas de tus listas", t: 15, xp: 70, e: "✅", g: function (c) { return c.tasksD; } },
    d10: { n: "Editá 3 notas", t: 3, xp: 30, e: "✏️", g: function (c) { return c.touchD; } },
    d11: { n: "Creá una lista", t: 1, xp: 25, e: "🧾", g: function (c) { return c.listsD; } },
    d12: { n: "Sumá 25 minutos de enfoque", t: 25, xp: 60, e: "🧘", g: function (c) { return c.focusD; } }
  };
  var MX_W = {
    w1: { n: "Escribí en 5 días distintos", t: 5, xp: 120, e: "🔥", g: function (c) { return c.daysW; } },
    w2: { n: "Escribí 2.000 palabras", t: 2000, xp: 150, e: "📚", g: function (c) { return c.wordsW; } },
    w3: { n: "Sumá 60 minutos de enfoque", t: 60, xp: 100, e: "⏱️", g: function (c) { return c.focusW; } },
    w4: { n: "Creá 7 notas", t: 7, xp: 100, e: "🗂️", g: function (c) { return c.notesW; } },
    w5: { n: "Sumá 120 minutos de enfoque", t: 120, xp: 180, e: "🧘", g: function (c) { return c.focusW; } },
    w6: { n: "Escribí 5.000 palabras", t: 5000, xp: 250, e: "🖋️", g: function (c) { return c.wordsW; } },
    w8: { n: "Completá 5 sesiones de enfoque", t: 5, xp: 140, e: "🎯", g: function (c) { return c.sessW; } },
    w9: { n: "Escribí los 7 días de la semana", t: 7, xp: 220, e: "🌟", g: function (c) { return c.daysW; } },
    w10: { n: "Creá 15 notas", t: 15, xp: 200, e: "📝", g: function (c) { return c.notesW; } }
  };
  function mxWeek(c) {
    var now = Date.now(), cur = { words: 0, days: 0, notes: 0, focus: 0 }, prev = { words: 0, days: 0, notes: 0, focus: 0 }, best = null, ONE = 86400000, wd = new Date(c.w0).getDay();
    var mid = c.w0 + 43200000;
    for (var i = 0; i < 14; i++) {
      var ts = i < 7 ? mid + i * ONE : mid - (i - 6) * ONE, v = settings.act[dayKey(ts)];
      if (v == null || (i < 7 && ts > now + ONE)) continue;
      var o = i < 7 ? cur : prev; o.words += v; o.days++;
      if (i < 7 && (!best || v > best.v)) best = { v: v, d: new Date(ts).getDay() };
    }
    notes.forEach(function (n) { if (n.trashedAt) return; if (n.createdAt >= c.w0) cur.notes++; else if (n.createdAt >= c.w0 - 7 * ONE) prev.notes++; });
    (settings.focusLog || []).forEach(function (f) { if (f.t >= c.w0) cur.focus += f.m; else if (f.t >= c.w0 - 7 * ONE) prev.focus += f.m; });
    return { cur: cur, prev: prev, best: best };
  }
  var MX_STREAKS = [3, 7, 14, 30, 60, 100, 200, 365];
  function mxDaily(c) { var A = ["d1", "d6", "d11"], B = ["d2", "d3", "d10", "d8"], C = ["d4", "d5", "d9", "d7", "d12"]; return [A[c.dn % 3], B[(c.dn + 1) % 4], C[(c.dn + 2) % 5]]; }
  function mxWeekly(c) { var w = Math.round(c.w0 / 604800000); return [["w1", "w9"][w % 2], ["w2", "w3", "w5", "w6"][w % 4], ["w4", "w10", "w8"][w % 3]]; }
  function mxClaim(key, xp, stars, msg) {
    var m = getMax(); if (m.cl[key]) return false; m.cl[key] = Date.now(); grantXp(xp, stars); if (msg) toast(msg); mxRender(); return true;
  }
  function mxReady() {
    var c = mxCtx(), n = 0, m = getMax();
    mxDaily(c).forEach(function (id) { if (MX_D[id].g(c) >= MX_D[id].t && !m.cl["d:" + c.dk + ":" + id]) n++; });
    mxWeekly(c).forEach(function (id) { if (MX_W[id].g(c) >= MX_W[id].t && !m.cl["w:" + c.wk + ":" + id]) n++; });
    var best = writeStats().best; MX_STREAKS.forEach(function (s) { if (best >= s && !m.sc[s]) n++; });
    return n;
  }
  /* pantallas */

  /* Evento GTA VI: sobres de la suerte (misiones), puntos SEIS y tienda del evento */
  var MX_PK = { tiers: [null,
    { s: 1, xp: 5, st: 15, fp: 0.002, up: 0.45, sx: 2 }, { s: 2, xp: 12, st: 35, fp: 0.02, up: 0.35, sx: 3 }, { s: 3, xp: 25, st: 70, fp: 0.2, up: 0.25, sx: 5 },
    { s: 4, xp: 40, st: 120, fp: 1, up: 0.15, sx: 8 }, { s: 5, xp: 70, st: 200, fp: 3, up: 0.08, sx: 12 }, { s: 6, xp: 120, st: 350, fp: 6, up: 0, sx: 20 } ], taps: 6, lvStep: 25, lvMax: 10 };
  var MX_SHOP = { packs: [{ s: 1, c: 8 }, { s: 2, c: 20 }, { s: 3, c: 40 }], xch: [{ c: 20, st: 60, l: "⭐ 60" }, { c: 60, st: 200, l: "⭐ 200" }, { c: 20, xp: 40, l: "40 XP" }, { c: 60, xp: 130, l: "130 XP" }] };
  var MX_PT = [null, { bg: "#1a0d45", gl: "#8f6bff", bd: "#ffffff" }, { bg: "#2b0f5a", gl: "#c25bff", bd: "#ffd9f6" }, { bg: "#4a1068", gl: "#ff4fa3", bd: "#ffc2dc" },
    { bg: "#5a1a4a", gl: "#ff7a5c", bd: "#ffd2a0" }, { bg: "#6a2038", gl: "#ffa63d", bd: "#ffe27a" }, { bg: "#240a5c", gl: "#ffd25a", bd: "#fff6c0" }];
  var STAR_P = "12,2 15.1,8.6 22.3,9.5 17,14.5 18.4,21.7 12,18.2 5.6,21.7 7,14.5 1.7,9.5 8.9,8.6";
  var mxEvSel = "", mxEvTab = "mis", mxPkBusy = false, pkUid = 0;
  function rand01() { try { var a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); } }
  function mxPkList(m) { if (!m.pk || typeof m.pk !== "object") m.pk = { n: 0, l: [] }; if (!Array.isArray(m.pk.l)) m.pk.l = []; return m.pk.l; }
  function mxSx(m) { if (!m.sx || typeof m.sx !== "object") m.sx = { p: 0, t: 0 }; return m.sx; }
  var MX_LV = [{ n: 6, s: 1 }, { n: 16, x: 16 }, { n: 36, x: 26 }, { n: 66, x: 40 }, { n: 106, x: 66 }, { n: 206, s: 5, mx: 2 }, { n: 299, l: "gta" }];
  function mxLvProg(m) { var x = mxSx(m); if (typeof x.g !== "number") x.g = x.t || 0; return x.g; }
  function mxLvReached(m) { var g = mxLvProg(m), n = 0; while (n < MX_LV.length && g >= MX_LV[n].n) n++; return n; }
  function mxLvDone(m) { var x = mxSx(m); return Math.min(MX_LV.length, Math.max(0, x.lc | 0)); }
  function mxSxAdd(m, n, prog) { var x = mxSx(m); mxLvProg(m); x.p = (x.p || 0) + n; x.t = (x.t || 0) + n; if (prog) x.g += n; }
  var MX_PINS = [
    { id: "sol", n: "Atardecer", r: "Común", w: 30 },
    { id: "gat", n: "Cocodrilo", r: "Común", w: 30 },
    { id: "cas", n: "Casete", r: "Raro", w: 15 },
    { id: "gta", n: "GTA", r: "Raro", w: 15 },
    { id: "pal", n: "Palmera", r: "Épico", w: 7 },
    { id: "vi", n: "VI", r: "Legendario", w: 3 }];
  var pinN = 0;
  function pinStk(I, px, u) {
    var D = "#12051f", VP = "M-15 -8H-3.4V-5.8H-5.6L-1.6 3.6L2.4 -5.8H.2V-8H11.8V-5.8H9.6L1.6 8H-4.8L-12.8 -5.8H-15Z", IP = "M13.4 -8H22.6V-5.8H20.4V5.8H22.6V8H13.4V5.8H15.6V-5.8H13.4Z", VI = VP + IP;
    function frondD(a, L) {
      var r = a * Math.PI / 180, dx = Math.sin(r), dy = -Math.cos(r), dr = L * .55 * Math.pow(Math.abs(dx), 1.3), d = "", M = 9;
      function B(t) { return [2 * (1 - t) * t * dx * L * .55 + t * t * dx * L, 2 * (1 - t) * t * dy * L * .55 + t * t * (dy * L + dr)]; }
      function T(t) { var p = B(t), q = B(Math.min(1, t + .04)), x = q[0] - p[0], y = q[1] - p[1], m = Math.hypot(x, y) || 1; return [x / m, y / m]; }
      var up = [], dn = [];
      for (var i = 0; i <= M; i++) { var t = i / M, p = B(t), tg = T(t), w = 1.5 * Math.pow(1 - t, .6) + .15; up.push((p[0] - tg[1] * w).toFixed(2) + " " + (p[1] + tg[0] * w).toFixed(2)); dn.unshift((p[0] + tg[1] * w).toFixed(2) + " " + (p[1] - tg[0] * w).toFixed(2)); }
      d += "M" + up.join("L") + "L" + dn.join("L") + "Z";
      for (i = 1; i <= M; i++) {
        var t2 = i / M * .96, p2 = B(t2), g = T(t2), len = 4.6 * (1 - t2 * .55);
        [1, -1].forEach(function (sd) {
          var nx = -g[1] * sd, ny = g[0] * sd, tx = p2[0] + nx * len * .9 + g[0] * len * .45, ty = p2[1] + ny * len * .9 + g[1] * len * .45 + len * .7;
          d += "M" + (p2[0] - g[0] * 1.1).toFixed(2) + " " + (p2[1] - g[1] * 1.1).toFixed(2) + "L" + tx.toFixed(2) + " " + ty.toFixed(2) + "L" + (p2[0] + g[0] * 1.1).toFixed(2) + " " + (p2[1] + g[1] * 1.1).toFixed(2) + "Z";
        });
      }
      return d;
    }
    var FRD = [-118, -86, -56, -26, 4, 34, 64, 94, 122].map(function (a, k) { return frondD(a, 13 + (k % 2) * 2.2); }).join("");
    function pal(x, y, h, lean, sc, col, rim) {
      var tr = "M" + (x - 1.5 * sc) + " " + y + "Q" + (x + lean * .2 - .9 * sc) + " " + (y - h * .55) + " " + (x + lean - .55 * sc) + " " + (y - h) + "L" + (x + lean + .65 * sc) + " " + (y - h) + "Q" + (x + lean * .2 + 1.1 * sc) + " " + (y - h * .55) + " " + (x + 1.6 * sc) + " " + y + "Z", tf = ' transform="translate(' + (x + lean) + " " + (y - h) + ") scale(" + sc + ')"';
      return '<g stroke-linejoin="round"><path d="' + tr + '" fill="' + rim + '" stroke="' + rim + '" stroke-width="1.1"/><path d="' + FRD + '" fill="' + rim + '" stroke="' + rim + '" stroke-width="1.1"' + tf + '/><path d="' + tr + '" fill="' + col + '"/><path d="' + FRD + '" fill="' + col + '"' + tf + '/></g>';
    }
    function fr3(a, L, dp, lf, M, wd, tip) {
      var r = a * Math.PI / 180, dx = Math.sin(r), dy = -Math.cos(r), d = "", uu = Math.max(Math.cos(r), 0);
      function B(t) { var ex = dx * L, ey = L * (.42 - .6 * uu) + dp * L * .3, cx = dx * L * .5, cy = -L * (.22 + .75 * uu); return [2 * (1 - t) * t * cx + t * t * ex, 2 * (1 - t) * t * cy + t * t * ey]; }
      function T(t) { var p = B(t), q = B(Math.min(1, t + .04)), x = q[0] - p[0], y = q[1] - p[1], m = Math.hypot(x, y) || 1; return [x / m, y / m]; }
      var up = [], dn = [];
      for (var i = 0; i <= M; i++) { var t = i / M, p = B(t), g = T(t), w = wd * Math.pow(Math.sin(Math.PI * Math.min(.98, t * .9 + .08)), .7) + .1; if (i === M) w = .05; up.push((p[0] - g[1] * w).toFixed(2) + " " + (p[1] + g[0] * w).toFixed(2)); dn.unshift((p[0] + g[1] * w).toFixed(2) + " " + (p[1] - g[0] * w).toFixed(2)); }
      d += "M" + up.join("L") + "L" + dn.join("L") + "Z";
      for (i = 2; i < M; i++) {
        var t2 = i / M, p2 = B(t2), g2 = T(t2), len = lf * (1 - t2 * .55);
        [1, -1].forEach(function (sd) { var nx = -g2[1] * sd, ny = g2[0] * sd; d += "M" + (p2[0] - g2[0] * .9).toFixed(2) + " " + (p2[1] - g2[1] * .9).toFixed(2) + "L" + (p2[0] + nx * len * .8 + g2[0] * tip * len).toFixed(2) + " " + (p2[1] + ny * len * .8 + g2[1] * tip * len + len * .55).toFixed(2) + "L" + (p2[0] + g2[0] * .9).toFixed(2) + " " + (p2[1] + g2[1] * .9).toFixed(2) + "Z"; });
      }
      return d;
    }
    function palmZ(bx, by, cx, cy, sc, col, rim, cfg) {
      var F = cfg.f.map(function (q) { return fr3(q[0], q[1], q[2], cfg.lf, cfg.M, cfg.wd, cfg.tip); }).join("");
      var H = by - cy, pts = [], L1 = [], R1 = [], rings = "";
      function C(t) { var m = 1 - t; return [m * m * m * bx + 3 * m * m * t * (bx - 3.2) + 3 * m * t * t * (cx + 2.6) + t * t * t * cx, m * m * m * by + 3 * m * m * t * (by - H * .35) + 3 * m * t * t * (cy + H * .35) + t * t * t * cy]; }
      for (var i = 0; i <= 14; i++) { var t = i / 14, p = C(t), q = C(Math.min(1, t + .03)), x = q[0] - p[0], y = q[1] - p[1], m = Math.hypot(x, y) || 1, w = (2.5 * (1 - t) + 1.0 * t) * sc * .62; L1.push((p[0] - y / m * w).toFixed(2) + " " + (p[1] + x / m * w).toFixed(2)); R1.unshift((p[0] + y / m * w).toFixed(2) + " " + (p[1] - x / m * w).toFixed(2)); if (i > 0 && i < 14) rings += "M" + (p[0] - y / m * w).toFixed(2) + " " + (p[1] + x / m * w).toFixed(2) + "L" + (p[0] + y / m * w).toFixed(2) + " " + (p[1] - x / m * w).toFixed(2); }
      var tr = "M" + L1.join("L") + "L" + R1.join("L") + "Z", tf = ' transform="translate(' + cx + " " + (cy + .6) + ") scale(" + sc + ')"';
      return '<g stroke-linejoin="round" stroke-linecap="round"><path d="' + tr + '" fill="' + rim + '" stroke="' + rim + '" stroke-width="1.1"/><path d="' + F + '" fill="' + rim + '" stroke="' + rim + '" stroke-width="1.1"' + tf + '/><path d="' + tr + '" fill="' + col + '"/><path d="' + F + '" fill="' + col + '"' + tf + '/><path d="' + rings + '" stroke="' + rim + '" stroke-opacity=".7" stroke-width=".35" fill="none"/>'
        + '<circle cx="' + (cx - 1.2) + '" cy="' + (cy + 1.4) + '" r="1.25" fill="#6a3418" stroke="' + rim + '" stroke-width=".35"/><circle cx="' + (cx + 1.3) + '" cy="' + (cy + 1.6) + '" r="1.25" fill="#7a4020" stroke="' + rim + '" stroke-width=".35"/></g>';
    }
    var PC = [{ f: [[-102, 16.5, .3], [-72, 17.4, .25], [-42, 15.6, .2], [-14, 12.5, .1], [14, 12.5, .1], [42, 15.6, .2], [72, 17.4, .25], [102, 16.5, .3], [-132, 10, .6], [132, 10, .6]], lf: 4.2, M: 12, wd: 1.0, tip: .6 }];
    function spk(x, y, s, c) { return '<path d="M' + x + " " + (y - s) + "L" + (x + s * .28) + " " + (y - s * .28) + "L" + (x + s) + " " + y + "L" + (x + s * .28) + " " + (y + s * .28) + "L" + x + " " + (y + s) + "L" + (x - s * .28) + " " + (y + s * .28) + "L" + (x - s) + " " + y + "L" + (x - s * .28) + " " + (y - s * .28) + 'Z" fill="' + c + '"/>'; }
    function gr(id, a, x2, y2) { var s = '<linearGradient id="' + u + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">'; a.forEach(function (c, k) { s += '<stop offset="' + c[0] + '" stop-color="' + c[1] + '"/>'; }); return s + "</linearGradient>"; }
    var o = '<svg class="pin" width="' + px + '" height="' + px + '" viewBox="-2 -2 52 52" aria-hidden="true"><defs>'
      + gr("t", [[0, "#5a4af0"], [.4, "#d84ad0"], [.75, "#ff7a6a"], [1, "#ffb04a"]]) + gr("b", [[0, "#5ff0ff"], [1, "#ff4fd0"]], 1, 0) + gr("q", [[0, "#c690ff"], [.5, "#8a40f0"], [1, "#4a14b0"]]) + gr("v", [[0, "#6a2ad8"], [.5, "#ff4fa3"], [.85, "#ff9a4a"], [1, "#ffd25a"]]) + gr("s", [[0, "#ffb04a"], [.5, "#ff4f9a"], [1, "#9a2ad8"]]) + gr("p", [[0, "#ffd0ec"], [.5, "#ff5fb0"], [1, "#d4207e"]]) + gr("g", [[0, "#fff6c0"], [.5, "#ffc857"], [1, "#b8742a"]]) + gr("m", [[0, "#d8f0c8"], [1, "#5a9a62"]]) + gr("c", [[0, "#ff8ad0"], [1, "#7a2ad8"]]) + gr("bg", [[0, "#7ad88a"], [.55, "#3a9a52"], [1, "#1f5a34"]], 1, 1) + gr("z", [[0, "#a0f0ff"], [.5, "#ff7ac8"], [1, "#7a2ad8"]], 1, 1) + gr("e", [[0, "#f4f4ff"], [.5, "#a0a0c8"], [1, "#50507a"]]) + gr("f", [[0, "#5a5a86"], [1, "#22223e"]]);
    if (I === 5) {
      o += '<clipPath id="' + u + 'a"><circle cx="22" cy="26" r="18.4"/></clipPath><clipPath id="' + u + 'k"><path d="' + VI + '"/></clipPath></defs>'
        + '<circle cx="22" cy="26" r="19.6" fill="#ff4fd0" fill-opacity=".5"/><circle cx="22" cy="26" r="18.6" fill="' + D + '"/><circle cx="22" cy="26" r="17.4" fill="url(#' + u + 's)"/>'
        + '<g clip-path="url(#' + u + 'a)"><rect x="0" y="31" width="48" height="1.1" fill="' + D + '"/><rect x="0" y="34" width="48" height="1.6" fill="' + D + '"/><rect x="0" y="37.4" width="48" height="2.2" fill="' + D + '"/></g>'
        + '<circle cx="33" cy="15" r="10" fill="#ff4fd0" fill-opacity=".28"/>' + pal(33, 40, 24, 1, 1.2, "#2a0850", "#ff8ae0") + '<g transform="translate(23 27) skewX(-8) scale(.98 1.26) translate(-3.8 0)">'
        + '<path d="' + VI + '" fill="' + D + '" stroke="' + D + '" stroke-width="4.4" stroke-linejoin="round"/><path d="' + VI + '" fill="none" stroke="#c66cff" stroke-width="2.6" stroke-linejoin="round"/>'
        + '<path d="' + VI + '" fill="url(#' + u + 'v)"/><g clip-path="url(#' + u + 'k)"><circle cx="1.6" cy="5.4" r="5.4" fill="#ffe27a" fill-opacity=".9"/><circle cx="18" cy="3" r="4" fill="#ffe27a" fill-opacity=".8"/>'
        + '<g transform="scale(1 .67)">' + pal(-8, 12, 10, 0, .3, D, "#ff6fd0") + pal(-3.5, 12, 7, .3, .24, D, "#ff6fd0") + pal(16.6, 12, 11, 0, .32, D, "#ff6fd0") + '</g><path d="M13.4 5.2H22.6V8H13.4Z" fill="' + D + '" fill-opacity=".45"/></g>'
        + '<path d="' + VI + '" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7" stroke-linejoin="round"/></g>';
    } else if (I === 2) {
      o += '<clipPath id="' + u + 'a"><rect x="9" y="12" width="30" height="16" rx="1.6"/></clipPath></defs>'
        + '<g transform="rotate(-6 24 24)"><rect x="2.6" y="8.6" width="42.8" height="30" rx="4" fill="#ff4fd0" fill-opacity=".5" stroke="#ff4fd0" stroke-opacity=".5" stroke-width="5.4"/><rect x="2.6" y="8.6" width="42.8" height="30" rx="4" fill="' + D + '" stroke="' + D + '" stroke-width="3.6"/>'
        + '<rect x="2.6" y="8.6" width="42.8" height="30" rx="4" fill="url(#' + u + 'c)" stroke="#ffd0ec" stroke-width=".8"/><rect x="4.2" y="10" width="39.6" height="3" rx="1.5" fill="#fff" fill-opacity=".3"/>'
        + '<rect x="9" y="12" width="30" height="16" rx="1.6" fill="url(#' + u + 's)" stroke="' + D + '" stroke-width=".8"/><g clip-path="url(#' + u + 'a)"><circle cx="24" cy="24.4" r="6.4" fill="#ffe27a"/><rect x="9" y="22.6" width="30" height=".8" fill="#ff2e93"/><rect x="9" y="24.4" width="30" height="1" fill="#ff2e93"/><rect x="9" y="26.4" width="30" height="1.6" fill="#ff2e93"/></g>'
        + '<g transform="translate(24 19.6) skewX(-8) scale(.5 .56) translate(-3.8 0)"><path d="' + VI + '" fill="' + D + '" stroke="' + D + '" stroke-width="3.6" stroke-linejoin="round"/><path d="' + VI + '" fill="url(#' + u + 'p)" stroke="#fff" stroke-width="1" stroke-linejoin="round"/></g>'
        + '<path d="M12.6 38.6L16.4 31.6H31.6L35.4 38.6Z" fill="#2a1060" stroke="' + D + '" stroke-width=".8" stroke-linejoin="round"/><circle cx="17.6" cy="35.8" r="1" fill="' + D + '"/><circle cx="30.4" cy="35.8" r="1" fill="' + D + '"/><rect x="21" y="34.2" width="6" height="2.6" rx=".8" fill="' + D + '"/>'
        + '<rect x="13.4" y="28.6" width="21.2" height="4.8" rx="2.4" fill="' + D + '" stroke="#ffd0ec" stroke-width=".5"/><circle cx="18.8" cy="31" r="1.8" fill="#fff"/><circle cx="29.2" cy="31" r="1.8" fill="#fff"/><path d="M18.8 29.4V32.6M17.2 31H20.4M29.2 29.4V32.6M27.6 31H30.8" stroke="' + D + '" stroke-width=".4"/>'
        + '<circle cx="6.4" cy="12" r=".9" fill="' + D + '"/><circle cx="41.6" cy="12" r=".9" fill="' + D + '"/><circle cx="6.4" cy="35" r=".9" fill="' + D + '"/><circle cx="41.6" cy="35" r=".9" fill="' + D + '"/></g>'
        + '<path d="M40 3.4V9.6M40 3.4L44.6 4.6V6.2L40 5" stroke="' + D + '" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 3.4V9.6M40 3.4L44.6 4.6V6.2L40 5" stroke="#ffe27a" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38.6" cy="10" r="1.7" fill="#ffe27a" stroke="' + D + '" stroke-width=".7"/>';
    } else if (I === 3) {
      var LT = "M11 -4.4Q10 -9 5 -9Q-1 -9 -1 0Q-1 9 5 9Q11 9 11 3.4V1.2H5.6M14.6 -8.6H27.4M21 -8.6V9M29.4 9L35.2 -9L41 9M31.4 3.2H39", HX = "M1.6 24L10.2 7.4H37.8L46.4 24L37.8 40.6H10.2Z", HI = "M5.4 24L12 10.6H36L42.6 24L36 37.4H12Z";
      o += '<clipPath id="' + u + 'a"><path d="' + HI + '"/></clipPath><mask id="' + u + 'M" maskUnits="userSpaceOnUse" x="-30" y="-20" width="80" height="40"><path d="' + LT + '" fill="none" stroke="#fff" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/></mask></defs>'
        + '<path d="' + HX + '" fill="#ffc857" fill-opacity=".55" stroke="#ffc857" stroke-opacity=".55" stroke-width="5.6" stroke-linejoin="round"/><path d="' + HX + '" fill="' + D + '" stroke="' + D + '" stroke-width="3.8" stroke-linejoin="round"/>'
        + '<path d="' + HX + '" fill="url(#' + u + 'g)" stroke="#fff6c0" stroke-width=".7" stroke-linejoin="round"/><path d="M4 24L11 9.2H37L44 24L37 38.8H11Z" fill="none" stroke="#8a5a1a" stroke-opacity=".7" stroke-width=".6" stroke-linejoin="round"/>'
        + '<path d="' + HI + '" fill="' + D + '" stroke="' + D + '" stroke-width="1.4" stroke-linejoin="round"/><path d="' + HI + '" fill="url(#' + u + 's)"/>'
        + '<g clip-path="url(#' + u + 'a)"><rect x="0" y="29.6" width="48" height="1" fill="' + D + '"/><rect x="0" y="32.4" width="48" height="1.5" fill="' + D + '"/><rect x="0" y="35.6" width="48" height="2.4" fill="' + D + '"/>' + pal(10, 38, 16, 1, .72, "#2a0850", "#ff8ae0") + pal(38, 38, 15, -1, .7, "#2a0850", "#ff8ae0") + '</g>'
        + '<path d="' + HI + '" fill="none" stroke="#ff4fd0" stroke-width=".9" stroke-linejoin="round"/>'
        + '<g transform="translate(24 24) skewX(-9) scale(.78 .88) translate(-20.6 0)"><path d="' + LT + '" fill="none" stroke="' + D + '" stroke-width="8.8" stroke-linejoin="round" stroke-linecap="round"/><path d="' + LT + '" fill="none" stroke="#ffe9a0" stroke-width="6.8" stroke-linejoin="round" stroke-linecap="round"/><path d="' + LT + '" fill="none" stroke="#b8742a" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<g mask="url(#' + u + 'M)"><rect x="-4" y="-12" width="52" height="24" fill="url(#' + u + 'v)"/><circle cx="19" cy="5" r="6.4" fill="#ffe27a" fill-opacity=".9"/><rect x="-4" y="3.4" width="52" height=".8" fill="#ff2e93"/><rect x="-4" y="5.4" width="52" height="1.1" fill="#ff2e93"/><rect x="-4" y="7.6" width="52" height="1.5" fill="#ff2e93"/></g></g>'
        + '<path d="M10.2 7.4H37.8L33 14H8Z" fill="#fff" fill-opacity=".28"/>';
    } else {
      o += '<clipPath id="' + u + 'a"><circle cx="24" cy="25" r="17.2"/></clipPath></defs>'
        + '<circle cx="24" cy="25" r="20" fill="#ff4fd0" fill-opacity=".5"/><circle cx="24" cy="25" r="18.8" fill="' + D + '"/><circle cx="24" cy="25" r="17.4" fill="url(#' + u + 's)"/>'
        + '<g clip-path="url(#' + u + 'a)"><rect x="0" y="29" width="48" height="1" fill="' + D + '"/><rect x="0" y="32" width="48" height="1.5" fill="' + D + '"/><rect x="0" y="35.4" width="48" height="2.4" fill="' + D + '"/></g>'
        + '<path d="M3 43Q24 37 45 43Q24 49 3 43Z" fill="' + D + '" stroke="#ff8ae0" stroke-width=".7"/>' + palmZ(21, 43, 25, 15.6, 1.05, "#1c0646", "#ff8ae0", PC[0]);
    }
    return o + "</svg>";
  }
  function pinSvg(id, px) {
    var u = "pn" + (++pinN), D = "#12051f", I = ["sol", "gat", "cas", "gta", "pal", "vi"].indexOf(id); if (I === 5) return '<svg class="pin" width="' + px + '" height="' + px + '" viewBox="-2 -2 52 52" aria-hidden="true"><image href="img/pin-vi.webp" x="1.9" y="-.97" width="48.65" height="47.07"/></svg>'; if (I > 1) return pinStk(I, px, u); var tier = I < 2 ? 0 : I < 4 ? 1 : I === 4 ? 2 : 3;
    function poly(R, n, a0, k) { var o = ""; for (var i = 0; i < n; i++) { var a = (a0 + i * 360 / n) * Math.PI / 180; o += (i ? "L" : "M") + (24 + R * Math.cos(a)).toFixed(2) + " " + (24 + R * Math.sin(a)).toFixed(2); } return o + "Z"; }
    var teeth = ""; for (var i = 0; i < 40; i++) { var a = (i * 9) * Math.PI / 180, R = i % 2 ? 20.6 : 23.4; teeth += (i ? "L" : "M") + (24 + R * Math.cos(a)).toFixed(2) + " " + (24 + R * Math.sin(a)).toFixed(2); } teeth += "Z";
    var P = [teeth, poly(23, 6, -90), "M24 1.6L43.4 7.4L43.4 24Q43.4 37.6 24 46.6Q4.6 37.6 4.6 24L4.6 7.4Z", "M13 2H35Q46 2 46 13V35Q46 46 35 46H13Q2 46 2 35V13Q2 2 13 2Z", poly(23.2, 8, -67.5), "M24 2.4A21.6 21.6 0 1 0 24.01 2.4Z"][I];
    var rim = [["#ffe0c8", "#e08a60", "#7a2f26"], ["#fff2b0", "#ffc857", "#a8661e"], ["#fff2b0", "#ffc857", "#a8661e"], ["#fff2b0", "#ffc857", "#a8661e"], ["#ffffff", "#ffd25a", "#a8661e"], ["#ffffff", "#ffd25a", "#b8741e"]][I];
    var S = [["#2a0c70", "#b8229a", "#ff5a6a", "#ffa24a"], ["#2a0c70", "#b8229a", "#ff5a6a", "#ffa24a"], ["#0a0630", "#2a1090", "#a8289a", "#3ac8d8"], ["#12043a", "#3a1290", "#7a2ad0", "#d83a9a"], ["#140804", "#3a1c0a", "#8a5018", "#ffc050"], ["#1c0846", "#5a1ab0", "#c02a9a", "#ff6aa8"]][I];
    var o = '<svg class="pin" width="' + px + '" height="' + px + '" viewBox="-2 -2 52 52" aria-hidden="true"><defs>'
      + '<linearGradient id="' + u + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + rim[0] + '"/><stop offset=".45" stop-color="' + rim[1] + '"/><stop offset="1" stop-color="' + rim[2] + '"/></linearGradient>'
      + '<linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S[0] + '"/><stop offset=".42" stop-color="' + S[1] + '"/><stop offset=".72" stop-color="' + S[2] + '"/><stop offset="1" stop-color="' + S[3] + '"/></linearGradient>'
      + '<linearGradient id="' + u + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ff9a3d"/><stop offset="1" stop-color="#ff2e93"/></linearGradient>'
      + '<linearGradient id="' + u + 'p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0ec"/><stop offset=".5" stop-color="#ff5fb0"/><stop offset="1" stop-color="#d4207e"/></linearGradient>'
      + '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="#ffc857"/><stop offset="1" stop-color="#b8742a"/></linearGradient>'
      + '<clipPath id="' + u + 'c"><path d="' + P + '" transform="translate(24 24) scale(.83) translate(-24 -24)"/></clipPath></defs>';
    function Pt(sc, extra) { return '<path d="' + P + '" transform="translate(24 24) scale(' + sc + ') translate(-24 -24)" ' + extra + '/>'; }
    if (I === 5) o += '<g fill="url(#' + u + 'g)" stroke="' + D + '" stroke-width=".7" stroke-linejoin="round"><path d="M3 22Q-3 14 -1 6Q5 8 8 14Q4 14 5 18Q9 18 11 22Z"/><path d="M45 22Q51 14 49 6Q43 8 40 14Q44 14 43 18Q39 18 37 22Z"/><path d="M4 28Q-2 24 -1 17Q4 19 7 23Z"/><path d="M44 28Q50 24 49 17Q44 19 41 23Z"/></g>';
    o += Pt(1, 'fill="#0a0318" fill-opacity=".5" transform="translate(24 25.4) scale(1) translate(-24 -24)"');
    o += Pt(1, 'fill="url(#' + u + 'r)" stroke="' + D + '" stroke-width=".9" stroke-linejoin="round"') + Pt(.96, 'fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"') + Pt(.88, 'fill="' + D + '" stroke="#7a3a10" stroke-width=".5"') + Pt(.83, 'fill="url(#' + u + 's)"');
    o += '<g clip-path="url(#' + u + 'c)">';
    function palm(x, y, h, lean, sc, col, rim) {
      var tx = lean, ty = -h, g = '<g transform="translate(' + x + " " + y + ')"><path d="M-1.6 0Q' + (lean * .3 - 1.1) + " " + (-h * .55) + " " + (tx - .6) + " " + ty + "L" + (tx + .8) + " " + ty + "Q" + (lean * .3 + 1.4) + " " + (-h * .55) + ' 1.9 0Z" fill="' + col + '"/>', rg = "";
      for (var k = 1; k < 7; k++) { var yy = -h * k / 7.4, xx = tx * (k / 7.4) * (k / 7.4) * .9; rg += "M" + (xx - 1.1) + " " + yy.toFixed(1) + "L" + (xx + 1.3) + " " + (yy - .5).toFixed(1); }
      g += '<path d="' + rg + '" stroke="' + (rim || "#ff4fa3") + '" stroke-opacity=".55" stroke-width=".4"/><g transform="translate(' + tx + " " + ty + ')">';
      [[-172, 1], [-146, 1.08], [-118, 1], [-92, .8], [-64, 1], [-36, 1.08], [-8, 1], [14, .8], [166, .8]].forEach(function (q) {
        var r = q[0] * Math.PI / 180, L = 13 * sc * q[1], c = Math.cos(r), sn = Math.sin(r), w = L * .2, ex = L * c, ey = L * sn * .55 + L * .42, mx = ex * .55, my = ey * .5 - L * .3;
        g += '<path d="M0 0Q' + (mx - sn * w).toFixed(1) + " " + (my + c * w).toFixed(1) + " " + ex.toFixed(1) + " " + ey.toFixed(1) + "Q" + (mx + sn * w).toFixed(1) + " " + (my - c * w + w * .6).toFixed(1) + ' 0 0Z" fill="' + col + '" stroke="' + (rim || "#ff4fa3") + '" stroke-opacity=".7" stroke-width=".35" stroke-linejoin="round"/>'
          + '<path d="M0 0Q' + mx.toFixed(1) + " " + (my + .4).toFixed(1) + " " + (ex * .92).toFixed(1) + " " + (ey * .92).toFixed(1) + '" stroke="' + (rim || "#ff4fa3") + '" stroke-opacity=".45" stroke-width=".3" fill="none"/>';
      });
      return g + '<circle cx="-.8" cy="1.3" r="1.1" fill="#7a3a1a"/><circle cx="1" cy="1.6" r="1.1" fill="#8a4a22"/></g></g>';
    }
    if (I === 0) {
      o += '<defs><linearGradient id="' + u + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8ab4"/><stop offset=".45" stop-color="#b8229a"/><stop offset="1" stop-color="#2a0c70"/></linearGradient></defs>'
        + '<ellipse cx="33" cy="13" rx="7" ry=".9" fill="#ffd0e6" fill-opacity=".5"/>'
        + '<circle cx="24" cy="29" r="17" fill="#ff9a3d" fill-opacity=".25"/><circle cx="24" cy="29" r="12.4" fill="url(#' + u + 'd)"/>';
      for (i = 0; i < 5; i++) o += '<rect x="9" y="' + (24 + i * 2.2) + '" width="30" height="' + (.45 + i * .4) + '" fill="#c02a98"/>';
      o += '<rect x="2" y="32.2" width="44" height="16" fill="url(#' + u + 'w)"/><path d="M2 32.4H46" stroke="#ffd0e6" stroke-width=".7"/>';
      [[24, 33.8, 11], [24, 35.8, 8.6], [24, 37.8, 6.4], [24, 39.8, 4.4]].forEach(function (q, k) { o += '<rect x="' + (q[0] - q[2] / 2) + '" y="' + q[1] + '" width="' + q[2] + '" height="1" rx=".5" fill="' + (k % 2 ? "#ffd25a" : "#fff2a0") + '" fill-opacity=".9"/>'; });
      o += ''
        + '<path d="M29.6 18.4q1.2-1.6 2.4 0q1.2-1.6 2.4 0M36 22q.9-1.2 1.8 0q.9-1.2 1.8 0" stroke="' + D + '" stroke-width=".7" fill="none" stroke-linecap="round"/>'
        + palm(11, 40, 21, 3, 1, D)
        + '<path d="M2 41.4Q12 38.4 24 40.4Q36 38.4 46 41.4V48H2Z" fill="' + D + '"/><path d="M4 41.6Q13 39 24 40.8Q35 39 44 41.6" stroke="#ffd0e6" stroke-opacity=".7" stroke-width=".6" fill="none"/>';
    } else if (I === 1) {
      function tree(x, w, h, col, mo) {
        var t = '<path d="M' + (x - w * 1.5) + ' 36Q' + (x - w * .4) + " " + (36 - h * .3) + " " + (x - w * .5) + " " + (36 - h) + "L" + (x + w * .5) + " " + (36 - h) + "Q" + (x + w * .4) + " " + (36 - h * .3) + " " + (x + w * 1.5) + ' 36Z" fill="' + col + '"/><ellipse cx="' + x + '" cy="' + (36 - h) + '" rx="' + (w * 3.6) + '" ry="' + (w * 1.3) + '" fill="' + col + '"/><path d="';
        for (var k = -3; k <= 3; k++) { var mx = x + k * w * .95, ln = (4 + ((k + 3) * 7 % 5)) * (h / 24); t += "M" + mx.toFixed(1) + " " + (36 - h + 1) + "Q" + (mx + (k % 2 ? 1 : -1)).toFixed(1) + " " + (36 - h + ln * .6).toFixed(1) + " " + (mx + (k % 2 ? .6 : -.6)).toFixed(1) + " " + (36 - h + ln).toFixed(1); }
        return t + '" stroke="' + mo + '" stroke-width=".7" fill="none" stroke-linecap="round"/>';
      }
      o += '<defs><linearGradient id="' + u + 'q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4f27a"/><stop offset=".5" stop-color="#5aa83a"/><stop offset="1" stop-color="#1a4a1e"/></linearGradient><linearGradient id="' + u + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d83a9a"/><stop offset=".5" stop-color="#4a1a9a"/><stop offset="1" stop-color="#160a40"/></linearGradient></defs>'
        + '<circle cx="24" cy="27" r="17" fill="#ff9a3d" fill-opacity=".25"/><circle cx="24" cy="27" r="12.6" fill="url(#' + u + 'd)"/><rect x="9" y="24" width="30" height=".6" fill="#c02a98"/><rect x="9" y="26.2" width="30" height=".9" fill="#c02a98"/><rect x="9" y="28.6" width="30" height="1.3" fill="#c02a98"/>'
        + '<rect x="3" y="26" width="3.4" height="9" fill="#1a0838"/><rect x="7" y="23" width="3.6" height="12" fill="#1a0838"/><rect x="38" y="24.6" width="3.6" height="10.4" fill="#1a0838"/><rect x="42" y="27" width="3.4" height="8" fill="#1a0838"/>'
        + '<g transform="translate(3.84 5.44) scale(.84)"><path d="M4 31.4Q8 26.6 13 27Q14.4 21.6 19.6 22.2Q23 22.6 25 25.2L38.6 26Q42.6 26.2 43 29L43 31.2Q42.8 33 40 33.2L8 34Z" fill="url(#' + u + 'q)" stroke="#0a2a10" stroke-width=".7" stroke-linejoin="round"/>'
        + '<path d="M6.4 29.6l1.6-2.6 1.4 2.4 1.8-2.6 1.2 2.4M22.6 24.6l2.4-1.6 1.2 1.8 2-1.6 1 1.8" stroke="#1a4a1e" stroke-width=".9" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<path d="M13.6 25.6Q18 21.8 23.6 25.6" stroke="#eaffc0" stroke-opacity=".6" stroke-width=".8" fill="none" stroke-linecap="round"/><path d="M26 26.6H39" stroke="#eaffc0" stroke-opacity=".5" stroke-width=".7" stroke-linecap="round"/>'
        + '<circle cx="40.2" cy="27.4" r="1" fill="#0a2a10"/><circle cx="18.2" cy="24.2" r="3.1" fill="#5aa83a" stroke="#0a2a10" stroke-width=".6"/><ellipse cx="18.4" cy="24.2" rx="1.9" ry="1.5" fill="#ffe74a" stroke="#0a2a10" stroke-width=".4"/><ellipse cx="18.5" cy="24.2" rx=".45" ry="1.3" fill="#0a2a10"/><path d="M15.6 22.8Q18.4 20.8 21.2 23" stroke="#0a2a10" stroke-width=".9" fill="none" stroke-linecap="round"/>'
        + '<path d="M22 31.2L42.2 30.2" stroke="#0a2a10" stroke-width=".9" stroke-linecap="round"/><path d="M24.4 31L25.8 33.2L27.2 30.9L28.6 33L30 30.7L31.4 32.8L32.8 30.5L34.2 32.6L35.6 30.4L37 32.4L38.4 30.3L39.8 32.2L41 30.2Z" fill="#fff"/></g>'
        + '<path d="M2 32.2Q8 30.2 14 32.2T26 32.2T38 32.2T50 32.2V48H2Z" fill="url(#' + u + 'm)"/><path d="M2 32.4Q8 30.4 14 32.4T26 32.4T38 32.4T50 32.4" stroke="#ffb0e8" stroke-width=".8" fill="none"/>'
        + '<path d="M6 36.4H15M28 37.6H42M10 41.6H22M30 43.6H40" stroke="#ff8ae0" stroke-opacity=".4" stroke-width=".7" stroke-linecap="round"/>'
        + '<ellipse cx="36.4" cy="34.4" rx="4.4" ry="1.1" fill="none" stroke="#c8fff0" stroke-opacity=".75" stroke-width=".6"/><ellipse cx="36.4" cy="34.4" rx="7.6" ry="1.9" fill="none" stroke="#c8fff0" stroke-opacity=".4" stroke-width=".5"/>'
    } else if (I === 2) {
      var B = [[8.6, 4, 9], [12.8, 3.4, 14], [16.4, 4, 8], [20.8, 3.6, 18], [24.8, 4.4, 11], [29.4, 3.6, 15], [33.2, 4, 8], [37, 3.8, 12]], bl = "";
      o += '<circle cx="33" cy="13.4" r="9" fill="#ff4fa3" fill-opacity=".22"/><circle cx="33" cy="13.4" r="6.2" fill="url(#' + u + 'd)"/><ellipse cx="24" cy="37.6" rx="22" ry="6" fill="#3ff2e0" fill-opacity=".3"/>';
      B.forEach(function (q, k) { o += '<rect x="' + (q[0] - 1) + '" y="' + (39 - q[2] - 3) + '" width="' + (q[1] + 2) + '" height="' + (q[2] + 6) + '" fill="#241080" fill-opacity=".8"/>'; });
      B.forEach(function (q, k) {
        o += '<rect x="' + q[0] + '" y="' + (39 - q[2]) + '" width="' + q[1] + '" height="' + (q[2] + 1) + '" fill="#0a0630"/>';
        for (var wy = 39 - q[2] + 1.6; wy < 37.2; wy += 2.2) for (var wx = q[0] + .7; wx < q[0] + q[1] - .6; wx += 1.5) if (((wx * 7 + wy * 13 + k * 5) | 0) % 3) bl += '<rect x="' + wx.toFixed(1) + '" y="' + wy.toFixed(1) + '" width=".7" height=".9" fill="' + ["#ff7ac0", "#3ff2e0", "#ffe27a"][((wx * 3 + wy * 5 + k) | 0) % 3] + '"/>';
      });
      o += bl + '<path d="M21.6 21V15.4" stroke="#0a0630" stroke-width=".6"/><circle cx="21.6" cy="15" r=".9" fill="#ff3a4a"/>'
        + palm(14.4, 38, 20, -2, .95, D) + '<rect x="2" y="38.2" width="44" height="10" fill="#06031a"/><path d="M2 38.4H46" stroke="#3ff2e0" stroke-width=".9"/>'
        + '<path d="M14.6 40.4H33.4L31.8 46H16.2Z" fill="' + D + '" stroke="#ff4fa3" stroke-width=".5" stroke-linejoin="round"/><g transform="translate(24 43.2) skewX(-10) scale(.26)"><path d="M-13 -8L-6.6 -8L-2.6 2.6L1.6 -8L8 -8L.6 8L-5 8Z M9.6 -8H15.6V8H9.6Z" fill="url(#' + u + 'p)" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></g>';
    } else if (I === 3) {
      var VV = "M-13 -8L-6.6 -8L-2.6 2.6L1.6 -8L8 -8L.6 8L-5 8Z M9.6 -8H15.6V8H9.6Z";
      o += '<defs><linearGradient id="' + u + 'y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b4ff"/><stop offset=".45" stop-color="#8a4ae8"/><stop offset="1" stop-color="#2a0c70"/></linearGradient></defs>'
        + '<circle cx="24" cy="26" r="15" fill="#ff4fa3" fill-opacity=".2"/><g transform="translate(24 19) skewX(-10) scale(1.1)"><path d="' + VV + '" fill="#fff" fill-opacity=".1" stroke="#ff7ac0" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"/></g>'
        + palm(7.4, 37, 13, 2, .62, D) + palm(40.6, 37, 12, -2, .58, D)
        + '<rect x="2" y="36" width="44" height="12" fill="#12043a"/><path d="M2 36.2H46" stroke="#ff4fa3" stroke-width=".9"/>'
        + '<ellipse cx="24" cy="38.2" rx="19" ry="2" fill="#ff2e93" fill-opacity=".45"/><ellipse cx="24" cy="38" rx="14" ry="1.2" fill="#ff7ac0" fill-opacity=".6"/>'
        + '<path d="M4.8 36.4L4.8 32.6Q4.8 31.4 6.4 31L12 29.8Q15.4 25.2 22 24.8L29.6 24.8Q34.6 25.2 37.4 29L41.6 30Q43.2 30.4 43.2 32L43.2 36.4Z" fill="url(#' + u + 'y)" stroke="#12043a" stroke-width=".7" stroke-linejoin="round"/>'
        + '<path d="M16.2 29.6Q18.4 26.4 23 26.2L29 26.2Q32.8 26.6 34.8 29.6Z" fill="#1a0a4a" stroke="#12043a" stroke-width=".5" stroke-linejoin="round"/><path d="M18.6 29.2Q20.4 27 23.4 26.8L24.6 26.8L22.6 29.2Z" fill="#fff" fill-opacity=".45"/><path d="M26 26.4V29.6" stroke="#12043a" stroke-width=".5"/>'
        + '<path d="M13 29.6Q16.4 25.6 22 25.2L29.6 25.2Q34.4 25.6 37 29" stroke="#fff" stroke-opacity=".55" stroke-width=".6" fill="none"/><path d="M5.6 33.4H42.4" stroke="#ff4fa3" stroke-width=".9"/><path d="M5.4 30.4L3.8 28.2L9.4 29Z" fill="#2a0c70" stroke="#12043a" stroke-width=".4"/>'
        + '<path d="M4.6 36.6Q13.8 29.6 23 36.6Z" fill="#12043a"/><path d="M26.4 36.6Q35.6 29.6 44.8 36.6Z" fill="#12043a"/>'
        + '<circle cx="14" cy="36" r="4.2" fill="#0a0220" stroke="#05010c" stroke-width=".5"/><circle cx="14" cy="36" r="2.7" fill="#e8e0ff" stroke="#6a5aa0" stroke-width=".4"/><path d="M14 33.6V38.4M11.6 36H16.4M12.3 34.3L15.7 37.7M15.7 34.3L12.3 37.7" stroke="#6a5aa0" stroke-width=".35"/><circle cx="14" cy="36" r=".8" fill="#2a1060"/>'
        + '<circle cx="34.4" cy="36" r="4.2" fill="#0a0220" stroke="#05010c" stroke-width=".5"/><circle cx="34.4" cy="36" r="2.7" fill="#e8e0ff" stroke="#6a5aa0" stroke-width=".4"/><path d="M34.4 33.6V38.4M32 36H36.8M32.7 34.3L36.1 37.7M36.1 34.3L32.7 37.7" stroke="#6a5aa0" stroke-width=".35"/><circle cx="34.4" cy="36" r=".8" fill="#2a1060"/>'
        + '<path d="M43 31.6L48 29.4V34.2Z" fill="#c8f4ff" fill-opacity=".5"/><rect x="40.4" y="30.6" width="3.2" height="1.7" rx=".7" fill="#fff"/><rect x="4.8" y="31.4" width="1.6" height="2" rx=".5" fill="#ff3a4a"/>';
    } else if (I === 4) {
      o += '<ellipse cx="24" cy="26" rx="17" ry="13" fill="#ffd25a" fill-opacity=".22"/>' + palm(36.4, 36, 24, -3, 1.05, "#2a1406", "#ffd25a")
        + '<g transform="translate(4.8 5.2) scale(.8)"><path d="M9 28L15 23.4H41L35 28Z" fill="#c0e8b0" stroke="#2a5a32" stroke-width=".6" stroke-linejoin="round"/><path d="M35 28L41 23.4V33.4L35 38Z" fill="#2f6a3a" stroke="#1a4a22" stroke-width=".6" stroke-linejoin="round"/><rect x="9" y="28" width="26" height="10" fill="url(#' + u + 'j)" stroke="#1a4a22" stroke-width=".6"/>'
        + '<defs><linearGradient id="' + u + 'j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad090"/><stop offset="1" stop-color="#4a8a52"/></linearGradient></defs>';
      for (var k = 0; k < 7; k++) o += '<path d="M9 ' + (29.3 + k * 1.2) + 'H35" stroke="#2a5a32" stroke-opacity=".55" stroke-width=".35"/>';
      for (k = 0; k < 4; k++) o += '<path d="M35 ' + (29.2 + k * 2.4) + 'L41 ' + (24.6 + k * 2.4) + '" stroke="#1a4a22" stroke-opacity=".6" stroke-width=".35"/>';
      o += '<path d="M17 27.2L21 24.4H36.4L33 27.2Z" fill="none" stroke="#2a5a32" stroke-width=".4"/><ellipse cx="27" cy="25.9" rx="3.2" ry="1.4" fill="#8cc088" stroke="#2a5a32" stroke-width=".4"/><circle cx="19" cy="25.8" r=".6" fill="#2a5a32"/><circle cx="34.6" cy="25.8" r=".6" fill="#2a5a32"/>'
        + '<path d="M19 28L25 28L31 23.4L25 23.4Z" fill="url(#' + u + 'g)" stroke="#8a5a1a" stroke-width=".4" stroke-linejoin="round"/><rect x="19" y="28" width="6" height="10" fill="url(#' + u + 'g)" stroke="#8a5a1a" stroke-width=".4"/>'
        + '<g transform="translate(22 33)" stroke="#5a3a0a" stroke-width=".9" fill="none" stroke-linecap="round"><path d="M1.5 -2.6C-1.8 -3.6 -2.2 -.4 0 .1C2.2 .6 1.8 3.6 -1.5 2.6M0 -3.8V3.8"/></g>'
        + '<g transform="translate(18.6 30.4)"><ellipse cx="0" cy="0" rx="2.2" ry="1" fill="#4a8a52" stroke="#2a5a32" stroke-width=".3"/></g></g>'
        + '<ellipse cx="10.4" cy="41.2" rx="3.6" ry="1.3" fill="url(#' + u + 'g)" stroke="#8a5a1a" stroke-width=".4"/><ellipse cx="10.4" cy="40.4" rx="3.6" ry="1.3" fill="#ffe08a" stroke="#8a5a1a" stroke-width=".4"/><ellipse cx="15.6" cy="42" rx="3.2" ry="1.2" fill="#ffe08a" stroke="#8a5a1a" stroke-width=".4"/>'
        + '<path d="M38 8l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#fff"/><path d="M9 11l.6 1.4 1.4.6-1.4.6L9 15l-.6-1.4L7 13l1.4-.6z" fill="#ffe27a"/>';
    } else {
      o += '<g stroke="#ff7ac0" stroke-opacity=".4" stroke-width=".8">';
      for (i = 0; i < 16; i++) { var an = i * 22.5 * Math.PI / 180; o += '<path d="M24 24L' + (24 + 30 * Math.cos(an)).toFixed(1) + " " + (24 + 30 * Math.sin(an)).toFixed(1) + '"/>'; }
      var VP2 = "M-13 -8L-6.6 -8L-2.6 2.6L1.6 -8L8 -8L.6 8L-5 8Z", VR2 = "M9.6 -8H15.6V8H9.6Z";
      o += '</g><circle cx="24" cy="24" r="15" fill="#ff2e93" fill-opacity=".3"/>' + palm(36, 30, 16, -3, .95, D)
        + '<defs><linearGradient id="' + u + 'v" x1="0" y1="-8" x2="0" y2="8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7a3ae8"/><stop offset=".42" stop-color="#ff2e93"/><stop offset=".78" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ffd25a"/></linearGradient><clipPath id="' + u + 'k"><path d="' + VP2 + '"/><path d="' + VR2 + '"/></clipPath></defs>'
        + '<g transform="translate(23.4 25) skewX(-10) scale(.98)"><g transform="translate(1.1 1.5)" fill="#3a0a50" stroke="#3a0a50" stroke-width="3" stroke-linejoin="round"><path d="' + VP2 + '"/><path d="' + VR2 + '"/></g>'
        + '<g fill="' + D + '" stroke="' + D + '" stroke-width="3" stroke-linejoin="round"><path d="' + VP2 + '"/><path d="' + VR2 + '"/></g>'
        + '<g clip-path="url(#' + u + 'k)"><rect x="-14" y="-9" width="31" height="18" fill="url(#' + u + 'v)"/><circle cx="1" cy="4.2" r="6" fill="#ffe27a" fill-opacity=".9"/><rect x="-5" y="3.6" width="12" height=".6" fill="#ff2e93"/><rect x="-5" y="5.4" width="12" height=".9" fill="#ff2e93"/><rect x="-5" y="7.2" width="12" height="1.2" fill="#ff2e93"/>'
        + palm(-4.4, 9, 8.6, .6, .3, D) + palm(12.6, 9, 8.6, 0, .3, D) + '</g>'
        + '<g fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round"><path d="' + VP2 + '"/><path d="' + VR2 + '"/></g></g>'
        + '<path d="M36.4 8.6l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff"/><path d="M10 36l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#ffe27a"/>';
    }
    o += '<ellipse cx="17" cy="9" rx="13" ry="5.4" fill="#fff" fill-opacity=".18" transform="rotate(-18 17 9)"/></g>';
    o += Pt(.83, 'fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".5" stroke-linejoin="round"');
    if (tier >= 2) o += '<circle cx="24" cy="-.4" r="1.9" fill="' + (I === 4 ? "#3ff2e0" : "#ff2e93") + '" stroke="' + D + '" stroke-width=".6"/>';
    if (I === 4) o += '<circle cx="1.6" cy="24" r="1.6" fill="#ff2e93" stroke="' + D + '" stroke-width=".5"/><circle cx="46.4" cy="24" r="1.6" fill="#ff2e93" stroke="' + D + '" stroke-width=".5"/>';
    return o + '</svg>';
  }
  var MX_PCOL = { "Común": "#ffb27a", "Raro": "#7ac8ff", "Épico": "#c25bff", "Legendario": "#ffd25a" };
  var MX_PIN = { ch: { 1: 0.5, 2: 1.5, 3: 4, 4: 8, 5: 15, 6: 35 } };
  function mxPinPick() { var t = 0; MX_PINS.forEach(function (q) { t += q.w; }); var r = rand01() * t; for (var i = 0; i < MX_PINS.length; i++) { r -= MX_PINS[i].w; if (r < 0) return MX_PINS[i].id; } return MX_PINS[0].id; }
  function mxPinById(id) { for (var i = 0; i < MX_PINS.length; i++) if (MX_PINS[i].id === id) return MX_PINS[i]; return null; }
  /* pin equipado junto al nombre */
  var MX_LED = { gta: { n: "Luz Vice", c: ["#ff2fa0", "#b43cff", "#ff8ae0"], p: 120 } };
  function mxLedId() { try { var m = getMax(), id = m.eq && m.eq.led; return id && MX_LED[id] && m.inv["led_" + id] ? id : ""; } catch (e) { return ""; } }
  function mxLedApply(node, id) { var d = id && MX_LED[id]; node.classList.toggle("nm-led", !!d); if (d) { node.style.setProperty("--l1", d.c[0]); node.style.setProperty("--l2", d.c[1]); node.style.setProperty("--l3", d.c[2]); } }
  function mxPinTag(node, px) {
    mxLedApply(node, mxLedId());
    var o = node.querySelector(".nmpin"); if (o) o.remove();
    try { var m = getMax(), id = m.eq && m.eq.pin; if (!id || !m.pins[id] || !mxPinById(id)) return; var sp = el("span", "nmpin"); sp.innerHTML = pinSvg(id, px); sp.setAttribute("title", mxPinById(id).n); node.appendChild(sp); } catch (e) {}
  }
  function sixIco(px) {
    var u = "sx" + px;
    return '<svg class="six" width="' + px + '" height="' + px + '" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="' + u + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a5cff"/><stop offset=".5" stop-color="#d93cc8"/><stop offset="1" stop-color="#ff2e93"/></linearGradient><linearGradient id="' + u + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a1280"/><stop offset="1" stop-color="#6a1a8a"/></linearGradient><linearGradient id="' + u + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffc2e6"/></linearGradient><g id="' + u + 'i"><path d="' + VI_D + '"/></g></defs>'
      + '<circle cx="16" cy="16.8" r="14.6" fill="#14052a" fill-opacity=".45"/><circle cx="16" cy="16" r="14.6" fill="url(#' + u + 'a)"/><circle cx="16" cy="16" r="14.6" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.5"/>'
      + '<circle cx="16" cy="16" r="11.2" fill="url(#' + u + 'b)" stroke="#ffb8e6" stroke-opacity=".75" stroke-width=".9"/><path d="M7 11.4Q16 4.6 25 11.4" stroke="#fff" stroke-opacity=".38" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
      + viSvg(u, 16, 16.4, .27) + '</svg>';
  }
  /* "VI" dibujado con trazos propios: se ve igual en cualquier celular, sin depender de fuentes */
  var VI_D = "M-26 -15H-14L-8 2L-2 -15H10L-2.4 15H-13.6Z M16 -15H27V15H16Z";
  function viSvg(u, cx, cy, k) {
    function at(dx, dy) { return "translate(" + (cx + dx * k).toFixed(2) + " " + (cy + dy * k).toFixed(2) + ") skewX(-9) scale(" + k + ")"; }
    return '<use href="#' + u + 'i" transform="' + at(3, 3.2) + '" fill="#17052e"/><use href="#' + u + 'i" transform="' + at(1.5, 1.6) + '" fill="#5a1d86" stroke="#17052e" stroke-width="2" stroke-linejoin="round"/>'
      + '<use href="#' + u + 'i" transform="' + at(0, 0) + '" fill="url(#' + u + 'v)" stroke="#fff" stroke-width=".7" stroke-linejoin="round"/>';
  }
  /* una paleta por nivel: de azul noche (1★) a dorado holográfico (6★) */
  var MX_PKT = [null,
    { sky: ["#0b1442", "#27358f", "#5b46c9", "#a56ae8"], sun: ["#d6e4ff", "#8fb0ff", "#6a6cf0"], lg: ["#ffffff", "#bcd2ff"], rim: "#c9d6ff", gr: "#7ab8ff", ac: "#9ec4ff" },
    { sky: ["#1a0f5a", "#5a2bb0", "#b53cc4", "#ff7ac8"], sun: ["#fff0b8", "#ffb0e0", "#c05cff"], lg: ["#ffffff", "#ffc6ec"], rim: "#f0d0ff", gr: "#e08cff", ac: "#e8a8ff" },
    { sky: ["#241068", "#7a2cc4", "#ff2e93", "#ff7a4a"], sun: ["#ffe27a", "#ff9a3d", "#ff2e93"], lg: ["#fff6c8", "#ff9ac8"], rim: "#ffc2dc", gr: "#ff4fa3", ac: "#ff6fb5" },
    { sky: ["#3a0c58", "#a8207a", "#ff5a3c", "#ffa040"], sun: ["#fff3b0", "#ffb347", "#ff5a3c"], lg: ["#fffbe0", "#ffc27a"], rim: "#ffd2a0", gr: "#ff8a5c", ac: "#ffa060" },
    { sky: ["#4a1060", "#c8307a", "#ff8a3a", "#ffd060"], sun: ["#fffbe0", "#ffe27a", "#ffa63d"], lg: ["#ffffff", "#ffe9a0"], rim: "#ffe27a", gr: "#ffc060", ac: "#ffd25a" },
    { sky: ["#1a0a50", "#2f6bff", "#ff4fd8", "#ffd25a"], sun: ["#fff4c8", "#ffd060", "#ff8ac0"], lg: ["#ffffff", "#ffeaa0"], rim: "#fff6c0", gr: "#ffe27a", ac: "#ffe27a" }];
  var mxPkTpl = {};
  function mxPkBuild(s) {
    var t = MX_PKT[s] || MX_PKT[1], i, X0 = 12, top = "", bot = "", rid = "", grid = "", u = "§";
    for (i = 0; i <= 19; i++) top += (i ? "L" : "M") + (X0 + i * 4) + " " + (i % 2 ? 8 : 12);
    for (i = 19; i >= 0; i--) bot += "L" + (X0 + i * 4) + " " + (i % 2 ? 118 : 114);
    var body = top + "L88 114" + bot + "Z";
    for (i = 0; i < 38; i++) rid += "M" + (X0 + 1 + i * 2) + " 12V21M" + (X0 + 1 + i * 2) + " 105V114";
    for (i = -6; i <= 6; i++) grid += "M50 90L" + (50 + i * 12) + " 104"; for (i = 0; i < 4; i++) grid += "M12 " + (92 + i * i * 1.15 + i * 1.2) + "H88";
    /* palmeras: un solo trazo cada una (tronco + hojas) */
    function palm(x0, y0, h, lean, sc, fl) {
      var tx = x0 + fl * lean, ty = y0 - h, d = "M" + (x0 - fl) + " " + y0 + "Q" + (x0 + fl * lean * .5) + " " + (y0 - h * .55) + " " + tx + " " + ty + "L" + (tx + fl * 1.6) + " " + ty + "Q" + (x0 + fl * (lean * .5 + 1.4)) + " " + (y0 - h * .55) + " " + (x0 + fl * 1.2) + " " + y0 + "Z";
      [[-170, 8], [-140, 9.5], [-108, 8], [-72, 8], [-40, 9.5], [-10, 8], [16, 6.5], [166, 6.5]].forEach(function (q) {
        var r = q[0] * Math.PI / 180, L = q[1] * sc, c = Math.cos(r) * fl, sn = Math.sin(r);
        d += "M" + tx + " " + ty + "Q" + (tx + L * .55 * c - sn * 1.2 * fl).toFixed(1) + " " + (ty + L * .55 * sn - L * .26 + c * 1.2).toFixed(1) + " " + (tx + L * c).toFixed(1) + " " + (ty + L * sn + L * .42).toFixed(1)
          + "Q" + (tx + L * .55 * c + sn * 1.2 * fl).toFixed(1) + " " + (ty + L * .55 * sn - L * .26 - c * 1.2 + 1.4).toFixed(1) + " " + tx + " " + ty + "Z";
      });
      return d;
    }
    /* estrellas del nivel (arriba a la derecha) */
    var stars = "", n = s, sx0 = 82.6 - (n - 1) * 4.7, sc = .17;
    for (i = 0; i < n; i++) { var cx = sx0 + i * 4.7, cy = 29.6; STAR_P.split(" ").forEach(function (p, k) { var xy = p.split(","); stars += (k ? "L" : "M") + (cx + (xy[0] - 12) * sc).toFixed(2) + " " + (cy + (xy[1] - 12) * sc).toFixed(2); }); stars += "Z"; }
    var hi = s >= 5, rimFill = hi ? "url(#" + u + "r)" : t.rim;
    return '<svg class="pk @c" viewBox="0 0 100 130" aria-hidden="true"><defs>'
      + '<linearGradient id="' + u + 'a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.sky[0] + '"/><stop offset=".34" stop-color="' + t.sky[1] + '"/><stop offset=".62" stop-color="' + t.sky[2] + '"/><stop offset="1" stop-color="' + t.sky[3] + '"/></linearGradient>'
      + '<linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.sun[0] + '"/><stop offset=".5" stop-color="' + t.sun[1] + '"/><stop offset="1" stop-color="' + t.sun[2] + '"/></linearGradient>'
      + '<linearGradient id="' + u + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.lg[0] + '"/><stop offset="1" stop-color="' + t.lg[1] + '"/></linearGradient>'
      + '<linearGradient id="' + u + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#14052a" stop-opacity=".38"/></linearGradient>'
      + '<radialGradient id="' + u + 'p" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#14052a" stop-opacity="0"/><stop offset="1" stop-color="#14052a" stop-opacity=".55"/></radialGradient>'
      + (hi ? '<linearGradient id="' + u + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".35" stop-color="#ffd25a"/><stop offset=".6" stop-color="#fff6c0"/><stop offset="1" stop-color="#ff9ad0"/></linearGradient>' : "")
      + '<clipPath id="' + u + 'k"><path d="' + body + '"/></clipPath><clipPath id="' + u + 'u"><circle cx="50" cy="60" r="24"/></clipPath>'
      + '<g id="' + u + 'i"><path d="' + VI_D + '"/></g></defs>'
      + '<path d="' + body + '" fill="url(#' + u + 'a)"/>'
      + '<g clip-path="url(#' + u + 'k)"><circle cx="50" cy="60" r="31" fill="' + t.sun[2] + '" fill-opacity=".26"/><circle cx="50" cy="60" r="24" fill="url(#' + u + 's)"/>'
      + '<path clip-path="url(#' + u + 'u)" d="M20 70H80M20 75.4H80M20 81H80M20 86.8H80" stroke="' + t.sky[1] + '" stroke-opacity=".85" stroke-width="1.3"/>'
      + '<path d="M12 90H88" stroke="#fff" stroke-opacity=".8" stroke-width=".8"/><rect x="12" y="90" width="76" height="15" fill="' + t.sky[0] + '" fill-opacity=".88"/><path d="' + grid + '" stroke="' + t.gr + '" stroke-opacity=".85" stroke-width=".5" fill="none"/>'
      + '<path fill="' + t.sky[0] + '" d="' + palm(22, 104, 26, -3, 1, 1) + palm(33, 105, 18, 2, .8, 1) + palm(78, 104, 26, -3, 1, -1) + palm(67, 105, 18, 2, .8, -1) + '"/>'
      + '<rect x="8" y="6" width="84" height="114" fill="url(#' + u + 'p)"/><path d="M60 6L74 6L40 120L26 120Z" fill="#fff" fill-opacity=".07"/>'
      + '<rect x="12" y="8" width="76" height="14" fill="url(#' + u + 'c)"/><rect x="12" y="104" width="76" height="14" fill="url(#' + u + 'c)" transform="rotate(180 50 111)"/>'
      + '<path d="' + rid + '" stroke="#14052a" stroke-opacity=".3" stroke-width=".7"/><path d="M12 21.6H88M12 105.4H88" stroke="#fff" stroke-opacity=".55" stroke-width=".6"/>'
      + '<g class="shn"><path d="M-30 4L-12 4L22 124L4 124Z" fill="#fff" fill-opacity=".5" transform="translate(-20 0)"/></g></g>'
      + '<text x="14.5" y="32" font-family="\'Bricolage Grotesque\',\'IBM Plex Sans\',sans-serif" font-weight="800" font-size="8.6" letter-spacing="-.3" fill="#fff" stroke="#14052a" stroke-width=".55" stroke-linejoin="round" paint-order="stroke">Tron<tspan fill="' + t.ac + '">x</tspan></text>'
      + '<path d="' + stars + '" fill="' + t.rim + '" stroke="#14052a" stroke-width=".25" stroke-opacity=".6"/>'
      + viSvg(u, 50, 63, .74)
      + '<path d="' + body + '" fill="none" stroke="#14052a" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/><path d="' + body + '" fill="none" stroke="' + rimFill + '" stroke-opacity=".95" stroke-width="' + (s >= 4 ? 1.5 : 1.1) + '" stroke-linejoin="round"/></svg>';
  }
  function mxPkSvg(s, cls) { var tp = mxPkTpl[s] || (mxPkTpl[s] = mxPkBuild(s)); return tp.split("§").join("pk" + (++pkUid)).replace("@c", function () { return cls || ""; }); }
  function mxBeachSvg() {
    function wave(y, amp, fill, cls, dur) {
      var d = "M0 " + y; for (var i = 0; i < 8; i++) d += "q50 " + (-amp) + " 100 0q50 " + amp + " 100 0"; d += "V820H0Z";
      return '<path class="bw ' + cls + '" style="animation-duration:' + dur + 's" d="' + d + '" fill="' + fill + '"/>';
    }
    function palm(x, y, h, lean, sc, dly) {
      var tx = lean, fr = ""; [[-176, 70], [-150, 84], [-120, 74], [-92, 60], [-62, 76], [-32, 84], [-4, 72], [20, 58], [162, 58]].forEach(function (q) { var r = q[0] * Math.PI / 180, L = q[1] * sc, c = Math.cos(r), sn = Math.sin(r); fr += "M0 0Q" + (L * .55 * c - sn * 9).toFixed(1) + " " + (L * .55 * sn - L * .3 + c * 9).toFixed(1) + " " + (L * c).toFixed(1) + " " + (L * sn + L * .46).toFixed(1) + "Q" + (L * .55 * c + sn * 9).toFixed(1) + " " + (L * .55 * sn - L * .3 - c * 9 + 9).toFixed(1) + " 0 0Z"; });
      return '<g transform="translate(' + x + " " + y + ')"><g class="bpm" style="transform-origin:0 0;animation-delay:' + dly + 's"><path d="M-7 0C-5 ' + (-h * .4) + " " + (tx * .5) + " " + (-h * .75) + " " + (tx - 3) + " " + (-h) + "L" + (tx + 4) + " " + (-h) + "C" + (tx * .6 + 5) + " " + (-h * .75) + " 7 " + (-h * .4) + ' 9 0Z" fill="#12052a"/><g transform="translate(' + tx + " " + (-h) + ')"><path d="' + fr + '" fill="#12052a"/><circle r="6" fill="#12052a"/></g></g></g>';
    }
    function gull(y, sc, dur, dl, dir, fl) {
      var w = '<g class="gbob" style="animation-duration:' + (2.4 + (dur % 3)) + 's"><g class="gw gl" style="animation-duration:' + fl + 's"><path d="M0 0C-5 -7 -14 -10 -24 -5C-15 -4 -7 -1 0 2Z" fill="#fff"/><path d="M-24 -5C-20 -5 -17 -4 -14 -3L-18 -1Z" fill="#3a2a5a"/></g><g class="gw gr" style="animation-duration:' + fl + 's"><path d="M0 0C5 -7 14 -10 24 -5C15 -4 7 -1 0 2Z" fill="#fff"/><path d="M24 -5C20 -5 17 -4 14 -3L18 -1Z" fill="#3a2a5a"/></g><ellipse cx="0" cy="1.2" rx="5" ry="1.9" fill="#fff"/><circle cx="5.2" cy="0.6" r="1.5" fill="#fff"/><path d="M6.5 0.3L9 1L6.5 1.4Z" fill="#ffb02e"/><path d="M-4.6 1.4L-8 2.6L-4 2.3Z" fill="#e8e0f0"/></g>';
      return '<g transform="translate(0 ' + y + ')"><g class="' + (dir > 0 ? "gfl" : "gfr") + '" style="animation-duration:' + dur + 's;animation-delay:' + dl + 's"><g transform="scale(' + (dir > 0 ? sc : -sc) + " " + sc + ')">' + w + '</g></g></g>';
    }
    var refl = ""; for (var i = 0; i < 13; i++) { var yy = 484 + i * 12.5, ww = 14 + i * 7.5; refl += '<ellipse class="brf" style="transform-origin:200px ' + yy + 'px;animation-delay:' + (i * .23).toFixed(2) + 's;animation-duration:' + (1.6 + (i % 3) * .5) + 's" cx="200" cy="' + yy + '" rx="' + ww + '" ry="' + (1.6 + i * .12).toFixed(2) + '" fill="#ffe49a" fill-opacity="' + (0.75 - i * 0.04).toFixed(2) + '"/>'; }
    var st = ""; [[40, 40], [90, 90], [150, 30], [250, 60], [320, 36], [360, 110], [60, 150], [300, 140], [220, 22]].forEach(function (q, k) { st += '<circle class="btw" style="animation-delay:' + (k * .4) + 's" cx="' + q[0] + '" cy="' + q[1] + '" r="' + (k % 2 ? 1 : 1.5) + '" fill="#fff"/>'; });
    return { bg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs>'
      + '<linearGradient id="bsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14064a"/><stop offset=".28" stop-color="#4a1490"/><stop offset=".48" stop-color="#b8208a"/><stop offset=".58" stop-color="#ff5a7a"/><stop offset=".63" stop-color="#ffa060"/></linearGradient>'
      + '<radialGradient id="bsn" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffd25a"/><stop offset="1" stop-color="#ff8a3a"/></radialGradient>'
      + '<radialGradient id="bgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd890" stop-opacity=".9"/><stop offset=".45" stop-color="#ff7a6a" stop-opacity=".35"/><stop offset="1" stop-color="#ff2e93" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="bse" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a7a"/><stop offset=".25" stop-color="#d0408e"/><stop offset=".7" stop-color="#5a2aa0"/><stop offset="1" stop-color="#1c1070"/></linearGradient>'
      + '<linearGradient id="bsd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9a0"/><stop offset=".25" stop-color="#e08a8a"/><stop offset=".7" stop-color="#7a3a7a"/><stop offset="1" stop-color="#2a1050"/></linearGradient>'
      + '<linearGradient id="bsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0420" stop-opacity="0"/><stop offset="1" stop-color="#0c0420" stop-opacity=".62"/></linearGradient>'
      + '<linearGradient id="bcl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0e0" stop-opacity=".85"/><stop offset="1" stop-color="#b04aa0" stop-opacity=".5"/></linearGradient>'
      + '</defs><rect width="400" height="800" fill="url(#bsk)"/>' + st
      + '<g class="bcd" style="animation-duration:46s"><ellipse cx="90" cy="330" rx="86" ry="9" fill="url(#bcl)"/><ellipse cx="130" cy="319" rx="52" ry="7" fill="url(#bcl)"/></g><g class="bcd" style="animation-duration:60s;animation-delay:-20s"><ellipse cx="300" cy="400" rx="96" ry="8" fill="url(#bcl)"/><ellipse cx="270" cy="390" rx="56" ry="6" fill="url(#bcl)"/></g><g class="bcd" style="animation-duration:52s;animation-delay:-34s"><ellipse cx="200" cy="260" rx="70" ry="6" fill="url(#bcl)"/></g>'
      + '<g transform="translate(0 78)"><circle class="bsg" cx="200" cy="470" r="150" fill="url(#bgl)"/><circle cx="200" cy="470" r="52" fill="url(#bsn)"/>'
      + '<rect x="0" y="470" width="400" height="190" fill="url(#bse)"/>' + refl
      + wave(500, 3, "rgba(255,170,150,.22)", "w1", 11) + wave(540, 5, "rgba(120,60,170,.28)", "w2", 8) + wave(580, 7, "rgba(40,200,200,.16)", "w3", 6.2) + wave(615, 9, "rgba(255,255,255,.1)", "w4", 4.8)
      + '<path d="M0 650Q50 640 100 650T200 650T300 650T400 650V800H0Z" fill="url(#bsd)"/>'
      + '<g class="bfm"><path d="M-10 648Q40 636 100 648T220 648T340 648T460 648" stroke="#fff" stroke-width="3" fill="none" stroke-opacity=".85" stroke-linecap="round"/><path d="M-10 656Q50 646 110 656T230 656T350 656T470 656" stroke="#ffe9f4" stroke-width="1.6" fill="none" stroke-opacity=".6" stroke-linecap="round"/></g>'
      + '<ellipse cx="200" cy="700" rx="150" ry="14" fill="#ffd0a0" fill-opacity=".16"/></g>'
      + palm(34, 810, 330, 90, 1.3, 0) + palm(384, 812, 270, -70, 1.05, -2.2) + palm(-6, 812, 190, 46, .9, -1)
      + '<rect y="500" width="400" height="300" fill="url(#bsh)"/></svg>', fg: gull(96, .7, 26, -6, 1, .62) + gull(170, 1, 19, -12, -1, .5) + gull(322, 1.15, 15, -9, -1, .46) };
  }
  var MX_SC = [null,
    { sky: ["#06031a", "#120840", "#27106c", "#46188a"], hz: "#7a3cc4", body: { t: "moon", x: 292, y: 118, r: 30, c: "#e8eaff", g: "#8f86ff" }, st: 46, win: ["#7ad7ff", "#ffd27a", "#ff7ac0"], sea: ["#241080", "#0a0630"], far: "#1a0c4e", near: "#0b0524", ref: "#cfd2ff", cl: 2 },
    { sky: ["#10043a", "#380a6a", "#8a1a8a", "#e0307a"], hz: "#ff4fa3", body: null, st: 22, win: ["#ff2e93", "#25d9c5", "#ffd27a"], sea: ["#5a0a7a", "#14053a"], far: "#3a0c5e", near: "#12052a", ref: "#ff7ac0", cl: 2, neon: 1 },
    { sky: ["#240a58", "#6a1a9a", "#dc3c80", "#ff8a6a"], hz: "#ffb070", body: { t: "sun", x: 210, y: 548, r: 40, c: "#ffd890", g: "#ff7a6a" }, st: 8, win: ["#ffd27a", "#ff9ac8", "#ffffff"], sea: ["#c0407a", "#3a1070"], far: "#5a1a6e", near: "#1a0836", ref: "#ffd890", cl: 3 },
    { sky: ["#34085a", "#a81c8a", "#ff6258", "#ffb060"], hz: "#ffc880", body: { t: "sun", x: 126, y: 548, r: 58, c: "#ffe29a", g: "#ff8a4a" }, st: 0, win: ["#ffe29a", "#ffffff", "#ffb02e"], sea: ["#e8608a", "#4a1a7a"], far: "#7a2a7a", near: "#2a0c3a", ref: "#ffe29a", cl: 3 },
    { sky: ["#4a1a6a", "#c83c80", "#ffa860", "#ffe49a"], hz: "#fff0b0", body: { t: "sun", x: 276, y: 546, r: 66, c: "#fffbe0", g: "#ffc060" }, st: 0, win: ["#fff0b0", "#ffffff", "#ffc060"], sea: ["#ffa070", "#6a2a8a"], far: "#a04a7a", near: "#3a1240", ref: "#fff0b0", cl: 2 }];
  var mxScCache = {};
  function mxSceneEl(L) {
    var c = mxScCache[L]; if (!c) { var r = mxSceneSvg(L); c = mxScCache[L] = { u: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.bg), f: r.fg }; }
    var d = mk("div", "mx-pkbeach"), im = new Image(); im.alt = ""; im.decoding = "async"; im.src = c.u; d.appendChild(im);
    if (c.f) { var f = mk("div", "fg"); f.innerHTML = '<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + c.f + "</svg>"; d.appendChild(f); }
    return d;
  }
  function mxSceneSvg(L) {
    if (L >= 6) return mxBeachSvg();
    var S = MX_SC[L], FG = "", sd = 7 + L * 13; function rnd() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs>'
      + '<linearGradient id="sk' + L + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.sky[0] + '"/><stop offset=".3" stop-color="' + S.sky[1] + '"/><stop offset=".52" stop-color="' + S.sky[2] + '"/><stop offset=".72" stop-color="' + S.sky[3] + '"/></linearGradient>'
      + '<linearGradient id="se' + L + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.sea[0] + '"/><stop offset="1" stop-color="' + S.sea[1] + '"/></linearGradient>'
      + '<radialGradient id="sg' + L + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + S.hz + '" stop-opacity=".85"/><stop offset="1" stop-color="' + S.hz + '" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="hz' + L + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.hz + '" stop-opacity="0"/><stop offset="1" stop-color="' + S.hz + '" stop-opacity=".34"/></linearGradient>'
      + '<linearGradient id="ss' + L + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0420" stop-opacity="0"/><stop offset="1" stop-color="#0c0420" stop-opacity=".66"/></linearGradient></defs>'
      + '<rect width="400" height="800" fill="url(#sk' + L + ')"/><ellipse cx="200" cy="560" rx="260" ry="150" fill="url(#sg' + L + ')"/>';
    for (var i = 0; i < S.st; i++) o += '<circle class="btw" style="animation-delay:' + (rnd() * 3).toFixed(1) + 's" cx="' + (rnd() * 400).toFixed(0) + '" cy="' + (rnd() * 330).toFixed(0) + '" r="' + (0.7 + rnd() * 1.1).toFixed(1) + '" fill="#fff"/>';
    if (S.cl) { for (i = 0; i < S.cl; i++) o += '<g class="bcd" style="animation-duration:' + (44 + i * 9) + 's;animation-delay:-' + (i * 15) + 's"><ellipse cx="' + (70 + i * 130) + '" cy="' + (300 + i * 46) + '" rx="' + (70 + rnd() * 30) + '" ry="7" fill="' + S.hz + '" fill-opacity=".5"/><ellipse cx="' + (100 + i * 130) + '" cy="' + (291 + i * 46) + '" rx="44" ry="6" fill="' + S.hz + '" fill-opacity=".4"/></g>'; }
    /* bruma del horizonte y haces de luz */
    o += '<rect y="430" width="400" height="140" fill="url(#hz' + L + ')"/>';
    if (L === 1) o += '<g transform="rotate(-24 200 190)"><ellipse cx="200" cy="190" rx="330" ry="34" fill="#7a6cff" fill-opacity=".07"/><ellipse cx="200" cy="190" rx="250" ry="16" fill="#b8b0ff" fill-opacity=".06"/></g>';
    if (L === 1) for (i = 0; i < 9; i++) { var qx = 24 + rnd() * 352, qy = 30 + rnd() * 250, qs = 3 + rnd() * 3; o += '<path class="btw" style="animation-delay:' + (rnd() * 3).toFixed(1) + 's" d="M' + qx.toFixed(0) + " " + (qy - qs).toFixed(0) + "L" + (qx + qs * .28).toFixed(1) + " " + (qy - qs * .28).toFixed(1) + "L" + (qx + qs).toFixed(0) + " " + qy.toFixed(0) + "L" + (qx + qs * .28).toFixed(1) + " " + (qy + qs * .28).toFixed(1) + "L" + qx.toFixed(0) + " " + (qy + qs).toFixed(0) + "L" + (qx - qs * .28).toFixed(1) + " " + (qy + qs * .28).toFixed(1) + "L" + (qx - qs).toFixed(0) + " " + qy.toFixed(0) + "L" + (qx - qs * .28).toFixed(1) + " " + (qy - qs * .28).toFixed(1) + 'Z" fill="#dfe2ff" fill-opacity=".85"/>'; }
    var b = S.body;
    if (b) { o += (b.t === "moon" ? "" : '<circle cx="' + b.x + '" cy="' + b.y + '" r="' + (b.r * 2.6) + '" fill="' + b.g + '" fill-opacity=".22"/><circle class="bsg" style="transform-origin:' + b.x + 'px ' + b.y + 'px" cx="' + b.x + '" cy="' + b.y + '" r="' + (b.r * 1.6) + '" fill="' + b.g + '" fill-opacity=".3"/>') + '<circle cx="' + b.x + '" cy="' + b.y + '" r="' + b.r + '" fill="' + b.c + '"/>'; if (b.t === "sun") { var ry = ""; for (i = 0; i < 9; i++) { var an = (-168 + i * 19.5) * Math.PI / 180; ry += "M" + b.x + " " + b.y + "L" + (b.x + Math.cos(an - .022) * 520).toFixed(0) + " " + (b.y + Math.sin(an - .022) * 520).toFixed(0) + "L" + (b.x + Math.cos(an + .022) * 520).toFixed(0) + " " + (b.y + Math.sin(an + .022) * 520).toFixed(0) + "Z"; } o += '<path d="' + ry + '" fill="' + b.c + '" fill-opacity=".07"/><clipPath id="sc' + L + '"><circle cx="' + b.x + '" cy="' + b.y + '" r="' + b.r + '"/></clipPath><g clip-path="url(#sc' + L + ')" fill="' + S.sky[3] + '">'; for (i = 0; i < 4; i++) o += '<rect x="' + (b.x - b.r) + '" y="' + (b.y - b.r * .42 + i * b.r * .2).toFixed(1) + '" width="' + (b.r * 2) + '" height="' + (1.2 + i * 1.5).toFixed(1) + '"/>'; o += '</g>'; } if (b.t === "moon") o += '<radialGradient id="mn' + L + '" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e4e6ff"/><stop offset="1" stop-color="#a9aef0"/></radialGradient><circle cx="' + b.x + '" cy="' + b.y + '" r="' + b.r + '" fill="url(#mn' + L + ')"/><g fill="#9aa0e0" fill-opacity=".45"><circle cx="' + (b.x - 9) + '" cy="' + (b.y - 7) + '" r="6"/><circle cx="' + (b.x + 10) + '" cy="' + (b.y + 9) + '" r="4.4"/><circle cx="' + (b.x - 3) + '" cy="' + (b.y + 13) + '" r="2.8"/><circle cx="' + (b.x + 12) + '" cy="' + (b.y - 11) + '" r="2.2"/></g><path d="M' + b.x + " " + (b.y - b.r) + "A" + b.r + " " + b.r + " 0 0 0 " + b.x + " " + (b.y + b.r) + "A" + (b.r * .86) + " " + b.r + " 0 0 1 " + b.x + " " + (b.y - b.r) + 'Z" fill="#6a6ed0" fill-opacity=".28"/><circle cx="' + b.x + '" cy="' + b.y + '" r="' + (b.r - .6) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>'; }
    function skyline(base, minH, maxH, fill, wins, alpha) {
      var x = -10, g = '<g fill="' + fill + '"' + (alpha ? ' fill-opacity="' + alpha + '"' : '') + '>', w = '', ant = '';
      while (x < 410) { var bw = 18 + rnd() * 30, bh = minH + rnd() * (maxH - minH); g += '<rect x="' + x.toFixed(0) + '" y="' + (base - bh).toFixed(0) + '" width="' + bw.toFixed(0) + '" height="' + (bh + 2).toFixed(0) + '"/>';
        if (rnd() < .3) { g += '<rect x="' + (x + bw / 2 - 1.5).toFixed(0) + '" y="' + (base - bh - 14).toFixed(0) + '" width="3" height="14"/>'; if (wins) ant += '<circle class="sbl" style="animation-delay:' + (rnd() * 2).toFixed(1) + 's" cx="' + (x + bw / 2).toFixed(0) + '" cy="' + (base - bh - 15).toFixed(0) + '" r="1.6" fill="#ff3a4a"/>'; }
        if (wins) for (var wy = base - bh + 6; wy < base - 4; wy += 7) for (var wx = x + 4; wx < x + bw - 4; wx += 6) if (rnd() < .42) w += '<rect' + (rnd() < .12 ? ' class="mxtw" style="animation-delay:' + (rnd() * 4).toFixed(1) + 's"' : '') + ' x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="2.6" height="3.2" fill="' + S.win[Math.floor(rnd() * S.win.length)] + '" fill-opacity="' + (0.55 + rnd() * .45).toFixed(2) + '"/>';
        x += bw + rnd() * 3; }
      return g + '</g>' + w + ant;
    }
    o += skyline(566, 22, 80, S.far, false, .85) + skyline(566, 14, 110, S.near, true, 0);
    if (S.neon) [[40, 470, "#ff2e93"], [150, 450, "#25d9c5"], [262, 480, "#ff2e93"], [350, 456, "#ffd27a"]].forEach(function (q, k) { o += '<g class="sn" style="animation-delay:' + (k * .7) + 's"><rect x="' + q[0] + '" y="' + q[1] + '" width="22" height="7" rx="2" fill="' + q[2] + '"/><rect x="' + (q[0] - 3) + '" y="' + (q[1] - 3) + '" width="28" height="13" rx="4" fill="' + q[2] + '" fill-opacity=".28"/></g>'; });
    o += '<rect x="0" y="566" width="400" height="124" fill="url(#se' + L + ')"/>';
    if (b) { for (i = 0; i < 12; i++) { var yy = 574 + i * 9.5, ww = (b.r * 0.35) + i * (b.r * 0.12); o += '<ellipse class="brf" style="transform-origin:' + b.x + 'px ' + yy + 'px;animation-delay:' + (i * .23).toFixed(2) + 's;animation-duration:' + (1.6 + (i % 3) * .5) + 's" cx="' + b.x + '" cy="' + yy + '" rx="' + ww.toFixed(0) + '" ry="1.5" fill="' + S.ref + '" fill-opacity="' + (0.75 - i * .05).toFixed(2) + '"/>'; } }
    else for (i = 0; i < 14; i++) o += '<rect class="brf" style="transform-origin:' + (30 + rnd() * 340).toFixed(0) + 'px 600px;animation-delay:' + (rnd() * 2).toFixed(1) + 's;animation-duration:' + (1.8 + rnd() * 1.5).toFixed(1) + 's" x="' + (30 + rnd() * 340).toFixed(0) + '" y="' + (574 + rnd() * 100).toFixed(0) + '" width="' + (10 + rnd() * 26).toFixed(0) + '" height="1.6" fill="' + S.win[i % 3] + '" fill-opacity=".6"/>';
    o += '<path class="bw w2" style="animation-duration:9s" d="M0 600' + "q50 -4 100 0q50 4 100 0".repeat(1) + "q50 -4 100 0q50 4 100 0".repeat(7) + 'V690H0Z" fill="rgba(255,255,255,.06)"/>';
    o += '<rect x="0" y="690" width="400" height="110" fill="#10052a"/><path d="M0 690H400" stroke="' + S.hz + '" stroke-opacity=".6" stroke-width="1.4"/>';
    for (i = 0; i < 6; i++) { var lx = 30 + i * 68; o += '<rect x="' + (lx - 1) + '" y="662" width="2" height="30" fill="#0a0318"/><circle class="mxtw" style="animation-delay:' + (i * .5) + 's" cx="' + lx + '" cy="660" r="3" fill="' + S.win[i % 2] + '"/><circle cx="' + lx + '" cy="660" r="9" fill="' + S.win[i % 2] + '" fill-opacity=".22"/>'; }
    function palm(x, y, h, lean, sc) {
      var fr = ""; [[-176, 50], [-150, 62], [-120, 54], [-92, 44], [-62, 56], [-32, 62], [-4, 52], [20, 42], [162, 42]].forEach(function (q) { var r = q[0] * Math.PI / 180, Lq = q[1] * sc, c = Math.cos(r), sn = Math.sin(r); fr += "M0 0Q" + (Lq * .55 * c - sn * 7).toFixed(1) + " " + (Lq * .55 * sn - Lq * .3 + c * 7).toFixed(1) + " " + (Lq * c).toFixed(1) + " " + (Lq * sn + Lq * .46).toFixed(1) + "Q" + (Lq * .55 * c + sn * 7).toFixed(1) + " " + (Lq * .55 * sn - Lq * .3 - c * 7 + 7).toFixed(1) + " 0 0Z"; });
      return '<g transform="translate(' + x + " " + y + ')"><g class="bpm" style="transform-origin:0 0"><path d="M-5 0C-3 ' + (-h * .4) + " " + (lean * .5) + " " + (-h * .75) + " " + (lean - 2) + " " + (-h) + "L" + (lean + 3) + " " + (-h) + "C" + (lean * .6 + 4) + " " + (-h * .75) + " 5 " + (-h * .4) + ' 7 0Z" fill="#0a0318"/><g transform="translate(' + lean + " " + (-h) + ')"><path d="' + fr + '" fill="#0a0318"/></g></g></g>';
    }
    o += palm(26, 806, 250, 56, 1.15) + palm(380, 806, 210, -48, 1) + palm(70, 806, 120, 24, .8);
    return { bg: o + '<rect y="520" width="400" height="280" fill="url(#ss' + L + ')"/></svg>', fg: FG };
  }
  function mxCount(el, to, calm, pre) { if (calm) { el.textContent = pre + fmtMx(to); return; } var t0 = performance.now(), d = 800; (function f(t) { var k = Math.min(1, (t - t0) / d); el.textContent = pre + fmtMx(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); })(t0); }
  function mxPkOpenUi(idx) {
    var m = getMax(), l = mxPkList(m), pk = l[idx]; if (!pk || mxPkBusy) return; mxPkBusy = true;
    var TP = pk.mx || MX_PK.taps, calm = calmOn(), tms = [], ov = mk("div", "mx-pko"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", pk.mi ? "Sobre mítico" : "Sobre de la suerte"); if (pk.mi) { ov.setAttribute("data-mi", "1"); ov.appendChild(mk("p", "mx-pkmi", "MÍTICO · " + MX_MI_FP + " % de marco")); }
    function later(f, ms) { if (calm) ms = Math.min(ms, 80); tms.push(setTimeout(f, ms)); }
    var scn = null, scL = 0; function theme() { var t = pk.mi ? MX_MI : MX_PT[pk.s]; ov.style.setProperty("--bg", t.bg); ov.style.setProperty("--gl", t.gl); ov.setAttribute("data-s", pk.s); if (scL !== pk.s) { var old = scn; scL = pk.s; scn = mxSceneEl(pk.s); ov.insertBefore(scn, ov.firstChild); void scn.offsetWidth; scn.classList.add("on"); if (old) { old.classList.remove("on"); later(function () { old.remove(); }, 1400); } } }
    function chance() { return pk.s < 6 ? MX_PK.tiers[pk.s].up : 0; }
    var fx = mk("div", "mx-pkfx"); fx.innerHTML = '<i class="hl"></i>'; ov.appendChild(fx);
    var top = mk("div", "mx-pkt"), x = mk("button", "mx-pkx", "✕"); x.type = "button"; x.setAttribute("aria-label", "Cerrar"); top.appendChild(x); ov.appendChild(top);
    var sdf = mk("div"); sdf.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="pkStG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b8"/><stop offset=".5" stop-color="#ffc93c"/><stop offset="1" stop-color="#f08a1c"/></linearGradient></defs></svg>'; ov.appendChild(sdf.firstChild);
    var sr = mk("div", "mx-pks"); for (var i = 0; i < 6; i++) { var si = mk("i"); si.style.setProperty("--n", i); si.innerHTML = '<svg viewBox="0 0 24 24"><polygon class="b" points="' + STAR_P + '"/><polygon class="hi" points="' + STAR_P + '" transform="translate(12 12.3) scale(.5) translate(-12 -12)"/></svg>'; sr.appendChild(si); } ov.appendChild(sr);
    var art = mk("button", "mx-pka"); art.type = "button"; art.setAttribute("aria-label", "Tocar el sobre para mejorarlo"); ov.appendChild(art);
    var hint = mk("p", "mx-pkh"), ct = mk("div", "mx-pkd"), acts = mk("div", "mx-pkac"), bo = mk("button");
    for (var di = 0; di < TP; di++) ct.appendChild(el("i")); ov.appendChild(hint); ov.appendChild(ct); ov.appendChild(acts); $("max").appendChild(ov); $("max").classList.add("pkopen");
    function sparks(host) { if (calm) return; var c = mk("span", "mx-stp"); for (var q = 0; q < 8; q++) { var b = el("b"), an = (q / 8) * 6.2832 + rand01() * .6, dd = 28 + rand01() * 26; b.style.setProperty("--x", Math.round(Math.cos(an) * dd) + "px"); b.style.setProperty("--y", Math.round(Math.sin(an) * dd) + "px"); if (q % 2) b.style.width = b.style.height = "5px"; c.appendChild(b); } host.appendChild(c); later(function () { c.remove(); }, 900); }
    function drawStars(prev) { sr.classList.toggle("full", pk.s === 6); for (var k = 0; k < 6; k++) { sr.children[k].className = k < pk.s ? "on" : ""; if (prev !== undefined && k >= prev && k < pk.s) { sr.children[k].classList.add("stn"); sparks(sr.children[k]); (function (n) { later(function () { n.classList.remove("stn"); }, 900); })(sr.children[k]); } } }
    function drawArt() { art.innerHTML = mxPkSvg(pk.s, pk.mi ? "mi" : ""); }
    function drawCt() { var left = TP - pk.t; for (var k = 0; k < ct.children.length; k++) ct.children[k].className = k < pk.t ? "on" : ""; if (left <= 0) art.disabled = true; }
    function draw() { theme(); drawStars(); drawArt(); drawCt(); }
    function burst(n, big) { if (calm) return; var c = mk("div", "mx-pkbs"); for (var k = 0; k < n; k++) { var p = mk("i"), an = rand01() * 6.2832, dd = (big ? 130 : 90) + rand01() * (big ? 150 : 90), sz = (big ? .8 : .6) + rand01() * .9; p.style.setProperty("--x", Math.round(Math.cos(an) * dd) + "px"); p.style.setProperty("--y", Math.round(Math.sin(an) * dd) + "px"); p.style.setProperty("--k", sz.toFixed(2)); p.style.animationDelay = (rand01() * .12).toFixed(2) + "s"; c.appendChild(p); } ov.appendChild(c); later(function () { c.remove(); }, 1200); }
    function flash(kind) { burst(kind === "big" ? 22 : 11, kind === "big"); var e = mk("div", "mx-pkup " + kind); ov.appendChild(e); later(function () { e.remove(); }, 900); }
    function tap() {
      if (pk.t >= TP || ov.classList.contains("opening")) return;
      var before = pk.s; pk.t++; var up = pk.s < 6 && rand01() < chance(); if (up) pk.s++; maxSave();
      try { if (navigator.vibrate) navigator.vibrate(up ? [18, 30, 28] : 12); } catch (e) { }
      var sv = art.firstChild; if (sv) { sv.classList.remove("tp", "pop"); void sv.getBoundingClientRect(); sv.classList.add("tp"); sv.addEventListener("animationend", function ae(ev) { if (ev.target === sv && ev.animationName === "mxpks") { sv.classList.remove("tp"); sv.removeEventListener("animationend", ae); } }); }
      if (up) later(function () { flash("up"); theme(); drawStars(before); drawArt(); var sv2 = art.firstChild; if (sv2) { sv2.classList.remove("tp"); sv2.classList.add("pop"); sv2.addEventListener("animationend", function ae2(ev) { if (ev.target === sv2 && ev.animationName === "mxpkp") { sv2.classList.remove("pop"); sv2.removeEventListener("animationend", ae2); } }); } drawCt(); }, calm ? 0 : 380);
      else later(drawCt, calm ? 0 : 380);
      if (pk.t >= TP) later(openNow, up ? 1700 : 1000);
    }
    function close() { tms.forEach(clearTimeout); ov.remove(); $("max").classList.remove("pkopen"); mxPkBusy = false; mxRender(); }
    art.addEventListener("click", tap); x.addEventListener("click", close);
    var openNow = function () {
      if (ov.classList.contains("opening")) return; ov.classList.add("opening"); art.disabled = true; bo.disabled = true; hint.textContent = ""; ct.textContent = "";
      var sv = art.firstChild; if (sv) { sv.classList.remove("tp", "pop"); sv.classList.add("go"); }
      later(function () { if (sv) sv.classList.add("brs"); flash("big"); }, 1100);
      later(function () {
        var t = MX_PK.tiers[pk.s], mm = getMax(), ll = mxPkList(mm), at = ll.indexOf(pk);
        if (at < 0) { close(); return; } ll.splice(at, 1); mm.pk.n = (mm.pk.n || 0) + 1;
        var hit = !mm.inv.gta6 && rand01() * 100 < (pk.mi ? MX_MI_FP : t.fp); if (hit) { mm.inv.gta6 = Date.now(); mm.eq.frame = "gta6"; }
        var pinGot = null, pinDup = false;
        if (MX_PIN.ch[pk.s] && rand01() * 100 < MX_PIN.ch[pk.s]) { pinGot = mxPinPick(); if (!mm.pins) mm.pins = {}; if (mm.pins[pinGot]) pinDup = true; else mm.pins[pinGot] = Date.now(); }
        if (!pinGot) { mxSxAdd(mm, t.sx, true); grantXp(t.xp, t.st); }
        maxSave(); $("mxBal").textContent = "⭐ " + fmtMx(getMax().stars);
        art.remove(); acts.textContent = ""; sr.classList.add("big"); fx.classList.add("rv");
        var h = mk("h2"), rw = mk("div", "mx-pkrw"), cnt = [];
        if (hit) { h.textContent = "¡MARCO EXCLUSIVO CONSEGUIDO!"; h.className = "mx-evx"; var pw = mk("div", "mx-pkw"), pa = mk("span", "mx-fpa"); paintAvatar(pa, getProfile()); pw.appendChild(pa); ov.insertBefore(pw, hint); frApply(pw, pa, "gta6", 100); }
        else if (pinGot) { h.textContent = pinDup ? "Pin repetido" : "¡Pin nuevo!"; if (!pinDup) h.className = "mx-evx"; }
        else h.textContent = pk.s + (pk.s === 1 ? " estrella" : " estrellas");
        ov.insertBefore(h, hint);
        if (pinGot) {
          /* el pin es el premio principal: grande, al centro y con el color de su rareza */
          var pd = mxPinById(pinGot), pcol = MX_PCOL[pd.r] || "#ffd25a", sh = mk("div", "mx-pkpn" + (hit ? " sm" : ""));
          sh.style.setProperty("--c", pcol);
          sh.innerHTML = '<i class="rays"></i><i class="ring"></i><span class="art">' + pinSvg(pinGot, hit ? 104 : 144) + '</span><i class="sp a"></i><i class="sp b"></i><i class="sp c"></i><i class="sp d"></i>';
          var pnm = mk("b", "mx-pkpnn", pd.n), pch = mk("span", "mx-pkpnr", pd.r); pch.style.setProperty("--c", pcol);
          ov.insertBefore(sh, hint); ov.insertBefore(pnm, hint); ov.insertBefore(pch, hint);
          if (pinDup) ov.insertBefore(mk("span", "mx-pkpnd", "Ya lo tenías en tu colección"), hint);
        } else {
          ov.insertBefore(rw, hint);
          var rows = [["st", "⭐", t.st, "Estrellas"], ["xp", "XP", t.xp, "Experiencia"], ["sx", "", t.sx, "Puntos SEIS"]];
          rows.forEach(function (r, k) { var row = mk("div", "rr " + r[0]); row.style.animationDelay = (calm ? 0 : k * 0.22) + "s"; var ic = mk("span", "ic"); if (r[0] === "sx") ic.innerHTML = sixIco(26); else ic.textContent = r[1]; var tx = mk("div", "tx"), n = mk("b", "n", "+0"); tx.appendChild(n); tx.appendChild(mk("small", null, r[3])); row.appendChild(ic); row.appendChild(tx); rw.appendChild(row); cnt.push([n, r[2]]); });
        }
        later(function () { cnt.forEach(function (c) { mxCount(c[0], c[1], calm, "+"); }); }, 150);
        var more = mxPkList(getMax()).length, b1 = mk("button", "mx-btn mx-pkb", more ? "Siguiente sobre (" + more + ")" : "Cerrar"), b2 = mk("button", "mx-btn", "Cerrar"); b1.type = b2.type = "button"; acts.appendChild(b1); if (more) acts.appendChild(b2);
        b1.addEventListener("click", function () { if (more) { ov.remove(); $("max").classList.remove("pkopen"); mxPkBusy = false; mxPkOpenUi(0); } else close(); }); b2.addEventListener("click", close);
      }, 1700);
    };
    draw();
    if (pk.t >= TP) later(openNow, 700);
  }
  function mxLvClaim(k) {
    var m = getMax(), lv = MX_LV[k]; if (m.bk || mxLvDone(m) !== k || k >= mxLvReached(m)) return;
    if (lv.s && mxPkList(m).length >= 60) { toast("Tenés 60 sobres guardados: abrí alguno para reclamar"); return; }
    mxSx(m).lc = k + 1;
    if (lv.l) { m.inv["led_" + lv.l] = Date.now(); m.eq.led = lv.l; toast("Nivel " + (k + 1) + ": Luz Vice conseguida"); try { renderProfile(); renderMenu(); } catch (e) { } }
    else if (lv.s) { mxPkGiveS(lv.s, lv.mx); toast("Nivel " + (k + 1) + ": sobre de " + lv.s + (lv.s === 1 ? " estrella" : " estrellas") + (lv.mx ? " especial" : "")); }
    else { mxSxAdd(m, lv.x, false); maxSave(); toast("Nivel " + (k + 1) + ": +" + lv.x + " puntos SEIS"); }
    maxSave(); mxRender();
  }
  function mxEvShop(box, m, test) {
    var x = mxSx(m), g = mxLvProg(m), rch = mxLvReached(m), dn = mxLvDone(m);
    var bal = mk("div", "mx-card mx-sxb"), ic = mk("div", "ic"); ic.innerHTML = sixIco(44); bal.appendChild(ic);
    var tx = mk("div", "tx"); tx.appendChild(mk("small", null, "Tus puntos SEIS")); tx.appendChild(mk("b", null, fmtMx(x.p || 0))); bal.appendChild(tx); box.appendChild(bal);
    var lc = mk("div", "mx-card"); lc.appendChild(mk("b", null, "Camino SEIS · Nivel " + rch + " / " + MX_LV.length));
    var lo = rch ? MX_LV[rch - 1].n : 0, hi = rch < MX_LV.length ? MX_LV[rch].n : lo;
    var pb = mk("div", "mx-pb"), pi = el("i"); pi.style.width = (rch >= MX_LV.length ? 100 : Math.round((g - lo) / (hi - lo) * 100)) + "%"; pb.appendChild(pi); lc.appendChild(pb);
    lc.appendChild(mk("p", "mx-note", (rch >= MX_LV.length ? "¡Completaste todos los niveles! " : "Llevás " + fmtMx(g) + " puntos · faltan " + fmtMx(hi - g) + " para el nivel " + (rch + 1) + ". ") + "Solo suman los puntos SEIS de misiones y sobres; los que te dan los niveles no cuentan."));
    MX_LV.forEach(function (lv, k) {
      var st = k < dn ? "ok" : k < rch ? "rdy" : "", row = mk("div", "mx-lv " + st); row.appendChild(mk("span", "n", String(k + 1)));
      var t = mk("div", "t"); t.appendChild(mk("b", null, lv.l ? "Luz Vice" : lv.s ? "Sobre de " + lv.s + (lv.s === 1 ? " estrella" : " estrellas") + (lv.mx ? " especial" : "") : lv.x + " puntos SEIS")); t.appendChild(mk("small", null, lv.l ? "Necesitás " + lv.n + " · luz para tu nombre" : lv.mx ? "Necesitás " + lv.n + " · solo " + lv.mx + " toques para mejorarlo" : "Necesitás " + lv.n + " puntos")); row.appendChild(t);
      if (k < dn) row.appendChild(mk("span", "dn", "✓ Reclamado"));
      else { var bt = mk("button", "mx-btn", "Reclamar"); bt.type = "button"; bt.disabled = test || k !== dn || k >= rch; bt.addEventListener("click", function () { mxLvClaim(k); }); row.appendChild(bt); }
      lc.appendChild(row);
    });
    box.appendChild(lc);
    function buy(cost, fn, label) { var mm = getMax(); if (mm.bk || mxSx(mm).p < cost) return; mxSx(mm).p -= cost; fn(mm); maxSave(); $("mxBal").textContent = "⭐ " + fmtMx(getMax().stars); toast(label); mxRender(); }
    box.appendChild(mk("div", "mx-sec", "Sobres del evento"));
    var g1 = mk("div", "mx-pkl"); MX_SHOP.packs.forEach(function (p) { var c = mk("button", "mx-pkcard"); c.type = "button"; var w = mk("div"); w.innerHTML = mxPkSvg(p.s); c.appendChild(w.firstChild); c.appendChild(mk("b", null, "Sobre de " + p.s + (p.s === 1 ? " estrella" : " estrellas"))); var pr = mk("span", "pr"); pr.innerHTML = sixIco(15) + " " + fmtMx(p.c); c.appendChild(pr); c.disabled = test || (x.p || 0) < p.c || mxPkList(m).length >= 60; c.addEventListener("click", function () { buy(p.c, function (mm) { mxPkList(mm).push({ s: p.s, t: 0 }); }, "Sobre de " + p.s + (p.s === 1 ? " estrella" : " estrellas") + " añadido"); }); g1.appendChild(c); }); box.appendChild(g1);
    box.appendChild(mk("div", "mx-sec", "Intercambios"));
    var g2 = mk("div", "mx-xch"); MX_SHOP.xch.forEach(function (p) { var c = mk("button", "mx-xc"); c.type = "button"; c.appendChild(mk("b", null, p.l)); var pr = mk("span", "pr"); pr.innerHTML = sixIco(15) + " " + fmtMx(p.c); c.appendChild(pr); c.disabled = test || (x.p || 0) < p.c; c.addEventListener("click", function () { buy(p.c, function () { grantXp(p.xp || 0, p.st || 0); }, "Intercambio hecho: " + p.l); }); g2.appendChild(c); }); box.appendChild(g2);
    box.appendChild(mk("div", "mx-sec", "Luces"));
    var ld = MX_LED.gta, lk = "led_gta", lcd = mk("div", "mx-card"), lpv = mk("div", "mx-ledp"), lnm = mk("span", null, (getProfile().name || "Explorador"));
    mxLedApply(lnm, "gta"); lpv.appendChild(lnm); lcd.appendChild(lpv); lcd.appendChild(mk("b", null, ld.n)); lcd.appendChild(mk("p", "mx-note", "Una luz neón con los colores de GTA VI en las letras de tu nombre, en el perfil y en el menú. Premio del nivel 7 del Camino SEIS."));
    var lbt = mk("button", "mx-btn"); lbt.type = "button";
    if (m.inv[lk]) { var lon = m.eq.led === "gta"; lbt.textContent = lon ? "Quitar luz" : "Equipar"; lbt.addEventListener("click", function () { m.eq.led = lon ? "" : "gta"; maxSave(); toast(lon ? "Luz quitada" : "Luz equipada"); try { renderProfile(); renderMenu(); } catch (e) { } mxRender(); }); }
    else { lbt.textContent = "Se consigue en el Camino SEIS · nivel 7"; lbt.disabled = true; }
    lcd.appendChild(lbt); box.appendChild(lcd);
    if (test) box.appendChild(mk("p", "mx-note", "Estás en modo prueba: restablecé tu nivel real para usar la tienda."));
  }
  var MX_EV_END = new Date(2026, 11, 17, 23, 59, 59, 999).getTime(), mxCdFns = [], mxCdT = 0;
  function mxCdParts() { var ms = Math.max(0, MX_EV_END - Date.now()), t = Math.floor(ms / 1000); return { end: ms <= 0, d: Math.floor(t / 86400), h: Math.floor(t % 86400 / 3600), m: Math.floor(t % 3600 / 60), s: t % 60 }; }
  function mxCdAdd(node, fn) {
    fn(); mxCdFns.push([node, fn]);
    if (!mxCdT) mxCdT = setInterval(function () {
      mxCdFns = mxCdFns.filter(function (q) { return document.body.contains(q[0]); });
      if (!mxCdFns.length) { clearInterval(mxCdT); mxCdT = 0; return; }
      if (!document.hidden) mxCdFns.forEach(function (q) { q[1](); });
    }, 1000);
  }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function mxCdBox() {
    var w = mk("div", "mx-cdw"), tt = mk("div", "mx-cdt", "El evento termina el 17 de diciembre"), g = mk("div", "mx-cd"), cells = [];
    ["días", "horas", "minutos", "segundos"].forEach(function (lb) { var c = mk("div"), n = mk("b", null, "00"); c.appendChild(n); c.appendChild(mk("span", null, lb)); g.appendChild(c); cells.push(n); });
    w.appendChild(tt); w.appendChild(g); w.setAttribute("role", "timer"); w.setAttribute("aria-label", "Tiempo restante del evento");
    mxCdAdd(w, function () { var p = mxCdParts(); tt.textContent = p.end ? "Evento finalizado" : "El evento termina el 17 de diciembre"; w.classList.toggle("end", p.end); cells[0].textContent = p.d; cells[1].textContent = two(p.h); cells[2].textContent = two(p.m); cells[3].textContent = two(p.s); });
    return w;
  }
  function mxCdLine() {
    var l = mk("div", "mx-cdl");
    mxCdAdd(l, function () { var p = mxCdParts(); l.textContent = p.end ? "Evento finalizado" : "Termina en " + p.d + " d " + two(p.h) + " h " + two(p.m) + " min " + two(p.s) + " s"; });
    return l;
  }
  /* Misiones del evento: diarias y semanales (puntos SEIS + sobre) */
  var MX_EVD = {
    e1: { n: "Escribí 6 palabras", t: 6, e: "✍️", u: "palabras", g: function (c) { return c.wordsD; } },
    e2: { n: "Escribí 66 letras", t: 66, e: "🔤", u: "letras", g: function (c) { return c.lettersD; } },
    e3: { n: "Usá el modo Enfoque durante 6 minutos", t: 6, e: "🎯", u: "minutos", g: function (c) { return c.focusD; } },
    e4: { n: "Escribí 66 palabras", t: 66, e: "📖", u: "palabras", g: function (c) { return c.wordsD; } },
    e5: { n: "Completá 1 sesión del modo Enfoque", t: 1, e: "⏱️", u: "sesión", g: function (c) { return c.sessD; } },
    e6: { n: "Tildá 6 casillas de una lista", t: 6, e: "☑️", u: "casillas", g: function (c) { return c.tasksD; } },
    e7: { n: "Editá 3 notas", t: 3, e: "✏️", u: "ediciones", g: function (c) { return c.touchD; } },
    e8: { n: "Creá 2 notas", t: 2, e: "📝", u: "notas", g: function (c) { return c.notesD; } },
    e9: { n: "Creá 6 notas", t: 6, e: "🗒️", u: "notas", g: function (c) { return c.notesD; } },
    e10: { n: "Escribí 166 palabras", t: 166, e: "📜", u: "palabras", g: function (c) { return c.wordsD; } }
  };
  var MX_EVW = {
    f1: { n: "Creá 10 notas", t: 10, e: "🗂️", u: "notas", g: function (c) { return c.notesW; } },
    f2: { n: "Escribí 1.500 palabras", t: 1500, e: "📚", u: "palabras", g: function (c) { return c.wordsW; } },
    f3: { n: "Usá el modo Enfoque durante 45 minutos", t: 45, e: "🧘", u: "minutos", g: function (c) { return c.focusW; } },
    f4: { n: "Escribí en 4 días distintos", t: 4, e: "🔥", u: "días", g: function (c) { return c.daysW; } },
    f5: { n: "Completá 3 sesiones del modo Enfoque", t: 3, e: "⏳", u: "sesiones", g: function (c) { return c.sessW; } },
    h1: { n: "Escribí 4.000 palabras", t: 4000, e: "🖋️", u: "palabras", g: function (c) { return c.wordsW; } },
    h2: { n: "Creá 20 notas", t: 20, e: "🗃️", u: "notas", g: function (c) { return c.notesW; } },
    h3: { n: "Usá el modo Enfoque durante 150 minutos", t: 150, e: "🏆", u: "minutos", g: function (c) { return c.focusW; } },
    h4: { n: "Escribí los 7 días de la semana", t: 7, e: "🌟", u: "días", g: function (c) { return c.daysW; } },
    h5: { n: "Completá 8 sesiones del modo Enfoque", t: 8, e: "🎖️", u: "sesiones", g: function (c) { return c.sessW; } },
    h6: { n: "Creá 30 notas", t: 30, e: "🏅", u: "notas", g: function (c) { return c.notesW; } }
  };
  var MX_EVR = { d: { sx: 6, s: 1, k: "Diaria", h: 0 }, f: { sx: 16, s: 2, k: "Semanal · Fácil", h: 0 }, h: { sx: 24, s: 3, k: "Semanal · Difícil", h: 1 } };
  function mxEvDaily(c) { var L = ["e4", "e5", "e6", "e7", "e8", "e9", "e10"], i = c.dn % 7; return ["e1", "e2", "e3"].concat([0, 2, 4].map(function (k) { return L[(i + k) % 7]; })); }
  function mxEvWeekly(c) {
    var w = Math.round(c.w0 / 604800000), F = ["f1", "f2", "f3", "f4", "f5"], H = ["h1", "h2", "h3", "h4", "h5", "h6"];
    return [0, 1, 3].map(function (k) { return F[(w + k) % 5]; }).concat([0, 2, 4].map(function (k) { return H[(w + k) % 6]; }));
  }
  function mxEvKey(kind, c, id) { return (kind === "d" ? "ed:" + c.dk : "ew:" + c.wk) + ":" + id; }
  function mxEvReady() {
    var c = mxCtx(), m = getMax(), n = 0; if (mxLgDue(m)) n++;
    mxEvDaily(c).forEach(function (id) { if (MX_EVD[id].g(c) >= MX_EVD[id].t && !m.cl[mxEvKey("d", c, id)]) n++; });
    mxEvWeekly(c).forEach(function (id) { if (MX_EVW[id].g(c) >= MX_EVW[id].t && !m.cl[mxEvKey("w", c, id)]) n++; });
    return n;
  }
  function mxEvClaim(key, rw) {
    var m = getMax(), l = mxPkList(m); if (m.cl[key]) return;
    if (l.length >= 60) { toast("Tenés muchos sobres guardados. Abrí alguno para poder reclamar más."); return; }
    m.cl[key] = Date.now(); mxSxAdd(m, rw.sx, true); var s = mxPkGiveS(rw.s);
    toast("+" + rw.sx + " puntos SEIS · Sobre de " + s + (s === 1 ? " estrella" : " estrellas")); mxRender();
  }
  /* sobre mítico: 6 estrellas con MX_MI_FP % de probabilidad de que salga el marco GTA VI */
  var MX_MI = { bg: "#3a0620", gl: "#ff3d6e", bd: "#ffd0dc" }, MX_MI_FP = 66;
  /* regalos por iniciar sesión durante el evento: el 6 de diciembre un sobre de 6 estrellas y el último día un sobre mítico */
  function mxEvGifts() {
    var m = getMax(), today = dayKey(Date.now()), got = [];
    if (!m.gf || typeof m.gf !== "object") m.gf = {};
    if (today === "2026-12-06" && !m.gf.a) { m.gf.a = Date.now(); mxPkList(m).push({ s: 6, t: 0 }); got.push("sobre de 6 estrellas"); }
    if (today === dayKey(MX_EV_END) && !m.gf.b) { m.gf.b = Date.now(); mxPkList(m).push({ s: 6, t: 0, mi: 1 }); got.push("sobre mítico"); }
    if (!got.length) return false;
    maxSave(); toast("Regalo del evento GTA VI: " + got.join(" y ")); if (typeof mxRender === "function" && $("max") && !$("max").hidden) mxRender();
    return true;
  }
  function mxPkGiveS(s, mx) {
    var m = getMax(), l = mxPkList(m);
    l.push(mx ? { s: s, t: 0, mx: mx } : { s: s, t: 0 }); maxSave(); return s;
  }
  function mxEvCard(d, prog, claimed, rw, onClaim) {
    var done = prog >= d.t, pct = claimed ? 100 : Math.min(100, Math.floor(prog / d.t * 100)), card = mk("div", "mx-card mx-evm" + (claimed ? " ok" : done ? " rdy" : ""));
    var top = mk("div", "mx-evm-t"); top.appendChild(mk("span", "mx-evm-e", d.e)); top.appendChild(mk("b", null, d.n)); top.appendChild(mk("em", "mx-evm-k" + (rw.h ? " h" : ""), rw.k)); card.appendChild(top);
    var pr = mk("div", "mx-evm-p"), pb = mk("div", "mx-evm-pb"), pi = el("i"); pi.style.width = pct + "%"; pb.appendChild(pi); pr.appendChild(pb); pr.appendChild(mk("span", "mx-evm-pc", pct + " %")); card.appendChild(pr);
    card.appendChild(mk("div", "mx-evm-s", claimed ? "Misión completada" : done ? "Lista para reclamar" : "Faltan " + fmtMx(d.t - prog) + " " + d.u));
    var r = mk("div", "mx-evm-r"), si = mk("span", "mx-evm-si"); si.innerHTML = sixIco(26); r.appendChild(si); r.appendChild(mk("b", null, String(rw.sx))); r.appendChild(mk("span", "pl", "+"));
    var pk = mk("span", "mx-evm-pk"); pk.innerHTML = mxPkSvg(rw.s); r.appendChild(pk); r.appendChild(mk("span", "sp"));
    if (claimed) r.appendChild(mk("span", "mx-evm-ok", "✓ Reclamada"));
    else { var bt = mk("button", "mx-evm-bt", "Reclamar"); bt.type = "button"; bt.disabled = !done; bt.addEventListener("click", onClaim); r.appendChild(bt); }
    card.appendChild(r); return card;
  }
  /* recompensa diaria del evento: una por día, ciclo de 7 días */
  var MX_LG = [{ k: "p", s: 1 }, { k: "x", n: 10 }, { k: "s", n: 100 }, { k: "e", n: 60 }, { k: "p", s: 2 }, { k: "x", n: 16 }, { k: "p", s: 4 }];
  function mxLg(m) { var o = m.lg; if (!o || typeof o !== "object" || Array.isArray(o)) o = m.lg = { d: "", i: 0, n: 0 }; o.i = Math.max(0, Math.min(6, Math.floor(+o.i || 0))); o.n = Math.max(0, Math.floor(+o.n || 0)); return o; }
  function mxLgDue(m) { return mxLg(m).d !== dayKey(Date.now()); }
  function mxLgText(r) { return r.k === "p" ? "sobre de " + r.s + (r.s === 1 ? " estrella" : " estrellas") : r.k === "x" ? r.n + " puntos SEIS" : r.k === "s" ? r.n + " estrellas" : r.n + " XP"; }
  function mxLgClaim() {
    var m = getMax(), o = mxLg(m); if (!mxLgDue(m)) return false;
    var idx = o.i, r = MX_LG[idx];
    if (r.k === "p" && mxPkList(m).length >= 60) { toast("Tenés muchos sobres guardados. Abrí alguno para poder reclamar más."); return false; }
    o.d = dayKey(Date.now()); o.i = (idx + 1) % 7; o.n++;
    var txt = mxLgText(r);
    if (r.k === "p") { var sg = mxPkGiveS(r.s); txt = "sobre de " + sg + (sg === 1 ? " estrella" : " estrellas"); }
    else if (r.k === "x") mxSxAdd(m, r.n); else if (r.k === "s") grantXp(0, r.n); else grantXp(r.n, 0);
    maxSave(); toast("Recompensa diaria · Día " + (idx + 1) + ": " + txt); mxRender(); return true;
  }
  function mxLgIcon(r) {
    var w = mk("span", "mx-lg-i");
    if (r.k === "p") w.innerHTML = mxPkSvg(r.s); else if (r.k === "x") w.innerHTML = sixIco(26); else if (r.k === "s") w.textContent = "\u2b50"; else { w.textContent = "XP"; w.classList.add("xp"); }
    return w;
  }
  function mxLgCard(m) {
    var o = mxLg(m), due = mxLgDue(m), done = due ? o.i : (o.i === 0 && o.n > 0 ? 7 : o.i), card = mk("div", "mx-card mx-lg");
    var hd = mk("div", "mx-lg-h"); hd.appendChild(mk("b", null, "Recompensa diaria")); hd.appendChild(mk("em", null, due ? "Hoy: día " + (o.i + 1) + " de 7" : "Reclamada hoy")); card.appendChild(hd);
    var gr = mk("div", "mx-lg-g");
    MX_LG.forEach(function (r, i) {
      var t = mk("div", "mx-lg-t" + (i < done ? " ok" : "") + (due && i === o.i ? " today" : "") + (i === 6 ? " big" : ""));
      t.appendChild(mk("small", null, "Día " + (i + 1))); t.appendChild(mxLgIcon(r));
      t.appendChild(mk("span", "q", r.k === "p" ? "1" === String(r.s) ? "1★" : r.s + "★" : "+" + r.n));
      if (i < done) t.appendChild(mk("i", "ck", "✓")); gr.appendChild(t);
    });
    card.appendChild(gr);
    if (due) { var bt = mk("button", "mx-btn", "Reclamar: " + mxLgText(MX_LG[o.i])); bt.type = "button"; bt.addEventListener("click", function () { mxLgClaim(false); }); card.appendChild(bt); }
    else card.appendChild(mk("p", "mx-note", "Volvé mañana para reclamar el día " + (o.i + 1) + ": " + mxLgText(MX_LG[o.i]) + "."));
    return card;
  }
  function mxEvMis(box, m) {
    var c = mxCtx();
    box.appendChild(mxLgCard(m));
    box.appendChild(mk("div", "mx-sec", "Misiones diarias"));
    box.appendChild(mk("p", "mx-note", "Seis misiones que se renuevan todos los días a las 00:00. Cada una otorga 6 puntos SEIS y un sobre de 1 estrella. El modo Enfoque se activa con el botón «Enfoque» del editor de notas."));
    mxEvDaily(c).forEach(function (id) { var d = MX_EVD[id], key = mxEvKey("d", c, id); box.appendChild(mxEvCard(d, d.g(c), !!m.cl[key], MX_EVR.d, function () { mxEvClaim(key, MX_EVR.d); })); });
    box.appendChild(mk("div", "mx-sec", "Misiones semanales"));
    box.appendChild(mk("p", "mx-note", "Seis misiones que se renuevan cada lunes: tres fáciles (16 puntos SEIS y un sobre de 2 estrellas) y tres difíciles (24 puntos SEIS y un sobre de 3 estrellas)."));
    mxEvWeekly(c).forEach(function (id, i) { var d = MX_EVW[id], rw = i >= 3 ? MX_EVR.h : MX_EVR.f, key = mxEvKey("w", c, id); box.appendChild(mxEvCard(d, d.g(c), !!m.cl[key], rw, function () { mxEvClaim(key, rw); })); });
  }
  function mxEvRender(box, m, prof) {
    if (mxEvSel !== "gta") {
      box.appendChild(mk("div", "mx-sec", "Eventos activos"));
      var ec = mk("button", "mx-evb"); ec.type = "button"; ec.appendChild(mk("span", "mx-evch", "EVENTO · ACTIVO")); ec.appendChild(mk("h3", null, "GTA VI")); ec.appendChild(mk("p", null, "Conseguí el marco exclusivo «VI»: completá misiones para obtener sobres de la suerte y acumular puntos SEIS.")); ec.appendChild(mxCdLine());
      ec.addEventListener("click", function () { mxEvSel = "gta"; mxEvTab = "mis"; mxRender(); $("mxSc").scrollTop = 0; }); box.appendChild(ec);
      box.appendChild(mk("div", "mx-evb2", "Próximamente: más eventos con XP, estrellas, marcos y portadas."));
      return;
    }
    var bk = mk("button", "mx-evback", "‹ Eventos"); bk.type = "button"; bk.addEventListener("click", function () { mxEvSel = ""; mxRender(); }); box.appendChild(bk);
    var hd = mk("div", "mx-evh"); hd.appendChild(mk("span", "mx-evch", "EVENTO · ACTIVO")); hd.appendChild(mk("h2", null, "GTA VI")); hd.appendChild(mk("p", null, "Completá misiones para ganar sobres, mejoralos con toques y probá suerte para conseguir el marco exclusivo «VI»."));
    var sxp = mk("div", "mx-sxp"); sxp.innerHTML = sixIco(18); sxp.appendChild(mk("b", null, fmtMx(mxSx(m).p || 0))); sxp.appendChild(mk("span", null, "SEIS")); hd.appendChild(sxp); hd.appendChild(mxCdBox()); box.appendChild(hd);
    var nt = mk("div", "mx-evn"), ni = mk("span", "mx-evni", "!"), nb = mk("div"); nb.appendChild(mk("b", null, "Nuevas recompensas en camino")); nb.appendChild(mk("p", null, "Durante el evento se irán sumando nuevas recompensas a los sobres. Volvé a revisar con frecuencia.")); nt.appendChild(ni); nt.appendChild(nb); box.appendChild(nt);
    var gf = getMax().gf || {}, gt = mk("div", "mx-evn"), gi = mk("span", "mx-evni", "🎁"), gb = mk("div");
    gb.appendChild(mk("b", null, "Regalos por iniciar sesión"));
    gb.appendChild(mk("p", null, (gf.a ? "✓ " : "") + "6 de diciembre: un sobre de 6 estrellas."));
    gb.appendChild(mk("p", null, (gf.b ? "✓ " : "") + "17 de diciembre (último día): un sobre mítico con " + MX_MI_FP + " % de probabilidad de conseguir el marco."));
    gt.appendChild(gi); gt.appendChild(gb); box.appendChild(gt);
    var tabs = mk("div", "mx-evt"); var er = mxEvReady(); [["mis", "Misiones" + (er ? " · " + er : "")], ["main", "Sobres y marco"], ["shop", "Tienda del evento"]].forEach(function (tb) { var b = mk("button", mxEvTab === tb[0] ? "on" : "", tb[1]); b.type = "button"; b.addEventListener("click", function () { mxEvTab = tb[0]; mxRender(); }); tabs.appendChild(b); }); box.appendChild(tabs);
    var f = frById("gta6"), inv = m.inv, test = !!m.bk;
    if (mxEvTab === "shop") { mxEvShop(box, m, test); return; }
    if (mxEvTab === "mis") { mxEvMis(box, m); return; }
    box.appendChild(mk("div", "mx-sec", "Marco del evento"));
    var stg = mk("div", "mx-fst"), pw = mk("div", "mx-fpw"), pa = mk("span", "mx-fpa"); paintAvatar(pa, prof); pw.appendChild(pa); stg.appendChild(pw); box.appendChild(stg); requestAnimationFrame(function () { if (pw.isConnected) frApply(pw, pa, "gta6", 100); });
    var info = mk("div", "mx-fin"); info.appendChild(mk("b", null, f.n)); info.appendChild(mk("span", "mx-fr mx-evx", "EXCLUSIVO")); info.appendChild(mk("span", "mx-ft", "“VI”")); stg.appendChild(info);
    var act = mk("button", "mx-btn mx-fbuy"); act.type = "button";
    if (inv.gta6) { var on = frEq() === "gta6"; act.textContent = on ? "Equipado ✓" : "Equipar"; act.disabled = on; if (!on) act.addEventListener("click", function () { m.eq.frame = "gta6"; maxSave(); toast("Marco equipado"); mxRender(); }); }
    else { act.textContent = "Comprar · ⭐ " + fmtMx(f.p); act.disabled = test || m.stars < f.p; act.addEventListener("click", function () { if (m.bk || m.stars < f.p) return; m.stars -= f.p; inv.gta6 = Date.now(); m.eq.frame = "gta6"; maxSave(); toast("Marco conseguido: GTA VI"); mxRender(); }); }
    box.appendChild(act);
    if (!inv.gta6) box.appendChild(mk("p", "mx-note", test ? "Estás en modo prueba: restablecé tu nivel real para comprar." : "Cuesta ⭐ " + fmtMx(f.p) + ". También podés ganarlo gratis abriendo sobres."));
    box.appendChild(mk("div", "mx-sec", "Pines del evento"));
    var pg = mk("div", "mx-pins"), owned = MX_PINS.filter(function (q) { return !!m.pins[q.id]; }).length;
    /* los pines se dibujan en el cuadro siguiente; mientras tanto el espacio queda reservado */
    pg.style.minHeight = "280px";
    requestAnimationFrame(function () {
      if (!pg.isConnected) return;
      pg.style.minHeight = "";
      MX_PINS.forEach(function (q) {
        var has = !!m.pins[q.id], on = m.eq.pin === q.id; 
        var b = mk("button", "mx-pn" + (has ? "" : " nol") + (on ? " on" : "")); b.type = "button";
        var ic = mk("span", "mx-pni"); ic.innerHTML = pinSvg(q.id, 62); b.appendChild(ic); b.appendChild(mk("b", null, has ? q.n : "???")); b.appendChild(mk("small", null, has ? (on ? "Equipado" : q.r) : q.r));
        if (has) b.addEventListener("click", function () { m.eq.pin = on ? "" : q.id; maxSave(); toast(on ? "Pin quitado" : "Pin equipado: " + q.n); try { renderProfile(); renderMenu(); } catch (e) {} mxRender(); }); else b.disabled = true;
        pg.appendChild(b);
      });
    });
    box.appendChild(pg);
    box.appendChild(mk("p", "mx-note", "Todos los sobres pueden incluir un pin: cuantas más estrellas tiene el sobre, mayor es la probabilidad, desde " + String(MX_PIN.ch[1]).replace(".", ",") + " % en los de 1 estrella hasta " + MX_PIN.ch[6] + " % en los de 6. Cada sobre trae como máximo uno y, cuando sale, reemplaza las demás recompensas del sobre. Equipalo para mostrarlo junto a tu nombre. Tenés " + owned + " de " + MX_PINS.length + "."));
    var l = mxPkList(m);
    box.appendChild(mk("div", "mx-sec", "Mis sobres" + (l.length ? " (" + l.length + ")" : "")));
    if (!l.length) {
      var ec2 = mk("div", "mx-card"); ec2.appendChild(mk("b", null, "Todavía no tenés sobres")); ec2.appendChild(mk("p", "mx-note", "Cada misión que reclamás te da un sobre: cuanto más difícil, más estrellas tiene (de 1 a 3). También podés conseguirlos en la Tienda del evento con puntos SEIS.")); box.appendChild(ec2);
      var gm = mk("button", "mx-btn", "Ir a Misiones"); gm.type = "button"; gm.addEventListener("click", function () { mxTab = "mis"; mxRender(); }); box.appendChild(gm);
    } else {
      var gr = mk("div", "mx-pkl"), gen = (mxPkGen = (mxPkGen || 0) + 1);
      function mkPk(pk, i) { var c = mk("button", "mx-pkcard"); c.type = "button"; c.disabled = test; c.setAttribute("aria-label", pk.mi ? "Abrir sobre mítico" : "Abrir sobre de " + pk.s + " estrellas"); var w = mk("div"); w.innerHTML = mxPkSvg(pk.s, pk.mi ? "mi" : ""); c.appendChild(w.firstChild); c.appendChild(mk("b", null, pk.mi ? "Mítico" : pk.s + (pk.s === 1 ? " estrella" : " estrellas"))); c.appendChild(mk("span", null, pk.t ? "Toques: " + pk.t + "/" + (pk.mx || MX_PK.taps) : pk.mi ? MX_MI_FP + " % de marco" : pk.mx ? "Especial · " + pk.mx + " toques" : "Sin abrir")); c.addEventListener("click", function () { mxPkOpenUi(i); }); return c; }
      /* los sobres se arman de a 8 por cuadro; los que faltan reservan su lugar para que el scroll no salte */
      var phs = [];
      function fillPk(from) { var to = Math.min(l.length, from + 8); for (var q = from; q < to; q++) { var card = mkPk(l[q], q); if (phs[q]) gr.replaceChild(card, phs[q]); else gr.appendChild(card); } if (to < l.length) requestAnimationFrame(function () { if (gen === mxPkGen && gr.isConnected) fillPk(to); }); }
      box.appendChild(gr); fillPk(0);
      for (var z = 8; z < l.length; z++) { phs[z] = mk("div", "mx-pkph"); gr.appendChild(phs[z]); }
      if (test) box.appendChild(mk("p", "mx-note", "Estás en modo prueba: restablecé tu nivel real para abrir sobres."));
    }
    box.appendChild(mk("div", "mx-sec", "Cómo funciona"));
    var oc = mk("div", "mx-card"), tb = el("table"); tb.className = "mx-odd"; var th = el("tr"); ["Estrellas", "Mejora por toque", "Premio", "Marco"].forEach(function (x) { th.appendChild(mk("th", null, x)); }); tb.appendChild(th);
    for (var q = 1; q <= 6; q++) (function (t) { var tr = el("tr"); [t.s + " ★", t.up ? Math.round(t.up * 100) + " %" : "—", "⭐ " + fmtMx(t.st) + " · " + fmtMx(t.xp) + " XP · " + t.sx + " SEIS", t.fp + " %"].forEach(function (x) { tr.appendChild(mk("td", null, x)); }); tb.appendChild(tr); })(MX_PK.tiers[q]);
    oc.appendChild(tb); oc.appendChild(mk("p", "mx-note", "Los sobres vienen con 1 a 3 estrellas, según la dificultad de la misión. Cada toque (hasta 6 por sobre) puede subirlo una estrella, hasta un máximo de 6. La columna «Marco» indica la probabilidad de ganar el marco GTA VI al abrir ese sobre. Los puntos SEIS de misiones y sobres te hacen subir de nivel en el Camino SEIS."));
    box.appendChild(oc); box.appendChild(mk("p", "mx-note", "Próximamente: portadas del evento."));
  }
  var mxTab = "home", mxMisTab = "d", mxFrSel = "", mxPkGen = 0;
  function mxFrRefresh() { mxRender(); try { renderMenu(); } catch (e) { /* menú aún no creado */ } try { renderProfile(); } catch (e2) { /* perfil cerrado */ } }
  function mk(tag, cls, txt) { var e = el(tag, cls); if (txt != null) e.textContent = txt; return e; }
  function fmtMx(n) { return Number(n).toLocaleString("es"); }
  // La estrella de las recompensas se muestra como una moneda dorada (solo dentro de MAX, subida de nivel y avisos).
  (function () {
    var roots = ["max", "lvlup", "toast"].map(function (i) { return $(i); }).filter(Boolean);
    function conv(root) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], t;
      while ((t = w.nextNode())) { if (t.nodeValue.indexOf("\u2b50") >= 0 && t.parentNode && !/^(TEXTAREA|INPUT|SCRIPT|STYLE)$/.test(t.parentNode.nodeName) && !(t.parentNode.closest && t.parentNode.closest('[class*="nm"]'))) list.push(t); }
      list.forEach(function (n) {
        var parts = n.nodeValue.split("\u2b50"), f = document.createDocumentFragment();
        parts.forEach(function (x, i) { if (i) { var c = document.createElement("i"); c.className = "stc"; c.setAttribute("aria-hidden", "true"); f.appendChild(c); } if (x) f.appendChild(document.createTextNode(x)); });
        n.parentNode.replaceChild(f, n);
      });
    }
    var busy = false;
    roots.forEach(function (r) {
      conv(r);
      new MutationObserver(function () { if (busy) return; busy = true; try { conv(r); } finally { busy = false; } }).observe(r, { childList: true, subtree: true, characterData: true });
    });
  })();

  function mxMissionRow(def, prog, claimed, onClaim) {
    var done = prog >= def.t, card = mk("div", "mx-card mx-mi"), ic = mk("div", "mx-ic" + (claimed ? " ok" : ""), claimed ? "✓" : def.e), tx = mk("div"), b = mk("b", null, def.n);
    tx.appendChild(b); tx.appendChild(mk("span", "d", claimed ? "¡Conseguida!" : fmtMx(Math.min(prog, def.t)) + " / " + fmtMx(def.t)));
    if (!claimed) { var pb = mk("div", "mx-pb"), pi = el("i"); pi.style.width = Math.min(100, Math.round(prog / def.t * 100)) + "%"; pb.appendChild(pi); tx.appendChild(pb); }
    card.appendChild(ic); card.appendChild(tx);
    if (claimed) card.appendChild(mk("div", "mx-rw done", "+" + def.xp + " XP"));
    else if (done) { var bt = mk("button", "mx-rw", "Reclamar +" + def.xp + " XP"); bt.type = "button"; bt.addEventListener("click", onClaim); card.appendChild(bt); }
    else card.appendChild(mk("div", "mx-rw", "+" + def.xp + " XP"));
    return card;
  }
  function mxRender() {
    var box = $("mxSc"); if (!box) return;
    var lv = maxLevel(), m = getMax(), c = mxCtx(); box.textContent = "";
    $("mxBal").textContent = "⭐ " + fmtMx(m.stars);
    var rdy = mxReady(); $("mxDot").hidden = !rdy; $("mxEvDot").hidden = !!m.evs && !mxEvReady();
    $("mxTitle").textContent = { home: "MAX", shop: "Tienda", evt: "Eventos", mis: "Misiones", lvl: "Niveles", news: "Novedades" }[mxTab];
    document.querySelectorAll("#mxNav button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.mx === mxTab ? "true" : "false"); });
    if (mxTab === "home") {
      var hero = mk("div", "mx-hero"); hero.appendChild(mk("small", null, "Tu nivel")); hero.appendChild(mk("h2", null, lv.title + " · Nivel " + lv.L));
      var xb = mk("div", "mx-xp"), xi = el("i"); xi.style.width = lv.pct + "%"; xb.appendChild(xi); hero.appendChild(xb);
      hero.appendChild(mk("p", null, lv.max ? "Nivel máximo alcanzado" : fmtMx(lv.xp - lv.a) + " / " + fmtMx(lv.b - lv.a) + " XP · Faltan " + fmtMx(lv.left) + " para el nivel " + (lv.L + 1)));
      box.appendChild(hero);
      var s1 = mk("div", "mx-sec"); s1.appendChild(mk("span", null, "Misión del día")); var l1 = mk("button", "mx-link", "Ver todas"); l1.type = "button"; l1.addEventListener("click", function () { mxGo("mis"); }); s1.appendChild(l1); box.appendChild(s1);
      var id0 = mxDaily(c).filter(function (id) { return !m.cl["d:" + c.dk + ":" + id]; })[0] || mxDaily(c)[0], d0 = MX_D[id0], key0 = "d:" + c.dk + ":" + id0;
      box.appendChild(mxMissionRow(d0, d0.g(c), !!m.cl[key0], function () { mxClaim(key0, d0.xp, Math.round(d0.xp / 2), "Misión cumplida: +" + d0.xp + " XP"); }));
      var s2 = mk("div", "mx-sec"); s2.appendChild(mk("span", null, "Racha")); box.appendChild(s2);
      var w = writeStats(), rc = mk("div", "mx-card mx-mi"); rc.appendChild(mk("div", "mx-ic", "🔥")); var rt = mk("div"); rt.appendChild(mk("b", null, w.cur > 0 ? w.cur + (w.cur === 1 ? " día de racha" : " días de racha") : "Sin racha por ahora")); rt.appendChild(mk("span", "d", "Mejor racha: " + w.best + (w.best === 1 ? " día" : " días"))); rc.appendChild(rt); rc.appendChild(mk("div", "mx-rw", rdy ? rdy + " para reclamar" : "Seguí así")); box.appendChild(rc);
      var wk = mxWeek(c), s4 = mk("div", "mx-sec"); s4.appendChild(mk("span", null, "Tu semana")); box.appendChild(s4);
      var wc = mk("div", "mx-card mx-wk"), wg = mk("div", "mx-wg");
      [["Palabras", "words", fmtMx], ["Notas creadas", "notes", fmtMx], ["Enfoque", "focus", function (x) { return x >= 60 ? Math.floor(x / 60) + " h " + (x % 60) + " min" : x + " min"; }], ["Días activos", "days", function (x) { return x + "/7"; }]].forEach(function (a) {
        var cv = wk.cur[a[1]], pv = wk.prev[a[1]], t = mk("div", "mx-wt"), dl;
        if (!pv) dl = cv ? ["▲ nuevo", "up"] : ["–", "eq"]; else { var pc = Math.round((cv - pv) / pv * 100); dl = pc > 0 ? ["▲ " + pc + "%", "up"] : pc < 0 ? ["▼ " + Math.abs(pc) + "%", "dn"] : ["= igual", "eq"]; }
        t.appendChild(mk("b", null, a[2](cv))); t.appendChild(mk("span", null, a[0])); t.appendChild(mk("em", dl[1], dl[0] + " vs. semana pasada")); wg.appendChild(t);
      });
      wc.appendChild(wg);
      wc.appendChild(mk("p", "mx-wb", wk.best && wk.best.v > 0 ? "Tu mejor día fue el " + DAYS_ES[wk.best.d] + " con " + fmtMx(wk.best.v) + " palabras." : "Escribí algo hoy para empezar tu semana."));
      box.appendChild(wc);
      var s3 = mk("div", "mx-sec"); s3.appendChild(mk("span", null, "Novedades")); var l3 = mk("button", "mx-link", "Ver todas"); l3.type = "button"; l3.addEventListener("click", function () { mxGo("news"); }); s3.appendChild(l3); box.appendChild(s3);
      var n0 = NEWS[0], nc = mk("div", "mx-card"), nw = mk("div", "mx-nw cur"); nw.style.border = "0"; nw.style.padding = "0"; nw.appendChild(el("i")); var nt = mk("div"); nt.appendChild(mk("b", null, "Versión " + n0.v + " · " + n0.t)); nt.appendChild(mk("span", null, (n0.l && n0.l[0]) || "")); nw.appendChild(nt); nc.appendChild(nw); box.appendChild(nc);
      var gd = mk("button", "mx-btn", "Ver guía de MAX"); gd.type = "button"; gd.addEventListener("click", function () { mxTourShow(0); }); box.appendChild(gd);
    } else if (mxTab === "shop") {
      var inv = m.inv, test = !!m.bk, cards = {};
      if (!frById(mxFrSel) && mxFrSel !== "none") mxFrSel = frEq() || FR_LIST[0].id;
      var prof = getProfile();
      box.appendChild(mk("div", "mx-sec", "Marcos de perfil"));
      var topBox = mk("div"); box.appendChild(topBox);
      /* sincroniza las tarjetas: solo el marco elegido se anima; los demás quedan quietos */
      var syncCards = function () {
        Object.keys(cards).forEach(function (id) {
          var cd = cards[id], on = id === mxFrSel; cd.el.classList.toggle("sel", on);
          if (cd.st) cd.st.textContent = frEq() === id ? "Equipado" : inv[id] ? "Tuyo" : "\u2b50 " + fmtMx(cd.p);
          cd.el.querySelectorAll(".fr svg").forEach(function (sv) { if (sv.pauseAnimations) { if (on) sv.unpauseAnimations(); else sv.pauseAnimations(); } });
        });
      };
      var shopUpd = function () { $("mxBal").textContent = "\u2b50 " + fmtMx(getMax().stars); syncCards(); paintTop(false); try { renderMenu(); } catch (e) { } try { renderProfile(); } catch (e2) { } };
      var paintTop = function (play) {
        var sf = frById(mxFrSel); topBox.textContent = "";
        var stg = mk("div", "mx-fst"), pw = mk("div", "mx-fpw"), pa = mk("span", "mx-fpa"); paintAvatar(pa, prof); pw.appendChild(pa); stg.appendChild(pw); topBox.appendChild(stg);
        frApply(pw, pa, sf ? sf.id : "", 100);
        var info = mk("div", "mx-fin"); info.appendChild(mk("b", null, sf ? sf.n : "Sin marco")); if (sf) { var rr = mk("span", "mx-fr", sf.r); rr.style.color = sf.c; info.appendChild(rr); if (sf.tag) info.appendChild(mk("span", "mx-ft", "\u201c" + sf.tag + "\u201d")); } stg.appendChild(info);
        if (sf && sf.ev) { var evb = mk("button", "mx-link mx-fev", "\u25b6 Ver la animaci\u00f3n especial"); evb.type = "button"; evb.addEventListener("click", function () { if (calmOn()) { toast("Desactiv\u00e1 el modo calmo para verla"); return; } frEvRun(pw); }); topBox.appendChild(evb); }
        var act = mk("button", "mx-btn mx-fbuy"); act.type = "button";
        if (!sf) { act.textContent = frEq() ? "Quitar marco" : "Sin marco equipado"; act.disabled = !frEq(); act.addEventListener("click", function () { m.eq.frame = ""; maxSave(); shopUpd(); }); }
        else if (inv[sf.id]) {
          var on = frEq() === sf.id; act.textContent = on ? "Equipado ✓" : "Equipar"; act.disabled = on; if (!on) act.addEventListener("click", function () { m.eq.frame = sf.id; maxSave(); toast("Marco equipado"); shopUpd(); });
        } else {
          act.textContent = "Comprar · ⭐ " + fmtMx(sf.p); act.disabled = test || m.stars < sf.p;
          act.addEventListener("click", function () { if (m.bk || m.stars < sf.p) return; m.stars -= sf.p; inv[sf.id] = Date.now(); m.eq.frame = sf.id; maxSave(); toast("Marco conseguido: " + sf.n); shopUpd(); });
        }
        topBox.appendChild(act);
        if (!inv[sf ? sf.id : ""] && sf) topBox.appendChild(mk("p", "mx-note", test ? "Estás en modo prueba: restablecé tu nivel real para comprar." : m.stars >= sf.p ? "Podés probarlo en tu avatar antes de comprar." : "Te faltan " + fmtMx(sf.p - m.stars) + " ⭐. Se ganan con misiones, rachas, logros y al subir de nivel."));
        if (play && sf && sf.ev && !calmOn()) frEvRun(pw);
      };
      paintTop(false);
      [["", "Clásicos", "Los marcos originales de Tronx."], ["nuc", "Familia nuclear", "Armaduras de reactor con una secuencia especial de energía que ocurre muy de vez en cuando."]].forEach(function (fm, fi) {
        var lst = FR_LIST.filter(function (f) { return !f.evt && (f.fam || "") === fm[0]; }); if (!lst.length) return;
        var hd = mk("div", "mx-fam" + (fm[0] ? " " + fm[0] : "")); hd.appendChild(mk("b", null, fm[1])); hd.appendChild(mk("span", null, lst.length + (lst.length === 1 ? " marco" : " marcos"))); box.appendChild(hd); box.appendChild(mk("p", "mx-famd", fm[2]));
        var gr = mk("div", "mx-fg");
        (fi === 0 ? [null] : []).concat(lst).forEach(function (f) {
          var st = null, id = f ? f.id : "none", card = mk("button", "mx-fc" + (mxFrSel === id ? " sel" : "")); card.type = "button";
          var w = mk("div", "mx-fcw"), a2 = mk("span", "mx-fca"); paintAvatar(a2, prof); w.appendChild(a2); card.appendChild(w); if (f) frApply(w, a2, f.id, 52);
          card.appendChild(mk("b", null, f ? f.n : "Sin marco"));
          if (f) { var rt = mk("span", "mx-fr2", f.r); rt.style.color = f.c; card.appendChild(rt); if (f.tag) card.appendChild(mk("span", "mx-ft", "\u201c" + f.tag + "\u201d")); st = mk("span", "mx-fs", frEq() === f.id ? "Equipado" : inv[f.id] ? "Tuyo" : "\u2b50 " + fmtMx(f.p)); card.appendChild(st); }
          cards[id] = { el: card, st: f ? st : null, p: f ? f.p : 0 };
          card.addEventListener("click", function () {
            mxFrSel = id; syncCards();
            var tr = topBox.getBoundingClientRect(), pvOn = tr.bottom > 70 && tr.top < innerHeight * 0.6;
            paintTop(pvOn);
            if (!pvOn && f && f.ev && !calmOn()) frEvRun(w);
          });
          gr.appendChild(card);
        });
        if (fm[0] === "nuc") { var qc = mk("div", "mx-fc fq"); qc.setAttribute("aria-label", "Marco misterioso, próximamente"); var qw = mk("div", "mx-fcw"); qw.appendChild(mk("div", "mx-fq-m", "?")); qc.appendChild(qw); qc.appendChild(mk("b", null, "???")); qc.appendChild(mk("span", "mx-fr2", "Próximamente")); gr.appendChild(qc); }
        box.appendChild(gr);
      });
      box.appendChild(mk("p", "mx-note", "Pronto habrá más: portadas, efectos de nombre y fondos. Tus estrellas: " + fmtMx(m.stars) + " ⭐"));
      syncCards();
    } else if (mxTab === "evt") {
      if (!m.evs) { m.evs = 1; maxSave(); $("mxEvDot").hidden = true; }
      mxEvRender(box, m, getProfile());
    } else if (mxTab === "mis") {
      var ch = mk("div", "mx-chips"); [["d", "Diarias"], ["w", "Semanales"], ["s", "Rachas"]].forEach(function (a) { var b = mk("button", null, a[1]); b.type = "button"; b.setAttribute("aria-pressed", a[0] === mxMisTab ? "true" : "false"); b.addEventListener("click", function () { mxMisTab = a[0]; mxRender(); }); ch.appendChild(b); }); box.appendChild(ch);
      if (mxMisTab === "d") {
        var tl = Math.max(0, c.t0 + 86400000 - Date.now()), hh = Math.floor(tl / 3600000), mm = Math.floor(tl % 3600000 / 60000);
        box.appendChild(mk("p", "mx-note", "Se renuevan en " + hh + " h " + mm + " min. Completá las 3 para un bonus de +50 XP y +30 ⭐."));
        var allc = true; mxDaily(c).forEach(function (id) { var d = MX_D[id], key = "d:" + c.dk + ":" + id; if (!m.cl[key]) allc = false; box.appendChild(mxMissionRow(d, d.g(c), !!m.cl[key], function () { mxClaim(key, d.xp, Math.round(d.xp / 2), "Misión cumplida: +" + d.xp + " XP"); })); });
        var bk = "d:" + c.dk + ":bonus"; if (allc) { var bc = mk("div", "mx-card mx-mi"); bc.appendChild(mk("div", "mx-ic" + (m.cl[bk] ? " ok" : ""), m.cl[bk] ? "✓" : "🎁")); var bt2 = mk("div"); bt2.appendChild(mk("b", null, "Bonus del día")); bt2.appendChild(mk("span", "d", "Completaste las 3 misiones")); bc.appendChild(bt2); if (m.cl[bk]) bc.appendChild(mk("div", "mx-rw done", "Reclamado")); else { var bb = mk("button", "mx-rw", "Reclamar +50 XP"); bb.type = "button"; bb.addEventListener("click", function () { mxClaim(bk, 50, 30, "Bonus del día: +50 XP"); }); bc.appendChild(bb); } box.appendChild(bc); }
      } else if (mxMisTab === "w") {
        var dl = Math.max(0, c.w0 + 7 * 86400000 - Date.now()), dd = Math.floor(dl / 86400000);
        box.appendChild(mk("p", "mx-note", "Se renuevan el lunes (en " + (dd + 1) + (dd === 0 ? " día" : " días") + ")."));
        mxWeekly(c).forEach(function (id) { var d = MX_W[id], key = "w:" + c.wk + ":" + id; box.appendChild(mxMissionRow(d, d.g(c), !!m.cl[key], function () { mxClaim(key, d.xp, Math.round(d.xp / 2), "Misión cumplida: +" + d.xp + " XP"); })); });
      } else {
        var ws = writeStats(); box.appendChild(mk("p", "mx-note", "Escribí días seguidos para reclamar premios. Tu mejor racha: " + ws.best + (ws.best === 1 ? " día." : " días.")));
        MX_STREAKS.forEach(function (s) {
          var xp = s * 10, claimed = !!m.sc[s], ok = ws.best >= s, card = mk("div", "mx-card mx-mi"), ic = mk("div", "mx-ic" + (claimed ? " ok" : ""), claimed ? "✓" : "🔥"), tx = mk("div");
          tx.appendChild(mk("b", null, s + " días seguidos")); tx.appendChild(mk("span", "d", claimed ? "¡Conseguida!" : Math.min(ws.best, s) + " / " + s));
          if (!claimed) { var pb = mk("div", "mx-pb"), pi = el("i"); pi.style.width = Math.min(100, Math.round(ws.best / s * 100)) + "%"; pb.appendChild(pi); tx.appendChild(pb); }
          card.appendChild(ic); card.appendChild(tx);
          if (claimed) card.appendChild(mk("div", "mx-rw done", "+" + fmtMx(xp) + " XP"));
          else if (ok) { var b = mk("button", "mx-rw", "Reclamar +" + fmtMx(xp) + " XP"); b.type = "button"; b.addEventListener("click", function () { var mm2 = getMax(); if (mm2.sc[s]) return; mm2.sc[s] = Date.now(); grantXp(xp, s * 2); toast("Racha de " + s + " días: +" + fmtMx(xp) + " XP"); mxRender(); }); card.appendChild(b); }
          else card.appendChild(mk("div", "mx-rw", "+" + fmtMx(xp) + " XP"));
          box.appendChild(card);
        });
      }
    } else if (mxTab === "lvl") {
      var tm = getMax();
      if (tm.bk) {
        var tb = mk("div", "mx-test"); tb.appendChild(mk("span", null, "Modo prueba · tu nivel real es el " + lvlOf(tm.bk.xp)));
        var tr = mk("button", "mx-tbtn", "Restablecer"); tr.type = "button"; tr.addEventListener("click", mxTestRestore); tb.appendChild(tr); box.appendChild(tb);
      }
      var ct = mk("div", "mx-ctr"), ew = mk("div", "mx-emw"); ew.innerHTML = emblemAnim(lv.rank.i, lv.L, 190); ct.appendChild(ew);
      ct.appendChild(mk("span", "mx-tier", "Rango " + lv.rank.name)); ct.appendChild(mk("h2", null, lv.title)); ct.appendChild(mk("p", null, "Nivel " + lv.L + " de " + MX_MAXL)); box.appendChild(ct);
      var xt = mk("div", "mx-xt"); xt.appendChild(mk("span", null, fmtMx(lv.xp) + " XP")); xt.appendChild(mk("span", null, lv.max ? "Máximo" : fmtMx(lv.b) + " XP")); box.appendChild(xt);
      var br = mk("div", "mx-bar"), bi = el("i"); bi.style.width = lv.pct + "%"; br.appendChild(bi); box.appendChild(br);
      box.appendChild(mk("p", "mx-note", lv.max ? "Llegaste al rango final." : "Faltan " + fmtMx(lv.left) + " XP para el nivel " + (lv.L + 1) + (titleOf(lv.L + 1) !== lv.title ? " · «" + titleOf(lv.L + 1) + "»" : "") + "."));
      if (!lv.max) { var nx = mk("div", "mx-nxt"); nx.appendChild(mk("div", null, "🎁")); nx.firstChild.style.fontSize = "26px"; var nxt = mk("div"); nxt.appendChild(mk("b", null, "Premio del nivel " + (lv.L + 1))); nxt.appendChild(mk("span", null, "+" + (10 * (lv.L + 1)) + " ⭐" + (titleOf(lv.L + 1) !== lv.title ? " y título nuevo" : ""))); nx.appendChild(nxt); box.appendChild(nx); }
      box.appendChild(mk("div", "mx-sec", "Cómo se gana XP"));
      [["📝", "Crear una nota", "hasta 5 por día", "+10"], ["✍️", "Cada 100 palabras", "hasta 600 por día", "+5"], ["🎯", "Cada minuto de enfoque", "hasta 90 por día", "+1"], ["🏅", "Logros", "de bronce a cósmico", "+50 a +15.000"], ["🎯", "Misiones", "diarias y semanales", "+20 a +150"], ["🔥", "Rachas", "3, 7, 14, 30 días y más", "+30 a +3.650"]].forEach(function (a) {
        var r = mk("div", "mx-x"), e = mk("div", "e", a[0]), t = mk("div", null, a[1]); t.appendChild(mk("small", null, a[2])); r.appendChild(e); r.appendChild(t); r.appendChild(mk("em", null, a[3])); box.appendChild(r);
      });
      box.appendChild(mk("div", "mx-sec", "Camino de rangos"));
      MX_RANKS.forEach(function (r, i) {
        var nextFrom = MX_RANKS[i + 1] ? MX_RANKS[i + 1][0] : MX_MAXL, cur = lv.rank.i === r[2], fut = r[2] > lv.rank.i;
        var row = mk("div", "mx-road" + (cur ? " cur" : fut ? " fut" : "")), em = mk("div", "em"); em.innerHTML = r[2] >= 7 ? emblemAnim(r[2], r[0], 56) : emblemSvg(r[2], r[0], 52); var tx = mk("div");
        row.addEventListener("click", function () { showRankPreview(r); });
        tx.appendChild(mk("b", null, r[1] + (r[0] === MX_MAXL ? " · nivel 50" : " · niv. " + r[0] + "–" + (nextFrom - 1)) + (cur ? " ◀ estás aquí" : "")));
        tx.appendChild(mk("span", null, r[0] === MX_MAXL ? "El rango final · " + fmtMx(xpAt(MX_MAXL)) + " XP" : "Hasta " + fmtMx(xpAt(nextFrom)) + " XP · " + r[3]));
        row.appendChild(em); row.appendChild(tx); box.appendChild(row);
      });
      box.appendChild(mk("p", "mx-note", "Los tiempos son estimados para un uso activo (unos 120 XP por día). Toca un rango para verlo en grande."));
      box.appendChild(mk("div", "mx-sec", "Probador de niveles"));
      box.appendChild(mk("p", "mx-note", "Cambia de nivel para ver cada emblema en grande. Tu progreso real queda guardado y puedes volver a él en cualquier momento."));
      var tl = mk("div", "mx-tl");
      [5, 10, 15, 20, 30, 40, 50].forEach(function (n) { var b = mk("button", "mx-chip", "Nivel " + n); b.type = "button"; b.addEventListener("click", function () { mxTestGo(n); }); tl.appendChild(b); });
      box.appendChild(tl);
      var tl2 = mk("div", "mx-tl2"), cL = lvlOf(tm.xp), bd = mk("button", "mx-chip", "− Bajar nivel"), bu = mk("button", "mx-chip", "+ Subir nivel");
      bd.type = "button"; bu.type = "button"; bd.disabled = cL <= 1; bu.disabled = cL >= MX_MAXL;
      bd.addEventListener("click", function () { mxTestGo(cL - 1); }); bu.addEventListener("click", function () { mxTestGo(cL + 1); });
      tl2.appendChild(bd); tl2.appendChild(bu); box.appendChild(tl2);
      var rs = mk("button", "mx-btn", tm.bk ? "Restablecer a mi nivel real (" + lvlOf(tm.bk.xp) + ")" : "Estás en tu nivel real"); rs.type = "button"; rs.disabled = !tm.bk; rs.addEventListener("click", mxTestRestore); box.appendChild(rs);
    } else {
      NEWS.slice(0, 8).forEach(function (n, i) {
        var nw = mk("div", "mx-nw" + (i === 0 ? " cur" : "")); nw.appendChild(el("i")); var t = mk("div"); t.appendChild(mk("b", null, n.v + " · " + n.t)); t.appendChild(mk("span", null, (n.l && n.l[0] ? n.l[0] + " · " : "") + n.d)); nw.appendChild(t); box.appendChild(nw);
      });
      var all = mk("button", "mx-btn", "Ver todas las novedades"); all.type = "button"; all.addEventListener("click", function () { openNews(); }); box.appendChild(all);
    }
  }
  function mxGo(t) { mxTab = t; mxRender(); $("mxSc").scrollTop = 0; }
  var MX_TOUR = [
    ["⚡", "Bienvenido a MAX", "Acá ves tu nivel y tu progreso. Todo lo que hacés en Tronx suma experiencia (XP): escribir notas, enfocarte y completar tareas.", "home"],
    ["🚀", "Niveles y rangos", "Hay 50 niveles repartidos en 8 rangos, de Bronce a Singularidad. Cada nivel te da un título nuevo y estrellas de premio.", "lvl"],
    ["🎯", "Misiones", "Cada día tenés 3 misiones y cada semana, otras 3. Cumplilas y tocá Reclamar para llevarte el XP. Las rachas dan premios más grandes.", "mis"],
    ["⭐", "Estrellas", "Ganás estrellas al subir de nivel y al cumplir misiones. Se guardan para la Tienda, que se está preparando.", "shop"],
    ["🏅", "Logros", "Hay logros de siete rarezas, de Bronce a Cósmico, y cada uno da XP al desbloquearse. Los encontrás en tu perfil, en la pestaña Logros.", "home"]
  ];
  var mxTourI = -1;
  function mxTourEnd(done) {
    var o = $("mxTour"); if (o) o.remove(); mxTourI = -1;
    document.querySelectorAll("#mxNav button.mx-hl").forEach(function (b) { b.classList.remove("mx-hl"); });
    if (done) { var m = getMax(); m.tour = 1; maxSave(); mxGo("home"); }
  }
  function mxTourShow(i) {
    var o = $("mxTour"), st = MX_TOUR[i], pg = document.querySelector(".maxpage"); if (!pg) return; mxTourI = i;
    if (!o) { o = mk("div", "mx-tour"); o.id = "mxTour"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Guía de MAX"); pg.appendChild(o); }
    o.textContent = "";
    var cd = mk("div", "mx-tc"); cd.appendChild(mk("div", "mx-te", st[0])); cd.appendChild(mk("h3", null, st[1])); cd.appendChild(mk("p", null, st[2]));
    var dots = mk("div", "mx-td"); MX_TOUR.forEach(function (x, k) { dots.appendChild(mk("i", k === i ? "on" : null)); }); cd.appendChild(dots);
    var bar = mk("div", "mx-tb"), sk = mk("button", "mx-ts", i === MX_TOUR.length - 1 ? "Volver" : "Omitir"); sk.type = "button";
    sk.addEventListener("click", function () { if (i === MX_TOUR.length - 1) mxTourShow(i - 1); else mxTourEnd(true); });
    var nx = mk("button", "mx-tn", i === MX_TOUR.length - 1 ? "¡Entendido!" : "Siguiente"); nx.type = "button";
    nx.addEventListener("click", function () { if (i === MX_TOUR.length - 1) mxTourEnd(true); else mxTourShow(i + 1); });
    bar.appendChild(sk); bar.appendChild(nx); cd.appendChild(bar); o.appendChild(cd);
    mxTab = st[3]; mxRender();
    document.querySelectorAll("#mxNav button").forEach(function (b) { b.classList.toggle("mx-hl", b.dataset.mx === st[3] && st[3] !== "home"); });
    var sc = $("mxSc"); if (sc) sc.scrollTop = 0;
  }
  function openMax() {
    mxTourEnd(false); mxTab = "home"; mxMisTab = "d"; mxEvSel = ""; mxRender(); $("max").hidden = false; pushLayer("max");
    if (!getMax().tour && !getMax().bk) setTimeout(function () { if (!$("max").hidden && mxTourI < 0) mxTourShow(0); }, 500);
  }
  function maxMenuSub() {
    var lv = maxLevel(), r = mxReady();
    return "Nivel " + lv.L + (r ? " · " + r + (r === 1 ? " premio por reclamar" : " premios por reclamar") : " · Misiones y niveles");
  }
  var celebrating = false;
  var celT = 0;
  function tryCelebrate() { clearTimeout(celT); celT = setTimeout(doCelebrate, 450); }
  function doCelebrate() {
    var m = settings.max, hasL = m && m.pend, hasA = settings.achPend && settings.achPend.length; if ((!hasL && !hasA) || celebrating) return;
    var app = document.querySelector(".app"); if (!app || app.getAttribute("data-view") !== "list" || layers.length) return;
    if (!hasL) { showAchUp(); return; }
    celebrating = true; $("luBig").textContent = "¡Subiste de nivel!";
    var L = m.pend, r = rankOf(L), prev = titleOf(m.pendFrom || L - 1), nm = titleOf(L);
    $("luEmb").innerHTML = emblemAnim(r.i, L, 240); $("luName").textContent = nm; $("luSub").textContent = "Rango " + r.name + " · Nivel " + L;
    var rw = $("luRw"); rw.textContent = ""; rw.appendChild(mk("div", null, "⭐ +" + fmtMx(m.pendStars || 0)));
    if (nm !== prev) rw.appendChild(mk("div", null, "🏷️ Título nuevo"));
    m.pend = 0; m.pendFrom = 0; m.pendStars = 0; maxSave();
    $("lvlup").hidden = false; pushLayer("lvlup");
  }
  function showAchUp() {
    var id = settings.achPend.shift(), a = ACH.filter(function (x) { return x.id === id; })[0];
    if (!a || !settings.ach[a.id]) { saveSettings(); tryCelebrate(); return; }
    celebrating = true;
    var lu = $("lvlup"); lu.setAttribute("data-t", a.tier);
    $("luBig").textContent = a.sec ? "¡Secreto descubierto!" : "¡Logro desbloqueado!";
    var md = el("div", "md luMd " + TIER_CLS[a.tier]); md.innerHTML = medalSvg(a.c, a.tier, true, a.id); md.setAttribute("aria-hidden", "true");
    var em = $("luEmb"); em.textContent = ""; em.appendChild(md);
    $("luName").textContent = a.n; $("luSub").textContent = "Rareza " + TIER_NM[a.tier].charAt(0).toUpperCase() + TIER_NM[a.tier].slice(1) + " · " + a.d;
    var rw = $("luRw"); rw.textContent = ""; rw.appendChild(mk("div", null, "✨ +" + fmtMx(TIER_XP[a.tier]) + " XP")); rw.appendChild(mk("div", null, "⭐ +" + fmtMx(Math.round(TIER_XP[a.tier] / 2))));
    saveSettings(); lu.hidden = false; pushLayer("lvlup");
  }
  function showRankPreview(r) {
    if (celebrating) return; celebrating = true;
    $("luEmb").innerHTML = emblemAnim(r[2], r[0], 240); $("luName").textContent = titleOf(r[0]); $("luSub").textContent = "Rango " + r[1] + " · Nivel " + r[0];
    $("luBig").textContent = "Vista previa";
    var rw = $("luRw"); rw.textContent = ""; rw.appendChild(mk("div", null, "Así se ve este rango"));
    $("lvlup").hidden = false; pushLayer("lvlup");
  }
  $("mnMax").addEventListener("click", function () { closeMenuThen(openMax); });
  $("maxClose").addEventListener("click", function () { closeLayer("max"); });
  $("mxNav").addEventListener("click", function (e) { var b = e.target.closest("button[data-mx]"); if (b) mxGo(b.dataset.mx); });
  $("luOk").addEventListener("click", function () { closeLayer("lvlup"); });

