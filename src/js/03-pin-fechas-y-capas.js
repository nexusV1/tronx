  /* ---------- cifrado de notas protegidas con PIN ----------
     El texto (cuerpo, casillas y versiones) de una nota con PIN propio se guarda cifrado con AES-GCM; la clave sale del PIN (PBKDF2).
     En memoria la nota abierta está en claro; en el disco (y en las copias) queda cifrada. Título, etiquetas e imágenes no se cifran. */
  var encMeta = new WeakMap(), encKeys = {}, encTimers = {}, ENC_IT = 120000, lastPin = "";
  function b64(buf) { var a = new Uint8Array(buf), s = ""; for (var i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s); }
  function unb64(t) { var s = atob(t), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function encOk() { return !!(window.crypto && crypto.subtle && window.TextEncoder && window.TextDecoder); }
  function encKey(pin, salt, it) {
    var te = new TextEncoder();
    return crypto.subtle.importKey("raw", te.encode(pin), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: te.encode("tronx-enc|" + salt), iterations: it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function encPlain(n) { var o = { b: n.body, i: n.items, v: n.versions }; if (settings.encTitle) o.t = n.title; return JSON.stringify(o); }
  function isPinEnc(n) { return !!(n.lock && (n.lock.m === "pin" || n.lock.m === "pass")); }
  function imgSig(n) { return n.images.map(function (i) { return i.src; }).join(","); }
  /* imágenes de la nota: se cifran con la misma clave del texto; las miniaturas en claro se borran (se rehacen al abrir la nota) */
  function encImages(n) {
    if (!encOk() || !isPinEnc(n)) return Promise.resolve(false);
    var key = encKeys[n.lock.s]; if (!key) return Promise.resolve(false);
    var seen = {}, jobs = [];
    n.images.forEach(function (it) {
      if (seen[it.src]) return; seen[it.src] = 1;
      jobs.push(imgGetRaw(it.src).then(function (raw) {
        if (!raw) return;
        var pl = raw.encImg ? (raw.s === n.lock.s ? null : imgGet(it.src)) : Promise.resolve(raw);
        if (!pl) return imgDropThumb(it.src);
        return Promise.resolve(pl).then(function (blob) {
          if (!blob) return;
          return blob.arrayBuffer().then(function (buf) {
            var iv = crypto.getRandomValues(new Uint8Array(12));
            return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buf).then(function (ct) {
              return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct).then(function (back) {
                if (back.byteLength !== buf.byteLength) return;
                imgMem.delete(it.src);
                return imgPutRaw(it.src, { encImg: 1, s: n.lock.s, iv: iv.buffer, ct: ct, type: blob.type || "image/jpeg" }).then(function () { return imgDropThumb(it.src); });
              });
            });
          });
        });
      }).catch(function () {}));
    });
    return Promise.all(jobs).then(function () { var m = encMeta.get(n); if (m) m.im = imgSig(n); return true; });
  }
  function encImgSoon(n) { clearTimeout(encTimers[n.id + "i"]); encTimers[n.id + "i"] = setTimeout(function () { encImages(n); }, 1200); }
  /* al quitar la protección (o pasarla a una sin cifrado) las imágenes vuelven a guardarse en claro; devuelve una promesa */
  function encRelease(n) {
    if (!encOk() || !n.images.length) return Promise.resolve();
    var seen = {};
    return Promise.all(n.images.map(function (it) {
      if (seen[it.src]) return null; seen[it.src] = 1;
      return imgGetRaw(it.src).then(function (raw) { if (!raw || !raw.encImg) return; return imgGet(it.src).then(function (b) { if (b) return imgPutRaw(it.src, b); }); }).catch(function () {});
    }));
  }
  function serNote(n) {
    if (!n.enc) return n;
    var meta = encMeta.get(n);
    if (meta && meta.src !== encPlain(n)) { if (document.hidden) encSave(n); else encSoon(n); return n; } /* editada: se guarda en claro un momento hasta cifrarla */
    if (meta && meta.im !== imgSig(n)) encImgSoon(n);
    var c = Object.assign({}, n); c.body = ""; c.items = []; c.versions = [];
    if (n.enc.tt) c.title = "";
    return c;
  }
  function encSave(n) {
    if (!encOk() || !isPinEnc(n)) return Promise.resolve(false);
    var key = encKeys[n.lock.s]; if (!key) return Promise.resolve(false);
    var plain = encPlain(n), meta = encMeta.get(n), tt = settings.encTitle ? 1 : 0;
    if (n.enc && meta && meta.src === plain) return Promise.resolve(true);
    var iv = crypto.getRandomValues(new Uint8Array(12)), te = new TextEncoder();
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, te.encode(plain)).then(function (ct) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct).then(function (back) {
        if (new TextDecoder().decode(back) !== plain || encPlain(n) !== plain) return false; /* verificar antes de reemplazar; si cambió mientras tanto, se reintenta */
        n.enc = { v: 1, it: ENC_IT, iv: b64(iv), ct: b64(ct), tt: tt }; encMeta.set(n, { src: plain }); persistNow(true); encImages(n); return true;
      });
    }).catch(function () { return false; });
  }
  function encSoon(n) { clearTimeout(encTimers[n.id]); encTimers[n.id] = setTimeout(function () { encSave(n).then(function (ok) { if (!ok && isPinEnc(n) && encKeys[n.lock.s] && encMeta.get(n) && encMeta.get(n).src !== encPlain(n)) encSoon(n); }); }, 700); }
  /* tras ingresar el PIN de una nota: descifra si hace falta y activa el cifrado */
  function encUnlock(n, pin) {
    if (!isPinEnc(n) || !pin || !encOk()) return Promise.resolve();
    var it = (n.enc && n.enc.it) || ENC_IT;
    return encKey(pin, n.lock.s, it).then(function (key) {
      encKeys[n.lock.s] = key;
      if (n.enc && !encMeta.has(n)) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(n.enc.iv) }, key, unb64(n.enc.ct)).then(function (buf) {
          var src = new TextDecoder().decode(buf), o = JSON.parse(src);
          if (typeof o.t === "string") n.title = o.t.slice(0, 200);
          n.body = String(o.b || ""); n.items = (Array.isArray(o.i) ? o.i : []).map(function (x) { return cleanItem(x, 1e9); }); n.versions = cleanVersions(o.v);
          encMeta.set(n, { src: encPlain(n) }); if (encMeta.get(n).src !== src) encSoon(n);
        });
      }
      return encSave(n);
    });
  }
  function encDrop(n) { delete n.enc; encMeta.delete(n); }
  function persistNow(soft) {
    syncSoon(); widgetSoon();
    clearTimeout(saveTimer); saveTimer = null;
    var json = JSON.stringify(Array.from(notes.values()).map(serNote)), ok = lsSet(KEY, json);
    if (ok && soft !== true) { try { ok = localStorage.getItem(KEY) === json; } catch { ok = false; } }
    setStatus(ok ? "Guardado" : "No se pudo guardar: sin espacio");
    if (window.TronxMap) window.TronxMap.prune();
    return ok;
  }
  function schedulePersist() { setStatus("Guardando…"); clearTimeout(saveTimer); saveTimer = setTimeout(function () { persistNow(true); }, 350); }
  function setStatus(t) {
    $("status").textContent = t || "";
    clearTimeout(statusTimer);
    if (t === "Guardado") statusTimer = setTimeout(function () { $("status").textContent = ""; }, 1800);
  }
  function cur() { return activeId ? notes.get(activeId) : null; }
  function listHidden() { return $("app").dataset.view === "editor" && window.matchMedia("(max-width:760px)").matches; }
  function changed(n) {
    syncSoon();
    n.updatedAt = Date.now();
    statsTick(n);
    schedulePersist(); updateMeta();
    if (!listHidden()) renderListSoon(); // en pantallas angostas la lista está oculta: se actualiza al volver

    if (n.id === activeId) { renderProg(); renderTpls(); }
  }

  /* ---------- fechas ---------- */
  var tf = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  var df = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
  var dfy = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });
  function when(ts) {
    var d = new Date(ts), n = new Date();
    var d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var n0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    var days = Math.round((n0 - d0) / 86400000);
    if (days === 0) return "hoy " + tf.format(d);
    if (days === 1) return "ayer " + tf.format(d);
    return (d.getFullYear() === n.getFullYear() ? df.format(d) : dfy.format(d)).replace(/\./g, "");
  }

  /* ---------- capas (botón Atrás de Android) ---------- */
  var layers = [], layerHandlers = {};
  function registerLayer(name, fn) { layerHandlers[name] = fn; }
  function hasLayer(name) { return layers.indexOf(name) >= 0; }
  /* Entrada de resguardo: evita que Atrás cierre la app desde la pantalla principal */
  var guardOn = false, guardTimer = 0, progClose = false;
  function armGuard() {
    if (guardOn) return; guardOn = true;
    try { history.pushState({ d: 0, g: 1 }, ""); } catch {}
  }
  function mxInnerBack() {
    var pko = document.querySelector(".mx-pko .mx-pkx"); if (document.querySelector(".mx-pko")) { if (pko) pko.click(); return true; }
    if (typeof mxTourI !== "undefined" && mxTourI >= 0 && $("mxTour")) { mxTourEnd(true); return true; }
    if (mxEvSel) { mxEvSel = ""; mxRender(); return true; }
    if (mxTab !== "home") { mxTab = "home"; mxRender(); var sc = $("mxSc"); if (sc) sc.scrollTop = 0; return true; }
    return false;
  }
  function rootInnerBack() {
    var f = kindFilter !== "all" || whenFilter !== "all";
    if (tab === "notes" && !query && !tagFilter && !folderFilter && !f) return false;
    query = ""; $("q").value = ""; kindFilter = "all"; whenFilter = "all";
    if (tab === "notes") { tagFilter = null; folderFilter = null; renderAll(); } else document.querySelector('.tab[data-tab="notes"]').click();
    try { fltSync(); } catch {}
    return true;
  }
  function pushLayer(name) {
    if (layers.indexOf(name) >= 0) return;
    if (!layers.length) { clearTimeout(guardTimer); armGuard(); }
    layers.push(name);
    try { history.pushState({ d: layers.length }, ""); } catch {}
  }
  function closeLayerUI(name) {
    if (name === "settings") $("settings").hidden = true;
    else if (name === "custom") $("custom").hidden = true;
    else if (name === "profile") $("profile").hidden = true;
    else if (name === "pfedit") $("pfEditor").hidden = true;
    else if (name === "max") $("max").hidden = true;
    else if (name === "lvlup") { $("lvlup").hidden = true; $("lvlup").removeAttribute("data-t"); celebrating = false; tryCelebrate(); }
    else if (name === "links") $("links").hidden = true;
    else if (name === "menu") closeMenuUI();
    else if (name === "sheet") { $("sheet").hidden = true; $("scrim").hidden = true; }
    else if (name === "icons") { $("iconSheet").hidden = true; $("scrim").hidden = true; $("detail").hidden = true; document.body.classList.remove("dopen"); if (stkIO) stkIO.disconnect(); clearInterval(stkTimer); }
    else if (name === "detail") { $("detail").hidden = true; document.body.classList.remove("dopen"); }
    else if (name === "news") $("news").hidden = true;
    else if (name === "tour") { $("tour").hidden = true; lsSet("tronx.tour", "1"); }
    else if (name === "editor") leaveEditorUI();
    else if (layerHandlers[name]) layerHandlers[name]();
  }
  window.addEventListener("popstate", function (e) {
    var st = e.state, target = (st && st.d) || 0;
    if (st && st.r && !layers.length) {
      /* se llegó a la entrada base: Atrás desde la pantalla principal */
      guardOn = false;
      if (!rootInnerBack()) {
        toast("Tocá Atrás otra vez para salir");
        clearTimeout(guardTimer); guardTimer = setTimeout(function () { if (!layers.length) armGuard(); }, 2200);
      } else armGuard();
      return;
    }
    if (layers.length && !progClose && layers[layers.length - 1] === "max" && target === layers.length - 1 && mxInnerBack()) {
      try { history.pushState({ d: layers.length }, ""); } catch {}
      return;
    }
    while (layers.length > target) closeLayerUI(layers.pop());
  });
  try { history.replaceState({ d: 0, r: 1 }, ""); } catch {}
  armGuard();
  function closeTo(n) {
    var k = layers.length - n;
    if (k <= 0) return;
    progClose = true;
    try { history.go(-k); } catch {}
    setTimeout(function () { while (layers.length > n) closeLayerUI(layers.pop()); progClose = false; }, 160);
  }
  function closeLayer(name) {
    var i = layers.indexOf(name);
    if (i >= 0) closeTo(i); else closeLayerUI(name);
  }

  /* Atrás nativo (Android): el plugin App entrega el evento a la app y ella decide, sin depender del historial del WebView.
     Si no está disponible (versión web o APK anterior) sigue funcionando el historial de arriba. */
  var exitArmed = 0;
  function nativeBack() {
    var lk = $("lock");
    if (lk && !lk.hidden) { exitApp(); return; }
    if (layers.length) {
      var top = layers[layers.length - 1];
      if (top === "max" && mxInnerBack()) return;
      closeLayer(top);
      return;
    }
    if (rootInnerBack()) return;
    if (exitArmed) { exitApp(); return; }
    exitArmed = 1; toast("Tocá Atrás otra vez para salir");
    setTimeout(function () { exitArmed = 0; }, 2200);
  }
  function exitApp() { var ap = capPlugin("App"); try { if (ap && ap.exitApp) ap.exitApp(); } catch {} }
  (function () {
    var ap = capPlugin("App");
    if (ap && ap.addListener) { try { ap.addListener("backButton", nativeBack); } catch {} }
  })();

