  /* ---------- Cubo del Destino ----------
     Objeto especial del evento: un cubo de obsidiana con grietas de energía violeta. Se gana en el Camino SEIS
     (nivel 8) y al abrirlo tiene un 66 % fijo de dar el pin exclusivo «Cubo del Destino»; si no sale, da un premio de consuelo.
     Se dibuja con canvas 2D (proyección propia) para que quede nítido en cualquier densidad de pantalla. */
  var MX_CB_P = 66, MX_CB_PIN = "cub", MX_CB_LOSE = { st: 200, xp: 60, sx: 10 };
  function mxCbN(m) { m.cb = Math.max(0, Math.floor(+m.cb || 0)); return m.cb; }
  function cbRng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cbGlowStroke(x, draw, w, T) {
    [[w * 5, "rgba(120,50,240,.22)", T * 0.05], [w * 2.4, "rgba(160,100,255,.55)", T * 0.02], [w, "#f4eaff", 0]].forEach(function (p) {
      x.shadowColor = "#8a3cff"; x.shadowBlur = p[2]; x.lineWidth = p[0]; x.strokeStyle = p[1]; x.beginPath(); draw(); x.stroke();
    });
    x.shadowBlur = 0;
  }
  /* seis símbolos, uno por cara: ojo, triángulo con círculo, luna, reloj de arena, espiral y hexagrama */
  var CB_GLYPHS = [
    function (c, r) { c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * 0.95, r, 0); c.quadraticCurveTo(0, r * 0.95, -r, 0); c.moveTo(r * 0.32, 0); c.arc(0, 0, r * 0.32, 0, 6.2832); c.moveTo(0, -r * 0.82); c.lineTo(0, -r * 1.12); c.moveTo(-r * 0.55, -r * 0.7); c.lineTo(-r * 0.75, -r * 0.98); c.moveTo(r * 0.55, -r * 0.7); c.lineTo(r * 0.75, -r * 0.98); },
    function (c, r) { c.moveTo(0, -r); c.lineTo(r * 0.87, r * 0.5); c.lineTo(-r * 0.87, r * 0.5); c.closePath(); c.moveTo(r * 0.26, r * 0.08); c.arc(0, r * 0.08, r * 0.26, 0, 6.2832); },
    function (c, r) { c.arc(0, 0, r, Math.PI * 0.32, Math.PI * 1.68, false); c.arc(r * 0.38, 0, r * 0.78, Math.PI * 1.6, Math.PI * 0.4, true); c.moveTo(r * 0.1, -r * 0.22); c.lineTo(r * 0.1, r * 0.22); c.moveTo(-r * 0.08, 0); c.lineTo(r * 0.28, 0); },
    function (c, r) { c.moveTo(-r * 0.7, -r); c.lineTo(r * 0.7, -r); c.lineTo(-r * 0.7, r); c.lineTo(r * 0.7, r); c.closePath(); },
    function (c, r) { for (var a = 0; a <= 12.57; a += 0.2) { var q = r * a / 12.57, px = Math.cos(a) * q, py = Math.sin(a) * q; if (a) c.lineTo(px, py); else c.moveTo(px, py); } },
    function (c, r) { c.moveTo(0, -r); c.lineTo(r * 0.87, r * 0.5); c.lineTo(-r * 0.87, r * 0.5); c.closePath(); c.moveTo(0, r); c.lineTo(r * 0.87, -r * 0.5); c.lineTo(-r * 0.87, -r * 0.5); c.closePath(); }
  ];
  function cbFaceBase(T, rng) {
    var c = document.createElement("canvas"); c.width = c.height = T; var x = c.getContext("2d"), i;
    x.fillStyle = "#05030c"; x.fillRect(0, 0, T, T);
    var g = x.createRadialGradient(T * 0.3, T * 0.25, 0, T * 0.3, T * 0.25, T * 0.95);
    g.addColorStop(0, "rgba(74,38,140,.55)"); g.addColorStop(0.5, "rgba(26,10,56,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, T, T);
    for (i = 0; i < 10; i++) { x.fillStyle = "rgba(130,100,220," + (0.025 + rng() * 0.06).toFixed(3) + ")"; x.beginPath(); x.moveTo(rng() * T, rng() * T); x.lineTo(rng() * T, rng() * T); x.lineTo(rng() * T, rng() * T); x.closePath(); x.fill(); }
    var sg = x.createLinearGradient(0, T, T, 0); sg.addColorStop(0.3, "rgba(255,255,255,0)"); sg.addColorStop(0.45, "rgba(180,150,255,.10)"); sg.addColorStop(0.5, "rgba(255,255,255,.04)"); sg.addColorStop(0.7, "rgba(255,255,255,0)"); x.fillStyle = sg; x.fillRect(0, 0, T, T);
    for (i = 0; i < 280; i++) { x.fillStyle = "rgba(210,190,255," + (0.04 + rng() * 0.1).toFixed(3) + ")"; x.fillRect(rng() * T, rng() * T, 1 + rng() * 1.6, 1 + rng() * 1.6); }
    var m = T * 0.045; x.lineWidth = T * 0.012; x.strokeStyle = "rgba(160,120,255,.42)"; x.strokeRect(m, m, T - 2 * m, T - 2 * m);
    x.lineWidth = T * 0.006; x.strokeStyle = "rgba(255,255,255,.12)"; x.strokeRect(m * 1.8, m * 1.8, T - 3.6 * m, T - 3.6 * m);
    x.strokeStyle = "rgba(205,175,255,.6)"; x.lineWidth = T * 0.014; x.lineCap = "round";
    [[m * 1.8, m * 1.8, 1, 1], [T - m * 1.8, m * 1.8, -1, 1], [T - m * 1.8, T - m * 1.8, -1, -1], [m * 1.8, T - m * 1.8, 1, -1]].forEach(function (q) { x.beginPath(); x.moveTo(q[0] + q[2] * T * 0.09, q[1]); x.lineTo(q[0], q[1]); x.lineTo(q[0], q[1] + q[3] * T * 0.09); x.stroke(); });
    return c;
  }
  function cbFaceGlow(T, rng, gi) {
    var c = document.createElement("canvas"); c.width = c.height = T; var x = c.getContext("2d"), lines = [], n = 5 + (rng() * 3 | 0), k, s;
    x.lineCap = x.lineJoin = "round";
    for (k = 0; k < n; k++) {
      var side = rng() * 4 | 0, t = 0.1 + rng() * 0.8, sx, sy;
      if (side === 0) { sx = t * T; sy = 0; } else if (side === 1) { sx = T; sy = t * T; } else if (side === 2) { sx = t * T; sy = T; } else { sx = 0; sy = t * T; }
      var ang = Math.atan2(T / 2 - sy, T / 2 - sx) + (rng() - 0.5) * 0.6, px = sx, py = sy, pl = [[px, py]], steps = 6 + (rng() * 5 | 0);
      for (s = 0; s < steps; s++) {
        var step = T * (0.04 + rng() * 0.045); ang += (rng() - 0.5) * 1.1; px += Math.cos(ang) * step; py += Math.sin(ang) * step;
        if (Math.hypot(px - T / 2, py - T / 2) < T * 0.27) break;
        pl.push([px, py]);
        if (rng() < 0.32) {
          var ba = ang + (rng() < 0.5 ? -1 : 1) * (0.5 + rng() * 0.6), bx = px, by = py, bl = [[bx, by]], bs = 2 + (rng() * 3 | 0), q;
          for (q = 0; q < bs; q++) { ba += (rng() - 0.5) * 0.9; bx += Math.cos(ba) * T * 0.04; by += Math.sin(ba) * T * 0.04; bl.push([bx, by]); }
          lines.push(bl);
        }
      }
      lines.push(pl);
    }
    cbGlowStroke(x, function () { lines.forEach(function (pl) { pl.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); }); }, T * 0.0075, T);
    x.save(); x.translate(T / 2, T / 2);
    cbGlowStroke(x, function () { x.moveTo(T * 0.22, 0); x.arc(0, 0, T * 0.22, 0, 6.2832); x.moveTo(T * 0.245, 0); x.arc(0, 0, T * 0.245, 0, 6.2832); for (var i = 0; i < 24; i++) { var a = i / 24 * 6.2832, r1 = T * 0.255, r2 = T * (i % 2 ? 0.275 : 0.29); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); } }, T * 0.006, T);
    cbGlowStroke(x, function () { CB_GLYPHS[gi](x, T * 0.15); }, T * 0.011, T);
    x.restore();
    return c;
  }
  var cbTex = null, cbSprite = null;
  function cbTexGet() {
    if (cbTex) return cbTex;
    var T = 512, base = [], glow = [], i;
    for (i = 0; i < 6; i++) { base.push(cbFaceBase(T, cbRng(11 + i * 97))); glow.push(cbFaceGlow(T, cbRng(501 + i * 131), i)); }
    var sp = document.createElement("canvas"); sp.width = sp.height = 32; var sx = sp.getContext("2d"), g = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(200,160,255,.85)"); g.addColorStop(0.6, "rgba(120,60,240,.25)"); g.addColorStop(1, "rgba(80,30,200,0)"); sx.fillStyle = g; sx.fillRect(0, 0, 32, 32);
    cbSprite = sp; cbTex = { T: T, base: base, glow: glow };
    return cbTex;
  }
  var CB_FACES = [
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] }, { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] }, { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] }];
  /* cv: lienzo. o: { calm, fps, scale, cy }. Devuelve { charge(cb), stop() } */
  function mxCubeMake(cv, o) {
    o = o || {};
    var tex = cbTexGet(), T = tex.T, x = cv.getContext("2d"), W = 2, H = 2, dpr = 1, raf = 0, t0 = performance.now(), last = t0, lastDraw = 0, run = true, miss = 0;
    var calm = !!o.calm, st = "idle", stT = 0, spin = 1, boost = 0, shakeK = 0, burstCb = null, hidden = false, yaw = 0.7, shards = [], ring = null, arcs = [], nextArc = t0 + 600, i;
    var parts = [], PR = cbRng(7), nP = o.fps ? 30 : (calm ? 26 : 58);
    for (i = 0; i < nP; i++) parts.push({ r: 1.7 + PR() * 1.9, a: PR() * 6.2832, y: (PR() - 0.5) * 3.0, sp: (0.12 + PR() * 0.35) * (PR() < 0.5 ? -1 : 1), s: 0.5 + PR() * 1.4, ph: PR() * 6.28, k: PR() });
    var CH = calm ? 900 : 2100;
    function fit() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } }
    fit();
    var ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(cv); }
    function quad(P) { x.beginPath(); x.moveTo(P[0][0], P[0][1]); x.lineTo(P[1][0], P[1][1]); x.lineTo(P[2][0], P[2][1]); x.lineTo(P[3][0], P[3][1]); x.closePath(); }
    function tf(P, img) { var a = (P[1][0] - P[0][0]) / T, b = (P[1][1] - P[0][1]) / T, c = (P[3][0] - P[0][0]) / T, d = (P[3][1] - P[0][1]) / T; x.setTransform(a, b, c, d, P[0][0], P[0][1]); x.drawImage(img, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0); }
    function spr(px, py, sz, al) { x.globalAlpha = Math.max(0, Math.min(1, al)); x.drawImage(cbSprite, px - sz, py - sz, sz * 2, sz * 2); }
    function draw(now, dt, t) {
      var S = Math.min(W, H) * (o.scale || 0.2), shx = 0, shy = 0, sc = 1;
      if (st === "charge") { var k = Math.min(1, (now - stT) / CH); spin = 1 + k * k * 7; boost = k * 1.25; shakeK = k * k * (calm ? 0 : 5) * dpr; sc = 1 + 0.05 * Math.sin(k * 38 * k) * k; shx = (Math.random() - 0.5) * 2 * shakeK; shy = (Math.random() - 0.5) * 2 * shakeK; if (k >= 1) { st = "burst"; stT = now; hidden = true; spawnBurst(S); if (burstCb) burstCb(); } }
      else if (st === "burst") { boost = Math.max(0, boost - dt / 500); spin = 1; }
      yaw += dt / 1000 * 0.32 * spin;
      var pit = 0.5 + 0.1 * Math.sin(t * 0.5), rol = 0.08 * Math.sin(t * 0.37), cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit), cr = Math.cos(rol), sr = Math.sin(rol);
      function R(px, py, pz) { var x1 = px * cyw + pz * syw, z1 = -px * syw + pz * cyw, y2 = py * cp - z1 * sp, z2 = py * sp + z1 * cp; return [x1 * cr - y2 * sr, x1 * sr + y2 * cr, z2]; }
      var cx = W / 2 + shx, cy = H * (o.cy || 0.5) + Math.sin(t * 1.15) * S * 0.06 + shy, S2 = S * sc;
      function Pj(v, flat) { var k2 = flat ? 1 : 8 / (8 - v[2]); return [cx + v[0] * S2 * k2, cy - v[1] * S2 * k2, v[2], k2]; }
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.globalAlpha = 1;
      x.globalCompositeOperation = "lighter";
      var hg = x.createRadialGradient(cx, cy, 0, cx, cy, S * 3.1), ha = (hidden ? 0.1 : 0.2 + 0.07 * Math.sin(t * 1.3)) + boost * 0.22;
      hg.addColorStop(0, "rgba(140,70,255," + Math.min(0.9, ha).toFixed(3) + ")"); hg.addColorStop(0.5, "rgba(90,30,200," + (ha * 0.35).toFixed(3) + ")"); hg.addColorStop(1, "rgba(60,10,160,0)"); x.fillStyle = hg; x.fillRect(0, 0, W, H);
      if (!hidden) { x.save(); x.translate(cx, cy + S * 2.35 - Math.sin(t * 1.15) * S * 0.05); x.scale(1, 0.2); var sg = x.createRadialGradient(0, 0, 0, 0, 0, S * 1.5); sg.addColorStop(0, "rgba(120,60,240,.32)"); sg.addColorStop(1, "rgba(60,20,160,0)"); x.fillStyle = sg; x.beginPath(); x.arc(0, 0, S * 1.5, 0, 6.2832); x.fill(); x.restore(); }
      // partículas cósmicas
      var front = [], p, pp, v, q;
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.a += p.sp * dt / 1000 * (0.6 + spin * 0.4);
        var X = Math.cos(p.a) * p.r, Z = Math.sin(p.a) * p.r, Y = p.y + Math.sin(p.a * 2 + p.ph) * 0.18, X2 = X * 0.94 - Y * 0.34, Y2 = X * 0.34 + Y * 0.94;
        pp = Pj([X2, Y2, Z]); p.px = pp[0]; p.py = pp[1]; p.d = pp[3];
        if (Z < 0) { if (!hidden || st === "burst") { spr(p.px, p.py, p.s * 5 * dpr * p.d, (0.28 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.2 + p.ph))) * 0.7); } } else front.push(p);
      }
      x.globalAlpha = 1;
      if (!hidden) {
        var V = [], vx, vy, vz;
        for (vx = -1; vx <= 1; vx += 2) for (vy = -1; vy <= 1; vy += 2) for (vz = -1; vz <= 1; vz += 2) V.push(Pj(R(vx, vy, vz), 1));
        var ll = Math.hypot(Math.cos(t * 0.7) * 0.7, 0.55, 0.55 + 0.35 * Math.sin(t * 0.7)), L = [Math.cos(t * 0.7) * 0.7 / ll, 0.55 / ll, (0.55 + 0.35 * Math.sin(t * 0.7)) / ll];
        for (var f = 0; f < 6; f++) {
          var F = CB_FACES[f], nr = R(F.n[0], F.n[1], F.n[2]); if (nr[2] <= 0.02) continue;
          var P = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(function (ab) { return Pj(R(F.n[0] + ab[0] * F.u[0] + ab[1] * F.v[0], F.n[1] + ab[0] * F.u[1] + ab[1] * F.v[1], F.n[2] + ab[0] * F.u[2] + ab[1] * F.v[2]), 1); });
          var df = Math.max(0, nr[0] * L[0] + nr[1] * L[1] + nr[2] * L[2]);
          x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; tf(P, tex.base[f]);
          x.fillStyle = "rgba(2,0,8," + (0.6 * (1 - df)).toFixed(3) + ")"; quad(P); x.fill();
          x.globalCompositeOperation = "lighter";
          var sgd = x.createLinearGradient(P[0][0], P[0][1], P[2][0], P[2][1]), sp0 = ((t * 0.2 + f * 0.17) % 1.6) - 0.3, c0 = Math.max(0, Math.min(1, sp0 - 0.14)), c1 = Math.max(0, Math.min(1, sp0)), c2 = Math.max(0, Math.min(1, sp0 + 0.14));
          sgd.addColorStop(c0, "rgba(190,150,255,0)"); sgd.addColorStop(c1, "rgba(200,165,255," + (0.18 * df).toFixed(3) + ")"); sgd.addColorStop(c2, "rgba(190,150,255,0)"); x.fillStyle = sgd; quad(P); x.fill();
          x.globalAlpha = Math.min(1, 0.5 + 0.35 * Math.sin(t * 1.7 + f * 1.1) + boost * 0.55); tf(P, tex.glow[f]); x.globalAlpha = 1;
          if (boost > 0.02) { x.fillStyle = "rgba(220,190,255," + Math.min(0.5, boost * 0.2).toFixed(3) + ")"; quad(P); x.fill(); }
          x.globalCompositeOperation = "source-over"; x.strokeStyle = "rgba(175,135,255," + (0.28 + 0.45 * df).toFixed(3) + ")"; x.lineWidth = 1.4 * dpr; quad(P); x.stroke();
        }
        // rayos de energía entre vértices
        if (!calm && st !== "burst" && now > nextArc) { var a1 = V[Math.random() * 8 | 0], a2 = V[Math.random() * 8 | 0]; if (a1 !== a2) { var pts = [], nn = 8, qq; for (qq = 0; qq <= nn; qq++) { var tt = qq / nn, jit = (qq === 0 || qq === nn) ? 0 : (Math.random() - 0.5) * S * 0.3; pts.push([a1[0] + (a2[0] - a1[0]) * tt + jit, a1[1] + (a2[1] - a1[1]) * tt + jit * 0.6]); } arcs.push({ pts: pts, t0: now }); } nextArc = now + (st === "charge" ? 250 : 900 + Math.random() * 1700); }
        x.globalCompositeOperation = "lighter";
        arcs = arcs.filter(function (ar) { var a = 1 - (now - ar.t0) / 240; if (a <= 0) return false; x.globalAlpha = a; x.lineJoin = "round"; x.strokeStyle = "rgba(150,90,255,.7)"; x.lineWidth = 4 * dpr; x.beginPath(); ar.pts.forEach(function (pt, i2) { if (i2) x.lineTo(pt[0], pt[1]); else x.moveTo(pt[0], pt[1]); }); x.stroke(); x.strokeStyle = "#fff"; x.lineWidth = 1.3 * dpr; x.stroke(); return true; });
        x.globalAlpha = 1;
      }
      x.globalCompositeOperation = "lighter";
      for (i = 0; i < front.length; i++) { p = front[i]; spr(p.px, p.py, p.s * 5 * dpr * p.d, (0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.2 + p.ph)))); }
      // estallido: esquirlas y onda
      if (st === "burst" || shards.length) {
        var bt = (now - stT) / 1000;
        if (ring && bt < 1.1) { x.globalAlpha = Math.max(0, 1 - bt / 1.1) * 0.8; x.strokeStyle = "rgba(190,140,255,1)"; x.lineWidth = 3 * dpr; x.beginPath(); x.arc(ring.x, ring.y, S * (1 + bt * 5.5), 0, 6.2832); x.stroke(); }
        shards = shards.filter(function (sh) { sh.life -= dt / 1000; if (sh.life <= 0) return false; sh.x += sh.vx * dt / 1000; sh.y += sh.vy * dt / 1000; sh.vy += 120 * dpr * dt / 1000; sh.r += sh.vr * dt / 1000; var al = Math.min(1, sh.life * 1.4);
          x.globalCompositeOperation = "source-over"; x.globalAlpha = al; x.save(); x.translate(sh.x, sh.y); x.rotate(sh.r); x.fillStyle = "#0b0616"; x.strokeStyle = "rgba(180,130,255,.9)"; x.lineWidth = 1.2 * dpr; x.beginPath(); x.moveTo(-sh.s, sh.s * 0.6); x.lineTo(sh.s * 0.2, -sh.s); x.lineTo(sh.s, sh.s * 0.5); x.closePath(); x.fill(); x.stroke(); x.restore(); return true; });
      }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    }
    function spawnBurst(S) {
      ring = { x: W / 2, y: H * (o.cy || 0.5) };
      for (var i = 0; i < 38; i++) { var a = Math.random() * 6.2832, sp = (180 + Math.random() * 420) * dpr; shards.push({ x: ring.x, y: ring.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80 * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: (5 + Math.random() * 12) * dpr, life: 1.1 + Math.random() * 0.9 }); }
    }
    function frame(now) {
      raf = 0; if (!run) return;
      if (!cv.isConnected) { if (++miss > 8) { stop(); return; } raf = requestAnimationFrame(frame); return; }
      miss = 0;
      if (document.hidden || (o.fps && now - lastDraw < 1000 / o.fps)) { raf = requestAnimationFrame(frame); return; }
      var dt = Math.min(50, now - last); last = now; lastDraw = now;
      draw(now, dt, (now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function stop() { run = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); }
    raf = requestAnimationFrame(frame);
    return { charge: function (cb) { if (st !== "idle") return; st = "charge"; stT = performance.now(); burstCb = cb; }, stop: stop };
  }
  /* pin exclusivo: medalla de metal oscuro con engarces violetas y, dentro, un cubo de obsidiana con grietas de energía */
  function cbPinSvg(px) {
    if (!MX_CB_ON) return cbPinSilSvg(px);
    var u = "cp" + (++pinN), rim = "", i, a, R;
    for (i = 0; i < 32; i++) { a = (i * 11.25 - 90) * Math.PI / 180; R = i % 2 ? 21.6 : 23.6; rim += (i ? "L" : "M") + (24 + R * Math.cos(a)).toFixed(2) + " " + (24 + R * Math.sin(a)).toFixed(2); }
    rim += "Z";
    var gems = "";
    [[24, 3.1], [44.9, 24], [24, 44.9], [3.1, 24]].forEach(function (g, k) { gems += '<circle cx="' + g[0] + '" cy="' + g[1] + '" r="1.5" fill="url(#' + u + 'm)" stroke="#2a0f55" stroke-width=".4"/><circle cx="' + (g[0] - 0.4) + '" cy="' + (g[1] - 0.4) + '" r=".45" fill="#fff" fill-opacity=".85"/>'; });
    var cr = "M24 25L21.6 29.6L24.8 33L22.6 38.6M24 25L29.2 27.2L33.4 25.6M24 25L20 21.6L15.6 22.4M29.6 16L26.6 19.4";
    return '<svg class="pin" width="' + px + '" height="' + px + '" viewBox="-2 -2 52 52" aria-hidden="true"><defs>'
      + '<linearGradient id="' + u + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e6ff"/><stop offset=".3" stop-color="#a97bff"/><stop offset=".62" stop-color="#4b1fa8"/><stop offset="1" stop-color="#1c0a45"/></linearGradient>'
      + '<radialGradient id="' + u + 'd" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#3b1a7a"/><stop offset=".55" stop-color="#150a33"/><stop offset="1" stop-color="#05020c"/></radialGradient>'
      + '<radialGradient id="' + u + 'm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f0e0ff"/><stop offset=".5" stop-color="#a45bff"/><stop offset="1" stop-color="#4a15b0"/></radialGradient>'
      + '<linearGradient id="' + u + 't" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a2a8e"/><stop offset="1" stop-color="#1a0d3a"/></linearGradient>'
      + '<linearGradient id="' + u + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0c38"/><stop offset="1" stop-color="#05020d"/></linearGradient>'
      + '<linearGradient id="' + u + 'q" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1458"/><stop offset="1" stop-color="#070310"/></linearGradient>'
      + '<linearGradient id="' + u + 'e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d4ff"/><stop offset="1" stop-color="#8a4cff"/></linearGradient>'
      + '<filter id="' + u + 'g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.15"/></filter></defs>'
      + '<path d="' + rim + '" fill="url(#' + u + 'r)" stroke="#12062b" stroke-width=".5" stroke-linejoin="round"/>'
      + '<circle cx="24" cy="24" r="19.6" fill="#0a0418" stroke="#d9c2ff" stroke-opacity=".55" stroke-width=".5"/><circle cx="24" cy="24" r="18.6" fill="url(#' + u + 'd)"/>'
      + '<g fill="#fff"><circle cx="11" cy="13" r=".5" fill-opacity=".8"/><circle cx="37.5" cy="12" r=".4" fill-opacity=".7"/><circle cx="9.6" cy="31" r=".35" fill-opacity=".6"/><circle cx="38.6" cy="33.4" r=".5" fill-opacity=".75"/><circle cx="31" cy="8.6" r=".3" fill-opacity=".6"/><circle cx="16.4" cy="40.4" r=".35" fill-opacity=".6"/></g>'
      + '<ellipse cx="24" cy="25" rx="19" ry="6.4" transform="rotate(-24 24 25)" fill="none" stroke="#b57bff" stroke-opacity=".38" stroke-width=".5" stroke-dasharray="1.4 1.8"/>'
      + '<circle cx="24" cy="38.5" r="4.2" fill="#8a3cff" fill-opacity=".55" filter="url(#' + u + 'g)"/>'
      + '<path d="M24 10.2L36.6 17.5L24 24.8L11.4 17.5Z" fill="url(#' + u + 't)"/><path d="M11.4 17.5L24 24.8V39.4L11.4 32Z" fill="url(#' + u + 'l)"/><path d="M24 24.8L36.6 17.5V32L24 39.4Z" fill="url(#' + u + 'q)"/>'
      + '<path d="M15.4 15.2L24 10.2L30 13.6L21.6 18.6Z" fill="#fff" fill-opacity=".13"/><path d="M26.4 22L34 17.7V21.6L26.4 26Z" fill="#fff" fill-opacity=".07"/>'
      + '<path d="' + cr + '" fill="none" stroke="#8a3cff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#' + u + 'g)"/>'
      + '<path d="' + cr + '" fill="none" stroke="#f1e3ff" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M24 10.2L36.6 17.5V32L24 39.4L11.4 32V17.5Z" fill="none" stroke="url(#' + u + 'e)" stroke-width=".9" stroke-linejoin="round"/><path d="M11.4 17.5L24 24.8L36.6 17.5M24 24.8V39.4" fill="none" stroke="#b57bff" stroke-opacity=".75" stroke-width=".6"/>'
      + '<path d="M24 15.4l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z" fill="#fff" fill-opacity=".95"/>'
      + '<path d="M38.4 9.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="#e9d9ff"/><circle cx="8.8" cy="20.4" r=".55" fill="#d9c2ff"/>'
      + gems
      + '<path d="M9.6 8.4A21 21 0 0 1 24 2.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/></svg>';
  }
  /* mientras el cubo no esté disponible, su pin y su tarjeta son solo una silueta con un «?» */
  function cbPinSilSvg(px) {
    return '<svg class="pin" width="' + px + '" height="' + px + '" viewBox="-2 -2 52 52" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#120a26" stroke="#3a2a66" stroke-width="1"/><circle cx="24" cy="24" r="18.5" fill="#080413"/>'
      + '<text x="24" y="31.5" text-anchor="middle" font-size="22" font-weight="800" fill="#5b3fa8" font-family="system-ui,sans-serif">?</text></svg>';
  }
  function cbSilhouette() {
    var d = mk("div", "mx-cbsil");
    d.innerHTML = '<svg viewBox="0 0 200 170" aria-hidden="true"><defs><radialGradient id="cbsg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7a3cff" stop-opacity=".55"/><stop offset="1" stop-color="#7a3cff" stop-opacity="0"/></radialGradient></defs>'
      + '<circle cx="100" cy="85" r="84" fill="url(#cbsg)" stroke="none" style="stroke:none"/>'
      + '<circle cx="100" cy="85" r="60" fill="#07030f" stroke="#6a4cc0" stroke-opacity=".5" stroke-width="1.6"/>'
      + '<circle cx="100" cy="85" r="50" fill="none" stroke="#6a4cc0" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="3 5"/>'
      + '<text x="100" y="109" text-anchor="middle" font-size="64" font-weight="800" fill="#c9a6ff" fill-opacity=".9" font-family="system-ui,sans-serif" style="stroke:none">?</text></svg>';
    return d;
  }
  /* tarjeta de la pestaña «Sobres y marco»: cubo flotando, cuántos tenés y botón para abrirlo */
  function mxCubeCard(box, m, test) {
    var n = mxCbN(m), card = mk("div", "mx-card mx-cbcard"), cv = MX_CB_ON ? mk("canvas", "mx-cbpv") : cbSilhouette();
    card.appendChild(cv);
    var hd = mk("div", "mx-cbhd"); hd.appendChild(mk("b", null, MX_CB_ON ? "Cubo del Destino" : "???")); hd.appendChild(mk("em", null, !MX_CB_ON ? "Próximamente" : n ? "Tenés " + n : "Artefacto especial")); card.appendChild(hd);
    card.appendChild(mk("p", "mx-note", !MX_CB_ON ? "Algo misterioso está en camino al evento. Muy pronto vas a poder descubrirlo." : "Probabilidad fija del " + MX_CB_P + " % de conseguir un pin exclusivo que no sale en ningún sobre. Si el destino no acompaña, recibís ⭐ " + MX_CB_LOSE.st + ", " + MX_CB_LOSE.xp + " XP y " + MX_CB_LOSE.sx + " puntos SEIS."));
    var bt = mk("button", "mx-btn mx-cbbtn", !MX_CB_ON ? "Próximamente" : n ? "Abrir el cubo" : "Se gana en el Camino SEIS · nivel 8"); bt.type = "button"; bt.disabled = !MX_CB_ON || test || !n;
    bt.addEventListener("click", function () { mxCubeOpenUi(); }); card.appendChild(bt); box.appendChild(card);
    if (MX_CB_ON) requestAnimationFrame(function () { if (cv.isConnected) mxCubeMake(cv, { calm: calmOn(), fps: 30, scale: 0.26, cy: 0.5 }); });
  }
  function mxCubeOpenUi() {
    var m = getMax(); if (!MX_CB_ON || mxCbN(m) < 1 || mxPkBusy || !$("max")) return; mxPkBusy = true;
    var calm = calmOn(), tms = [], ov = mk("div", "mx-cbo"), cube;
    function later(f, ms) { tms.push(setTimeout(f, calm ? Math.min(ms, 120) : ms)); }
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Cubo del Destino");
    ov.appendChild(mk("div", "mx-cbs"));
    var cv = mk("canvas", "mx-cbc"); ov.appendChild(cv);
    var top = mk("div", "mx-cbt"), xb = mk("button", "mx-cbx", "✕"); xb.type = "button"; xb.setAttribute("aria-label", "Cerrar"); top.appendChild(xb); ov.appendChild(top);
    var ttl = mk("h2", "mx-cbh", "Cubo del Destino"), pr = mk("p", "mx-cbp", "Probabilidad fija: " + MX_CB_P + " %"), sub = mk("p", "mx-cbq", "Pin exclusivo «Cubo del Destino»");
    var acts = mk("div", "mx-cba"), go = mk("button", "mx-cbg", "Abrir el cubo"); go.type = "button"; acts.appendChild(go);
    ov.appendChild(ttl); ov.appendChild(pr); ov.appendChild(sub); ov.appendChild(acts);
    $("max").appendChild(ov); $("max").classList.add("pkopen");
    cube = mxCubeMake(cv, { calm: calm, scale: 0.22, cy: 0.36 });
    function close() { cube.stop(); tms.forEach(clearTimeout); ov.remove(); $("max").classList.remove("pkopen"); mxPkBusy = false; mxRender(); }
    xb.addEventListener("click", close);
    go.addEventListener("click", function () {
      if (go.disabled) return; go.disabled = true;
      /* el resultado se decide y se guarda al empezar, así cerrar a medias no sirve para repetir la tirada */
      var mm = getMax(); if (mxCbN(mm) < 1) { close(); return; }
      mm.cb--; if (!mm.pins) mm.pins = {};
      var win = rand01() * 100 < MX_CB_P, dup = win && !!mm.pins[MX_CB_PIN];
      if (win && !dup) mm.pins[MX_CB_PIN] = Date.now();
      if (!win || dup) { mxSxAdd(mm, MX_CB_LOSE.sx, true); grantXp(MX_CB_LOSE.xp, MX_CB_LOSE.st); }
      maxSave(); $("mxBal").textContent = "⭐ " + fmtMx(getMax().stars);
      ov.classList.add("charging");
      cube.charge(function () {
        var fl = mk("div", "mx-cbfl"); ov.appendChild(fl); later(function () { fl.remove(); }, 1200);
        later(function () { reveal(win, dup); }, calm ? 0 : 650);
      });
    });
    function reveal(win, dup) {
      ov.classList.remove("charging"); ov.classList.add("shown"); acts.textContent = "";
      var rv = mk("div", "mx-cbr"), h = mk("h3", "mx-cbrh", win ? "¡El destino te sonríe!" : "El destino guardó silencio");
      rv.appendChild(h);
      if (win) {
        var pn = mk("div", "mx-cbpn"); pn.innerHTML = '<i class="rays"></i><span class="art">' + cbPinSvg(150) + '</span>'; rv.appendChild(pn);
        rv.appendChild(mk("b", "mx-cbpnn", "Cubo del Destino")); rv.appendChild(mk("span", "mx-cbpnr", "Mítico"));
        rv.appendChild(mk("p", "mx-cbrt", dup ? "Ya lo tenías en tu colección" : "Pin exclusivo conseguido"));
      } else rv.appendChild(mk("p", "mx-cbrt", "Esta vez no salió el pin. Tu premio de consuelo:"));
      if (!win || dup) { var rw = mk("div", "mx-cbrw"); [["⭐ " + fmtMx(MX_CB_LOSE.st), "Estrellas"], ["+" + MX_CB_LOSE.xp, "XP"], ["+" + MX_CB_LOSE.sx, "Puntos SEIS"]].forEach(function (r) { var c = mk("div"); c.appendChild(mk("b", null, r[0])); c.appendChild(mk("small", null, r[1])); rw.appendChild(c); }); rv.appendChild(rw); }
      ov.insertBefore(rv, acts);
      var more = mxCbN(getMax());
      if (win && !dup) { var eq = mk("button", "mx-cbg alt", "Equipar pin"); eq.type = "button"; eq.addEventListener("click", function () { var q = getMax(); q.eq.pin = MX_CB_PIN; maxSave(); toast("Pin equipado: Cubo del Destino"); try { renderProfile(); renderMenu(); } catch (e) { } eq.disabled = true; eq.textContent = "Equipado ✓"; }); acts.appendChild(eq); }
      if (more) { var nx = mk("button", "mx-cbg", "Abrir otro cubo (" + more + ")"); nx.type = "button"; nx.addEventListener("click", function () { cube.stop(); tms.forEach(clearTimeout); ov.remove(); $("max").classList.remove("pkopen"); mxPkBusy = false; mxCubeOpenUi(); }); acts.appendChild(nx); }
      var cl = mk("button", "mx-cbg alt", "Cerrar"); cl.type = "button"; cl.addEventListener("click", close); acts.appendChild(cl);
    }
  }
