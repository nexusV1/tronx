  /* ---------- Evento «Elementales» (16 al 30 de diciembre de 2026) ----------
     Cada persona elige UNA vez su guardián elemental y ya no puede cambiarlo. Todo lo del evento (sobre, núcleo,
     marco, pin y luz de nombre) pertenece al elemento elegido. El evento se activa y se cierra solo por fecha. */
  var EL_START = new Date(2026, 11, 16, 0, 0, 0, 0).getTime(), EL_END = new Date(2026, 11, 30, 23, 59, 59, 999).getTime();
  var EL_LIST = ["fuego", "hielo", "naturaleza", "piedra"];
  var EL = {
    fuego: { g: "Ignar", t: "Guardián del Fuego", k: "Fuego", d: "Representa la fuerza, la pasión y la destrucción. Su poder domina las llamas y consume todo lo que se interpone en su camino." },
    hielo: { g: "Cryon", t: "Guardián del Hielo", k: "Hielo", d: "Representa la calma, la resistencia y el control. Su poder puede congelar cualquier cosa y dominar las temperaturas más extremas." },
    naturaleza: { g: "Sylvar", t: "Guardián de la Naturaleza", k: "Naturaleza", d: "Representa la vida, la renovación y el crecimiento. Su poder controla las plantas, las raíces y la energía natural." },
    piedra: { g: "Terrak", t: "Guardián de la Piedra", k: "Piedra", d: "Representa la fortaleza, la estabilidad y la protección. Su poder domina las rocas, la tierra y los minerales." }
  };
  function elActive() { var n = Date.now(); return n >= EL_START && n <= EL_END; }
  function elGet(m) {
    if (!m.el || typeof m.el !== "object" || Array.isArray(m.el)) m.el = { e: "" };
    if (!EL[m.el.e]) m.el.e = "";
    return m.el;
  }
  /* emblemas originales: misma estructura (marco heráldico + campo interior + motivo central), silueta propia por elemento */
  var EL_PAL = {
    fuego: { rim: ["#e8a050", "#9a3a14", "#4a1408"], f0: "#7a1c0a", f1: "#14040a", gl: "#ff6a1a", dk: "#3a0c04" },
    hielo: { rim: ["#eaf8ff", "#7ac8f5", "#2a6cc0"], f0: "#1c5cb0", f1: "#040e2c", gl: "#5cd0ff", dk: "#0a2c66" },
    naturaleza: { rim: ["#b98a52", "#7a4e26", "#3e2410"], f0: "#2f9a2c", f1: "#06240c", gl: "#9aff5a", dk: "#0e3a16" },
    piedra: { rim: ["#b8a284", "#7e6a52", "#46382a"], f0: "#8a5a2a", f1: "#1c120a", gl: "#ffb24a", dk: "#2c241b" }
  };
  function elPt(r, a) { var t = a * Math.PI / 180; return [50 + r * Math.sin(t), 50 - r * Math.cos(t)]; }
  function elRnd(sd) { return function () { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }; }
  /* anillo exterior decorado e irregular (llamas, cristales, hojas, rocas), con semilla fija para que siempre se vea igual */
  function elDecor(id) {
    var o = "", k, a, h, w, ln, rn = elRnd(id.length * 977 + 13), D = EL_PAL[id].dk, L = ' stroke="' + D + '" stroke-linejoin="round" style="stroke:' + D + '"';
    if (id === "fuego") {
      /* anillo de fuego: lenguas curvas que giran en un solo sentido (silueta distinta a los cristales del hielo) */
      var fT = function (hh, ww, ln2, fill, st) { return '<path d="M' + (-ww) + " 1C" + (-ww) + " -" + (hh * 0.3).toFixed(1) + " " + (-ww * 0.2 + ln2 * 0.25).toFixed(1) + " -" + (hh * 0.52).toFixed(1) + " " + (ln2 * 0.55).toFixed(1) + " -" + (hh * 0.74).toFixed(1) + "C" + (ln2 * 0.95).toFixed(1) + " -" + (hh * 0.88).toFixed(1) + " " + (ln2 * 0.85).toFixed(1) + " -" + (hh * 0.96).toFixed(1) + " " + ln2.toFixed(1) + " -" + hh.toFixed(1) + "C" + (ww * 0.6 + ln2 * 0.3).toFixed(1) + " -" + (hh * 0.6).toFixed(1) + " " + ww + " -" + (hh * 0.3).toFixed(1) + " " + ww + ' 1Z" fill="' + fill + '"' + (st ? L + ' stroke-width=".8"' : "") + "/>"; };
      var rnd2 = elRnd(77), n2 = 16;
      for (k = 0; k < n2; k++) { a = k * 360 / n2 + 360 / n2 / 2; h = 10.5 + (k % 2) * 1.5; w = 4.4; var cl = ["elan-f1", "elan-f2", "elan-f3"][k % 3];
        o += '<g transform="rotate(' + a.toFixed(1) + ' 50 50) translate(50 14)"><g class="' + cl + '">' + fT(h, w, 4.6, "#b81d0a", 1) + fT(h * 0.7, w * 0.68, 3.4, "#ff6a1a", 0) + fT(h * 0.4, w * 0.38, 2.1, "#ffd35a", 0) + "</g></g>"; }
    } else if (id === "hielo") {
      var sh = function (aa, hh, ww, base, c1, c2, lean) { return '<g transform="rotate(' + aa.toFixed(1) + ' 50 50) translate(50 ' + (50 - base) + ') rotate(' + (lean || 0) + ')"><path d="M0 0L' + ww + ' -' + (hh * 0.38).toFixed(1) + 'L0.6 -' + hh.toFixed(1) + 'L-' + ww + ' -' + (hh * 0.38).toFixed(1) + 'Z" fill="' + c1 + '"' + L + ' stroke-width=".7"/><path d="M0 0L' + ww + ' -' + (hh * 0.38).toFixed(1) + 'L0.6 -' + hh.toFixed(1) + 'Z" fill="' + c2 + '"/><path d="M-0.3 -1L-0.3 -' + (hh * 0.78).toFixed(1) + '" stroke="#fff" stroke-width=".45" style="stroke:#fff" opacity=".85"/></g>'; };
      for (k = 0; k < 12; k++) o += sh(k * 30 + 15, 6.5, 2.7, 35.5, "#8fd0f8", "#e4f8ff", 0);
      for (k = 0; k < 12; k++) o += sh(k * 30, 12.5, 3.8, 35.5, "#3a86d8", "#7fc4f5", 0);
    } else if (id === "naturaleza") {
      for (k = 0; k < 34; k++) {
        a = k * 10.6 + (rn() - 0.5) * 5; h = 7.5 + rn() * 4.5; var tl = (k % 2 ? 1 : -1) * (14 + rn() * 28), c = ["#7be86a", "#3fbf4a", "#27a03e", "#52d05a"][k % 4];
        o += '<g transform="rotate(' + (a + tl).toFixed(1) + ' 50 50) translate(50 13.5)"><path d="M0 0C' + (h * 0.4).toFixed(1) + ' -' + (h * 0.25).toFixed(1) + ' ' + (h * 0.46).toFixed(1) + ' -' + (h * 0.7).toFixed(1) + ' 0 -' + h.toFixed(1) + 'C-' + (h * 0.46).toFixed(1) + ' -' + (h * 0.7).toFixed(1) + ' -' + (h * 0.4).toFixed(1) + ' -' + (h * 0.25).toFixed(1) + ' 0 0Z" fill="' + c + '"' + L + ' stroke-width=".7"/><path d="M0 0L0 -' + (h * 0.85).toFixed(1) + '" stroke="#0e5a28" stroke-width=".5" style="stroke:#0e5a28" opacity=".7"/><path d="M0 0C' + (h * 0.4).toFixed(1) + ' -' + (h * 0.25).toFixed(1) + ' ' + (h * 0.46).toFixed(1) + ' -' + (h * 0.7).toFixed(1) + ' 0 -' + h.toFixed(1) + 'L0 0Z" fill="#fff" opacity=".12"/></g>';
      }
    } else {
      var rock = function (cx, cy, sz, c1, c2) { var pp = "", pl = "", q, n = 7, pts = []; for (q = 0; q < n; q++) { var qa = q / n * 6.2832 + rn() * 0.6, qr = sz * (0.7 + 0.5 * rn()); pts.push([cx + Math.cos(qa) * qr, cy + Math.sin(qa) * qr]); pp += (q ? "L" : "M") + pts[q][0].toFixed(1) + " " + pts[q][1].toFixed(1); } pl = "M" + pts[4][0].toFixed(1) + " " + pts[4][1].toFixed(1) + "L" + pts[5][0].toFixed(1) + " " + pts[5][1].toFixed(1) + "L" + pts[6][0].toFixed(1) + " " + pts[6][1].toFixed(1) + "L" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1) + "L" + cx.toFixed(1) + " " + cy.toFixed(1) + "Z"; return '<path d="' + pp + 'Z" fill="' + c1 + '"' + L + ' stroke-width=".9"/><path d="' + pl + '" fill="' + c2 + '" opacity=".55"/>'; };
      o += '<g filter="url(#elf)">';
      for (k = 0; k < 9; k++) { a = k * 40 + 14 + (rn() - 0.5) * 10; h = 10 + rn() * 4; w = 3 + rn() * 1.6; o += '<g transform="rotate(' + a.toFixed(1) + ' 50 50) translate(50 13)"><path d="M-' + w.toFixed(1) + ' 0L-' + (w * 0.6).toFixed(1) + ' -' + (h * 0.7).toFixed(1) + 'L' + (rn() * 1.5).toFixed(1) + ' -' + h.toFixed(1) + 'L' + w.toFixed(1) + ' -' + (h * 0.5).toFixed(1) + 'L' + (w * 0.9).toFixed(1) + ' 0Z" fill="#8a7a66"' + L + ' stroke-width=".9"/><path d="M0 0L' + w.toFixed(1) + ' -' + (h * 0.5).toFixed(1) + 'L0 -' + h.toFixed(1) + 'Z" fill="#cdbba0" opacity=".5"/></g>'; }
      for (k = 0; k < 22; k++) { a = k * 16.4 + (rn() - 0.5) * 6; var rr = 36.6, pt = elPt(rr, a); o += rock(pt[0], pt[1], 4.4 + rn() * 2.2, k % 2 ? "#9c8a70" : "#b4a183", "#e6d8bb"); }
      o += "</g>";
    }
    for (k = 0; k < 4; k++) o += '<g transform="rotate(' + k * 90 + ' 50 50) translate(50 2)"><path d="M0 0L4.2 6.4L0 14L-4.2 6.4Z" fill="url(#elk_' + id.charAt(0) + ')"' + L + ' stroke-width="1"/><path d="M0 1.5L2 6.4L0 11Z" fill="#fff" opacity=".4"/></g>';
    return o;
  }
  /* fondo interior de cada medallón */
  function elBack(id) {
    var o = "", k, rn = elRnd(id.length * 31 + 5), x, y;
    if (id === "fuego") {
      for (k = 0; k < 11; k++) { x = 18 + k * 6.4 + (rn() - 0.5) * 3; var hh = 16 + rn() * 26; o += '<g class="' + ["elan-f1", "elan-f2", "elan-f3"][k % 3] + '"><path d="M' + (x - 5) + ' 84C' + (x - 7) + ' ' + (84 - hh * 0.4) + ' ' + (x - 1) + ' ' + (84 - hh * 0.7) + ' ' + x + ' ' + (84 - hh) + 'C' + (x + 2) + ' ' + (84 - hh * 0.6) + ' ' + (x + 7) + ' ' + (84 - hh * 0.4) + ' ' + (x + 5) + ' 84Z" fill="' + (k % 2 ? "#a8200c" : "#d9320f") + '" opacity=".5"/></g>'; }
      for (k = 0; k < 14; k++) o += '<circle cx="' + (22 + rn() * 56).toFixed(1) + '" cy="' + (20 + rn() * 60).toFixed(1) + '" r="' + (0.5 + rn() * 0.9).toFixed(1) + '" fill="#ffc83a" opacity=".8"/>';
    } else if (id === "hielo") {
      for (k = 0; k < 26; k++) { x = 20 + rn() * 60; y = 20 + rn() * 60; var q = 0.8 + rn() * 1.4; o += (k % 3 === 0 ? '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ') scale(' + (q * 0.55).toFixed(2) + ')"><path class="elan-tw" style="animation-delay:' + (k * 0.23).toFixed(2) + 's" d="M0 -5L1.2 -1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2 -1.2Z" fill="#cfeeff"/></g>' : '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.35 + rn() * 0.7).toFixed(2) + '" fill="#bfe6ff" opacity=".85"/>'); }
      o += '<circle cx="50" cy="50" r="30.5" fill="none" stroke="#7fd0ff" stroke-width="2.4" style="stroke:#7fd0ff" opacity=".22"/>';
    } else if (id === "naturaleza") {
      for (k = 0; k < 9; k++) o += '<path transform="rotate(' + (k * 40 + 10) + ' 50 52)" d="M48 52L50 8L52 52Z" fill="#d9ff7a" opacity=".16"/>';
      o += '<circle cx="50" cy="56" r="26" fill="#9aff5a" opacity=".18"/><path d="M22 70C34 60 44 66 54 62C64 58 72 64 80 58" fill="none" stroke="#b8ff7a" stroke-width="2" stroke-linecap="round" style="stroke:#b8ff7a" opacity=".35"/>';
      for (k = 0; k < 10; k++) o += '<circle cx="' + (22 + rn() * 56).toFixed(1) + '" cy="' + (22 + rn() * 56).toFixed(1) + '" r="' + (0.5 + rn() * 0.9).toFixed(1) + '" fill="#eaffb0" opacity=".8"/>';
    } else {
      o += '<circle cx="50" cy="62" r="30" fill="#ffb24a" opacity=".22"/>';
      for (k = 0; k < 9; k++) { x = 20 + rn() * 60; y = 22 + rn() * 56; var rs = 1.3 + rn() * 2; o += '<path d="M' + (x - rs) + ' ' + y + 'L' + x + ' ' + (y - rs) + 'L' + (x + rs) + ' ' + (y + rs * 0.3) + 'L' + (x - rs * 0.2) + ' ' + (y + rs) + 'Z" fill="#8a7a66" stroke="#2c241b" stroke-width=".5" style="stroke:#2c241b" opacity=".9"/>'; }
    }
    return o;
  }
  /* puño de héroe (compartido por los emblemas): colores por elemento */
  function elFist(c) {
    var O = ' stroke="' + c.o + '" stroke-width="1.7" stroke-linejoin="round" style="stroke:' + c.o + '"', fingers = "", knu = "", i, q, jit = [1, 0.82, 1.08, 0.88, 1.04, 0.84, 1.06, 0.9];
    for (i = 0; i < 4; i++) fingers += '<rect x="' + (22 + i * 14.5) + '" y="40" width="15" height="34" rx="5" fill="' + c.fi[i] + '"' + O + '/>';
    for (i = 0; i < 4; i++) { var kx = 29.5 + i * 14.5, ky = (i === 0 || i === 3 ? 38 : 34), kp = ""; for (q = 0; q < 8; q++) { var kr = 9.6 * jit[(q + i * 3) % 8], ka = q / 8 * 6.2832 + 0.2; kp += (q ? "L" : "M") + (kx + Math.cos(ka) * kr).toFixed(1) + " " + (ky + Math.sin(ka) * kr).toFixed(1); } knu += '<path d="' + kp + 'Z" fill="' + (i === 0 || i === 3 ? c.kn[0] : c.kn[1]) + '"' + O + '/>'; }
    return '<path d="M32 70L68 70L65 98L35 98Z" fill="' + c.fa + '"' + O + '/><path d="M33 84H67" stroke="' + c.o + '" stroke-width="1.4" style="stroke:' + c.o + '" opacity=".6"/>' + fingers + knu + '<path d="M14 66L22 58L52 56L60 63L54 74L22 76Z" transform="rotate(-7 37 66)" fill="' + c.th + '"' + O + '/>';
  }
  function elMotif(id) {
    var b = "", i;
    if (id === "fuego") {
      var LN = ' stroke="#3a0c04" stroke-linejoin="round" style="stroke:#3a0c04"';
      var BL = "M50 6L57 16L57.5 62L42.5 62L43 16Z";
      b = '<ellipse cx="50" cy="40" rx="26" ry="42" fill="url(#elga)"/>';
      /* llama trasera: abraza la hoja */
      b += '<g class="elan-f1"><path d="M50 -8C54 4 62 10 63 24C64 36 66 48 62 62L38 62C34 48 36 36 37 24C38 10 46 4 50 -8Z" fill="url(#elgf)" opacity=".9"/></g><g class="elan-f2"><path d="M38 62C32 54 30 44 33 34C36 41 38 42 40 40C39 34 40 28 43 24L43 62Z" fill="url(#elgf)" opacity=".8"/><path d="M62 62C68 54 70 44 67 34C64 41 62 42 60 40C61 34 60 28 57 24L57 62Z" fill="url(#elgf)" opacity=".8"/></g>';
      /* espada de acero */
      b += '<path d="' + BL + '" fill="url(#elgs)"' + LN + ' stroke-width="1.8"/><path d="M50 6L57 16L57.5 62L50 62Z" fill="#7f8da0" opacity=".45"/>' +
        '<path d="M50 16V58" stroke="#5a6678" stroke-width="2" stroke-linecap="round" style="stroke:#5a6678" opacity=".55"/><path d="M46 20L46.2 58M54 20L53.8 58" stroke="#ffffff" stroke-width=".9" style="stroke:#ffffff" opacity=".75"/>' +
        '<path d="' + BL + '" fill="url(#elgh)"/>' +
        '<g class="elan-cr"><path d="M50 26L52 29L50 32L48 29ZM50 38L52 41L50 44L48 41ZM50 49L52 52L50 55L48 52Z" fill="#ff9a2e"/></g>';
      /* guarda recta con rubí, empuñadura y pomo */
      b += '<path d="M28 60C35 64 41 64 43 63L57 63C59 64 65 64 72 60C71 68 66 72 58 71L42 71C34 72 29 68 28 60Z" fill="url(#elgg)"' + LN + ' stroke-width="1.7"/>' +
        '<path d="M33 63C38 66 42 66 44 65.5M67 63C62 66 58 66 56 65.5" fill="none" stroke="#fff3c4" stroke-width="1" stroke-linecap="round" style="stroke:#fff3c4" opacity=".7"/>' +
        '<circle cx="50" cy="67" r="9" fill="#ffb23a" opacity=".4"/><path d="M50 61L56 67L50 73L44 67Z" fill="url(#elgg)"' + LN + ' stroke-width="1.6"/><path class="elan-cr" d="M50 63.2L53.8 67L50 70.8L46.2 67Z" fill="url(#elgr)"/>' +
        '<path d="M46.5 72L53.5 72L52.7 86L47.3 86Z" fill="#7a1010"' + LN + ' stroke-width="1.6"/><path d="M46.7 76L53.3 75M46.9 80L53.1 79M47.1 84L52.9 83" stroke="#ffc83a" stroke-width="1.1" style="stroke:#ffc83a" opacity=".85"/><circle cx="50" cy="90" r="4.6" fill="url(#elgg)"' + LN + ' stroke-width="1.6"/><circle cx="50" cy="90" r="1.9" fill="url(#elgr)"/>';
      /* llama transparente que arde sobre la hoja: se ve el acero a través */
      b += '<g class="elan-f1"><path d="M50 -2C53 8 59 14 59 26C60 38 58 50 55 60L45 60C42 50 40 38 41 26C41 14 47 8 50 -2Z" fill="url(#elgf)" opacity=".34"/></g>' +
        '<g class="elan-f3"><path d="M50 12C52 21 56 26 56.5 36C57 44 56 52 53 59L47 59C44 52 43 44 43.5 36C44 26 48 21 50 12Z" fill="url(#elgf2)" opacity=".38"/></g>' +
        '<g class="elan-tw"><circle cx="30" cy="24" r="1.5" fill="#ffd35a"/></g><g class="elan-tw" style="animation-delay:.9s"><circle cx="71" cy="18" r="1.4" fill="#ffd35a"/></g><g class="elan-tw" style="animation-delay:1.7s"><circle cx="76" cy="40" r="1.2" fill="#ff9a2e"/></g><g class="elan-tw" style="animation-delay:2.3s"><circle cx="24" cy="42" r="1.3" fill="#ff9a2e"/></g>';
    } else if (id === "hielo") {
      var arms = "", tw = "", sp = "";
      for (i = 0; i < 3; i++) arms += '<g transform="rotate(' + i * 60 + ' 50 50)"><path d="M50 4V96"/><path d="M50 18L38 6M50 18L62 6M50 82L38 94M50 82L62 94M50 32L40 22M50 32L60 22M50 68L40 78M50 68L60 78M50 46L44 40M50 46L56 40M50 54L44 60M50 54L56 60"/></g>';
      for (i = 0; i < 6; i++) sp += '<path transform="rotate(' + (30 + i * 60) + ' 50 50)" d="M50 12L53.5 20L50 29L46.5 20Z" fill="#bfeaff"/>';
      for (i = 0; i < 5; i++) { var tp = [[50, 4], [50, 96], [8, 28], [92, 72], [86, 22]][i]; tw += '<g transform="translate(' + tp[0] + " " + tp[1] + ')"><path class="elan-tw" style="animation-delay:' + (i * 0.6) + 's" d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="#fff"/></g>'; }
      var cs = '<circle cx="50" cy="50" r="20" fill="url(#elgc)"/>', hx = [], hi = [];
      for (i = 0; i < 6; i++) { var ha = i * 60 * Math.PI / 180; hx.push([50 + 13 * Math.sin(ha), 50 - 13 * Math.cos(ha)]); hi.push([50 + 6.4 * Math.sin(ha), 50 - 6.4 * Math.cos(ha)]); }
      for (i = 0; i < 6; i++) { var n2 = (i + 1) % 6; cs += '<path d="M' + hx[i][0].toFixed(1) + " " + hx[i][1].toFixed(1) + "L" + hx[n2][0].toFixed(1) + " " + hx[n2][1].toFixed(1) + "L" + hi[n2][0].toFixed(1) + " " + hi[n2][1].toFixed(1) + "L" + hi[i][0].toFixed(1) + " " + hi[i][1].toFixed(1) + 'Z" fill="' + ["#ffffff", "#9fdcff", "#4aaef0", "#2f86d6", "#4aaef0", "#9fdcff"][i] + '"/>'; }
      cs += '<path d="' + hx.map(function (q, n) { return (n ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + 'Z" fill="none" stroke="#0a3a78" stroke-width="1.6" stroke-linejoin="round" style="stroke:#0a3a78"/>' +
        '<path d="' + hi.map(function (q, n) { return (n ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + 'Z" fill="#eaf9ff" stroke="#9fdcff" stroke-width=".9" stroke-linejoin="round" style="stroke:#9fdcff"/><g class="elan-cr"><circle cx="50" cy="50" r="2.6" fill="#ffffff"/><circle cx="50" cy="50" r="4.6" fill="#bfeaff" opacity=".6"/></g>';
      b = '<g class="elan-sn"><g fill="none" stroke="#0a3a78" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" style="stroke:#0a3a78">' + arms + '</g><g fill="none" stroke="url(#elg2)" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg2)">' + arms + '</g><g fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" style="stroke:#ffffff" opacity=".85">' + arms + '</g>' +
        cs + '</g>' + tw;
    } else if (id === "naturaleza") {
      var leaf = function (x, y, ang, len, wd, col, vein) { return '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (ang + 90).toFixed(1) + ')"><path d="M0 0C' + wd + " " + (-len * 0.3) + " " + wd * 0.6 + " " + (-len * 0.8) + " 0 " + -len + "C" + -wd * 0.6 + " " + (-len * 0.8) + " " + -wd + " " + (-len * 0.3) + ' 0 0Z" fill="' + col + '"/><path d="M0 -1V' + (-len * 0.9).toFixed(1) + '" stroke="' + vein + '" stroke-width=".8" stroke-linecap="round" fill="none" style="stroke:' + vein + '" opacity=".5"/></g>'; };
      var rings = [[17, 21, 15, 16, "#1f8a3a", "#0a4a22"], [11, 18, 12, 14, "#38b848", "#0e6034"], [5, 14, 9, 11, "#8be058", "#1c7a3a"]], r, k, t0 = "";
      for (r = 0; r < 3; r++) for (k = 0; k < rings[r][2]; k++) { var an = k / rings[r][2] * 360 + r * 17, rad = an * Math.PI / 180; t0 += leaf(50 + Math.cos(rad) * rings[r][0], 33 + Math.sin(rad) * rings[r][0] * 0.82, an, rings[r][1] - (k % 2) * 2, rings[r][3] / 2 + (k % 3), rings[r][4], rings[r][5]); }
      b = '<path d="M50 60C40 66 28 72 14 72M50 64C42 72 34 80 26 90M50 64C58 72 66 80 74 90M50 60C60 66 72 72 86 72M50 70C48 80 46 88 40 96M50 70C52 80 54 88 60 96" fill="none" stroke="#2a1608" stroke-width="6" stroke-linecap="round" style="stroke:#2a1608"/><path d="M50 60C40 66 28 72 14 72M50 64C42 72 34 80 26 90M50 64C58 72 66 80 74 90M50 60C60 66 72 72 86 72M50 70C48 80 46 88 40 96M50 70C52 80 54 88 60 96" fill="none" stroke="#a06c3a" stroke-width="3.4" stroke-linecap="round" style="stroke:#a06c3a"/>' +
        '<path d="M41 80C44 72 45 62 45 52L45 44H55L55 52C55 62 56 72 59 80Z" fill="url(#elg6)" stroke="#2a1608" stroke-width="1.6" stroke-linejoin="round" style="stroke:#2a1608"/><path d="M48 50V76M52 52V70" stroke="#c28a4a" stroke-width="1.2" stroke-linecap="round" style="stroke:#c28a4a" opacity=".7"/>' + t0 +
        '<g fill="#e0261f" stroke="#7a0c0c" stroke-width=".8" style="stroke:#7a0c0c"><circle cx="36" cy="28" r="3.2"/><circle cx="64" cy="24" r="3.2"/><circle cx="50" cy="40" r="3.2"/><circle cx="26" cy="44" r="2.8"/><circle cx="74" cy="42" r="2.8"/><circle cx="46" cy="22" r="2.6"/></g><g fill="#fff" opacity=".7"><circle cx="37" cy="29" r=".9"/><circle cx="61" cy="25" r=".9"/><circle cx="49" cy="39" r=".9"/></g>';
    } else {
      b = '<g filter="url(#elf)">' + elFist({ o: "#2c241b", fi: ["#8f7d65", "#9c8a70", "#9c8a70", "#8f7d65"], kn: ["#cdbb9c", "#dccaa8"], th: "#c2b090", fa: "#6a5a47" }) + '</g>' +
        '<path d="M29 27L33 34L28 40M44 22L48 30L43 37M59 23L56 31L61 38" fill="none" stroke="#fff3d6" stroke-width="1.5" stroke-linecap="round" style="stroke:#fff3d6" opacity=".65"/>' +
        '<g class="elan-cr"><path d="M52 44L56 51L52 57M64 46L61 53L65 59M42 80L47 87L44 94" fill="none" stroke="url(#elg5)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg5)"/></g>' +
        '<g filter="url(#elf)"><path d="M12 30L18 24L24 30L19 36Z" fill="#8a7a66" stroke="#2c241b" stroke-width="1.2" style="stroke:#2c241b"/><path d="M80 22L88 20L90 28L83 31Z" fill="#8a7a66" stroke="#2c241b" stroke-width="1.2" style="stroke:#2c241b"/><path d="M84 56L90 52L93 60L86 63Z" fill="#8a7a66" stroke="#2c241b" stroke-width="1.2" style="stroke:#2c241b"/><path d="M8 58L14 55L17 62L10 65Z" fill="#8a7a66" stroke="#2c241b" stroke-width="1.2" style="stroke:#2c241b"/></g>';
    }
    return b;
  }
  function elEmblem(id, px) {
    var p = EL_PAL[id] || EL_PAL.fuego, pre = id.charAt(0), o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="stroke:none"><defs>';
    o += '<linearGradient id="elr_' + pre + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.rim[0] + '"/><stop offset=".5" stop-color="' + p.rim[1] + '"/><stop offset="1" stop-color="' + p.rim[2] + '"/></linearGradient>';
    o += '<linearGradient id="elk_' + pre + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (id === "hielo" ? "#ffffff" : id === "fuego" ? "#ffe08a" : id === "naturaleza" ? "#f3e6a0" : "#e2d6bd") + '"/><stop offset="1" stop-color="' + (id === "hielo" ? "#5ab4ee" : id === "fuego" ? "#d9701a" : id === "naturaleza" ? "#8a6a30" : "#7e6a52") + '"/></linearGradient>';
    o += '<radialGradient id="elfd_' + pre + '" cx=".5" cy=".55" r=".62"><stop offset="0" stop-color="' + p.f0 + '"/><stop offset="1" stop-color="' + p.f1 + '"/></radialGradient>';
    o += '<clipPath id="elc_' + pre + '"><circle cx="50" cy="50" r="31.6"/></clipPath>';
    if (id === "fuego") o += '<linearGradient id="elgs" gradientUnits="userSpaceOnUse" x1="41" y1="0" x2="59" y2="0"><stop offset="0" stop-color="#cfd8e3"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#93a1b4"/></linearGradient><linearGradient id="elgh" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="66"><stop offset="0" stop-color="#ff7a1f" stop-opacity="0"/><stop offset="1" stop-color="#ff3d0f" stop-opacity=".6"/></linearGradient><linearGradient id="elgf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2a0a"/><stop offset=".5" stop-color="#ff7a1f"/><stop offset="1" stop-color="#ffc83a"/></linearGradient><linearGradient id="elgf2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a2e"/><stop offset="1" stop-color="#fff0a8"/></linearGradient><radialGradient id="elga" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb23a" stop-opacity=".6"/><stop offset="1" stop-color="#ff4a10" stop-opacity="0"/></radialGradient><linearGradient id="elgg" gradientUnits="userSpaceOnUse" x1="10" y1="50" x2="90" y2="80"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#f2b53a"/><stop offset="1" stop-color="#b8711a"/></linearGradient><radialGradient id="elgr" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffb0a0"/><stop offset=".35" stop-color="#e01e2a"/><stop offset="1" stop-color="#6a0612"/></radialGradient>';
    else if (id === "hielo") o += '<radialGradient id="elgc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".55" stop-color="#8fd8ff" stop-opacity=".45"/><stop offset="1" stop-color="#5cd0ff" stop-opacity="0"/></radialGradient><linearGradient id="elg2" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#6cc8ff"/></linearGradient>';
    else if (id === "naturaleza") o += '<linearGradient id="elg6" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2f18"/><stop offset=".45" stop-color="#a06c3a"/><stop offset="1" stop-color="#3b2412"/></linearGradient>';
    else o += '<filter id="elf" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7" result="n"/><feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="3.2" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter><linearGradient id="elg5" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="95"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb23a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>';
    o += '</defs>';
    o += elDecor(id);
    /* anillo */
    if (id === "naturaleza") {
      var v1 = "", v2 = "", k, a, r1, r2;
      for (k = 0; k <= 120; k++) { a = k / 120 * 6.2832; r1 = 35 + 2 * Math.sin(a * 9); r2 = 35 - 2 * Math.sin(a * 9); v1 += (k ? "L" : "M") + (50 + r1 * Math.cos(a)).toFixed(1) + " " + (50 + r1 * Math.sin(a)).toFixed(1); v2 += (k ? "L" : "M") + (50 + r2 * Math.cos(a)).toFixed(1) + " " + (50 + r2 * Math.sin(a)).toFixed(1); }
      o += '<path d="' + v1 + 'Z" fill="none" stroke="#2a1608" stroke-width="5.4" style="stroke:#2a1608"/><path d="' + v2 + 'Z" fill="none" stroke="#2a1608" stroke-width="5.4" style="stroke:#2a1608"/><path d="' + v1 + 'Z" fill="none" stroke="#a06c3a" stroke-width="3.4" style="stroke:#a06c3a"/><path d="' + v2 + 'Z" fill="none" stroke="#7a4e26" stroke-width="3.4" style="stroke:#7a4e26"/>';
    } else {
      o += '<circle cx="50" cy="50" r="35" fill="none" stroke="' + p.dk + '" stroke-width="7.2" style="stroke:' + p.dk + '"/><circle cx="50" cy="50" r="35" fill="none" stroke="url(#elr_' + pre + ')" stroke-width="5.2" style="stroke:url(#elr_' + pre + ')"/><circle cx="50" cy="50" r="36.6" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".35"/>';
    }
    o += '<circle cx="50" cy="50" r="32" fill="url(#elfd_' + pre + ')"/>';
    o += '<circle cx="50" cy="50" r="32" fill="none" stroke="' + p.dk + '" stroke-width="1.2" style="stroke:' + p.dk + '"/>';
    o += '<g clip-path="url(#elc_' + pre + ')">' + elBack(id) + '<g transform="' + (id === "fuego" ? "translate(19 19) scale(.62)" : id === "naturaleza" ? "translate(18 18) scale(.64)" : id === "piedra" ? "translate(16 15) scale(.7)" : "translate(20 20) scale(.6)") + '">' + elMotif(id) + "</g></g>";
    o += '<path d="M24 36A28 28 0 0 1 50 20" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" style="stroke:#fff" opacity=".28"/>';
    return o + "</svg>";
  }
  function elTimer(txtOn) {
    var w = mk("div", "mx-cdw"), tt = mk("div", "mx-cdt", "El evento termina el 30 de diciembre"), g = mk("div", "mx-cd"), cells = [];
    ["días", "horas", "minutos", "segundos"].forEach(function (lb) { var c = mk("div"), n = mk("b", null, "00"); c.appendChild(n); c.appendChild(mk("span", null, lb)); g.appendChild(c); cells.push(n); });
    w.appendChild(tt); w.appendChild(g); w.setAttribute("role", "timer"); w.setAttribute("aria-label", "Tiempo restante del evento");
    mxCdAdd(w, function () {
      var ms = Math.max(0, EL_END - Date.now()), t = Math.floor(ms / 1000);
      tt.textContent = ms <= 0 ? "Evento finalizado" : txtOn; cells[0].textContent = Math.floor(t / 86400); cells[1].textContent = two(Math.floor(t % 86400 / 3600)); cells[2].textContent = two(Math.floor(t % 3600 / 60)); cells[3].textContent = two(t % 60);
    });
    return w;
  }
  /* tarjeta de la lista de eventos */
  function mxElCard(box) {
    if (!elActive()) return;
    var ec = mk("button", "mx-evb mx-elb"); ec.type = "button"; ec.appendChild(mk("span", "mx-evch", "EVENTO · ACTIVO")); ec.appendChild(mk("h3", null, "Elementales"));
    ec.appendChild(mk("p", null, "Elegí a tu guardián elemental y reuní núcleos para conseguir recompensas exclusivas."));
    var row = mk("div", "mx-elrow"); EL_LIST.forEach(function (id) { var s = mk("span"); s.setAttribute("data-el", id); s.innerHTML = elEmblem(id, 28); row.appendChild(s); }); ec.appendChild(row);
    var l = mk("div", "mx-cdl"); mxCdAdd(l, function () { var ms = Math.max(0, EL_END - Date.now()), t = Math.floor(ms / 1000); l.textContent = ms <= 0 ? "Evento finalizado" : "Termina en " + Math.floor(t / 86400) + " d " + two(Math.floor(t % 86400 / 3600)) + " h " + two(Math.floor(t % 3600 / 60)) + " min " + two(t % 60) + " s"; }); ec.appendChild(l);
    ec.addEventListener("click", function () { mxEvSel = "el"; mxRender(); var sc = $("mxSc"); if (sc) sc.scrollTop = 0; }); box.appendChild(ec);
  }
  var elPick = "", elSure = false;
  function mxElRender(box, m) {
    var st = elGet(m), bk = mk("button", "mx-evback", "‹ Eventos"); bk.type = "button"; bk.addEventListener("click", function () { mxEvSel = ""; elPick = ""; elSure = false; mxRender(); }); box.appendChild(bk);
    if (!st.e) {
      var hd = mk("div", "mx-evh mx-elh"); hd.appendChild(mk("span", "mx-evch", "EVENTO · ACTIVO")); hd.appendChild(mk("h2", null, "Elementales")); hd.appendChild(mk("p", null, "Cuatro guardianes dominan los elementos. Elegí al tuyo: todas las recompensas del evento serán de su elemento.")); hd.appendChild(elTimer("El evento termina el 30 de diciembre")); box.appendChild(hd);
      var wn = mk("div", "mx-evn"); wn.appendChild(mk("span", "mx-evni", "!")); var wb = mk("div"); wb.appendChild(mk("b", null, "Una sola elección")); wb.appendChild(mk("p", null, "Una vez que elijas a tu guardián no podrás cambiarlo durante el evento.")); wn.appendChild(wb); box.appendChild(wn);
      var gr = mk("div", "mx-elg");
      EL_LIST.forEach(function (id) {
        var d = EL[id], c = mk("button", "mx-elc" + (elPick === id ? " on" : "")); c.type = "button"; c.setAttribute("data-el", id); c.setAttribute("aria-pressed", elPick === id ? "true" : "false");
        var ic = mk("span", "mx-elic"); ic.innerHTML = elEmblem(id, 54); c.appendChild(ic); c.appendChild(mk("b", null, d.g)); c.appendChild(mk("small", null, d.k));
        c.addEventListener("click", function () { elPick = id; elSure = false; mxRender(); }); gr.appendChild(c);
      });
      box.appendChild(gr);
      if (elPick) {
        var d = EL[elPick], card = mk("div", "mx-card mx-eld"); card.setAttribute("data-el", elPick); card.appendChild(mk("b", null, d.g + " · " + d.t)); card.appendChild(mk("p", "mx-note", d.d)); box.appendChild(card);
      }
      var bt = mk("button", "mx-btn mx-elbtn" + (elSure ? " sure" : ""), !elPick ? "Elegí un guardián" : elSure ? "Confirmar: no se puede cambiar" : "Elegir a " + EL[elPick].g); bt.type = "button"; bt.disabled = !elPick || !!m.bk;
      bt.addEventListener("click", function () {
        if (!elPick) return;
        if (!elSure) { elSure = true; mxRender(); return; }
        st.e = elPick; st.t = Date.now(); elPick = ""; elSure = false; maxSave(); toast("Guardián elegido: " + EL[st.e].g); mxRender();
      });
      box.appendChild(bt);
      if (m.bk) box.appendChild(mk("p", "mx-note", "Estás en modo prueba: restablecé tu nivel real para elegir."));
      return;
    }
    var d2 = EL[st.e], hero = mk("div", "mx-evh mx-elh mx-elhero"); hero.setAttribute("data-el", st.e);
    var big = mk("span", "mx-elbig"); big.innerHTML = elEmblem(st.e, 120); hero.appendChild(big);
    hero.appendChild(mk("span", "mx-evch", "TU GUARDIÁN")); hero.appendChild(mk("h2", null, d2.g)); hero.appendChild(mk("em", "mx-elt", d2.t)); hero.appendChild(mk("p", null, d2.d)); hero.appendChild(elTimer("El evento termina el 30 de diciembre")); box.appendChild(hero);
    var nt = mk("div", "mx-evn"); nt.appendChild(mk("span", "mx-evni", "!")); var nb = mk("div"); nb.appendChild(mk("b", null, "Más recompensas en camino")); nb.appendChild(mk("p", null, "Durante el evento se irán sumando misiones, sobres y recompensas de tu elemento. Volvé a revisar con frecuencia.")); nt.appendChild(nb); box.appendChild(nt);
  }
