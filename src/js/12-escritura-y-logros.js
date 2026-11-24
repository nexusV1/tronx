  /* ---------- escritura: palabras, rachas y logros ---------- */
  var wcMap = null, statsSaveT = 0;
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function dayShift(ts, k) { var d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + k, 12).getTime(); }
  function noteWords(n) {
    if (n.type === "list") { var c = 0; n.items.forEach(function (i) { c += (String(i.t || "").match(/\S+/g) || []).length; }); return c; }
    return (String(n.body || "").match(/\S+/g) || []).length;
  }
  function noteLetters(n) {
    var c = 0, f = function (t) { c += (String(t || "").match(/\p{L}/gu) || []).length; };
    if (n.type === "list") n.items.forEach(function (i) { f(i.t); }); else f(n.body);
    return c;
  }
  var lcMap = null;
  function statsBoot() {
    wcMap = new Map(); lcMap = new Map(); notes.forEach(function (n) { wcMap.set(n.id, noteWords(n)); lcMap.set(n.id, noteLetters(n)); });
    if (!settings.statsInit) {
      var t = 0; notes.forEach(function (n) {
        if (n.trashedAt) return; t += noteWords(n);
        [n.createdAt, n.updatedAt].forEach(function (ts) { if (ts > 0) { var k = dayKey(ts); if (settings.act[k] == null) settings.act[k] = 0; } });
      });
      settings.wTot = Math.max(settings.wTot, t); settings.statsInit = true;
      var s = streakInfo(); settings.streakBest = Math.max(settings.streakBest, s.best);
      achCheck(true); saveSettings();
    } else achCheck(true);
  }
  function statsTick(n) {
    if (!wcMap) return;
    var c = noteWords(n), prev = wcMap.get(n.id);
    var isNew = false;
    if (prev == null) prev = Date.now() - n.createdAt < 60000 ? 0 : c;
    if (prev === 0 && c >= 1 && !maxNoted[n.id] && Date.now() - n.createdAt < 600000) { isNew = true; maxNoted[n.id] = 1; }
    wcMap.set(n.id, c);
    var k = dayKey(Date.now()), d = Math.max(0, c - prev);
    maxNote(isNew && c >= 1, d);
    settings.act[k] = (settings.act[k] || 0) + d; settings.wTot += d;
    var cl = noteLetters(n), pl = lcMap ? lcMap.get(n.id) : null; if (pl == null) pl = Date.now() - n.createdAt < 60000 ? 0 : cl; if (lcMap) lcMap.set(n.id, cl);
    var dl = Math.max(0, cl - pl); if (dl) { settings.actL[k] = (settings.actL[k] || 0) + dl; var kl = Object.keys(settings.actL); if (kl.length > 60) { kl.sort(); kl.slice(0, kl.length - 45).forEach(function (x) { delete settings.actL[x]; }); } }
    var keys = Object.keys(settings.act);
    if (keys.length > 430) { keys.sort(); keys.slice(0, keys.length - 400).forEach(function (x) { delete settings.act[x]; }); }
    var s = streakInfo(); if (s.best > settings.streakBest) settings.streakBest = s.best;
    achCheck(false); if (settings.streakAlert && d > 0) syncSoon();
    clearTimeout(statsSaveT); statsSaveT = setTimeout(saveSettings, 1500);
  }
  function streakInfo() {
    var a = settings.act, now = Date.now(), d = a[dayKey(now)] != null ? now : dayShift(now, -1), cur = 0;
    while (a[dayKey(d)] != null && cur < 4000) { cur++; d = dayShift(d, -1); }
    var keys = Object.keys(a).sort(), best = 0, run = 0, prevT = 0;
    keys.forEach(function (k) {
      var p = k.split("-"), t = new Date(+p[0], +p[1] - 1, +p[2], 12).getTime();
      run = prevT && Math.round((t - prevT) / 86400000) === 1 ? run + 1 : 1; prevT = t; if (run > best) best = run;
    });
    return { cur: cur, best: Math.max(best, cur) };
  }
  function writeStats() {
    var now = Date.now(), w7 = 0, act7 = 0, wd = [0, 0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0, 0], a = settings.act;
    for (var i = 0; i < 7; i++) { var v = a[dayKey(dayShift(now, -i))]; if (v != null) { w7 += v; act7++; } }
    Object.keys(a).forEach(function (k) { var p = k.split("-"), g = new Date(+p[0], +p[1] - 1, +p[2], 12).getDay(); wd[g] += a[k]; cnt[g]++; });
    var top = -1, tv = 0; for (var g = 0; g < 7; g++) { var sc = wd[g] * 1000 + cnt[g]; if (sc > tv) { tv = sc; top = g; } }
    var s = streakInfo();
    return { cur: s.cur, best: Math.max(s.best, settings.streakBest), total: settings.wTot, w7: w7, act7: act7, topDay: top };
  }
  var DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var ACH = [
    { id: "n1", n: "Primera nota", d: "Creá tu primera nota", g: function (s) { return s.notes; }, t: 1 },
    { id: "n10", n: "Diez notas", d: "Tené 10 notas en tu universo", g: function (s) { return s.notes; }, t: 10 },
    { id: "n50", n: "Medio centenar", d: "Tené 50 notas", g: function (s) { return s.notes; }, t: 50 },
    { id: "n100", n: "Centenario", d: "Tené 100 notas", g: function (s) { return s.notes; }, t: 100 },
    { id: "l1", n: "Lista en marcha", d: "Creá tu primera lista", g: function (s) { return s.lists; }, t: 1 },
    { id: "t5", n: "Coleccionista de etiquetas", d: "Usá 5 etiquetas distintas", g: function (s) { return s.tags; }, t: 5 },
    { id: "c1", n: "Primera constelación", d: "Agrupá notas en una constelación", g: function (s) { return s.groups; }, t: 1 },
    { id: "v5", n: "Tejedor de vínculos", d: "Hacé 5 vínculos entre notas", g: function (s) { return s.links; }, t: 5 },
    { id: "w1k", n: "Mil palabras", d: "Escribí 1.000 palabras", g: function (s) { return s.w.total; }, t: 1000 },
    { id: "w10k", n: "Diez mil palabras", d: "Escribí 10.000 palabras", g: function (s) { return s.w.total; }, t: 10000 },
    { id: "w50k", n: "Novelista", d: "Escribí 50.000 palabras", g: function (s) { return s.w.total; }, t: 50000 },
    { id: "s3", n: "Tres días seguidos", d: "Escribí 3 días seguidos", g: function (s) { return s.w.best; }, t: 3 },
    { id: "s7", n: "Semana completa", d: "Escribí 7 días seguidos", g: function (s) { return s.w.best; }, t: 7 },
    { id: "s30", n: "Hábito de un mes", d: "Escribí 30 días seguidos", g: function (s) { return s.w.best; }, t: 30 },
    { id: "bk", n: "Resguardo", d: "Hacé tu primera copia de seguridad", g: function (s) { return settings.lastBackup ? 1 : 0; }, t: 1 },
    { id: "lk", n: "Bajo llave", d: "Protegé una nota con PIN o huella", g: function (s) { return s.locked; }, t: 1 },
    { id: "f1", n: "Primer enfoque", d: "Completá una sesión de enfoque de 1 minuto", g: function (s) { return s.fN; }, t: 1 },
    { id: "f60", n: "Una hora de enfoque", d: "Sumá 60 minutos en modo enfoque", g: function (s) { return s.fMin; }, t: 60 },
    { id: "f600", n: "Concentración total", d: "Sumá 10 horas en modo enfoque", g: function (s) { return s.fMin; }, t: 600 },
    { id: "d10", n: "Tareas cumplidas", d: "Tildá 10 casillas en tus listas", g: function (s) { return s.done; }, t: 10 },
    { id: "d100", n: "Imparable", d: "Tildá 100 casillas en tus listas", g: function (s) { return s.done; }, t: 100 },
    { id: "im5", n: "Fotógrafo", d: "Tené 5 notas con imágenes", g: function (s) { return s.img; }, t: 5 },
    { id: "fo3", n: "Organizador", d: "Usá 3 carpetas distintas", g: function (s) { return s.folders; }, t: 3 },
    { id: "ar1", n: "Archivista", d: "Archivá una nota", g: function (s) { return s.arch; }, t: 1 },
    { id: "rm1", n: "Puntual", d: "Programá un aviso", g: function (s) { return s.rem; }, t: 1 },
    { id: "sk1", n: "Con estilo", d: "Creá un sticker propio", g: function (s) { return myStk.length; }, t: 1 },
    { id: "n250", n: "Biblioteca", d: "Tené 250 notas", g: function (s) { return s.notes; }, t: 250 },
    { id: "n500", n: "Archivo vivo", d: "Tené 500 notas", g: function (s) { return s.notes; }, t: 500 },
    { id: "n1000", n: "Mil notas", d: "Tené 1.000 notas", g: function (s) { return s.notes; }, t: 1000 },
    { id: "n2500", n: "Enciclopedia", d: "Tené 2.500 notas", g: function (s) { return s.notes; }, t: 2500 },
    { id: "w100k", n: "Escritor prolífico", d: "Escribí 100.000 palabras", g: function (s) { return s.w.total; }, t: 100000 },
    { id: "w250k", n: "Obra completa", d: "Escribí 250.000 palabras", g: function (s) { return s.w.total; }, t: 250000 },
    { id: "w500k", n: "Medio millón", d: "Escribí 500.000 palabras", g: function (s) { return s.w.total; }, t: 500000 },
    { id: "w1m", n: "Un millón de palabras", d: "Escribí 1.000.000 de palabras", g: function (s) { return s.w.total; }, t: 1000000 },
    { id: "im25", n: "Galería", d: "Tené 25 notas con imágenes", g: function (s) { return s.img; }, t: 25 },
    { id: "im100", n: "Fotoarchivo", d: "Tené 100 notas con imágenes", g: function (s) { return s.img; }, t: 100 },
    { id: "s60", n: "Dos meses firmes", d: "Escribí 60 días seguidos", g: function (s) { return s.w.best; }, t: 60 },
    { id: "s120", n: "Cuatro meses en órbita", d: "Escribí 120 días seguidos", g: function (s) { return s.w.best; }, t: 120 },
    { id: "s250", n: "Casi un año", d: "Escribí 250 días seguidos", g: function (s) { return s.w.best; }, t: 250 },
    { id: "s365", n: "Año completo", d: "Escribí 365 días seguidos", g: function (s) { return s.w.best; }, t: 365 },
    { id: "d500", n: "Máquina de tareas", d: "Tildá 500 casillas en tus listas", g: function (s) { return s.done; }, t: 500 },
    { id: "d1000", n: "Mil tareas", d: "Tildá 1.000 casillas en tus listas", g: function (s) { return s.done; }, t: 1000 },
    { id: "d2500", n: "Ejecutor", d: "Tildá 2.500 casillas en tus listas", g: function (s) { return s.done; }, t: 2500 },
    { id: "d10000", n: "Diez mil tareas", d: "Tildá 10.000 casillas en tus listas", g: function (s) { return s.done; }, t: 10000 },
    { id: "v50", n: "Maestro de vínculos", d: "Hacé 50 vínculos entre notas", g: function (s) { return s.links; }, t: 50 },
    { id: "v200", n: "Red neuronal", d: "Hacé 200 vínculos entre notas", g: function (s) { return s.links; }, t: 200 },
    { id: "c10", n: "Cartógrafo de constelaciones", d: "Creá 10 constelaciones", g: function (s) { return s.groups; }, t: 10 },
    { id: "t25", n: "Bibliotecario de etiquetas", d: "Usá 25 etiquetas distintas", g: function (s) { return s.tags; }, t: 25 },
    { id: "ar50", n: "Gran archivista", d: "Archivá 50 notas", g: function (s) { return s.arch; }, t: 50 },
    { id: "f3000", n: "Maestro del foco", d: "Sumá 50 horas en modo enfoque", g: function (s) { return s.fMin; }, t: 3000 },
    { id: "f9000", n: "Foco profundo", d: "Sumá 150 horas en modo enfoque", g: function (s) { return s.fMin; }, t: 9000 },
    { id: "f18000", n: "Mente de acero", d: "Sumá 300 horas en modo enfoque", g: function (s) { return s.fMin; }, t: 18000 },
    { id: "f60000", n: "Mil horas", d: "Sumá 1.000 horas en modo enfoque", g: function (s) { return s.fMin; }, t: 60000 },
    { id: "fn100", n: "Cien sesiones", d: "Completá 100 sesiones de enfoque", g: function (s) { return s.fN; }, t: 100 },
    { id: "fn500", n: "Disciplina absoluta", d: "Completá 500 sesiones de enfoque", g: function (s) { return s.fN; }, t: 500 },
    { id: "lk10", n: "Cámara acorazada", d: "Protegé 10 notas con PIN o huella", g: function (s) { return s.locked; }, t: 10 },
    { id: "lv10", n: "Capitán estelar", d: "Alcanzá el nivel 10 en MAX", g: function (s) { return s.lvl; }, t: 10 },
    { id: "lv20", n: "Tejedor de nebulosas", d: "Alcanzá el nivel 20 en MAX", g: function (s) { return s.lvl; }, t: 20 },
    { id: "lv30", n: "Oráculo cósmico", d: "Alcanzá el nivel 30 en MAX", g: function (s) { return s.lvl; }, t: 30 },
    { id: "lv50", n: "Singularidad alcanzada", d: "Alcanzá el nivel 50 en MAX", g: function (s) { return s.lvl; }, t: 50 },
    { id: "sx_night", n: "Búho nocturno", d: "Creá una nota de madrugada, entre las 00:00 y las 05:00", g: function (s) { return s.night; }, at: function (s) { return s.nightAt; }, t: 1, sec: 1 },
    { id: "sx_dawn", n: "Madrugador", d: "Creá una nota entre las 05:00 y las 07:00", g: function (s) { return s.dawn; }, at: function (s) { return s.dawnAt; }, t: 1, sec: 1 },
    { id: "sx_tronx", n: "Hola, Tronx", d: "Escribí «Tronx» en el título de una nota", g: function (s) { return s.tronx; }, t: 1, sec: 1 },
    { id: "sx_epic", n: "Nota épica", d: "Escribí una sola nota de más de 1.000 palabras", g: function (s) { return s.epic; }, t: 1, sec: 1 },
    { id: "sx_burst", n: "Ráfaga creativa", d: "Creá 10 notas en un mismo día", g: function (s) { return s.burst; }, at: function (s) { return s.burstAt; }, t: 10, sec: 1 },
    { id: "sx_date", n: "Fecha especial", d: "Creá una nota en Navidad, Nochebuena, Fin de Año o Año Nuevo", g: function (s) { return s.xmas; }, at: function (s) { return s.xmasAt; }, t: 1, sec: 1 },
    { id: "sx_days", n: "Fiel a Tronx", d: "Escribí en 100 días distintos", g: function (s) { return s.actDays; }, t: 100, sec: 1 },
    { id: "sx_marathon", n: "Maratón de enfoque", d: "Completá una sola sesión de enfoque de 2 horas o más", g: function (s) { return s.maxSess; }, t: 120, sec: 1 },
    { id: "sx_all", n: "Cazador de secretos", d: "Descubrí todos los demás logros secretos", g: function (s) { return s.nSec; }, t: 0, sec: 1 },
    { id: "all", n: "Leyenda de Tronx", d: "Desbloqueá todos los demás logros", g: function (s) { return s.nAch; }, t: 0 }
  ];
  ACH.forEach(function (a) { if (a.id === "all") a.t = ACH.length - 1; if (a.id === "sx_all") a.t = ACH.filter(function (x) { return x.sec; }).length - 1; });
  var ACH_META = {
    n1: ["Escritura", "📝", 1], n10: ["Escritura", "🗒️", 1], n50: ["Escritura", "📚", 2], n100: ["Escritura", "🏆", 3],
    w1k: ["Escritura", "✍️", 1], w10k: ["Escritura", "📖", 2], w50k: ["Escritura", "🖋️", 3], im5: ["Escritura", "📷", 2], sk1: ["Escritura", "🎨", 1],
    s3: ["Constancia", "🔥", 1], s7: ["Constancia", "🔥", 2], s30: ["Constancia", "📅", 3], rm1: ["Constancia", "⏰", 1],
    l1: ["Orden", "✅", 1], t5: ["Orden", "🏷️", 1], c1: ["Orden", "🌌", 2], v5: ["Orden", "🔗", 2], d10: ["Orden", "☑️", 1], d100: ["Orden", "💪", 3], fo3: ["Orden", "🗂️", 2], ar1: ["Orden", "📦", 1],
    f1: ["Enfoque", "🎯", 1], f60: ["Enfoque", "⏱️", 2], f600: ["Enfoque", "🧘", 3],
    bk: ["Seguridad", "💾", 1], lk: ["Seguridad", "🔒", 1],
    n250: ["Escritura", "⭐", 4], n500: ["Escritura", "⭐", 5], n1000: ["Escritura", "⭐", 6], n2500: ["Escritura", "⭐", 7], w100k: ["Escritura", "⭐", 4], w250k: ["Escritura", "⭐", 5], w500k: ["Escritura", "⭐", 6], w1m: ["Escritura", "⭐", 7], im25: ["Escritura", "⭐", 4], im100: ["Escritura", "⭐", 5], s60: ["Constancia", "⭐", 4], s120: ["Constancia", "⭐", 5], s250: ["Constancia", "⭐", 6], s365: ["Constancia", "⭐", 7], d500: ["Orden", "⭐", 4], d1000: ["Orden", "⭐", 5], d2500: ["Orden", "⭐", 6], d10000: ["Orden", "⭐", 7], v50: ["Orden", "⭐", 4], v200: ["Orden", "⭐", 5], c10: ["Orden", "⭐", 4], t25: ["Orden", "⭐", 4], ar50: ["Orden", "⭐", 4], f3000: ["Enfoque", "⭐", 4], f9000: ["Enfoque", "⭐", 5], f18000: ["Enfoque", "⭐", 6], f60000: ["Enfoque", "⭐", 7], fn100: ["Enfoque", "⭐", 4], fn500: ["Enfoque", "⭐", 5], lk10: ["Seguridad", "⭐", 4], lv10: ["Maestría", "⭐", 4], lv20: ["Maestría", "⭐", 5], lv30: ["Maestría", "⭐", 6], lv50: ["Maestría", "⭐", 7], all: ["Maestría", "👑", 7], sx_night: ["Secretos", "❓", 2], sx_dawn: ["Secretos", "❓", 2], sx_tronx: ["Secretos", "❓", 1], sx_epic: ["Secretos", "❓", 3], sx_burst: ["Secretos", "❓", 3], sx_date: ["Secretos", "❓", 2], sx_days: ["Secretos", "❓", 4], sx_marathon: ["Secretos", "❓", 5], sx_all: ["Secretos", "❓", 6]
  };
  ACH.forEach(function (a) { var m = ACH_META[a.id] || ["Orden", "⭐", 1]; a.c = m[0]; a.e = m[1]; a.tier = m[2]; });
  var PF_CATS = ["Todos", "Escritura", "Constancia", "Orden", "Enfoque", "Seguridad", "Maestría", "Secretos"], pfCat = "Todos";
  var TIER_CLS = ["", "bronze", "silver", "gold", "platinum", "diamond", "stellar", "cosmic"], TIER_NM = ["", "bronce", "plata", "oro", "platino", "diamante", "estelar", "cósmico"];
  var MD_PAL = { 1: ["#ffd9b8", "#cd7f45", "#6b3512", "#fff0e0"], 2: ["#ffffff", "#b6bdd3", "#4e566e", "#ffffff"], 3: ["#fff3b0", "#f0b01c", "#8a5a00", "#fffbe0"], 4: ["#eaf6ff", "#5f93c9", "#16315a", "#ffffff"], 5: ["#e9fcff", "#6fd3f2", "#1f5f9a", "#ffffff"], 6: ["#b8f1ff", "#3a63e0", "#0a1140", "#e6f6ff"], 7: ["#f5c6ff", "#8b3ce6", "#14062f", "#fff0ff"], 0: ["#4a4e70", "#34375a", "#222542", "#6b6f95"] };
  var mdN = 0;
  function mdShape(cat, r, fill, stroke, sw) {
    var i, a, p = [], d = "", at = ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"';
    if (cat === "Escritura") { for (i = 0; i < 6; i++) { a = (-90 + i * 60) * Math.PI / 180; p.push((50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(" ") + '"' + at + "/>"; }
    if (cat === "Constancia") { for (i = 0; i < 16; i++) { a = i * 22.5 * Math.PI / 180; var rr = i % 2 ? r * 0.86 : r; d += (i ? "L" : "M") + (50 + rr * Math.cos(a)).toFixed(1) + " " + (50 + rr * Math.sin(a)).toFixed(1); } return '<path d="' + d + 'Z"' + at + "/>"; }
    if (cat === "Enfoque") { for (i = 0; i < 8; i++) { a = (i * 45 + 22.5) * Math.PI / 180; p.push((50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(" ") + '"' + at + "/>"; }
    if (cat === "Maestría") { for (i = 0; i < 10; i++) { a = (-90 + i * 36) * Math.PI / 180; var r2 = i % 2 ? r * 0.7 : r * 1.06; d += (i ? "L" : "M") + (50 + r2 * Math.cos(a)).toFixed(1) + " " + (50 + r2 * Math.sin(a)).toFixed(1); } return '<path d="' + d + 'Z"' + at + "/>"; }
    if (cat === "Seguridad") return '<path d="M50 ' + (50 - r) + " L" + (50 + r * 0.86) + " " + (50 - r * 0.62) + " V" + (50 + r * 0.1) + " C" + (50 + r * 0.86) + " " + (50 + r * 0.62) + " 50 " + (50 + r) + " 50 " + (50 + r) + " C50 " + (50 + r) + " " + (50 - r * 0.86) + " " + (50 + r * 0.62) + " " + (50 - r * 0.86) + " " + (50 + r * 0.1) + " V" + (50 - r * 0.62) + 'Z"' + at + "/>";
    return '<rect x="' + (50 - r * 0.86) + '" y="' + (50 - r * 0.86) + '" width="' + (r * 1.72) + '" height="' + (r * 1.72) + '" rx="' + (r * 0.3) + '" transform="rotate(45 50 50)"' + at + "/>";
  }
  var GL={
  n1:["M7 3h8l4 4v14H7z","M15 3v4h4","M10 13h6","M10 17h4"],
  n10:["M9 8h10v13H9z","M5 4h10v2","M5 4v13h2","M12 12h4","M12 16h4"],
  n50:["M4 17l8-4 8 4-8 4z","M4 12l8-4 8 4","M4 7l8-4 8 4-8 4z"],
  n100:["M8 4h8v5a4 4 0 01-8 0z","M8 6H5v2a3 3 0 003 3","M16 6h3v2a3 3 0 01-3 3","M12 13v4","M8 20h8","M10 17h4"],
  l1:["M4 7l2 2 3-3","M12 7h8","M4 15l2 2 3-3","M12 15h8"],
  t5:["M3 12V4h8l9 9-8 8z","M7.5 8.5h.01"],
  c1:["M5 17l5-8 5 5 4-9","M5 17h.01","M10 9h.01","M15 14h.01","M19 5h.01"],
  v5:["M10 14a4 4 0 010-6l2-2a4 4 0 016 6l-1 1","M14 10a4 4 0 010 6l-2 2a4 4 0 01-6-6l1-1"],
  w1k:["M4 20l1-4L16 5l3 3L8 19z","M14 7l3 3"],
  w10k:["M3 6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z","M12 7v13"],
  w50k:["M20 4C10 4 6 10 6 16l-2 4 4-2c6 0 12-4 12-14z","M8 16l8-8"],
  s3:["M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"],
  s7:["M4 6h16v14H4z","M4 10h16","M8 3v4","M16 3v4","M8 14l2 2 4-4"],
  s30:["M4 6h16v14H4z","M4 10h16","M8 3v4","M16 3v4","M12 12.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z"],
  bk:["M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z","M9 12l2 2 4-4"],
  lk:["M6 11h12v10H6z","M8 11V8a4 4 0 018 0v3","M12 15v3"],
  f1:["M12 3a9 9 0 100 18 9 9 0 000-18z","M12 8a4 4 0 100 8 4 4 0 000-8z","M12 12h.01"],
  f60:["M12 5a8 8 0 100 16 8 8 0 000-16z","M12 9v4l3 2","M10 2h4"],
  f600:["M12 20c-4 0-7-3-8-7 3 0 5 1 8 4 3-3 5-4 8-4-1 4-4 7-8 7z","M12 17c-3-2-3-8 0-12 3 4 3 10 0 12z"],
  d10:["M4 4h16v16H4z","M8 12l3 3 5-6"],
  d100:["M13 2L5 14h6l-1 8 8-12h-6z"],
  im5:["M4 8h4l2-3h4l2 3h4v11H4z","M12 11a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"],
  fo3:["M3 6h7l2 2h9v11H3z","M3 11h18"],
  ar1:["M3 5h18v4H3z","M5 9v11h14V9","M10 13h4"],
  rm1:["M12 6a7 7 0 100 14 7 7 0 000-14z","M12 10v4l2 1","M4 7l3-3","M20 7l-3-3"],
  sk1:["M12 3a9 9 0 000 18c1 0 2-1 1-2-1-2 0-3 2-3h3a3 3 0 003-3c0-5-4-10-9-10z","M7.5 11h.01","M10 7.5h.01","M15 7.5h.01"]
  };
  var GLA={n250:"n50",n500:"n10",n1000:"n100",n2500:"n50",w100k:"w50k",w250k:"w10k",w500k:"w50k",w1m:"w1k",im25:"im5",im100:"im5",s60:"s7",s120:"s30",s250:"s30",s365:"s30",d500:"d10",d1000:"d100",d2500:"d100",d10000:"d100",v50:"v5",v200:"v5",c10:"c1",t25:"t5",ar50:"ar1",f3000:"f60",f9000:"f600",f18000:"f600",f60000:"f60",fn100:"f1",fn500:"f1",lk10:"lk",lv10:"lv",sx_night:"moon",sx_dawn:"sun",sx_tronx:"lv",sx_epic:"n1",sx_burst:"d100",sx_date:"gift",sx_days:"s30",sx_marathon:"f60",sx_all:"all",lv20:"lv",lv30:"lv",lv50:"lv"};
  GL.q=["M9 9a3 3 0 116 0c0 2-3 2-3 5","M12 18h.01"];GL.moon=["M20 14A8 8 0 1110 4a6.5 6.5 0 0010 10z"];GL.sun=["M12 8a4 4 0 100 8 4 4 0 000-8z","M12 2v2","M12 20v2","M2 12h2","M20 12h2","M5 5l1.5 1.5","M17.5 17.5L19 19","M5 19l1.5-1.5","M17.5 6.5L19 5"];GL.gift=["M4 10h16v10H4z","M3 7h18v3H3z","M12 7v13","M12 7c-2-4-6-3-4 0","M12 7c2-4 6-3 4 0"];
  GL.lv=["M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3-5.6-3.1-5.6 3.1 1.2-6.3L3 9.6l6.3-.8z"];GL.all=["M4 18L3 8l5 4 4-7 4 7 5-4-1 10z","M4 21h16"];
  function glyph(id,c,on){var g=GL[GLA[id]||id]||[];var dark=on?c[2]:'#15172e',lite=on?c[3]:'#7f84ad',s='<g transform="translate(27 27) scale(1.9)" fill="none" stroke-linecap="round" stroke-linejoin="round">';
   g=g.map(function(d){var m=/^M([\d.]+) ([\d.]+)h\.01$/.exec(d);return m?'M'+(+m[1]-1.3)+' '+m[2]+'a1.3 1.3 0 102.6 0a1.3 1.3 0 10-2.6 0':d});
   g.forEach(function(d){s+='<path d="'+d+'" stroke="'+dark+'" stroke-width="3.6" opacity=".9"/>'});
   g.forEach(function(d){s+='<path d="'+d+'" stroke="'+lite+'" stroke-width="1.7"/>'});return s+'</g>'}
  function spark(x,y,r,cl,d){return '<path class="mz-tw" style="animation-delay:'+d+'s" d="M'+x+' '+(y-r)+' L'+(x+r*.22)+' '+(y-r*.22)+' L'+(x+r)+' '+y+' L'+(x+r*.22)+' '+(y+r*.22)+' L'+x+' '+(y+r)+' L'+(x-r*.22)+' '+(y+r*.22)+' L'+(x-r)+' '+y+' L'+(x-r*.22)+' '+(y-r*.22)+'Z" fill="'+cl+'"/>'}
  var RG=[[52,16,-24,"#ff9bf0",7,0],[50,14,32,"#8fd0ff",9,1]];
  function medalSvgFx(cat,tier,id0){
   var id="m"+(++mdN),c=MD_PAL[tier],s="";
   s+='<defs><linearGradient id="'+id+'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c[0]+'"/><stop offset=".5" stop-color="'+c[1]+'"/><stop offset="1" stop-color="'+c[2]+'"/></linearGradient>'
   +'<linearGradient id="'+id+'i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c[2]+'" stop-opacity=".9"/><stop offset="1" stop-color="'+c[1]+'" stop-opacity=".9"/></linearGradient>'
   +'<linearGradient id="'+id+'s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
   +'<linearGradient id="'+id+'h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
   +'<radialGradient id="'+id+'n1" cx=".3" cy=".35" r=".6"><stop offset="0" stop-color="#ff7be5" stop-opacity=".85"/><stop offset="1" stop-color="#ff7be5" stop-opacity="0"/></radialGradient>'
   +'<radialGradient id="'+id+'n2" cx=".7" cy=".65" r=".6"><stop offset="0" stop-color="#6a7bff" stop-opacity=".9"/><stop offset="1" stop-color="#6a7bff" stop-opacity="0"/></radialGradient>'
   +'<radialGradient id="'+id+'g" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="'+c[1]+'" stop-opacity="0"/><stop offset="1" stop-color="'+c[1]+'" stop-opacity=".7"/></radialGradient>'
   +'<clipPath id="'+id+'c">'+mdShape(cat,36,"#000","none",0)+'</clipPath><clipPath id="'+id+'o">'+mdShape(cat,44,"#000","none",0)+'</clipPath></defs>';
   if(tier===7)s+=ringBack();
   s+=mdShape(cat,44,"url(#"+id+"a)",c[2],2.5);
   s+=mdShape(cat,36,"url(#"+id+"i)",c[3],1.6).replace('stroke-width="1.6"','stroke-width="1.6" stroke-opacity=".7"');
  
  
  
   function ringG(k,front){var r=RG[k-1],e='<ellipse cx="50" cy="50" rx="'+r[0]+'" ry="'+r[1]+'" transform="rotate('+r[2]+' 50 50)"';
    var g=e+' stroke="'+r[3]+'" stroke-width="1.1" stroke-opacity=".4"/>';
    [[30,.35,1.2],[16,.7,1.6],[7,1,2.4]].forEach(function(t){g+=e+' pathLength="100" class="mz-run" style="animation-duration:'+r[4]+'s;animation-direction:'+(r[5]?'reverse':'normal')+'" stroke="#fff" stroke-opacity="'+t[1]+'" stroke-width="'+t[2]+'" stroke-dasharray="'+t[0]+' '+(100-t[0])+'" stroke-linecap="round"/>'});
    return g}
   function ringBack(){return '<g>'+ringG(1)+ringG(2)+'</g>'}
   function ringFront(k){var r=RG[k-1];return '<clipPath id="'+id+'f'+k+'"><rect transform="rotate('+r[2]+' 50 50)" x="-40" y="50" width="180" height="70"/></clipPath><g clip-path="url(#'+id+'f'+k+')">'+ringG(k)+'</g>'}
   function run(r,col,w,dash,sp){return mdShape(cat,r,"none",col,w).replace(/^<(\w+) /,'<$1 pathLength="100" class="mz-run" style="animation-duration:'+sp+'s" stroke-dasharray="'+dash+'" stroke-linecap="round" ')}
   var clipO='<g clip-path="url(#'+id+'o)">';
   if(tier===3){ // oro: barrido calido + destello sobre la superficie
    s+=clipO+'<rect class="mz-shine" x="10" y="-5" width="22" height="110" fill="url(#'+id+'h)" transform="skewX(-20)" style="animation-duration:3.6s"/></g>';
    s+='<g class="mz-flash" style="transform-origin:34px 30px"><path d="M34 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fffbe0"/></g>';
   }
   if(tier===4){ // platino: reflejo metalico + luz que recorre el borde
    s+=mdShape(cat,40,"none",c[0],.8).replace('stroke-linejoin','stroke-opacity=".8" stroke-linejoin');
    s+=clipO+'<rect class="mz-shine" x="10" y="-5" width="30" height="110" fill="url(#'+id+'h)" transform="skewX(-20)" style="animation-duration:5s"/></g>';
    s+=run(44,"#ffffff",2.6,"9 91",3.4);
   }
   if(tier===5){ // diamante: facetas, arcoiris prismatico y destellos
    var f='';for(var i=0;i<8;i++){var an=i*45*Math.PI/180;f+='M50 50L'+(50+60*Math.cos(an)).toFixed(1)+' '+(50+60*Math.sin(an)).toFixed(1)}
    s+='<defs><linearGradient id="'+id+'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7bd5"/><stop offset=".33" stop-color="#7bffd9"/><stop offset=".66" stop-color="#7bb4ff"/><stop offset="1" stop-color="#ffe07b"/></linearGradient></defs>';
    s+=clipO+'<g class="mz-hue"><rect x="0" y="0" width="100" height="100" fill="url(#'+id+'r)" opacity=".2"/></g><path d="'+f+'" stroke="#fff" stroke-opacity=".5" stroke-width=".9"/><path d="M50 6L78 50 50 94 22 50Z" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/><path d="M50 6L62 50 50 94 38 50Z" fill="#fff" opacity=".14"/></g>';
    s+=spark(32,40,4.5,'#fff',0)+spark(66,34,3.5,'#fff',.7)+spark(58,68,5,'#fff',1.4)+spark(40,64,3,'#fff',2);
    s+=spark(14,22,7,'#fff',0)+spark(88,30,5,'#d9f6ff',.8)+spark(80,86,6,'#fff',1.5)+spark(20,78,4,'#d9f6ff',2);
   }
   if(tier===6){ // estelar: constelacion que se dibuja y destella
  var C=[[26,62],[38,36],[58,28],[72,46],[62,70],[40,76]];
  var d='M'+C.map(function(p){return p.join(' ')}).join('L'),segs='';
  s+=clipO.replace('o)','c)')+'<g class="mz-spin" style="animation-duration:60s;opacity:.16"><path d="M50 -10L53 50 50 110 47 50ZM-10 50L50 47 110 50 50 53Z" fill="#bfeaff"/></g>';
  [[20,26,.7,0],[80,28,.8,1.1],[84,64,.7,2.2],[18,80,.8,.6],[52,12,.6,1.7],[50,88,.7,2.8],[88,46,.6,.3],[12,48,.6,1.4]].forEach(function(p){s+='<circle class="mz-tw" style="animation-delay:'+p[3]+'s" cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="#cfeeff"/>'});
  s+='<path class="mz-cdraw" pathLength="100" d="'+d+'" stroke="#9fe3ff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="100"/>';
  C.forEach(function(p,i){s+='<g class="mz-cstar" style="animation-delay:'+(i*.55)+'s;transform-origin:'+p[0]+'px '+p[1]+'px"><path d="M'+p[0]+' '+(p[1]-3.6)+'L'+(p[0]+.9)+' '+(p[1]-.9)+'L'+(p[0]+3.6)+' '+p[1]+'L'+(p[0]+.9)+' '+(p[1]+.9)+'L'+p[0]+' '+(p[1]+3.6)+'L'+(p[0]-.9)+' '+(p[1]+.9)+'L'+(p[0]-3.6)+' '+p[1]+'L'+(p[0]-.9)+' '+(p[1]-.9)+'Z" fill="#fff"/></g>'});
  s+='</g>';
  s+=mdShape(cat,44,"none","#a9ecff",1.2).replace('stroke-linejoin','stroke-opacity=".7" stroke-linejoin');
 }
 if(tier===7){ // cosmico
    s+=clipO.replace('o)','c)')+'<g class="mz-spin" style="animation-duration:26s"><ellipse cx="50" cy="50" rx="46" ry="11" fill="url(#'+id+'n1)" transform="rotate(20 50 50)"/><ellipse cx="50" cy="50" rx="46" ry="11" fill="url(#'+id+'n2)" transform="rotate(80 50 50)"/><ellipse cx="50" cy="50" rx="46" ry="11" fill="url(#'+id+'n1)" transform="rotate(140 50 50)" opacity=".8"/></g>';
    s+='<g class="mz-neb"><circle cx="34" cy="38" r="30" fill="url(#'+id+'n1)" opacity=".7"/><circle cx="68" cy="64" r="32" fill="url(#'+id+'n2)" opacity=".8"/></g>';
    s+='<circle class="mz-pulse" cx="50" cy="50" r="16" fill="#ffd0ff" opacity=".35"/>';
    s+='<circle class="mz-pls" cx="50" cy="50" r="30" stroke="#fff" stroke-width="1.4"/><circle class="mz-pls" style="animation-delay:1.8s" cx="50" cy="50" r="30" stroke="#ffd6ff" stroke-width="1"/>';
    s+='<g class="mz-spin" style="animation-duration:9s"><path d="M50 50L90 40L90 60Z" fill="#fff" opacity=".13"/></g>';
    [[30,30,1,'orb1'],[70,36,.9,'orb2'],[44,70,1,'orb3'],[64,24,.7,'orb2'],[26,62,.7,'orb1'],[76,70,.8,'orb3'],[52,50,.7,'orb1'],[38,44,.6,'orb3'],[60,58,.6,'orb2']].forEach(function(p,i){s+='<g class="'+p[3]+'"><circle class="mz-tw" style="animation-delay:'+(i*.3)+'s" cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+(i%3?'#fff':'#ffd9ff')+'"/></g>'});
    s+='<g class="mz-shoot" style="animation-duration:5.5s"><path d="M0 0L-18 -12" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-opacity=".85"/><circle r="1.7" fill="#fff"/></g></g>';
    s+=run(44,"#ffe3ff",2.4,"26 74",5.5)+run(44,"#9fd8ff",2,"16 84",5.5).replace('animation-duration:5.5s','animation-duration:5.5s;animation-delay:-2.7s');
    s+=ringFront(1)+ringFront(2);
   }
   s+='<path d="M20 38 Q50 12 80 38 Q50 30 20 38Z" fill="url(#'+id+'s)" opacity=".8"/>';
   s+='<circle cx="50" cy="12" r="2.6" fill="'+c[3]+'"/>';
   if(id0)s+=glyph(id0,c,true);
   return '<svg viewBox="-2 -4 104 106">'+s+'</svg>';
  }
  
  function medalSvg(cat, tier, on, id0) {
    if (on && tier >= 3) return medalSvgFx(cat, tier, id0);
    var id = "md" + (++mdN), c = MD_PAL[on ? tier : 0], s = "";
    s += '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient><linearGradient id="' + id + 'i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[2] + '" stop-opacity=".9"/><stop offset="1" stop-color="' + c[1] + '" stop-opacity=".9"/></linearGradient><linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
    if (on && tier === 3) s += '<circle cx="50" cy="50" r="49" fill="' + c[1] + '" opacity=".25"/>';
    s += mdShape(cat, 44, "url(#" + id + "a)", c[2], 2.5);
    s += mdShape(cat, 36, "url(#" + id + "i)", c[3], 1.6).replace('stroke-width="1.6"', 'stroke-width="1.6" stroke-opacity=".7"');
    s += '<path d="M20 38 Q50 12 80 38 Q50 30 20 38Z" fill="url(#' + id + 's)" opacity=".8"/>';
    if (on && tier >= 2) s += '<circle cx="50" cy="12" r="2.6" fill="' + c[3] + '"/>';
    if (on && tier === 3) s += '<path d="M50 3 l2.2 5 5.3.5-4 3.6 1.2 5.2-4.7-2.8-4.7 2.8 1.2-5.2-4-3.6 5.3-.5z" fill="#fff6c9" stroke="#8a5a00" stroke-width="1" transform="translate(5 -2) scale(.9)"/>';
    if (id0) s += glyph(id0, c, on);
    return '<svg viewBox="-2 -4 104 106" aria-hidden="true">' + s + "</svg>";
  }
  function medal(a, on) {
    var m = el("div", "md " + (on ? TIER_CLS[a.tier] : "off")); m.innerHTML = medalSvg(a.c, a.tier, on, a.id); m.setAttribute("aria-hidden", "true"); return m;
  }
  function fmtN(n) { return Number(n).toLocaleString("es"); }
  function renderAch() {
    var st = achState(), box = $("pfAch"), done = 0, cnt = [0, 0, 0, 0, 0, 0, 0, 0]; box.textContent = "";
    ACH.forEach(function (a) { if (settings.ach[a.id]) { done++; cnt[a.tier]++; } });
    var pct = Math.round(done / ACH.length * 100);
    $("pfRing").style.strokeDasharray = (pct * 2.136) + " 214"; $("pfRingN").textContent = pct + "%";
    $("pfAchT").textContent = done + " de " + ACH.length + " logros";
    var tr = $("pfTiers"); tr.textContent = "";
    [7, 6, 5, 4, 3, 2, 1].forEach(function (t) { if (t > 3 && !cnt[t]) return; var i = el("i"); i.textContent = ({ 7: "🌌 ", 6: "🌠 ", 5: "💎 ", 4: "🔷 ", 3: "🥇 ", 2: "🥈 ", 1: "🥉 " })[t] + cnt[t] + " " + TIER_NM[t]; tr.appendChild(i); });
    var ch = $("pfAchChips"); ch.textContent = "";
    PF_CATS.forEach(function (c) {
      var b = el("button"); b.type = "button"; b.textContent = c; b.setAttribute("aria-pressed", c === pfCat ? "true" : "false");
      b.addEventListener("click", function () { pfCat = c; renderAch(); }); ch.appendChild(b);
    });
    var list = ACH.filter(function (a) { return pfCat === "Todos" || a.c === pfCat; });
    var got = list.filter(function (a) { return settings.ach[a.id]; }).sort(function (x, y) { return settings.ach[y.id] - settings.ach[x.id]; });
    var go = list.filter(function (a) { return !settings.ach[a.id]; }).sort(function (x, y) { return (x.sec ? 1 : 0) - (y.sec ? 1 : 0) || Math.min(1, y.g(st) / y.t) - Math.min(1, x.g(st) / x.t); });
    function sec(t) { var s = el("div", "pf-sec"); s.textContent = t; box.appendChild(s); }
    if (got.length) {
      sec(pfCat === "Todos" ? "Conseguidos" : "Conseguidos · " + pfCat);
      got.forEach(function (a) {
        var r = el("div", "pf-a on"), tx = el("div"), b = el("b"), s = el("span", "d"), ts = settings.ach[a.id];
        b.textContent = a.n;
        if (Date.now() - ts < 3 * 86400000) { var nw = el("i", "pf-new"); nw.textContent = "NUEVO"; b.appendChild(nw); }
        if (a.sec) { var sb = el("i", "pf-new"); sb.textContent = "SECRETO"; b.appendChild(sb); }
        s.textContent = a.d + " · " + new Date(ts).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");
        tx.appendChild(b); tx.appendChild(s); r.appendChild(medal(a, true)); r.appendChild(tx); box.appendChild(r);
      });
    }
    if (go.length) {
      sec("En camino");
      go.forEach(function (a) {
        if (a.sec) {
          var rs = el("div", "pf-a sec"), tq = el("div"), bq = el("b"), sq = el("span", "d"), mq = el("div", "md off"); mq.innerHTML = medalSvg(a.c, a.tier, false, "q"); mq.setAttribute("aria-hidden", "true");
          bq.textContent = "Logro secreto"; sq.textContent = "Descubrilo explorando Tronx. No hay pistas."; tq.appendChild(bq); tq.appendChild(sq); rs.appendChild(mq); rs.appendChild(tq); box.appendChild(rs); return;
        }
        var v = Math.min(a.t, Math.floor(a.g(st))), r = el("div", "pf-a"), tx = el("div"), b = el("b"), s = el("span", "d"), pl = el("div", "pbl"), pb = el("div", "pb2"), pi = el("i");
        b.textContent = a.n; s.textContent = a.d;
        var l1 = el("span"), l2 = el("span"); l1.textContent = fmtN(v) + " / " + fmtN(a.t); l2.textContent = TIER_NM[a.tier]; pl.appendChild(l1); pl.appendChild(l2);
        pi.style.width = Math.round(v / a.t * 100) + "%"; pb.appendChild(pi);
        tx.appendChild(b); tx.appendChild(s); tx.appendChild(pl); tx.appendChild(pb); r.appendChild(medal(a, false)); r.appendChild(tx); box.appendChild(r);
      });
    }
    if (!got.length && !go.length) { var e0 = el("p", "pf-since"); e0.textContent = "No hay logros en esta categoría."; box.appendChild(e0); }
  }
  /* notas de bienvenida que crea la app sola: no cuentan para logros que piden crear o escribir algo */
  function isSeedNote(n) { return (n.tags || []).indexOf("bienvenida") >= 0 && (n.title === "Bienvenido a Tronx" || n.title === "Ejemplo de lista"); }
  /* una nota vacía no cuenta: se crea al abrir el editor y suele descartarse */
  function hasContent(n) {
    if (n.lock || n.enc) return true;
    if (String(n.title || "").trim()) return true;
    if (n.type === "list") return (n.items || []).some(function (i) { return String(i.t || "").trim(); });
    return !!String(n.body || "").trim();
  }
  function achState() {
    var st = universeStats(); st.w = writeStats(); st.locked = 0; st.done = 0; st.img = 0; st.arch = 0; st.rem = 0; st.night = 0; st.dawn = 0; st.tronx = 0; st.epic = 0; st.burst = 0; st.xmas = 0;
    st.nightAt = st.dawnAt = st.xmasAt = st.burstAt = 0; var fo = {}, perDay = {};
    var early = function (cur, ts) { return !cur || ts < cur ? ts : cur; };
    notes.forEach(function (n) {
      if (n.trashedAt) return;
      if (n.lock) st.locked++; if (n.archived) st.arch++; if (n.remind) st.rem++; if (n.folder) fo[n.folder] = 1; if (!n.lock && n.images.length) st.img++;
      n.items.forEach(function (i) { if (i.done && i.t.trim()) st.done++; });
      if (isSeedNote(n) || !hasContent(n)) return;
      var cd = new Date(n.createdAt), hr = cd.getHours(), mo = cd.getMonth(), dm = cd.getDate();
      if (hr < 5) { st.night++; st.nightAt = early(st.nightAt, n.createdAt); } else if (hr < 7) { st.dawn++; st.dawnAt = early(st.dawnAt, n.createdAt); }
      if ((n.title || "").toLowerCase().indexOf("tronx") >= 0) st.tronx++;
      if (!n.lock && noteWords(n) > 1000) st.epic++;
      var pk = cd.getFullYear() + "-" + mo + "-" + dm; (perDay[pk] = perDay[pk] || []).push(n.createdAt);
      if ((mo === 11 && (dm === 24 || dm === 25 || dm === 31)) || (mo === 0 && dm === 1)) { st.xmas++; st.xmasAt = early(st.xmasAt, n.createdAt); }
    });
    Object.keys(perDay).forEach(function (k) {
      var a = perDay[k].sort(function (x, y) { return x - y; });
      if (a.length > st.burst) st.burst = a.length;
      if (a.length >= 10) st.burstAt = early(st.burstAt, a[9]);
    });
    st.actDays = Object.keys(settings.act || {}).filter(function (k) { return settings.act[k] > 0; }).length; st.maxSess = 0; (settings.focusLog || []).forEach(function (f) { if (f.m > st.maxSess) st.maxSess = f.m; });
    var nS = 0; ACH.forEach(function (a) { if (a.sec && a.id !== "sx_all" && settings.ach[a.id]) nS++; }); st.nSec = nS;
    st.lvl = settings.max && settings.max.xp != null ? lvlOf(settings.max.bk ? settings.max.bk.xp : settings.max.xp) : 1; var nA = 0; ACH.forEach(function (a) { if (a.id !== "all" && settings.ach[a.id]) nA++; }); st.nAch = nA;
    st.folders = Object.keys(fo).length; st.fMin = (settings.focus && settings.focus.min) || 0; st.fN = (settings.focus && settings.focus.n) || 0;
    return st;
  }
  function achCheck(silent) {
    var st = achState(), fresh = [], now = Date.now();
    ACH.forEach(function (a) {
      var at = a.at ? Math.min(Number(a.at(st)) || 0, now) : 0;
      if (!settings.ach[a.id] && a.g(st) >= a.t) { settings.ach[a.id] = at || now; fresh.push(a); }
      else if (settings.ach[a.id] && at && !settings.achAtFix && settings.ach[a.id] > at) settings.ach[a.id] = at;
    });
    if (!settings.achAtFix) { settings.achAtFix = 1; clearTimeout(statsSaveT); statsSaveT = setTimeout(saveSettings, 800); }
    fresh.forEach(function (a) { grantXp(TIER_XP[a.tier], Math.round(TIER_XP[a.tier] / 2)); if (a.tier >= 4 || a.sec) settings.achPend.push(a.id); });
    if (fresh.length) {
      var low = fresh.filter(function (a) { return a.tier < 4 && !a.sec; });
      if (!silent && low.length && typeof toast === "function") toast("Logro desbloqueado: " + low[0].n + (low.length > 1 ? " (+" + (low.length - 1) + ")" : ""));
      if (fresh.length !== low.length) tryCelebrate();
      clearTimeout(statsSaveT); statsSaveT = setTimeout(saveSettings, 800);
    }
    return fresh;
  }
  function renderWriting() {
    var w = writeStats(), sx = $("pfWrite"); sx.textContent = "";
    var fmt = function (n) { return n.toLocaleString("es"); };
    [[w.cur, w.cur === 1 ? "Día de racha" : "Días de racha"], [w.best, "Mejor racha"], [fmt(w.total), "Palabras"], [fmt(w.w7), "Últimos 7 días"], [w.act7 + "/7", "Días activos"], [w.topDay >= 0 ? DAYS_ES[w.topDay].slice(0, 3) : "–", "Día fuerte"]].forEach(function (a) {
      var t = el("div", "pf-stat"), b = el("b"), sp = el("span"); b.textContent = String(a[0]); sp.textContent = a[1]; t.appendChild(b); t.appendChild(sp); sx.appendChild(t);
    });
    var hm = $("pfHeat"); hm.textContent = "";
    var now = Date.now(), dow = (new Date(now).getDay() + 6) % 7, start = dayShift(now, -(11 * 7 + dow)), todayK = dayKey(now);
    for (var i = 0; i < 84; i++) {
      var ts = dayShift(start, i), k = dayKey(ts), c = el("i"), v = settings.act[k];
      if (ts > now + 43200000) { c.style.visibility = "hidden"; }
      else if (v != null) c.className = v >= 500 ? "l4" : v >= 200 ? "l3" : v >= 50 ? "l2" : "l1";
      if (k === todayK) c.classList.add("today");
      c.title = k + (v != null ? " · " + v + " palabras" : "");
      hm.appendChild(c);
    }
    $("pfBest").textContent = w.cur > 0 ? (w.cur === 1 ? "Escribiste hoy o ayer: sumá otro día para armar una racha." : "Llevás " + w.cur + " días seguidos escribiendo. ¡Seguí así!") : "Escribí algo hoy para empezar una racha.";
    renderAch();
    var ev = [], hb = $("pfHist"); hb.textContent = "";
    ACH.forEach(function (a) { if (settings.ach[a.id]) ev.push({ t: settings.ach[a.id], x: "★ Logro: " + a.n }); });
    (settings.focusLog || []).forEach(function (f) { ev.push({ t: f.t, x: "⏱ Sesión de enfoque: " + f.m + " min · " + f.w + " palabras" }); });
    ev.sort(function (a, b) { return b.t - a.t; }).slice(0, 10).forEach(function (e) {
      var li = el("li"), tm = el("time"), sp = el("span"); tm.textContent = new Date(e.t).toLocaleDateString("es", { day: "numeric", month: "short" }).replace(/\./g, ""); sp.textContent = e.x; li.appendChild(tm); li.appendChild(sp); hb.appendChild(li);
    });
    if (!ev.length) { var l0 = el("li"); l0.textContent = "Todavía no hay actividad para mostrar."; hb.appendChild(l0); }
  }
  setTimeout(statsBoot, 0);
  function universeStats() {
    var total = 0, lists = 0, first = 0, tg = {};
    notes.forEach(function (n) {
      if (n.trashedAt) return;
      total++; if (n.type === "list") lists++;
      if (!first || n.createdAt < first) first = n.createdAt;
      n.tags.forEach(function (t) { tg[t] = 1; });
    });
    var m = window.TronxMap ? window.TronxMap.exportData() : { links: [], groups: [] };
    return { notes: total, lists: lists, tags: Object.keys(tg).length, groups: m.groups.length, links: m.links.length, first: first };
  }
  function pfShow(t) {
    document.querySelectorAll("#pfSeg button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.pt === t ? "true" : "false"); });
    $("pfSum").hidden = t !== "sum"; $("pfAchP").hidden = t !== "ach"; $("pfActP").hidden = t !== "act";
    $("profile").querySelector(".pfpage").scrollTop = 0;
  }
  function compactN(n) { return n >= 10000 ? (Math.round(n / 100) / 10).toLocaleString("es") + "k" : n.toLocaleString("es"); }
  function renderProfile() {
    var p = getProfile(), st = universeStats(), w = writeStats(), lv = maxLevel();
    paintAvatar($("pfAv"), p); frApply($("pfAv").parentNode, $("pfAv"), frEq(), 132);
    $("pfBan").style.background = PF_COVERS[p.cover];
    $("pfNameOut").textContent = p.name || "Explorador"; mxPinTag($("pfNameOut"), 22); $("pfBioOut").textContent = p.bio;
    $("pfLvl").textContent = "⭐ " + lv.title + " · Nivel " + lv.L;
    var lc = $("pfLvCard"); lc.textContent = "";
    var lce = el("div", "pf-lve"); lce.innerHTML = emblemSvg(lv.rank.i, lv.L, 84, false); lc.appendChild(lce);
    var lcb = el("div", "pf-lvb"), lcr = el("span", "pf-lvr"), lct = el("strong"), lcn = el("small"), lcbar = el("div", "pf-lvbar"), lci = el("i"), lcx = el("div", "pf-lvx");
    lcr.textContent = "Rango " + lv.rank.name; lct.textContent = lv.title; lcn.textContent = "Nivel " + lv.L + " de " + MX_MAXL;
    lci.style.width = lv.pct + "%"; lcbar.appendChild(lci);
    lcx.textContent = lv.max ? "Llegaste al rango final" : "Faltan " + fmtMx(lv.left) + " XP para el nivel " + (lv.L + 1);
    lcb.appendChild(lcr); lcb.appendChild(lct); lcb.appendChild(lcn); lcb.appendChild(lcbar); lcb.appendChild(lcx); lc.appendChild(lcb);
    var sx = $("pfStats"); sx.textContent = "";
    [[st.notes, "Notas"], [st.lists, "Listas"], [compactN(w.total), "Palabras"], [w.cur, "Racha"], [st.groups, "Constelaciones"], [st.links, "Vínculos"]].forEach(function (a) {
      var t = el("div", "pf-stat"), b = el("b"), sp = el("span"); b.textContent = String(a[0]); sp.textContent = a[1]; t.appendChild(b); t.appendChild(sp); sx.appendChild(t);
    });
    renderWriting();
    var strip = $("pfStrip"); strip.textContent = "";
    var got = ACH.filter(function (a) { return settings.ach[a.id]; }).sort(function (x, y) { return settings.ach[y.id] - settings.ach[x.id]; }).slice(0, 4);
    var as = achState();
    var next = ACH.filter(function (a) { return !settings.ach[a.id]; }).sort(function (x, y) { return Math.min(1, y.g(as) / y.t) - Math.min(1, x.g(as) / x.t); }).slice(0, 2);
    got.concat(next).forEach(function (a) {
      var m = el("div", "pf-mini"), n = el("div"); n.textContent = a.n; m.appendChild(medal(a, !!settings.ach[a.id])); m.appendChild(n); strip.appendChild(m);
    });
    var sc = $("pfSince");
    sc.textContent = st.first ? "Explorando tu universo desde el " + new Date(st.first).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "Tu universo está por empezar.";
  }
  function renderPfEditor() {
    var p = getProfile();
    paintAvatar($("pfPv"), p);
    document.querySelectorAll("#pfMode button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.m === p.mode ? "true" : "false"); });
    $("pfPhotoAct").hidden = p.mode !== "p"; $("pfEmoBox").hidden = p.mode !== "e";
    var sw = $("pfSw"); sw.textContent = "";
    PF_COLORS.forEach(function (c, i) {
      var b = el("button"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Color " + (i + 1)); b.setAttribute("aria-pressed", i === p.color ? "true" : "false");
      b.addEventListener("click", function () { setProfile({ color: i }); renderPfEditor(); renderProfile(); renderMenu(); }); sw.appendChild(b);
    });
    var cv = $("pfCov"); cv.textContent = "";
    PF_COVERS.forEach(function (c, i) {
      var b = el("button"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Portada " + (i + 1)); b.setAttribute("aria-pressed", i === p.cover ? "true" : "false");
      b.addEventListener("click", function () { setProfile({ cover: i }); renderPfEditor(); renderProfile(); }); cv.appendChild(b);
    });
    var em = $("pfEmo"); em.textContent = "";
    PF_EMOJIS.forEach(function (e) {
      var b = el("button"); b.type = "button"; b.textContent = e; b.setAttribute("aria-label", "Emoji " + e); b.setAttribute("aria-pressed", p.mode === "e" && p.emoji === "e:" + e ? "true" : "false");
      b.addEventListener("click", function () { setProfile({ avatar: "e:" + e }); renderPfEditor(); renderProfile(); renderMenu(); }); em.appendChild(b);
    });
    if ($("pfName") !== document.activeElement) $("pfName").value = p.name;
    if ($("pfBioIn") !== document.activeElement) $("pfBioIn").value = p.bio;
  }
  var pfCr = null, PFV = 320;
  function pfCrDraw(cv, V, px) {
    var c = pfCr; if (!c) return; var ctx = cv.getContext("2d"), k = px / V, rw = c.rot % 2 ? c.img.naturalHeight : c.img.naturalWidth, rh = c.rot % 2 ? c.img.naturalWidth : c.img.naturalHeight;
    var sc = V / Math.min(rw, rh) * c.zoom;
    ctx.clearRect(0, 0, px, px); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, px, px);
    ctx.save(); ctx.translate(px / 2 + c.ox * k, px / 2 + c.oy * k); ctx.rotate(c.rot * Math.PI / 2); ctx.scale(sc * k, sc * k);
    ctx.drawImage(c.img, -c.img.naturalWidth / 2, -c.img.naturalHeight / 2); ctx.restore();
  }
  function pfCrClamp() {
    var c = pfCr, V = $("pfCrVp").clientWidth || 280, rw = c.rot % 2 ? c.img.naturalHeight : c.img.naturalWidth, rh = c.rot % 2 ? c.img.naturalWidth : c.img.naturalHeight, sc = V / Math.min(rw, rh) * c.zoom;
    var mx = Math.max(0, (rw * sc - V) / 2), my = Math.max(0, (rh * sc - V) / 2);
    c.ox = Math.max(-mx, Math.min(mx, c.ox)); c.oy = Math.max(-my, Math.min(my, c.oy));
  }
  function pfCrPaint() {
    var cv = $("pfCrCv"), V = $("pfCrVp").clientWidth || 280, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.round(V * dpr);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    pfCrClamp(); pfCrDraw(cv, V, px);
  }
  function pfCrFree() { if (pfCr && pfCr.url) { try { URL.revokeObjectURL(pfCr.url); } catch (e) { } } pfCr = null; }
  layerHandlers.pfcrop = function () { $("pfCrop").hidden = true; pfCrFree(); };
  function pfLoadPhoto(file) {
    if (!file) return;
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      pfCrFree(); pfCr = { img: img, url: url, rot: 0, zoom: 1, ox: 0, oy: 0 };
      $("pfCrZoom").value = "1"; $("pfCrop").hidden = false; pushLayer("pfcrop");
      requestAnimationFrame(pfCrPaint);
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast("No se pudo leer esa imagen"); };
    img.src = url;
  }
  (function () {
    var vp = $("pfCrVp"), pts = {}, last = null;
    function cnt() { return Object.keys(pts).length; }
    vp.addEventListener("pointerdown", function (e) { if (!pfCr) return; try { vp.setPointerCapture(e.pointerId); } catch (x) { } pts[e.pointerId] = { x: e.clientX, y: e.clientY }; last = null; });
    vp.addEventListener("pointermove", function (e) {
      if (!pfCr || !pts[e.pointerId]) return; var n = cnt(), o = pts[e.pointerId];
      if (n === 1) { pfCr.ox += e.clientX - o.x; pfCr.oy += e.clientY - o.y; pts[e.pointerId] = { x: e.clientX, y: e.clientY }; }
      else if (n === 2) {
        pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ks = Object.keys(pts), a = pts[ks[0]], b = pts[ks[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (last) { pfCr.zoom = Math.max(1, Math.min(4, pfCr.zoom * d / last)); $("pfCrZoom").value = String(pfCr.zoom); } last = d;
      }
      pfCrPaint();
    });
    function up(e) { delete pts[e.pointerId]; last = null; }
    vp.addEventListener("pointerup", up); vp.addEventListener("pointercancel", up);
    vp.addEventListener("wheel", function (e) { if (!pfCr) return; e.preventDefault(); pfCr.zoom = Math.max(1, Math.min(4, pfCr.zoom * (e.deltaY < 0 ? 1.08 : 0.93))); $("pfCrZoom").value = String(pfCr.zoom); pfCrPaint(); }, { passive: false });
    $("pfCrZoom").addEventListener("input", function () { if (!pfCr) return; pfCr.zoom = parseFloat($("pfCrZoom").value) || 1; pfCrPaint(); });
    $("pfCrRot").addEventListener("click", function () { if (!pfCr) return; pfCr.rot = (pfCr.rot + 1) % 4; pfCr.ox = pfCr.oy = 0; pfCrPaint(); });
    $("pfCrReset").addEventListener("click", function () { if (!pfCr) return; pfCr.rot = 0; pfCr.zoom = 1; pfCr.ox = pfCr.oy = 0; $("pfCrZoom").value = "1"; pfCrPaint(); });
    $("pfCrSoon").addEventListener("click", function () { toast("Próximamente: más herramientas para tu foto"); });
    $("pfCrCancel").addEventListener("click", function () { closeLayer("pfcrop"); });
    $("pfCrop").addEventListener("click", function (e) { if (e.target === $("pfCrop")) closeLayer("pfcrop"); });
    $("pfCrOk").addEventListener("click", function () {
      if (!pfCr) return; pfCrClamp(); var V = $("pfCrVp").clientWidth || 280, out = document.createElement("canvas"); out.width = out.height = PFV;
      pfCrDraw(out, V, PFV); var data = out.toDataURL("image/jpeg", 0.88);
      setProfile({ photo: data, avatar: "p" }); closeLayer("pfcrop"); renderPfEditor(); renderProfile(); renderMenu();
    });
  })();
  function openPfEditor() { renderPfEditor(); $("pfEditor").hidden = false; pushLayer("pfedit"); }
  $("profileClose").addEventListener("click", function () { closeLayer("profile"); });
  $("pfEdit").addEventListener("click", openPfEditor); $("pfEditTop").addEventListener("click", openPfEditor);
  $("pfEdDone").addEventListener("click", function () { closeLayer("pfedit"); });
  $("pfEditor").addEventListener("click", function (e) { if (e.target === $("pfEditor")) closeLayer("pfedit"); });
  $("pfSeg").addEventListener("click", function (e) { var b = e.target.closest("button[data-pt]"); if (b) pfShow(b.dataset.pt); });
  $("pfSeeAll").addEventListener("click", function () { pfCat = "Todos"; renderAch(); pfShow("ach"); });
  $("pfMode").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-m]"); if (!b) return; var m = b.dataset.m, p = getProfile();
    if (m === "p") { if (p.photo) { setProfile({ avatar: "p" }); renderPfEditor(); renderProfile(); renderMenu(); } else $("pfFile").click(); }
    else if (m === "e") { setProfile({ avatar: p.emoji || "e:" + PF_EMOJIS[0] }); renderPfEditor(); renderProfile(); renderMenu(); }
    else { setProfile({ avatar: "i" }); renderPfEditor(); renderProfile(); renderMenu(); }
  });
  $("pfPhotoChg").addEventListener("click", function () { $("pfFile").click(); });
  $("pfPhotoDel").addEventListener("click", function () { setProfile({ photo: "", avatar: "i" }); renderPfEditor(); renderProfile(); renderMenu(); });
  $("pfFile").addEventListener("change", function () { var f = $("pfFile").files && $("pfFile").files[0]; $("pfFile").value = ""; pfLoadPhoto(f); });
  $("pfName").addEventListener("input", function () { setProfile({ name: $("pfName").value }); paintAvatar($("pfPv"), getProfile()); renderProfile(); renderMenu(); });
  $("pfBioIn").addEventListener("input", function () { setProfile({ bio: $("pfBioIn").value }); renderProfile(); });

