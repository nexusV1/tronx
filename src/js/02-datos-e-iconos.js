  /* ---------- stickers propios: biblioteca (la imagen final vive en IndexedDB como "stk:<id>") ---------- */
  var STK_KEY = "tronx.stk.v1", STK_MAX = 40, myStk = [], stkUrls = {}, stkPend = {};
  var STK_SHAPES = ["none", "circle", "round", "star", "heart", "hex"], STK_ANIMS = ["none", "float", "pulse", "sway", "spin", "glow", "bounce"], STK_SRC = ["draw", "photo", "text"];
  var CU_RE = /^c:([a-z0-9]{3,24}):([tce]):(\d{1,3}):(\d{1,3})$/;
  function stkNum(v, a, b, d) { v = Number(v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; }
  function stkCol(v) { v = String(v || ""); return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : ""; }
  function cleanStk(x) {
    if (!x || typeof x !== "object") return null;
    var id = String(x.id || ""); if (!/^[a-z0-9]{3,24}$/.test(id)) return null;
    return {
      id: id, n: String(x.n || "Sticker").slice(0, 24) || "Sticker", src: STK_SRC.indexOf(x.src) >= 0 ? x.src : "draw",
      sh: STK_SHAPES.indexOf(x.sh) >= 0 ? x.sh : "none", f1: stkCol(x.f1), f2: stkCol(x.f2),
      bw: Math.round(stkNum(x.bw, 0, 24, 0)), bc: stkCol(x.bc) || "#ffffff", gl: Math.round(stkNum(x.gl, 0, 40, 0)),
      an: STK_ANIMS.indexOf(x.an) >= 0 ? x.an : "none", tx: String(x.tx || "").slice(0, 12), tc: stkCol(x.tc) || "#ffffff",
      z: stkNum(x.z, 0.3, 4, 1), px: stkNum(x.px, -1, 1, 0), py: stkNum(x.py, -1, 1, 0), at: stkNum(x.at, 0, 9e15, 0)
    };
  }
  try { var sa = JSON.parse(lsGet(STK_KEY) || "[]"); if (Array.isArray(sa)) myStk = sa.map(cleanStk).filter(Boolean).slice(0, STK_MAX); } catch { myStk = []; }
  function saveStk() { lsSet(STK_KEY, JSON.stringify(myStk)); }
  function stkOf(id) { for (var i = 0; i < myStk.length; i++) if (myStk[i].id === id) return myStk[i]; return null; }
  function stkLoad(id, force) {
    if (!force && stkUrls[id]) return Promise.resolve(stkUrls[id]);
    if (!force && stkPend[id]) return stkPend[id];
    var pr = imgGet("stk:" + id).then(function (b) {
      delete stkPend[id];
      if (!b) return null;
      if (stkUrls[id]) { try { URL.revokeObjectURL(stkUrls[id]); } catch {} }
      var u = URL.createObjectURL(b); stkUrls[id] = u;
      [].forEach.call(document.querySelectorAll('img[data-stk="' + id + '"]'), function (im) { im.src = u; });
      return u;
    }, function () { delete stkPend[id]; return null; });
    stkPend[id] = pr; return pr;
  }
  function stkImg(id, anim) {
    var im = new Image(); im.alt = ""; im.draggable = false; im.dataset.stk = id;
    var st = stkOf(id); if (anim && st && st.an !== "none") im.classList.add("a-" + st.an);
    if (stkUrls[id]) im.src = stkUrls[id]; else stkLoad(id);
    return im;
  }
  function saveSettings() {
    if (window.TronxSound) { settings.sound = window.TronxSound.isEnabled(); settings.soundLvl = window.TronxSound.getVolume(); }
    lsSet(SKEY, JSON.stringify(settings));
  }
  // Primera vez con el diseño espacial (1.5): si nunca tocaste el tema ni el color, pasan al aspecto Tronx.
  // Lo que ya elegiste vos se respeta. La vista pasa a cuadrícula de dos columnas.
  if (settings.skin !== 2) {
    if (settings.theme === "system" && settings.accent === "ember") { settings.theme = "dark"; settings.accent = "violet"; }
    settings.view = "grid"; settings.skin = 2;
    saveSettings();
  }

  function calmOn() { return settings.calm === null ? !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) : settings.calm; }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function isDark() { return settings.theme === "dark" || (settings.theme === "system" && !!(mq && mq.matches)); }
  function applyTheme() {
    var root = document.documentElement;
    if (settings.theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", settings.theme);
    root.setAttribute("data-font", settings.font);
    root.setAttribute("data-dark", isDark() ? "1" : "0");
    root.setAttribute("data-contrast", settings.contrast ? "1" : "0");
    root.setAttribute("data-calm", calmOn() ? "1" : "0");
    root.style.setProperty("--list-scale", String(settings.listSize / 100));
    root.setAttribute("data-bganim", settings.bgAnim ? "1" : "0");
    var a = ACCENTS[settings.accent], c = isDark() ? a.dark : a.light, rgb = hexRgb(c[0]);
    root.style.setProperty("--accent", c[0]);
    root.style.setProperty("--accent-ink", c[1]);
    root.style.setProperty("--accent-soft", rgba(rgb, isDark() ? 0.24 : 0.16));
    root.style.setProperty("--note-size", settings.size + "px");
    var bg = getComputedStyle(document.body).getPropertyValue("--bg").trim();
    var m = document.querySelector('meta[name="theme-color"]'); if (m && bg) m.setAttribute("content", bg);
    if (window.TronxMap) window.TronxMap.refreshTheme();
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", applyTheme);

  /* ---------- datos ---------- */
  var notes = new Map();
  var tab = "notes", tagFilter = null, query = "", activeId = null, folderFilter = null, kindFilter = "all", whenFilter = "all", allScope = false, selMode = false, sel = new Set();
  var saveTimer = null, statusTimer = null, listRaf = 0;

  /* ---------- iconos de las notas (emoji o sticker) ---------- */
  function stickerOk(id) {
    if (!window.TronxStickers) return /^[a-z0-9-]+$/.test(id); // si los stickers no cargaron, no se pierde la elección guardada
    var list = window.TronxStickers.list;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return true;
    return false;
  }
  function parseEmoji(str) {
    str = String(str || "").trim();
    if (!str) return "";
    var seg = "";
    try {
      if (window.Intl && Intl.Segmenter) {
        var it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(str)[Symbol.iterator]().next();
        seg = it.done ? "" : it.value.segment;
      }
      if (!seg) {
        var m = str.match(/(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*)/u);
        seg = m ? m[0] : "";
      }
      if (!/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u.test(seg)) return "";
    } catch {
      seg = Array.from(str).slice(0, 2).join("");
      if (/^[\x00-\x7f]+$/.test(seg)) return "";
    }
    return seg.length <= 16 ? seg : "";
  }
  function cleanIcon(v) {
    v = String(v || "");
    if (v.slice(0, 2) === "s:") return stickerOk(v.slice(2)) ? v : "";
    if (v.slice(0, 2) === "e:") { var e = parseEmoji(v.slice(2)); return e ? "e:" + e : ""; }
    if (v.slice(0, 2) === "c:") return /^[a-z0-9]{3,24}$/.test(v.slice(2)) ? v : "";
    return "";
  }
  function iconSpan(icon, cls) {
    if (!icon) return null;
    if (icon.slice(0, 2) === "c:") {
      var cid = icon.slice(2), cs = el("span", "ic cst" + (cls ? " " + cls : "")), cst = stkOf(cid), live = cls !== "static" && cls !== "wm";
      cs.setAttribute("aria-hidden", "true"); cs.appendChild(stkImg(cid, live));
      if (live && cst && cst.an !== "none") cs.classList.add("anim");
      return cs;
    }
    var sk = icon.charAt(0) === "s", sp = el("span", "ic " + (sk ? "sk" : "emo") + (cls ? " " + cls : ""));
    sp.setAttribute("aria-hidden", "true");
    if (sk) {
      var id = icon.slice(2), mk = window.TronxStickers && window.TronxStickers.markup ? window.TronxStickers.markup(id) : "";
      sp.innerHTML = '<svg viewBox="0 0 64 64">' + (mk || '<use href="#st-' + id + '"/>') + '</svg>';
      if (cls !== "static" && cls !== "wm") sp.classList.add("anim");
    } else sp.textContent = icon.slice(2);
    return sp;
  }
  /* Icono de tarjeta: al crearla es solo un <use> (barato); al entrar en pantalla se pasa al sticker animado */
  var skCache = {};
  function cardIcon(icon) {
    if (!icon) return null;
    if (icon.charAt(0) !== "s") return iconSpan(icon, "static");
    var id = icon.slice(2), sp = el("span", "ic sk");
    sp.setAttribute("aria-hidden", "true"); sp.dataset.sk = id;
    sp.innerHTML = '<svg viewBox="0 0 64 64"><use href="#st-' + id + '"/></svg>';
    return sp;
  }
  function upgradeIcon(sp) {
    var id = sp.dataset.sk; if (!id || sp.dataset.up) return;
    var mk = skCache[id];
    if (mk === undefined) mk = skCache[id] = (window.TronxStickers && window.TronxStickers.markup ? window.TronxStickers.markup(id) : "") || "";
    sp.dataset.up = "1";
    if (mk) sp.innerHTML = '<svg viewBox="0 0 64 64">' + mk + '</svg>';
  }
  function watermark(icon) {
    if (!icon) return null;
    if (icon.slice(0, 2) === "c:") { var cw = el("span", "wm"); cw.setAttribute("aria-hidden", "true"); cw.appendChild(stkImg(icon.slice(2), false)); return cw; }
    var sk = icon.charAt(0) === "s", w = el("span", "wm" + (sk ? "" : " emo"));
    w.setAttribute("aria-hidden", "true");
    if (sk) w.innerHTML = '<svg viewBox="0 0 64 64"><use href="#st-' + icon.slice(2) + '"/></svg>';
    else w.textContent = icon.slice(2);
    return w;
  }
  var EMOJI_SETS = [
    { n: "Espacio", e: ["🌌", "🌠", "⭐", "🌟", "✨", "💫", "🌙", "🌑", "🌕", "🪐", "☄️", "🚀", "🛸", "🛰️", "👽", "🔭", "🌍", "☀️"] },
    { n: "Ideas y trabajo", e: ["💡", "🧠", "📝", "📚", "📖", "🎯", "✅", "📌", "🔖", "🗂️", "📅", "⏰", "🔔", "🔑", "🧩", "💼"] },
    { n: "Creatividad", e: ["🎨", "🎬", "🎵", "🎧", "📷", "✏️", "🖋️", "🎭", "🎮", "🎲", "🪄", "🔮"] },
    { n: "Vida diaria", e: ["❤️", "💜", "🔥", "🌈", "🌸", "🌱", "🍀", "☕", "🍕", "🍎", "🏠", "✈️", "🚗", "🏋️", "💰", "🛒", "🎁", "🎉", "🧘"] },
    { n: "Animales", e: ["🐱", "🐶", "🦊", "🦉", "🦋", "🐙", "🦄", "🐉"] }
  ];

  function cleanTag(t) { return String(t || "").replace(/^#+/, "").trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24); }
  function cleanFolder(f) { return String(f || "").replace(/\s+/g, " ").trim().slice(0, 30); }
  var IMG_FT = ["", "bw", "sepia", "warm", "cool", "fade", "vivid"];
  function numIn(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) return d; return Math.min(hi, Math.max(lo, v)); }
  function cleanImages(a) {
    var out = [];
    (Array.isArray(a) ? a : []).forEach(function (i) {
      if (!i || !i.id || out.length >= 30) return;
      var nar = numIn(i.nar, 0.1, 10, 1);
      out.push({
        id: String(i.id), src: String(i.src || i.id), cx: numIn(i.cx, 0, 1, 0.5), cy: numIn(i.cy, 0, 30000, 80), w: numIn(i.w, 0.05, 1.5, 0.6),
        nar: nar, ar: numIn(i.ar, 0.1, 10, nar), r: numIn(i.r, -180, 180, 0), op: numIn(i.op, 0.1, 1, 1),
        rad: numIn(i.rad, 0, 50, 0), wrap: !!i.wrap, fl: !!i.fl, bd: Math.round(numIn(i.bd, 0, 3, 0)), sh: !!i.sh,
        ft: IMG_FT.indexOf(i.ft) >= 0 ? i.ft : "", zm: numIn(i.zm, 1, 4, 1), px: numIn(i.px, 0, 1, 0.5), py: numIn(i.py, 0, 1, 0.5),
        br: Math.round(numIn(i.br, 40, 160, 100)), co: Math.round(numIn(i.co, 40, 160, 100)), sa: Math.round(numIn(i.sa, 0, 200, 100)), bl: Math.round(numIn(i.bl, 0, 10, 0)),
        z: Math.round(numIn(i.z, 0, 999, 0)), back: !!i.back, lock: !!i.lock,
        info: String(i.info || "").slice(0, 600), ip: ["below", "above", "in-bottom", "in-top"].indexOf(i.ip) >= 0 ? i.ip : "below", show: i.show === "always" ? "always" : "tap"
      });
    });
    return out;
  }
  function cleanVersions(a) {
    var out = [];
    (Array.isArray(a) ? a : []).slice(0, 10).forEach(function (v) {
      if (!v || typeof v !== "object") return;
      out.push({
        t: Number(v.t) || Date.now(), title: String(v.title || "").slice(0, 300), body: String(v.body || "").slice(0, 60000),
        items: (Array.isArray(v.items) ? v.items : []).slice(0, 300).map(function (i) { return cleanItem(i, 2000); })
      });
    });
    return out;
  }
  function cleanRemind(r) {
    if (!r || typeof r !== "object") return null;
    var at = Number(r.at); if (!isFinite(at) || at <= 0) return null;
    var rp = r.rep === "day" || r.rep === "week" || r.rep === "month" || r.rep === "days" ? r.rep : "";
    var wd = Array.isArray(r.wd) ? r.wd.map(Number).filter(function (d, i, a) { return d >= 0 && d <= 6 && a.indexOf(d) === i; }).sort() : [];
    if (rp === "days" && !wd.length) rp = "week";
    return { at: at, rep: rp, wd: rp === "days" ? wd : [], seen: !!r.seen, snz: Number(r.snz) > 0 ? Number(r.snz) : 0 };
  }
  function cleanEnc(e) {
    if (!e || typeof e !== "object" || typeof e.iv !== "string" || typeof e.ct !== "string" || !e.iv || !e.ct) return null;
    return { v: 1, it: Math.min(1000000, Math.max(1000, Math.floor(Number(e.it)) || 120000)), iv: e.iv, ct: e.ct, tt: e.tt ? 1 : 0 };
  }
  function cleanLock(l) {
    if (!l || typeof l !== "object") return null;
    var m = l.m === "bio" || l.m === "pin" || l.m === "both" || l.m === "pass" ? l.m : "";
    if (!m) return null;
    if (m !== "bio" && !(typeof l.s === "string" && typeof l.h === "string" && l.s && l.h)) return null;
    return { m: m, s: m === "bio" ? "" : l.s, h: m === "bio" ? "" : l.h };
  }
  function cleanItem(i, max) {
    var o = { id: String((i && i.id) || uid()), t: String((i && i.t) || "").slice(0, max), done: !!(i && i.done) };
    if (i && i.lv === 1) o.lv = 1;
    var d = Number(i && i.due); if (d > 0 && isFinite(d)) { o.due = Math.floor(d); if (i.rep === "day" || i.rep === "week" || i.rep === "month") o.rep = i.rep; }
    return o;
  }
  function copyItem(i, fresh) { var o = cleanItem(i, 1e9); if (fresh) o.id = uid(); return o; }
  function dueLabel(ts) { return new Date(ts).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, ""); }
  function dueStatus(it) {
    if (!it.due) return "";
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var diff = Math.round((new Date(it.due).setHours(0, 0, 0, 0) - t0.getTime()) / 86400000);
    return it.done ? "" : diff < 0 ? "late" : diff === 0 ? "today" : diff === 1 ? "soon" : "";
  }
  function dueText(ts) {
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var diff = Math.round((new Date(ts).setHours(0, 0, 0, 0) - t0.getTime()) / 86400000);
    return diff === 0 ? "hoy" : diff === 1 ? "mañana" : diff === -1 ? "ayer" : dueLabel(ts);
  }
  var REP_NAME = { day: "todos los días", week: "cada semana", month: "cada mes" }, REP_NEXT = { "": "day", day: "week", week: "month", month: "" };
  /* siguiente fecha de una tarea repetida: avanza de a un período hasta que sea posterior a hoy */
  function nextDue(it) {
    var d = new Date(it.due), t0 = new Date(); t0.setHours(23, 59, 59, 999);
    do {
      if (it.rep === "day") d.setDate(d.getDate() + 1); else if (it.rep === "week") d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1);
    } while (d.getTime() <= t0.getTime());
    d.setHours(12, 0, 0, 0); return d.getTime();
  }
  /* tilda o destilda un elemento; una tarea repetida no queda hecha: pasa a su próxima fecha */
  function tickItem(n, it) {
    if (!it.done && it.rep && it.due) { it.due = nextDue(it); toast("Se repite " + REP_NAME[it.rep] + ": próxima " + dueText(it.due)); return; }
    it.done = !it.done; var idx = n.items.indexOf(it);
    if (it.lv !== 1) for (var k = idx + 1; k < n.items.length && n.items[k].lv === 1; k++) n.items[k].done = it.done;
  }
  function itemInd(i) { return i.lv === 1 ? "  " : ""; }
  function itemMeta(i) { return i.due ? " (vence " + dueLabel(i.due) + ")" : ""; }
  function normalize(x) {
    if (!x || typeof x !== "object") return null;
    var type = x.type === "list" ? "list" : "text";
    var items = Array.isArray(x.items) ? x.items.map(function (i) { return cleanItem(i, 1e9); }) : [];
    if (items.length) items[0].lv = 0;
    var tags = [];
    (Array.isArray(x.tags) ? x.tags : []).forEach(function (t) { t = cleanTag(t); if (t && tags.indexOf(t) < 0 && tags.length < 8) tags.push(t); });
    var now = Date.now();
    var r = {
      id: String(x.id || uid()),
      type: type,
      title: String(x.title || ""),
      body: String(x.body || ""),
      items: items,
      hideDone: !!x.hideDone,
      color: colorOf(x.color).k,
      tags: tags,
      folder: cleanFolder(x.folder),
      images: cleanImages(x.images),
      versions: cleanVersions(x.versions),
      remind: cleanRemind(x.remind),
      lock: cleanLock(x.lock),
      enc: cleanEnc(x.enc),
      rems: Array.isArray(x.rems) ? x.rems.map(cleanRemind).filter(Boolean).slice(0, 4) : [],
      parent: x.parent && String(x.parent) !== String(x.id) ? String(x.parent) : "",
      icon: cleanIcon(x.icon),
      bg: cleanBg(x.bg),
      pinned: !!x.pinned,
      archived: !!x.archived,
      trashedAt: x.trashedAt ? Number(x.trashedAt) || now : null,
      createdAt: Number(x.createdAt) || Number(x.updatedAt) || now,
      updatedAt: Number(x.updatedAt) || now
    };
    /* nota con texto en claro y cifrado viejo (se cerró la app justo al editar): vale el texto en claro, se vuelve a cifrar al abrirla */
    if (r.enc && (r.body || r.items.length || r.versions.length)) encMeta.set(r, { src: "!" });
    return r;
  }
  function isEmptyNote(n) {
    if (n.title.trim() || (n.images && n.images.length)) return false;
    return n.type === "list" ? n.items.every(function (i) { return !i.t.trim(); }) : !n.body.trim();
  }
  function loadNotes() {
    var arr = [], raw = lsGet(KEY);
    if (!raw) raw = lsGet(KEY1);
    if (raw) { try { arr = JSON.parse(raw); } catch { arr = []; } }
    if (!Array.isArray(arr)) arr = [];
    arr.forEach(function (x) {
      var n = normalize(x);
      if (!n) return;
      if (!n.trashedAt && isEmptyNote(n)) return;
      notes.set(n.id, n);
    });
  }
