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
      /* llama curva: sg = +1 se inclina a la derecha, -1 a la izquierda; tres capas (roja, naranja, dorada) */
      var ft = function (x, y, h, sg, cls, rot) {
        var sc = h / 30, o = "", cols = ["#c7200c", "#ff6a1a", "#ffd35a"], sz = [1, 0.66, 0.34], k;
        for (k = 0; k < 3; k++) o += '<path d="M0 0C-8 -8 -6 -20 3 -30C0 -20 9 -14 7 -6C6 -2 3 0 0 0Z" transform="translate(' + x + " " + y + ") rotate(" + (sg * (rot || 0)) + ") scale(" + (sg * sc * sz[k] * 0.8).toFixed(3) + " " + (sc * sz[k]).toFixed(3) + ')" fill="' + cols[k] + '"' + (k === 0 ? LN + ' stroke-width="' + (1.5 / sc).toFixed(2) + '"' : "") + '/>';
        return '<g class="' + cls + '">' + o + "</g>";
      };
      var BL = "M50 1L57.5 12L58.5 66L41.5 66L42.5 12Z";
      b = '<circle cx="50" cy="42" r="48" fill="url(#elga)"/>';
      for (i = 0; i < 12; i++) b += '<path transform="rotate(' + i * 30 + ' 50 42)" d="M48 42L50 -6L52 42Z" fill="#ffd35a" opacity=".13"/>';
      var fan = [[7, 62, 54, "elan-f1"], [20, 64, 50, "elan-f2"], [34, 66, 42, "elan-f3"], [50, 68, 32, "elan-f1"]], fq;
      for (fq = 0; fq < fan.length; fq++) b += ft(50 + 4 + fq * 2, fan[fq][1], fan[fq][2], 1, fan[fq][3], fan[fq][0] + 2) + ft(50 - 4 - fq * 2, fan[fq][1], fan[fq][2], -1, fan[fq][3], fan[fq][0] + 2);
      b += ft(50, 12, 24, 1, "elan-f2", 0);
      /* hoja */
      b += '<path d="' + BL + '" fill="#f3f7fc"' + LN + ' stroke-width="1.9"/><path d="M50 1L57.5 12L58.5 66L50 66Z" fill="#a9b6c8"/><path d="' + BL + '" fill="url(#elgh)"/>' +
        '<path d="M50 10V62" stroke="#5e6c80" stroke-width="2.4" stroke-linecap="round" style="stroke:#5e6c80" opacity=".55"/><path d="M45 14L45.4 62M55 14L54.6 62" stroke="#ffffff" stroke-width=".9" style="stroke:#ffffff" opacity=".7"/>' +
        '<g class="elan-cr"><path d="M50 18L52.4 21L50 24L47.6 21ZM50 29L52.4 32L50 35L47.6 32ZM50 40L52.4 43L50 46L47.6 43ZM50 51L52.4 54L50 57L47.6 54Z" fill="#ffd35a"/></g>';
      /* guarda alada con rubí */
      b += '<path d="M57 63C66 62 76 58 87 47C87 58 82 69 73 74C67 76 62 74 57 72Z" fill="url(#elgg)"' + LN + ' stroke-width="1.8"/><path d="M43 63C34 62 24 58 13 47C13 58 18 69 27 74C33 76 38 74 43 72Z" fill="url(#elgg)"' + LN + ' stroke-width="1.8"/>' +
        '<path d="M60 66C68 64 76 60 83 53M40 66C32 64 24 60 17 53M62 71C69 70 75 66 79 62M38 71C31 70 25 66 21 62" fill="none" stroke="#fff3c4" stroke-width="1.1" stroke-linecap="round" style="stroke:#fff3c4" opacity=".7"/>' +
        '<circle cx="50" cy="68" r="11" fill="#ffb23a" opacity=".5"/>' +
        '<path d="M50 58L59 68L50 79L41 68Z" fill="url(#elgg)"' + LN + ' stroke-width="1.8"/><path class="elan-cr" d="M50 61.5L56 68L50 75.5L44 68Z" fill="url(#elgr)"/><path d="M50 61.5L53 68L50 70L47 68Z" fill="#ffd9d0" opacity=".8"/>';
      /* empuñadura y pomo */
      b += '<path d="M45.5 79L54.5 79L53.5 91L46.5 91Z" fill="#7a1010"' + LN + ' stroke-width="1.7"/><path d="M45.6 82L54.4 80.5M45.9 86L54.1 84.5M46.2 90L53.8 88.6" stroke="#ffc83a" stroke-width="1.2" style="stroke:#ffc83a" opacity=".85"/>' +
        '<circle cx="50" cy="94.5" r="5.2" fill="url(#elgg)"' + LN + ' stroke-width="1.7"/><circle cx="50" cy="94.5" r="2.2" fill="url(#elgr)"/>';
      /* brasas */
      b += '<g class="elan-tw"><circle cx="30" cy="30" r="1.8" fill="#ffd35a"/></g><g class="elan-tw" style="animation-delay:.9s"><circle cx="71" cy="22" r="1.6" fill="#ffd35a"/></g><g class="elan-tw" style="animation-delay:1.6s"><circle cx="80" cy="40" r="1.4" fill="#ff9a2e"/></g><g class="elan-tw" style="animation-delay:2.2s"><circle cx="20" cy="46" r="1.5" fill="#ff9a2e"/></g>';
    } else if (id === "hielo") {
      var arms = "", tw = "";
      for (i = 0; i < 3; i++) arms += '<g transform="rotate(' + i * 60 + ' 50 50)"><path d="M50 3V97"/><path d="M50 17L38 5M50 17L62 5M50 83L38 95M50 83L62 95M50 31L40 21M50 31L60 21M50 69L40 79M50 69L60 79M50 46L44 40M50 46L56 40M50 54L44 60M50 54L56 60"/></g>';
      for (i = 0; i < 4; i++) { var tp = [[50, 3], [50, 97], [10, 27], [90, 73]][i]; tw += '<g transform="translate(' + tp[0] + " " + tp[1] + ')"><path class="elan-tw" style="animation-delay:' + (i * 0.7) + 's" d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="#fff"/></g>'; }
      b = '<g class="elan-sn"><g fill="none" stroke="url(#elg2)" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg2)">' + arms + '</g><path d="M50 40L60 45V55L50 60L40 55V45Z" fill="#e6f8ff"/><circle cx="50" cy="50" r="4.5" fill="#46bff5"/></g>' + tw;
    } else if (id === "naturaleza") {
      b = '<path d="M50 90C48 93 44 96 38 98M50 90C50 94 50 96 50 99M50 90C52 93 56 96 62 98" fill="none" stroke="#9a6a3a" stroke-width="3" stroke-linecap="round" style="stroke:#9a6a3a"/>' +
        '<g class="elan-lf"><path d="M50 91C12 72 10 32 50 3C90 32 88 72 50 91Z" fill="url(#elg3)"/><path d="M50 91C88 72 90 32 50 3Z" fill="#d6ff7a" opacity=".22"/>' +
        '<path d="M50 90V10" fill="none" stroke="#0b5a33" stroke-width="2.6" stroke-linecap="round" style="stroke:#0b5a33" opacity=".7"/>' +
        '<path d="M50 74L28 60M50 62L24 46M50 50L30 34M50 38L36 24M50 74L72 60M50 62L76 46M50 50L70 34M50 38L64 24" fill="none" stroke="#0b5a33" stroke-width="1.8" stroke-linecap="round" style="stroke:#0b5a33" opacity=".5"/>' +
        '<path d="M50 90V10" fill="none" stroke="#e9ffb0" stroke-width=".9" style="stroke:#e9ffb0" opacity=".5" transform="translate(1.6 0)"/>' +
        '<ellipse class="elan-dw" cx="66" cy="34" rx="3" ry="5" transform="rotate(25 66 34)" fill="#f4ffd0"/></g>';
    } else {
      b = '<g filter="url(#elf)">' + elFist({ o: "#2c241b", fi: ["#8f7d65", "#9c8a70", "#9c8a70", "#8f7d65"], kn: ["#cdbb9c", "#dccaa8"], th: "#c2b090", fa: "#6a5a47" }) + '</g>' +
        '<path d="M29 27L33 34L28 40M44 22L48 30L43 37M59 23L56 31L61 38" fill="none" stroke="#fff3d6" stroke-width="1.5" stroke-linecap="round" style="stroke:#fff3d6" opacity=".65"/>' +
        '<g class="elan-cr"><path d="M52 44L56 51L52 57M64 46L61 53L65 59M42 82L47 88L44 94" fill="none" stroke="url(#elg5)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg5)"/></g>';
    }
    return b;
  }
  function elEmblem(id, px) {
    var p = EL_PAL[id] || EL_PAL.fuego, P = elOutline(id), pre = id.charAt(0);
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="stroke:none"><defs>';
    o += '<linearGradient id="elr_' + pre + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.rim[0] + '"/><stop offset=".5" stop-color="' + p.rim[1] + '"/><stop offset="1" stop-color="' + p.rim[2] + '"/></linearGradient>';
    o += '<radialGradient id="elfd_' + pre + '" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="' + p.f0 + '"/><stop offset="1" stop-color="' + p.f1 + '"/></radialGradient>';
    o += '<radialGradient id="elgl_' + pre + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + p.gl + '" stop-opacity=".7"/><stop offset="1" stop-color="' + p.gl + '" stop-opacity="0"/></radialGradient>';
    if (id === "fuego") o += '<linearGradient id="elgh" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="68"><stop offset="0" stop-color="#ff7a1f" stop-opacity="0"/><stop offset=".55" stop-color="#ff7a1f" stop-opacity=".55"/><stop offset="1" stop-color="#ff3d0f" stop-opacity=".95"/></linearGradient><linearGradient id="elgg" gradientUnits="userSpaceOnUse" x1="10" y1="50" x2="90" y2="80"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#f2b53a"/><stop offset="1" stop-color="#b8711a"/></linearGradient><radialGradient id="elgr" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffb0a0"/><stop offset=".35" stop-color="#e01e2a"/><stop offset="1" stop-color="#6a0612"/></radialGradient><radialGradient id="elga" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb23a" stop-opacity=".75"/><stop offset="1" stop-color="#ff4a10" stop-opacity="0"/></radialGradient>';
    else if (id === "hielo") o += '<linearGradient id="elg2" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#7fd8ff"/></linearGradient>';
    else if (id === "naturaleza") o += '<linearGradient id="elg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6f56a"/><stop offset=".55" stop-color="#2fb264"/><stop offset="1" stop-color="#0f6a3a"/></linearGradient>';
    else o += '<filter id="elf" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7" result="n"/><feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="3.2" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter><linearGradient id="elg5" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="95"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb23a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>';
    o += '</defs>';
    var inner = 'transform="translate(7 7) scale(.86)"';
    o += '<path d="' + P + '" fill="url(#elr_' + pre + ')"' + (id === "piedra" ? ' filter="url(#elf)"' : "") + '/>';
    o += '<path d="' + P + '" ' + inner + ' fill="#000" opacity=".35"/>';
    o += '<path d="' + P + '" transform="translate(8 8.6) scale(.84)" fill="url(#elfd_' + pre + ')"/>';
    o += '<path d="' + P + '" transform="translate(8 8.6) scale(.84)" fill="none" stroke="' + p.rim[0] + '" stroke-width=".9" stroke-linejoin="round" style="stroke:' + p.rim[0] + '" opacity=".45"/>';
    o += '<circle cx="50" cy="52" r="34" fill="url(#elgl_' + pre + ')"/>';
    o += '<g transform="' + "translate(13 13) scale(.74)" + '">' + elMotif(id) + '</g>';
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
