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
  /* emblemas originales, uno por elemento */
  function elEmblem(id, px) {
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="stroke:none"><defs>', b = "";
    if (id === "fuego") {
      o += '<linearGradient id="elg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd35a"/><stop offset="1" stop-color="#ff3d1f"/></linearGradient></defs>';
      b = '<path d="M50 5C58 24 82 33 82 59C82 79 67 94 50 94C33 94 18 79 18 59C18 46 27 38 33 29C35 40 41 45 46 43C43 30 45 17 50 5Z" fill="url(#elg1)"/><path d="M50 40C55 52 67 57 67 70C67 80 59 88 50 88C41 88 33 80 33 70C33 62 38 58 42 52C44 58 47 60 50 58C49 52 49 46 50 40Z" fill="#fff1b8" opacity=".92"/>';
    } else if (id === "hielo") {
      o += '</defs>'; var ln = "";
      for (var i = 0; i < 3; i++) { var a = i * 60; ln += '<g transform="rotate(' + a + ' 50 50)"><path d="M50 8V92" /><path d="M50 22L41 13M50 22L59 13M50 78L41 87M50 78L59 87M50 38L43 31M50 38L57 31M50 62L43 69M50 62L57 69"/></g>'; }
      b = '<g fill="none" stroke="#bfeeff" stroke-width="4.5" stroke-linecap="round" style="stroke:#bfeeff">' + ln + '</g><path d="M50 36L62 43V57L50 64L38 57V43Z" fill="#e9fbff" opacity=".95"/><circle cx="50" cy="50" r="5" fill="#46bff5"/>';
    } else if (id === "naturaleza") {
      o += '<radialGradient id="elg7" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9ffa8" stop-opacity=".95"/><stop offset="1" stop-color="#7be86a" stop-opacity="0"/></radialGradient><linearGradient id="elg6" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2f18"/><stop offset=".45" stop-color="#9a6a3a"/><stop offset="1" stop-color="#3b2412"/></linearGradient></defs>';
      var leaf = function (x, y, ang, len, wd, col, vein) { return '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (ang + 90).toFixed(1) + ')"><path d="M0 0C' + wd + " " + (-len * 0.3) + " " + wd * 0.6 + " " + (-len * 0.8) + " 0 " + -len + "C" + -wd * 0.6 + " " + (-len * 0.8) + " " + -wd + " " + (-len * 0.3) + ' 0 0Z" fill="' + col + '"/><path d="M0 -1V' + (-len * 0.9).toFixed(1) + '" stroke="' + vein + '" stroke-width=".9" stroke-linecap="round" fill="none" style="stroke:' + vein + '" opacity=".55"/></g>'; };
      var rings = [[13, 20, 9, 15, "#167a47", "#0a4a2a"], [8.5, 17, 7.5, 12, "#2fb264", "#0e6034"], [4, 13, 6, 9, "#7fdc6e", "#1c7a3a"]], t0 = "", r, k;
      b = '<circle cx="50" cy="36" r="36" fill="url(#elg7)" opacity=".55"/>';
      b += '<path d="M44 90C44 78 46 70 47 58H53C54 70 56 78 56 90Z" fill="url(#elg6)"/><path d="M46 88C38 88 30 92 20 91M46 86C40 90 36 94 31 97M54 88C62 88 70 92 80 91M54 86C60 90 64 94 69 97M50 90V97" fill="none" stroke="#7a5230" stroke-width="2.6" stroke-linecap="round" style="stroke:#7a5230"/><path d="M48 62V84" stroke="#d2a066" stroke-width="1.2" stroke-linecap="round" fill="none" style="stroke:#d2a066" opacity=".6"/>';
      for (r = 0; r < 3; r++) for (k = 0; k < rings[r][2] + 5 * (r < 2 ? 1 : 0); k++) { var n = rings[r][2] + 5 * (r < 2 ? 1 : 0), an = k / n * 360 + r * 17, rad = an * Math.PI / 180; t0 += leaf(50 + Math.cos(rad) * rings[r][0], 36 + Math.sin(rad) * rings[r][0], an, rings[r][1] - (k % 2) * 2, rings[r][3] / 2 + (k % 3), rings[r][4], rings[r][5]); }
      b += t0 + '<circle cx="50" cy="36" r="7" fill="url(#elg7)"/><circle cx="14" cy="70" r="1.6" fill="#eaffb0"/><circle cx="87" cy="62" r="2" fill="#eaffb0"/><circle cx="24" cy="12" r="1.4" fill="#eaffb0"/><circle cx="80" cy="14" r="1.6" fill="#eaffb0"/>';
    } else {
      o += '<filter id="elf" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7" result="n"/><feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="3.2" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter><linearGradient id="elg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb23a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient><radialGradient id="elg4" cx=".5" cy=".6" r=".55"><stop offset="0" stop-color="#ffb24a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient></defs>';
      b = '<ellipse cx="50" cy="66" rx="46" ry="32" fill="url(#elg4)"/><g filter="url(#elf)">' +
        '<path d="M6 94L12 74L22 66L28 78L26 94Z" fill="#8a7a66"/>' +
        '<path d="M74 94L72 70L84 62L94 76L96 94Z" fill="#8a7a66"/>' +
        '<path d="M22 94L26 58L34 36L42 12L50 4L58 20L66 38L76 62L80 94Z" fill="#a5937a"/>' +
        '<path d="M34 36L42 12L50 4L48 40L38 52L26 58Z" fill="#cdbba0"/>' +
        '<path d="M50 4L58 20L66 38L60 52L48 40Z" fill="#8a7860"/>' +
        '<path d="M38 52L48 40L60 52L56 94L22 94L26 58Z" fill="#9c8a70"/>' +
        '<path d="M60 52L66 38L76 62L80 94L56 94Z" fill="#6c5d49"/>' +
        '</g>' +
        '<path d="M50 4L42 12L34 36" fill="none" stroke="#fff3d6" stroke-width="1.6" stroke-linejoin="round" style="stroke:#fff3d6" opacity=".75"/>' +
        '<path d="M49 44L53 54L47 62L52 72L48 82L51 92" fill="none" stroke="url(#elg5)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg5)"/>' +
        '<path d="M40 70L44 66M62 66L66 72M60 80L65 84" fill="none" stroke="#ffb23a" stroke-width="2" stroke-linecap="round" style="stroke:#ffb23a" opacity=".85"/>';
    }
    return o + b + "</svg>";
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
    var big = mk("span", "mx-elbig"); big.innerHTML = elEmblem(st.e, 96); hero.appendChild(big);
    hero.appendChild(mk("span", "mx-evch", "TU GUARDIÁN")); hero.appendChild(mk("h2", null, d2.g)); hero.appendChild(mk("em", "mx-elt", d2.t)); hero.appendChild(mk("p", null, d2.d)); hero.appendChild(elTimer("El evento termina el 30 de diciembre")); box.appendChild(hero);
    var nt = mk("div", "mx-evn"); nt.appendChild(mk("span", "mx-evni", "!")); var nb = mk("div"); nb.appendChild(mk("b", null, "Más recompensas en camino")); nb.appendChild(mk("p", null, "Durante el evento se irán sumando misiones, sobres y recompensas de tu elemento. Volvé a revisar con frecuencia.")); nt.appendChild(nb); box.appendChild(nt);
  }
