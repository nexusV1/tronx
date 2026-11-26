  var APP_VERSION = "1.76.4";
  var KEY = "tronx.notes.v2", KEY1 = "tronx.notes.v1", SKEY = "tronx.settings.v2", WKEY = "tronx.welcomed";

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
  function uid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- paletas ---------- */
  var COLORS = [
    { k: "none", n: "Sin color" },
    { k: "red", n: "Rojo", rgb: [229, 72, 77] },
    { k: "orange", n: "Naranja", rgb: [245, 141, 48] },
    { k: "yellow", n: "Amarillo", rgb: [231, 184, 32] },
    { k: "green", n: "Verde", rgb: [63, 167, 92] },
    { k: "teal", n: "Turquesa", rgb: [24, 166, 160] },
    { k: "blue", n: "Azul", rgb: [56, 128, 235] },
    { k: "purple", n: "Violeta", rgb: [139, 92, 230] },
    { k: "pink", n: "Rosa", rgb: [222, 84, 160] }
  ];
  function colorOf(k) { for (var i = 0; i < COLORS.length; i++) if (COLORS[i].k === k) return COLORS[i]; return COLORS[0]; }
  function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var ACCENTS = {
    ember: { n: "Brasa", light: ["#cf3d13", "#ffffff"], dark: ["#ff7a4d", "#1a0d07"] },
    azure: { n: "Azul", light: ["#1f62d6", "#ffffff"], dark: ["#6aa8ff", "#07142b"] },
    mint: { n: "Menta", light: ["#0d7a5a", "#ffffff"], dark: ["#4fd1a5", "#04201a"] },
    violet: { n: "Violeta", light: ["#6b46d6", "#ffffff"], dark: ["#a58bff", "#140a33"] },
    rose: { n: "Rosa", light: ["#c4286b", "#ffffff"], dark: ["#ff7ab0", "#33071c"] }
  };

  /* ---------- ajustes ---------- */
  var settings = { theme: "dark", accent: "violet", font: "sans", size: 16, view: "grid", sort: "updated", skin: 0, noteBg: "nebula", bgAnim: true, firstRun: 0, lastBackup: 0, bkNag: 0, autoBk: true, autoBkAt: 0, autoBkSig: "", autoBkWhere: "", autoBkEvery: 6, autoBkTime: "", autoBkExit: false, autoBkChg: true, autoBkKeep: 7, autoBkChk: 0, act: {}, pinBio: false, fab: true, swipe: true, wTot: 0, streakBest: 0, ach: {}, statsInit: false };
  try { var sraw = lsGet(SKEY); if (sraw) Object.assign(settings, JSON.parse(sraw)); } catch {}
  if (!ACCENTS[settings.accent]) settings.accent = "ember";
  settings.size = Math.min(24, Math.max(14, Number(settings.size) || 16));

  /* ---------- fondos de nota ---------- */
  var BGS = [
    { k: "nebula", n: "Nebulosa" }, { k: "aurora", n: "Aurora" }, { k: "galaxy", n: "Galaxia" },
    { k: "stars", n: "Estrellas" }, { k: "midnight", n: "Medianoche" }, { k: "sunset", n: "Atardecer" },
    { k: "ocean", n: "Océano" }, { k: "forest", n: "Bosque" }, { k: "rose", n: "Rosa cuarzo" },
    { k: "paper", n: "Papel" }, { k: "grid", n: "Cuadrícula" }, { k: "dots", n: "Puntos" }
  ];
  function bgOk(k) { for (var i = 0; i < BGS.length; i++) if (BGS[i].k === k) return true; return false; }
  var CU_RE0 = /^c:([a-z0-9]{3,24}):([tce]):(\d{1,3}):(\d{1,3})$/;
  function cleanBg(v) {
    v = String(v || ""); if (v === "none" || bgOk(v)) return v;
    var m = CU_RE0.exec(v); if (!m) return "";
    return "c:" + m[1] + ":" + m[2] + ":" + Math.min(100, Math.max(10, +m[3])) + ":" + Math.min(100, Math.max(10, +m[4]));
  }
  if (settings.noteBg !== "none" && !bgOk(settings.noteBg)) settings.noteBg = "nebula";
  settings.bgAnim = settings.bgAnim !== false; settings.autoBk = settings.autoBk !== false;
  settings.pinBio = !!settings.pinBio; settings.fab = settings.fab !== false; settings.swipe = settings.swipe !== false;
  settings.saved = (Array.isArray(settings.saved) ? settings.saved : []).filter(function (o) { return o && typeof o === "object" && typeof o.n === "string"; }).slice(0, 12).map(function (o) {
    return { n: o.n.slice(0, 40), q: String(o.q || "").slice(0, 80), tag: typeof o.tag === "string" ? o.tag : null, folder: typeof o.folder === "string" ? o.folder : null, kind: String(o.kind || "all"), when: String(o.when || "all"), all: !!o.all };
  });
  if (!settings.focus || typeof settings.focus !== "object") settings.focus = {};
  settings.focus = { min: Math.max(0, Math.floor(Number(settings.focus.min) || 0)), n: Math.max(0, Math.floor(Number(settings.focus.n) || 0)) };
  settings.focusLog = (Array.isArray(settings.focusLog) ? settings.focusLog : []).filter(function (f) { return f && f.t > 0 && f.m >= 0; }).slice(0, 30).map(function (f) { return { t: +f.t, m: Math.floor(f.m), w: Math.max(0, Math.floor(f.w) || 0) }; });
  settings.bkEvery = [0, 3, 7, 14, 30].indexOf(Number(settings.bkEvery)) >= 0 ? Number(settings.bkEvery) : 7;
  settings.quickNotif = !!settings.quickNotif; settings.listSize = [90, 100, 115, 130].indexOf(Number(settings.listSize)) >= 0 ? Number(settings.listSize) : 100; settings.contrast = !!settings.contrast; if (typeof settings.calm !== "boolean") settings.calm = null; settings.encTitle = !!settings.encTitle; settings.secureWin = !!settings.secureWin; settings.achPend = (Array.isArray(settings.achPend) ? settings.achPend : []).filter(function (x) { return typeof x === "string"; }).slice(0, 20); settings.streakAlert = !!settings.streakAlert; if (!/^\d{2}:\d{2}$/.test(settings.streakAt || "") || +settings.streakAt.slice(0, 2) > 23 || +settings.streakAt.slice(3) > 59) settings.streakAt = "21:00"; settings.dueAlert = settings.dueAlert !== false; settings.dueEve = !!settings.dueEve;
  if (!/^\d{2}:\d{2}$/.test(settings.dueAt || "") || +settings.dueAt.slice(0, 2) > 23 || +settings.dueAt.slice(3) > 59) settings.dueAt = "09:00";
  if (!settings.act || typeof settings.act !== "object" || Array.isArray(settings.act)) settings.act = {};
  if (!settings.actL || typeof settings.actL !== "object" || Array.isArray(settings.actL)) settings.actL = {};
  if (!settings.ach || typeof settings.ach !== "object" || Array.isArray(settings.ach)) settings.ach = {};
  settings.wTot = Math.max(0, Number(settings.wTot) || 0); settings.streakBest = Math.max(0, Number(settings.streakBest) || 0);
  var hadFirstRun = !!settings.firstRun;
  if (!hadFirstRun) settings.firstRun = Date.now();
  // El fondo que se ve de verdad: el de la nota si lo eligió, si no el de Ajustes.
  function resolveBg(n, card) { var b = n ? cleanBg(n.bg) : ""; if (card && b.slice(0, 2) === "c:") b = ""; return b || settings.noteBg; }
