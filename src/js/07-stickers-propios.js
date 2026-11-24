  /* ---------- editor de stickers propios ---------- */
  var se = null, SE_PEN = ["#ffffff", "#111111", "#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#9b5de5", "#f97316"];
  var SE_FILLS = ["#ffffff", "#ffd166", "#ff7b9c", "#7cf2c8", "#7cc7ff", "#b69cff", "#1b1b3a"];
  var SE_SHAPE_N = { none: "Sin forma", circle: "Círculo", round: "Cuadrado", star: "Estrella", heart: "Corazón", hex: "Hexágono" };
  var SE_ANIM_N = { none: "Quieto", float: "Flotar", pulse: "Latir", sway: "Balancear", spin: "Girar", glow: "Brillar", bounce: "Rebotar" };
  function stkPath(c, sh, x, y, w, h) {
    var cx = x + w / 2, cy = y + h / 2, i, a, r;
    c.beginPath();
    if (sh === "circle") c.ellipse(cx, cy, w / 2, h / 2, 0, 0, 6.2832);
    else if (sh === "round") { r = w * 0.22; c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    else if (sh === "star") { for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; r = (i % 2 ? 0.42 : 1) * w / 2; if (i) c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); }
    else if (sh === "heart") { c.moveTo(cx, y + h * 0.92); c.bezierCurveTo(x - w * 0.1, y + h * 0.58, x + w * 0.02, y + h * 0.04, cx, y + h * 0.3); c.bezierCurveTo(x + w * 0.98, y + h * 0.04, x + w * 1.1, y + h * 0.58, cx, y + h * 0.92); c.closePath(); }
    else if (sh === "hex") { for (i = 0; i < 6; i++) { a = -Math.PI / 2 + i * Math.PI / 3; if (i) c.lineTo(cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2); else c.moveTo(cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2); } c.closePath(); }
    else c.rect(x, y, w, h);
  }
  /* dibuja el sticker en un canvas de S×S px: caja central del 76% y margen para el brillo */
  function stkDraw(p, S, img, layer) {
    var cv = document.createElement("canvas"); cv.width = cv.height = S;
    var c = cv.getContext("2d"), k = S / 512, B = S * 0.76, o = (S - B) / 2, shape = p.sh !== "none", glow = false, gl = p.gl * k * 1.1;
    function shadow(col) { if (gl > 0) { c.shadowColor = col; c.shadowBlur = gl; } }
    function noShadow() { c.shadowColor = "transparent"; c.shadowBlur = 0; }
    var gcol = p.bc || "#ffffff";
    if (shape && p.f1) {
      var g = c.createLinearGradient(o, o, o + B, o + B); g.addColorStop(0, p.f1); g.addColorStop(1, p.f2 || p.f1);
      stkPath(c, p.sh, o, o, B, B); c.fillStyle = g; shadow(p.f2 || p.f1); c.fill(); noShadow(); glow = true;
    }
    c.save();
    var clip = shape || p.src === "photo";
    if (clip) { stkPath(c, shape ? p.sh : "none", o, o, B, B); c.clip(); }
    else if (!glow) shadow(gcol);
    if (p.src === "draw") { if (layer) c.drawImage(layer, o, o, B, B); }
    else if (p.src === "photo") {
      if (img) {
        var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, sc = Math.max(B / iw, B / ih) * p.z;
        c.drawImage(img, o + B / 2 - iw * sc / 2 + p.px * B / 2, o + B / 2 - ih * sc / 2 + p.py * B / 2, iw * sc, ih * sc);
      }
    } else if (p.tx) {
      c.font = "700 100px system-ui, 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      var ms = Math.max(1, c.measureText(p.tx).width), fs = 100 * Math.min(B * 0.62 * p.z / 100, B * 0.88 * p.z / ms);
      c.font = "700 " + fs + "px system-ui, 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif"; c.fillStyle = p.tc; c.fillText(p.tx, o + B / 2, o + B / 2 + fs * 0.04);
    }
    c.restore(); noShadow();
    if (shape && p.bw > 0) {
      stkPath(c, p.sh, o, o, B, B); c.lineWidth = p.bw * k; c.strokeStyle = p.bc; c.lineJoin = "round"; if (!glow) { shadow(p.bc); glow = true; } c.stroke(); noShadow();
    }
    return cv;
  }
  function seLayerRedraw() {
    var c = se.layer.getContext("2d"); c.clearRect(0, 0, 512, 512);
    if (se.base) c.drawImage(se.base, 0, 0, 512, 512);
    se.strokes.forEach(function (s) { sePaint(c, s, 0); });
  }
  function sePaint(c, s, from) {
    c.globalCompositeOperation = s.e ? "destination-out" : "source-over"; c.strokeStyle = s.c; c.fillStyle = s.c; c.lineWidth = s.w; c.lineCap = "round"; c.lineJoin = "round";
    if (s.p.length === 1) { c.beginPath(); c.arc(s.p[0][0], s.p[0][1], s.w / 2, 0, 6.2832); c.fill(); }
    else { c.beginPath(); var f = Math.max(1, from); c.moveTo(s.p[f - 1][0], s.p[f - 1][1]); for (var i = f; i < s.p.length; i++) c.lineTo(s.p[i][0], s.p[i][1]); c.stroke(); }
    c.globalCompositeOperation = "source-over";
  }
  function seRender() {
    if (!se) return;
    var pc = $("sePrev"), x = pc.getContext("2d"); x.clearRect(0, 0, 512, 512);
    var full = stkDraw(se.p, 512, se.img, se.layer); x.drawImage(full, 0, 0);
    var mc = $("seMini").getContext("2d"); mc.clearRect(0, 0, 128, 128); mc.drawImage(full, 0, 0, 128, 128);
  }
  var seRaf = 0;
  function seSoon() { if (seRaf) return; seRaf = requestAnimationFrame(function () { seRaf = 0; seRender(); }); }
  function seTools() {
    var T = $("seTools"), p = se.p; T.textContent = "";
    function chip(label, attrs, on) { var b = el("button", "chip"); b.type = "button"; b.textContent = label; for (var k in attrs) b.dataset[k] = attrs[k]; b.setAttribute("aria-pressed", on ? "true" : "false"); return b; }
    $("seSrc").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.k === p.src ? "true" : "false"); });
    $("sePrev").classList.toggle("drawing", p.src === "draw");
    var row = el("div", "setools");
    if (p.src === "draw") {
      SE_PEN.forEach(function (c0) { var b = el("button", "sw"); b.type = "button"; b.style.background = c0; b.dataset.pen = c0; b.setAttribute("aria-label", "Color " + c0); b.setAttribute("aria-pressed", c0 === se.color && !se.erase ? "true" : "false"); row.appendChild(b); });
      var r2 = el("div", "setools");
      [["Fino", 5], ["Medio", 12], ["Grueso", 26]].forEach(function (s) { r2.appendChild(chip(s[0], { sz: s[1] }, se.size === s[1])); });
      r2.appendChild(chip("Goma", { er: 1 }, se.erase));
      var u = el("button", "chip"); u.type = "button"; u.id = "seUndo"; u.textContent = "↶ Deshacer"; r2.appendChild(u);
      var cl = el("button", "chip"); cl.type = "button"; cl.id = "seClear"; cl.textContent = "Borrar todo"; r2.appendChild(cl);
      T.appendChild(row); T.appendChild(r2);
    } else if (p.src === "photo") {
      var pick = el("button", "btn"); pick.type = "button"; pick.id = "sePick"; pick.textContent = "Elegir foto"; row.appendChild(pick);
      var cam = el("button", "btn"); cam.type = "button"; cam.id = "seCam"; cam.textContent = "Cámara"; row.appendChild(cam);
      T.appendChild(row);
      [["Zoom", "seZoom", 1, 4, 0.05, p.z], ["Mover ↔", "sePx", -1, 1, 0.02, p.px], ["Mover ↕", "sePy", -1, 1, 0.02, p.py]].forEach(function (s) {
        var l = el("label", "flabel"); l.htmlFor = s[1]; l.textContent = s[0]; var i = el("input"); i.type = "range"; i.id = s[1]; i.min = s[2]; i.max = s[3]; i.step = s[4]; i.value = s[5]; i.dataset.rg = s[1];
        T.appendChild(l); T.appendChild(i);
      });
    } else {
      var t = el("input"); t.type = "text"; t.id = "seTx"; t.maxLength = 12; t.placeholder = "Emoji o texto (hasta 12)"; t.value = p.tx; t.setAttribute("aria-label", "Emoji o texto"); t.autocomplete = "off"; t.className = "pfname"; row.appendChild(t);
      var tc = el("input"); tc.type = "color"; tc.id = "seTc"; tc.value = p.tc; tc.setAttribute("aria-label", "Color del texto"); row.appendChild(tc);
      T.appendChild(row);
      var l2 = el("label", "flabel"); l2.htmlFor = "seTz"; l2.textContent = "Tamaño"; var z = el("input"); z.type = "range"; z.id = "seTz"; z.min = 0.4; z.max = 1.6; z.step = 0.05; z.value = p.z; z.dataset.rg = "seTz";
      T.appendChild(l2); T.appendChild(z);
    }
  }
  function seStyleUi() {
    var p = se.p, sh = $("seShape"); sh.textContent = "";
    STK_SHAPES.forEach(function (s) { var b = el("button", "chip"); b.type = "button"; b.dataset.sh = s; b.textContent = SE_SHAPE_N[s]; b.setAttribute("aria-pressed", p.sh === s ? "true" : "false"); sh.appendChild(b); });
    var fl = $("seFill"); fl.textContent = "";
    var no = el("button", "chip"); no.type = "button"; no.dataset.f = ""; no.textContent = "Sin relleno"; no.setAttribute("aria-pressed", p.f1 ? "false" : "true"); fl.appendChild(no);
    SE_FILLS.forEach(function (c0) { var b = el("button", "sw"); b.type = "button"; b.style.background = c0; b.dataset.f = c0; b.setAttribute("aria-label", "Relleno " + c0); b.setAttribute("aria-pressed", p.f1 === c0 && !p.f2 ? "true" : "false"); fl.appendChild(b); });
    $("seF1").value = p.f1 || "#6d5dfc"; $("seF2").value = p.f2 || "#c084fc";
    $("seNoGrad").setAttribute("aria-pressed", p.f2 ? "false" : "true");
    $("seBw").value = p.bw; $("seBc").value = p.bc; $("seGl").value = p.gl;
    var an = $("seAnim"); an.textContent = "";
    STK_ANIMS.forEach(function (s) { var b = el("button", "chip"); b.type = "button"; b.dataset.an = s; b.textContent = SE_ANIM_N[s]; b.setAttribute("aria-pressed", p.an === s ? "true" : "false"); an.appendChild(b); });
    $("seMiniBox").className = "semini" + (p.an !== "none" ? " a-" + p.an : "");
  }
  function openStkEd(id) {
    if (!id && myStk.length >= STK_MAX) { toast("Ya tenés " + STK_MAX + " stickers: borrá alguno para crear otro"); return; }
    var base = id ? stkOf(id) : null;
    se = {
      id: id || "", p: base ? JSON.parse(JSON.stringify(base)) : cleanStk({ id: "tmp", n: "", src: "draw", sh: "circle", f1: "#6d5dfc", f2: "#c084fc", bw: 6, bc: "#ffffff", gl: 14, an: "float" }),
      layer: document.createElement("canvas"), base: null, strokes: [], cur: null, color: "#ffffff", size: 12, erase: false, img: null, photoBlob: null, url: ""
    };
    se.layer.width = se.layer.height = 512;
    if (!base) se.p.n = "Sticker " + (myStk.length + 1);
    $("seTitle").textContent = base ? "Editar sticker" : "Crear sticker";
    seTools(); seStyleUi(); $("seName").value = se.p.n; seRender();
    $("stkEd").hidden = false; pushLayer("stkEd");
    if (base) imgGet("stk:" + id + ":s").then(function (b) {
      if (!b || !se || se.id !== id) return;
      var u = URL.createObjectURL(b), im = new Image();
      im.onload = function () { if (!se || se.id !== id) return; if (se.p.src === "draw") { se.base = im; seLayerRedraw(); } else { se.img = im; se.photoBlob = b; } seRender(); };
      im.src = u; se.url = u;
    });
  }
  registerLayer("stkEd", function () { $("stkEd").hidden = true; if (se && se.url) { try { URL.revokeObjectURL(se.url); } catch {} } se = null; });
  function seSetSrc(k) {
    if (!se || se.p.src === k) return; se.p.src = k;
    se.p.z = 1; se.p.px = 0; se.p.py = 0;
    if (k === "text" && !se.p.tx) se.p.tx = "★";
    if (k === "photo" && se.p.sh === "none") se.p.sh = "round";
    seTools(); seStyleUi(); seRender();
  }
  function sePhoto(file) {
    if (!file || !se) return;
    shrinkImage(file).then(function (r) {
      if (!se) return;
      var u = URL.createObjectURL(r.blob), im = new Image();
      im.onload = function () { if (!se) return; if (se.url) { try { URL.revokeObjectURL(se.url); } catch {} } se.url = u; se.img = im; se.photoBlob = r.blob; se.p.src = "photo"; se.p.z = 1; se.p.px = 0; se.p.py = 0; if (se.p.sh === "none") se.p.sh = "round"; seTools(); seStyleUi(); seRender(); };
      im.src = u;
    }).catch(function () { toast("No se pudo abrir esa foto"); });
  }
  function seSave() {
    if (!se) return;
    var p = se.p;
    if (p.src === "draw" && !se.strokes.some(function (s) { return !s.e; }) && !se.base) { toast("Dibujá algo primero"); return; }
    if (p.src === "photo" && !se.img) { toast("Elegí una foto primero"); return; }
    if (p.src === "text" && !p.tx.trim()) { toast("Escribí un emoji o texto primero"); return; }
    var id = se.id || uid(), name = String($("seName").value || "").trim().slice(0, 24) || "Sticker";
    var st = cleanStk(Object.assign({}, p, { id: id, n: name, at: Date.now() }));
    var out = stkDraw(st, 512, se.img, se.layer), s0 = se;
    out.toBlob(function (blob) {
      if (!blob) { toast("No se pudo guardar el sticker"); return; }
      imgPut("stk:" + id, blob).then(function (ok) {
        if (ok === false && !imgMem.has("stk:" + id)) throw new Error("save");
        if (st.src === "draw") return new Promise(function (res) { s0.layer.toBlob(function (lb) { res(lb ? imgPut("stk:" + id + ":s", lb) : null); }, "image/png"); });
        if (st.src === "photo" && s0.photoBlob) return imgPut("stk:" + id + ":s", s0.photoBlob);
        return imgDel("stk:" + id + ":s");
      }).then(function () {
        var i = -1; myStk.forEach(function (m, j) { if (m.id === id) i = j; });
        if (i >= 0) myStk[i] = st; else myStk.unshift(st);
        saveStk(); smSel = id; return stkLoad(id, true);
      }).then(function () {
        closeLayer("stkEd"); toast("Sticker guardado"); setTimeout(stkChanged, 60);
      }).catch(function () { toast("No se pudo guardar el sticker. Revisá el espacio del teléfono"); });
    }, "image/png");
  }
  /* eventos del editor */
  $("stkEd").addEventListener("click", function (e) {
    if (e.target === $("stkEd")) { closeLayer("stkEd"); return; }
    if (!se) return;
    var b = e.target.closest("button"); if (!b) return;
    var d = b.dataset, p = se.p;
    if (d.k && b.parentNode.id === "seSrc") { seSetSrc(d.k); return; }
    if (d.pen) { se.color = d.pen; se.erase = false; seTools(); return; }
    if (d.sz) { se.size = Number(d.sz); seTools(); return; }
    if (d.er) { se.erase = !se.erase; seTools(); return; }
    if (b.id === "seUndo") { se.strokes.pop(); seLayerRedraw(); seRender(); return; }
    if (b.id === "seClear") { se.strokes = []; se.base = null; seLayerRedraw(); seRender(); return; }
    if (b.id === "sePick") { $("seFile").click(); return; }
    if (b.id === "seCam") { $("seCamIn").click(); return; }
    if (d.sh != null) { p.sh = d.sh; seStyleUi(); seRender(); return; }
    if (d.f != null) { p.f1 = d.f; if (d.f) p.f2 = ""; else p.f2 = ""; seStyleUi(); seRender(); return; }
    if (b.id === "seNoGrad") { p.f2 = ""; seStyleUi(); seRender(); return; }
    if (d.an != null) { p.an = d.an; seStyleUi(); return; }
    if (b.id === "seSave") { seSave(); return; }
  });
  $("stkEd").addEventListener("input", function (e) {
    if (!se) return;
    var t = e.target, p = se.p;
    if (t.id === "seF1") { p.f1 = stkCol(t.value); seStyleUi(); }
    else if (t.id === "seF2") { p.f2 = stkCol(t.value); if (!p.f1) p.f1 = stkCol($("seF1").value); seStyleUi(); }
    else if (t.id === "seBw") p.bw = Number(t.value);
    else if (t.id === "seBc") p.bc = stkCol(t.value) || "#ffffff";
    else if (t.id === "seGl") p.gl = Number(t.value);
    else if (t.id === "seTx") p.tx = t.value.slice(0, 12);
    else if (t.id === "seTc") p.tc = stkCol(t.value) || "#ffffff";
    else if (t.id === "seZoom" || t.id === "seTz") p.z = Number(t.value);
    else if (t.id === "sePx") p.px = Number(t.value);
    else if (t.id === "sePy") p.py = Number(t.value);
    else return;
    seSoon();
  });
  ["seFile", "seCamIn"].forEach(function (id) { $(id).addEventListener("change", function () { var f = $(id).files && $(id).files[0]; $(id).value = ""; sePhoto(f); }); });
  $("seClose").addEventListener("click", function () { closeLayer("stkEd"); });
  (function () {
    var pc = $("sePrev");
    function pos(e) { var r = pc.getBoundingClientRect(), B = 512 * 0.76, o = (512 - B) / 2; return [((e.clientX - r.left) / r.width * 512 - o) / B * 512, ((e.clientY - r.top) / r.height * 512 - o) / B * 512]; }
    pc.addEventListener("pointerdown", function (e) {
      if (!se || se.p.src !== "draw" || se.cur) return;
      try { pc.setPointerCapture(e.pointerId); } catch {}
      se.cur = { c: se.color, w: (se.erase ? se.size * 1.6 : se.size) * (512 / (512 * 0.76)) * 0.76, e: se.erase, p: [pos(e)] }; se.strokes.push(se.cur);
      sePaint(se.layer.getContext("2d"), se.cur, 0); seSoon(); e.preventDefault();
    });
    pc.addEventListener("pointermove", function (e) {
      if (!se || !se.cur) return;
      var n0 = se.cur.p.length; se.cur.p.push(pos(e)); sePaint(se.layer.getContext("2d"), se.cur, n0); seSoon();
    });
    function end() { if (se) se.cur = null; }
    pc.addEventListener("pointerup", end); pc.addEventListener("pointercancel", end);
  })();

  /* ---------- biblioteca "Mis stickers" ---------- */
  var smSel = "", smIntent = "", smDelArm = 0;
  function openStkMgr(intent) {
    smIntent = intent || ""; smSel = myStk.length ? myStk[0].id : "";
    if (smIntent === "icon" || smIntent === "bg" || smIntent === "note") { var cs = cur() && ((smIntent === "icon" && cur().icon) || ""); if (cs && cs.slice(0, 2) === "c:" && stkOf(cs.slice(2))) smSel = cs.slice(2); }
    smRender(); $("stkMgr").hidden = false; pushLayer("stkMgr");
  }
  registerLayer("stkMgr", function () { $("stkMgr").hidden = true; smDelArm = 0; });
  function smRender() {
    var g = $("smGrid"); g.textContent = "";
    if (smSel && !stkOf(smSel)) smSel = myStk.length ? myStk[0].id : "";
    myStk.forEach(function (s) {
      var b = el("button"); b.type = "button"; b.dataset.id = s.id; b.title = s.n; b.setAttribute("aria-label", s.n); b.setAttribute("aria-pressed", s.id === smSel ? "true" : "false");
      b.appendChild(iconSpan("c:" + s.id, "static")); var cap = el("span", "cap"); cap.textContent = s.n; b.appendChild(cap); g.appendChild(b);
    });
    var n = cur(), canUse = !!(n && !n.trashedAt && smSel), isText = !!(n && n.type === "text");
    $("smHint").textContent = myStk.length ? "Elegí un sticker y usalo como icono, fondo o imagen de la nota. Todo se guarda en este teléfono." : "Todavía no creaste ningún sticker. Dibujalo, hacelo con una foto o con un emoji y personalizalo como quieras.";
    $("smIcon").disabled = !canUse; $("smBg").disabled = !canUse; $("smNote").disabled = !(canUse && isText);
    $("smEdit").disabled = !smSel; $("smDup").disabled = !smSel || myStk.length >= STK_MAX; $("smDel").disabled = !smSel;
    $("smDel").textContent = smDelArm ? "¿Seguro? Tocá de nuevo" : "Borrar";
    ["smIcon", "smBg", "smNote"].forEach(function (id) { $(id).classList.toggle("primary", id === { icon: "smIcon", bg: "smBg", note: "smNote" }[smIntent]); });
    $("smAct").hidden = !myStk.length;
  }
  $("smGrid").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; smSel = b.dataset.id; smDelArm = 0; smRender(); });
  $("smClose").addEventListener("click", function () { closeLayer("stkMgr"); });
  $("stkMgr").addEventListener("click", function (e) { if (e.target === $("stkMgr")) closeLayer("stkMgr"); });
  $("smNew").addEventListener("click", function () { openStkEd(""); });
  $("smEdit").addEventListener("click", function () { if (smSel) openStkEd(smSel); });
  $("smIcon").addEventListener("click", function () { var id = smSel; closeLayer("stkMgr"); setTimeout(function () { setIcon("c:" + id); }, 260); });
  $("smBg").addEventListener("click", function () { var id = smSel; closeLayer("stkMgr"); setTimeout(function () { stkSetBg(id); }, 260); });
  $("smNote").addEventListener("click", function () { var id = smSel; closeLayer("stkMgr"); setTimeout(function () { stkInsert(id); }, 260); });
  $("smDup").addEventListener("click", function () {
    var s = stkOf(smSel); if (!s || myStk.length >= STK_MAX) return;
    var nid = uid(), c = cleanStk(Object.assign({}, s, { id: nid, n: (s.n + " 2").slice(0, 24), at: Date.now() }));
    Promise.all([imgGet("stk:" + s.id), imgGet("stk:" + s.id + ":s")]).then(function (r) {
      if (!r[0]) throw new Error("x");
      return imgPut("stk:" + nid, r[0]).then(function () { return r[1] ? imgPut("stk:" + nid + ":s", r[1]) : null; });
    }).then(function () { myStk.unshift(c); saveStk(); smSel = nid; return stkLoad(nid, true); }).then(function () { stkChanged(); toast("Sticker duplicado"); })
      .catch(function () { toast("No se pudo duplicar el sticker"); });
  });
  $("smDel").addEventListener("click", function () {
    if (!smSel) return;
    if (!smDelArm) { smDelArm = 1; smRender(); clearTimeout(smDel.t); smDel.t = setTimeout(function () { smDelArm = 0; if (!$("stkMgr").hidden) smRender(); }, 3500); return; }
    var id = smSel; smDelArm = 0; stkDelete(id);
  });
  var smDel = {};
  function stkDelete(id) {
    myStk = myStk.filter(function (s) { return s.id !== id; }); saveStk();
    imgDel("stk:" + id); imgDel("stk:" + id + ":s");
    if (stkUrls[id]) { try { URL.revokeObjectURL(stkUrls[id]); } catch {} delete stkUrls[id]; }
    var hit = 0;
    notes.forEach(function (n) {
      var ch = false, m = CU_RE.exec(n.bg || "");
      if (n.icon === "c:" + id) { n.icon = ""; ch = true; }
      if (m && m[1] === id) { n.bg = ""; ch = true; }
      if (ch) { n.updatedAt = Date.now(); hit++; }
    });
    if (hit) { persistNow(); renderAll(); }
    smSel = myStk.length ? myStk[0].id : ""; stkChanged(); toast("Sticker borrado");
  }
  function stkChanged() {
    renderList();
    if (activeId) { renderIconBtn(); renderBg(); }
    if (!$("stkMgr").hidden) smRender();
    if (!$("iconSheet").hidden) renderIconSheet();
    if (!$("sheet").hidden) renderSheet();
  }
  /* como fondo de la nota */
  function stkSetBg(id) {
    var n = cur(); if (!n || n.trashedAt || !stkOf(id)) return;
    n.bg = "c:" + id + ":c:60:70"; changed(n); persistNow(); renderBg(); renderList();
    if (!$("sheet").hidden) renderSheet(); else toast("Fondo aplicado. Podés ajustarlo en Personalizar");
  }
  function cuSet(patch) {
    var n = cur(); if (!n) return; var m = CU_RE.exec(n.bg || ""); if (!m) return;
    var mode = patch.m || m[2], size = patch.s != null ? patch.s : m[3], op = patch.o != null ? patch.o : m[4];
    n.bg = cleanBg("c:" + m[1] + ":" + mode + ":" + size + ":" + op); changed(n); renderBg();
  }
  /* dentro de la nota: se copia como imagen (se mueve, escala y gira como cualquier imagen) */
  function stkInsert(id) {
    var n = cur(); if (!n || n.type !== "text" || n.trashedAt || !stkOf(id)) return;
    if (n.images.length >= 30) { toast("Una nota admite hasta 30 imágenes"); return; }
    imgGet("stk:" + id).then(function (b) {
      if (!b) throw new Error("x");
      return addImageBlob(n, b, 512, 512, 0);
    }).then(function () {
      var it = n.images[n.images.length - 1]; if (it) { it.w = 0.3; it.cx = 0.5; }
      if (cur() === n) { renderImages(); persistNow(); toast("Sticker agregado. Arrastralo, escalalo o girarlo con los dedos"); }
    }).catch(function () { toast("No se pudo poner el sticker"); });
  }
  bodyEl.addEventListener("input", function () { if (cur() && cur().images.length) fitBody(); });
  bodyEl.addEventListener("focus", function () { if (selImg) selectImg(null); });
  window.addEventListener("resize", function () { fitBody(); });

  /* Historial propio (deshacer / rehacer): los cambios de la barra rompen el nativo */
  var hist = [], hi = 0, histTimer = 0;
  function undoBtns() { $("fmt").querySelector('[data-ins="undo"]').disabled = hi <= 0; $("fmt").querySelector('[data-ins="redo"]').disabled = hi >= hist.length - 1; }
  function histReset() { hist = [{ v: bodyEl.value, s: bodyEl.value.length }]; hi = 0; clearTimeout(histTimer); histTimer = 0; undoBtns(); }
  function histNow() {
    clearTimeout(histTimer); histTimer = 0;
    if (hist[hi] && hist[hi].v === bodyEl.value) return;
    hist = hist.slice(0, hi + 1); hist.push({ v: bodyEl.value, s: bodyEl.selectionStart }); if (hist.length > 200) hist.shift();
    hi = hist.length - 1; undoBtns();
  }
  function histSoon() { clearTimeout(histTimer); histTimer = setTimeout(histNow, 600); }
  function histGo(d) {
    histNow();
    var k = hi + d; if (k < 0 || k >= hist.length) return;
    hi = k; var h = hist[hi];
    bodyEl.value = h.v; bodyEl.setSelectionRange(h.s, h.s);
    var n = cur(); if (n) { n.body = h.v; changed(n); }
    undoBtns();
  }

  /* Vista de lectura: muestra el texto con formato (Markdown sencillo) */
  var readMode = false, readEl = $("read");
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function inline(t) {
    t = esc(t);
    var stash = [];
    function hold(h) { stash.push(h); return "\u0001" + (stash.length - 1) + "\u0002"; }
    t = t.replace(/`([^`\n]+)`/g, function (all, c) { return hold("<code>" + c + "</code>"); });
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (all, txt, url) { return hold('<a href="' + url + '" target="_blank" rel="noopener">' + txt + "</a>"); });
    t = t.replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "<del>$1</del>");
    t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<i>$2</i>");
    t = t.replace(/==(?:\{(amarillo|verde|rosa|celeste|naranja)\})?(?=\S)(.+?)(?<=\S)==/g, function (all, c, s) { return '<mark class="hl-' + (c || "amarillo") + '">' + s + "</mark>"; });
    t = t.replace(/\[\[([^\]\n]+?)\]\]/g, function (all, name) { return '<a class="wl' + (findByTitle(name.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")) ? "" : " missing") + '" data-t="' + name + '">' + name + "</a>"; });
    t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return t.replace(/\u0001(\d+)\u0002/g, function (all, i) { return stash[+i]; });
  }
  function mdHtml(src) {
    var out = [], lines = src.split("\n"), list = null, tbl = [], code = null;
    function close() { if (list) { out.push("</" + list + ">"); list = null; } }
    function flushTbl() {
      if (!tbl.length) return;
      var isSep = tbl.length > 1 && tbl[1].every(function (c) { return /^:?-{2,}:?$/.test(c); });
      var h = "<table>";
      tbl.forEach(function (r, i) {
        if (isSep && i === 1) return;
        var tag = isSep && i === 0 ? "th" : "td";
        h += "<tr>" + r.map(function (c) { return "<" + tag + ">" + inline(c) + "</" + tag + ">"; }).join("") + "</tr>";
      });
      out.push(h + "</table>"); tbl = [];
    }
    lines.forEach(function (ln, i) {
      var m;
      if (/^\s*```/.test(ln)) { close(); flushTbl(); if (code === null) code = []; else { out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>"); code = null; } return; }
      if (code !== null) { code.push(ln); return; }
      if ((m = ln.match(/^\s*\|(.*)\|\s*$/))) { close(); tbl.push(m[1].split("|").map(function (c) { return c.trim(); })); return; }
      flushTbl();
      if ((m = ln.match(/^\s*(•|-|\*)\s+(.*)$/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push("<li>" + inline(m[2]) + "</li>"); return; }
      if ((m = ln.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push("<li>" + inline(m[1]) + "</li>"); return; }
      close();
      if ((m = ln.match(/^\s*\[([ xX])\]\s*(.*)$/))) { var on = m[1] !== " "; out.push('<div class="ck' + (on ? " on" : "") + '" data-line="' + i + '"><span>' + (on ? "☑" : "☐") + "</span><span>" + inline(m[2]) + "</span></div>"); return; }
      if ((m = ln.match(/^(#{1,3})\s+(.*)$/))) { out.push("<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"); return; }
      if ((m = ln.match(/^>\s?(.*)$/))) { out.push("<blockquote>" + inline(m[1]) + "</blockquote>"); return; }
      if (/^\s*(---+|___+)\s*$/.test(ln)) { out.push("<hr>"); return; }
      out.push("<p>" + inline(ln) + "</p>");
    });
    if (code !== null) out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
    close(); flushTbl();
    return out.join("");
  }
  function setReading(on) {
    var n = cur();
    readMode = !!on && !!n && n.type === "text";
    readEl.hidden = !readMode;
    bodyEl.hidden = readMode || !n || n.type === "list";
    var b = $("fmt").querySelector('[data-ins="read"]');
    b.setAttribute("aria-pressed", readMode ? "true" : "false"); b.textContent = readMode ? "Editar" : "Leer";
    $("fmt").classList.toggle("reading", readMode);
    if (readMode) { $("hlRow").hidden = true; $("findBar").hidden = true; var hb = document.querySelector('[data-ins="hl"]'); hb && hb.setAttribute("aria-pressed", "false"); }
    if (readMode) renderRead();
    if (selImg) selectImg(null);
    $("imgrow").hidden = !n || !n.images.length || !!n.trashedAt || readMode;
    fitBody();
  }
  readEl.addEventListener("click", function (e) {
    var pf = e.target.closest(".pfloat.hasinfo");
    if (pf) { pf.classList.toggle("info-on"); return; }
    var w = e.target.closest("a.wl");
    if (w) {
      e.preventDefault();
      var t = w.dataset.t, hit = findByTitle(t);
      if (hit) openNote(hit.id); else { var cn = cur(); createNote("text", { title: t, folder: cn ? cn.folder : "" }); }
      return;
    }
    var c = e.target.closest(".ck"), n = cur();
    if (!c || !n || n.trashedAt) return;
    var ls = n.body.split("\n"), i = Number(c.dataset.line);
    ls[i] = /^\s*\[ \]/.test(ls[i]) ? ls[i].replace("[ ]", "[x]") : ls[i].replace(/\[[xX]\]/, "[ ]");
    bodyEl.value = n.body = ls.join("\n"); changed(n); histNow();
    renderRead();
  });

  /* Barra de formato: viñeta, casilla, fecha y hora en el punto donde estás escribiendo */
  function fireInput() { bodyEl.dispatchEvent(new Event("input", { bubbles: true })); }
  var MARK = /^(#{1,2} |> |• |\[[ xX]\] |\d+[.)] )/;
  function lineBounds() {
    var v = bodyEl.value, s = bodyEl.selectionStart, ls = v.lastIndexOf("\n", s - 1) + 1, le = v.indexOf("\n", s);
    return { ls: ls, le: le < 0 ? v.length : le, s: s };
  }
  // pone el prefijo en la línea; si ya lo tenía lo quita; si tenía otro lo cambia
  function togglePrefix(prefix) {
    var b = lineBounds(), line = bodyEl.value.slice(b.ls, b.le), m = line.match(MARK), old = m ? m[0] : "";
    var same = old === prefix || (prefix === "1. " && /^\d+[.)] $/.test(old)) || (prefix === "[ ] " && /^\[[xX ]\] $/.test(old));
    bodyEl.setRangeText(same ? "" : prefix, b.ls, b.ls + old.length, "preserve");
    var d = (same ? 0 : prefix.length) - old.length, c = Math.max(b.ls, b.s + d); bodyEl.setSelectionRange(c, c);
  }
  function cycleHead() {
    var b = lineBounds(), line = bodyEl.value.slice(b.ls, b.le), m = line.match(/^(#{1,2}) /), old = m ? m[0] : "";
    var nx = !m ? "# " : m[1] === "#" ? "## " : "";
    bodyEl.setRangeText(nx, b.ls, b.ls + old.length, "preserve");
    var c = Math.max(b.ls, b.s + nx.length - old.length); bodyEl.setSelectionRange(c, c);
  }
  function wrapSel(w) {
    var v = bodyEl.value, s = bodyEl.selectionStart, e = bodyEl.selectionEnd, L = w.length;
    if (s === e) { bodyEl.setRangeText(w + w, s, e, "end"); bodyEl.setSelectionRange(s + L, s + L); return; }
    if (s >= L && v.slice(s - L, s) === w && v.slice(e, e + L) === w && !(L === 1 && (v.charAt(s - 2) === "*" || v.charAt(e + 1) === "*"))) {
      bodyEl.setRangeText(v.slice(s, e), s - L, e + L, "preserve"); bodyEl.setSelectionRange(s - L, e - L); return;
    }
    bodyEl.setRangeText(w + v.slice(s, e) + w, s, e, "preserve"); bodyEl.setSelectionRange(s + L, e + L);
  }
  /* buscar y reemplazar */
  var findIdx = -1;
  function findRe() {
    var q = $("findIn").value; if (!q) return null;
    return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $("findCase").getAttribute("aria-pressed") === "true" ? "g" : "gi");
  }
  function findAll() {
    var re = findRe(), out = [], m; if (!re) return out;
    var v = bodyEl.value;
    while ((m = re.exec(v))) { out.push({ a: m.index, b: m.index + m[0].length }); if (!m[0].length) re.lastIndex++; if (out.length > 5000) break; }
    return out;
  }
  function findCountUI(all) {
    all = all || findAll();
    $("findCount").textContent = !$("findIn").value ? "" : !all.length ? "0" : (findIdx >= 0 ? (findIdx + 1) + " de " + all.length : String(all.length));
    return all;
  }
  function findGo(dir) {
    var all = findCountUI(); if (!all.length) { findIdx = -1; findCountUI(all); return; }
    var s0 = bodyEl.selectionStart, k;
    if (dir > 0) { k = all.findIndex(function (m) { return m.a >= (findIdx >= 0 && all[findIdx] && s0 === all[findIdx].a ? s0 + 1 : s0); }); if (k < 0) k = 0; }
    else { k = -1; for (var i = all.length - 1; i >= 0; i--) if (all[i].b <= s0 && !(s0 === all[i].a)) { k = i; break; } if (k < 0) k = all.length - 1; }
    findIdx = k; var m = all[k];
    bodyEl.blur(); bodyEl.focus({ preventScroll: false }); bodyEl.setSelectionRange(m.a, m.b);
    /* llevar la coincidencia a la vista: textarea con alto fijo o con scroll del contenedor */
    var before = bodyEl.value.slice(0, m.a), lines = before.split("\n").length - 1, lh = parseFloat(getComputedStyle(bodyEl).lineHeight) || 24;
    if (bodyEl.scrollHeight > bodyEl.clientHeight + 4) bodyEl.scrollTop = Math.max(0, lines * lh - bodyEl.clientHeight / 3);
    findCountUI(all);
  }
  function replOne() {
    var n = cur(); if (!n || readMode) return; var all = findAll(); if (!all.length) return;
    var s = bodyEl.selectionStart, e = bodyEl.selectionEnd, hit = all.filter(function (m) { return m.a === s && m.b === e; })[0];
    if (!hit) { findGo(1); return; }
    histNow(); bodyEl.setRangeText($("replIn").value, hit.a, hit.b, "end"); fireInput(); histNow();
    findIdx = -1; findGo(1);
  }
  function replAll() {
    var n = cur(); if (!n || readMode) return; var re = findRe(); if (!re) return; var cnt = findAll().length; if (!cnt) { toast("No hay coincidencias"); return; }
    var rv = $("replIn").value;
    histNow(); bodyEl.value = bodyEl.value.replace(re, function () { return rv; }); fireInput(); histNow(); findIdx = -1; findCountUI();
    toast(cnt + (cnt === 1 ? " reemplazo" : " reemplazos"), "Deshacer", function () { bodyEl.focus(); histGo(-1); findCountUI(); });
  }
  function findOpen(on) {
    var bar = $("findBar"); bar.hidden = !on; document.querySelector('[data-ins="find"]').setAttribute("aria-pressed", on ? "true" : "false");
    if (on) { $("hlRow").hidden = true; var sel = bodyEl.value.slice(bodyEl.selectionStart, bodyEl.selectionEnd); if (sel && sel.indexOf("\n") < 0 && sel.length < 60) $("findIn").value = sel; findIdx = -1; findCountUI(); $("findIn").focus(); }
    fitBody();
  }
  $("findIn").addEventListener("input", function () { findIdx = -1; findCountUI(); });
  $("findIn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); findGo(e.shiftKey ? -1 : 1); } });
  $("findNext").addEventListener("click", function () { findGo(1); });
  $("findPrev").addEventListener("click", function () { findGo(-1); });
  $("findCase").addEventListener("click", function () { var b = $("findCase"); b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); findIdx = -1; findCountUI(); });
  $("findClose").addEventListener("click", function () { findOpen(false); });
  $("replOne").addEventListener("click", replOne);
  $("replAll").addEventListener("click", replAll);
  /* resaltado de colores: ==texto== (amarillo) o =={verde}texto== */
  function applyHl(c) {
    var v = bodyEl.value, s = bodyEl.selectionStart, e = bodyEl.selectionEnd;
    var ls = v.lastIndexOf("\n", s - 1) + 1, le = v.indexOf("\n", e); if (le < 0) le = v.length;
    var re = /==(?:\{(?:amarillo|verde|rosa|celeste|naranja)\})?(?=\S)(.+?)(?<=\S)==/g, line = v.slice(ls, le), m, hit = null;
    while ((m = re.exec(line))) { var a = ls + m.index, b = a + m[0].length; if (s <= b && e >= a) { hit = { a: a, b: b, txt: m[1] }; break; } }
    var open = c && c !== "amarillo" ? "=={" + c + "}" : "==";
    if (hit) {
      var neu = c ? open + hit.txt + "==" : hit.txt;
      bodyEl.setRangeText(neu, hit.a, hit.b, "preserve"); bodyEl.setSelectionRange(hit.a, hit.a + neu.length); return;
    }
    if (!c) return;
    if (s === e) { bodyEl.setRangeText(open + "==", s, e, "end"); bodyEl.setSelectionRange(s + open.length, s + open.length); return; }
    bodyEl.setRangeText(open + v.slice(s, e) + "==", s, e, "preserve"); bodyEl.setSelectionRange(s, e + open.length + 2);
  }
  $("hlRow").addEventListener("mousedown", function (e) { e.preventDefault(); });
  $("hlRow").addEventListener("click", function (e) {
    var b = e.target.closest("button"), n = cur(); if (!b || !n || n.trashedAt || readMode) return;
    histNow(); bodyEl.focus(); applyHl(b.dataset.c); fireInput(); histNow();
    $("hlRow").hidden = true; document.querySelector('[data-ins="hl"]').setAttribute("aria-pressed", "false"); fitBody();
  });
  var dlong = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
  function insertAtCaret(text) {
    var s = bodyEl.selectionStart, e = bodyEl.selectionEnd, prev = s > 0 ? bodyEl.value.charAt(s - 1) : "";
    if (prev && !/\s/.test(prev)) text = " " + text; // no pegar la fecha a la palabra de antes
    bodyEl.setRangeText(text, s, e, "end");
  }
