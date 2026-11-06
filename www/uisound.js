/* Tronx — sonidos de la interfaz (clics, abrir/cerrar el menú, confirmaciones).
   Todo se sintetiza con Web Audio: no hay archivos de audio. Son sonidos muy cortos, pensados para el
   parlante de un celular (energía entre ~500 Hz y 6 kHz) y con un contexto de audio propio de baja
   latencia, así el clic suena al tocar y no un instante después. */
(function () {
  "use strict";
  var SKEY = "tronx.settings.v2";
  var AC = window.AudioContext || window.webkitAudioContext;
  var enabled = true;
  try {
    var raw = localStorage.getItem(SKEY);
    if (raw) { var s = JSON.parse(raw); if (s && s.uiSound === false) enabled = false; }
  } catch (e) {}

  var ctx = null, bus = null, noiseBuf = null, lastAt = 0, pm = 1; // pm: variación de tono por toque (evita que suene siempre idéntico)

  function saveSetting(k, v) {
    try {
      var r = localStorage.getItem(SKEY), o = r ? JSON.parse(r) : {};
      o[k] = v; localStorage.setItem(SKEY, JSON.stringify(o));
    } catch (e) {}
  }
  function getCtx() {
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { ctx = null; } }
    return ctx;
  }
  /* El audio del navegador/WebView puede estar dormido hasta el primer toque: cualquier toque lo despierta. */
  function wake() {
    if (!enabled) return;
    var c = getCtx(); if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
  }
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) { document.addEventListener(ev, wake, { capture: true, passive: true }); });

  function volume() {
    var v = window.TronxSound && window.TronxSound.getVolume ? window.TronxSound.getVolume() : 1;
    return [0.8, 1, 1.35][v] || 1;
  }
  function makeBus(c, dest) {
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
    var out = c.createGain(); out.gain.value = 1.25;
    comp.connect(out); out.connect(dest);
    return comp;
  }
  function noise(c) {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
    var n = Math.floor(c.sampleRate * 0.6), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    var seed = 1234567;
    for (var i = 0; i < n; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = (seed / 4294967296) * 2 - 1; }
    noiseBuf = b; return b;
  }

  /* Pequeños bloques para armar cada sonido */
  function env(c, out, t, peak, attack, decay) {
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(out); return g;
  }
  function tone(c, out, t, type, f0, f1, peak, attack, decay) {
    var o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0 * pm, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1 * pm, t + attack + decay * 0.8);
    o.connect(env(c, out, t, peak, attack, decay));
    o.start(t); o.stop(t + attack + decay + 0.03);
  }
  function hiss(c, out, t, f0, f1, q, peak, attack, decay) {
    var s = c.createBufferSource(); s.buffer = noise(c);
    var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) bp.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
    s.connect(bp); bp.connect(env(c, out, t, peak, attack, decay));
    s.start(t); s.stop(t + attack + decay + 0.03);
  }

  var SOUNDS = {
    /* clic con cuerpo: un chasquido brillante, un "pop" redondo y un golpecito grave que le da peso */
    tap: function (c, o, t, v) {
      hiss(c, o, t, 5200, 3600, 1.2, 0.26 * v, 0.0008, 0.012);
      hiss(c, o, t, 3000, 2200, 0.9, 0.26 * v, 0.001, 0.022);
      tone(c, o, t, "sine", 1650, 540, 0.42 * v, 0.0015, 0.055);
      tone(c, o, t, "triangle", 760, 380, 0.12 * v, 0.002, 0.04);
      tone(c, o, t, "sine", 340, 150, 0.2 * v, 0.002, 0.06);
    },
    /* elegir una opción: dos notas cortas que suben */
    pick: function (c, o, t, v) {
      hiss(c, o, t, 3400, 3000, 1, 0.14 * v, 0.001, 0.015);
      tone(c, o, t, "sine", 988, 0, 0.3 * v, 0.003, 0.11);
      tone(c, o, t + 0.058, "sine", 1319, 0, 0.3 * v, 0.003, 0.16);
      tone(c, o, t + 0.058, "triangle", 2638, 0, 0.05 * v, 0.003, 0.1);
    },
    /* abrir el menú: ráfaga que sube, un golpe grave suave y un acorde brillante */
    open: function (c, o, t, v) {
      hiss(c, o, t, 260, 3400, 1.3, 0.3 * v, 0.17, 0.3);
      tone(c, o, t, "sine", 150, 62, 0.5 * v, 0.004, 0.2);
      tone(c, o, t + 0.1, "triangle", 784, 0, 0.12 * v, 0.02, 0.45);
      tone(c, o, t + 0.13, "triangle", 1175, 0, 0.1 * v, 0.02, 0.45);
      tone(c, o, t + 0.16, "sine", 1568, 0, 0.1 * v, 0.02, 0.5);
    },
    /* cerrar: la ráfaga baja y una nota que cae */
    close: function (c, o, t, v) {
      hiss(c, o, t, 2800, 420, 1.1, 0.34 * v, 0.03, 0.2);
      tone(c, o, t, "sine", 880, 480, 0.42 * v, 0.003, 0.15);
      tone(c, o, t, "triangle", 1320, 660, 0.08 * v, 0.003, 0.12);
    },
    /* logro / guardado: arpegio ascendente */
    confirm: function (c, o, t, v) {
      [659.25, 830.6, 1318.5].forEach(function (f, i) {
        tone(c, o, t + i * 0.062, "sine", f, 0, 0.3 * v, 0.003, 0.2);
        tone(c, o, t + i * 0.062, "triangle", f * 2, 0, 0.05 * v, 0.003, 0.12);
      });
      tone(c, o, t + 0.13, "sine", 2637, 0, 0.06 * v, 0.004, 0.3);
    },
    /* quitar / deshacer: dos notas que bajan, suaves */
    remove: function (c, o, t, v) {
      hiss(c, o, t, 2200, 1200, 1, 0.12 * v, 0.001, 0.02);
      tone(c, o, t, "sine", 784, 0, 0.26 * v, 0.003, 0.1);
      tone(c, o, t + 0.07, "sine", 523, 0, 0.28 * v, 0.003, 0.16);
    }
  };

  function voice(c, dest, t, kind, vol) {
    var fn = SOUNDS[kind] || SOUNDS.tap;
    fn(c, dest, t, vol);
  }
  function jitter(kind) { return (kind === "tap" || kind === "pick") ? 1 + (Math.random() - 0.5) * 0.08 : 1; }

  var api = window.TronxUI = {
    supported: !!AC,
    isEnabled: function () { return enabled; },
    setEnabled: function (on) { enabled = !!on; saveSetting("uiSound", enabled); if (enabled) wake(); },
    state: function () { return ctx ? ctx.state : "sin iniciar"; },
    wake: wake,
    play: function (kind) {
      if (!enabled || !AC) return false;
      var now = performance.now();
      if (now - lastAt < 22) return false; // evita ametrallar si se toca muy rápido
      lastAt = now;
      try {
        var c = getCtx(); if (!c) return false;
        if (c.state === "suspended") { c.resume().catch(function () {}); }
        if (!bus) bus = makeBus(c, c.destination);
        pm = jitter(kind); voice(c, bus, c.currentTime + 0.005, kind, volume()); pm = 1;
        return true;
      } catch (e) { return false; }
    },
    kinds: Object.keys(SOUNDS),
    _voice: function (c, dest, t, kind, vol) { var b = makeBus(c, dest); voice(c, b, t, kind, vol == null ? 1 : vol); }
  };
})();
