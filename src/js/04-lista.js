  /* ---------- lista de notas ---------- */
  function inTab(n, t) {
    if (t === "trash") return !!n.trashedAt;
    if (n.trashedAt) return false;
    return t === "archive" ? n.archived : !n.archived;
  }
  var hayCache = new Map();
  function haystack(n) {
    var c = hayCache.get(n.id), k = n.updatedAt + "|" + n.title.length + "|" + n.body.length + "|" + n.items.length + "|" + n.tags.length;
    if (c && c.n === n && c.k === k) return c.h;
    var h = haystackRaw(n); hayCache.set(n.id, { n: n, k: k, h: h }); return h;
  }
  function haystackRaw(n) {
    if (n.lock) return (n.title + "\n" + n.tags.join(" ")).toLowerCase().split("\n")[0];
    return (n.title + "\n" + n.body + "\n" + n.items.map(function (i) { return i.t; }).join("\n") + "\n" + n.tags.join(" ")).toLowerCase();
  }
  function colorIndex(k) { for (var i = 0; i < COLORS.length; i++) if (COLORS[i].k === k) return i; return 0; }
  function noteSize(n) { return n.type === "list" ? n.items.reduce(function (s, i) { return s + i.t.length; }, 0) : n.body.length; }
  function visibleNotes() {
    var q = query.trim().toLowerCase();
    var wide = !!(q && allScope);
    var arr = Array.from(notes.values()).filter(function (n) { return wide || inTab(n, tab); });
    if (!filtering() && !wide) arr = arr.filter(function (n) {
      var pr = n.parent && notes.get(n.parent);
      return !(pr && !pr.trashedAt && pr.archived === n.archived && pr.parent !== n.id);
    });
    if (tagFilter) arr = arr.filter(function (n) { return n.tags.indexOf(tagFilter) >= 0; });
    if (folderFilter !== null) arr = arr.filter(function (n) { return n.folder === folderFilter; });
    if (kindFilter !== "all") arr = arr.filter(function (n) {
      if (kindFilter === "text" || kindFilter === "list") return n.type === kindFilter;
      if (kindFilter === "open") return n.type === "list" && n.items.some(function (i) { return i.t.trim() && !i.done; });
      if (kindFilter === "pinned") return n.pinned;
      if (kindFilter === "remind") return !!n.remind;
      if (kindFilter === "img") return !n.lock && n.images.length > 0;
      return n.color !== "none" && n.color !== COLORS[0].k;
    });
    if (whenFilter !== "all") {
      var t0 = new Date(); t0.setHours(0, 0, 0, 0);
      var from = whenFilter === "today" ? t0.getTime() : Date.now() - ({ week: 7, month: 30, year: 365 }[whenFilter] || 0) * 86400000;
      arr = arr.filter(function (n) { return n.updatedAt >= from; });
    }
    if (q) {
      var kh = {};
      notes.forEach(function (k) { if (k.parent && !k.trashedAt) (kh[k.parent] = kh[k.parent] || []).push(haystack(k)); });
      arr = arr.filter(function (n) { return haystack(n).indexOf(q) >= 0 || (kh[n.id] || []).some(function (h) { return h.indexOf(q) >= 0; }); });
    }
    var by = settings.sort;
    arr.sort(function (a, b) {
      if (tab === "notes" && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (by === "title") return (a.title || "￿").localeCompare(b.title || "￿", "es", { sensitivity: "base" });
      if (by === "color") return colorIndex(a.color) - colorIndex(b.color) || b.updatedAt - a.updatedAt;
      if (by === "created") return b.createdAt - a.createdAt;
      if (by === "oldest") return a.createdAt - b.createdAt;
      if (by === "titleDesc") return (b.title || "").localeCompare(a.title || "", "es", { sensitivity: "base" });
      if (by === "remind") { var ra = a.remind ? nextAt(a.remind) : Infinity, rb = b.remind ? nextAt(b.remind) : Infinity; return ra === rb ? b.updatedAt - a.updatedAt : ra - rb; }
      if (by === "long") return noteSize(b) - noteSize(a) || b.updatedAt - a.updatedAt;
      return b.updatedAt - a.updatedAt;
    });
    return arr;
  }
  function hlText(parent, text, q) {
    var low = text.toLowerCase(), i = q ? low.indexOf(q) : -1, pos = 0;
    if (i < 0) { parent.appendChild(document.createTextNode(text)); return; }
    while (i >= 0) {
      if (i > pos) parent.appendChild(document.createTextNode(text.slice(pos, i)));
      var m = el("mark"); m.textContent = text.slice(i, i + q.length); parent.appendChild(m);
      pos = i + q.length; i = low.indexOf(q, pos);
    }
    if (pos < text.length) parent.appendChild(document.createTextNode(text.slice(pos)));
  }
  function snippet(text, q) {
    var flat = text.replace(/\s+/g, " ").trim(), i = q ? flat.toLowerCase().indexOf(q) : -1;
    if (i < 0) return flat.slice(0, 260);
    var a = Math.max(0, i - 60);
    return (a > 0 ? "…" : "") + flat.slice(a, a + 260);
  }
  /* deslizar una tarjeta (solo en vista de lista): derecha = fijar, izquierda = archivar */
  function swipeAct(n, dir) {
    var was = { p: n.pinned, a: n.archived };
    if (dir > 0) {
      if (tab !== "notes") return;
      n.pinned = !was.p; n.updatedAt = Date.now(); persistNow(); renderAll();
      toast(n.pinned ? "Nota fijada" : "Nota desfijada", "Deshacer", function () { n.pinned = was.p; persistNow(); renderAll(); });
    } else {
      var un = tab === "archive"; n.archived = !un; if (!un) n.pinned = false; n.updatedAt = Date.now(); persistNow(); renderAll();
      toast(un ? "Nota desarchivada" : "Nota archivada", "Deshacer", function () { n.archived = was.a; n.pinned = was.p; persistNow(); renderAll(); });
    }
  }
  function bindSwipe(li, b, n) {
    if (n.trashedAt) return;
    b.classList.add("swp");
    var x0 = 0, y0 = 0, id = -1, on = false, bg = null, dx = 0, hit = false, LIM = 150, TH = 88;
    function reset(anim) {
      if (anim) { b.classList.add("swback"); setTimeout(function () { b.classList.remove("swback"); }, 220); }
      b.classList.remove("swdrag"); b.style.transform = ""; li.classList.remove("swiping"); if (bg) { bg.remove(); bg = null; }
      on = false; id = -1; dx = 0; hit = false;
    }
    var down = false;
    b.addEventListener("pointerdown", function (e) { down = true; x0 = e.clientX; y0 = e.clientY; delete b.dataset.mv; });
    b.addEventListener("pointermove", function (e) { if (down && (Math.abs(e.clientX - x0) > 14 || Math.abs(e.clientY - y0) > 14)) b.dataset.mv = "1"; });
    b.addEventListener("pointerdown", function (e) {
      if (!settings.swipe || selMode || $("list").getAttribute("data-view") !== "list" || (e.pointerType === "mouse" && e.button !== 0)) { id = -1; return; }
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; on = false; dx = 0;
    });
    b.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (!on) {
        if (Math.abs(my) > 12 && Math.abs(my) > Math.abs(mx)) { id = -1; return; }
        if (Math.abs(mx) < 14 || Math.abs(mx) < Math.abs(my) * 1.6) return;
        if (mx > 0 && tab !== "notes") { id = -1; return; }
        on = true; try { b.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
        b.dataset.sw = "1"; li.classList.add("swiping"); b.classList.add("swdrag");
        bg = el("div", "swbg"); li.insertBefore(bg, b);
      }
      dx = Math.max(-LIM, Math.min(LIM, mx > 0 ? mx - 14 : mx + 14));
      if (dx > 0 && tab !== "notes") dx = 0;
      b.style.transform = "translateX(" + dx + "px)";
      var right = dx > 0, ready = Math.abs(dx) >= TH;
      bg.className = "swbg " + (right ? "pin" : "arch") + (ready ? "" : " off");
      bg.textContent = right ? (n.pinned ? "Desfijar" : "Fijar") : (tab === "archive" ? "Desarchivar" : "Archivar");
      if (ready && !hit) { hit = true; try { if (navigator.vibrate) navigator.vibrate(10); } catch { /* sin vibración */ } } else if (!ready) hit = false;
    });
    function end(commit) {
      if (!on) { id = -1; return; }
      var d = dx, ok = commit && Math.abs(d) >= TH;
      setTimeout(function () { delete b.dataset.sw; }, 350);
      reset(!ok);
      if (ok) swipeAct(n, d > 0 ? 1 : -1);
    }
    b.addEventListener("pointerup", function () { down = false; end(true); });
    b.addEventListener("pointercancel", function () { down = false; end(false); });
    b.addEventListener("click", function (e) { if (b.dataset.sw === "1" || b.dataset.mv === "1") { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  function makeItem(n) {
    var hq = query.trim().toLowerCase();
    var li = el("li"), b = el("button", "item");
    b.type = "button";
    if (n.id === activeId) b.setAttribute("aria-current", "true");
    var c = colorOf(n.color);
    if (c.rgb) { b.style.setProperty("--tint", rgba(c.rgb, 0.2)); b.style.setProperty("--dot", rgba(c.rgb, 1)); }
    b.dataset.bg = resolveBg(n, true);
    var wm = watermark(n.icon); if (wm) b.appendChild(wm);
    var top = el("span", "top");
    var ic = cardIcon(n.icon); if (ic) top.appendChild(ic);
    var t = el("span", "t" + (n.title.trim() ? "" : " empty"));
    if (n.title.trim()) hlText(t, n.title.trim(), hq); else if (n.lock && n.enc && n.enc.tt && !encMeta.has(n)) t.textContent = "🔒 Nota protegida"; else t.textContent = n.type === "list" ? "Lista sin título" : "Sin título";
    top.appendChild(t);
    b.appendChild(top);
    if (n.lock) {
      var lp = el("span", "p"); lp.textContent = "🔒 Nota protegida"; b.appendChild(lp);
    } else if (n.type === "list") {
      var box = el("span", "p");
      box.style.display = "block";
      n.items.filter(function (i) { return i.t.trim(); }).slice(0, 4).forEach(function (i) {
        var r = el("span", "pi" + (i.done ? " done" : ""));
        r.appendChild(el("span", "box" + (i.done ? " on" : "")));
        var tx = el("span"); hlText(tx, i.t, hq); r.appendChild(tx);
        box.appendChild(r);
      });
      if (!box.firstChild) { box.className = "p"; box.style.display = ""; box.textContent = "Sin elementos"; }
      b.appendChild(box);
      var realItems = n.items.filter(function (i) { return i.t.trim(); });
      if (realItems.length) {
        var pb = el("span", "pb"), pf = el("i");
        pb.style.setProperty("--p", Math.round(realItems.filter(function (i) { return i.done; }).length / realItems.length * 100) + "%");
        pb.appendChild(pf); b.appendChild(pb);
      }
    } else {
      var p = el("span", "p");
      var sn = snippet(n.body, hq);
      if (sn) hlText(p, sn, hq); else p.textContent = "Sin texto";
      b.appendChild(p);
    }
    if (n.tags.length && !n.lock) {
      var tg = el("span", "tg");
      n.tags.slice(0, 3).forEach(function (x) { var s = el("span", "tag"); s.textContent = "#" + x; tg.appendChild(s); });
      b.appendChild(tg);
    }
    var m = el("span", "m");
    if (n.trashedAt || (n.archived && tab !== "archive")) { var wb = el("span", "fold"); wb.textContent = n.trashedAt ? "🗑 Papelera" : "📦 Archivo"; m.appendChild(wb); }
    if (n.pinned) { var pin = el("span", "pin"); pin.textContent = "fijada"; m.appendChild(pin); }
    if (n.remind) { var rm = el("span", "fold"); rm.textContent = "⏰ " + remText(n.remind) + (n.rems.length ? " · +" + n.rems.length : ""); m.appendChild(rm); }
    if (n.images.length && !n.lock) { var im = el("span"); im.textContent = "🖼 " + n.images.length; m.appendChild(im); }
    if (kidCount[n.id]) { var ki = el("span", "fold"); ki.textContent = "↳ " + kidCount[n.id]; m.appendChild(ki); }
    if (hq && haystack(n).indexOf(hq) < 0) {
      var km = null; notes.forEach(function (k) { if (!km && k.parent === n.id && !k.trashedAt && haystack(k).indexOf(hq) >= 0) km = k; });
      if (km) { var kb = el("span", "fold"); kb.textContent = "coincide en la subnota «" + (km.title.trim() || "Sin título") + "»"; m.appendChild(kb); }
    }
    if (n.folder) { var fo = el("span", "fold"); fo.textContent = "▣ " + n.folder; m.appendChild(fo); }
    if (c.rgb) m.appendChild(el("span", "dot"));
    var w = el("span"); w.textContent = when(n.trashedAt || n.updatedAt); m.appendChild(w);
    b.appendChild(m);
    if (selMode) { b.classList.toggle("selected", sel.has(n.id)); var sm = el("span", "selmark"); sm.textContent = sel.has(n.id) ? "✓" : ""; b.appendChild(sm); }
    b.addEventListener("click", function () {
      if (b.dataset.lp === "1") { b.dataset.lp = ""; return; }
      if (selMode) toggleSel(n.id); else openNote(n.id);
    });
    bindLongPress(b, function () { if (!selMode && !n.trashedAt) { enterSel(); toggleSel(n.id); } });
    li.appendChild(b);
    bindSwipe(li, b, n);
    return li;
  }
  var EMPTY = {
    notes: "Todavía no hay notas. Tocá el botón + para escribir la primera.",
    archive: "No hay notas archivadas. Archivá las que no uses para despejar la lista.",
    trash: "La papelera está vacía. Lo que borres queda acá hasta que lo elimines."
  };
  /* Los stickers de las tarjetas solo se animan mientras se ven en pantalla (ahorra batería).
     Un único observador para toda la vida de la app; las tarjetas nuevas se agregan al vuelo. */
  /* mientras se desplaza la lista se congelan las animaciones de las tarjetas y vuelven al soltar */
  (function () {
    var t = 0;
    document.addEventListener("scroll", function (e) {
      if (!e.target || !e.target.closest || !e.target.closest(".list, #list, .app")) { if (e.target !== document) return; }
      if (!document.body.classList.contains("scrolling")) document.body.classList.add("scrolling");
      clearTimeout(t); t = setTimeout(function () { document.body.classList.remove("scrolling"); }, 160);
    }, { capture: true, passive: true });
  })();
  /* al bajar por la lista se esconden los controles para ver más notas; al subir vuelven */
  (function () {
    var lst = document.getElementById("list"), ch = document.getElementById("chrome"), last = 0, narrow = window.matchMedia("(max-width:760px)");
    function show() { ch.classList.remove("hide"); }
    lst.addEventListener("scroll", function () {
      var y = lst.scrollTop, dy = y - last;
      if (!narrow.matches || document.activeElement === $("q")) { show(); last = y; return; }
      if (y < 24 || dy < -10) { show(); last = y; }
      else if (dy > 12 && y > 140 && !ch.classList.contains("hide") && lst.scrollHeight - lst.clientHeight > ch.offsetHeight + 260) { ch.classList.add("hide"); last = y; }
      else if (dy > 0 || dy < 0) { if (Math.abs(dy) > 12) last = y; }
    }, { passive: true });
    $("q").addEventListener("focus", show);
    document.addEventListener("tronx:chrome", show);
  })();
  var iconIO = null, preIO = null, iconTimer = 0, iconWin = 0, visIcons = new Set();
  function applyIconWin() {
    var list = Array.from(visIcons), n = list.length;
    if (!n) return;
    var on = new Set();
    for (var i = 0; i < Math.min(4, n); i++) on.add(list[(iconWin + i) % n]);
    list.forEach(function (e) { e.classList.toggle("idle", !on.has(e)); });
  }
  function watchIcon(e) {
    if (!("IntersectionObserver" in window)) { upgradeIcon(e); e.classList.add("anim"); return; }
    if (!iconIO) {
      /* de los iconos a la vista solo se mueven 4 a la vez (van rotando): igual de vivo, mucho menos trabajo */
      iconIO = new IntersectionObserver(function (es) {
        es.forEach(function (x) { x.target.classList.toggle("anim", x.isIntersecting); if (x.isIntersecting) visIcons.add(x.target); else { visIcons.delete(x.target); x.target.classList.remove("idle"); } });
        applyIconWin();
      }, { rootMargin: "40px" });
      if (!iconTimer) iconTimer = setInterval(function () { iconWin += 2; applyIconWin(); }, 3000);
      /* el sticker pasa a su versión animada un poco antes de entrar, así el scroll no paga ese costo */
      preIO = new IntersectionObserver(function (es) {
        es.forEach(function (x) { if (x.isIntersecting) { upgradeIcon(x.target); preIO.unobserve(x.target); } });
      }, { rootMargin: "400px 0px" });
    }
    iconIO.observe(e); preIO.observe(e);
  }
  function unwatchIcons(li) {
    if (!iconIO) return;
    var e = li.querySelector(".ic.sk"); if (e) { iconIO.unobserve(e); preIO.unobserve(e); }
  }
  /* Caché de tarjetas: solo se reconstruye la que cambió; el resto se reutiliza y se reordena */
  var cards = new Map(), kidCount = {};
  function cardSig(n) {
    var d = 0, k = 0;
    for (var i = 0; i < n.items.length; i++) { k++; if (n.items[i].done) d++; }
    return (n.trashedAt ? "t" : n.archived ? "a" : "n") + tab + "|" + n.updatedAt + "|" + n.title.length + "|" + n.body.length + "|" + k + "|" + d + "|" + n.color + "|" + n.icon + "|" +
      (n.pinned ? 1 : 0) + "|" + n.tags.join(",") + "|" + resolveBg(n, true) + "|" + (n.id === activeId ? 1 : 0) + "|" +
      (n.trashedAt || 0) + "|" + when(n.trashedAt || n.updatedAt) + "|" + n.folder + "|" + (n.remind ? n.remind.at + n.remind.rep + n.remind.seen + n.remind.snz + (n.remind.wd || []).join("") : "") + "|" + n.rems.map(function (r) { return r.at + r.rep + r.seen; }).join(",") + "|" + (n.lock ? n.lock.m : "") + "|" + n.images.length + "|" + (kidCount[n.id] || 0) + "|" + query.trim().toLowerCase() + "|" + (selMode ? (sel.has(n.id) ? 2 : 1) : 0);
  }
  function renderList() {
    var listEl = $("list"), rows = visibleNotes();
    renderSaved();
    kidCount = {};
    notes.forEach(function (k) { if (k.parent && !k.trashedAt && notes.has(k.parent)) kidCount[k.parent] = (kidCount[k.parent] || 0) + 1; });
    if (listEl.getAttribute("data-view") !== settings.view) listEl.setAttribute("data-view", settings.view);
    if (window.__fltReady) { fltSync(); tryCelebrate(); }
    var want = [];
    rows.forEach(function (n) {
      var sig = cardSig(n), c = cards.get(n.id);
      if (!c || c.n !== n || c.sig !== sig) {
        if (c) { unwatchIcons(c.li); }
        var li = makeItem(n); c = { li: li, sig: sig, n: n }; cards.set(n.id, c);
        var ic = li.querySelector(".ic.sk"); if (ic) watchIcon(ic);
      }
      want.push(c.li);
    });
    if (!rows.length) {
      var li0 = listEl.querySelector(".nores");
      if (!li0) { li0 = el("li", "nores"); }
      li0.textContent = filtering() ? "Ninguna nota coincide con lo que buscás." : EMPTY[tab];
      want.push(li0);
    }
    /* quitar lo que ya no va */
    var keep = new Set(want);
    for (var x = listEl.firstChild; x;) { var nx = x.nextSibling; if (!keep.has(x)) listEl.removeChild(x); x = nx; }
    /* ordenar con el menor número de movimientos */
    var cursor = listEl.firstChild;
    for (var j = 0; j < want.length; j++) {
      if (cursor === want[j]) cursor = cursor.nextSibling;
      else listEl.insertBefore(want[j], cursor);
    }
    if (cards.size > notes.size + 20) {
      cards.forEach(function (c, id) { if (!notes.has(id)) cards.delete(id); });
    }
    var total = 0;
    notes.forEach(function (n) { if (inTab(n, tab)) total++; });
    var label = total === 1 ? " nota" : " notas";
    $("count").textContent = filtering() ? rows.length + " de " + total + label : total + label;
    $("emptyTrash").hidden = !(tab === "trash" && total > 0);
    renderBkBar();
  }
  function filtering() { return !!(query.trim() || tagFilter || folderFilter !== null || kindFilter !== "all" || whenFilter !== "all"); }
  function renderListSoon() {
    if (listRaf) return;
    listRaf = requestAnimationFrame(function () { listRaf = 0; renderList(); });
  }
  function renderTabs() {
    var counts = { notes: 0, archive: 0, trash: 0 };
    notes.forEach(function (n) { if (n.trashedAt) counts.trash++; else if (n.archived) counts.archive++; else counts.notes++; });
    $("nNotes").textContent = counts.notes || "";
    $("nArchive").textContent = counts.archive || "";
    $("nTrash").textContent = counts.trash || "";
    document.querySelectorAll(".tab").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"); });
  }
  function allTags() {
    var map = {};
    notes.forEach(function (n) { if (!n.trashedAt) n.tags.forEach(function (t) { map[t] = (map[t] || 0) + 1; }); });
    return Object.keys(map).sort(function (a, b) { return a.localeCompare(b, "es"); });
  }
  function renderChips() {
    var box = $("chips"), tags = allTags();
    if (tagFilter && tags.indexOf(tagFilter) < 0) tagFilter = null;
    box.textContent = "";
    box.hidden = tags.length === 0;
    if (!tags.length) return;
    var all = el("button", "chip"); all.type = "button"; all.textContent = "Todas";
    all.setAttribute("aria-pressed", tagFilter ? "false" : "true");
    all.addEventListener("click", function () { tagFilter = null; renderChips(); renderList(); });
    box.appendChild(all);
    tags.forEach(function (t) {
      var c = el("button", "chip"); c.type = "button"; c.textContent = "#" + t;
      c.setAttribute("aria-pressed", tagFilter === t ? "true" : "false");
      c.addEventListener("click", function () { tagFilter = tagFilter === t ? null : t; renderChips(); renderList(); });
      box.appendChild(c);
    });
    var gear = el("button", "chip"); gear.type = "button"; gear.textContent = "⚙"; gear.setAttribute("aria-label", "Gestionar etiquetas y carpetas"); gear.addEventListener("click", openOrg); box.appendChild(gear);
    var dl = $("taglist"); dl.textContent = "";
    tags.forEach(function (t) { var o = el("option"); o.value = t; dl.appendChild(o); });
  }
  function renderViewBtn() {
    var b = $("viewBtn");
    var grid = '<svg class="i" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>';
    var rows = '<svg class="i" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    b.innerHTML = settings.view === "grid" ? rows : grid;
    var label = settings.view === "grid" ? "Ver como lista" : "Ver como cuadrícula";
    b.title = label; b.setAttribute("aria-label", label);
  }
  function allFolders() {
    var map = {};
    notes.forEach(function (n) { if (!n.trashedAt && n.folder) map[n.folder] = (map[n.folder] || 0) + 1; });
    return Object.keys(map).sort(function (a, b) { return a.localeCompare(b, "es"); });
  }
  function renderFolders() {
    var box = $("folders"), fs = allFolders();
    if (folderFilter && fs.indexOf(folderFilter) < 0) folderFilter = null;
    box.textContent = ""; box.hidden = fs.length === 0;
    var dl = $("folderlist"); dl.textContent = "";
    fs.forEach(function (f) { var o = el("option"); o.value = f; dl.appendChild(o); });
    if (!fs.length) return;
    function chip(label, val) {
      var c = el("button", "chip"); c.type = "button"; c.textContent = label;
      c.setAttribute("aria-pressed", folderFilter === val ? "true" : "false");
      c.addEventListener("click", function () { folderFilter = (folderFilter === val && val !== null) ? null : val; renderFolders(); renderList(); });
      box.appendChild(c);
    }
    chip("Todas", null); chip("Sin carpeta", "");
    fs.forEach(function (f) { chip(f, f); });
    if (!allTags().length) { var g2 = el("button", "chip"); g2.type = "button"; g2.textContent = "⚙"; g2.setAttribute("aria-label", "Gestionar etiquetas y carpetas"); g2.addEventListener("click", openOrg); box.appendChild(g2); }
  }
  /* selección múltiple */
  function bulkUI() {
    $("bulk").hidden = !selMode; fabUpdate();
    $("selBtn").setAttribute("aria-pressed", selMode ? "true" : "false");
    $("bulkN").textContent = sel.size;
    $("bulkMain").hidden = false; $("bulkFolder").hidden = true;
    var any = Array.from(sel).map(function (id) { return notes.get(id); }).filter(Boolean);
    $("bArch").textContent = tab === "archive" ? "Desarchivar" : "Archivar";
    $("bPin").textContent = any.length && any.every(function (n) { return n.pinned; }) ? "Desfijar" : "Fijar";
    ["bPin", "bFolder", "bArch", "bTrash"].forEach(function (k) { $(k).disabled = !sel.size; });
    $("bPin").hidden = tab !== "notes";
  }
  function enterSel() {
    if (selMode || tab === "trash") return;
    selMode = true; sel.clear(); pushLayer("select"); bulkUI(); renderList();
  }
  function exitSelUI() { selMode = false; sel.clear(); bulkUI(); renderList(); }
  registerLayer("select", exitSelUI);
  function toggleSel(id) {
    if (sel.has(id)) sel.delete(id); else sel.add(id);
    var c = cards.get(id); if (c) c.sig = "";
    bulkUI(); renderList();
  }
  function selNotes() { return Array.from(sel).map(function (id) { return notes.get(id); }).filter(Boolean); }
  function bulkDo(fn, msg) {
    var arr = selNotes(); if (!arr.length) return;
    var prev = arr.map(function (n) { return { n: n, p: n.pinned, a: n.archived, t: n.trashedAt, f: n.folder }; });
    arr.forEach(fn); arr.forEach(function (n) { n.updatedAt = Date.now(); });
    persistNow(); closeLayer("select"); renderAll();
    toast(msg + " (" + arr.length + ")", "Deshacer", function () {
      prev.forEach(function (x) { x.n.pinned = x.p; x.n.archived = x.a; x.n.trashedAt = x.t; x.n.folder = x.f; });
      persistNow(); renderAll();
    });
  }
  $("selBtn").addEventListener("click", function () { if (selMode) closeLayer("select"); else enterSel(); });
  $("bDone").addEventListener("click", function () { closeLayer("select"); });
  $("bAll").addEventListener("click", function () {
    var rows = visibleNotes(); if (sel.size === rows.length) sel.clear(); else rows.forEach(function (n) { sel.add(n.id); });
    cards.forEach(function (c) { c.sig = ""; }); bulkUI(); renderList();
  });
  $("bPin").addEventListener("click", function () { var all = selNotes().every(function (n) { return n.pinned; }); bulkDo(function (n) { n.pinned = !all; }, all ? "Notas desfijadas" : "Notas fijadas"); });
  $("bArch").addEventListener("click", function () { var un = tab === "archive"; bulkDo(function (n) { n.archived = !un; n.pinned = false; }, un ? "Notas desarchivadas" : "Notas archivadas"); });
  $("bTrash").addEventListener("click", function () { bulkDo(function (n) { n.trashedAt = Date.now(); n.pinned = false; }, "Notas a la papelera"); });
  $("bFolder").addEventListener("click", function () { $("bulkMain").hidden = true; $("bulkFolder").hidden = false; $("bFolderIn").value = ""; $("bFolderIn").focus(); });
  $("bFolderNo").addEventListener("click", bulkUI);
  $("bFolderOk").addEventListener("click", function () { var f = cleanFolder($("bFolderIn").value); bulkDo(function (n) { n.folder = f; }, f ? "Movidas a " + f : "Sacadas de la carpeta"); });
  function fabUpdate() { var f = $("fab"); if (f) f.hidden = !settings.fab || tab === "trash" || selMode; }
  function renderAll() { renderTabs(); renderFolders(); renderChips(); renderList(); fabUpdate(); }

