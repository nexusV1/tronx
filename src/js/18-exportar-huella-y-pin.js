  /* ---------- exportar: Markdown y PDF ---------- */
  function noteMarkdown(n) {
    var out = n.title.trim() ? "# " + n.title.trim() + "\n\n" : "";
    if (n.type === "list") out += n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + "- [" + (i.done ? "x" : " ") + "] " + i.t + itemMeta(i); }).join("\n");
    else out += n.body;
    if (n.tags.length) out += "\n\n" + n.tags.map(function (t) { return "#" + t; }).join(" ");
    return out.replace(/\s+$/, "") + "\n";
  }
  var WIN = { "€": 128, "…": 133, "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149, "–": 150, "—": 151, "™": 153 };
  function latin1(str) {
    var o = "";
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i), ch = str.charAt(i);
      if (c === 9) o += "    "; else if (c < 32) continue;
      else if (c < 256 && !(c >= 127 && c < 160)) o += ch; else if (WIN[ch]) o += String.fromCharCode(WIN[ch]);
      else if (c >= 0xD800 && c <= 0xDFFF) continue; else o += "?";
    }
    return o;
  }
  function pdfEsc(t) { return t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
  function pdfImages(n) {
    var list = n.type === "text" ? n.images.slice() : [];
    return Promise.all(list.map(function (it) {
      return imgGet(it.src).then(function (blob) {
        if (!blob) return null;
        return new Promise(function (res) {
          var u = URL.createObjectURL(blob), im = new Image();
          im.onload = function () {
            try {
              var cw = Math.min(1000, im.naturalWidth), ch = Math.max(1, Math.round(cw / it.ar)), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
              var c = cv.getContext("2d"); c.save();
              if (it.rad > 0) {
                var r = Math.min(cw, ch) * it.rad / 100; c.beginPath(); c.moveTo(r, 0); c.arcTo(cw, 0, cw, ch, r); c.arcTo(cw, ch, 0, ch, r); c.arcTo(0, ch, 0, 0, r); c.arcTo(0, 0, cw, 0, r); c.closePath(); c.clip();
              }
              var fcss = imgFilter(it, cw / 360); if (fcss && "filter" in c) c.filter = fcss;
              c.globalAlpha = it.op; if (it.fl) { c.translate(cw, 0); c.scale(-1, 1); }
              var nw = im.naturalWidth, nh = im.naturalHeight, sa = nw / nh, sx = 0, sy = 0, sw = nw, sh = nh;
              if (sa > it.ar) { sw = nh * it.ar; sx = (nw - sw) * it.px; } else if (sa < it.ar) { sh = nw / it.ar; sy = (nh - sh) * it.py; }
              if (it.zm > 1.001) { var sw2 = sw / it.zm, sh2 = sh / it.zm; sx += (sw - sw2) * it.px; sy += (sh - sh2) * it.py; sw = sw2; sh = sh2; }
              c.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
              c.restore();
              /* dibujos con fondo transparente: si el trazo es claro se apoya sobre fondo oscuro para que se vea en el PDF */
              var bgc = "#ffffff", sm = c.getImageData(0, 0, cw, ch).data, step = Math.max(1, Math.floor(sm.length / 4 / 6000)) * 4, tr = false, lum = 0, cnt = 0;
              for (var q = 0; q < sm.length; q += step) { if (sm[q + 3] < 250) tr = true; if (sm[q + 3] > 128) { lum += (sm[q] * 0.3 + sm[q + 1] * 0.59 + sm[q + 2] * 0.11); cnt++; } }
              if (tr && cnt && lum / cnt > 175) bgc = "#20203a";
              c.globalCompositeOperation = "destination-over"; c.fillStyle = bgc; c.fillRect(0, 0, cw, ch);
              var b64 = cv.toDataURL("image/jpeg", 0.82).split(",")[1];
              res({ it: it, bin: atob(b64), w: cw, h: ch });
            } catch { res(null); }
            URL.revokeObjectURL(u);
          };
          im.onerror = function () { URL.revokeObjectURL(u); res(null); };
          im.src = u;
        });
      });
    })).then(function (a) { return a.filter(Boolean); });
  }
  function buildPdf(n, pimgs) {
    pimgs = pimgs || [];
    var cv = document.createElement("canvas").getContext("2d"), PW = 595, PH = 842, M = 56, MAXW = PW - 2 * M;
    function wid(t, size, bold) { cv.font = (bold ? "bold " : "") + size + "px Arial, Helvetica, sans-serif"; return cv.measureText(t).width * 1.04; }
    function wrap(t, size, bold, maxw) {
      var words = t.split(" "), lines = [], cur = "";
      words.forEach(function (w) {
        var tryL = cur ? cur + " " + w : w;
        if (wid(tryL, size, bold) <= maxw || !cur) {
          if (wid(tryL, size, bold) > maxw) { var piece = ""; for (var k = 0; k < tryL.length; k++) { if (wid(piece + tryL[k], size, bold) > maxw && piece) { lines.push(piece); piece = ""; } piece += tryL[k]; } cur = piece; } else cur = tryL;
        } else { lines.push(cur); cur = w; }
      });
      lines.push(cur); return lines;
    }
    var blocks = [];
    var ey = 120;
    blocks.push({ t: n.title.trim() || (n.type === "list" ? "Lista" : "Nota"), size: 20, bold: true, gap: 10, ey: 0 });
    var src = n.type === "list" ? n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + (i.done ? "[x] " : "[ ] ") + i.t + itemMeta(i); }) : n.body.split("\n");
    src.forEach(function (ln) {
      var size = 11, bold = false, ind = 0, t = latin1(ln), m;
      if ((m = t.match(/^(#{1,2})\s+(.*)$/))) { size = m[1].length === 1 ? 16 : 13.5; bold = true; t = m[2]; }
      else if ((m = t.match(/^>\s?(.*)$/))) { ind = 16; t = m[1]; }
      t = t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|\s)\*([^*]+)\*/g, "$1$2").replace(/==(?:\{[a-z]+\})?(?=\S)(.+?)(?<=\S)==/g, "$1");
      blocks.push({ t: t, size: size, bold: bold, ind: ind, gap: 0, ey: ey });
      ey += Math.max(1, Math.ceil(ln.length / 34)) * 29;
    });
    if (n.tags.length) blocks.push({ t: n.tags.map(function (x) { return "#" + latin1(x); }).join(" "), size: 10, bold: false, gap: 10 });
    var pages = [[]], y = PH - M;
    var pend = pimgs.map(function (pi, idx) { return { pi: pi, idx: idx, top: pi.it.cy - (pi.it.w * 380 / pi.it.ar) / 2 }; }).sort(function (a, b) { return a.top - b.top; });
    function placeImg(q) {
      var wpt = Math.min(1, q.pi.it.w) * MAXW, hpt = wpt / q.pi.it.ar, maxh = PH - 2 * M - 10;
      if (hpt > maxh) { wpt *= maxh / hpt; hpt = maxh; }
      var inf = q.pi.it.info ? wrap(latin1(q.pi.it.info), 9.5, false, wpt) : [], capH = inf.length ? inf.length * 13.3 + 4 : 0;
      if (hpt + capH > maxh) { hpt = maxh - capH; wpt = hpt * q.pi.it.ar; }
      if (y - hpt - capH < M) { pages.push([]); y = PH - M; }
      var x0 = M + (MAXW - wpt) / 2;
      function cap() { inf.forEach(function (ln) { y -= 13.3; pages[pages.length - 1].push({ x: x0, y: y + 2.4, size: 9.5, bold: false, t: ln }); }); y -= 4; }
      if (q.pi.it.ip === "above" && inf.length) cap();
      y -= hpt; pages[pages.length - 1].push({ img: q.idx, x: x0, y: y, w: wpt, h: hpt });
      if (q.pi.it.ip !== "above" && inf.length) cap();
      y -= 10;
    }
    blocks.forEach(function (b) {
      while (pend.length && b.ey > 0 && pend[0].top <= b.ey) placeImg(pend.shift());
      var lh = b.size * 1.4, lines = wrap(latin1(b.t), b.size, b.bold, MAXW - (b.ind || 0));
      if (b.gap && pages[pages.length - 1].length) y -= 0;
      lines.forEach(function (ln) {
        if (y - lh < M) { pages.push([]); y = PH - M; }
        y -= lh; pages[pages.length - 1].push({ x: M + (b.ind || 0), y: y + b.size * 0.25, size: b.size, bold: b.bold, t: ln });
      });
      y -= b.gap || 0;
    });
    while (pend.length) placeImg(pend.shift());
    var objs = [], np = pages.length, NI = pimgs.length, base = 5 + NI;
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[2] = "<< /Type /Pages /Kids [" + pages.map(function (_, i) { return (base + i * 2) + " 0 R"; }).join(" ") + "] /Count " + np + " >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    pimgs.forEach(function (pi, i) {
      objs[5 + i] = "<< /Type /XObject /Subtype /Image /Width " + pi.w + " /Height " + pi.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + pi.bin.length + " >>\nstream\n" + pi.bin + "\nendstream";
    });
    pages.forEach(function (pg, i) {
      var used = {};
      var stream = pg.map(function (l) { if (l.img != null) { used[l.img] = 1; return "q " + l.w.toFixed(1) + " 0 0 " + l.h.toFixed(1) + " " + l.x.toFixed(1) + " " + l.y.toFixed(1) + " cm /Im" + l.img + " Do Q"; } return "BT /" + (l.bold ? "F2" : "F1") + " " + l.size + " Tf " + l.x.toFixed(1) + " " + l.y.toFixed(1) + " Td (" + pdfEsc(l.t) + ") Tj ET"; }).join("\n");
      var xo = Object.keys(used).map(function (k) { return "/Im" + k + " " + (5 + Number(k)) + " 0 R"; }).join(" ");
      objs[base + i * 2] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PW + " " + PH + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>" + (xo ? " /XObject << " + xo + " >>" : "") + " >> /Contents " + (base + 1 + i * 2) + " 0 R >>";
      objs[base + 1 + i * 2] = "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream";
    });
    var out = "%PDF-1.4\n", offs = [];
    for (var k = 1; k < objs.length; k++) { offs[k] = out.length; out += k + " 0 obj\n" + objs[k] + "\nendobj\n"; }
    var xr = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
    for (k = 1; k < objs.length; k++) out += String(offs[k]).padStart(10, "0") + " 00000 n \n";
    out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF";
    return out;
  }
  function exportMd() {
    var n = cur(); if (!n) return;
    shareFile(safeName(n.title) + ".md", noteMarkdown(n), "text/markdown", n.title.trim() || "Nota de Tronx").then(function (ok) {
      if (ok && !capPlugin("Share")) toast("Archivo .md descargado");
    }).catch(function () { toast("No se pudo guardar el archivo"); });
  }
  function exportPdf() {
    var n = cur(); if (!n) return;
    pdfImages(n).catch(function () { return []; }).then(function (pimgs) {
      var bin; try { bin = buildPdf(n, pimgs); } catch { toast("No se pudo crear el PDF"); return; }
      return shareFile(safeName(n.title) + ".pdf", btoa(bin), "application/pdf", n.title.trim() || "Nota de Tronx", true).then(function (ok) {
        if (ok && !capPlugin("Share")) toast("PDF descargado");
      });
    }).catch(function () { toast("No se pudo guardar el PDF"); });
  }
  $("mdBtn").addEventListener("click", exportMd);
  $("pdfBtn").addEventListener("click", exportPdf);

  /* ---------- huella ---------- */
  var bioAvailCache = null, bioBusy = false;
  function bioPlug() { return capPlugin("BiometricAuth"); }
  function bioAvail() {
    if (bioAvailCache !== null) return Promise.resolve(bioAvailCache);
    var pl = bioPlug(); if (!pl || !pl.checkBiometry) { return Promise.resolve(false); }
    return pl.checkBiometry().then(function (r) { bioAvailCache = !!(r && r.isAvailable); return bioAvailCache; }).catch(function () { return false; });
  }
  function bioAuth(reason) {
    var pl = bioPlug(); if (!pl || !pl.authenticate) return Promise.reject(new Error("no-bio"));
    bioBusy = true;
    var fin = function () { bioBusy = false; hiddenAt = 0; };
    return pl.authenticate({ reason: reason, cancelTitle: "Cancelar", allowDeviceCredential: true, androidTitle: "Tronx", androidSubtitle: reason }).then(function (r) { fin(); return r; }, function (e) { fin(); throw e; });
  }
  /* pide PIN/huella para una nota protegida */
  function askNote(n, ok, cancel) {
    var l = n.lock; if (!l) { ok(); return; }
    var bio = l.m === "bio" || l.m === "both";
    var ok0 = ok;
    ok = function () {
      var pin = lastPin; lastPin = "";
      if (!isPinEnc(n)) { ok0(); return; }
      encUnlock(n, pin).then(function () { ok0(); }, function () { toast("No se pudo descifrar la nota. Si es de una copia, revisá que el PIN sea el de esa nota."); if (cancel) cancel(); });
    };
    openLock("unlock", ok, { target: l.m === "bio" ? { m: "bio", s: "", h: "" } : l, title: "Nota protegida", sub: l.m === "pass" ? "Escribí la frase de esta nota" : "Ingresá el PIN de esta nota", cancelable: true, bio: bio, onlyBio: l.m === "bio", onCancel: cancel });
  }
  function renderNoteLock() {
    var n = cur(); if (!n) return;
    var l = n.lock, names = { pin: "un PIN propio", pass: "una frase", bio: "la huella", both: "huella o PIN" };
    $("nlSet").textContent = l ? "Cambiar protección" : "Proteger esta nota";
    $("nlOff").hidden = !l;
    $("nlHint").textContent = l ? "Esta nota se abre con " + names[l.m] + ". "+(l.m === "pass" ? "El texto y las imágenes se guardan cifrados en el teléfono y en las copias de seguridad" + (settings.encTitle ? ", y el título también" : "") + ". Una frase larga protege bien aunque alguien tenga los archivos. Si la olvidás no se puede recuperar." : l.m === "pin" ? "El texto y las imágenes se guardan cifrados en el teléfono y en las copias de seguridad" + (settings.encTitle ? ", y el título también" : " (el título no: podés ocultarlo en Ajustes)") + ". Con un PIN de 4 dígitos protege de curiosos, no de un ataque decidido; para más seguridad elegí una frase." : "Es un candado para curiosos: no cifra la nota, y las copias de seguridad la incluyen. Para cifrar el texto elegí un PIN propio.")+" Si olvidás el PIN y no tenés huella, no se puede recuperar." : "Opcional. Podés pedir un PIN propio, la huella del teléfono o cualquiera de los dos para abrir esta nota.";
    bioAvail().then(function (a) { $("nlBio").hidden = $("nlBoth").hidden = !a; });
  }
  function setNoteLock(n, lock, pin) {
    var enc = !!(lock && (lock.m === "pin" || lock.m === "pass") && pin);
    if (!enc && n.images.length && isPinEnc(n) && encMeta.has(n)) { /* primero las imágenes vuelven a claro, después se cambia el bloqueo */
      encRelease(n).then(function () { setNoteLock2(n, lock, pin, enc); }); return;
    }
    setNoteLock2(n, lock, pin, enc);
  }
  function setNoteLock2(n, lock, pin, enc) {
    encDrop(n); n.lock = lock;
    if (enc) encUnlock(n, pin);
    changed(n); persistNow(); renderNoteLock(); renderAll(); syncReminders();
    if (lock) unlocked.add(n.id); else unlocked.delete(n.id);
  }
  $("nlSet").addEventListener("click", function () { var pk = $("nlPick"); pk.hidden = !pk.hidden; });
  $("nlPick").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; var n = cur(); if (!n) return; var m = b.dataset.m;
    function go() {
      $("nlPick").hidden = true;
      if (m === "bio") {
        bioAuth("Confirmá con tu huella para proteger la nota").then(function () { setNoteLock(n, { m: "bio", s: "", h: "" }); toast("Nota protegida con huella"); }).catch(function () { toast("No se pudo confirmar la huella"); });
        return;
      }
      openLock("set1", null, { setCb: function (s, h, pin) { setNoteLock(n, { m: m, s: s, h: h }, pin); toast(m === "both" ? "Nota protegida: huella o PIN" : m === "pass" ? "Nota protegida con frase" : "Nota protegida con PIN"); }, title: m === "pass" ? "Frase de la nota" : "PIN de la nota", sub: m === "pass" ? "Elegí una frase de al menos 6 caracteres" : "Elegí 4 dígitos", cancelable: true, pass: m === "pass", onCancel: function () {} });
    }
    if (n.lock) askNote(n, go); else go();
  });
  $("nlOff").addEventListener("click", function () { var n = cur(); if (!n) return; askNote(n, function () { setNoteLock(n, null); toast("Protección quitada"); }); });

  /* ---------- bloqueo con PIN ---------- */
  var lockTarget = null, lockSetCb = null, lockCancelCb = null;
  var lockPassMode = false, PINKEY = "tronx.pin.v1", lockMode = "unlock", lockBuf = "", lockTmp = "", lockOk = null, lockBusy = false, lockFails = 0, lockUntil = 0, lockTimer = 0, hiddenAt = 0;
  function pinData() { try { var d = JSON.parse(lsGet(PINKEY) || "null"); return d && d.h && d.s ? d : null; } catch { return null; } }
  function pinHash(pin, salt) {
    var txt = "tronx|" + salt + "|" + pin;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)).then(function (b) { return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); });
    }
    var h = 5381; for (var i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) | 0;
    return Promise.resolve("f" + (h >>> 0).toString(16));
  }
  function renderPinUI() {
    var on = !!pinData();
    $("pinSetBtn").hidden = on; $("pinChgBtn").hidden = !on; $("pinOffBtn").hidden = !on;
    var pb = $("pinBioBtn"); pb.hidden = true;
    if (on) bioAvail().then(function (a) { pb.hidden = !a || !pinData(); pb.setAttribute("aria-pressed", settings.pinBio ? "true" : "false"); });
    $("pinHint").textContent = on ? "El PIN está activado: Tronx pide el código al abrirla y al volver después de unos segundos. Si lo olvidás no hay forma de recuperarlo, salvo borrar los datos de la app (se pierden las notas sin copia)." : "Protegé la app con un PIN de 4 dígitos. Es un candado para curiosos: no cifra tus notas.";
  }
  function lockDraw() {
    var d = $("lockDots"); d.textContent = "";
    if (lockPassMode) { $("lockPass").value = ""; return; }
    for (var i = 0; i < 4; i++) d.appendChild(el("i", i < lockBuf.length ? "on" : ""));
  }
  function lockPadBuild() {
    var pad = $("lockPad"); if (pad.firstChild) return;
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].forEach(function (k) {
      var b = el("button", k ? "" : "nil"); b.type = "button"; b.textContent = k; b.dataset.k = k; if (!k) b.disabled = true;
      b.setAttribute("aria-label", k === "⌫" ? "Borrar" : k || ""); pad.appendChild(b);
    });
  }
  function openLock(mode, onOk, o) {
    o = o || {};
    lockMode = mode; lockOk = onOk || null; lockBuf = ""; lockTmp = ""; lockBusy = false; lockPadBuild();
    lockTarget = o.target || null; lockSetCb = o.setCb || null; lockCancelCb = o.onCancel || null;
    var bioMode = !!o.bio;
    lockPassMode = !!o.pass || !!(o.target && o.target.m === "pass");
    var t = { unlock: ["Tronx bloqueado", "Ingresá tu PIN"], verify: ["Confirmá tu PIN", "Ingresá el PIN actual"], set1: ["Nuevo PIN", "Elegí 4 dígitos"], set2: ["Repetí el PIN", "Escribilo otra vez"] }[mode];
    if (lockPassMode) t = { unlock: ["Nota protegida", "Escribí la frase de esta nota"], verify: ["Confirmá", "Escribí la frase"], set1: ["Frase de la nota", "Elegí una frase de al menos 6 caracteres"], set2: ["Repetí la frase", "Escribila otra vez"] }[mode];
    $("lockT").textContent = o.title || t[0]; $("lockS").textContent = bioMode && o.onlyBio ? "Usá tu huella para abrirla" : (o.sub || t[1]);
    $("lockCancel").hidden = mode === "unlock" && !o.cancelable; $("lock").hidden = false; lockDraw();
    $("lockPad").hidden = $("lockDots").hidden = !!o.onlyBio || lockPassMode;
    $("lockPass").hidden = $("lockPassGo").hidden = !lockPassMode; $("lockPass").value = "";
    if (lockPassMode) setTimeout(function () { try { $("lockPass").focus(); } catch { /* sin foco */ } }, 120);
    $("lockBio").hidden = !bioMode;
    lockPadState();
    if (mode === "unlock" && !o.target && !bioMode && settings.pinBio && pinData()) {
      bioAvail().then(function (a) {
        if (!a || $("lock").hidden || lockMode !== "unlock" || lockTarget) return;
        $("lockBio").hidden = false; $("lockS").textContent = "Ingresá tu PIN o usá la huella";
        setTimeout(function () { if (!$("lock").hidden && lockMode === "unlock" && !lockTarget) lockBioTry(); }, 200);
      });
    }
    if (bioMode) setTimeout(function () { if (!$("lock").hidden) lockBioTry(); }, 250);
  }
  function lockBioTry() {
    var forApp = !lockTarget && lockMode === "unlock";
    bioAuth(forApp ? "Abrir Tronx" : "Abrir nota protegida").then(function () { lockBusy = false; lockDone(); }).catch(function () { $("lockS").textContent = lockTarget && lockTarget.m === "bio" ? "No se reconoció. Tocá \"Usar huella\"" : "No se reconoció. Ingresá el PIN"; });
  }
  function lockPadState() {
    var cool = Date.now() < lockUntil;
    $("lockPad").querySelectorAll("button").forEach(function (b) { b.disabled = cool || !b.dataset.k; });
    $("lockPass").disabled = $("lockPassGo").disabled = cool;
    if (cool) {
      clearInterval(lockTimer);
      lockTimer = setInterval(function () {
        var s = Math.ceil((lockUntil - Date.now()) / 1000);
        if (s <= 0) { clearInterval(lockTimer); $("lockS").textContent = "Ingresá tu PIN"; lockPadState(); } else $("lockS").textContent = "Demasiados intentos. Esperá " + s + " s";
      }, 500);
    }
  }
  function lockFail(msg) {
    var box = document.querySelector(".lockbox"); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
    lockBuf = ""; lockDraw(); lockBusy = false;
    if (lockMode === "unlock" || lockMode === "verify") {
      lockFails++;
      if (lockFails >= 5) { lockFails = 0; lockUntil = Date.now() + 30000; lockPadState(); return; }
    }
    $("lockS").textContent = msg;
  }
  function lockDone() { $("lock").hidden = true; lockBuf = ""; lockFails = 0; lockTarget = null; lockCancelCb = null; var f = lockOk; lockOk = null; if (f) f(); }
  function lockEnter(k) {
    if (lockBusy || Date.now() < lockUntil) return;
    if (k === "⌫") { lockBuf = lockBuf.slice(0, -1); lockDraw(); return; }
    if (lockBuf.length >= 4) return;
    lockBuf += k; lockDraw();
    if (lockBuf.length < 4) return;
    lockSubmit(lockBuf);
  }
  function lockSubmit(pin) {
    if (lockBusy || Date.now() < lockUntil) return;
    if (lockPassMode && (lockMode === "set1") && pin.length < 6) { lockFail("Usá al menos 6 caracteres"); return; }
    lockBusy = true;
    var d = lockTarget || pinData();
    if (lockMode === "unlock" || lockMode === "verify") {
      pinHash(pin, d ? d.s : "").then(function (h) { if (d && h === d.h) { lockBusy = false; lastPin = lockTarget ? pin : ""; lockDone(); } else lockFail(lockPassMode ? "Frase incorrecta" : "PIN incorrecto"); });
    } else if (lockMode === "set1") {
      lockTmp = pin; lockMode = "set2"; lockBuf = ""; lockBusy = false; $("lockT").textContent = lockPassMode ? "Repetí la frase" : "Repetí el PIN"; $("lockS").textContent = "Escribila otra vez".replace("Escribila", lockPassMode ? "Escribila" : "Escribilo"); lockDraw();
    } else if (lockMode === "set2") {
      if (pin !== lockTmp) { lockMode = "set1"; lockFail(lockPassMode ? "No coinciden. Elegí otra" : "No coinciden. Elegí uno nuevo"); $("lockT").textContent = lockPassMode ? "Frase de la nota" : "Nuevo PIN"; return; }
      var salt = uid() + uid();
      if (lockSetCb) { pinHash(pin, salt).then(function (h) { var cb = lockSetCb; lockSetCb = null; lockBusy = false; $("lock").hidden = true; lockBuf = ""; lockOk = null; lockCancelCb = null; cb(salt, h, pin); }); return; }
      pinHash(pin, salt).then(function (h) { lsSet(PINKEY, JSON.stringify({ s: salt, h: h })); lockBusy = false; lockDone(); renderPinUI(); toast("PIN activado"); });
    }
  }
  $("lockPad").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && b.dataset.k) lockEnter(b.dataset.k); });
  $("lockCancel").addEventListener("click", function () { $("lock").hidden = true; lockOk = null; lockSetCb = null; lockTarget = null; var f = lockCancelCb; lockCancelCb = null; if (f) f(); });
  $("lockBio").addEventListener("click", lockBioTry);
  $("lockPassGo").addEventListener("click", function () { var v = $("lockPass").value; if (v) lockSubmit(v); });
  $("lockPass").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("lockPassGo").click(); } });
  document.addEventListener("keydown", function (e) {
    if ($("lock").hidden || lockPassMode) return;
    if (/^[0-9]$/.test(e.key)) lockEnter(e.key); else if (e.key === "Backspace") lockEnter("⌫");
  });
  $("pinBioBtn").addEventListener("click", function () {
    if (settings.pinBio) { settings.pinBio = false; saveSettings(); renderPinUI(); toast("Huella desactivada para abrir Tronx"); return; }
    bioAuth("Confirmá tu huella para abrir Tronx con ella").then(function () { settings.pinBio = true; saveSettings(); renderPinUI(); toast("Tronx se abrirá también con huella"); }).catch(function () { toast("No se pudo confirmar la huella"); });
  });
  $("pinSetBtn").addEventListener("click", function () { openLock("set1"); });
  $("pinChgBtn").addEventListener("click", function () { openLock("verify", function () { openLock("set1"); }); });
  $("pinOffBtn").addEventListener("click", function () { openLock("verify", function () { try { localStorage.removeItem(PINKEY); } catch {} settings.pinBio = false; saveSettings(); renderPinUI(); toast("PIN quitado"); }); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (!bioBusy) hiddenAt = Date.now(); commitVersion(); return; }
    if (bioBusy) return;
    if (hiddenAt && Date.now() - hiddenAt > 20000) {
      unlocked.clear(); var cn = cur(), again = function () { if (cn && cn.lock && cur() === cn) askNote(cn, function () { unlocked.add(cn.id); }, function () { closeLayer("editor"); }); };
      if (pinData() && $("lock").hidden) openLock("unlock", again);
      else if ($("lock").hidden) again();
    }
  });
  renderPinUI();
  if (pinData()) openLock("unlock");

