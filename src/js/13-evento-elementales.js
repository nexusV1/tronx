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
      o += '<linearGradient id="elg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6ff7a"/><stop offset="1" stop-color="#17a455"/></linearGradient><linearGradient id="elg6" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be86a"/><stop offset="1" stop-color="#0f7a45"/></linearGradient><radialGradient id="elg7" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbc8"/><stop offset="1" stop-color="#fffbc8" stop-opacity="0"/></radialGradient></defs>';
      b = '<path d="M50 94C50 80 49 66 50 52" fill="none" stroke="#6b4a2a" stroke-width="5" stroke-linecap="round" style="stroke:#6b4a2a"/>' +
        '<path d="M50 90C40 90 30 94 20 92M50 88C60 90 70 94 82 91M50 84C44 88 38 90 34 96M50 84C56 88 62 91 68 97" fill="none" stroke="#8a6238" stroke-width="2.4" stroke-linecap="round" style="stroke:#8a6238" opacity=".9"/>' +
        '<path d="M50 56C26 58 8 44 8 22C32 18 50 32 50 56Z" fill="url(#elg6)"/><path d="M50 56C26 44 18 32 12 24" fill="none" stroke="#0b5a33" stroke-width="2" stroke-linecap="round" style="stroke:#0b5a33" opacity=".6"/>' +
        '<path d="M50 52C74 54 92 40 92 18C68 14 50 28 50 52Z" fill="url(#elg3)"/><path d="M50 52C74 40 82 28 88 20" fill="none" stroke="#0b5a33" stroke-width="2" stroke-linecap="round" style="stroke:#0b5a33" opacity=".6"/>' +
        '<path d="M50 54C36 42 36 22 50 6C64 22 64 42 50 54Z" fill="url(#elg3)"/><path d="M50 52V12" fill="none" stroke="#0b5a33" stroke-width="2" stroke-linecap="round" style="stroke:#0b5a33" opacity=".6"/>' +
        '<circle cx="50" cy="24" r="9" fill="url(#elg7)"/><circle cx="22" cy="70" r="2" fill="#eaffb0"/><circle cx="80" cy="66" r="2.4" fill="#eaffb0"/><circle cx="70" cy="40" r="1.6" fill="#eaffb0"/>';
    } else {
      o += '<linearGradient id="elg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3d3b4"/><stop offset="1" stop-color="#6f5d47"/></linearGradient><linearGradient id="elg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff7a1f"/></linearGradient><linearGradient id="elg8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3226"/><stop offset="1" stop-color="#1c1710"/></linearGradient></defs>';
      b = '<path d="M50 3L88 16L88 52C88 74 70 88 50 97C30 88 12 74 12 52L12 16Z" fill="url(#elg4)"/>' +
        '<path d="M50 3L88 16L88 52C88 74 70 88 50 97Z" fill="#000" opacity=".16"/>' +
        '<path d="M50 11L80 21L80 51C80 69 66 80 50 88C34 80 20 69 20 51L20 21Z" fill="url(#elg8)"/>' +
        '<path d="M26 64L40 38L48 48L60 26L74 64Z" fill="#a8957a"/><path d="M60 26L74 64L62 64L56 44Z" fill="#6e5e4a"/><path d="M60 26L66 38L58 36L54 40Z" fill="#f6ecd6"/><path d="M40 38L48 48L42 64L26 64Z" fill="#c9b894"/>' +
        '<path d="M47 66L52 74L47 80" fill="none" stroke="url(#elg5)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="stroke:url(#elg5)"/>' +
        '<path d="M50 3L88 16" fill="none" stroke="#fff3d6" stroke-width="2" style="stroke:#fff3d6" opacity=".7"/>';
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
