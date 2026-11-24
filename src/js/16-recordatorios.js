  /* ---------- recordatorios ---------- */
  var REMDT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  var PERIOD = { day: 86400000, week: 604800000 };
  var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  function occurrences(r, count) {
    var out = [], now = Date.now(), d0 = new Date(r.at), hh = d0.getHours(), mm = d0.getMinutes();
    if (r.rep === "month") {
      for (var k = 0; k < 400 && out.length < count; k++) {
        var f = new Date(d0.getFullYear(), d0.getMonth() + k, 1, hh, mm), dim = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
        f.setDate(Math.min(d0.getDate(), dim)); var t = f.getTime(); if (t > now && t >= r.at) out.push(t);
      }
    } else if (r.rep === "days") {
      var s = new Date(Math.max(r.at, now)); s.setHours(0, 0, 0, 0);
      for (var j = 0; j < 800 && out.length < count; j++) {
        var dd = new Date(s.getFullYear(), s.getMonth(), s.getDate() + j, hh, mm), tt = dd.getTime();
        if (r.wd.indexOf(dd.getDay()) >= 0 && tt > now && tt >= r.at) out.push(tt);
      }
    }
    return out;
  }
  function nextAt(r) {
    if (r.rep === "month" || r.rep === "days") { var o = occurrences(r, 1); return o.length ? o[0] : r.at; }
    var t = r.at; if (r.rep && t <= Date.now()) { var k = Math.ceil((Date.now() - t) / PERIOD[r.rep]); t += k * PERIOD[r.rep]; if (t <= Date.now()) t += PERIOD[r.rep]; } return t; }
  function remText(r) { var t = nextAt(r); return (t < Date.now() ? "venció " : "") + REMDT.format(new Date(t)).replace(",", "") + (r.rep === "day" ? " · diario" : r.rep === "week" ? " · semanal" : r.rep === "month" ? " · mensual" : r.rep === "days" ? " · " + r.wd.map(function (d) { return DIAS[d]; }).join(", ") : ""); }
  function remsOf(n) { return n.remind ? [n.remind].concat(n.rems || []) : []; }
  function nidOf(id) { var h = 7; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return (Math.abs(h) % 2000000000) + 1; }
  function localInput(ts) { var d = new Date(ts), p2 = function (x) { return String(x).padStart(2, "0"); }; return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "T" + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
  var LN = null; function ln() { return LN || (LN = capPlugin("LocalNotifications")); }
  var remSigLast = "", remTimer = 0, REM_CH = "recordatorios", REM_ACT = "tronx-rem", chPromise = null, actPromise = null;
  /* botón "Posponer 10 min" en la notificación */
  function ensureActions(plug) {
    if (actPromise) return actPromise;
    actPromise = (plug.registerActionTypes ? plug.registerActionTypes({ types: [{ id: REM_ACT, actions: [{ id: "snooze", title: "Posponer 10 min" }] }] }) : Promise.resolve()).catch(function () {});
    return actPromise;
  }
  function snoozeNote(id) {
    var n = notes.get(id); if (!n || n.trashedAt) return false;
    if (!n.remind) n.remind = { at: Date.now(), rep: "", seen: true, snz: 0 };
    n.remind.snz = Date.now() + 10 * 60000; if (!n.remind.rep) n.remind.seen = true;
    changed(n); persistNow(); syncReminders(); toast("Pospuesto 10 minutos"); return true;
  }
  /* texto de la notificación: sin símbolos de formato, con el título de la nota y un resumen legible */
  function notifText(n) {
    if (n.lock) return { title: "🔒 Nota protegida", body: "Tocá para abrirla", large: "Tocá para abrirla" };
    var title = n.title.trim(), lines;
    if (n.type === "list") lines = n.items.filter(function (i) { return i.t.trim(); }).map(function (i) { return itemInd(i) + (i.done ? "☑ " : "☐ ") + i.t + itemMeta(i).trim(); });
    else lines = n.body.split("\n").map(function (l) {
      return l.replace(/^\s*#{1,2}\s+/, "").replace(/^\s*>\s?/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|\s)\*([^*]+)\*/g, "$1$2").replace(/==(?:\{[a-z]+\})?(?=\S)(.+?)(?<=\S)==/g, "$1")
        .replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/^\s*\[[xX]\]\s*/, "☑ ").replace(/^\s*\[ \]\s*/, "☐ ").replace(/^\s*\|?\s*-{3,}.*$/, "").replace(/\s*\|\s*/g, " · ").replace(/^ · | · $/g, "").trim();
    }).filter(Boolean);
    if (!title) title = lines.length ? lines.shift().slice(0, 60) : "Recordatorio";
    else if (lines.length && lines[0].replace(/:$/, "") === title.replace(/:$/, "")) lines.shift();
    var body = lines.length ? lines[0].slice(0, 100) : (n.images.length ? "Nota con " + n.images.length + (n.images.length === 1 ? " imagen" : " imágenes") : "Tenés un recordatorio pendiente");
    var large = lines.join("\n").slice(0, 500) || body;
    return { title: title.replace(/:$/, "").slice(0, 80), body: body, large: large };
  }
  function ensureChannel(plug) {
    if (chPromise) return chPromise;
    chPromise = (plug.createChannel ? plug.createChannel({ id: REM_CH, name: "Recordatorios", description: "Avisos de las notas con recordatorio", importance: 4, visibility: 1, vibration: true, lights: true, lightColor: "#7c5cff" }) : Promise.resolve()).catch(function () {});
    return chPromise;
  }
  function syncReminders() {
    var plug = ln(); if (!plug) return;
    var want = [], sig = [];
    if (settings.dueAlert) notes.forEach(function (n) {
      if (n.trashedAt) return;
      var hh = +settings.dueAt.slice(0, 2), mm = +settings.dueAt.slice(3);
      (n.items || []).forEach(function (it) {
        if (!it.due || it.done || !String(it.t || "").trim()) return;
        var d0 = new Date(it.due);
        [[0, "Vence hoy"], [-1, "Vence mañana"]].forEach(function (pr) {
          if (pr[0] && !settings.dueEve) return;
          var at = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + pr[0], hh, mm, 0).getTime();
          if (at <= Date.now() + 5000) return;
          var ttl = n.lock ? "Nota protegida" : String(it.t).slice(0, 80), bd = n.lock ? pr[1] : pr[1] + " · " + (n.title || "Sin título").slice(0, 60);
          var o = { id: nidOf(n.id + "@" + it.id + (pr[0] ? "e" : "")), title: ttl, body: bd, largeBody: bd, summaryText: "Tarea con fecha · Tronx", channelId: REM_CH, smallIcon: "ic_stat_tronx", iconColor: "#7c5cff", autoCancel: true, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { noteId: n.id } };
          want.push(o); sig.push(o.id + ":" + at + ":" + ttl + ":" + bd);
        });
      });
    });
    if (settings.streakAlert && settings.wTot > 0) {
      var sk = streakInfo(), sh = +settings.streakAt.slice(0, 2), sm = +settings.streakAt.slice(3), nw = new Date(), wroteToday = settings.act[dayKey(Date.now())] != null;
      for (var di = 0; di < 7; di++) {
        if (di === 0 && wroteToday) continue;
        var sat = new Date(nw.getFullYear(), nw.getMonth(), nw.getDate() + di, sh, sm, 0).getTime(); if (sat <= Date.now() + 5000) continue;
        var st1 = di === 0 && sk.cur > 0 ? "🔥 Tu racha de " + sk.cur + (sk.cur === 1 ? " día" : " días") + " está en juego" : "🔥 Mantené tu racha";
        var sb1 = di === 0 ? "Todavía no escribiste hoy. Unas pocas palabras alcanzan." : "Escribí unas palabras hoy para sumar un día más.";
        var so = { id: nidOf("streak" + di), title: st1, body: sb1, largeBody: sb1, summaryText: "Racha · Tronx", channelId: REM_CH, smallIcon: "ic_stat_tronx", iconColor: "#7c5cff", autoCancel: true, schedule: { at: new Date(sat), allowWhileIdle: true } };
        want.push(so); sig.push(so.id + ":" + sat + ":" + st1);
      }
    }
    notes.forEach(function (n) {
      if (!n.remind || n.trashedAt) return;
      var tx0 = notifText(n);
      function mk(id, t, extra, sched) { return { id: id, title: tx0.title, body: tx0.body, largeBody: tx0.large, summaryText: extra || "Recordatorio de Tronx", channelId: REM_CH, smallIcon: "ic_stat_tronx", iconColor: "#7c5cff", autoCancel: true, actionTypeId: REM_ACT, extra: { noteId: n.id, snoozed: extra === "Pospuesto · Tronx" }, schedule: sched || { at: new Date(t), allowWhileIdle: true } }; }
      remsOf(n).forEach(function (r, ri) {
        if (ri === 0 && r.snz && r.snz > Date.now()) {
          var z = mk(nidOf(n.id + "z"), r.snz, "Pospuesto · Tronx"); want.push(z); sig.push(z.id + ":" + r.snz + ":" + tx0.title + ":" + tx0.large);
        }
        if (!r.rep && r.at <= Date.now()) return;
        if (r.rep === "month" || r.rep === "days") {
          occurrences(r, r.rep === "month" ? 6 : 14).forEach(function (t, j) { var o = mk(nidOf(n.id + "#" + ri + "." + j), t); want.push(o); sig.push(o.id + ":" + t + ":" + tx0.title + ":" + tx0.large); });
          return;
        }
        var at = nextAt(r), o2 = mk(ri ? nidOf(n.id + "#" + ri) : nidOf(n.id), at, null, r.rep ? { at: new Date(r.at > Date.now() ? r.at : at), every: r.rep, allowWhileIdle: true } : { at: new Date(at), allowWhileIdle: true });
        want.push(o2); sig.push(o2.id + ":" + at + ":" + r.rep + ":" + tx0.title + ":" + tx0.large);
      });
    });
    sig = sig.sort().join("|");
    if (sig === remSigLast) return; remSigLast = sig;
    plug.getPending().then(function (res) {
      var keep = {}; want.forEach(function (o) { keep[o.id] = 1; });
      var drop = ((res && res.notifications) || []).filter(function (x) { return !keep[x.id]; }).map(function (x) { return { id: x.id }; });
      return (drop.length ? plug.cancel({ notifications: drop }) : Promise.resolve()).then(function () {
        if (!want.length) return;
        return Promise.all([ensureChannel(plug), ensureActions(plug)]).then(function () { return plug.cancel({ notifications: want.map(function (o) { return { id: o.id }; }) }); }).then(function () { return plug.schedule({ notifications: want }); });
      });
    }).catch(function () { remSigLast = ""; });
  }
  function syncSoon() { clearTimeout(remTimer); remTimer = setTimeout(syncReminders, 1200); }
  function remPermission() {
    var plug = ln(); if (!plug) return Promise.resolve("web");
    return plug.checkPermissions().then(function (p) {
      if (p.display === "granted") return "granted";
      return plug.requestPermissions().then(function (q) { return q.display === "granted" ? "granted" : "denied"; });
    }).catch(function () { return "denied"; });
  }
  /* estado real del permiso, para ver por qué no llegan los avisos */
  function permStatus() {
    var plug = ln();
    if (!plug) return Promise.resolve({ st: "web", txt: "Estás usando Tronx fuera de la app de Android: los avisos con la app cerrada no están disponibles." });
    return plug.checkPermissions().then(function (p) {
      var d = p && p.display;
      if (d === "granted") return { st: "granted", txt: "Notificaciones: permitidas." };
      if (d === "denied") return { st: "denied", txt: "Notificaciones: bloqueadas. Abrí los ajustes de Android > Aplicaciones > Tronx > Notificaciones y activalas." };
      return { st: "prompt", txt: "Notificaciones: todavía no autorizadas (" + d + "). Tocá \"Permitir notificaciones\"." };
    }).catch(function (e) {
      return { st: "error", txt: "El componente de avisos no responde (" + String((e && (e.message || e.code)) || e).slice(0, 80) + "). Probablemente esta versión se compiló sin el plugin de notificaciones." };
    });
  }
  function renderPerm() {
    permStatus().then(function (r) { $("remPerm").textContent = r.txt; $("remPermBtn").hidden = r.st === "granted" || r.st === "web" || r.st === "error"; });
  }
  $("remPermBtn").addEventListener("click", function () {
    var plug = ln(); if (!plug) return;
    plug.requestPermissions().then(function (q) {
      toast(q.display === "granted" ? "Notificaciones permitidas" : "Android respondió: " + q.display);
      renderPerm();
    }).catch(function (e) { toast("No se pudo pedir el permiso: " + String((e && e.message) || e).slice(0, 60)); renderPerm(); });
  });
  function renderRem() {
    var n = cur(); if (!n) return;
    var r = n.remind;
    $("remOff").hidden = !r; $("remSet").textContent = r ? "Cambiar aviso" : "Programar aviso";
    $("remAt").value = r ? localInput(nextAt(r)) : ""; $("remRep").value = r ? r.rep : "";
    buildDays(r && r.rep === "days" ? r.wd : []); $("remDays").hidden = $("remRep").value !== "days";
    $("remAdd").hidden = !r || n.rems.length >= 4;
    var rl = $("remList"); rl.textContent = "";
    n.rems.forEach(function (x, i) {
      var row = el("div", "rrow"), sp = el("span"); sp.textContent = "⏰ " + remText(x); row.appendChild(sp);
      var rb = el("button", "btn small danger"); rb.type = "button"; rb.textContent = "Quitar"; rb.setAttribute("aria-label", "Quitar este aviso");
      rb.addEventListener("click", function () { n.rems.splice(i, 1); changed(n); renderRem(); syncReminders(); }); row.appendChild(rb); rl.appendChild(row);
    });
    $("remHint").textContent = r ? "Aviso: " + remText(r) + "." : (ln() ? "Tronx te avisa con una notificación aunque la app esté cerrada." : "Los avisos con la app cerrada funcionan solo en la app de Android. Acá solo se muestra un aviso si la app está abierta.");
    renderPerm();
    var q = $("remQuick"); if (!q.firstChild) {
      [["En 1 hora", function () { return Date.now() + 3600000; }], ["Esta noche 21:00", function () { var d = new Date(); d.setHours(21, 0, 0, 0); if (d <= Date.now()) d.setDate(d.getDate() + 1); return d.getTime(); }],
       ["Mañana 9:00", function () { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.getTime(); }],
       ["Lunes 9:00", function () { var d = new Date(); d.setHours(9, 0, 0, 0); do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 1); return d.getTime(); }]].forEach(function (x) {
        var c = el("button", "chip"); c.type = "button"; c.textContent = x[0]; c.addEventListener("click", function () { $("remAt").value = localInput(x[1]()); }); q.appendChild(c);
      });
    }
  }
  function buildDays(sel) {
    var box = $("remDays"); box.textContent = "";
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var b = el("button"); b.type = "button"; b.dataset.d = d; b.textContent = DIAS[d].slice(0, 3); b.setAttribute("aria-pressed", sel.indexOf(d) >= 0 ? "true" : "false"); b.setAttribute("aria-label", ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][d]);
      b.addEventListener("click", function () { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); }); box.appendChild(b);
    });
  }
  $("remRep").addEventListener("change", function () {
    var on = $("remRep").value === "days"; $("remDays").hidden = !on;
    if (on && !$("remDays").querySelector('[aria-pressed="true"]')) { var d = new Date($("remAt").value || Date.now()).getDay(); var bt = $("remDays").querySelector('[data-d="' + d + '"]'); bt && bt.setAttribute("aria-pressed", "true"); }
  });
  function readRemForm() {
    var v = $("remAt").value, t = v ? new Date(v).getTime() : NaN;
    if (!isFinite(t)) { toast("Elegí una fecha y hora"); return null; }
    var rep = $("remRep").value, wd = [];
    if (rep === "days") {
      $("remDays").querySelectorAll('[aria-pressed="true"]').forEach(function (b) { wd.push(Number(b.dataset.d)); });
      if (!wd.length) { toast("Elegí al menos un día"); return null; }
    }
    if (!rep && t <= Date.now()) { toast("Esa hora ya pasó"); return null; }
    return { at: t, rep: rep, wd: wd.sort(), seen: false, snz: 0 };
  }
  $("remAdd").addEventListener("click", function () {
    var n = cur(); if (!n || n.trashedAt || !n.remind) return;
    if (n.rems.length >= 4) { toast("Hasta 5 avisos por nota"); return; }
    var r = readRemForm(); if (!r) return;
    remPermission().then(function (st) {
      n.rems.push(cleanRemind(r)); changed(n); renderRem(); syncReminders();
      toast(st === "denied" ? "Activá las notificaciones de Tronx en los ajustes de Android" : "Aviso agregado");
    });
  });
  $("remSet").addEventListener("click", function () {
    var n = cur(); if (!n || n.trashedAt) return;
    var f = readRemForm(); if (!f) return;
    remPermission().then(function (st) {
      if (st === "denied") { toast("Activá las notificaciones de Tronx en los ajustes de Android para recibir avisos"); }
      n.remind = cleanRemind(f); changed(n); renderRem(); syncReminders();
      if (st === "granted" && ln() && ln().checkExactNotificationSetting) {
        ln().checkExactNotificationSetting().then(function (e) {
          if (e && e.exact_alarm === "denied") toast("Para que suene a la hora exacta, permití \"Alarmas y recordatorios\"", "Permitir", function () { ln().changeExactNotificationSetting().catch(function () {}); });
          else toast("Aviso programado");
        }).catch(function () { toast("Aviso programado"); });
      } else if (st !== "denied") toast(st === "web" ? "Aviso guardado (suena solo con la app abierta)" : "Aviso programado");
    });
  });
  $("remOff").addEventListener("click", function () {
    var n = cur(); if (!n) return;
    if (n.rems.length) { n.remind = n.rems.shift(); toast("Aviso quitado. El siguiente pasó a ser el principal"); } else { n.remind = null; toast("Aviso quitado"); }
    changed(n); renderRem(); syncReminders();
  });
  /* avisos con la app abierta (y los que vencieron mientras estaba cerrada) */
  function checkDue() {
    var fired = 0;
    notes.forEach(function (n) {
      var rz = n.remind;
      if (rz && rz.snz && rz.snz <= Date.now() && !n.trashedAt) { rz.snz = 0; fired++; schedulePersist(); toast("⏰ " + (n.title.trim() || "Recordatorio"), "Abrir", function () { openNote(n.id); }); return; }
      var hit = false;
      remsOf(n).forEach(function (r) { if (!r || r.rep || r.seen || n.trashedAt || r.at > Date.now()) return; r.seen = true; hit = true; });
      if (!hit) return;
      fired++; schedulePersist();
      toast("⏰ " + (n.title.trim() || "Recordatorio"), "Abrir", function () { openNote(n.id); });
    });
    if (fired) renderListSoon();
  }
  setInterval(checkDue, 30000); setTimeout(checkDue, 1500);
  if (ln()) {
    try { ln().addListener("localNotificationActionPerformed", function (ev) {
      if (ev && ev.notification && ev.notification.extra && ev.notification.extra.quick) { createNote("text"); return; }
      var id = ev && ev.notification && ev.notification.extra && ev.notification.extra.noteId, n = id && notes.get(id);
      if (n && !n.trashedAt && ev.actionId === "snooze") { snoozeNote(id); return; }
      if (n && !n.trashedAt) { remsOf(n).forEach(function (r) { if (!r.rep && r.at <= Date.now() + 60000) r.seen = true; }); if (n.remind && n.remind.snz && n.remind.snz <= Date.now() + 60000) { n.remind.snz = 0; changed(n); } openNote(id); }
    }); } catch {}
  }
  setTimeout(syncReminders, 2500);

