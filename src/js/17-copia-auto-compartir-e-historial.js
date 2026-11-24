  /* ---------- copia automática ---------- */
  function bkTx(mode) { return idbOpen().then(function (db) { return db.transaction("bk", mode).objectStore("bk"); }); }
  function bkPut(key, val) { return bkTx("readwrite").then(function (st) { return new Promise(function (res, rej) { var q = st.put(val, key); q.onsuccess = function () { res(true); }; q.onerror = function () { rej(q.error); }; }); }); }
  function bkAll() {
    return bkTx("readonly").then(function (st) {
      return new Promise(function (res) { var out = [], q = st.openCursor(); q.onsuccess = function () { var c = q.result; if (c) { out.push({ k: c.key, v: c.value }); c.continue(); } else res(out); }; q.onerror = function () { res(out); }; });
    }).catch(function () { return []; });
  }
  function bkTrim() {
    return bkAll().then(function (a) {
      a = a.filter(function (x) { return String(x.k).indexOf("auto-") === 0; }).sort(function (x, y) { return x.k < y.k ? 1 : -1; });
      var keep = settings.autoBkKeep || 7; if (a.length <= keep) return;
      return bkTx("readwrite").then(function (st) { a.slice(keep).forEach(function (x) { st.delete(x.k); }); });
    }).catch(function () {});
  }
  function notesSig() { var m = 0, c = 0, l = 0; notes.forEach(function (n) { c++; m = Math.max(m, n.updatedAt); l += n.body.length + n.title.length + n.images.length; }); return c + ":" + m + ":" + l; }
  /* en Documentos/Tronx se guardan las últimas copias con fecha; las más viejas se borran */
  function fsTrim(fs) {
    if (!fs.readdir || !fs.deleteFile) return Promise.resolve();
    var keep = settings.autoBkKeep || 7;
    return fs.readdir({ path: "Tronx", directory: "DOCUMENTS" }).then(function (r) {
      var names = ((r && r.files) || []).map(function (f) { return typeof f === "string" ? f : f && f.name; }).filter(function (nm) { return /^tronx-copia-auto-\d{8}-?\d{4}\.json$/.test(nm || ""); }).sort().reverse();
      return Promise.all(names.slice(keep).map(function (nm) { return fs.deleteFile({ path: "Tronx/" + nm, directory: "DOCUMENTS" }).catch(function () {}); }));
    }).catch(function () {});
  }
  var bkBusy = false;
  /* ¿toca una copia según el horario elegido? */
  function bkDue() {
    var every = Number(settings.autoBkEvery) || 0; if (!every) return false;
    var last = settings.autoBkChk || settings.autoBkAt || 0; if (!last) return true;
    var iv = every * 3600000, tm = /^(\d{1,2}):(\d{2})$/.exec(settings.autoBkTime || "");
    if (!tm || every < 24) return Date.now() - last >= iv;
    var base = new Date(last); base.setHours(0, 0, 0, 0); var alt = new Date(base); alt.setHours(Number(tm[1]), Number(tm[2]), 0, 0);
    base.setDate(base.getDate() + every / 24); base.setHours(Number(tm[1]), Number(tm[2]), 0, 0);
    if (every === 24 && alt.getTime() > last) base = alt; /* diaria: si todavía no hubo copia de esa franja, toca */
    return Date.now() >= base.getTime();
  }
  function autoBackup(force, why) {
    if (bkBusy || !notes.size) return Promise.resolve();
    if (!force) {
      if (!settings.autoBk) return Promise.resolve();
      var changedNow = notesSig() !== settings.autoBkSig, onlyChg = settings.autoBkChg !== false;
      if (why === "exit") { if (!settings.autoBkExit || Date.now() - (settings.autoBkAt || 0) < 120000 || (onlyChg && !changedNow)) return Promise.resolve(); }
      else {
        if (!bkDue()) return Promise.resolve();
        if (onlyChg && !changedNow) { settings.autoBkChk = Date.now(); saveSettings(); return Promise.resolve(); }
      }
    }
    bkBusy = true; persistNow();
    var json = backupJson(), d = new Date(), p2 = function (x) { return String(x).padStart(2, "0"); };
    var key = "auto-" + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "-" + p2(d.getHours()) + p2(d.getMinutes()), where = "";
    return bkPut(key, { t: Date.now(), n: notes.size, json: json }).then(bkTrim).catch(function () {}).then(function () {
      var fs = capPlugin("Filesystem"); if (!fs) { where = "web"; return; }
      return imagesForBackup().then(function (imgs) {
        var obj = JSON.parse(json), size = 0, ids = Object.keys(imgs);
        ids.forEach(function (id) { size += imgs[id].length; });
        if (ids.length && size < 15 * 1024 * 1024) obj.images = imgs;
        var fname = "tronx-copia-auto-" + key.slice(5).replace(/-/g, "") + ".json";
        return fs.writeFile({ path: "Tronx/" + fname, data: JSON.stringify(obj), directory: "DOCUMENTS", encoding: "utf8", recursive: true })
          .then(function () { where = "ok" + (ids.length && !obj.images ? "-sinimg" : ""); return fsTrim(fs); });
      }).catch(function (e) { where = "fail:" + String((e && (e.message || e.code)) || e).slice(0, 90); });
    }).then(function () {
      settings.autoBkAt = settings.autoBkChk = Date.now(); settings.autoBkSig = notesSig(); settings.autoBkWhere = where;
      if (where.indexOf("ok") === 0) settings.lastBackup = Date.now();
      saveSettings(); bkBusy = false; renderAutoBk(); try { renderBkBar(); } catch {}
    }).catch(function () { bkBusy = false; });
  }
  var BKDT = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function renderAutoBk() {
    var seg = $("autoBkSeg"); if (!seg) return;
    seg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === settings.autoBk ? "true" : "false"); });
    var w = settings.autoBkWhere || "", t = settings.autoBkAt ? "Última copia: " + BKDT.format(new Date(settings.autoBkAt)).replace(",", "").replace(/\.?$/, ".") + " " : "Todavía no se hizo ninguna copia. ";
    var where = w.indexOf("ok") === 0 ? "Guardada también en la carpeta Documentos/Tronx del teléfono" + (w === "ok-sinimg" ? " (sin las imágenes, por su tamaño)." : ".")
      : w.indexOf("fail") === 0 ? "No se pudo guardar en Documentos (" + w.slice(5) + "); quedó solo dentro de la app." : w === "web" ? "Guardada dentro de la app." : "";
    var ev = Number(settings.autoBkEvery) || 0, EVL = { 6: "cada 6 horas", 12: "cada 12 horas", 24: "todos los días", 48: "cada 2 días", 72: "cada 3 días", 168: "una vez por semana" }, tm = /^\d{1,2}:\d{2}$/.test(settings.autoBkTime || "") && ev >= 24 ? " a las " + settings.autoBkTime : "";
    var rules = [];
    if (ev) rules.push(EVL[ev] + tm + (settings.autoBkChg !== false ? " (si hubo cambios)" : ""));
    if (settings.autoBkExit) rules.push("cada vez que salís de la app" + (settings.autoBkChg !== false ? " (si hubo cambios)" : ""));
    $("autoBkCfg").hidden = !settings.autoBk; $("autoBkTimeRow").hidden = ev < 24;
    $("autoBkEvery").value = String(ev); $("autoBkTime").value = settings.autoBkTime || ""; $("autoBkKeep").value = String(settings.autoBkKeep || 7);
    $("autoBkExit").setAttribute("aria-pressed", settings.autoBkExit ? "true" : "false"); $("autoBkChg").setAttribute("aria-pressed", settings.autoBkChg !== false ? "true" : "false");
    $("autoBkHint").textContent = (settings.autoBk ? (rules.length ? "Se hace una copia " + rules.join(" y ") + ". Se conservan las últimas " + (settings.autoBkKeep || 7) + " dentro de la app. Las copias programadas se hacen con la app abierta; si estaba cerrada, se hacen apenas la abrís. " : "No hay horario ni salida elegidos: solo se copia cuando tocás “Copiar ahora”. ") : "Está apagada. ") + t + where;
    $("autoBkPerm").hidden = !(w.indexOf("fail") === 0 && /permi|denied|EACCES/i.test(w));
    bkAll().then(function (a) {
      var box = $("autoBkList"); box.textContent = "";
      a.filter(function (x) { return x.v && x.v.json; }).sort(function (x, y) { return x.v.t < y.v.t ? 1 : -1; }).forEach(function (x) {
        var row = el("div", "verrow"), vt = el("div", "vt"), b = el("b"), sp = el("span");
        b.textContent = BKDT.format(new Date(x.v.t)).replace(",", ""); sp.textContent = x.v.n + (x.v.n === 1 ? " nota" : " notas");
        vt.appendChild(b); vt.appendChild(sp); row.appendChild(vt);
        var rb = el("button", "btn small"); rb.type = "button"; rb.textContent = "Recuperar";
        rb.addEventListener("click", function () { importBackup(x.v.json); });
        var nb = el("button", "btn small"); nb.type = "button"; nb.textContent = "Ver notas"; nb.setAttribute("aria-label", "Ver las notas de la copia del " + b.textContent);
        nb.addEventListener("click", function () { openBkNotes(x.v.json); });
        row.appendChild(nb); row.appendChild(rb); box.appendChild(row);
      });
    });
  }
  $("autoBkSeg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; settings.autoBk = b.dataset.v === "on"; saveSettings(); renderAutoBk(); });
  function bkCfg(fn) { fn(); saveSettings(); renderAutoBk(); autoBackup(false); }
  $("autoBkEvery").addEventListener("change", function () { bkCfg(function () { settings.autoBkEvery = Number($("autoBkEvery").value) || 0; }); });
  $("autoBkTime").addEventListener("change", function () { bkCfg(function () { settings.autoBkTime = $("autoBkTime").value || ""; }); });
  $("autoBkTimeClr").addEventListener("click", function () { bkCfg(function () { settings.autoBkTime = ""; }); });
  $("autoBkExit").addEventListener("click", function () { bkCfg(function () { settings.autoBkExit = !settings.autoBkExit; }); });
  $("autoBkChg").addEventListener("click", function () { bkCfg(function () { settings.autoBkChg = settings.autoBkChg === false; }); });
  $("autoBkKeep").addEventListener("change", function () { bkCfg(function () { settings.autoBkKeep = Number($("autoBkKeep").value) || 7; }); bkTrim().then(renderAutoBk); });
  $("autoBkNow").addEventListener("click", function () { toast("Haciendo la copia…"); autoBackup(true).then(function () { toast(settings.autoBkWhere.indexOf("ok") === 0 ? "Copia hecha en Documentos/Tronx" : "Copia hecha dentro de la app"); }); });
  $("autoBkPerm").addEventListener("click", function () {
    var fs = capPlugin("Filesystem"); if (!fs || !fs.requestPermissions) return;
    fs.requestPermissions().then(function () { return autoBackup(true); }).catch(function () { toast("No se pudo pedir el permiso"); });
  });
  setTimeout(function () { autoBackup(false); renderAutoBk(); }, 7000);
  document.addEventListener("visibilitychange", function () { if (document.hidden) autoBackup(false, "exit"); else autoBackup(false); });
  setInterval(function () { if (!document.hidden) autoBackup(false); }, 60000);

  /* ---------- compartir como imagen ---------- */
  var SI = { style: "universo", imgs: true, brand: true, tok: 0, canvas: null, url: "" };
  var SI_FAM = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", SI_DISP = "'Bricolage Grotesque', " + SI_FAM;
  var SI_HL = { amarillo: "rgba(250,204,21,.5)", verde: "rgba(74,222,128,.45)", rosa: "rgba(244,114,182,.48)", celeste: "rgba(56,189,248,.48)", naranja: "rgba(251,146,60,.5)" };
  function siTheme(n) {
    if (SI.style === "papel") return { bg: ["#fbf8f2", "#f1eadb"], ink: "#27233a", mute: "#7a7690", accent: "#6d4aff", soft: "rgba(0,0,0,.06)" };
    if (SI.style === "color") {
      var rgb = colorOf(n.color).rgb || [109, 74, 255], lum = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11, dk = lum < 165;
      function sh(k) { return "rgb(" + rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * k))); }).join(",") + ")"; }
      return { bg: [sh(1.0), sh(0.72)], ink: dk ? "#ffffff" : "#1d1a2b", mute: dk ? "rgba(255,255,255,.75)" : "rgba(29,26,43,.65)", accent: dk ? "#ffffff" : "#1d1a2b", soft: dk ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.1)" };
    }
    return { bg: ["#15132e", "#241f4d"], ink: "#f2f0ff", mute: "#a9a5d6", accent: "#b39cff", soft: "rgba(255,255,255,.08)", stars: true };
  }
  function siRuns(t) {
    var out = [], re = /\*\*(.+?)\*\*|(^|\s)\*([^*]+)\*|==(?:\{(amarillo|verde|rosa|celeste|naranja)\})?(?=\S)(.+?)(?<=\S)==|\[\[([^\]\n]+?)\]\]/g, last = 0, m;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push({ t: t.slice(last, m.index) });
      if (m[1] !== undefined) out.push({ t: m[1], b: 1 });
      else if (m[3] !== undefined) { if (m[2]) out.push({ t: m[2] }); out.push({ t: m[3], i: 1 }); }
      else if (m[5] !== undefined) out.push({ t: m[5], hl: m[4] || "amarillo" });
      else out.push({ t: m[6], ln: 1 });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push({ t: t.slice(last) });
    return out;
  }
  function siFont(sz, st, base) { return (st.b || base ? "700 " : "400 ") + (st.i ? "italic " : "") + sz + "px " + (base ? SI_DISP : SI_FAM); }
  function siLayout(ctx, runs, maxW, sz, base) {
    var lines = [], line = { segs: [], w: 0 };
    function push() { lines.push(line); line = { segs: [], w: 0 }; }
    runs.forEach(function (r) {
      r.t.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return; ctx.font = siFont(sz, r, base); var w = ctx.measureText(tok).width, sp = /^\s+$/.test(tok);
        if (sp) { if (line.segs.length) { line.segs.push({ t: " ", w: ctx.measureText(" ").width, r: r }); line.w += ctx.measureText(" ").width; } return; }
        if (line.w + w > maxW && line.segs.length) { while (line.segs.length && line.segs[line.segs.length - 1].t === " ") { line.w -= line.segs.pop().w; } push(); }
        if (w > maxW) { /* palabra más larga que la línea: se corta */
          var piece = ""; for (var k = 0; k < tok.length; k++) { var cw = ctx.measureText(piece + tok[k]).width; if (cw > maxW - line.w && piece) { line.segs.push({ t: piece, w: ctx.measureText(piece).width, r: r }); push(); piece = ""; } piece += tok[k]; }
          tok = piece; w = ctx.measureText(tok).width;
        }
        line.segs.push({ t: tok, w: w, r: r }); line.w += w;
      });
    });
    if (line.segs.length || !lines.length) push();
    return lines;
  }
  function siImage(it, cw) {
    return imgGet(it.src).then(function (blob) {
      if (!blob) return null;
      return new Promise(function (res) {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () {
          try {
            var ch = Math.max(1, Math.round(cw / it.ar)), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
            var c = cv.getContext("2d");
            if (it.rad > 0) { var r = Math.min(cw, ch) * it.rad / 100; c.beginPath(); c.moveTo(r, 0); c.arcTo(cw, 0, cw, ch, r); c.arcTo(cw, ch, 0, ch, r); c.arcTo(0, ch, 0, 0, r); c.arcTo(0, 0, cw, 0, r); c.closePath(); c.clip(); }
            var fcss = imgFilter(it, cw / 360); if (fcss && "filter" in c) c.filter = fcss;
            c.globalAlpha = it.op; if (it.fl) { c.translate(cw, 0); c.scale(-1, 1); }
            var nw = im.naturalWidth, nh = im.naturalHeight, sa = nw / nh, sx = 0, sy = 0, sw = nw, sh = nh;
            if (sa > it.ar) { sw = nh * it.ar; sx = (nw - sw) * it.px; } else if (sa < it.ar) { sh = nw / it.ar; sy = (nh - sh) * it.py; }
            if (it.zm > 1.001) { var sw2 = sw / it.zm, sh2 = sh / it.zm; sx += (sw - sw2) * it.px; sy += (sh - sh2) * it.py; sw = sw2; sh = sh2; }
            c.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch); res(cv);
          } catch { res(null); }
          URL.revokeObjectURL(u);
        };
        im.onerror = function () { URL.revokeObjectURL(u); res(null); };
        im.src = u;
      });
    });
  }
  function renderNoteImage(n) {
    var W = 1080, PAD = 76, CW = W - PAD * 2, MAXH = 9000, T = siTheme(n), mc = document.createElement("canvas").getContext("2d");
    var fonts = [document.fonts && document.fonts.load ? document.fonts.load("700 40px 'Bricolage Grotesque'").catch(function () {}) : null, document.fonts && document.fonts.load ? document.fonts.load("400 40px 'IBM Plex Sans'").catch(function () {}) : null];
    var imgsP = SI.imgs && n.type === "text" && n.images.length ? Promise.all(n.images.slice(0, 12).map(function (it) { var w = Math.round(CW * Math.max(0.45, Math.min(1, it.w || 1))); return siImage(it, w).then(function (cv) { return cv ? { it: it, cv: cv } : null; }); })).then(function (a) { return a.filter(Boolean); }) : Promise.resolve([]);
    return Promise.all(fonts).then(function () { return imgsP; }).then(function (pimgs) {
      var ops = [], y = 90, cut = false;
      function add(h) { y += h; }
      /* título */
      var title = (n.title || "").trim() || (n.type === "list" ? "Lista" : "Nota");
      siLayout(mc, [{ t: title }], CW, 64, true).forEach(function (ln) { ops.push({ k: "line", ln: ln, x: PAD, y: y, sz: 64, base: 1, color: T.ink }); add(80); });
      add(8); ops.push({ k: "rule", y: y, x: PAD, w: 96, color: T.accent }); add(44);
      var src = n.type === "list" ? n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + (i.done ? "[x] " : "[ ] ") + i.t + itemMeta(i); }) : n.body.split("\n");
      for (var si = 0; si < src.length; si++) {
        if (y > MAXH - 400) { cut = true; break; }
        var raw = src[si], t = raw, sz = 40, lh = 58, ind = 0, deco = null, base = 0, m;
        if (!t.trim()) { add(26); continue; }
        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(t)) { add(14); ops.push({ k: "hr", y: y, x: PAD, w: CW }); add(40); continue; }
        if ((m = t.match(/^(#{1,2})\s+(.*)$/))) { sz = m[1].length === 1 ? 54 : 46; lh = sz * 1.3; base = 1; t = m[2]; add(m[1].length === 1 ? 18 : 10); }
        else if ((m = t.match(/^>\s?(.*)$/))) { ind = 40; deco = { k: "quote" }; t = m[1]; }
        else if ((m = t.match(/^(\s*)\[( |x|X)\]\s*(.*)$/))) { ind = 62 + m[1].length * 14; deco = { k: "box", done: m[2] !== " " }; t = m[3]; }
        else if ((m = t.match(/^(\s*)[-*•]\s+(.*)$/))) { ind = 48 + m[1].length * 14; deco = { k: "dot" }; t = m[2]; }
        else if ((m = t.match(/^(\s*)(\d+)[.)]\s+(.*)$/))) { ind = 62 + m[1].length * 14; deco = { k: "num", n: m[2] }; t = m[3]; }
        else if (/^\s*\|/.test(t)) { if (/^\s*\|[\s:|-]+\|?\s*$/.test(t)) continue; t = t.replace(/^\s*\||\|\s*$/g, "").split("|").map(function (c) { return c.trim(); }).join("   ·   "); }
        var lines = siLayout(mc, siRuns(t), CW - ind, sz, base), y0 = y;
        lines.forEach(function (ln, li) { ops.push({ k: "line", ln: ln, x: PAD + ind, y: y, sz: sz, base: base, color: T.ink }); add(lh); });
        if (deco) ops.push({ k: deco.k, x: PAD, y: y0, h: lh, d: deco, hgt: y - y0 });
        add(base ? 8 : 4);
      }
      if (cut) { add(10); ops.push({ k: "line", ln: { segs: [{ t: "… la nota sigue en Tronx", w: 600, r: { i: 1 } }], w: 600 }, x: PAD, y: y, sz: 36, base: 0, color: T.mute }); add(60); }
      /* imágenes */
      pimgs.forEach(function (p) {
        if (y > MAXH - 300) return;
        add(24); var iw = p.cv.width, ih = p.cv.height, x = PAD + (CW - iw) / 2;
        ops.push({ k: "img", cv: p.cv, x: x, y: y, w: iw, h: ih }); add(ih);
        if (p.it.info && p.it.info.trim()) { add(14); siLayout(mc, [{ t: p.it.info.trim() }], CW, 32, false).forEach(function (ln) { ops.push({ k: "line", ln: ln, x: PAD, y: y, sz: 32, base: 0, color: T.mute, center: true }); add(44); }); }
        add(10);
      });
      /* pie */
      add(30);
      if (n.tags.length) {
        var tx = PAD; n.tags.slice(0, 8).forEach(function (g) { var label = "#" + g; mc.font = siFont(30, {}, 0); var w = mc.measureText(label).width + 36; if (tx + w > W - PAD) return; ops.push({ k: "tag", x: tx, y: y, w: w, t: label }); tx += w + 12; }); add(70);
      }
      var foot = new Date(n.updatedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
      ops.push({ k: "foot", y: y + 30, t: foot, brand: SI.brand }); add(90);
      var H = Math.min(Math.max(y, 420), MAXH + 400), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var c = cv.getContext("2d"), g = c.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (T.stars) { var s = 7; c.fillStyle = "#fff"; for (var q = 0; q < Math.min(90, Math.round(H / 40)); q++) { s = (s * 1664525 + 1013904223) >>> 0; var sx = s / 4294967296 * W; s = (s * 1664525 + 1013904223) >>> 0; var sy = s / 4294967296 * H; s = (s * 1664525 + 1013904223) >>> 0; c.globalAlpha = 0.15 + (s / 4294967296) * 0.45; c.beginPath(); c.arc(sx, sy, 1 + (s % 3) * 0.6, 0, 6.2832); c.fill(); } c.globalAlpha = 1; }
      c.textBaseline = "alphabetic";
      ops.forEach(function (o) {
        if (o.k === "line") {
          var x = o.x; if (o.center) x = (W - o.ln.w) / 2;
          o.ln.segs.forEach(function (sg) {
            c.font = siFont(o.sz, sg.r, o.base); var by = o.y + o.sz * 0.95;
            if (sg.r.hl) { c.fillStyle = SI_HL[sg.r.hl]; c.fillRect(x - 3, o.y + o.sz * 0.08, sg.w + 6, o.sz * 1.16); }
            c.fillStyle = sg.r.ln ? T.accent : o.color; c.fillText(sg.t, x, by);
            if (sg.r.ln && sg.t !== " ") { c.fillRect(x, by + 5, sg.w, 2.5); }
            x += sg.w;
          });
        } else if (o.k === "rule") { c.fillStyle = o.color; c.fillRect(o.x, o.y, o.w, 8); }
        else if (o.k === "hr") { c.fillStyle = T.soft; c.fillRect(o.x, o.y, o.w, 3); }
        else if (o.k === "quote") { c.fillStyle = T.accent; c.globalAlpha = 0.7; c.fillRect(o.x, o.y + 4, 8, o.hgt - 8); c.globalAlpha = 1; }
        else if (o.k === "dot") { c.fillStyle = T.accent; c.beginPath(); c.arc(o.x + 22, o.y + 33, 7, 0, 6.2832); c.fill(); }
        else if (o.k === "num") { c.font = siFont(36, { b: 1 }, 0); c.fillStyle = T.accent; c.fillText(o.d.n + ".", o.x + 4, o.y + 40); }
        else if (o.k === "box") {
          c.lineWidth = 4; c.strokeStyle = T.accent; c.fillStyle = o.d.done ? T.accent : "transparent";
          var bx = o.x + 4, by2 = o.y + 12, bs = 36, r = 9; c.beginPath(); c.moveTo(bx + r, by2); c.arcTo(bx + bs, by2, bx + bs, by2 + bs, r); c.arcTo(bx + bs, by2 + bs, bx, by2 + bs, r); c.arcTo(bx, by2 + bs, bx, by2, r); c.arcTo(bx, by2, bx + bs, by2, r); c.closePath(); if (o.d.done) c.fill(); c.stroke();
          if (o.d.done) { c.strokeStyle = SI.style === "universo" ? "#15132e" : (SI.style === "papel" ? "#fff" : T.bg[1]); c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(bx + 9, by2 + 19); c.lineTo(bx + 16, by2 + 27); c.lineTo(bx + 28, by2 + 10); c.stroke(); }
        }
        else if (o.k === "img") { c.drawImage(o.cv, o.x, o.y); }
        else if (o.k === "tag") { c.fillStyle = T.soft; var rr = 22; c.beginPath(); c.moveTo(o.x + rr, o.y); c.arcTo(o.x + o.w, o.y, o.x + o.w, o.y + 52, rr); c.arcTo(o.x + o.w, o.y + 52, o.x, o.y + 52, rr); c.arcTo(o.x, o.y + 52, o.x, o.y, rr); c.arcTo(o.x, o.y, o.x + o.w, o.y, rr); c.fill(); c.font = siFont(30, {}, 0); c.fillStyle = T.ink; c.fillText(o.t, o.x + 18, o.y + 36); }
        else if (o.k === "foot") { c.font = siFont(28, {}, 0); c.fillStyle = T.mute; c.fillText(o.t, PAD, o.y); if (o.brand) { c.font = siFont(30, { b: 1 }, 1); c.textAlign = "right"; c.fillStyle = T.accent; c.fillText("Tronx", W - PAD, o.y); c.textAlign = "left"; } }
      });
      return cv;
    });
  }
  function siRender() {
    var n = cur(); if (!n) return; var tok = ++SI.tok;
    $("siMsg").hidden = false; $("siMsg").textContent = "Preparando la imagen…"; $("siImg").hidden = true; $("siShare").disabled = true;
    renderNoteImage(n).then(function (cv) {
      if (tok !== SI.tok) return;
      SI.canvas = cv;
      cv.toBlob(function (b) {
        if (tok !== SI.tok || !b) return;
        if (SI.url) URL.revokeObjectURL(SI.url); SI.url = URL.createObjectURL(b);
        $("siImg").src = SI.url; $("siImg").hidden = false; $("siMsg").hidden = true; $("siShare").disabled = false;
      }, "image/jpeg", 0.9);
    }).catch(function () { if (tok === SI.tok) $("siMsg").textContent = "No se pudo preparar la imagen."; });
  }
  function openShareImg() {
    var n = cur(); if (!n) return;
    $("siImgs").hidden = !(n.type === "text" && n.images.length);
    closeLayer("sheet");
    setTimeout(function () { $("shareImg").hidden = false; pushLayer("shareImg"); siRender(); }, 240);
  }
  registerLayer("shareImg", function () { $("shareImg").hidden = true; SI.tok++; SI.canvas = null; if (SI.url) { URL.revokeObjectURL(SI.url); SI.url = ""; } $("siImg").removeAttribute("src"); });
  $("imgBtn").addEventListener("click", openShareImg);
  $("siClose").addEventListener("click", function () { closeLayer("shareImg"); });
  $("shareImg").addEventListener("click", function (e) { if (e.target === $("shareImg")) closeLayer("shareImg"); });
  $("siStyles").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; SI.style = b.dataset.s; $("siStyles").querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); siRender(); });
  $("siImgs").addEventListener("click", function () { SI.imgs = !SI.imgs; $("siImgs").setAttribute("aria-pressed", SI.imgs ? "true" : "false"); siRender(); });
  $("siBrand").addEventListener("click", function () { SI.brand = !SI.brand; $("siBrand").setAttribute("aria-pressed", SI.brand ? "true" : "false"); siRender(); });
  $("siShare").addEventListener("click", function () {
    var n = cur(), cv = SI.canvas; if (!n || !cv) return;
    var big = cv.height > 6000, data = cv.toDataURL(big ? "image/jpeg" : "image/png", 0.92).split(",")[1];
    shareFile(safeName(n.title) + (big ? ".jpg" : ".png"), data, big ? "image/jpeg" : "image/png", n.title.trim() || "Nota de Tronx", true).then(function (ok) { if (ok) toast("Imagen lista"); }).catch(function () { toast("No se pudo compartir la imagen"); });
  });

  /* ---------- historial de versiones ---------- */
  var baseline = null;
  function snapOf(n) { return { id: n.id, title: n.title, body: n.body, items: n.items.map(function (i) { return copyItem(i); }) }; }
  function sameContent(a, b) { return a.title === b.title && a.body === b.body && JSON.stringify(a.items.map(function (i) { return [i.t, i.done, i.lv || 0, i.due || 0]; })) === JSON.stringify(b.items.map(function (i) { return [i.t, i.done, i.lv || 0, i.due || 0]; })); }
  function pushVersion(n, snap) {
    if (!snap || (!snap.title.trim() && !snap.body.trim() && !snap.items.some(function (i) { return i.t.trim(); }))) return false;
    if (n.versions.length && sameContent(n.versions[0], snap)) return false;
    n.versions.unshift({ t: Date.now(), title: snap.title, body: snap.body, items: snap.items });
    n.versions = cleanVersions(n.versions);
    return true;
  }
  function commitVersion() {
    var n = cur();
    if (!n || n.trashedAt || !baseline || baseline.id !== n.id) return;
    if (!sameContent(baseline, n) && pushVersion(n, baseline)) schedulePersist();
    baseline = snapOf(n);
  }
  function openHist() {
    var n = cur(); if (!n) return;
    commitVersion();
    var box = $("histBody"); box.textContent = "";
    if (!n.versions.length) { var e = el("p", "hint"); e.textContent = "Todavía no hay versiones anteriores. Aparecen después de editar la nota y salir de ella."; box.appendChild(e); }
    n.versions.forEach(function (v) {
      var row = el("div", "verrow"), vt = el("div", "vt"), b = el("b"), sp = el("span");
      b.textContent = when(v.t);
      sp.textContent = (v.title.trim() ? v.title.trim() + " — " : "") + (n.type === "list" ? v.items.map(function (i) { return i.t; }).join(", ") : v.body.replace(/\s+/g, " ")).slice(0, 90);
      vt.appendChild(b); vt.appendChild(sp); row.appendChild(vt);
      var rb = el("button", "btn small"); rb.type = "button"; rb.textContent = "Restaurar";
      rb.addEventListener("click", function () {
        pushVersion(n, snapOf(n));
        n.title = v.title; n.body = v.body; n.items = v.items.map(function (i) { return copyItem(i, true); });
        baseline = snapOf(n); changed(n); persistNow();
        closeLayer("sheet"); renderEditor(); toast("Versión restaurada");
      });
      row.appendChild(rb); box.appendChild(row);
    });
    $("hist").hidden = false; pushLayer("hist");
  }
  registerLayer("hist", function () { $("hist").hidden = true; });
  $("histBtn").addEventListener("click", openHist);
  $("histClose").addEventListener("click", function () { closeLayer("hist"); });
  $("hist").addEventListener("click", function (e) { if (e.target === $("hist")) closeLayer("hist"); });

