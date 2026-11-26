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
    fuego: { rim: ["#fff0a8", "#ff9a2e", "#a81c0a"], f0: "#5a1a08", f1: "#1e0603", gl: "#ff6a1a" },
    hielo: { rim: ["#ffffff", "#9fe4ff", "#2a78cc"], f0: "#0f4a80", f1: "#031325", gl: "#5cd0ff" },
    naturaleza: { rim: ["#f6eaa4", "#62c25a", "#18603a"], f0: "#14602e", f1: "#04180b", gl: "#7be86a" },
    piedra: { rim: ["#e2d6bd", "#9d8d75", "#4a3e31"], f0: "#4a3d2e", f1: "#14100b", gl: "#ffb24a" }
  };
  function elOutline(id) {
    if (id === "fuego") return "M50 2L58 15L66 6L70 21L85 14L82 35C89 52 80 77 50 98C20 77 11 52 18 35L15 14L30 21L34 6L42 15Z";
    if (id === "hielo") return "M50 2L61 16L81 11L79 33L97 50L79 67L81 89L61 84L50 98L39 84L19 89L21 67L3 50L21 33L19 11L39 16Z";
    if (id === "piedra") return "M14 10L36 4L50 9L66 3L86 10L91 34L84 52L91 70L70 88L50 98L30 88L9 70L16 52L9 34Z";
    var d = "", n = 12, k;
    for (k = 0; k < n; k++) { var a0 = (k / n) * 6.2832 - 1.5708, a1 = ((k + 1) / n) * 6.2832 - 1.5708, am = (a0 + a1) / 2, r = 43, rc = 59; d += (k ? "" : "M" + (50 + Math.cos(a0) * r).toFixed(1) + " " + (50 + Math.sin(a0) * r).toFixed(1)) + "Q" + (50 + Math.cos(am) * rc).toFixed(1) + " " + (50 + Math.sin(am) * rc).toFixed(1) + " " + (50 + Math.cos(a1) * r).toFixed(1) + " " + (50 + Math.sin(a1) * r).toFixed(1); }
    return d + "Z";
  }
  function elMotif(id) {
    var b = "", i;
    if (id === "fuego") {
      var fl = "M50 5C58 24 82 33 82 59C82 79 67 94 50 94C33 94 18 79 18 59C18 46 27 38 33 29C35 40 41 45 46 43C43 30 45 17 50 5Z";
      var tf = function (s, dx, col) { return '<path d="' + fl + '" transform="translate(' + (50 * (1 - s) + dx).toFixed(1) + " " + (94 * (1 - s)).toFixed(1) + ") scale(" + s + ')" fill="' + col + '"/>'; };
      b = tf(0.42, -26, "#d62a0f") + tf(0.42, 26, "#d62a0f") + tf(0.3, -32, "#ff8a2a") + tf(0.3, 32, "#ff8a2a") + '<path d="' + fl + '" fill="url(#elg1)"/>' + tf(0.74, 0, "#ff8a1f") + tf(0.5, 0, "#ffc83a") + tf(0.27, 0, "#fff6cf") +
        '<circle cx="30" cy="22" r="1.8" fill="#ffd35a"/><circle cx="72" cy="14" r="1.5" fill="#ffd35a"/><circle cx="82" cy="34" r="1.2" fill="#ffb03a"/><circle cx="16" cy="40" r="1.3" fill="#ffb03a"/>';
    } else if (id === "hielo") {
      var arms = "", sh = "";
      for (i = 0; i < 3; i++) arms += '<g transform="rotate(' + i * 60 + ' 50 50)"><path d="M50 6V94"/><path d="M50 20L40 9M50 20L60 9M50 80L40 91M50 80L60 91M50 36L42 28M50 36L58 28M50 64L42 72M50 64L58 72"/></g>';
      for (i = 0; i < 6; i++) sh += '<path transform="rotate(' + (30 + i * 60) + ' 50 50)" d="M50 8L53 15L50 22L47 15Z" fill="#d9f6ff"/>';
      b = '<g fill="none" stroke="url(#elg2)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg2)">' + arms + '</g>' + sh +
        '<path d="M50 20L63 42L58 66L50 80L42 66L37 42Z" fill="#6cc8f8"/><path d="M50 20L63 42L50 46L37 42Z" fill="#f2fcff"/><path d="M50 46L63 42L58 66L50 80Z" fill="#2f8fe0"/><path d="M50 46L37 42L42 66L50 80Z" fill="#52b8f0"/><path d="M50 28L56 42L50 45L44 42Z" fill="#ffffff" opacity=".85"/><circle cx="50" cy="50" r="2.4" fill="#fff"/>';
    } else if (id === "naturaleza") {
      var leaf = function (x, y, ang, len, wd, col, vein) { return '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (ang + 90).toFixed(1) + ')"><path d="M0 0C' + wd + " " + (-len * 0.3) + " " + wd * 0.6 + " " + (-len * 0.8) + " 0 " + -len + "C" + -wd * 0.6 + " " + (-len * 0.8) + " " + -wd + " " + (-len * 0.3) + ' 0 0Z" fill="' + col + '"/><path d="M0 -1V' + (-len * 0.9).toFixed(1) + '" stroke="' + vein + '" stroke-width=".9" stroke-linecap="round" fill="none" style="stroke:' + vein + '" opacity=".55"/></g>'; };
      var rings = [[13, 20, 9, 15, "#167a47", "#0a4a2a"], [8.5, 17, 7.5, 12, "#2fb264", "#0e6034"], [4, 13, 6, 9, "#7fdc6e", "#1c7a3a"]], r, k, t0 = "";
      b = '<path d="M44 90C44 78 46 70 47 58H53C54 70 56 78 56 90Z" fill="url(#elg6)"/><path d="M46 88C38 88 30 92 20 91M46 86C40 90 36 94 31 97M54 88C62 88 70 92 80 91M54 86C60 90 64 94 69 97M50 90V97" fill="none" stroke="#9a6a3a" stroke-width="2.8" stroke-linecap="round" style="stroke:#9a6a3a"/>';
      for (r = 0; r < 3; r++) { var n = rings[r][2] + (r < 2 ? 5 : 0); for (k = 0; k < n; k++) { var an = k / n * 360 + r * 17, rad = an * Math.PI / 180; t0 += leaf(50 + Math.cos(rad) * rings[r][0], 36 + Math.sin(rad) * rings[r][0], an, rings[r][1] - (k % 2) * 2, rings[r][3] / 2 + (k % 3), rings[r][4], rings[r][5]); } }
      b += t0 + '<circle cx="50" cy="36" r="7" fill="url(#elg7)"/>';
    } else {
      b = '<g filter="url(#elf)"><path d="M8 94L14 74L24 66L30 80L28 94Z" fill="#8a7a66"/><path d="M72 94L70 70L82 62L93 76L94 94Z" fill="#8a7a66"/><path d="M22 94L26 58L34 36L42 12L50 4L58 20L66 38L76 62L80 94Z" fill="#a5937a"/><path d="M34 36L42 12L50 4L48 40L38 52L26 58Z" fill="#cdbba0"/><path d="M50 4L58 20L66 38L60 52L48 40Z" fill="#8a7860"/><path d="M38 52L48 40L60 52L56 94L22 94L26 58Z" fill="#9c8a70"/><path d="M60 52L66 38L76 62L80 94L56 94Z" fill="#6c5d49"/></g>' +
        '<path d="M50 4L42 12L34 36" fill="none" stroke="#fff3d6" stroke-width="1.6" stroke-linejoin="round" style="stroke:#fff3d6" opacity=".75"/><path d="M49 44L53 54L47 62L52 72L48 82L51 92" fill="none" stroke="url(#elg5)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg5)"/>' +
        '<path d="M10 94L14 76L20 94Z" fill="#7fd0ff"/><path d="M14 76L20 94L16 94Z" fill="#2a8fd6"/><path d="M82 94L87 72L93 94Z" fill="#ffb24a"/><path d="M87 72L93 94L89 94Z" fill="#d9701a"/><path d="M78 94L81 82L85 94Z" fill="#ffd27a"/>';
    }
    return b;
  }
  function elEmblem(id, px) {
    var p = EL_PAL[id] || EL_PAL.fuego, P = elOutline(id), pre = id.charAt(0);
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="stroke:none"><defs>';
    o += '<linearGradient id="elr_' + pre + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.rim[0] + '"/><stop offset=".5" stop-color="' + p.rim[1] + '"/><stop offset="1" stop-color="' + p.rim[2] + '"/></linearGradient>';
    o += '<radialGradient id="elfd_' + pre + '" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="' + p.f0 + '"/><stop offset="1" stop-color="' + p.f1 + '"/></radialGradient>';
    o += '<radialGradient id="elgl_' + pre + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + p.gl + '" stop-opacity=".7"/><stop offset="1" stop-color="' + p.gl + '" stop-opacity="0"/></radialGradient>';
    if (id === "fuego") o += '<linearGradient id="elg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb02a"/><stop offset="1" stop-color="#d4200c"/></linearGradient>';
    else if (id === "hielo") o += '<linearGradient id="elg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#7fd8ff"/></linearGradient>';
    else if (id === "naturaleza") o += '<radialGradient id="elg7" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9ffa8" stop-opacity=".95"/><stop offset="1" stop-color="#7be86a" stop-opacity="0"/></radialGradient><linearGradient id="elg6" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2f18"/><stop offset=".45" stop-color="#9a6a3a"/><stop offset="1" stop-color="#3b2412"/></linearGradient>';
    else o += '<filter id="elf" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7" result="n"/><feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="3.2" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter><linearGradient id="elg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb23a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>';
    o += '</defs>';
    var inner = 'transform="translate(7 7) scale(.86)"';
    o += '<path d="' + P + '" fill="url(#elr_' + pre + ')"' + (id === "piedra" ? ' filter="url(#elf)"' : "") + '/>';
    o += '<path d="' + P + '" ' + inner + ' fill="#000" opacity=".35"/>';
    o += '<path d="' + P + '" transform="translate(8 8.6) scale(.84)" fill="url(#elfd_' + pre + ')"/>';
    o += '<path d="' + P + '" transform="translate(8 8.6) scale(.84)" fill="none" stroke="' + p.rim[0] + '" stroke-width=".9" stroke-linejoin="round" style="stroke:' + p.rim[0] + '" opacity=".45"/>';
    o += '<circle cx="50" cy="52" r="34" fill="url(#elgl_' + pre + ')"/>';
    o += '<g transform="' + (id === "piedra" ? "translate(17 22) scale(.66)" : "translate(13 14) scale(.74)") + '">' + elMotif(id) + '</g>';
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
