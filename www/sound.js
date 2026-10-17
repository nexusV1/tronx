/* Sonido del agujero negro de la pantalla de inicio.
   No usa archivos de audio: se sintetiza con Web Audio al momento (no suma peso a la app).
   Está pensado para los parlantes de un celular, que casi no reproducen por debajo de ~150 Hz:
   el grave profundo es solo una capa más, y el cuerpo del sonido está en las frecuencias medias.
   Capas: grave, cuerpo oscuro con pulso lento, succión de aire filtrado, brillo de energía y reverberación.
   La intensidad, el paneo y la succión siguen al agujero negro y a las estrellas que absorbe. */
(function () {
  "use strict";
  var SKEY = "tronx.settings.v2";
  var AC = window.AudioContext || window.webkitAudioContext;
  var enabled = true, volIdx = 1; // 0 normal, 1 alto (por defecto), 2 muy alto
  var VOLS = [0.7, 1.15, 1.8];
  try {
    var raw = localStorage.getItem(SKEY);
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.sound === false) enabled = false;
      if (s && s.soundLvl >= 0 && s.soundLvl <= 2) volIdx = s.soundLvl | 0;
    }
  } catch (e) {}

  var ctx = null, voice = null, previewing = false, gestureBound = false, lastUpd = -1;
  var MASTER = 0.9; // volumen base; compresor + limitador evitan que se pase

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function saveSetting(k, v) {
    try {
      var raw = localStorage.getItem(SKEY), s = raw ? JSON.parse(raw) : {};
      s[k] = v; localStorage.setItem(SKEY, JSON.stringify(s));
    } catch (e) {}
  }

  function noiseBuffer(c, seconds) {
    var n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0; // ruido rosa suave
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
    }
    return buf;
  }
  function impulse(c, seconds) {
    var n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n, w = Math.random() * 2 - 1;
        lp += (w - lp) * (0.55 - 0.45 * t);
        d[i] = lp * Math.pow(1 - t, 2.4);
      }
    }
    return buf;
  }

  /* Construye la voz sobre cualquier contexto (en vivo o fuera de línea para probar). */
  function createVoice(c, dest, when, volMul) {
    var t0 = when || 0, nodes = [], srcs = [];
    function keep(n) { nodes.push(n); return n; }
    var master = keep(c.createGain()); master.gain.value = 0;
    var comp = keep(c.createDynamicsCompressor());
    comp.threshold.value = -30; comp.knee.value = 14; comp.ratio.value = 10; comp.attack.value = 0.006; comp.release.value = 0.3;
    var trim = keep(c.createGain()); trim.gain.value = 2.6; // compensa la compresión: sube el volumen promedio
    // limitador suave: aplasta los picos sin chasquidos, así el sonido puede ir fuerte
    var lim = keep(c.createWaveShaper()), curve = new Float32Array(2048);
    for (var i = 0; i < 2048; i++) { var x = i / 1023.5 - 1; curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); }
    lim.curve = curve;
    var out = keep(c.createGain()); out.gain.value = 0.93;
    master.connect(comp); comp.connect(trim); trim.connect(lim); lim.connect(out); out.connect(dest);

    var pan = c.createStereoPanner ? keep(c.createStereoPanner()) : null;
    var bus = keep(c.createGain());
    if (pan) { bus.connect(pan); pan.connect(master); } else bus.connect(master);

    var rev = keep(c.createConvolver()); rev.buffer = impulse(c, 2.2);
    var revSend = keep(c.createGain()); revSend.gain.value = 0.4;
    var revOut = keep(c.createGain()); revOut.gain.value = 0.55;
    bus.connect(revSend); revSend.connect(rev); rev.connect(revOut); revOut.connect(master);

    function osc(type, f, detune) {
      var o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune || 0;
      srcs.push(o); return o;
    }
    // 1) grave profundo (se siente en auriculares; en parlantes chicos casi no suena)
    var subG = keep(c.createGain()); subG.gain.value = 0;
    var sub1 = osc("sine", 41), sub2 = osc("sine", 61.6, 6), sub3 = osc("sine", 82.4, -4);
    var subMix = keep(c.createGain()); subMix.gain.value = 0.6;
    [sub1, sub2, sub3].forEach(function (o) { o.connect(subMix); });
    subMix.connect(subG);
    var subLp = keep(c.createBiquadFilter()); subLp.type = "lowpass"; subLp.frequency.value = 180; subLp.Q.value = 0.4;
    subG.connect(subLp); subLp.connect(bus);

    // 2) cuerpo: sierras desafinadas con pulso lento (la "rotación" del disco). Vive entre 110 y ~1500 Hz
    var bodyG = keep(c.createGain()); bodyG.gain.value = 0;
    var bodyLp = keep(c.createBiquadFilter()); bodyLp.type = "lowpass"; bodyLp.frequency.value = 500; bodyLp.Q.value = 1.1;
    var bodyAmp = keep(c.createGain()); bodyAmp.gain.value = 0.75;
    [[110, -9], [220, -9], [220, 8], [329.6, 4], [440, -5], [659.3, 7]].forEach(function (p, i) {
      var o = osc("sawtooth", p[0], p[1]), g = keep(c.createGain()); g.gain.value = [0.1, 0.32, 0.32, 0.26, 0.2, 0.1][i];
      o.connect(g); g.connect(bodyLp);
    });
    var pulse = osc("sine", 0.8), pulseG = keep(c.createGain()); pulseG.gain.value = 0.25;
    pulse.connect(pulseG); pulseG.connect(bodyAmp.gain);
    bodyLp.connect(bodyAmp); bodyAmp.connect(bodyG); bodyG.connect(bus);

    // 3) succión: aire filtrado que sube de tono al acercarse (aporta la mayor parte de lo audible en parlantes chicos)
    var nz = c.createBufferSource(); nz.buffer = noiseBuffer(c, 3.2); nz.loop = true; srcs.push(nz);
    var bp = keep(c.createBiquadFilter()); bp.type = "bandpass"; bp.frequency.value = 400; bp.Q.value = 1.0;
    var nzG = keep(c.createGain()); nzG.gain.value = 0;
    nz.connect(bp); bp.connect(nzG); nzG.connect(bus);

    // 4) brillo de energía: tonos que suben con la cercanía y vibran apenas
    var enG = keep(c.createGain()); enG.gain.value = 0;
    var e1 = osc("sine", 392), e2 = osc("sine", 587.3, 5), e3 = osc("sine", 1174.7, -6);
    var eLfo = osc("sine", 5.2), eLfoG = keep(c.createGain()); eLfoG.gain.value = 0.3;
    var eAmp = keep(c.createGain()); eAmp.gain.value = 0.7;
    var e3g = keep(c.createGain()); e3g.gain.value = 0.35;
    e1.connect(eAmp); e2.connect(eAmp); e3.connect(e3g); e3g.connect(eAmp);
    eAmp.connect(enG); eLfo.connect(eLfoG); eLfoG.connect(eAmp.gain);
    enG.connect(bus); enG.connect(revSend);

    srcs.forEach(function (s) { s.start(t0); });
    master.gain.setValueAtTime(0, t0);
    var vm = (volMul || 1) * MASTER;

    var stopped = false;
    return {
      update: function (level, panV, rate, at, tc) {
        if (stopped) return;
        var L = clamp(level, 0, 1), R = clamp(rate, 0, 1), k = tc || 0.14;
        master.gain.setTargetAtTime(vm * Math.pow(L, 0.42), at, k * 1.4);
        subG.gain.setTargetAtTime(0.16 * L, at, k);
        sub1.frequency.setTargetAtTime(41 - 7 * L, at, 0.5);
        sub2.frequency.setTargetAtTime(61.6 - 10 * L, at, 0.5);
        sub3.frequency.setTargetAtTime(82.4 - 12 * L, at, 0.5);
        bodyG.gain.setTargetAtTime(0.62 * Math.pow(L, 1.1), at, k);
        bodyLp.frequency.setTargetAtTime(520 + 1500 * L, at, 0.4);
        pulse.frequency.setTargetAtTime(0.6 + 1.2 * L, at, 0.6);
        bp.frequency.setTargetAtTime(320 + 2600 * Math.pow(L, 1.4), at, 0.18);
        bp.Q.setTargetAtTime(0.9 + 0.8 * L, at, 0.2);
        nzG.gain.setTargetAtTime(1.0 * Math.pow(L, 1.15) * (0.4 + 0.6 * R), at, 0.12);
        enG.gain.setTargetAtTime(0.18 * L * L * (0.4 + 0.6 * R), at, 0.25);
        var up = 1 + 0.28 * L;
        e1.frequency.setTargetAtTime(392 * up, at, 0.4); e2.frequency.setTargetAtTime(587.3 * up, at, 0.4); e3.frequency.setTargetAtTime(1174.7 * up, at, 0.4);
        if (pan) pan.pan.setTargetAtTime(clamp(panV, -0.85, 0.85), at, 0.12);
      },
      stop: function (at, fade) {
        if (stopped) return; stopped = true;
        var f = fade || 1.6;
        master.gain.cancelScheduledValues(at);
        master.gain.setTargetAtTime(0, at, f / 4);
        var endT = at + f + 0.2;
        srcs.forEach(function (s) { try { s.stop(endT); } catch (e) {} });
        return endT;
      },
      nodes: nodes, srcs: srcs
    };
  }

  function getCtx() {
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC({ latencyHint: "playback" }); } catch (e) { ctx = null; } }
    return ctx;
  }
  /* Los navegadores y el WebView de Android pueden dejar el audio dormido hasta el primer toque.
     Por eso el primer toque en cualquier parte de la app lo despierta; así el sonido ya está listo
     cuando pasa el agujero negro. */
  function wake() {
    if (!enabled) return;
    var c = getCtx(); if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    try { // un instante de silencio termina de "desbloquear" el audio
      var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
    } catch (e) {}
  }
  function bindGesture() {
    if (gestureBound || !AC) return; gestureBound = true;
    var go = function () { wake(); };
    ["pointerdown", "touchstart", "touchend", "click", "keydown"].forEach(function (ev) { document.addEventListener(ev, go, { capture: true, passive: true }); });
  }
  bindGesture();

  var api = window.TronxSound = {
    supported: !!AC,
    isEnabled: function () { return enabled; },
    setEnabled: function (on) {
      enabled = !!on; saveSetting("sound", enabled);
      if (!enabled) { api.end(true); } else wake();
    },
    getVolume: function () { return volIdx; },
    setVolume: function (i) { volIdx = clamp(i | 0, 0, 2); saveSetting("soundLvl", volIdx); },
    state: function () { return ctx ? ctx.state : "sin iniciar"; },
    isPlaying: function () { return !!voice; },
    wake: wake,
    /* Empieza el sonido del evento. Si ya hay uno sonando no empieza otro. */
    begin: function () {
      if (!enabled || !AC || voice || previewing) return false;
      try {
        var c = getCtx(); if (!c) return false;
        if (c.state === "suspended") { c.resume().catch(function () {}); }
        voice = createVoice(c, c.destination, c.currentTime, VOLS[volIdx]);
        lastUpd = -1;
        return true;
      } catch (e) { voice = null; return false; }
    },
    /* level 0..1 (cercanía/intensidad), pan -1..1, rate 0..1 (estrellas absorbidas recientemente). */
    update: function (level, pan, rate) {
      if (!voice || !ctx) return;
      var now = ctx.currentTime;
      if (now - lastUpd < 0.05) return;
      lastUpd = now;
      voice.update(level, pan, rate, now, 0.14);
    },
    end: function (fast) {
      if (!voice || !ctx) return;
      var v = voice; voice = null;
      var endT = v.stop(ctx.currentTime, fast ? 0.35 : 1.8);
      setTimeout(function () { try { v.nodes.forEach(function (n) { n.disconnect(); }); } catch (e) {} }, Math.max(300, ((endT || 0) - ctx.currentTime) * 1000 + 300));
    },
    /* Muestra de ~3 segundos para comprobar que se escucha (Ajustes > Probar sonido). Funciona aunque el sonido esté silenciado. */
    preview: function () {
      if (!AC || voice || previewing) return false;
      try {
        var c = getCtx(); if (!c) return false;
        if (c.state === "suspended") { c.resume().catch(function () {}); }
        previewing = true;
        var t = c.currentTime + 0.05, v = createVoice(c, c.destination, t, VOLS[volIdx]);
        for (var i = 0; i <= 30; i++) {
          var p = i / 30, lv = Math.sin(Math.PI * Math.min(1, p * 1.05));
          v.update(lv, -0.6 + 1.2 * p, 0.9 * lv, t + p * 2.8, 0.1);
        }
        var endT = v.stop(t + 2.8, 0.6);
        setTimeout(function () { previewing = false; try { v.nodes.forEach(function (n) { n.disconnect(); }); } catch (e) {} }, (endT - c.currentTime) * 1000 + 300);
        return true;
      } catch (e) { previewing = false; return false; }
    },
    suspend: function () { if (ctx && ctx.state === "running") { try { ctx.suspend(); } catch (e) {} } },
    resume: function () { if (ctx && ctx.state === "suspended" && (voice || previewing)) { try { ctx.resume(); } catch (e) {} } },
    _createVoice: createVoice
  };
})();
