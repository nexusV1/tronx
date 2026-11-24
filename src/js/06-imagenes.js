  /* ---------- imágenes en las notas ---------- */
  var IDB = null, imgMem = new Map(), imgUrls = new Map(), imgsEl = $("imgs"), contentEl = document.querySelector(".content"), selImg = null;
  function idbOpen() {
    return new Promise(function (res, rej) {
      if (IDB) return res(IDB);
      try {
        var r = indexedDB.open("tronx-img", 2);
        r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains("i")) d.createObjectStore("i"); if (!d.objectStoreNames.contains("bk")) d.createObjectStore("bk"); };
        r.onsuccess = function () { IDB = r.result; res(IDB); };
        r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
  }
  function imgPut(id, blob) {
    imgMem.set(id, blob);
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) { var t = db.transaction("i", "readwrite"); t.objectStore("i").put(blob, id); t.oncomplete = function () { imgMem.delete(id); res(true); }; t.onerror = function () { rej(t.error); }; });
    }).catch(function () { return false; });
  }
  function imgGetRaw(id) {
    if (imgMem.has(id)) return Promise.resolve(imgMem.get(id));
    return idbOpen().then(function (db) {
      return new Promise(function (res) { var q = db.transaction("i").objectStore("i").get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; });
    }).catch(function () { return null; });
  }
  /* las imágenes de notas protegidas se guardan cifradas ({encImg, s, iv, ct, type}); sin la clave de la sesión no se pueden leer */
  function imgGet(id) {
    return imgGetRaw(id).then(function (r) {
      if (!r || !r.encImg) return r;
      var key = encKeys[r.s]; if (!key) return null;
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(r.iv) }, key, r.ct).then(function (buf) { return new Blob([buf], { type: r.type || "image/jpeg" }); }).catch(function () { return null; });
    });
  }
  function rawSize(b) { return !b ? 0 : b.encImg ? ((b.ct && b.ct.byteLength) || 0) : (b.size || 0); }
  function imgPutRaw(id, v) { return idbOpen().then(function (db) { return new Promise(function (res) { var t = db.transaction("i", "readwrite"); t.objectStore("i").put(v, id); t.oncomplete = function () { res(true); }; t.onerror = function () { res(false); }; }); }).catch(function () { return false; }); }
  function imgDropThumb(id) { thUrls.delete(id); return idbOpen().then(function (db) { db.transaction("i", "readwrite").objectStore("i").delete(id + ":t"); }).catch(function () {}); }
  function imgKeys() {
    return idbOpen().then(function (db) {
      return new Promise(function (res) { var q = db.transaction("i").objectStore("i").getAllKeys(); q.onsuccess = function () { res(q.result || []); }; q.onerror = function () { res([]); }; });
    }).catch(function () { return []; });
  }
  var thUrls = new Map(), thChain = Promise.resolve();
  function imgDel(id) { imgUrls.delete(id); thUrls.delete(id); return idbOpen().then(function (db) { var s = db.transaction("i", "readwrite").objectStore("i"); s.delete(id); s.delete(id + ":t"); }).catch(function () {}); }
  // miniaturas chicas (96px) guardadas aparte; se generan de a una para no decodificar muchas fotos grandes juntas
  function thumbUrl(id) {
    if (thUrls.has(id)) return Promise.resolve(thUrls.get(id));
    var job = thChain.then(function () {
      if (thUrls.has(id)) return thUrls.get(id);
      return imgGet(id + ":t").then(function (tb) {
        if (tb) { var u = URL.createObjectURL(tb); thUrls.set(id, u); return u; }
        return imgGet(id).then(function (b) {
          if (!b) return null;
          return new Promise(function (res) {
            var u0 = URL.createObjectURL(b), im = new Image();
            im.onload = function () {
              var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 96 / Math.min(w, h)), c = document.createElement("canvas");
              c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
              c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u0);
              c.toBlob(function (t) {
                if (!t) { res(null); return; }
                idbOpen().then(function (db) { db.transaction("i", "readwrite").objectStore("i").put(t, id + ":t"); }).catch(function () {});
                var u = URL.createObjectURL(t); thUrls.set(id, u); res(u);
              }, b.type === "image/png" ? "image/png" : "image/jpeg", 0.7);
            };
            im.onerror = function () { URL.revokeObjectURL(u0); res(null); };
            im.src = u0;
          });
        });
      });
    }).catch(function () { return null; });
    thChain = job.then(function () {}, function () {});
    return job;
  }
  function imgUrl(id) {
    if (imgUrls.has(id)) return Promise.resolve(imgUrls.get(id));
    return imgGet(id).then(function (b) { if (!b) return null; var u = URL.createObjectURL(b); imgUrls.set(id, u); return u; });
  }
  function usedImageIds() { var set = new Set(); notes.forEach(function (n) { n.images.forEach(function (i) { set.add(i.src); }); }); return set; }
  function gcImages() {
    if (!notes.size) return Promise.resolve({ n: 0, bytes: 0 });
    return imgKeys().then(function (keys) {
      var used = usedImageIds(), dead = [];
      keys.forEach(function (k) { var base = String(k).replace(/:t$/, ""); if (base.indexOf("stk:") === 0) return; if (!used.has(base)) dead.push(k); });
      return Promise.all(dead.map(function (k) { return imgGetRaw(k).then(rawSize, function () { return 0; }); })).then(function (sizes) {
        dead.forEach(function (k) { imgDel(String(k).replace(/:t$/, "")); });
        return { n: dead.filter(function (k) { return !/:t$/.test(k); }).length, bytes: sizes.reduce(function (a, c) { return a + c; }, 0) };
      });
    });
  }
  setTimeout(gcImages, 4000);
  function shrinkImage(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(u);
        var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 1600 / Math.max(w, h)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        var keep = /png|webp|gif/.test(file.type);
        c.toBlob(function (b) { if (b) res({ blob: b, w: c.width, h: c.height }); else rej(new Error("blob")); }, keep ? "image/png" : "image/jpeg", 0.86);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error("img")); };
      im.src = u;
    });
  }
  function imgOf(id) { var n = cur(); return n ? n.images.filter(function (i) { return i.id === id; })[0] : null; }
  function applyImg(it, node) {
    var st = node.style;
    st.left = (it.cx * 100) + "%"; st.top = it.cy + "px"; st.width = (it.w * 100) + "%"; st.aspectRatio = String(it.ar);
    st.transform = "translate(-50%,-50%) rotate(" + it.r + "deg)"; st.opacity = it.op; st.zIndex = it.back ? 0 : 4 + it.z;
    node.classList.toggle("shadow", it.sh); node.classList.toggle("lock", it.lock); node.classList.toggle("wrapped", !!it.wrap);
    var im = node.querySelector("img");
    if (im) styleImgEl(it, im);
    var inf = node.querySelector(".pinfo");
    if (!it.info) { if (inf) inf.remove(); }
    else { if (!inf) { inf = el("div"); node.appendChild(inf); } inf.className = "pinfo " + it.ip; inf.textContent = it.info; }
    node.classList.toggle("hasinfo", !!it.info); node.classList.toggle("always", !!it.info && it.show === "always");
  }
  var FT_CSS = { bw: "grayscale(1) contrast(1.1)", sepia: "sepia(.85)", warm: "sepia(.35) saturate(1.3) hue-rotate(-12deg)", cool: "saturate(1.1) hue-rotate(18deg) brightness(1.03)", fade: "contrast(.82) brightness(1.12) saturate(.8)", vivid: "saturate(1.6) contrast(1.1)" };
  function imgFilter(it, k) {
    k = k || 1; var f = [];
    if (it.ft && FT_CSS[it.ft]) f.push(FT_CSS[it.ft]);
    if (it.br !== 100) f.push("brightness(" + it.br / 100 + ")"); if (it.co !== 100) f.push("contrast(" + it.co / 100 + ")"); if (it.sa !== 100) f.push("saturate(" + it.sa / 100 + ")");
    if (it.bl > 0) f.push("blur(" + (it.bl * k) + "px)");
    return f.join(" ");
  }
  function styleImgEl(it, im) {
    im.className = it.ft ? "f-" + it.ft : "";
    var zoomed = it.zm > 1.001, moved = Math.abs(it.px - 0.5) > 0.001 || Math.abs(it.py - 0.5) > 0.001;
    var tx = zoomed ? (0.5 - it.px) * (it.zm - 1) * 100 * (it.fl ? -1 : 1) : 0, ty = zoomed ? (0.5 - it.py) * (it.zm - 1) * 100 : 0;
    im.style.transform = zoomed ? "translate(" + tx + "%," + ty + "%) scale(" + (it.fl ? -it.zm : it.zm) + "," + it.zm + ")" : it.fl ? "scaleX(-1)" : "";
    im.style.filter = imgFilter(it);
    im.style.objectPosition = (it.px * 100) + "% " + (it.py * 100) + "%";
    im.style.objectFit = Math.abs(it.ar - it.nar) < 0.01 && !zoomed && !moved ? "fill" : "cover";
    var cl = im.parentNode && im.parentNode.classList && im.parentNode.classList.contains("pclip") ? im.parentNode : im;
    if (cl !== im) cl.style.aspectRatio = String(it.ar);
    cl.style.borderRadius = it.rad + "%"; cl.style.borderWidth = (it.bd * 2) + "px";
  }
  /* vista de lectura: las imágenes con "texto alrededor" pasan a flotar y el texto las rodea */
  function renderRead() {
    readEl.innerHTML = mdHtml(bodyEl.value);
    var n = cur(); if (!n) return;
    var ws = n.images.filter(function (i) { return i.wrap; }).sort(function (a, b) { return a.cy - b.cy; });
    if (!ws.length) return;
    var W = readEl.clientWidth || imgsEl.clientWidth || 300, blocks = Array.from(readEl.children), tops = blocks.map(function (b) { return b.offsetTop; });
    ws.forEach(function (it) {
      var f = el("div", "pfloat"), box = el("div", "pfimg"), im = el("img"); im.alt = ""; im.decoding = "async"; im.loading = "lazy"; var cl0 = el("div", "pclip"); cl0.appendChild(im); box.appendChild(cl0); box.style.aspectRatio = String(it.ar);
      if (it.info) {
        var inf = el("div", "pinfo " + it.ip); inf.textContent = it.info;
        if (it.ip === "above") f.appendChild(inf);
        f.appendChild(box); if (it.ip === "below") f.appendChild(inf); else if (it.ip !== "above") box.appendChild(inf);
        f.classList.add("hasinfo"); if (it.show === "always") f.classList.add("always");
      } else f.appendChild(box);
      var left = it.cx < 0.5;
      f.style.width = (Math.min(it.w, 0.6) * W) + "px"; f.style.opacity = it.op;
      f.style.float = left ? "left" : "right"; f.style.margin = left ? "4px 14px 8px 0" : "4px 0 8px 14px";
      if (it.rad >= 49) f.style.shapeOutside = "circle(50%)";
      f.classList.toggle("shadow", it.sh); styleImgEl(it, im);
      imgUrl(it.src).then(function (u) { if (u) im.src = u; });
      var top = it.cy - (it.w * W / it.ar) / 2, ref = null;
      for (var k = 0; k < blocks.length; k++) if (tops[k] >= top - 2) { ref = blocks[k]; break; }
      readEl.insertBefore(f, ref);
    });
  }
  function imgNode(id) { return imgsEl.querySelector('.pimg[data-id="' + id + '"]'); }
  function fitBody() {
    var n = cur(), on = !!(n && n.type === "text" && n.images.length);
    contentEl.classList.toggle("imgs", on);
    imgsEl.classList.toggle("ro", !!(readMode || !n || n.trashedAt)); imgsEl.classList.toggle("reading", readMode);
    bodyEl.style.height = ""; readEl.style.minHeight = "";
    if (!on) return;
    var W = imgsEl.clientWidth || 300, bottom = 0;
    n.images.forEach(function (i) { var h = i.w * W / i.ar, ex = Math.abs(Math.sin(i.r * Math.PI / 180)) * Math.max(0, (h - i.w * W) / 2); var xi = i.info && (i.ip === "below" || i.ip === "above") ? 16 * Math.ceil(i.info.length / Math.max(14, i.w * W / 7)) + 22 : 0; bottom = Math.max(bottom, i.cy + h / 2 + ex + 24 + xi); });
    var top = bodyEl.offsetTop || 0, need = Math.max(bottom - top, contentEl.clientHeight - top - 8);
    if (readMode) readEl.style.minHeight = need + "px";
    else { bodyEl.style.height = "auto"; bodyEl.style.height = Math.max(bodyEl.scrollHeight, need) + "px"; }
  }
  function renderImages() {
    var n = cur();
    imgsEl.textContent = "";
    var row = $("imgrow"); row.textContent = "";
    if (!n || n.type !== "text") { row.hidden = true; $("imgPanel").hidden = true; fitBody(); return; }
    if (selImg && !imgOf(selImg)) selImg = null;
    n.images.forEach(function (it) {
      var node = el("div", "pimg"); node.dataset.id = it.id;
      var im = el("img"); im.alt = ""; im.draggable = false; im.decoding = "async"; im.loading = "lazy"; var cl1 = el("div", "pclip"); cl1.appendChild(im); node.appendChild(cl1);
      imgUrl(it.src).then(function (u) { if (u) im.src = u; else node.classList.add("miss"); });
      applyImg(it, node); imgsEl.appendChild(node);
      if (!n.trashedAt) {
        var th = el("button", "th"); th.type = "button"; th.dataset.id = it.id; th.setAttribute("aria-label", "Elegir imagen");
        thumbUrl(it.src).then(function (u) { if (u) th.style.backgroundImage = 'url("' + u + '")'; });
        th.addEventListener("click", function () { selectImg(selImg === it.id ? null : it.id); });
        row.appendChild(th);
      }
    });
    row.hidden = !n.images.length || !!n.trashedAt || readMode;
    fitBody(); selectImg(selImg, true);
  }
  function selectImg(id, quiet) {
    selImg = id; document.body.classList.toggle("imgsel", !!id);
    imgsEl.querySelectorAll(".pimg").forEach(function (nd) {
      var on = nd.dataset.id === id; nd.classList.toggle("sel", on);
      var hs = nd.querySelector(".hs"); if (hs) hs.remove(); hs = nd.querySelector(".hr"); if (hs) hs.remove();
      if (on) { nd.appendChild(el("i", "hs")); nd.appendChild(el("i", "hr")); }
    });
    $("imgrow").querySelectorAll(".th").forEach(function (t) { t.setAttribute("aria-pressed", t.dataset.id === id ? "true" : "false"); });
    renderPanel();
  }
  var PANEL_BUILT = false;
  function buildPanel() {
    if (PANEL_BUILT) return; PANEL_BUILT = true;
    var P = $("imgPanel");
    function ctl(k, label, min, max, step) {
      var d = el("label", "ctl"), sp = el("span"), inp = el("input"), out = el("output");
      sp.textContent = label; inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.dataset.k = k;
      d.appendChild(sp); d.appendChild(inp); d.appendChild(out); P.appendChild(d);
    }
    var ta = el("textarea", "infoin"); ta.rows = 2; ta.maxLength = 600; ta.placeholder = "Información de la imagen (se muestra al tocarla)"; ta.setAttribute("aria-label", "Información de la imagen"); P.appendChild(ta);
    grp("Texto", [["below", "Abajo"], ["above", "Arriba"], ["in-bottom", "Sobre la imagen ↓"], ["in-top", "Sobre la imagen ↑"]], "ip");
    grp("Mostrar", [["tap", "Al tocar"], ["always", "Siempre visible"]], "show");
    ctl("w", "Tamaño", 5, 150, 1); ctl("r", "Giro", -180, 180, 1); ctl("op", "Opacidad", 10, 100, 1);
    function grp(label, items, key) {
      var g = el("div", "grp"), l = el("span", "lbl"); l.textContent = label; g.appendChild(l);
      items.forEach(function (x) { var b = el("button", "chip"); b.type = "button"; b.textContent = x[1]; b.dataset.k = key; b.dataset.v = x[0]; g.appendChild(b); });
      P.appendChild(g);
    }
    grp("Forma", [["orig", "Original"], ["sq", "Cuadrada"], ["43", "4:3"], ["169", "16:9"], ["circ", "Círculo"], ["round", "Redonda"]], "shape");
    grp("Borde", [["0", "Sin borde"], ["1", "Fino"], ["2", "Medio"], ["3", "Grueso"]], "bd");
    grp("Filtro", [["", "Normal"], ["bw", "B/N"], ["sepia", "Sepia"], ["warm", "Cálido"], ["cool", "Frío"], ["fade", "Desvaído"], ["vivid", "Vivo"]], "ft");
    var hd = el("span", "lbl"); hd.textContent = "Recorte y encuadre"; P.appendChild(hd);
    ctl("zm", "Zoom", 100, 400, 5); ctl("px", "Izquierda ↔ derecha", 0, 100, 1); ctl("py", "Arriba ↕ abajo", 0, 100, 1);
    var hd2 = el("span", "lbl"); hd2.textContent = "Ajustes de imagen"; P.appendChild(hd2);
    ctl("br", "Brillo", 40, 160, 1); ctl("co", "Contraste", 40, 160, 1); ctl("sa", "Saturación", 0, 200, 1); ctl("bl", "Desenfoque", 0, 10, 1);
    grp("Opciones", [["sh", "Sombra"], ["fl", "Espejo"], ["wrap", "Texto alrededor"], ["back", "Detrás del texto"], ["lock", "Bloquear"]], "tog");
    grp("Acciones", [["front", "Al frente"], ["bottom", "Al fondo"], ["dup", "Duplicar"], ["del", "Eliminar"], ["reset", "Restablecer ajustes"], ["done", "Listo"]], "act");
  }
  function renderPanel() {
    var P = $("imgPanel"), it = selImg && imgOf(selImg), n = cur();
    if (!it || !n || n.trashedAt) { P.hidden = true; return; }
    buildPanel(); P.hidden = false;
    var vals = { w: Math.round(it.w * 100), r: Math.round(it.r), op: Math.round(it.op * 100), zm: Math.round(it.zm * 100), px: Math.round(it.px * 100), py: Math.round(it.py * 100), br: it.br, co: it.co, sa: it.sa, bl: it.bl };
    P.querySelectorAll("input[type=range]").forEach(function (i) { var k = i.dataset.k; i.value = vals[k]; i.nextSibling.textContent = vals[k] + (k === "r" ? "°" : k === "bl" ? " px" : "%"); i.disabled = (k === "px" || k === "py") && it.zm <= 1.001 && Math.abs(it.ar - it.nar) < 0.01; });
    var shape = it.rad >= 49 ? "circ" : Math.abs(it.ar - it.nar) < 0.01 ? (it.rad > 0 ? "round" : "orig") : Math.abs(it.ar - 1) < 0.01 ? "sq" : Math.abs(it.ar - 4 / 3) < 0.01 ? "43" : Math.abs(it.ar - 16 / 9) < 0.01 ? "169" : "";
    var ta = P.querySelector(".infoin"); if (ta && document.activeElement !== ta) ta.value = it.info || "";
    P.querySelectorAll(".chip").forEach(function (c) {
      var k = c.dataset.k, v = c.dataset.v, on = false;
      if (k === "ip") on = it.ip === v; else if (k === "show") on = it.show === v;
      if (k === "shape") on = v === shape; else if (k === "bd") on = String(it.bd) === v; else if (k === "ft") on = it.ft === v;
      else if (k === "tog") on = !!it[v];
      if (k === "act") c.removeAttribute("aria-pressed"); else c.setAttribute("aria-pressed", on ? "true" : "false");
      if (k === "tog" && v === "lock") c.textContent = it.lock ? "Bloqueada" : "Bloquear";
    });
  }
  function imgChanged(it, relayout) {
    var n = cur(), nd = imgNode(it.id); if (nd) applyImg(it, nd);
    if (n) changed(n);
    if (relayout) fitBody();
  }
  function P_refreshPan(it) { $("imgPanel").querySelectorAll('input[data-k="px"],input[data-k="py"]').forEach(function (i) { i.disabled = it.zm <= 1.001 && Math.abs(it.ar - it.nar) < 0.01; }); }
  $("imgPanel").addEventListener("input", function (e) {
    var i = e.target.closest("input[type=range]"), it = selImg && imgOf(selImg); if (!i || !it) return;
    var v = Number(i.value);
    var k = i.dataset.k;
    if (k === "w") it.w = v / 100; else if (k === "r") it.r = v; else if (k === "op") it.op = v / 100;
    else if (k === "zm") it.zm = v / 100; else if (k === "px" || k === "py") it[k] = v / 100; else it[k] = v;
    i.nextSibling.textContent = v + (k === "r" ? "°" : k === "bl" ? " px" : "%");
    imgChanged(it, true);
    if (k === "zm") P_refreshPan(it);
  });
  $("imgPanel").addEventListener("input", function (e) {
    var ta = e.target.closest(".infoin"), it = selImg && imgOf(selImg); if (!ta || !it) return;
    it.info = ta.value.slice(0, 600); imgChanged(it, true);
  });
  $("imgPanel").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"), it = selImg && imgOf(selImg), n = cur(); if (!c || !it || !n) return;
    var k = c.dataset.k, v = c.dataset.v;
    if (k === "shape") {
      it.rad = 0; it.ar = it.nar;
      if (v === "sq") it.ar = 1; else if (v === "43") it.ar = 4 / 3; else if (v === "169") it.ar = 16 / 9;
      else if (v === "circ") { it.ar = 1; it.rad = 50; } else if (v === "round") it.rad = 12;
    } else if (k === "bd") it.bd = Number(v);
    else if (k === "ft") it.ft = v;
    else if (k === "tog") it[v] = !it[v];
    else if (k === "ip") it.ip = v;
    else if (k === "show") it.show = v;
    else if (k === "act") {
      var top = n.images.reduce(function (m, x) { return Math.max(m, x.z); }, 0), low = n.images.reduce(function (m, x) { return Math.min(m, x.z); }, 999);
      if (v === "front") { it.z = Math.min(999, top + 1); it.back = false; }
      else if (v === "bottom") { it.z = Math.max(0, low - 1); }
      else if (v === "dup") {
        var cp = JSON.parse(JSON.stringify(it)); cp.id = uid(); cp.cx = Math.min(1, it.cx + 0.06); cp.cy = it.cy + 24; cp.lock = false; cp.z = Math.min(999, top + 1);
        n.images.push(cleanImages([cp])[0] || cp); selImg = n.images[n.images.length - 1].id; changed(n); renderImages(); return;
      } else if (v === "del") {
        n.images = n.images.filter(function (x) { return x.id !== it.id; }); selImg = null; changed(n);
        if (!usedImageIds().has(it.src)) imgDel(it.src);
        renderImages(); return;
      } else if (v === "reset") { it.ft = ""; it.zm = 1; it.px = 0.5; it.py = 0.5; it.br = 100; it.co = 100; it.sa = 100; it.bl = 0; }
      else if (v === "done") { selectImg(null); return; }
    }
    imgChanged(it, true); renderPanel();
  });
  /* mover, escalar y girar con el dedo */
  var ptrs = new Map(), gest = null;
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function startGest(it, node, mode) {
    var r = node.getBoundingClientRect(), W = imgsEl.clientWidth || 300, pts = Array.from(ptrs.values());
    gest = { it: it, node: node, mode: mode, W: W, C: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, cx0: it.cx, cy0: it.cy, w0: it.w, r0: it.r,
      p0: pts[0], d0: pts.length > 1 ? dist(pts[0], pts[1]) : 1, a0: pts.length > 1 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0, rd0: pts[0] ? dist(pts[0], { x: r.left + r.width / 2, y: r.top + r.height / 2 }) : 1 };
  }
  imgsEl.addEventListener("pointerdown", function (e) {
    var node = e.target.closest(".pimg"), n = cur(); if (!node || !n || n.trashedAt || readMode) return;
    var it = imgOf(node.dataset.id); if (!it) return;
    if (selImg !== it.id) selectImg(it.id);
    if (it.lock) return;
    try { node.setPointerCapture(e.pointerId); } catch {}
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var h = e.target.closest(".hs, .hr");
    startGest(it, node, ptrs.size > 1 ? "pinch" : h ? (h.classList.contains("hs") ? "resize" : "rotate") : "move");
  });
  imgsEl.addEventListener("pointermove", function (e) {
    if (!gest || !ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var g = gest, it = g.it, p = ptrs.get(e.pointerId);
    if (g.mode === "move") {
      it.cx = Math.min(1, Math.max(0, g.cx0 + (p.x - g.p0.x) / g.W)); it.cy = Math.max(0, g.cy0 + (p.y - g.p0.y));
    } else if (g.mode === "resize") {
      it.w = Math.min(1.5, Math.max(0.05, g.w0 * dist(p, g.C) / Math.max(8, g.rd0)));
    } else if (g.mode === "rotate") {
      var a = Math.atan2(p.y - g.C.y, p.x - g.C.x) * 180 / Math.PI + 90; a = ((a + 540) % 360) - 180;
      var sn = Math.round(a / 90) * 90; if (Math.abs(a - sn) < 5) a = sn; it.r = Math.round(((a + 180) % 360 + 360) % 360 - 180);
    } else if (g.mode === "pinch" && ptrs.size > 1) {
      var q = Array.from(ptrs.values());
      it.w = Math.min(1.5, Math.max(0.05, g.w0 * dist(q[0], q[1]) / Math.max(8, g.d0)));
      var da = (Math.atan2(q[1].y - q[0].y, q[1].x - q[0].x) - g.a0) * 180 / Math.PI;
      it.r = Math.round(((g.r0 + da + 540) % 360) - 180);
    }
    applyImg(it, g.node);
  });
  function endGest(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (!gest) return;
    var it = gest.it, node = gest.node;
    if (ptrs.size === 1) { startGest(it, node, "move"); return; }
    gest = null; ptrs.clear();
    imgChanged(it, true); renderPanel();
  }
  imgsEl.addEventListener("click", function (e) {
    var nd = e.target.closest(".pimg.hasinfo"), n = cur();
    if (nd && n && (readMode || n.trashedAt)) nd.classList.toggle("info-on");
  });
  imgsEl.addEventListener("pointerup", endGest); imgsEl.addEventListener("pointercancel", endGest);
  /* agregar imágenes */
  function addImageBlob(n, blob, w, h, k) {
    var id = uid(), ar = w / h, wd = ar < 0.8 ? 0.45 : 0.6, W = imgsEl.clientWidth || 300;
    return imgPut(id, blob).then(function (okp) {
      if (okp === false && !imgMem.has(id)) throw new Error("save");
      var it = cleanImages([{ id: uid(), src: id, cx: Math.min(0.9, 0.5 + 0.05 * k), cy: contentEl.scrollTop + 20 + (wd * W / ar) / 2 + 22 * k, w: wd, nar: ar, ar: ar }])[0];
      n.images.push(it); selImg = it.id; changed(n);
    });
  }
  function addFiles(files) {
    var n = cur(); if (!n || n.type !== "text" || n.trashedAt || !files.length) return;
    var room = 30 - n.images.length; if (room <= 0) { toast("Una nota admite hasta 30 imágenes"); return; }
    files = files.slice(0, room);
    var k = 0;
    files.reduce(function (pr, f) {
      return pr.then(function () {
        return shrinkImage(f).then(function (r) { return addImageBlob(n, r.blob, r.w, r.h, k++); }).catch(function () { toast("No se pudo agregar una de las imágenes"); });
      });
    }, Promise.resolve()).then(function () { if (cur() === n) { renderImages(); persistNow(); } });
  }
  ["imgFile", "imgCam"].forEach(function (id) {
    $(id).addEventListener("change", function () { var fs = Array.from($(id).files || []); $(id).value = ""; addFiles(fs); });
  });

  /* dibujo a mano alzada: el dibujo se agrega como una imagen más (se puede mover, escalar y girar) */
  var drCv = $("drCanvas"), drCtx = null, drStrokes = [], drCur = null, drColor = "#ffffff", drSize = 7, drErase = false, drBg = "none", drIntent = null, drBuilt = false;
  var DR_COLORS = ["#ffffff", "#111111", "#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#9b5de5"];
  function drBuild() {
    if (drBuilt) return; drBuilt = true;
    var T = $("drTools");
    DR_COLORS.forEach(function (c) { var b = el("button", "sw"); b.type = "button"; b.style.background = c; b.dataset.c = c; b.setAttribute("aria-label", "Color " + c); T.appendChild(b); });
    T.appendChild(el("span", "sep"));
    [["Fino", 3], ["Medio", 7], ["Grueso", 14]].forEach(function (x) { var b = el("button", "chip"); b.type = "button"; b.textContent = x[0]; b.dataset.sz = x[1]; T.appendChild(b); });
    var er = el("button", "chip"); er.type = "button"; er.textContent = "Goma"; er.dataset.er = "1"; T.appendChild(er);
    T.appendChild(el("span", "sep"));
    [["none", "Transparente"], ["white", "Blanco"], ["paper", "Papel"], ["dark", "Oscuro"]].forEach(function (x) { var b = el("button", "chip"); b.type = "button"; b.textContent = x[1]; b.dataset.bg = x[0]; T.appendChild(b); });
    T.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.c) { drColor = b.dataset.c; drErase = false; } else if (b.dataset.sz) drSize = Number(b.dataset.sz);
      else if (b.dataset.er) drErase = !drErase; else if (b.dataset.bg) { drBg = b.dataset.bg; $("drWrap").className = "drawwrap" + (drBg === "none" ? "" : " bg-" + drBg); }
      drToolState();
    });
  }
  function drToolState() {
    $("drTools").querySelectorAll("button").forEach(function (b) {
      var on = b.dataset.c ? (b.dataset.c === drColor && !drErase) : b.dataset.sz ? Number(b.dataset.sz) === drSize : b.dataset.er ? drErase : b.dataset.bg === drBg;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function drSize2() {
    var r = $("drWrap").getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    drCv.width = Math.max(10, Math.round(r.width * dpr)); drCv.height = Math.max(10, Math.round(r.height * dpr));
    drCtx = drCv.getContext("2d"); drCtx.lineCap = "round"; drCtx.lineJoin = "round"; drCv._k = dpr;
  }
  function drPaint(st, from) {
    var c = drCtx, k = drCv._k, pts = st.p;
    c.globalCompositeOperation = st.e ? "destination-out" : "source-over"; c.strokeStyle = st.c; c.fillStyle = st.c; c.lineWidth = st.w * k;
    if (pts.length === 1) { c.beginPath(); c.arc(pts[0][0] * k, pts[0][1] * k, st.w * k / 2, 0, 6.2832); c.fill(); return; }
    c.beginPath(); c.moveTo(pts[Math.max(0, from - 1)][0] * k, pts[Math.max(0, from - 1)][1] * k);
    for (var i = Math.max(1, from); i < pts.length; i++) c.lineTo(pts[i][0] * k, pts[i][1] * k);
    c.stroke();
  }
  function drRedraw() { drCtx.clearRect(0, 0, drCv.width, drCv.height); drStrokes.forEach(function (st) { drPaint(st, 0); }); }
  function drPos(e) { var r = drCv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  drCv.addEventListener("pointerdown", function (e) {
    if (drCur) return;
    try { drCv.setPointerCapture(e.pointerId); } catch {}
    drCur = { c: drColor, w: drErase ? drSize * 2 : drSize, e: drErase, p: [drPos(e)] }; drStrokes.push(drCur); drPaint(drCur, 0);
  });
  drCv.addEventListener("pointermove", function (e) {
    if (!drCur) return;
    var n0 = drCur.p.length; drCur.p.push(drPos(e)); drPaint(drCur, n0);
  });
  function drEnd() { drCur = null; }
  drCv.addEventListener("pointerup", drEnd); drCv.addEventListener("pointercancel", drEnd);
  function openDraw() {
    var n = cur(); if (!n || n.type !== "text" || n.trashedAt) return;
    if (n.images.length >= 30) { toast("Una nota admite hasta 30 imágenes"); return; }
    drBuild(); drStrokes = []; drCur = null; drIntent = null; drToolState();
    $("draw").hidden = false; pushLayer("draw"); drSize2();
  }
  function drBounds() {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    drStrokes.forEach(function (st) { if (st.e) return; st.p.forEach(function (q) { x0 = Math.min(x0, q[0] - st.w); y0 = Math.min(y0, q[1] - st.w); x1 = Math.max(x1, q[0] + st.w); y1 = Math.max(y1, q[1] + st.w); }); });
    if (x1 < x0) return null;
    var k = drCv._k; x0 = Math.max(0, Math.floor((x0 - 8) * k)); y0 = Math.max(0, Math.floor((y0 - 8) * k));
    x1 = Math.min(drCv.width, Math.ceil((x1 + 8) * k)); y1 = Math.min(drCv.height, Math.ceil((y1 + 8) * k));
    return { x: x0, y: y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0) };
  }
  function drSave() {
    var n = cur(), bd = drBounds(); if (!n || !bd) return;
    var out = document.createElement("canvas"), full = drBg !== "none";
    if (full) { bd = { x: 0, y: 0, w: drCv.width, h: drCv.height }; }
    out.width = bd.w; out.height = bd.h; var o = out.getContext("2d");
    if (full) { o.fillStyle = { white: "#ffffff", paper: "#f4ecd8", dark: "#0b0b1c" }[drBg]; o.fillRect(0, 0, bd.w, bd.h); }
    o.drawImage(drCv, bd.x, bd.y, bd.w, bd.h, 0, 0, bd.w, bd.h);
    out.toBlob(function (blob) {
      if (!blob) { toast("No se pudo guardar el dibujo"); return; }
      addImageBlob(n, blob, bd.w, bd.h, 0).then(function () { if (cur() === n) { renderImages(); persistNow(); toast("Dibujo agregado"); } }).catch(function () { toast("No se pudo guardar el dibujo"); });
    }, "image/png");
  }
  function drClose() {
    $("draw").hidden = true;
    var intent = drIntent; drIntent = null;
    if (intent !== "cancel" && drStrokes.some(function (st) { return !st.e; })) drSave();
    drStrokes = []; drCur = null;
  }
  registerLayer("draw", drClose);
  $("drDone").addEventListener("click", function () { drIntent = "save"; closeLayer("draw"); });
  $("drCancel").addEventListener("click", function () { drIntent = "cancel"; closeLayer("draw"); });
  $("drUndo").addEventListener("click", function () { drStrokes.pop(); drRedraw(); });
  $("drClear").addEventListener("click", function () { drStrokes = []; drRedraw(); });
