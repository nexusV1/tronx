/* Sonido del agujero negro de la pantalla de inicio.
   No usa archivos de audio: se sintetiza con Web Audio al momento (no suma peso a la app).
   Capas: grave profundo, pad oscuro, succión de aire filtrado, brillo de energía y reverberación.
   La intensidad, el paneo y la succión siguen al agujero negro y a las estrellas que absorbe. */
(function () {
  "use strict";
  var SKEY = "tronx.settings.v2";
  var AC = window.AudioContext || window.webkitAudioContext;
  var enabled = true;
  try {
    var raw = localStorage.getItem(SKEY);
    if (raw) { var s = JSON.parse(raw); if (s && s.sound === false) enabled = false; }
  } catch (e) {}

  var ctx = null, voice = null, gestureBound = false, lastUpd = -1;
  var MASTER = 0.16; // volumen general: bajo a propósito (pico cerca de -11 dBFS)

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function noiseBuffer(c, seconds) {
    var n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0; // ruido rosa suave
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    return buf;
  }
  function impulse(c, seconds) {
    var n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n, w = Math.random() * 2 - 1;
        lp += (w - lp) * (0.5 - 0.42 * t); // las altas se apagan antes
        d[i] = lp * Math.pow(1 - t, 2.6);
      }
    }
    return buf;
  }

  /* Construye la voz sobre cualquier contexto (en vivo o fuera de línea para probar). */
  function createVoice(c, dest, when) {
    var t0 = when || 0, nodes = [], srcs = [];
    function keep(n) { nodes.push(n); return n; }
    var master = keep(c.createGain()); master.gain.value = 0;
    var comp = keep(c.createDynamicsCompressor());
    comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.02; comp.release.value = 0.3;
    master.connect(comp); comp.connect(dest);

    var pan = c.createStereoPanner ? keep(c.createStereoPanner()) : null;
    var bus = keep(c.createGain());
    if (pan) { bus.connect(pan); pan.connect(master); } else bus.connect(master);

    var rev = keep(c.createConvolver()); rev.buffer = impulse(c, 2.4);
    var revSend = keep(c.createGain()); revSend.gain.value = 0.55;
    var revOut = keep(c.createGain()); revOut.gain.value = 0.5;
    bus.connect(revSend); revSend.connect(rev); rev.connect(revOut); revOut.connect(master);

    function osc(type, f, detune) {
      var o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune || 0;
      srcs.push(o); return o;
    }
    // 1) grave profundo: dos senos (casi una quinta) con vaivén lento
    var subG = keep(c.createGain()); subG.gain.value = 0;
    var sub1 = osc("sine", 41), sub2 = osc("sine", 61.6, 6), sub3 = osc("sine", 82.4, -4); // el de 82 Hz da cuerpo en parlantes chicos
    var subLfo = osc("sine", 0.17), subLfoG = keep(c.createGain()); subLfoG.gain.value = 0.18;
    var subAmp = keep(c.createGain()); subAmp.gain.value = 0.82;
    var subAmp3 = keep(c.createGain()); subAmp3.gain.value = 0.55;
    sub1.connect(subAmp); sub2.connect(subAmp); subAmp.connect(subAmp3); sub3.connect(subAmp3); subAmp3.connect(subAmp); subAmp.connect(subG);
    subLfo.connect(subLfoG); subLfoG.connect(subAmp.gain);
    var subLp = keep(c.createBiquadFilter()); subLp.type = "lowpass"; subLp.frequency.value = 170; subLp.Q.value = 0.4;
    subG.connect(subLp); subLp.connect(bus);

    // 2) pad oscuro: sierras desafinadas filtradas
    var padG = keep(c.createGain()); padG.gain.value = 0;
    var padLp = keep(c.createBiquadFilter()); padLp.type = "lowpass"; padLp.frequency.value = 260; padLp.Q.value = 0.9;
    [[110, -7], [110, 8], [164.8, 3], [55, 0]].forEach(function (p) {
      var o = osc("sawtooth", p[0], p[1]), g = keep(c.createGain()); g.gain.value = 0.25; o.connect(g); g.connect(padLp);
    });
    padLp.connect(padG); padG.connect(bus);

    // 3) succión: aire filtrado que sube de tono al acercarse
    var nz = c.createBufferSource(); nz.buffer = noiseBuffer(c, 3.2); nz.loop = true; srcs.push(nz);
    var bp = keep(c.createBiquadFilter()); bp.type = "bandpass"; bp.frequency.value = 300; bp.Q.value = 2.4;
    var nzG = keep(c.createGain()); nzG.gain.value = 0;
    nz.connect(bp); bp.connect(nzG); nzG.connect(bus);

    // 4) brillo de energía: dos senos lentos, casi sin volumen, que se pierden en la reverberación
    var enG = keep(c.createGain()); enG.gain.value = 0;
    var e1 = osc("sine", 392), e2 = osc("sine", 587.3, 5), eLfo = osc("sine", 5.2), eLfoG = keep(c.createGain()); eLfoG.gain.value = 0.35;
    var eAmp = keep(c.createGain()); eAmp.gain.value = 0.65;
    e1.connect(eAmp); e2.connect(eAmp); eAmp.connect(enG); eLfo.connect(eLfoG); eLfoG.connect(eAmp.gain);
    enG.connect(bus); enG.connect(revSend);

    srcs.forEach(function (s) { s.start(t0); });
    master.gain.setValueAtTime(0, t0);

    var stopped = false;
    return {
      update: function (level, panV, rate, at, tc) {
        if (stopped) return;
        var L = clamp(level, 0, 1), R = clamp(rate, 0, 1), when2 = at, k = tc || 0.14;
        master.gain.setTargetAtTime(MASTER * Math.pow(L, 0.8), when2, k * 1.4);
        subG.gain.setTargetAtTime(0.55 * L, when2, k);
        sub1.frequency.setTargetAtTime(41 - 7 * L, when2, 0.5);
        sub2.frequency.setTargetAtTime(61.6 - 10 * L, when2, 0.5);
        padG.gain.setTargetAtTime(0.16 * Math.pow(L, 1.2), when2, k);
        padLp.frequency.setTargetAtTime(240 + 520 * L, when2, 0.4);
        bp.frequency.setTargetAtTime(220 + 1500 * Math.pow(L, 1.6), when2, 0.18);
        nzG.gain.setTargetAtTime(0.1 * Math.pow(L, 1.3) * (0.3 + 0.7 * R), when2, 0.12);
        enG.gain.setTargetAtTime(0.03 * L * L * (0.4 + 0.6 * R), when2, 0.25);
        if (pan) pan.pan.setTargetAtTime(clamp(panV, -0.85, 0.85), when2, 0.12);
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

  function bindGesture() {
    if (gestureBound) return; gestureBound = true;
    var go = function () {
      document.removeEventListener("pointerdown", go, true); document.removeEventListener("touchstart", go, true);
      gestureBound = false;
      if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    };
    document.addEventListener("pointerdown", go, true);
    document.addEventListener("touchstart", go, true);
  }

  var api = window.TronxSound = {
    supported: !!AC,
    isEnabled: function () { return enabled; },
    setEnabled: function (on) {
      enabled = !!on;
      try {
        var raw = localStorage.getItem(SKEY), s = raw ? JSON.parse(raw) : {};
        s.sound = enabled; localStorage.setItem(SKEY, JSON.stringify(s));
      } catch (e) {}
      if (!enabled) api.end(true);
    },
    isPlaying: function () { return !!voice; },
    /* Empieza el sonido del evento. Si ya hay uno sonando no empieza otro. */
    begin: function () {
      if (!enabled || !AC || voice) return false;
      try {
        if (!ctx) ctx = new AC({ latencyHint: "playback" });
        if (ctx.state === "suspended") { ctx.resume().catch(function () {}); bindGesture(); }
        voice = createVoice(ctx, ctx.destination, ctx.currentTime);
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
    suspend: function () { if (ctx && ctx.state === "running") { try { ctx.suspend(); } catch (e) {} } },
    resume: function () { if (ctx && ctx.state === "suspended" && voice) { try { ctx.resume(); } catch (e) {} } },
    _createVoice: createVoice
  };
})();
