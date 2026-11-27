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
      o += elFireFrame();
    } else if (id === "hielo") {
      var sh = function (aa, hh, ww, base, c1, c2, lean) { return '<g transform="rotate(' + aa.toFixed(1) + ' 50 50) translate(50 ' + (50 - base) + ') rotate(' + (lean || 0) + ')"><path d="M0 0L' + ww + ' -' + (hh * 0.38).toFixed(1) + 'L0.6 -' + hh.toFixed(1) + 'L-' + ww + ' -' + (hh * 0.38).toFixed(1) + 'Z" fill="' + c1 + '"' + L + ' stroke-width=".7"/><path d="M0 0L' + ww + ' -' + (hh * 0.38).toFixed(1) + 'L0.6 -' + hh.toFixed(1) + 'Z" fill="' + c2 + '"/><path d="M-0.3 -1L-0.3 -' + (hh * 0.78).toFixed(1) + '" stroke="#fff" stroke-width=".45" style="stroke:#fff" opacity=".85"/></g>'; };
      for (k = 0; k < 12; k++) o += sh(k * 30 + 15, 6.5, 2.7, 35.5, "#8fd0f8", "#e4f8ff", 0);
      for (k = 0; k < 12; k++) o += sh(k * 30, 12.5, 3.8, 35.5, "#3a86d8", "#7fc4f5", 0);
    } else if (id === "naturaleza") {
      o += elNatFrame();
    } else {
      var rock = function (cx, cy, sz, c1, c2) { var pp = "", pl = "", q, n = 7, pts = []; for (q = 0; q < n; q++) { var qa = q / n * 6.2832 + rn() * 0.6, qr = sz * (0.7 + 0.5 * rn()); pts.push([cx + Math.cos(qa) * qr, cy + Math.sin(qa) * qr]); pp += (q ? "L" : "M") + pts[q][0].toFixed(1) + " " + pts[q][1].toFixed(1); } pl = "M" + pts[4][0].toFixed(1) + " " + pts[4][1].toFixed(1) + "L" + pts[5][0].toFixed(1) + " " + pts[5][1].toFixed(1) + "L" + pts[6][0].toFixed(1) + " " + pts[6][1].toFixed(1) + "L" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1) + "L" + cx.toFixed(1) + " " + cy.toFixed(1) + "Z"; return '<path d="' + pp + 'Z" fill="' + c1 + '"' + L + ' stroke-width=".9"/><path d="' + pl + '" fill="' + c2 + '" opacity=".55"/>'; };
      o += '<g filter="url(#elf)">';
      for (k = 0; k < 9; k++) { a = k * 40 + 14 + (rn() - 0.5) * 10; h = 10 + rn() * 4; w = 3 + rn() * 1.6; o += '<g transform="rotate(' + a.toFixed(1) + ' 50 50) translate(50 13)"><path d="M-' + w.toFixed(1) + ' 0L-' + (w * 0.6).toFixed(1) + ' -' + (h * 0.7).toFixed(1) + 'L' + (rn() * 1.5).toFixed(1) + ' -' + h.toFixed(1) + 'L' + w.toFixed(1) + ' -' + (h * 0.5).toFixed(1) + 'L' + (w * 0.9).toFixed(1) + ' 0Z" fill="#8a7a66"' + L + ' stroke-width=".9"/><path d="M0 0L' + w.toFixed(1) + ' -' + (h * 0.5).toFixed(1) + 'L0 -' + h.toFixed(1) + 'Z" fill="#cdbba0" opacity=".5"/></g>'; }
      for (k = 0; k < 22; k++) { a = k * 16.4 + (rn() - 0.5) * 6; var rr = 36.6, pt = elPt(rr, a); o += rock(pt[0], pt[1], 4.4 + rn() * 2.2, k % 2 ? "#9c8a70" : "#b4a183", "#e6d8bb"); }
      o += "</g>";
    }
    if (id !== "fuego" && id !== "naturaleza") for (k = 0; k < 4; k++) o += '<g transform="rotate(' + k * 90 + ' 50 50) translate(50 2)"><path d="M0 0L4.2 6.4L0 14L-4.2 6.4Z" fill="url(#elk_' + id.charAt(0) + ')"' + L + ' stroke-width="1"/><path d="M0 1.5L2 6.4L0 11Z" fill="#fff" opacity=".4"/></g>';
    return o;
  }
  /* gran follaje detrás del marco de Sylvar: arde en verde alrededor del emblema */
  function elNatBehind() {
    var o = "", k, lf = function (ln, w) { return "M0 0C" + w + " -" + (ln * 0.3).toFixed(1) + " " + (w * 0.7).toFixed(1) + " -" + (ln * 0.8).toFixed(1) + " 0 -" + ln + "C-" + (w * 0.7).toFixed(1) + " -" + (ln * 0.8).toFixed(1) + " -" + w + " -" + (ln * 0.3).toFixed(1) + " 0 0Z"; }, an, sw;
    o += '<circle cx="50" cy="50" r="38.5" fill="#14602a"/><circle cx="50" cy="50" r="38.5" fill="url(#elgna)"/>';
    for (k = 0; k < 30; k++) { an = k * 12; sw = (k % 2 ? 9 : -9);
      o += '<g transform="rotate(' + (an + sw) + ' 50 50) translate(50 18)"><g class="' + (k % 3 === 0 ? "elan-lf" : "") + '"><path d="' + lf(14.2 + (k % 3) * 1.1, 6) + '" fill="#1c7a34" stroke="#0a3a16" stroke-width=".8" stroke-linejoin="round" style="stroke:#0a3a16"/></g></g>'; }
    for (k = 0; k < 30; k++) { an = k * 12 + 6; sw = (k % 2 ? -8 : 8);
      o += '<g transform="rotate(' + (an + sw) + ' 50 50) translate(50 19.5)"><g class="' + (k % 3 === 1 ? "elan-lf" : "") + '"><path d="' + lf(11 + (k % 4) * 0.8, 5.2) + '" fill="' + (k % 2 ? "#4cc455" : "#7fe058") + '" stroke="#0e5a28" stroke-width=".7" stroke-linejoin="round" style="stroke:#0e5a28"/><path d="M0 -1V-' + (9.4 + (k % 4) * 0.8).toFixed(1) + '" stroke="#0e5a28" stroke-width=".6" stroke-linecap="round" fill="none" style="stroke:#0e5a28" opacity=".5"/></g></g>'; }
    var ff = [[50, 5.5, 1.4], [40, 7, 1], [60, 6.4, 1], [30, 12, 0.9], [70, 11, 0.9], [20, 24, 0.8], [80, 22, 0.8], [47, 2.8, 0.7], [54, 3.4, 0.7]];
    for (k = 0; k < ff.length; k++) o += '<g class="elan-tw" style="animation-delay:' + (k * 0.41).toFixed(2) + 's"><circle cx="' + ff[k][0] + '" cy="' + ff[k][1] + '" r="' + (ff[k][2] * 1.9).toFixed(1) + '" fill="#d9ff7a" opacity=".35"/><circle cx="' + ff[k][0] + '" cy="' + ff[k][1] + '" r="' + ff[k][2] + '" fill="#f6ffc0"/></g>';
    return o;
  }
  /* marco de Sylvar: aro de madera tallada con enredadera, aros de oro verde, tres esmeraldas y un escudo con hoja abajo */
  function elNatFrame() {
    var o = "", k, q, a, r, vn = "", D = "#1e0f06";
    o += '<circle cx="50" cy="50" r="41.2" fill="none" stroke="' + D + '" stroke-width="9.4" style="stroke:' + D + '"/><circle cx="50" cy="50" r="41.2" fill="none" stroke="url(#elwb)" stroke-width="7.6" style="stroke:url(#elwb)"/>';
    for (k = 0; k < 18; k++) { a = k * 20 + 4; var g1 = elPt(37.9, a), g2 = elPt(44.4, a + 7); o += '<path d="M' + g1[0].toFixed(1) + " " + g1[1].toFixed(1) + "L" + g2[0].toFixed(1) + " " + g2[1].toFixed(1) + '" stroke="#2a1608" stroke-width=".55" stroke-linecap="round" style="stroke:#2a1608" opacity=".55"/>'; }
    o += '<circle cx="50" cy="50" r="43.6" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".13"/>';
    for (q = 0; q <= 240; q++) { a = q / 240 * 6.2832; r = 41.2 + 1.5 * Math.sin(a * 12); vn += (q ? "L" : "M") + (50 + r * Math.cos(a)).toFixed(2) + " " + (50 + r * Math.sin(a)).toFixed(2); }
    o += '<path d="' + vn + 'Z" fill="none" stroke="#1a3a0c" stroke-width="2.2" style="stroke:#1a3a0c"/><path d="' + vn + 'Z" fill="none" stroke="#9be85a" stroke-width="1" style="stroke:#9be85a"/>';
    for (k = 0; k < 24; k++) { if (k % 6 === 0 || (k === 12)) continue; a = k * 15 + 7.5; var lp = elPt(41.2, a);
      o += '<g transform="translate(' + lp[0].toFixed(1) + " " + lp[1].toFixed(1) + ") rotate(" + (a + (k % 2 ? 62 : -62)) + ')"><path d="M0 0C1.9 -1 2.3 -3 0 -5.4C-2.3 -3 -1.9 -1 0 0Z" fill="' + (k % 2 ? "#5fd04a" : "#9be85a") + '" stroke="#0e3a16" stroke-width=".55" stroke-linejoin="round" style="stroke:#0e3a16"/></g>'; }
    o += '<circle cx="50" cy="50" r="45.7" fill="none" stroke="' + D + '" stroke-width="2.8" style="stroke:' + D + '"/><circle cx="50" cy="50" r="45.7" fill="none" stroke="url(#elgn)" stroke-width="1.7" style="stroke:url(#elgn)"/>';
    o += '<circle cx="50" cy="50" r="34.4" fill="none" stroke="' + D + '" stroke-width="5.6" style="stroke:' + D + '"/><circle cx="50" cy="50" r="34.4" fill="none" stroke="url(#elgn)" stroke-width="4.2" style="stroke:url(#elgn)"/><circle cx="50" cy="50" r="35.2" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".45"/><circle cx="50" cy="50" r="33" fill="none" stroke="#1a4a14" stroke-width=".6" style="stroke:#1a4a14" opacity=".7"/>';
    for (k = 0; k < 4; k++) {
      if (k === 2) continue;
      o += '<g transform="rotate(' + k * 90 + ' 50 50) translate(50 9)"><path d="M0 -7.4L5.6 -3.4L5.6 3.2L0 7.6L-5.6 3.2L-5.6 -3.4Z" fill="url(#elgn)" stroke="' + D + '" stroke-width="1.1" stroke-linejoin="round" style="stroke:' + D + '"/><path d="M0 -5.6L3.8 -2.6L3.8 2.4L0 5.6L-3.8 2.4L-3.8 -2.6Z" fill="#06361a" stroke="#1a4a14" stroke-width=".6" style="stroke:#1a4a14"/><path class="elan-cr" d="M0 -4.4L3 -1.9L3 1.8L0 4.4L-3 1.8L-3 -1.9Z" fill="url(#elge)"/><path d="M-1.6 -2.6L0.4 -3.6L1.2 -2.2L-0.6 -1.2Z" fill="#fff" opacity=".7"/></g>';
    }
    o += '<g transform="translate(50 90.6)"><path d="M-7.4 -7.2H7.4V1.8C7.4 5.8 3.6 8.4 0 10C-3.6 8.4 -7.4 5.8 -7.4 1.8Z" fill="url(#elgn)" stroke="' + D + '" stroke-width="1.2" stroke-linejoin="round" style="stroke:' + D + '"/><path d="M-5.4 -5.2H5.4V1.5C5.4 4.4 2.7 6.3 0 7.6C-2.7 6.3 -5.4 4.4 -5.4 1.5Z" fill="#06361a" stroke="#1a4a14" stroke-width=".6" style="stroke:#1a4a14"/><g class="elan-lf"><path d="M0 4.8C-3.6 3.4 -4.4 -0.8 0 -4.6C4.4 -0.8 3.6 3.4 0 4.8Z" fill="#6fe05a" stroke="#0e5a28" stroke-width=".6" stroke-linejoin="round" style="stroke:#0e5a28"/><path d="M0 4.8V-3.2M0 1L-2 -0.6M0 -0.8L2 -2.4" fill="none" stroke="#0e5a28" stroke-width=".6" stroke-linecap="round" style="stroke:#0e5a28" opacity=".8"/></g><path d="M-4.6 -6L-1.4 -6.2" stroke="#fff" stroke-width=".7" stroke-linecap="round" style="stroke:#fff" opacity=".6"/></g>';
    return o;
  }
  /* gran fuego por detrás del marco: arde alrededor del emblema, con las mismas llamas del centro */
  function elFireBehind() {
    var o = "", k, ft = function (ln, w, lean) { var l1 = lean * 0.5, l2 = lean; return "M" + (-w) + " 2C" + (-w * 1.05) + " -" + (ln * 0.3).toFixed(1) + " " + (-w * 0.3 + l1 * 0.5).toFixed(1) + " -" + (ln * 0.55).toFixed(1) + " " + (l1).toFixed(1) + " -" + (ln * 0.76).toFixed(1) + "C" + (l1 + 0.6).toFixed(1) + " -" + (ln * 0.88).toFixed(1) + " " + (l2 * 0.9).toFixed(1) + " -" + (ln * 0.95).toFixed(1) + " " + l2.toFixed(1) + " -" + ln + "C" + (w * 0.5 + l2 * 0.5).toFixed(1) + " -" + (ln * 0.66).toFixed(1) + " " + (w * 1.05).toFixed(1) + " -" + (ln * 0.3).toFixed(1) + " " + w + " 2Z"; },
      an;
    /* masa de fuego continua detrás del aro y lenguas anchas que suben por todo el contorno */
    o += '<circle cx="50" cy="50" r="38.5" fill="#b81d0a"/><circle cx="50" cy="50" r="38.5" fill="url(#elga)" opacity=".9"/>';
    for (k = 0; k < 13; k++) { an = -120 + k * 20; var lnn = 13 + 3.4 * Math.cos(an * 0.0175), lean = an === 0 ? 0 : (an < 0 ? -3.2 : 3.2); if (k === 6) lean = 2;
      o += '<g transform="rotate(' + an + ' 50 50) translate(50 18)"><g class="' + ["elan-f1", "elan-f2", "elan-f3"][k % 3] + '"><path d="' + ft(lnn, 9.4, lean) + '" fill="url(#elgf)"/><path d="' + ft(lnn * 0.66, 5.6, lean * 0.6) + '" fill="url(#elgf2)" opacity=".92"/></g></g>'; }
    /* chispas que saltan de la punta del fuego */
    var sp = [[50, 6.5, 1.5], [43.5, 7.4, 1], [57, 6.2, 1.1], [47, 3.4, 0.8], [54, 2.6, 0.8], [38, 9.5, 0.7], [62.5, 8.6, 0.7], [29, 15, 0.7], [71.5, 14, 0.7]];
    for (k = 0; k < sp.length; k++) o += '<g class="elan-tw" style="animation-delay:' + (k * 0.37).toFixed(2) + 's"><path transform="translate(' + sp[k][0] + " " + sp[k][1] + ') scale(' + sp[k][2] + ')" d="M0 -2.4L0.6 -0.6L2.4 0L0.6 0.6L0 2.4L-0.6 0.6L-2.4 0L-0.6 -0.6Z" fill="' + (k % 2 ? "#ffd35a" : "#ffe9a8") + '"/></g>';
    return o;
  }
  /* marco de Ignar: banda de obsidiana roja con aros de cobre, cuatro rubíes (el de abajo, un escudo con llama) */
  function elFireFrame() {
    var o = "", k, D = "#2a0a04";
    o += '<circle cx="50" cy="50" r="41.2" fill="none" stroke="' + D + '" stroke-width="9.4" style="stroke:' + D + '"/><circle cx="50" cy="50" r="41.2" fill="none" stroke="url(#elbd)" stroke-width="7.6" style="stroke:url(#elbd)"/>';
    o += '<circle cx="50" cy="50" r="43.6" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".13"/>';
    o += '<circle cx="50" cy="50" r="45.7" fill="none" stroke="' + D + '" stroke-width="2.8" style="stroke:' + D + '"/><circle cx="50" cy="50" r="45.7" fill="none" stroke="url(#elgq)" stroke-width="1.7" style="stroke:url(#elgq)"/>';
    o += '<circle cx="50" cy="50" r="34.4" fill="none" stroke="' + D + '" stroke-width="5.6" style="stroke:' + D + '"/><circle cx="50" cy="50" r="34.4" fill="none" stroke="url(#elgq)" stroke-width="4.2" style="stroke:url(#elgq)"/><circle cx="50" cy="50" r="35.2" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".45"/><circle cx="50" cy="50" r="33" fill="none" stroke="#7a3a08" stroke-width=".6" style="stroke:#7a3a08" opacity=".7"/>';
    for (k = 0; k < 4; k++) {
      if (k === 2) continue;
      o += '<g transform="rotate(' + k * 90 + ' 50 50) translate(50 9)"><path d="M0 -7.4L5.6 -3.4L5.6 3.2L0 7.6L-5.6 3.2L-5.6 -3.4Z" fill="url(#elgq)" stroke="' + D + '" stroke-width="1.1" stroke-linejoin="round" style="stroke:' + D + '"/><path d="M0 -5.6L3.8 -2.6L3.8 2.4L0 5.6L-3.8 2.4L-3.8 -2.6Z" fill="#7a1208" stroke="#7a3a08" stroke-width=".6" style="stroke:#7a3a08"/><path class="elan-cr" d="M0 -4.4L3 -1.9L3 1.8L0 4.4L-3 1.8L-3 -1.9Z" fill="url(#elgr)"/><path d="M-1.6 -2.6L0.4 -3.6L1.2 -2.2L-0.6 -1.2Z" fill="#fff" opacity=".7"/></g>';
    }
    /* escudo con llama (abajo) */
    o += '<g transform="translate(50 90.6)"><path d="M-7.4 -7.2H7.4V1.8C7.4 5.8 3.6 8.4 0 10C-3.6 8.4 -7.4 5.8 -7.4 1.8Z" fill="url(#elgq)" stroke="' + D + '" stroke-width="1.2" stroke-linejoin="round" style="stroke:' + D + '"/><path d="M-5.4 -5.2H5.4V1.5C5.4 4.4 2.7 6.3 0 7.6C-2.7 6.3 -5.4 4.4 -5.4 1.5Z" fill="#4a0c06" stroke="#7a3a08" stroke-width=".6" style="stroke:#7a3a08"/><g class="elan-f2"><path d="M0 -4.6C1.4 -2.6 3.4 -1.4 3.4 1.2C3.4 3.2 1.9 4.6 0 4.6C-1.9 4.6 -3.4 3.2 -3.4 1.2C-3.4 -0.6 -2 -1.2 -1.2 -2.8C-0.8 -1.6 -0.3 -1.4 0 -1.8C-0.2 -2.8 -0.2 -3.8 0 -4.6Z" fill="url(#elgf)"/><path d="M0 -0.6C0.9 0.4 1.7 1 1.7 2.2C1.7 3.2 0.9 3.8 0 3.8C-0.9 3.8 -1.7 3.2 -1.7 2.2C-1.7 1.2 -0.8 0.8 0 -0.6Z" fill="url(#elgf2)"/></g><path d="M-4.6 -6L-1.4 -6.2" stroke="#fff" stroke-width=".7" stroke-linecap="round" style="stroke:#fff" opacity=".6"/></g>';
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
      b = '<ellipse cx="50" cy="38" rx="42" ry="48" fill="url(#elga)"/>';
      /* llama trasera: grande, domina el fondo */
      b += '<g class="elan-f1"><path d="M50 -22C56 -6 72 2 74 20C76 34 80 48 74 64L26 64C20 48 24 34 26 20C28 2 44 -6 50 -22Z" fill="url(#elgf)" opacity=".92"/></g><g class="elan-f2"><path d="M28 64C14 54 10 38 16 20C21 32 27 36 30 34C27 24 29 12 35 4C35 18 40 26 42 34L42 64Z" fill="url(#elgf)" opacity=".85"/><path d="M72 64C86 54 90 38 84 20C79 32 73 36 70 34C73 24 71 12 65 4C65 18 60 26 58 34L58 64Z" fill="url(#elgf)" opacity=".85"/></g><g class="elan-f3"><path d="M50 -10C54 2 62 8 63 22C64 34 66 46 62 62L38 62C34 46 36 34 37 22C38 8 46 2 50 -10Z" fill="url(#elgf2)" opacity=".55"/></g>';
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
      b += '<g class="elan-f1"><path d="M50 -10C55 4 66 10 67 24C68 38 66 50 60 60L40 60C34 50 32 38 33 24C34 10 45 4 50 -10Z" fill="url(#elgf)" opacity=".36"/></g>' +
        '<g class="elan-f3"><path d="M50 6C53 17 60 23 60.5 35C61 45 59 53 55 60L45 60C41 53 39 45 39.5 35C40 23 47 17 50 6Z" fill="url(#elgf2)" opacity=".4"/></g>' +
        '<g class="elan-f2"><path d="M40 60C34 52 33 44 36 36C39 42 41 42 42 40C42 46 44 52 46 60Z" fill="#fff0a8" opacity=".35"/><path d="M60 60C66 52 67 44 64 36C61 42 59 42 58 40C58 46 56 52 54 60Z" fill="#fff0a8" opacity=".35"/></g>' +
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
      var leaf = function (x, y, ang, len, wd, col, vein) { return '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (ang + 90).toFixed(1) + ')"><path d="M0 0C' + wd + " " + (-len * 0.3) + " " + wd * 0.6 + " " + (-len * 0.8) + " 0 " + -len + "C" + -wd * 0.6 + " " + (-len * 0.8) + " " + -wd + " " + (-len * 0.3) + ' 0 0Z" fill="' + col + '" stroke="' + vein + '" stroke-width=".7" stroke-linejoin="round" style="stroke:' + vein + '"/><path d="M0 -1V' + (-len * 0.9).toFixed(1) + '" stroke="' + vein + '" stroke-width=".7" stroke-linecap="round" fill="none" style="stroke:' + vein + '" opacity=".45"/></g>'; };
      var rings = [[25, 18, 22, 11, "#1f8a3a", "#0a4a22"], [18, 16, 17, 10, "#2fae46", "#0e6034"], [11, 14, 12, 9, "#5fd04a", "#157a38"], [4, 11, 8, 7, "#a6ec6a", "#1c7a3a"]], r, k, t0 = "", ap = "";
      for (r = 0; r < 4; r++) for (k = 0; k < rings[r][2]; k++) { var an = k / rings[r][2] * 360 + r * 13, rad = an * Math.PI / 180; t0 += leaf(50 + Math.cos(rad) * rings[r][0] * 1.12, 38 + Math.sin(rad) * rings[r][0] * 0.82, an, rings[r][1] - (k % 2) * 2, rings[r][3] / 2 + (k % 3) * 0.6, rings[r][4], rings[r][5]); }
      [[28, 20], [72, 22], [20, 38], [80, 40], [39, 14], [62, 12], [50, 30], [33, 50], [67, 51]].forEach(function (c) { ap += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.6" fill="#e0261f" stroke="#6a0a0a" stroke-width=".9" style="stroke:#6a0a0a"/><path d="M' + (c[0] - 1.9) + " " + (c[1] - 1.8) + "A2.8 2.8 0 0 1 " + (c[0] + 0.4) + " " + (c[1] - 2.6) + '" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" style="stroke:#fff" opacity=".8"/><path d="M' + c[0] + " " + (c[1] - 3.4) + "L" + (c[0] + 1) + " " + (c[1] - 5) + '" stroke="#3a2412" stroke-width=".9" stroke-linecap="round" style="stroke:#3a2412"/>'; });
      var rt = "M44 80C36 84 26 82 14 90M46 84C42 90 34 90 28 98M56 80C64 84 74 82 86 90M54 84C58 90 66 90 72 98M50 86C50 92 49 96 46 100M50 86C51 92 52 96 55 100";
      b = '<ellipse cx="50" cy="40" rx="42" ry="38" fill="url(#elgna)"/>' +
        '<path d="' + rt + '" fill="none" stroke="#2a1608" stroke-width="6.4" stroke-linecap="round" style="stroke:#2a1608"/><path d="' + rt + '" fill="none" stroke="#a06c3a" stroke-width="3.6" stroke-linecap="round" style="stroke:#a06c3a"/><path d="' + rt + '" fill="none" stroke="#d9a468" stroke-width=".9" stroke-linecap="round" style="stroke:#d9a468" opacity=".6"/>' +
        '<path d="M45 50C38 44 30 42 24 34M55 50C62 44 70 42 76 34M48 46C46 38 42 32 40 26M52 46C54 38 58 32 60 26" fill="none" stroke="#2a1608" stroke-width="5" stroke-linecap="round" style="stroke:#2a1608"/><path d="M45 50C38 44 30 42 24 34M55 50C62 44 70 42 76 34M48 46C46 38 42 32 40 26M52 46C54 38 58 32 60 26" fill="none" stroke="#a06c3a" stroke-width="2.6" stroke-linecap="round" style="stroke:#a06c3a"/>' +
        '<path d="M39 84C43 76 44 66 43.5 56C43 50 44 46 45 40L55 40C56 46 57 50 56.5 56C56 66 57 76 61 84Z" fill="url(#elg6)" stroke="#2a1608" stroke-width="1.8" stroke-linejoin="round" style="stroke:#2a1608"/><path d="M47.5 48C46 58 47 70 45 80M52.5 50C54 60 53 70 55.5 80M50 54V72" fill="none" stroke="#2a1608" stroke-width=".9" stroke-linecap="round" style="stroke:#2a1608" opacity=".55"/><path d="M46.5 44V74" stroke="#d9a468" stroke-width="1.2" stroke-linecap="round" style="stroke:#d9a468" opacity=".6"/>' + t0 + ap +
        '<g class="elan-tw"><circle cx="30" cy="30" r="1.3" fill="#f6ffc0"/></g><g class="elan-tw" style="animation-delay:.9s"><circle cx="70" cy="26" r="1.2" fill="#f6ffc0"/></g><g class="elan-tw" style="animation-delay:1.7s"><circle cx="56" cy="8" r="1.1" fill="#f6ffc0"/></g>';
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
    if (id === "fuego") o += '<linearGradient id="elbd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a1608"/><stop offset=".5" stop-color="#3e0b05"/><stop offset="1" stop-color="#6a1208"/></linearGradient><linearGradient id="elgq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset=".35" stop-color="#ff8a2a"/><stop offset=".7" stop-color="#b8300c"/><stop offset="1" stop-color="#ff9a2e"/></linearGradient><linearGradient id="elgs" gradientUnits="userSpaceOnUse" x1="41" y1="0" x2="59" y2="0"><stop offset="0" stop-color="#cfd8e3"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#93a1b4"/></linearGradient><linearGradient id="elgh" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="66"><stop offset="0" stop-color="#ff7a1f" stop-opacity="0"/><stop offset="1" stop-color="#ff3d0f" stop-opacity=".6"/></linearGradient><linearGradient id="elgf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2a0a"/><stop offset=".5" stop-color="#ff7a1f"/><stop offset="1" stop-color="#ffc83a"/></linearGradient><linearGradient id="elgf2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a2e"/><stop offset="1" stop-color="#fff0a8"/></linearGradient><radialGradient id="elga" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb23a" stop-opacity=".6"/><stop offset="1" stop-color="#ff4a10" stop-opacity="0"/></radialGradient><linearGradient id="elgg" gradientUnits="userSpaceOnUse" x1="10" y1="50" x2="90" y2="80"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#f2b53a"/><stop offset="1" stop-color="#b8711a"/></linearGradient><radialGradient id="elgr" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffb0a0"/><stop offset=".35" stop-color="#e01e2a"/><stop offset="1" stop-color="#6a0612"/></radialGradient>';
    else if (id === "hielo") o += '<radialGradient id="elgc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".55" stop-color="#8fd8ff" stop-opacity=".45"/><stop offset="1" stop-color="#5cd0ff" stop-opacity="0"/></radialGradient><linearGradient id="elg2" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#6cc8ff"/></linearGradient>';
    else if (id === "naturaleza") o += '<linearGradient id="elwb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a2a"/><stop offset=".5" stop-color="#4a2a12"/><stop offset="1" stop-color="#7a4a22"/></linearGradient><linearGradient id="elgn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ffb0"/><stop offset=".35" stop-color="#8fe05a"/><stop offset=".7" stop-color="#2a8a3a"/><stop offset="1" stop-color="#c6f070"/></linearGradient><radialGradient id="elge" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d8ffc0"/><stop offset=".4" stop-color="#1fc050"/><stop offset="1" stop-color="#064a1c"/></radialGradient><radialGradient id="elgna" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#b8ff7a" stop-opacity=".5"/><stop offset="1" stop-color="#2a9a3a" stop-opacity="0"/></radialGradient><linearGradient id="elg6" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2f18"/><stop offset=".45" stop-color="#a06c3a"/><stop offset="1" stop-color="#3b2412"/></linearGradient>';
    else o += '<filter id="elf" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7" result="n"/><feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="3.2" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter><linearGradient id="elg5" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="95"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb23a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>';
    o += '</defs>';
    if (id === "fuego") o += elFireBehind() + '<g transform="translate(14 14.5) scale(.72)">';
    if (id === "naturaleza") o += elNatBehind() + '<g transform="translate(14 14.5) scale(.72)">';
    o += elDecor(id);
    /* anillo */
    if (id !== "fuego" && id !== "naturaleza") {
      o += '<circle cx="50" cy="50" r="35" fill="none" stroke="' + p.dk + '" stroke-width="7.2" style="stroke:' + p.dk + '"/><circle cx="50" cy="50" r="35" fill="none" stroke="url(#elr_' + pre + ')" stroke-width="5.2" style="stroke:url(#elr_' + pre + ')"/><circle cx="50" cy="50" r="36.6" fill="none" stroke="#fff" stroke-width=".7" style="stroke:#fff" opacity=".35"/>';
    }
    o += '<circle cx="50" cy="50" r="32" fill="url(#elfd_' + pre + ')"/>';
    o += '<circle cx="50" cy="50" r="32" fill="none" stroke="' + p.dk + '" stroke-width="1.2" style="stroke:' + p.dk + '"/>';
    o += '<g clip-path="url(#elc_' + pre + ')">' + elBack(id) + '<g transform="' + (id === "fuego" ? "translate(19 19) scale(.62)" : id === "naturaleza" ? "translate(18 18) scale(.64)" : id === "piedra" ? "translate(16 15) scale(.7)" : "translate(20 20) scale(.6)") + '">' + elMotif(id) + "</g></g>";
    o += '<path d="M24 36A28 28 0 0 1 50 20" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" style="stroke:#fff" opacity=".28"/>';
    return o + (id === "fuego" || id === "naturaleza" ? "</g>" : "") + "</svg>";
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
