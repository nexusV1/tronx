  /* ---------- copia de seguridad ---------- */
  function blobToDataUrl(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = function () { res(null); }; r.readAsDataURL(b); }); }
  function dataUrlToBlob(u) {
    var m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(u || ""); if (!m) return null;
    try { var bin = atob(decodeURIComponent(m[3])), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m[1] }); } catch { return null; }
  }
  function imagesForBackup() {
    var ids = Array.from(usedImageIds()), out = {};
    myStk.forEach(function (m) { ids.push("stk:" + m.id, "stk:" + m.id + ":s"); });
    return Promise.all(ids.map(function (id) {
      return imgGetRaw(id).then(function (b) {
        if (b && b.encImg) return { e: 1, s: b.s, iv: b64(b.iv), ct: b64(b.ct), t: b.type || "" };
        return b ? blobToDataUrl(b) : null;
      }).then(function (u) { if (u) out[id] = u; });
    })).then(function () { return out; });
  }
  function backupJson() {
    return JSON.stringify({ app: "tronx", version: 2, exportedAt: new Date().toISOString(), notes: Array.from(notes.values()).map(serNote), tpls: myTpls, stickers: myStk, map: window.TronxMap ? window.TronxMap.exportData() : undefined }, null, 2);
  }
  // Entrega un archivo: en el teléfono abre el menú de compartir; en el navegador lo descarga.
  // Devuelve una promesa: true si se entregó, false si la persona canceló.
  function shareFile(name, data, mime, title, b64) {
    var fs = capPlugin("Filesystem"), share = capPlugin("Share");
    if (fs && share) {
      var wo = { path: name, data: data, directory: "CACHE" }; if (!b64) wo.encoding = "utf8";
      return fs.writeFile(wo).then(function (r) {
        return share.share({ title: title, url: r.uri, dialogTitle: title }).then(function () { return true; });
      }).catch(function (err) {
        if (err && /cancel/i.test(String(err.message || err))) return false;
        throw err;
      });
    }
    return new Promise(function (resolve, reject) {
      try {
        var raw = data;
        if (b64) { var bin = atob(data), u8 = new Uint8Array(bin.length); for (var q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q); raw = u8; }
        var blob = new Blob([raw], { type: mime });
        var a = el("a"); a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        resolve(true);
      } catch (e) { reject(e); }
    });
  }
  function exportBackup(lite) {
    lite = lite === true; persistNow();
    var d = new Date();
    var stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    (lite ? Promise.resolve({}) : imagesForBackup()).then(function (imgs) {
      var obj = JSON.parse(backupJson()); if (Object.keys(imgs).length) obj.images = imgs;
      return shareFile("tronx-copia-" + stamp + (lite ? "-sin-imagenes" : "") + ".json", JSON.stringify(obj), "application/json", "Copia de Tronx");
    }).then(function (ok) {
      if (!ok) return;
      settings.lastBackup = Date.now(); saveSettings(); renderBkBar(); renderBkStatus();
      if (!capPlugin("Share")) toast("Copia exportada");
    }).catch(function () { toast("No se pudo exportar la copia"); });
  }
  function safeName(s) { return String(s || "").replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40).trim() || "nota"; }
  function exportTxt() {
    var n = cur(); if (!n) return;
    shareFile(safeName(n.title) + ".txt", noteText(n), "text/plain", n.title.trim() || "Nota de Tronx").then(function (ok) {
      if (ok && !capPlugin("Share")) toast("Archivo .txt descargado");
    }).catch(function () { toast("No se pudo guardar el archivo"); });
  }
  $("txtBtn").addEventListener("click", exportTxt);

  /* ---------- Markdown: exportar todo (.zip) e importar (.md, .txt, .zip) ---------- */
  var CRC_T = null;
  function crc32(u8) {
    if (!CRC_T) { CRC_T = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) crc = CRC_T[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function zipBuild(files) {
    var enc = new TextEncoder(), d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    var parts = [], central = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, dt, true); lh.setUint16(12, dd, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, f.data.length, true); lh.setUint32(22, f.data.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nm, f.data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dt, true); ch.setUint16(14, dd, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, f.data.length, true); ch.setUint32(24, f.data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + f.data.length;
    });
    var csz = 0; central.forEach(function (c) { csz += c.length; });
    var end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csz, true); end.setUint32(16, off, true);
    var all = parts.concat(central, [new Uint8Array(end.buffer)]), tot = 0; all.forEach(function (a) { tot += a.length; });
    var out = new Uint8Array(tot), pos = 0; all.forEach(function (a) { out.set(a, pos); pos += a.length; });
    return out;
  }
  function u8ToB64(u8) { var s = "", step = 0x8000; for (var i = 0; i < u8.length; i += step) s += String.fromCharCode.apply(null, u8.subarray(i, i + step)); return btoa(s); }
  function zipRead(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), e = -1, dec = new TextDecoder("utf-8");
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; } }
    if (e < 0) return Promise.reject(new Error("zip"));
    var cnt = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true), jobs = [];
    for (var k = 0; k < cnt && k < 2000; k++) {
      if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
      var meth = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el2 = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el2 + cl;
      if (/\/$/.test(name) || /(^|\/)__MACOSX\//.test(name) || !/\.(md|markdown|txt)$/i.test(name) || csz > 5e6) continue;
      if (lo + 30 > u8.length) continue;
      var ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), raw = u8.subarray(ds, ds + csz);
      (function (nm, m, r) {
        if (m === 0) jobs.push(Promise.resolve({ name: nm, text: dec.decode(r) }));
        else if (m === 8 && typeof window.DecompressionStream === "function") jobs.push(new window.Response(new Blob([r]).stream().pipeThrough(new window.DecompressionStream("deflate-raw"))).arrayBuffer().then(function (b) { return { name: nm, text: dec.decode(new Uint8Array(b)) }; }).catch(function () { return null; }));
        else jobs.push(Promise.resolve(null));
      })(name, meth, raw);
    }
    return Promise.all(jobs).then(function (a) { return a.filter(Boolean); });
  }
  function isoDay(ts) { return new Date(ts).toISOString().slice(0, 10); }
  function mdFile(n) {
    var fm = "---\ntitle: " + JSON.stringify(n.title.trim() || "") + "\ncreated: " + new Date(n.createdAt).toISOString() + "\nupdated: " + new Date(n.updatedAt).toISOString() + "\n";
    if (n.tags.length) fm += "tags: [" + n.tags.join(", ") + "]\n";
    if (n.pinned) fm += "pinned: true\n";
    fm += "---\n\n";
    var body = n.type === "list" ? n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + "- [" + (i.done ? "x" : " ") + "] " + i.t + itemMeta(i); }).join("\n") : n.body;
    return fm + body.replace(/\s+$/, "") + "\n";
  }
  function exportAllMd() {
    persistNow();
    var used = {}, files = [], skipped = 0, enc = new TextEncoder();
    notes.forEach(function (n) {
      if (n.trashedAt) return;
      if (n.lock) { skipped++; return; }
      var dir = n.archived ? "Archivo" : (n.folder ? safeName(n.folder) : ""), base = safeName(n.title || (n.type === "list" ? "Lista" : "Nota")), nm = (dir ? dir + "/" : "") + base, k = 2;
      while (used[nm.toLowerCase()]) nm = (dir ? dir + "/" : "") + base + " (" + (k++) + ")";
      used[nm.toLowerCase()] = 1; files.push({ name: nm + ".md", data: enc.encode(mdFile(n)) });
    });
    if (!files.length) { toast("No hay notas para exportar"); return; }
    var zip = zipBuild(files), d = new Date();
    shareFile("tronx-notas-" + isoDay(d.getTime()) + ".zip", u8ToB64(zip), "application/zip", "Notas de Tronx en Markdown", true).then(function (ok) {
      if (!ok) return;
      toast(files.length + (files.length === 1 ? " nota exportada" : " notas exportadas") + (skipped ? " (" + skipped + " protegida" + (skipped === 1 ? "" : "s") + " no incluida" + (skipped === 1 ? "" : "s") + ")" : ""));
    }).catch(function () { toast("No se pudo exportar"); });
  }
  function mdParse(text, fname, folder) {
    text = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    var meta = {}, m = /^---\n([\s\S]*?)\n---[ \t]*(\n|$)/.exec(text);
    if (m) {
      text = text.slice(m[0].length);
      m[1].split("\n").forEach(function (ln) { var kv = /^([A-Za-z_]+):\s*(.*)$/.exec(ln); if (kv) meta[kv[1].toLowerCase()] = kv[2].trim(); });
    }
    text = text.replace(/^\n+/, "");
    var title = "", tags = [];
    if (meta.title) { try { title = meta.title.charAt(0) === '"' ? JSON.parse(meta.title) : meta.title.replace(/^'|'$/g, ""); } catch { title = meta.title; } }
    if (!title) { var h1 = /^#\s+(.+)\n?/.exec(text); if (h1) { title = h1[1].trim(); text = text.slice(h1[0].length).replace(/^\n+/, ""); } }
    if (!title) title = String(fname || "").replace(/\.(md|markdown|txt)$/i, "").replace(/^.*\//, "");
    if (meta.tags) meta.tags.replace(/^\[|\]$/g, "").split(/[,\s]+/).forEach(function (t) { t = cleanTag(t.replace(/^#/, "")); if (t && tags.indexOf(t) < 0) tags.push(t); });
    var lines = text.replace(/\s+$/, "").split("\n"), last = lines[lines.length - 1] || "";
    if (/^(#[^\s#]+\s*)+$/.test(last.trim()) && lines.length > 1) { last.match(/#[^\s#]+/g).forEach(function (t) { t = cleanTag(t.slice(1)); if (t && tags.indexOf(t) < 0) tags.push(t); }); lines.pop(); }
    var body = lines.join("\n").replace(/\s+$/, ""), nonEmpty = lines.filter(function (l) { return l.trim(); });
    var o = { id: uid(), title: title.slice(0, 300), tags: tags.slice(0, 8), folder: folder || "", body: body };
    if (nonEmpty.length && nonEmpty.every(function (l) { return /^\s*[-*]\s+\[[ xX]\]\s/.test(l); })) {
      o.type = "list"; o.body = ""; o.items = nonEmpty.map(function (l, i) {
        var mm = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/.exec(l), it = { id: uid(), t: mm[3].replace(/\s*\(vence [^)]*\)\s*$/, ""), done: mm[2] !== " " };
        if (i > 0 && mm[1].length >= 2) it.lv = 1; return it;
      });
    }
    var cr = Date.parse(meta.created || meta.date || ""), up = Date.parse(meta.updated || "");
    if (cr > 0) o.createdAt = cr; if (up > 0) o.updatedAt = up; else if (cr > 0) o.updatedAt = cr;
    if (/^(true|yes|si|sí)$/i.test(meta.pinned || "")) o.pinned = true;
    return o;
  }
  function importMdFiles(fileList) {
    var jobs = [];
    [].slice.call(fileList).slice(0, 600).forEach(function (f) {
      if (f.size > 5e6) return;
      jobs.push(new Promise(function (res) {
        var r = new FileReader(); r.onerror = function () { res([]); };
        r.onload = function () {
          if (/\.zip$/i.test(f.name)) { zipRead(new Uint8Array(r.result)).then(function (a) { res(a.map(function (x) { var dir = /^(.*)\/[^/]+$/.exec(x.name); return { name: x.name, text: x.text, dir: dir ? dir[1].split("/")[0] : "" }; })); }).catch(function () { res(null); }); }
          else res([{ name: f.name, text: new TextDecoder("utf-8").decode(new Uint8Array(r.result)), dir: "" }]);
        };
        r.readAsArrayBuffer(f);
      }));
    });
    Promise.all(jobs).then(function (groups) {
      var bad = groups.some(function (g) { return g === null; }), all = [].concat.apply([], groups.filter(Boolean)), added = 0, dup = 0;
      var have = {}; notes.forEach(function (n) { have[(n.title.trim() + "\u0001" + (n.type === "list" ? n.items.map(function (i) { return i.t; }).join("\n") : n.body.trim())).toLowerCase()] = 1; });
      all.slice(0, 600).forEach(function (x) {
        var o = mdParse(x.text, x.name, x.dir === "Archivo" ? "" : x.dir), n = normalize(o);
        if (!n || isEmptyNote(n) && !n.title.trim()) return;
        if (x.dir === "Archivo") n.archived = true;
        var key = (n.title.trim() + "\u0001" + (n.type === "list" ? n.items.map(function (i) { return i.t; }).join("\n") : n.body.trim())).toLowerCase();
        if (have[key]) { dup++; return; } have[key] = 1;
        notes.set(n.id, n); added++;
      });
      if (added) { persistNow(); renderAll(); renderSettings(); }
      toast(added ? added + (added === 1 ? " nota importada" : " notas importadas") + (dup ? " (" + dup + " repetida" + (dup === 1 ? "" : "s") + " omitida" + (dup === 1 ? "" : "s") + ")" : "") : bad ? "No se pudo leer ese .zip" : dup ? "Esas notas ya estaban en Tronx" : "No se encontraron notas .md o .txt");
    });
  }
  $("tplOpenBtn").addEventListener("click", openTplMgr);
  $("mdAllBtn").addEventListener("click", exportAllMd);
  $("mdImpBtn").addEventListener("click", function () { $("mdImpFile").value = ""; $("mdImpFile").click(); });
  $("mdImpFile").addEventListener("change", function () { if ($("mdImpFile").files && $("mdImpFile").files.length) importMdFiles($("mdImpFile").files); });

  /* Aviso suave: las notas viven solo en el teléfono, así que se recuerda hacer copia cada tanto */
  function bkDays() { var v = Number(settings.bkEvery); return v === 0 ? Infinity : (v > 0 ? v : 7); }
  function renderBkBar() {
    if (settings.newsSeen == null && lsGet(WKEY) !== "1" && !notes.size) { settings.newsSeen = APP_VERSION; saveSettings(); }
    try { updateMenuBadge(); } catch {}
    var real = 0;
    notes.forEach(function (n) { if (!n.trashedAt) real++; });
    var last = Math.max(settings.lastBackup || 0, settings.bkNag || 0, settings.firstRun || 0);
    var days = Math.floor((Date.now() - last) / 86400000);
    var show = tab === "notes" && real >= 3 && days >= bkDays() && !query.trim();
    $("bkbar").hidden = !show;
    if (!show) return;
    $("bkTxt").textContent = settings.lastBackup ? "Hace " + Math.floor((Date.now() - settings.lastBackup) / 86400000) + " días que no hacés una copia de seguridad." : "Todavía no hiciste una copia de seguridad de tus notas.";
  }
  $("bkGo").addEventListener("click", function () { exportBackup(); });
  $("bkX").addEventListener("click", function () { settings.bkNag = Date.now(); saveSettings(); renderBkBar(); });
  /* ---------- restaurar notas sueltas de una copia ---------- */
  var bnData = null;
  function openBkNotes(text) {
    var data; try { data = JSON.parse(text); } catch { toast("Esa copia no se puede leer"); return; }
    var arr = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : null);
    if (!arr) { toast("Esa copia no se puede leer"); return; }
    bnData = { notes: arr, images: (data && !Array.isArray(data) && data.images && typeof data.images === "object") ? data.images : {} };
    $("bnSearch").value = ""; renderBkNotes(); $("bkNotes").hidden = false; pushLayer("bkNotes");
  }
  registerLayer("bkNotes", function () { $("bkNotes").hidden = true; bnData = null; });
  function renderBkNotes() {
    var box = $("bnList"); box.textContent = ""; if (!bnData) return;
    var q = $("bnSearch").value.trim().toLowerCase(), shown = 0, total = 0;
    bnData.notes.forEach(function (x, i) {
      var n = normalize(x); if (!n) return; total++;
      var label = n.lock ? "Nota protegida" : (n.title.trim() || (n.type === "list" ? "Lista sin título" : "Sin título"));
      if (q && !(n.lock ? false : (label.toLowerCase().indexOf(q) >= 0 || (n.type === "list" ? n.items.map(function (it) { return it.t; }).join(" ") : n.body).toLowerCase().indexOf(q) >= 0))) return;
      if (shown >= 60) return; shown++;
      var ex = notes.get(n.id), st = n.trashedAt ? "estaba en la papelera" : !ex ? "no está en tu app" : ex.trashedAt ? "está en tu papelera" : ex.updatedAt === n.updatedAt ? "igual a la actual" : "versión distinta";
      var row = el("div", "tdrow"), tb = el("div", "tdt"), b = el("b"), em = el("i");
      b.textContent = (n.lock ? "🔒 " : "") + label; em.textContent = new Date(n.updatedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "") + " · " + st;
      tb.appendChild(b); tb.appendChild(em);
      var rb = el("button", "btn small"); rb.type = "button"; rb.textContent = "Restaurar"; rb.setAttribute("aria-label", "Restaurar " + label);
      rb.addEventListener("click", function () { restoreOneNote(bnData.notes[i], bnData.images, rb); });
      row.appendChild(tb); row.appendChild(rb); box.appendChild(row);
    });
    $("bnHint").textContent = total + (total === 1 ? " nota en la copia." : " notas en la copia.") + " Restaurar agrega la nota; si ya tenés una igual, la restaurada queda como copia aparte.";
    if (!shown) { var h = el("p", "hint"); h.textContent = "No hay notas que coincidan."; box.appendChild(h); }
  }
  function restoreOneNote(raw, imgs, btn) {
    var n = normalize(raw); if (!n) return;
    var ex = notes.get(n.id);
    if (ex && !ex.trashedAt) { n.id = uid(); n.title = ((n.title || "").trim() || "Sin título") + " (restaurada)"; n.pinned = false; }
    n.trashedAt = 0; n.updatedAt = Date.now();
    notes.set(n.id, n);
    n.images.forEach(function (it) {
      var v = imgs && imgs[it.src]; if (!v) return;
      imgGetRaw(it.src).then(function (cur0) {
        if (cur0) return;
        if (v && typeof v === "object" && v.e === 1) imgPutRaw(it.src, { encImg: 1, s: String(v.s || ""), iv: unb64(v.iv).buffer, ct: unb64(v.ct).buffer, type: String(v.t || "") });
        else { var b = dataUrlToBlob(v); if (b) imgPut(it.src, b); }
      });
    });
    persistNow(); renderAll();
    if (btn) { btn.disabled = true; btn.textContent = "Restaurada ✓"; }
    toast("Nota restaurada");
  }
  $("bnClose").addEventListener("click", function () { closeLayer("bkNotes"); });
  $("bkNotes").addEventListener("click", function (e) { if (e.target === $("bkNotes")) closeLayer("bkNotes"); });
  $("bnSearch").addEventListener("input", renderBkNotes);
  $("bkPickBtn").addEventListener("click", function () { $("bkPickFile").click(); });
  $("bkPickFile").addEventListener("change", function () {
    var f = $("bkPickFile").files[0]; $("bkPickFile").value = ""; if (!f) return;
    var r = new FileReader(); r.onload = function () { openBkNotes(String(r.result || "")); }; r.readAsText(f);
  });
  /* ---------- unir notas duplicadas ---------- */
  function dupGroups() {
    var map = {};
    notes.forEach(function (n) {
      if (n.trashedAt || n.lock) return;
      var body = n.type === "list" ? n.items.map(function (i) { return (i.done ? "x" : "o") + i.t.trim().toLowerCase(); }).join("\n") : n.body.trim().toLowerCase();
      if (!n.title.trim() && !body && !n.images.length) return;
      var k = n.type + "|" + n.title.trim().toLowerCase() + "|" + body + "|" + n.images.map(function (i) { return i.src; }).sort().join(",");
      (map[k] = map[k] || []).push(n);
    });
    return Object.keys(map).map(function (k) { return map[k].sort(function (a, b) { return b.updatedAt - a.updatedAt; }); }).filter(function (g) { return g.length > 1; });
  }
  function renderDups() {
    var box = $("dpList"), gs = dupGroups(); box.textContent = "";
    $("dpHint").textContent = gs.length ? "Estas notas son idénticas (mismo título, texto e imágenes). Unir deja la más reciente, le suma las etiquetas de las otras y manda las demás a la papelera, donde las podés recuperar." : "No encontré notas duplicadas.";
    gs.forEach(function (g) {
      var row = el("div", "tdrow"), tb = el("div", "tdt"), b = el("b"), em = el("i");
      b.textContent = g[0].title.trim() || (g[0].type === "list" ? "Lista sin título" : "Sin título"); em.textContent = g.length + " copias iguales";
      tb.appendChild(b); tb.appendChild(em);
      var ub = el("button", "btn small primary"); ub.type = "button"; ub.textContent = "Unir"; ub.setAttribute("aria-label", "Unir las " + g.length + " copias de " + b.textContent);
      ub.addEventListener("click", function () {
        var keep = g[0], now = Date.now();
        g.slice(1).forEach(function (o) {
          o.tags.forEach(function (t) { if (keep.tags.indexOf(t) < 0 && keep.tags.length < 20) keep.tags.push(t); });
          if (!keep.folder && o.folder) keep.folder = o.folder; if (o.pinned) keep.pinned = true;
          o.trashedAt = now; o.updatedAt = now;
        });
        keep.updatedAt = now; persistNow(); renderAll(); renderDups(); toast("Se unieron " + g.length + " notas en una");
      });
      row.appendChild(tb); row.appendChild(ub); box.appendChild(row);
    });
  }
  registerLayer("dups", function () { $("dups").hidden = true; });
  $("dupFindBtn").addEventListener("click", function () { renderDups(); $("dups").hidden = false; pushLayer("dups"); });
  $("dpClose").addEventListener("click", function () { closeLayer("dups"); });
  $("dups").addEventListener("click", function (e) { if (e.target === $("dups")) closeLayer("dups"); });
  function importBackup(text) {
    var data;
    try { data = JSON.parse(text); } catch { toast("Ese archivo no es una copia de Tronx"); return; }
    var arr = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : null);
    if (!arr) { toast("Ese archivo no es una copia de Tronx"); return; }
    var added = 0, updated = 0;
    arr.forEach(function (x) {
      var n = normalize(x); if (!n || (!n.trashedAt && isEmptyNote(n))) return;
      var old = notes.get(n.id);
      if (!old) { notes.set(n.id, n); added++; }
      else if (n.updatedAt > old.updatedAt) { notes.set(n.id, n); updated++; }
    });
    if (data && !Array.isArray(data) && Array.isArray(data.tpls)) {
      var tAdd = 0; data.tpls.slice(0, 60).forEach(function (x) { var t = cleanTpl(x); if (t && myTpls.length < 30 && !myTpls.some(function (m) { return m.id === t.id; })) { myTpls.push(t); tAdd++; } });
      if (tAdd) saveTpls();
    }
    if (data && !Array.isArray(data) && Array.isArray(data.stickers)) {
      var sAdd = 0; data.stickers.slice(0, 80).forEach(function (x) { var t = cleanStk(x); if (t && myStk.length < STK_MAX && !stkOf(t.id)) { myStk.push(t); sAdd++; } });
      if (sAdd) saveStk();
    }
    if (window.TronxMap && data && !Array.isArray(data) && data.map) window.TronxMap.importData(data.map);
    if (data && !Array.isArray(data) && data.images && typeof data.images === "object") {
      Object.keys(data.images).forEach(function (id) {
        var v = data.images[id];
        if (v && typeof v === "object" && v.e === 1 && typeof v.iv === "string" && typeof v.ct === "string") { imgPutRaw(id, { encImg: 1, s: String(v.s || ""), iv: unb64(v.iv).buffer, ct: unb64(v.ct).buffer, type: String(v.t || "") }); return; }
        var b = dataUrlToBlob(v); if (b) imgPut(id, b).then(function () { if (id.indexOf("stk:") === 0 && id.slice(-2) !== ":s") stkLoad(id.slice(4), true).then(function () { stkChanged(); }); if (activeId) renderImages(); }); });
    }
    persistNow(); renderAll();
    if (activeId) renderEditor();
    renderSettings();
    toast(added || updated ? "Copia importada: " + added + " nuevas, " + updated + " actualizadas" : "No había nada nuevo para importar");
  }
  $("exportBtn").addEventListener("click", function () { exportBackup(); });
  $("exportLiteBtn").addEventListener("click", function () { exportBackup(true); });
  function renderBkStatus() {
    var real = 0; notes.forEach(function (n) { if (!n.trashedAt) real++; });
    $("bkStatus").textContent = (settings.lastBackup ? "Última copia: " + relTime(settings.lastBackup) : "Todavía no hiciste una copia") + " · " + real + (real === 1 ? " nota" : " notas");
    $("bkEvery").value = String(settings.bkEvery === 0 ? 0 : (settings.bkEvery > 0 ? settings.bkEvery : 7));
  }
  $("bkEvery").addEventListener("change", function () { settings.bkEvery = Number($("bkEvery").value); saveSettings(); renderBkBar(); });
  $("importBtn").addEventListener("click", function () { $("importFile").value = ""; $("importFile").click(); });
  $("importFile").addEventListener("change", function () {
    var f = $("importFile").files && $("importFile").files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { importBackup(String(r.result || "")); };
    r.onerror = function () { toast("No se pudo leer el archivo"); };
    r.readAsText(f);
  });

