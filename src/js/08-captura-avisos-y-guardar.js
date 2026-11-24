  /* ---------- captura rápida: dictado por voz y texto compartido desde otras apps ---------- */
  function dictate() {
    var sr = capPlugin("SpeechRecognition"), n = cur();
    if (!sr || !n || n.type !== "text" || n.trashedAt) return;
    Promise.resolve(sr.available ? sr.available() : { available: true }).then(function (a) {
      if (a && a.available === false) throw "na";
      return sr.requestPermissions ? sr.requestPermissions() : null;
    }).then(function (p) {
      if (p && p.speechRecognition === "denied") throw "den";
      return sr.start({ language: "es-AR", maxResults: 1, prompt: "Hablá para dictar tu nota", popup: true, partialResults: false });
    }).then(function (r) {
      var t = r && r.matches && r.matches[0] ? String(r.matches[0]).trim() : "";
      if (!t) { toast("No se entendió, probá de nuevo"); return; }
      if (cur() !== n || readMode) return;
      var pos = bodyEl.selectionStart, before = bodyEl.value.slice(0, pos).trimEnd();
      if (!before || /[.!?\n]$/.test(before)) t = t.charAt(0).toUpperCase() + t.slice(1);
      insertAtCaret(t + " "); bodyEl.dispatchEvent(new Event("input", { bubbles: true }));
    }).catch(function (e) { toast(e === "den" ? "Falta el permiso del micrófono. Activalo en los ajustes del teléfono" : "El dictado no está disponible en este teléfono"); });
  }
  function dictRefresh() { var b = $("dictBtn"); if (b) b.hidden = !capPlugin("SpeechRecognition"); }
  var sharedSeen = {};
  function sharedTitle(t, sub) {
    sub = String(sub || "").trim(); if (sub) return sub.slice(0, 80);
    t = String(t || "").trim();
    if (/^https?:\/\/\S+$/i.test(t)) { try { return new URL(t).hostname.replace(/^www\./, ""); } catch { /* sin título */ } }
    return t.split("\n")[0].slice(0, 60);
  }
  function processShared() {
    var q = window.__tronxShared; if (!q || !q.length) return;
    window.__tronxShared = [];
    q.forEach(function (it) {
      if (!it || !String(it.t || "").trim()) return;
      var id = String(it.id || it.t); if (sharedSeen[id]) return; sharedSeen[id] = 1;
      var now = Date.now(), text = String(it.t).slice(0, 200000), title = sharedTitle(text, it.s);
      var n = normalize({ id: uid(), type: "text", title: title, body: text, items: [], parent: "", folder: "", tags: ["compartido"], createdAt: now, updatedAt: now });
      notes.set(n.id, n); persistNow(); renderAll();
      toast("Guardado en Tronx: " + (title || "nota nueva"), "Abrir", function () { openNote(n.id); });
    });
  }
  window.addEventListener("tronxshare", processShared);
  setTimeout(function () { processShared(); dictRefresh(); }, 900);
  $("fmt").addEventListener("mousedown", function (e) { e.preventDefault(); });
  $("fmt").addEventListener("click", function (e) {
    var b = e.target.closest("button"), n = cur();
    if (!b || !n || n.trashedAt || n.type !== "text") return;
    var now = new Date(), k = b.dataset.ins;
    if (k === "read") { setReading(!readMode); return; }
    if (readMode) return;
    if (k === "image") { $("imgFile").click(); return; }
    if (k === "photo") { $("imgCam").click(); return; }
    if (k === "draw") { openDraw(); return; }
    if (k === "dictate") { dictate(); return; }
    if (k === "sticker") { openStkMgr("note"); return; }
    if (k === "find") { findOpen($("findBar").hidden); return; }
    if (k === "hl") { var hr = $("hlRow"); if (hr.hidden) findOpen(false); hr.hidden = !hr.hidden; b.setAttribute("aria-pressed", hr.hidden ? "false" : "true"); fitBody(); return; }
    if (k === "undo") { bodyEl.focus(); histGo(-1); return; }
    if (k === "redo") { bodyEl.focus(); histGo(1); return; }
    histNow();
    bodyEl.focus();
    if (k === "bullet") togglePrefix("• ");
    else if (k === "num") togglePrefix("1. ");
    else if (k === "check") togglePrefix("[ ] ");
    else if (k === "quote") togglePrefix("> ");
    else if (k === "head") cycleHead();
    else if (k === "bold") wrapSel("**");
    else if (k === "italic") wrapSel("*");
    else if (k === "image" || k === "photo" || k === "draw" || k === "sticker" || k === "dictate") return;
    else if (k === "link") insertLink();
    else if (k === "table") insertTable();
    else if (k === "tblrow") tableGrow(false);
    else if (k === "tblcol") tableGrow(true);
    else if (k === "code") { var cs = bodyEl.selectionStart, ce = bodyEl.selectionEnd; if (bodyEl.value.slice(cs, ce).indexOf("\n") >= 0) bodyEl.setRangeText("```\n" + bodyEl.value.slice(cs, ce) + "\n```", cs, ce, "end"); else wrapSel("`"); }
    else if (k === "strike") wrapSel("~~");
    else if (k === "date") insertAtCaret(dlong.format(now));
    else if (k === "time") insertAtCaret(tf.format(now));
    else return;
    fireInput(); histNow();
  });

  // La barra de formato avisa si hay más herramientas a los lados y marca el formato de la línea donde estás.
  (function () {
    var fm = $("fmt");
    function edges() { var l = fm.scrollLeft > 4, r = fm.scrollLeft + fm.clientWidth < fm.scrollWidth - 4; fm.classList.toggle("sl", l); fm.classList.toggle("sr", r); }
    fm.addEventListener("scroll", edges, { passive: true }); window.addEventListener("resize", edges);
    new MutationObserver(function () { setTimeout(edges, 0); }).observe(fm, { attributes: true, attributeFilter: ["hidden", "class"] });
    setTimeout(edges, 300);
    var FM = { bullet: /^• /, num: /^\d+[.)] /, check: /^\[[ xX]\] /, quote: /^> /, head: /^#{1,2} / };
    function state() {
      try {
        var n = cur(); if (!n || n.type !== "text" || readMode || fm.hidden) return;
        var b = lineBounds(), line = bodyEl.value.slice(b.ls, b.le);
        Object.keys(FM).forEach(function (k) { var btn = fm.querySelector('[data-ins="' + k + '"]'); if (btn) btn.setAttribute("aria-pressed", FM[k].test(line) ? "true" : "false"); });
        edges();
      } catch (e) { }
    }
    ["input", "keyup", "click", "focus"].forEach(function (ev) { bodyEl.addEventListener(ev, state); });
    document.addEventListener("selectionchange", function () { if (document.activeElement === bodyEl) state(); });
  })();
  // Enter continúa la viñeta, la casilla o la numeración; Enter en una línea vacía sale de la lista.
  function nextMarker(m) {
    var num = m.match(/^(\d+)([.)])$/);
    if (num) return (Number(num[1]) + 1) + num[2];
    if (/^\[[xX]\]$/.test(m)) return "[ ]";
    return m;
  }
  bodyEl.addEventListener("beforeinput", function (ev) {
    if ((ev.inputType !== "insertLineBreak" && ev.inputType !== "insertParagraph") || !ev.cancelable) return;
    var n = cur(); if (!n || n.trashedAt || n.type !== "text") return;
    var v = bodyEl.value, s = bodyEl.selectionStart;
    if (s !== bodyEl.selectionEnd) return;
    var ls = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(ls, s);
    var le = v.indexOf("\n", s); if (le < 0) le = v.length;
    var full = v.slice(ls, le), tm = full.match(/^\s*\|(.*)\|\s*$/);
    if (tm) {
      var cells = tm[1].split("|");
      if (cells.every(function (c) { return /^\s*:?-{2,}:?\s*$/.test(c); })) return;
      ev.preventDefault();
      if (cells.every(function (c) { return !c.trim(); })) { bodyEl.setRangeText("", ls, le, "end"); }
      else { var row = "\n|" + new Array(cells.length + 1).join("  |"); bodyEl.setRangeText(row, le, le, "end"); bodyEl.setSelectionRange(le + 3, le + 3); }
      fireInput(); return;
    }
    var m = line.match(/^(\s*)(•|-|\*|\[[ xX]\]|\d+[.)])[ \t]+/);
    if (!m) return;
    ev.preventDefault();
    if (!line.slice(m[0].length).trim()) { bodyEl.setRangeText("", ls, s, "end"); }
    else { var ins = "\n" + m[1] + nextMarker(m[2]) + " "; bodyEl.setRangeText(ins, s, s, "end"); }
    fireInput();
  });

  function discardIfEmpty() {
    var n = cur();
    if (n && !n.trashedAt && isEmptyNote(n)) { notes.delete(n.id); persistNow(); }
  }
  /* notas protegidas: se desbloquean una vez por sesión de lectura */
  var unlocked = new Set();
  function openNote(id) {
    var n0 = notes.get(id);
    if (n0 && n0.lock && !unlocked.has(id)) { askNote(n0, function () { unlocked.add(id); openNoteRaw(id); }); return; }
    openNoteRaw(id);
  }
  function openNoteRaw(id) {
    if (id !== activeId) { commitVersion(); if (saveTimer) persistNow(); discardIfEmpty(); }
    activeId = id;
    setStatus("");
    renderEditor(); renderAll();
    $("app").dataset.view = "editor";
    pushLayer("editor");
    if (window.TronxMap) window.TronxMap.suspend();
  }
  function leaveEditorUI() {
    commitVersion(); if (saveTimer) persistNow(); discardIfEmpty();
    if (activeId) unlocked.delete(activeId);
    activeId = null; setStatus("");
    $("sheet").hidden = true; $("iconSheet").hidden = true; $("scrim").hidden = true;
    $("app").dataset.view = "list";
    renderEditor(); renderAll();
    if (window.TronxMap) window.TronxMap.resume();
    setTimeout(function () { if (typeof tryCelebrate === "function") tryCelebrate(); }, 500);
  }
  function createNote(type, opts) {
    opts = opts || {};
    commitVersion(); persistNow(); discardIfEmpty();
    tab = "notes"; query = ""; $("q").value = "";
    var now = Date.now();
    var n = normalize({
      id: uid(), type: type, title: opts.title || "", body: "",
      items: type === "list" ? [{ id: uid(), t: "", done: false }] : [],
      parent: opts.parent || "", folder: opts.folder || (folderFilter || ""),
      tags: tagFilter ? [tagFilter] : [], createdAt: now, updatedAt: now
    });
    notes.set(n.id, n);
    activeId = n.id;
    renderEditor(); renderAll();
    $("app").dataset.view = "editor";
    pushLayer("editor");
    if (window.TronxMap) window.TronxMap.suspend();
    schedulePersist();
    titleEl.focus();
  }

  /* ---------- avisos ---------- */
  var toastTimer = null;
  function hideToast() { $("toast").hidden = true; }
  function toast(msg, label, fn) {
    var t = $("toast"); t.textContent = "";
    var s = el("span"); s.textContent = msg; t.appendChild(s);
    if (label) {
      var b = el("button"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", function () { hideToast(); if (fn) fn(); });
      t.appendChild(b);
    }
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, label ? 5500 : 2800);
  }
  function armed(btn, run, armedText) {
    var original = btn.textContent, timer = null, on = false;
    btn.addEventListener("click", function () {
      if (!on) {
        on = true; btn.textContent = armedText;
        timer = setTimeout(function () { on = false; btn.textContent = original; }, 3200);
        return;
      }
      clearTimeout(timer); on = false; btn.textContent = original; run();
    });
  }

  /* ---------- icono de la nota ---------- */
  var iconKind = "stickers";
  function renderIconBtn() {
    var n = cur(), b = $("iconBtn"); b.textContent = "";
    if (!n) { b.classList.remove("has"); return; }
    var ic = iconSpan(n.icon);
    b.classList.toggle("has", !!ic);
    if (ic) b.appendChild(ic);
    else {
      var pl = el("span", "plus"); pl.textContent = "+"; b.appendChild(pl);
      var tx = el("span"); tx.textContent = "Icono"; b.appendChild(tx);
    }
    b.disabled = readOnly();
  }
  function setIcon(v, keep) {
    var n = cur(); if (!n || n.trashedAt) return;
    n.icon = cleanIcon(v);
    changed(n); persistNow(); renderIconBtn(); renderList();
    if (!keep) closeLayer("icons");
  }
  /* mantener pulsado: ficha de la insignia */
  function bindLongPress(b, fn) {
    var t = 0, sx = 0, sy = 0;
    b.addEventListener("pointerdown", function (e) {
      b.dataset.lp = ""; sx = e.clientX; sy = e.clientY; clearTimeout(t);
      t = setTimeout(function () { b.dataset.lp = "1"; try { if (navigator.vibrate) navigator.vibrate(14); } catch {} fn(); }, 420);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(t); }); });
    b.addEventListener("pointermove", function (e) { if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) clearTimeout(t); });
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  var detailId = "", stkIO = null, stkTimer = 0;
  function showDetail(st) {
    var inf = st.info || {};
    detailId = st.id;
    var art = $("dArt"); art.textContent = ""; art.appendChild(iconSpan("s:" + st.id));
    $("dTag").textContent = inf.t || "Insignia";
    $("dName").textContent = st.n;
    $("dText").textContent = inf.d || "";
    $("dAnim").textContent = inf.a || "—";
    $("dFact").textContent = inf.c || "—";
    $("dUse").hidden = !cur() || !!cur().trashedAt || $("iconSheet").hidden;
    $("detail").hidden = false; document.body.classList.add("dopen"); pushLayer("detail");
  }
  $("dClose").addEventListener("click", function () { closeLayer("detail"); });
  $("detail").addEventListener("click", function (e) { if (e.target === $("detail")) closeLayer("detail"); });
  $("dUse").addEventListener("click", function () {
    var id = detailId, i = layers.indexOf("icons");
    setIcon("s:" + id, true);
    if (i >= 0) closeTo(i); else closeLayer("detail");
  });
  function renderIconSheet() {
    var n = cur(); if (!n) return;
    $("iconSeg").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.k === iconKind ? "true" : "false"); });
    var body = $("iconBody"); body.textContent = "";
    if (iconKind === "stickers") {
      var g = el("div", "igrid stk");
      ((window.TronxStickers && window.TronxStickers.list) || []).forEach(function (st) {
        var b = el("button"); b.type = "button"; b.title = st.n; b.setAttribute("aria-label", st.n);
        b.setAttribute("aria-pressed", n.icon === "s:" + st.id ? "true" : "false");
        b.appendChild(iconSpan("s:" + st.id));
        var cap = el("span", "cap"); cap.textContent = st.n.split(" ")[0]; b.appendChild(cap);
        b.addEventListener("click", function () { if (b.dataset.lp === "1") { b.dataset.lp = ""; return; } setIcon("s:" + st.id); });
        bindLongPress(b, function () { showDetail(st); });
        g.appendChild(b);
      });
      body.appendChild(g);
      if (window.IntersectionObserver) {
        if (stkIO) stkIO.disconnect();
        var bts = g.querySelectorAll("button"), vis = new Set(), win = 0;
        /* anima sólo una tanda de 6 insignias visibles y la va rotando: mitad de costo, se ve igual de vivo */
        var apply = function () {
          var list = [].filter.call(bts, function (x) { return vis.has(x); }), n = list.length, on = new Set();
          for (var i = 0; i < Math.min(6, n); i++) on.add(list[(win + i) % n]);
          [].forEach.call(bts, function (x) { x.classList.toggle("off", !on.has(x)); });
        };
        stkIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); }); apply(); }, { rootMargin: "40px" });
        [].forEach.call(bts, function (bt) { stkIO.observe(bt); });
        clearInterval(stkTimer); stkTimer = setInterval(function () { win += 3; apply(); }, 3000);
      }
      var hint = el("p", "hintlp"); hint.textContent = "Mantené pulsada una insignia para ver su información."; body.appendChild(hint);
    } else if (iconKind === "mine") {
      var mg = el("div", "igrid stk");
      var mk = el("button"); mk.type = "button"; mk.id = "mineNew"; mk.setAttribute("aria-label", "Crear sticker"); mk.textContent = "＋";
      var mcap = el("span", "cap"); mcap.textContent = "Crear"; mk.appendChild(mcap); mk.addEventListener("click", function () { openStkEd(""); }); mg.appendChild(mk);
      myStk.forEach(function (st) {
        var b = el("button"); b.type = "button"; b.title = st.n; b.dataset.id = st.id; b.setAttribute("aria-label", st.n);
        b.setAttribute("aria-pressed", n.icon === "c:" + st.id ? "true" : "false"); b.appendChild(iconSpan("c:" + st.id));
        var cap = el("span", "cap"); cap.textContent = st.n; b.appendChild(cap);
        b.addEventListener("click", function () { setIcon("c:" + st.id); }); mg.appendChild(b);
      });
      body.appendChild(mg);
      var mh = el("p", "hintlp"); mh.textContent = myStk.length ? "Tus stickers viven solo en este teléfono." : "Creá tu primer sticker: dibujalo, con una foto o con un emoji."; body.appendChild(mh);
      var ma = el("div", "actions"); ma.style.marginTop = "8px"; var mb = el("button", "btn"); mb.type = "button"; mb.id = "mineMgr"; mb.textContent = "Administrar mis stickers";
      mb.addEventListener("click", function () { openStkMgr("icon"); }); ma.appendChild(mb); body.appendChild(ma);
    } else {
      EMOJI_SETS.forEach(function (set) {
        var h = el("div", "ihead"); h.textContent = set.n; body.appendChild(h);
        var g = el("div", "igrid");
        set.e.forEach(function (e) {
          var b = el("button"); b.type = "button"; b.setAttribute("aria-label", "Emoji " + e);
          b.setAttribute("aria-pressed", n.icon === "e:" + e ? "true" : "false");
          b.appendChild(iconSpan("e:" + e));
          b.addEventListener("click", function () { setIcon("e:" + e); });
          g.appendChild(b);
        });
        body.appendChild(g);
      });
      var row = el("div", "emoinput");
      var inp = el("input"); inp.type = "text"; inp.placeholder = "Otro emoji: escribilo o pegalo"; inp.setAttribute("aria-label", "Otro emoji");
      inp.setAttribute("autocomplete", "off"); inp.id = "emoInput";
      var go = el("button", "btn"); go.type = "button"; go.textContent = "Usar";
      function use() {
        var e = parseEmoji(inp.value);
        if (!e) { toast("Eso no es un emoji. Probá con el teclado de emojis"); return; }
        setIcon("e:" + e);
      }
      go.addEventListener("click", use);
      inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); use(); } });
      row.appendChild(inp); row.appendChild(go); body.appendChild(row);
    }
    $("iconClear").disabled = !n.icon;
  }
  function openIconSheet() {
    if (!cur() || readOnly()) return;
    var ci = cur().icon || "";
    if (ci.charAt(0) === "e") iconKind = "emojis";
    else if (ci.slice(0, 2) === "c:") iconKind = "mine";
    else iconKind = "stickers";
    renderIconSheet();
    $("scrim").hidden = false; $("iconSheet").hidden = false;
    pushLayer("icons");
  }
  $("iconBtn").addEventListener("click", openIconSheet);
  $("iconClose").addEventListener("click", function () { closeLayer("icons"); });
  $("iconClear").addEventListener("click", function () { setIcon(""); });
  $("iconSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    iconKind = b.dataset.k; renderIconSheet();
  });
  $("cuMode").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; cuSet({ m: b.dataset.m }); renderSheet(); });
  $("cuSize").addEventListener("input", function () { cuSet({ s: $("cuSize").value }); });
  $("cuOp").addEventListener("input", function () { cuSet({ o: $("cuOp").value }); });
  $("cuChange").addEventListener("click", function () { openStkMgr("bg"); });

  /* ---------- botón Guardar ---------- */
  var saveBtnTimer = null;
  function saveNow() {
    var n = cur(); if (!n || n.trashedAt) return;
    if (isEmptyNote(n)) { toast("Escribí un título o contenido para guardar la nota"); return; }
    n.updatedAt = Date.now();
    var ok = persistNow(); updateMeta(); renderList();
    if (!ok) { toast("No se pudo guardar la nota. Revisá el espacio del teléfono"); return; }
    var b = $("saveBtn"); b.dataset.state = "done"; $("saveLbl").textContent = "Guardado";
    toast("Nota guardada");
    clearTimeout(saveBtnTimer);
    saveBtnTimer = setTimeout(function () { delete b.dataset.state; $("saveLbl").textContent = "Guardar"; }, 1600);
  }
  $("saveBtn").addEventListener("click", saveNow);

  /* ---------- selector de fondos (panel de la nota y Ajustes) ---------- */
  function renderBgPick(box, current, withDefault, onPick) {
    box.textContent = "";
    function add(key, label, thumbBg, none) {
      var b = el("button", "bgp"); b.type = "button"; b.setAttribute("aria-label", "Fondo: " + label);
      b.setAttribute("aria-pressed", current === key ? "true" : "false");
      var t = el("span", "bgthumb" + (none ? " none" : ""));
      if (thumbBg) t.setAttribute("data-bg", thumbBg);
      var cap = el("span", "cap"); cap.textContent = label;
      b.appendChild(t); b.appendChild(cap);
      b.addEventListener("click", function () { onPick(key); });
      box.appendChild(b);
    }
    if (withDefault) add("", "Como en Ajustes", settings.noteBg === "none" ? "" : settings.noteBg, settings.noteBg === "none");
    add("none", "Sin fondo", "", true);
    BGS.forEach(function (g) { add(g.k, g.n, g.k, false); });
    if (withDefault) {
      var cm = CU_RE0.exec(current || ""), cb = el("button", "bgp"); cb.type = "button"; cb.id = "bgMine"; cb.setAttribute("aria-label", "Fondo: sticker propio");
      cb.setAttribute("aria-pressed", cm ? "true" : "false");
      var ct = el("span", "bgthumb cuthumb"); if (cm) ct.appendChild(stkImg(cm[1], false)); else ct.textContent = "★";
      var cc = el("span", "cap"); cc.textContent = "Sticker propio"; cb.appendChild(ct); cb.appendChild(cc);
      cb.addEventListener("click", function () { if (myStk.length) openStkMgr("bg"); else openStkEd(""); });
      box.appendChild(cb);
    }
  }

