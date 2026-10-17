/* Stickers de Tronx: dibujos originales en SVG (sin imágenes), con animaciones livianas.
   - Los degradados y recortes se definen una sola vez en un "sprite" oculto.
   - En las tarjetas, el editor y el selector se insertan como SVG y se animan con CSS (solo transform y opacity).
   - La marca de agua de las tarjetas usa <use> y no se anima.
   - Las animaciones se encienden con la clase "anim" y se apagan con "reducir animaciones". */
(function () {
  "use strict";
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function f(n) { return Math.round(n * 100) / 100; }
  // estrellitas sueltas que titilan
  function dots(seed, n, area, fills) {
    var r = rnd(seed), out = "";
    for (var i = 0; i < n; i++) {
      var x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]), rad = 0.45 + r() * 0.85;
      out += '<circle class="k-tw t' + (i % 4) + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(rad) + '" fill="' + fills[i % fills.length] + '"/>';
    }
    return out;
  }
  function spark(x, y, s, cls, fill) {
    s = s || 3;
    return '<path class="' + (cls || "k-tw t1") + '" d="M' + x + " " + (y - s) + "Q" + (x + s * 0.18) + " " + (y - s * 0.18) + " " + (x + s) + " " + y + "Q" + (x + s * 0.18) + " " + (y + s * 0.18) + " " + x + " " + (y + s) + "Q" + (x - s * 0.18) + " " + (y + s * 0.18) + " " + (x - s) + " " + y + "Q" + (x - s * 0.18) + " " + (y - s * 0.18) + " " + x + " " + (y - s) + 'z" fill="' + (fill || "#fff") + '"/>';
  }

  /* ---- galaxia: dos brazos en espiral hechos de trazos y polvo de estrellas ---- */
  function galaxy() {
    var arms = "", sd = rnd(11), a, i;
    for (a = 0; a < 2; a++) {
      var base = a * Math.PI, pts = [];
      for (var r = 2.6; r <= 28.5; r += 1.1) { var th = base + 1.9 * Math.log(r / 2.6); pts.push(f(32 + r * Math.cos(th)) + " " + f(32 + r * Math.sin(th))); }
      var d = "M" + pts.join("L");
      arms += '<path d="' + d + '" fill="none" stroke="url(#tg-arm)" stroke-width="7.5" stroke-linecap="round" opacity=".2"/>' +
              '<path d="' + d + '" fill="none" stroke="url(#tg-arm)" stroke-width="4" stroke-linecap="round" opacity=".5"/>' +
              '<path d="' + d + '" fill="none" stroke="#f1e8ff" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>';
      for (i = 0; i < 16; i++) {
        var rr = 5 + i * 1.5 + sd() * 1.2, tt = base + 1.9 * Math.log(rr / 2.6) + (sd() - 0.5) * 0.55;
        arms += '<circle cx="' + f(32 + rr * Math.cos(tt)) + '" cy="' + f(32 + rr * Math.sin(tt)) + '" r="' + f(0.5 + sd() * 0.7) + '" fill="' + (i % 3 ? "#ffffff" : "#bfe6ff") + '"/>';
      }
    }
    return '<ellipse cx="32" cy="32" rx="30" ry="14" transform="rotate(-20 32 32)" fill="url(#tg-glow)" opacity=".55"/>' +
      '<g transform="rotate(-20 32 32)"><g transform="translate(32 32) scale(1 .66) translate(-32 -32)"><g class="k-spin">' + arms + "</g></g></g>" +
      '<circle class="k-pulse" cx="32" cy="32" r="9" fill="url(#tg-core)"/><circle cx="32" cy="32" r="3" fill="#fff"/>' +
      dots(5, 5, [4, 4, 60, 60], ["#fff", "#dcd0ff"]);
  }
  function constellation() {
    var pts = [[10, 47], [21, 23], [37, 31], [54, 12], [46, 52]], d = "M10 47L21 23 37 31 54 12M37 31L46 52", out = "";
    out += '<path d="' + d + '" fill="none" stroke="#9f86ff" stroke-opacity=".28" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';
    out += '<path class="k-dash" d="' + d + '" fill="none" stroke="#d9ccff" stroke-opacity=".85" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="2 3.2"/>';
    pts.forEach(function (p, i) {
      out += '<g class="k-tw t' + i % 4 + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="url(#tg-glow)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (3 + (i % 2) * 0.8) + '" fill="url(#tg-star)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3" fill="#fff"/></g>';
    });
    return out + dots(8, 8, [3, 3, 61, 61], ["#fff", "#cdbfff"]);
  }

  var STICKERS = [
    { id: "galaxia", n: "Galaxia", svg: galaxy() },
    { id: "estrella", n: "Estrella", svg:
      '<circle class="k-pulse" cx="32" cy="32" r="24" fill="url(#tg-glow)" opacity=".6"/>' +
      '<g class="k-spin-slow"><g transform="translate(32 32) rotate(45) scale(.55) translate(-32 -32)"><path d="M32 3Q34 30 61 32Q34 34 32 61Q30 34 3 32Q30 30 32 3Z" fill="url(#tg-star2)" opacity=".85"/></g></g>' +
      '<g class="k-beat"><path d="M32 2Q34.2 29.8 62 32Q34.2 34.2 32 62Q29.8 34.2 2 32Q29.8 29.8 32 2Z" fill="url(#tg-star)"/>' +
      '<path d="M32 2Q34.2 29.8 62 32Q34.2 34.2 32 62" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/></g>' +
      '<circle cx="32" cy="32" r="4.2" fill="#fff"/><circle cx="32" cy="32" r="8" fill="url(#tg-core)"/>' +
      spark(11, 12, 3.2, "k-tw t1") + spark(54, 52, 2.8, "k-tw t2") + spark(52, 11, 2, "k-tw t3", "#ffe9a8") },
    { id: "planeta", n: "Planeta con anillos", svg:
      '<circle class="k-pulse" cx="32" cy="33" r="25" fill="url(#tg-glow)" opacity=".35"/>' +
      '<g class="k-sway"><g transform="translate(32 33) rotate(-18)">' +
      '<path d="M-28 0A28 9 0 0 1 28 0" fill="none" stroke="url(#tg-ring)" stroke-width="3.6" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M-23.5 0A23.5 7.2 0 0 1 23.5 0" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1"/></g>' +
      '<circle cx="32" cy="33" r="14.5" fill="url(#tg-planet)"/>' +
      '<g clip-path="url(#tg-sph)"><path d="M14 27c10 3.2 24 2.4 37-2" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.6"/>' +
      '<path d="M15 34c10 3 22 2.600 33-1.600" fill="none" stroke="#2a1470" stroke-opacity=".28" stroke-width="2.4"/>' +
      '<path d="M17 41c8 2.400 18 1.800 27-1.800" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>' +
      '<circle cx="42" cy="42" r="19" fill="#12063d" opacity=".42"/></g>' +
      '<ellipse cx="26.500" cy="26.500" rx="4.500" ry="2.800" transform="rotate(-35 26.500 26.500)" fill="#fff" opacity=".45"/>' +
      '<g transform="translate(32 33) rotate(-18)"><path d="M-28 0A28 9 0 0 0 28 0" fill="none" stroke="url(#tg-ring)" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path class="k-dash" d="M-23.500 0A23.500 7.200 0 0 0 23.500 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-dasharray="3 3"/></g></g>' +
      dots(21, 5, [3, 3, 61, 61], ["#fff", "#dcd0ff"]) },
    { id: "nebulosa", n: "Nebulosa", svg:
      '<g class="k-d1"><ellipse cx="23" cy="30" rx="21" ry="16" fill="url(#tg-nb1)"/></g>' +
      '<g class="k-d2"><ellipse cx="42" cy="26" rx="20" ry="15" fill="url(#tg-nb2)"/></g>' +
      '<g class="k-d3"><ellipse cx="35" cy="42" rx="22" ry="14" fill="url(#tg-nb3)"/></g>' +
      '<g class="k-d2"><ellipse cx="14" cy="46" rx="13" ry="9" fill="url(#tg-nb4)"/></g>' +
      '<ellipse cx="32" cy="34" rx="26" ry="4.500" transform="rotate(-24 32 34)" fill="url(#tg-dust)"/>' +
      '<circle cx="31" cy="30" r="9" fill="url(#tg-core)" opacity=".8"/><circle cx="31" cy="30" r="2.300" fill="#fff"/>' +
      dots(31, 13, [4, 4, 60, 60], ["#fff", "#e9defe", "#bfe6ff"]) + spark(50, 14, 2.600, "k-tw t2") },
    { id: "luna", n: "Luna cósmica", svg:
      '<circle class="k-pulse" cx="30" cy="34" r="27" fill="url(#tg-glow)" opacity=".45"/>' +
      '<g class="k-sway"><path d="M43 6A26 26 0 1 0 57 43 21 21 0 0 1 43 6Z" fill="url(#tg-moon)"/>' +
      '<path d="M43 6A26 26 0 1 0 57 43" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.200"/>' +
      '<g fill="#8e78e0"><circle cx="24" cy="40" r="4" opacity=".42"/><circle cx="35" cy="50" r="2.600" opacity=".4"/><circle cx="18" cy="27" r="3" opacity=".4"/><circle cx="30" cy="22" r="1.800" opacity=".35"/></g>' +
      '<g fill="#fff" opacity=".5"><circle cx="22.800" cy="38.800" r="2"/><circle cx="16.800" cy="25.800" r="1.400"/><circle cx="34" cy="48.800" r="1.200"/></g></g>' +
      spark(51, 15, 4.200, "k-tw t1") + spark(57, 28, 2.200, "k-tw t2", "#ffe9a8") + spark(45, 29, 1.800, "k-tw t3") + dots(41, 4, [38, 4, 62, 40], ["#fff"]) },
    { id: "agujero", n: "Agujero negro", svg:
      '<circle class="k-pulse" cx="32" cy="32" r="26" fill="url(#tg-glow)" opacity=".4"/>' +
      '<g transform="translate(32 32) rotate(-14)"><path d="M-29 0A29 9.500 0 0 1 29 0" fill="none" stroke="url(#tg-disk)" stroke-width="5" stroke-linecap="round" opacity=".85"/></g>' +
      '<path d="M16.500 30.500A15.500 13 0 0 1 47.500 30.500" fill="none" stroke="url(#tg-disk)" stroke-width="2.600" stroke-linecap="round" opacity=".95"/>' +
      '<circle cx="32" cy="32" r="12.500" fill="#04020c"/><circle cx="32" cy="32" r="12.500" fill="none" stroke="url(#tg-ring)" stroke-width="1.800"/>' +
      '<g transform="translate(32 32) rotate(-14)"><path d="M-29 0A29 9.500 0 0 0 29 0" fill="none" stroke="url(#tg-disk)" stroke-width="5.400" stroke-linecap="round"/>' +
      '<path d="M-25 0A25 7.600 0 0 0 25 0" fill="none" stroke="#fff6dc" stroke-opacity=".7" stroke-width="1"/></g>' +
      '<g transform="translate(32 32) rotate(-14) scale(1 .33)"><g class="k-orb"><circle cx="27" cy="0" r="3" fill="#fff"/><circle cx="-27" cy="0" r="3" fill="none"/></g></g>' +
      '<g class="k-suck"><circle cx="54" cy="32" r="1.400" fill="#fff"/></g><g class="k-suck s1"><circle cx="32" cy="9" r="1.200" fill="#cfe3ff"/></g><g class="k-suck s2"><circle cx="11" cy="36" r="1.300" fill="#ffe6c0"/></g>' +
      dots(51, 3, [4, 4, 60, 12], ["#fff"]) },
    { id: "cometa", n: "Cometa", svg:
      '<g class="k-fly"><path d="M49 13C37 20 22 34 6 58C23 50 38 41 52 23Z" fill="url(#tg-tail)" opacity=".92"/>' +
      '<path d="M50 18C41 31 31 41 17 53" fill="none" stroke="#bfeaff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M46 12C34 22 22 32 10 46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.100" stroke-linecap="round"/>' +
      '<circle cx="30" cy="34" r="1.100" fill="#fff"/><circle cx="21" cy="42" r=".9" fill="#dff3ff"/><circle cx="38" cy="26" r="1" fill="#fff"/><circle cx="14" cy="48" r=".8" fill="#fff"/>' +
      '<circle cx="50" cy="16" r="12" fill="url(#tg-glow)"/><circle cx="50" cy="16" r="6.200" fill="url(#tg-planet2)"/><circle cx="50" cy="16" r="3.600" fill="#fff"/></g>' +
      dots(61, 5, [3, 3, 61, 61], ["#fff", "#dcd0ff"]) + spark(16, 14, 3, "k-tw t1") + spark(54, 48, 2.200, "k-tw t2") },
    { id: "cohete", n: "Cohete", svg:
      '<circle cx="32" cy="30" r="24" fill="url(#tg-glow)" opacity=".35"/>' +
      '<g class="k-float"><g class="k-flame"><path d="M26 45C25 52 28.500 58 32 63C35.500 58 39 52 38 45Z" fill="url(#tg-flame)"/><path d="M29.200 45C29 50 30.600 54 32 57C33.400 54 35 50 34.800 45Z" fill="#fff4b8"/></g>' +
      '<path d="M20.500 29L10 42V50L21.500 43.500Z" fill="url(#tg-fin)"/><path d="M43.500 29L54 42V50L42.500 43.500Z" fill="url(#tg-fin)"/>' +
      '<path d="M32 3C41.500 9.500 46 20 44.500 32V40C44.500 42 43 43 41.500 43H22.500C21 43 19.500 42 19.500 40V32C18 20 22.500 9.500 32 3Z" fill="url(#tg-hull)"/>' +
      '<path d="M32 3C37 6.500 40.600 11.500 42.200 17H21.800C23.400 11.500 27 6.500 32 3Z" fill="url(#tg-nose)"/>' +
      '<path d="M32 3C41.500 9.500 46 20 44.500 32V40C44.500 42 43 43 41.500 43H36C40 36 41 18 32 3Z" fill="#3a1b9a" opacity=".22"/>' +
      '<path d="M19.800 35H44.200" stroke="#e0408a" stroke-width="2.200" opacity=".85"/>' +
      '<circle cx="32" cy="25" r="6.300" fill="#fff" fill-opacity=".9"/><circle cx="32" cy="25" r="4.800" fill="url(#tg-glass2)"/><ellipse cx="30.200" cy="23.200" rx="1.700" ry="1.100" transform="rotate(-35 30.200 23.200)" fill="#fff" opacity=".85"/>' +
      '<rect x="27" y="42" width="10" height="4" rx="1.600" fill="#3b2a7a"/></g>' +
      dots(71, 6, [3, 3, 61, 61], ["#fff", "#dcd0ff"]) },
    { id: "ovni", n: "Platillo", svg:
      '<path class="k-beam" d="M24 42L13 61H51L40 42Z" fill="url(#tg-beam)"/>' +
      '<g class="k-hover"><path d="M21 27C21 17 26 11 32 11C38 11 43 17 43 27Z" fill="url(#tg-glass)" opacity=".92"/>' +
      '<circle cx="32" cy="22" r="4.400" fill="#8be8b8"/><ellipse cx="30.300" cy="22" rx="1.200" ry="1.700" fill="#0b2a30" transform="rotate(14 30.300 22)"/><ellipse cx="33.700" cy="22" rx="1.200" ry="1.700" fill="#0b2a30" transform="rotate(-14 33.700 22)"/>' +
      '<path d="M24 25C24 19.500 26.600 15.500 30 13.800" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.400" stroke-linecap="round"/>' +
      '<path d="M5 33C5 27.500 17.500 24 32 24C46.500 24 59 27.500 59 33C59 39 46.500 43 32 43C17.500 43 5 39 5 33Z" fill="url(#tg-hull)"/>' +
      '<path d="M7 31.500C12 28 21 26 32 26C43 26 52 28 57 31.500" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.400" stroke-linecap="round"/>' +
      '<path d="M8 35C13 40 22 42 32 42C42 42 51 40 56 35C52 39 43 40.500 32 40.500C21 40.500 12 39 8 35Z" fill="#4b2fb0" opacity=".35"/>' +
      '<circle class="k-light" cx="15" cy="34" r="2" fill="#8fe0ff"/><circle class="k-light l1" cx="26" cy="37.500" r="2" fill="#ffd36e"/><circle class="k-light l2" cx="38" cy="37.500" r="2" fill="#ff8fd0"/><circle class="k-light l3" cx="49" cy="34" r="2" fill="#8fe0ff"/></g>' +
      dots(81, 5, [3, 3, 61, 20], ["#fff", "#dcd0ff"]) },
    { id: "constelacion", n: "Constelación", svg: constellation() },
    { id: "eclipse", n: "Eclipse", svg:
      '<circle class="k-pulse" cx="32" cy="32" r="28" fill="url(#tg-glow)" opacity=".75"/>' +
      '<g class="k-spin-slow"><path d="M32 3V11M32 53V61M3 32H11M53 32H61M11.500 11.500L17 17M47 47L52.500 52.500M52.500 11.500L47 17M17 47L11.500 52.500" stroke="#efe6ff" stroke-opacity=".85" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M32 6V9.500M32 54.500V58M6 32H9.500M54.500 32H58M18 8.800L19.500 11.500M44.500 52.500L46 55.200M55.200 18L52.500 19.500M11.500 44.500L8.800 46M55.200 46L52.500 44.500M11.500 19.500L8.800 18M46 8.800L44.500 11.500M19.500 52.500L18 55.200" stroke="#bda8ff" stroke-opacity=".6" stroke-width="1.200" stroke-linecap="round"/></g>' +
      '<circle cx="32" cy="32" r="18.500" fill="none" stroke="url(#tg-ring)" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="16.500" fill="#05030f"/>' +
      '<g class="k-tw t0"><circle cx="45.300" cy="20.500" r="6" fill="url(#tg-glow)"/><circle cx="45.300" cy="20.500" r="2.600" fill="#fff"/></g>' },
    { id: "cristal", n: "Cristal cósmico", svg:
      '<circle class="k-pulse" cx="32" cy="32" r="26" fill="url(#tg-glow)" opacity=".5"/>' +
      '<g class="k-float"><g clip-path="url(#tg-gem)">' +
      '<path d="M15 21L32 58L49 21Z" fill="url(#tg-crystal)"/><path d="M15 21L24 8H40L49 21Z" fill="url(#tg-crystal2)"/>' +
      '<path d="M24 8L29 21L15 21Z" fill="#fff" opacity=".22"/><path d="M40 8L35 21L49 21Z" fill="#3a1b9a" opacity=".2"/>' +
      '<path d="M24 8H40L35 21H29Z" fill="#fff" opacity=".3"/><path d="M15 21L29 21L32 58Z" fill="#fff" opacity=".16"/><path d="M49 21L35 21L32 58Z" fill="#2a1070" opacity=".28"/>' +
      '<g class="k-sweep"><rect x="-6" y="-4" width="9" height="74" fill="#fff" opacity=".55" transform="rotate(24 0 30)"/></g></g>' +
      '<path d="M15 21L24 8H40L49 21L32 58Z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.200" stroke-linejoin="round"/>' +
      '<path d="M15 21H49M24 8L29 21L32 58L35 21L40 8M29 21L15 21M35 21L49 21" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width=".9" stroke-linejoin="round"/></g>' +
      spark(10, 12, 3.400, "k-tw t1") + spark(55, 46, 2.800, "k-tw t2") + spark(53, 11, 2, "k-tw t3", "#ffe9a8") + dots(91, 4, [3, 30, 14, 60], ["#fff"]) }
  ];

  var DEFS =
    '<defs>' +
    '<radialGradient id="tg-glow"><stop offset="0" stop-color="#b79bff" stop-opacity=".95"/><stop offset=".55" stop-color="#7c4dff" stop-opacity=".35"/><stop offset="1" stop-color="#7c4dff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-core" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#efe3ff"/><stop offset="1" stop-color="#9a6cff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="tg-arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset=".5" stop-color="#ae92ff"/><stop offset="1" stop-color="#e57bd9"/></linearGradient>' +
    '<linearGradient id="tg-star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#e2d0ff"/><stop offset="1" stop-color="#9373ff"/></linearGradient>' +
    '<linearGradient id="tg-star2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe3ff"/><stop offset="1" stop-color="#b58bff"/></linearGradient>' +
    '<linearGradient id="tg-ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fd8ff"/><stop offset=".5" stop-color="#cdb8ff"/><stop offset="1" stop-color="#f4a3e4"/></linearGradient>' +
    '<radialGradient id="tg-planet" cx=".33" cy=".28" r=".95"><stop offset="0" stop-color="#e6d8ff"/><stop offset=".5" stop-color="#9468f7"/><stop offset="1" stop-color="#3a1e8f"/></radialGradient>' +
    '<radialGradient id="tg-planet2" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#cfe9ff"/><stop offset="1" stop-color="#7fb4ff"/></radialGradient>' +
    '<clipPath id="tg-sph"><circle cx="32" cy="33" r="14.500"/></clipPath>' +
    '<radialGradient id="tg-nb1"><stop offset="0" stop-color="#8e5bff" stop-opacity=".95"/><stop offset=".6" stop-color="#6a3df0" stop-opacity=".45"/><stop offset="1" stop-color="#6a3df0" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-nb2"><stop offset="0" stop-color="#ee5fd0" stop-opacity=".9"/><stop offset=".6" stop-color="#c13fb8" stop-opacity=".4"/><stop offset="1" stop-color="#c13fb8" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-nb3"><stop offset="0" stop-color="#3fc4ff" stop-opacity=".85"/><stop offset=".6" stop-color="#2f86f0" stop-opacity=".4"/><stop offset="1" stop-color="#2f86f0" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-nb4"><stop offset="0" stop-color="#ffb26b" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a5b" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-dust"><stop offset="0" stop-color="#0a0420" stop-opacity=".7"/><stop offset="1" stop-color="#0a0420" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-moon" cx=".38" cy=".33" r=".95"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ddd0ff"/><stop offset="1" stop-color="#8a74e0"/></radialGradient>' +
    '<linearGradient id="tg-disk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a3d" stop-opacity=".25"/><stop offset=".3" stop-color="#ffb35c"/><stop offset=".7" stop-color="#fff0b8"/><stop offset=".85" stop-color="#e97ad8"/><stop offset="1" stop-color="#7c4dff" stop-opacity=".25"/></linearGradient>' +
    '<linearGradient id="tg-tail" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ebff"/><stop offset=".45" stop-color="#9a7bff" stop-opacity=".7"/><stop offset="1" stop-color="#9a7bff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-hull" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f0ff"/><stop offset=".55" stop-color="#bba5ff"/><stop offset="1" stop-color="#6f4adb"/></linearGradient>' +
    '<linearGradient id="tg-nose" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac0"/><stop offset="1" stop-color="#c2307f"/></linearGradient>' +
    '<linearGradient id="tg-fin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ee74d4"/><stop offset="1" stop-color="#7a3fc4"/></linearGradient>' +
    '<linearGradient id="tg-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#ff9a5a"/><stop offset="1" stop-color="#e0408a" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe3ff" stop-opacity=".85"/><stop offset="1" stop-color="#9fe3ff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3f7ff"/><stop offset="1" stop-color="#6aa8ff"/></linearGradient>' +
    '<linearGradient id="tg-glass2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fd6ff"/><stop offset="1" stop-color="#2a1d8a"/></linearGradient>' +
    '<linearGradient id="tg-crystal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6e8ff"/><stop offset=".5" stop-color="#a98bff"/><stop offset="1" stop-color="#e472d2"/></linearGradient>' +
    '<linearGradient id="tg-crystal2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7fbff"/><stop offset=".5" stop-color="#c8b4ff"/><stop offset="1" stop-color="#f3a6e6"/></linearGradient>' +
    '<clipPath id="tg-gem"><path d="M15 21L24 8H40L49 21L32 58Z"/></clipPath>' +
    '</defs>';

  var CSS =
    ".ic.sk svg{overflow:visible}" +
    ".ic.sk.anim .k-spin,.ic.sk.anim .k-spin-slow,.ic.sk.anim .k-suck{transform-box:view-box;transform-origin:32px 32px}" +
    ".ic.sk.anim .k-orb{transform-box:fill-box;transform-origin:center;animation:tk-spin 2.6s linear infinite}.ic.sk.anim .k-pulse,.ic.sk.anim .k-beat,.ic.sk.anim .k-tw,.ic.sk.anim .k-float,.ic.sk.anim .k-sway,.ic.sk.anim .k-hover,.ic.sk.anim .k-fly,.ic.sk.anim .k-d1,.ic.sk.anim .k-d2,.ic.sk.anim .k-d3{transform-box:fill-box;transform-origin:center}" +
    ".ic.sk.anim .k-spin{animation:tk-spin 26s linear infinite}" +
    ".ic.sk.anim .k-spin-slow{animation:tk-spin 44s linear infinite}" +
    ".ic.sk.anim .k-pulse{animation:tk-pulse 3.4s ease-in-out infinite}" +
    ".ic.sk.anim .k-beat{animation:tk-beat 3.6s ease-in-out infinite}" +
    ".ic.sk.anim .k-tw{animation:tk-tw 2.6s ease-in-out infinite}" +
    ".ic.sk.anim .k-tw.t1{animation-duration:3.1s;animation-delay:-.7s}.ic.sk.anim .k-tw.t2{animation-duration:2.2s;animation-delay:-1.4s}.ic.sk.anim .k-tw.t3{animation-duration:3.6s;animation-delay:-2s}" +
    ".ic.sk.anim .k-float{animation:tk-float 3.6s ease-in-out infinite}" +
    ".ic.sk.anim .k-sway{animation:tk-sway 5.5s ease-in-out infinite}" +
    ".ic.sk.anim .k-hover{animation:tk-hover 3.2s ease-in-out infinite}" +
    ".ic.sk.anim .k-flame{transform-box:fill-box;transform-origin:50% 0;animation:tk-flame .3s ease-in-out infinite}" +
    ".ic.sk.anim .k-fly{animation:tk-fly 3.4s ease-in-out infinite}" +
    ".ic.sk.anim .k-beam{animation:tk-beam 2.4s ease-in-out infinite}" +
    ".ic.sk.anim .k-light{animation:tk-light 1.6s ease-in-out infinite}.ic.sk.anim .k-light.l1{animation-delay:-.4s}.ic.sk.anim .k-light.l2{animation-delay:-.8s}.ic.sk.anim .k-light.l3{animation-delay:-1.2s}" +
    ".ic.sk.anim .k-dash{animation:tk-dash 2.2s linear infinite}" +
    ".ic.sk.anim .k-sweep{animation:tk-sweep 3.8s ease-in-out infinite}" +
    ".ic.sk.anim .k-d1{animation:tk-d1 6s ease-in-out infinite}.ic.sk.anim .k-d2{animation:tk-d2 7.5s ease-in-out infinite}.ic.sk.anim .k-d3{animation:tk-d3 5.5s ease-in-out infinite}" +
    ".ic.sk.anim .k-suck{animation:tk-suck 3.6s ease-in infinite}.ic.sk.anim .k-suck.s1{animation-delay:-1.2s}.ic.sk.anim .k-suck.s2{animation-delay:-2.4s}" +
    "@keyframes tk-spin{to{transform:rotate(360deg)}}" +
    "@keyframes tk-pulse{0%,100%{transform:scale(.94);opacity:.8}50%{transform:scale(1.12);opacity:1}}" +
    "@keyframes tk-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}" +
    "@keyframes tk-tw{0%,100%{opacity:.3;transform:scale(.65)}50%{opacity:1;transform:scale(1.25)}}" +
    "@keyframes tk-float{0%,100%{transform:translateY(1.4px) rotate(-1.6deg)}50%{transform:translateY(-2px) rotate(1.6deg)}}" +
    "@keyframes tk-sway{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}" +
    "@keyframes tk-hover{0%,100%{transform:translateY(1.5px) rotate(-2.4deg)}50%{transform:translateY(-1.8px) rotate(2.4deg)}}" +
    "@keyframes tk-flame{0%,100%{transform:scale(.92,.78)}50%{transform:scale(1,1.22)}}" +
    "@keyframes tk-fly{0%{transform:translate(-6px,6px);opacity:0}18%{opacity:1}80%{opacity:1}100%{transform:translate(6px,-6px);opacity:0}}" +
    "@keyframes tk-beam{0%,100%{opacity:.3}50%{opacity:.85}}" +
    "@keyframes tk-light{0%,100%{opacity:.25}50%{opacity:1}}" +
    "@keyframes tk-dash{to{stroke-dashoffset:-11}}" +
    "@keyframes tk-sweep{0%{transform:translateX(-12px)}55%,100%{transform:translateX(72px)}}" +
    "@keyframes tk-d1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(2.6px,-1.8px) scale(1.09)}}" +
    "@keyframes tk-d2{0%,100%{transform:translate(0,0) scale(1.04)}50%{transform:translate(-2.4px,2px) scale(.94)}}" +
    "@keyframes tk-d3{0%,100%{transform:translate(0,0) scale(.96)}50%{transform:translate(1.8px,2.4px) scale(1.1)}}" +
    "@keyframes tk-suck{0%{transform:rotate(0) scale(1);opacity:0}12%{opacity:1}100%{transform:rotate(330deg) scale(.12);opacity:0}}" +
    "@media (prefers-reduced-motion:reduce){.ic.sk.anim *{animation:none!important}}";

  function mount() {
    if (document.getElementById("tronx-stickers")) return;
    var parts = [DEFS];
    STICKERS.forEach(function (s) { parts.push('<symbol id="st-' + s.id + '" viewBox="0 0 64 64">' + s.svg + "</symbol>"); });
    var holder = document.createElement("div");
    holder.id = "tronx-stickers";
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">' + parts.join("") + "</svg>";
    document.body.insertBefore(holder, document.body.firstChild);
    var st = document.createElement("style"); st.id = "tronx-stickers-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function markup(id) {
    for (var i = 0; i < STICKERS.length; i++) if (STICKERS[i].id === id) return STICKERS[i].svg;
    return "";
  }
  window.TronxStickers = { list: STICKERS, mount: mount, markup: markup };
})();
