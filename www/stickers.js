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
  /* ---- galaxia (nueva): 2 brazos grandes + 2 menores, polvo, barra central y bulbo cálido; cada capa gira a su ritmo ---- */
  function galaxy2() {
    var arms = "", dust = "", stars = "", sd = rnd(29), a, i;
    var specs = [[0, 1, 2.4, 30], [Math.PI, 1, 2.4, 30], [Math.PI / 2, 0.6, 5, 23], [Math.PI * 1.5, 0.6, 5, 23]];
    function pt(th0, r) { var th = th0 + 1.8 * Math.log(r / 2.4); return [32 + r * Math.cos(th), 32 + r * Math.sin(th)]; }
    for (a = 0; a < specs.length; a++) {
      var sp = specs[a], w = sp[1], pts = [], dp = [];
      for (var r = sp[2]; r <= sp[3]; r += 0.8) { var q = pt(sp[0], r), q2 = pt(sp[0] - 0.2, r * 0.97); pts.push(f(q[0]) + " " + f(q[1])); dp.push(f(q2[0]) + " " + f(q2[1])); }
      var d = "M" + pts.join("L");
      arms += '<path d="' + d + '" fill="none" stroke="url(#tg-arm)" stroke-width="' + f(11 * w) + '" stroke-linecap="round" opacity=".12"/>' +
              '<path d="' + d + '" fill="none" stroke="url(#tg-arm)" stroke-width="' + f(6 * w) + '" stroke-linecap="round" opacity=".3"/>' +
              '<path d="' + d + '" fill="none" stroke="#cfe0ff" stroke-width="' + f(2.2 * w) + '" stroke-linecap="round" opacity=".5"/>';
      dust += '<path d="M' + dp.join("L") + '" fill="none" stroke="#0a0420" stroke-width="' + f(2.1 * w) + '" stroke-linecap="round" opacity=".55"/>';
      var n = w > 0.7 ? 46 : 20;
      for (i = 0; i < n; i++) {
        var rr = sp[2] + 1.5 + (i / n) * (sp[3] - sp[2] - 2) + (sd() - 0.5) * 1.4, q3 = pt(sp[0] + (sd() - 0.5) * 0.5, rr), t = rr / sp[3];
        var col = t < 0.35 ? "#ffe2b0" : t < 0.65 ? "#f6f2ff" : (i % 3 === 0 ? "#ff9ad5" : "#a9d4ff");
        stars += '<circle cx="' + f(q3[0] + (sd() - 0.5) * 2.2) + '" cy="' + f(q3[1] + (sd() - 0.5) * 2.2) + '" r="' + f(0.22 + sd() * 0.55) + '" fill="' + col + '" opacity="' + f(0.55 + sd() * 0.45) + '"/>';
      }
    }
    for (i = 0; i < 6; i++) { var qq = pt(i % 2 ? Math.PI : 0, 9 + i * 3.6 + sd() * 2); stars += '<circle cx="' + f(qq[0]) + '" cy="' + f(qq[1]) + '" r="' + f(0.9 + sd() * 0.6) + '" fill="#ff7cc4" opacity=".7"/>'; }
    return '<circle class="k-pulse" cx="32" cy="32" r="31" fill="url(#tg-glow)" opacity=".3"/>' +
      '<g transform="rotate(-24 32 32)"><g transform="translate(32 32) scale(1 .6) translate(-32 -32)">' +
      '<circle cx="32" cy="32" r="30" fill="url(#tg-bulge)" opacity=".13"/>' +
      '<g class="k-gal-a">' + arms + dust + stars + '</g>' +
      '<g class="k-gal-b"><ellipse cx="32" cy="32" rx="13" ry="3.2" transform="rotate(32 32 32)" fill="url(#tg-bulge)" opacity=".95"/><circle cx="32" cy="32" r="12" fill="none" stroke="#ffe3b0" stroke-opacity=".25" stroke-width="1" stroke-dasharray="1.5 3.5"/></g>' +
      '</g></g>' +
      '<circle class="k-pulse" cx="32" cy="32" r="8.500" fill="url(#tg-bulge)"/><circle cx="32" cy="32" r="4" fill="#fff1cf" opacity=".9"/><circle cx="32" cy="32" r="2" fill="#fff"/>' +
      dots(5, 8, [3, 3, 61, 61], ["#fff", "#dcd0ff"]) + spark(53, 9, 2.4, "k-tw t1") + spark(9, 54, 2, "k-tw t3", "#ffe9a8");
  }
  /* ---- Tierra: mapa real simplificado (lon/lat) que rota; mismo dibujo en menú y selector ---- */
  var EP = 88; /* ancho del mapa = 360° ; el disco (44px) muestra 180° */
  var LAND = {
    na: "-168,66 -156,71 -140,69.5 -125,70 -110,68 -95,68 -85,70 -82,66 -93,59 -94,57 -85,55 -80,52 -78,58 -77,62 -70,60 -64,60 -60,55 -56,52 -60,47 -66,45 -70,42 -74,40 -76,35 -81,31 -80,26 -82,26 -84,30 -89,30 -94,29 -97,26 -97,22 -95,19 -91,19 -90,21 -87,21 -88,16 -84,15 -83,10 -80,8 -78,8 -80,7 -84,9 -86,12 -92,14.5 -97,16 -105,20 -106,23 -110,27 -113,31 -115,30 -110,23 -112,25 -115,29 -117,33 -121,35 -124,40 -124,47 -128,51 -134,57 -140,60 -148,60 -152,58 -158,57 -165,55 -160,59 -165,62 -166,65",
    gr: "-73,78 -60,82 -30,83 -20,80 -20,72 -28,68 -40,65 -44,60 -50,63 -54,68 -58,75",
    sa: "-77,8 -72,12 -64,10 -60,8 -52,5 -50,0 -44,-2 -35,-5 -35,-9 -39,-14 -40,-20 -44,-23 -48,-26 -53,-34 -58,-35 -57,-38 -62,-39 -65,-42 -66,-47 -69,-51 -68,-55 -72,-54 -75,-50 -74,-42 -72,-35 -71,-28 -70,-18 -76,-14 -81,-6 -80,-2 -78,2 -78,7",
    eu: "-9,37 -9,43 -2,43.5 -1,46 -4,48 2,51 5,53 8,54 9,57 11,56 12,54 20,54 22,58 24,60 30,60 22,61 25,65 21,64 17,61 19,59 16,56 12,56 11,59 5,59 5,62 14,67 20,70 28,71 40,67 44,68 60,69 70,73 80,73 100,77 113,74 130,72 140,72 160,70 170,70 180,68 180,65 170,60 163,60 160,54 156,51 155,57 143,59 137,54 141,52 140,48 135,43 129,41 129,35 126,35 126,38 122,40 118,38 122,37 120,32 122,30 118,24 110,21 108,16 109,12 105,9 101,13 100,8 104,1 101,3 98,8 98,16 94,17 92,22 87,21 80,15 80,10 77,8 73,17 70,21 67,25 62,25 57,26 56,27 50,30 48,30 50,26 56,24 59,22 55,17 44,12 43,15 38,21 35,28 33,30 35,33 36,36 30,36 27,37 26,40 29,41 23,40 24,38 22,37 19,41 13,45 16,41 18,40 16,38 12,42 8,44 3,43 0,39 -5,36",
    af: "-6,36 10,37 11,33 20,31 25,32 32,31 34,28 37,22 39,16 43,12 51,12 48,5 42,-1 40,-10 40,-15 35,-20 35,-25 32,-29 27,-34 20,-35 18,-32 14,-23 12,-15 13,-9 9,-1 9,4 5,5 -2,5 -8,4 -13,8 -17,14 -17,21 -13,27 -10,30 -9,32",
    au: "114,-22 122,-18 130,-12 136,-12 137,-16 142,-11 146,-19 153,-26 150,-37 145,-39 140,-38 135,-34 130,-31 124,-33 115,-34 114,-26",
    mg: "44,-25 47,-25 50,-15 49,-12 44,-17",
    uk: "-5,50 1,51 2,53 -2,56 -3,58.5 -6,58 -5,55 -3,54 -5,52",
    ie: "-10,52 -6,52 -6,55 -10,54",
    jp: "130,33 135,34 140,35 141,41 140,42 137,37 132,35",
    su: "95,5 98,4 106,-6 104,-5 100,-1",
    bo: "109,1 117,7 119,1 116,-4 110,-3",
    jv: "105,-6 114,-7 114,-8.5 106,-7.5",
    ng: "131,-1 141,-3 150,-10 142,-9 138,-8",
    nz: "172,-35 178,-38 175,-41 173,-40",
    nz2: "172,-41 174,-42 170,-46 167,-46",
    cu: "-85,22 -77,20 -74,20 -80,23"
  };
  var DESERT = {
    sahara: "-13,27 -5,31 10,32 25,30 33,26 35,22 25,16 10,15 -5,16 -13,20",
    arabia: "36,28 43,30 48,29 55,24 55,18 45,14 40,20",
    outback: "124,-22 135,-22 142,-26 135,-30 125,-29",
    gobi: "90,42 110,44 112,40 100,38",
    kalahari: "17,-20 26,-20 26,-27 18,-28",
    sw: "-114,36 -106,36 -104,30 -112,30"
  };
  var FOREST = {
    amazon: "-70,-3 -60,2 -50,-1 -52,-10 -62,-12 -70,-9",
    congo: "12,3 26,4 28,-4 20,-8 13,-4",
    sib: "60,62 100,66 140,64 130,56 90,56 62,56",
    canada: "-125,58 -95,60 -70,54 -80,48 -110,50"
  };
  function poly(str) {
    var pts = str.split(" "), out = "";
    for (var i = 0; i < pts.length; i++) {
      var c = pts[i].split(","), x = (parseFloat(c[0]) + 180) / 360 * EP, y = 32 - parseFloat(c[1]) / 90 * 22;
      out += (i ? "L" : "M") + f(x) + " " + f(y);
    }
    return out + "Z";
  }
  function layer(map) { var o = ""; for (var k in map) o += poly(map[k]); return o; }
  function earth() {
    var land = layer(LAND), desert = layer(DESERT), forest = layer(FOREST);
    var ice = "M0 54.5L" + EP + " 54.5L" + EP + " 52.2Q80 51 72 52.6T56 52T40 52.8T24 51.8T8 52.6T0 52Z" +
              "M0 9.5L" + EP + " 9.5L" + EP + " 11Q76 12.5 66 11.2T46 11.4T26 11T10 11.6T0 11Z";
    var sd = rnd(23), cl = "", i;
    for (i = 0; i < 30; i++) {
      var cx = sd() * EP, cy = 13 + sd() * 38, rx = 1.6 + sd() * 4, ry = 0.5 + sd() * 0.8;
      cl += "M" + f(cx - rx) + " " + f(cy) + "Q" + f(cx) + " " + f(cy - ry * 2.2) + " " + f(cx + rx) + " " + f(cy) + "Q" + f(cx) + " " + f(cy + ry * 1.6) + " " + f(cx - rx) + " " + f(cy) + "Z";
    }
    function two(inner) { return "<g>" + inner + '</g><g transform="translate(' + EP + ' 0)">' + inner + "</g>"; }
    var surf = '<path d="' + land + '" fill="#3f9e4d"/><path d="' + forest + '" fill="#26773a" opacity=".75"/><path d="' + desert + '" fill="#d6b676" opacity=".85"/>' +
               '<path d="' + land + '" fill="none" stroke="#a9d98a" stroke-opacity=".5" stroke-width=".5" stroke-linejoin="round"/>' +
               '' +
               '<path d="' + ice + '" fill="#f4f9ff"/><path d="' + poly("-73,78 -60,82 -30,83 -20,80 -20,72 -28,68 -40,65 -44,60 -50,63 -54,68 -58,75") + '" fill="#f1f7ff" opacity=".9"/>';
    return '<circle class="k-pulse" cx="32" cy="32" r="29" fill="url(#tg-atmo)"/>' +
      '<circle cx="32" cy="32" r="22" fill="url(#tg-ocean)"/>' +
      '<g clip-path="url(#tg-earth)"><g transform="translate(10 0)"><g class="k-earth">' + two(surf) + '</g></g>' +
      '<g transform="translate(10 0)"><g class="k-cloud">' + two('<path d="' + cl + '" fill="#fff" fill-opacity=".55"/>') + '</g></g>' +
      '<circle cx="32" cy="32" r="22" fill="url(#tg-limb)"/></g>' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="#a5dcff" stroke-opacity=".6" stroke-width="1"/>' +
      '<ellipse cx="24.500" cy="22.500" rx="6.500" ry="3.800" transform="rotate(-38 24.500 22.500)" fill="#fff" opacity=".22"/>' +
      dots(91, 6, [2, 2, 62, 62], ["#fff", "#cfe3ff"]);
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

  var OLD = [
    { id: "agujero", n: "Agujero negro", svg:
      '<circle class="k-pulse" cx="32" cy="32" r="28" fill="url(#tg-glow)" opacity=".42"/>' +
      '<g transform="translate(32 32)"><circle r="17.500" fill="none" stroke="url(#tg-disk)" stroke-width="3.400" opacity=".55" transform="scale(1 .9)"/>' +
      '<circle class="k-beat" r="15.200" fill="none" stroke="#ffe9b8" stroke-width="1" opacity=".7"/></g>' +
      '<g transform="translate(32 32) rotate(-14)"><path d="M-30 0A30 10 0 0 1 30 0" fill="none" stroke="url(#tg-disk)" stroke-width="4.600" stroke-linecap="round" opacity=".6"/></g>' +
      '<circle cx="32" cy="32" r="12.800" fill="#030109"/><circle cx="32" cy="32" r="12.800" fill="none" stroke="url(#tg-ring)" stroke-width="1.600"/>' +
      '<g transform="translate(32 32) rotate(-14)"><ellipse rx="29" ry="9.200" fill="none" stroke="url(#tg-disk)" stroke-width="5.600" clip-path="url(#tg-front)"/>' +
      '<ellipse class="k-dash" rx="26" ry="8.200" fill="none" stroke="#fff6dc" stroke-opacity=".85" stroke-width="1.200" stroke-dasharray="3 8" clip-path="url(#tg-front)"/>' +
      '<ellipse class="k-dash k-dash2" rx="31.500" ry="10" fill="none" stroke="#ffd09a" stroke-opacity=".7" stroke-width=".9" stroke-dasharray="2 12" clip-path="url(#tg-front)"/></g>' +
      '<g transform="translate(32 32) rotate(-14) scale(1 .32)"><g class="k-orb"><circle cx="27" cy="0" r="3.200" fill="#fff"/></g></g>' +
      '<g class="k-suck"><circle cx="55" cy="32" r="1.400" fill="#fff"/></g><g class="k-suck s1"><circle cx="32" cy="8" r="1.200" fill="#cfe3ff"/></g><g class="k-suck s2"><circle cx="9" cy="38" r="1.300" fill="#ffe6c0"/></g>' +
      dots(51, 4, [4, 4, 60, 14], ["#fff"]) },
    { id: "cometa", n: "Cometa", svg:
      '<g class="k-float">' +
      '<path d="M49 15L3 58L6 60Z" fill="url(#tg-ion)" opacity=".85"/>' +
      '<path d="M47 12C36 14 20 24 6 42C22 38 38 30 52 20Z" fill="url(#tg-tail2)" opacity=".9"/>' +
      '<path d="M51 18C40 30 28 42 14 52" fill="none" stroke="#dff6ff" stroke-opacity=".7" stroke-width="1.300" stroke-linecap="round"/>' +
      '<g class="k-stream"><circle cx="40" cy="24" r="1.100" fill="#fff"/></g><g class="k-stream s1"><circle cx="34" cy="29" r="1" fill="#cfeeff"/></g><g class="k-stream s2"><circle cx="28" cy="33" r=".9" fill="#fff"/></g><g class="k-stream s3"><circle cx="43" cy="19" r=".9" fill="#ffe6c0"/></g>' +
      '<circle class="k-pulse" cx="50" cy="15" r="13" fill="url(#tg-glow)"/><circle cx="50" cy="15" r="7" fill="url(#tg-planet2)" opacity=".9"/><circle cx="50" cy="15" r="3.700" fill="#fff"/></g>' +
      dots(61, 6, [3, 3, 61, 61], ["#fff", "#dcd0ff"]) + spark(14, 12, 3, "k-tw t1") + spark(56, 50, 2.400, "k-tw t2", "#bfe6ff") }
  ];

  /* ================= Insignias detalladas =================
     Cada insignia es un medallón (aro metálico + cara oscura + gema) con una escena propia dentro. */
  var PAL = {
    tierra: ["#fff1b8", "#e0a93a", "#7a4a12", "#143a8a", "#050d2e", "#7fd0ff"],
    galaxia: ["#f1eaff", "#a58cf0", "#3b2a8a", "#2a1470", "#07041c", "#e9a9ff"],
    estrella: ["#fff3c0", "#ffb02e", "#9a3d08", "#3a0f4a", "#08031a", "#ffe27a"],
    planeta: ["#ffe6c4", "#d9954a", "#6b3a12", "#2a1a3a", "#07041a", "#ffd08a"],
    nebulosa: ["#ffe0f2", "#f07ac8", "#7a1f66", "#2a1060", "#060318", "#ff9ad5"],
    luna: ["#ffffff", "#b9c3e6", "#4a5586", "#16204e", "#05081f", "#dfe6ff"],
    agujero: ["#ffd9b0", "#c4672a", "#4a1a08", "#1a0a2a", "#020108", "#ffb35c"],
    cometa: ["#e6fbff", "#6cc7ee", "#1d4f7a", "#0f2a5a", "#040a22", "#bfeaff"],
    cohete: ["#ffe3d0", "#f0644a", "#7a1a20", "#1a2a6a", "#050a28", "#ff8f6a"],
    ovni: ["#d8ffe9", "#38c98a", "#0d5a42", "#0a3a46", "#02121a", "#7dffc2"],
    constelacion: ["#e0e8ff", "#6a86f0", "#1f2f8a", "#16286a", "#050a24", "#a9bcff"],
    eclipse: ["#fff0c0", "#e8b23a", "#5a3a08", "#1a1236", "#030210", "#ffd27a"],
    cristal: ["#f6e6ff", "#b36cf0", "#4a1a8a", "#3a1a7a", "#0a0524", "#f0b0ff"],
    aurora: ["#e0fff6", "#3fd6b6", "#0d5a58", "#0a2a4a", "#020a1a", "#7dffd0"],
    fenix: ["#ffe6fb", "#d88aff", "#5a2a9a", "#2a0a5a", "#06021a", "#ff9ae8"],
    brujula: ["#fff2cf", "#d1a64a", "#5f4412", "#0e3a4a", "#031018", "#ffe29a"],
    sistema: ["#fff3d0", "#ffc04a", "#8a4a0a", "#1a1460", "#05041c", "#ffd27a"],
    pulsar: ["#e8f8ff", "#5ac8ff", "#1a4a9a", "#0a1a4a", "#020615", "#9fe8ff"],
    ojo: ["#fff0ff", "#c46cff", "#4a1a8a", "#2a0a4a", "#07020f", "#ff9ad8"],
    reloj: ["#fff4d0", "#d9a63a", "#6a4a10", "#2a1a3a", "#07040f", "#ffd27a"],
    satelite: ["#f0f4ff", "#9fb4d6", "#3a4a74", "#0e2a5a", "#030a1c", "#bfe0ff"]
  };
  function badgeDefs() {
    var o = "";
    for (var id in PAL) {
      var c = PAL[id];
      o += '<linearGradient id="tb-rim-' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset=".75" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
           '<radialGradient id="tb-bg-' + id + '" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="' + c[3] + '"/><stop offset="1" stop-color="' + c[4] + '"/></radialGradient>' +
           '<radialGradient id="tb-gem-' + id + '" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="' + c[5] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient>';
    }
    return o +
      '<radialGradient id="tb-nA"><stop offset="0" stop-color="#ff6ad5" stop-opacity=".95"/><stop offset=".6" stop-color="#c03aa8" stop-opacity=".5"/><stop offset="1" stop-color="#7a1f66" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-nB"><stop offset="0" stop-color="#4ad8ff" stop-opacity=".9"/><stop offset=".6" stop-color="#2a7ad8" stop-opacity=".45"/><stop offset="1" stop-color="#1a3a9a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-nC"><stop offset="0" stop-color="#9a6cff" stop-opacity=".95"/><stop offset=".6" stop-color="#5a3ad8" stop-opacity=".5"/><stop offset="1" stop-color="#2a1a8a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-nD"><stop offset="0" stop-color="#ffc27a" stop-opacity=".85"/><stop offset=".6" stop-color="#ff7a5a" stop-opacity=".35"/><stop offset="1" stop-color="#a03a5a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-jelly" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffd6f6" stop-opacity=".95"/><stop offset=".6" stop-color="#c46cff" stop-opacity=".75"/><stop offset="1" stop-color="#6a3aff" stop-opacity=".55"/></radialGradient>' +
      '<radialGradient id="tb-iris"><stop offset="0" stop-color="#ffe27a"/><stop offset=".35" stop-color="#ff7ad0"/><stop offset=".75" stop-color="#6a3aff"/><stop offset="1" stop-color="#1a0a5a"/></radialGradient>' +
      '<linearGradient id="tb-pul" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8fbff" stop-opacity=".95"/><stop offset="1" stop-color="#5ac8ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="tb-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#e0922a"/></linearGradient>' +
      '<clipPath id="tb-eye"><path d="M5 32Q32 6 59 32Q32 58 5 32Z"/></clipPath><clipPath id="tb-sun"><circle cx="32" cy="32" r="11"/></clipPath>' +
      '<clipPath id="tb-hgT"><path d="M20 14H44C44 24 36 28 36 32H28C28 28 20 24 20 14Z"/></clipPath><clipPath id="tb-hgB"><path d="M28 32H36C36 36 44 40 44 50H20C20 40 28 36 28 32Z"/></clipPath>' +
      '<clipPath id="tb-face"><circle cx="32" cy="32" r="25.8"/></clipPath>' +
      '<clipPath id="tb-sat"><circle cx="0" cy="0" r="11"/></clipPath>' +
      '<clipPath id="tb-gem"><path d="M22 20H42L52 31L32 55L12 31Z"/></clipPath>' +
      '<linearGradient id="tb-horizon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b9bff"/><stop offset=".4" stop-color="#1b4fc0"/><stop offset="1" stop-color="#081a5a"/></linearGradient>' +
      '<linearGradient id="tb-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8ffe6" stop-opacity=".85"/><stop offset="1" stop-color="#7dffc2" stop-opacity=".05"/></linearGradient>' +
      '<linearGradient id="tb-saucer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f6ff"/><stop offset=".5" stop-color="#9fb4d6"/><stop offset="1" stop-color="#4a5a84"/></linearGradient>' +
      '<radialGradient id="tb-corona"><stop offset=".45" stop-color="#fff6d0" stop-opacity=".95"/><stop offset=".62" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tb-aur1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5dffb0" stop-opacity="0"/><stop offset="1" stop-color="#5dffb0" stop-opacity=".9"/></linearGradient>' +
      '<linearGradient id="tb-aur2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8cff" stop-opacity="0"/><stop offset="1" stop-color="#3fe0d0" stop-opacity=".8"/></linearGradient>' +
      '<linearGradient id="tb-aur3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d27aff" stop-opacity="0"/><stop offset="1" stop-color="#ff7ad0" stop-opacity=".7"/></linearGradient>' +
      '<linearGradient id="tb-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a0"/><stop offset=".4" stop-color="#ffb02e"/><stop offset="1" stop-color="#e0301a"/></linearGradient>' +
      '<linearGradient id="tb-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a2a"/><stop offset="1" stop-color="#ffb02e"/></linearGradient>' +
      '<linearGradient id="tb-kite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2cf"/><stop offset="1" stop-color="#c69a3e"/></linearGradient>';
  }
  function badge(id, scene) {
    var c = PAL[id], orn = "", i;
    for (i = 0; i < 16; i++) { var a = i * Math.PI / 8; orn += '<circle cx="' + f(32 + 29.7 * Math.cos(a)) + '" cy="' + f(32 + 29.7 * Math.sin(a)) + '" r="' + (i % 2 ? 0.45 : 0.7) + '" fill="' + (i % 2 ? c[2] : "#fff") + '" opacity="' + (i % 2 ? 0.8 : 0.85) + '"/>'; }
    return '<circle cx="32" cy="32" r="31.2" fill="url(#tb-rim-' + id + ')"/>' +
      '<circle cx="32" cy="32" r="28.4" fill="#06041a"/>' +
      '<g class="k-orn">' + orn + '</g>' +
      '<circle cx="32" cy="32" r="25.8" fill="url(#tb-bg-' + id + ')"/>' +
      '<g clip-path="url(#tb-face)">' + scene + '</g>' +
      '<circle cx="32" cy="32" r="25.8" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".8"/>' +
      '<path d="M13 21A22 22 0 0 1 30 9" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="32" cy="32" r="30.4" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/>' +
      '<g class="k-tw t1"><circle cx="32" cy="3.4" r="2.1" fill="url(#tb-gem-' + id + ')" stroke="' + c[2] + '" stroke-width=".5"/></g>';
  }
  function oldArt(id) { for (var i = 0; i < OLD.length; i++) if (OLD[i].id === id) return OLD[i].svg; return ""; }
  function fit(art, sc, tx, ty) { return '<g transform="translate(' + (32 + (tx || 0)) + " " + (32 + (ty || 0)) + ") scale(" + sc + ') translate(-32 -32)">' + art + "</g>"; }

  function sEstrella() {
    var P = "M32 4L33.600 30.400L60 32L33.600 33.600L32 60L30.400 33.600L4 32L30.400 30.400Z", sp = "";
    for (var k = 0; k < 2; k++) { var o = k * 24; sp += '<ellipse cx="' + (22 + o) + '" cy="28" rx="2.400" ry="1.700" fill="#c4561a" opacity=".6"/><ellipse cx="' + (31 + o) + '" cy="37" rx="1.800" ry="1.300" fill="#c4561a" opacity=".55"/><ellipse cx="' + (38 + o) + '" cy="30" rx="1.200" ry=".9" fill="#ffe9a8" opacity=".7"/><ellipse cx="' + (27 + o) + '" cy="33" rx="1" ry=".8" fill="#ffe9a8" opacity=".6"/>'; }
    return '<circle cx="32" cy="32" r="22" fill="url(#tg-glow2)" opacity=".7"/>' +
      '<g class="k-spin-slow"><path d="' + P + '" fill="url(#tg-ray)" opacity=".85"/></g>' +
      '<g class="k-spin-rev"><g transform="translate(32 32) rotate(45) scale(.5) translate(-32 -32)"><path d="' + P + '" fill="url(#tg-star2)" opacity=".8"/></g></g>' +
      '<g class="k-ring"><circle cx="32" cy="32" r="11" fill="none" stroke="#ffe9a8" stroke-width="1"/></g>' +
      '<circle cx="32" cy="32" r="11" fill="url(#tg-sun)"/>' +
      '<g clip-path="url(#tb-sun)"><g class="k-sunsurf">' + sp + '</g></g><circle cx="32" cy="32" r="11" fill="url(#tg-limb2)" opacity=".8"/>' +
      '<g class="k-tw t1"><path d="M41.500 25Q48 19 45 30" fill="none" stroke="#ff8a2a" stroke-width="1.800" stroke-linecap="round"/></g><g class="k-tw t3"><path d="M22 41Q16 46 19 36" fill="none" stroke="#ff6a1a" stroke-width="1.600" stroke-linecap="round"/></g>' +
      spark(13, 14, 2.600, "k-tw t1") + spark(52, 51, 2.200, "k-tw t2") + spark(52, 13, 1.600, "k-tw t3", "#ffe9a8");
  }
  function sSaturno() {
    var bands = "", ys = [-8, -4.500, -1, 2.500, 6, 9.500], i;
    for (i = 0; i < ys.length; i++) bands += '<path d="M-44 ' + ys[i] + "q10 -2 20 0t20 0t20 0t20 0t20 0\" fill=\"none\" stroke=\"" + (i % 2 ? "#b87a3a" : "#fff0c8") + '" stroke-width="2.200" opacity=".5"/>';
    return '<circle cx="32" cy="32" r="22" fill="url(#tg-glow2)" opacity=".35"/>' +
      '<g class="k-sway"><g transform="translate(32 32) rotate(-18)">' +
      '<path d="M-24.500 0A24.500 7.500 0 0 1 24.500 0" fill="none" stroke="url(#tg-ring2)" stroke-width="3" opacity=".5"/>' +
      '<circle r="11" fill="url(#tg-gas)"/><g clip-path="url(#tb-sat)"><g class="k-band">' + bands + '</g></g><circle r="11" fill="url(#tg-limb2)"/>' +
      '<ellipse cx="-3.500" cy="-4.500" rx="3.600" ry="2" transform="rotate(-30 -3.500 -4.500)" fill="#fff" opacity=".3"/>' +
      '<path d="M-27 0A27 8.300 0 0 0 27 0" fill="none" stroke="url(#tg-ring2)" stroke-width="2" opacity=".65"/>' +
      '<path d="M-23.500 0A23.500 7.200 0 0 0 23.500 0" fill="none" stroke="url(#tg-ring2)" stroke-width="3.200"/>' +
      '<path class="k-dash" d="M-23.500 0A23.500 7.200 0 0 0 23.500 0" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1" stroke-linecap="round" stroke-dasharray="1.200 9"/>' +
      '</g></g>' + dots(7, 7, [6, 6, 58, 58], ["#fff", "#ffe9c4"]);
  }
  function sCohete() {
    return dots(77, 7, [8, 8, 56, 42], ["#fff", "#cfe3ff"]) +
      '<ellipse cx="32" cy="68" rx="40" ry="18" fill="url(#tb-horizon)"/><ellipse cx="32" cy="68" rx="40" ry="18" fill="none" stroke="#a5e4ff" stroke-width="1.400" opacity=".85"/>' +
      '<g class="k-streak"><path d="M20 12V20" stroke="#cfe8ff" stroke-width="1" stroke-linecap="round"/></g><g class="k-streak s1"><path d="M44 10V19" stroke="#cfe8ff" stroke-width="1" stroke-linecap="round"/></g><g class="k-streak s2"><path d="M12 28V34" stroke="#cfe8ff" stroke-width=".9" stroke-linecap="round"/></g><g class="k-streak s3"><path d="M52 30V37" stroke="#cfe8ff" stroke-width=".9" stroke-linecap="round"/></g>' +
      '<g class="k-float"><g transform="translate(32 29) rotate(22) scale(.62)">' +
      '<g class="k-flame"><path d="M-5 12Q0 36 5 12Z" fill="url(#tg-flame)"/><path d="M-2.500 12Q0 25 2.500 12Z" fill="#fff4b8"/></g>' +
      '<path d="M-9 2L-18 17L-9 13Z M9 2L18 17L9 13Z" fill="url(#tg-fin)"/>' +
      '<path d="M0 -24C9 -17 11 -4 10 12H-10C-11 -4 -9 -17 0 -24Z" fill="url(#tg-hull)"/>' +
      '<path d="M0 -24C5 -20 8 -16 9.500 -11H-9.500C-8 -16 -5 -20 0 -24Z" fill="url(#tg-nose)"/>' +
      '<path d="M-10.500 6H10.500" stroke="#e0408a" stroke-width="2.200" opacity=".85"/>' +
      '<circle cx="0" cy="-3" r="4.800" fill="#fff"/><circle cx="0" cy="-3" r="3.600" fill="url(#tg-glass2)"/><ellipse cx="-1.300" cy="-4.300" rx="1.200" ry=".8" fill="#fff" opacity=".85"/>' +
      '</g></g>';
  }
  function sOvni() {
    return dots(81, 6, [8, 8, 56, 26], ["#fff", "#cfeee0"]) +
      '<path class="k-beam" d="M26 33H38L50 54H14Z" fill="url(#tb-beam)"/>' +
      '<g class="k-ember e1"><circle cx="32" cy="50" r="1" fill="#eafff4"/></g><g class="k-ember e2"><circle cx="27" cy="52" r=".9" fill="#b8ffe0"/></g><g class="k-ember e3"><circle cx="37" cy="51" r=".9" fill="#eafff4"/></g>' +
      '<path d="M0 64V51Q10 45 20 50T40 49T64 47V64Z" fill="#021016"/><path d="M8 52L10 46L12 52ZM50 51L52 44L54 51Z" fill="#031a20"/>' +
      '<g class="k-hover"><ellipse cx="32" cy="31" rx="17" ry="5.600" fill="url(#tb-saucer)"/><ellipse cx="32" cy="29.500" rx="14" ry="2.200" fill="#fff" opacity=".35"/>' +
      '<path d="M24 29A8 8.500 0 0 1 40 29Z" fill="#9ff3ff" opacity=".7"/><circle cx="32" cy="26.500" r="2.400" fill="#7dffc2"/><circle cx="31.200" cy="26" r=".5" fill="#04202a"/><circle cx="32.900" cy="26" r=".5" fill="#04202a"/>' +
      '<circle class="k-blink" cx="23" cy="32.500" r="1.200" fill="#ffd54a"/><circle class="k-blink b2" cx="32" cy="34" r="1.200" fill="#ff7ad0"/><circle class="k-blink b3" cx="41" cy="32.500" r="1.200" fill="#7ae8ff"/></g>';
  }
  function sConstelacion() {
    var pts = [[13, 41], [22, 21], [34, 29], [46, 15], [51, 41], [36, 47]], d = "M13 41L22 21L34 29L46 15M34 29L51 41L36 47L13 41", o = "", i;
    o += '<ellipse cx="30" cy="34" rx="22" ry="12" transform="rotate(-20 30 34)" fill="url(#tg-nb1)" opacity=".35"/>';
    o += '<path d="' + d + '" fill="none" stroke="#9fb4ff" stroke-opacity=".3" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"/>';
    o += '<path class="k-dash" d="' + d + '" fill="none" stroke="#e8eeff" stroke-opacity=".9" stroke-width="1" stroke-linecap="round" stroke-dasharray="2 3.200"/>';
    for (i = 0; i < pts.length; i++) o += '<g class="k-tw t' + i % 4 + '"><circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="5" fill="url(#tg-glow)"/><circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (2.200 + (i % 2) * 0.7) + '" fill="url(#tg-star)"/><circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="1" fill="#fff"/></g>';
    o += '<g class="k-shoot"><path d="M54 8L45 15" stroke="#fff" stroke-width="1.300" stroke-linecap="round" opacity=".9"/><circle cx="45" cy="15" r="1.300" fill="#fff"/></g>';
    return o + dots(83, 8, [6, 6, 58, 58], ["#fff", "#cdd8ff"]);
  }
  function sEclipse() {
    var r1 = "", r2 = "", i, a, L;
    for (i = 0; i < 28; i++) { a = i * Math.PI / 14; L = i % 2 ? 17 : 21; r1 += "M" + f(32 + 12.5 * Math.cos(a)) + " " + f(32 + 12.5 * Math.sin(a)) + "L" + f(32 + L * Math.cos(a)) + " " + f(32 + L * Math.sin(a)); }
    for (i = 0; i < 9; i++) { a = i * Math.PI / 4.5 + 0.2; r2 += "M" + f(32 + 13 * Math.cos(a)) + " " + f(32 + 13 * Math.sin(a)) + "L" + f(32 + 25 * Math.cos(a)) + " " + f(32 + 25 * Math.sin(a)); }
    return '<circle class="k-pulse" cx="32" cy="32" r="22" fill="url(#tb-corona)"/>' +
      '<g class="k-spin-rev"><path d="' + r2 + '" stroke="#ffe2a0" stroke-opacity=".35" stroke-width="1.800" stroke-linecap="round"/></g>' +
      '<g class="k-spin-slow"><path d="' + r1 + '" stroke="#fff0c0" stroke-opacity=".75" stroke-width=".8" stroke-linecap="round"/></g>' +
      '<circle cx="32" cy="32" r="11" fill="#04020a"/><circle cx="32" cy="32" r="11" fill="none" stroke="#ffeab8" stroke-width="1"/>' +
      '<g class="k-diam"><circle cx="32" cy="21" r="4.600" fill="url(#tg-core)"/><circle cx="32" cy="21" r="1.500" fill="#fff"/></g>' +
      '<g class="k-tw t2"><path d="M22 40Q20 36 22 33" fill="none" stroke="#ff7a4a" stroke-width="1.400" stroke-linecap="round" opacity=".9"/></g>' +
      dots(91, 5, [5, 5, 59, 59], ["#fff", "#ffe9b8"]);
  }
  function sCristal() {
    return '<circle cx="32" cy="32" r="19" fill="url(#tg-glow)" opacity=".5"/>' +
      '<g class="k-float"><g transform="translate(0 -4)">' +
      '<path d="M22 20H42L52 31L32 55L12 31Z" fill="#6a2fd0"/>' +
      '<path d="M22 20H42L38 31H26Z" fill="#fff" opacity=".92"/><path d="M22 20L26 31H12Z" fill="#e7c8ff"/><path d="M42 20L52 31H38Z" fill="#c99bff"/>' +
      '<path d="M12 31H26L32 55Z" fill="#8a47f0"/><path d="M26 31H38L32 55Z" fill="#c28bff"/><path d="M38 31H52L32 55Z" fill="#5a22b8"/>' +
      '<path d="M22 20H42L52 31L32 55L12 31ZM12 31H52M26 31L32 55M38 31L32 55M22 20L26 31M42 20L38 31" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"/>' +
      '<g clip-path="url(#tb-gem)"><rect class="k-sweep2" x="0" y="10" width="7" height="60" transform="rotate(22 10 30)" fill="#fff" opacity=".6"/></g>' +
      '</g></g>' +
      spark(12, 15, 3, "k-tw t1", "#f6e0ff") + spark(53, 20, 2.400, "k-tw t2") + spark(50, 50, 2.800, "k-tw t3", "#ffd0f6") + spark(14, 48, 1.800, "k-tw t0");
  }
  function auraRays() {
    var o = "", sd = rnd(55), i;
    for (i = 0; i < 16; i++) { var x = 6 + i * 3.6 + sd() * 1.5, h = 14 + sd() * 18; o += '<path d="M' + f(x) + " 46V" + f(46 - h) + '" stroke="#7dffc8" stroke-width="' + f(0.6 + sd() * 0.9) + '" stroke-linecap="round" opacity="' + f(0.35 + sd() * 0.45) + '"/>'; }
    return o;
  }
  function sAurora() {
    return dots(97, 9, [6, 6, 58, 34], ["#fff", "#cfeaff"]) +
      '<path class="k-aur a3" opacity=".8" d="M8 46C20 34 30 40 40 30C48 38 56 34 60 44V52H8Z" fill="url(#tb-aur3)"/>' +
      '<path class="k-aur a2" opacity=".8" d="M2 44C14 26 24 36 34 22C44 34 52 24 62 42V50H2Z" fill="url(#tb-aur2)"/>' +
      '<path class="k-aur" d="M4 40C12 18 22 30 30 14C38 28 48 12 60 36V46H4Z" fill="url(#tb-aur1)"/>' +
      '<g class="k-aur a2">' + auraRays() + '</g>' +
      '<path d="M0 64V51L9 43L15 49L25 39L35 50L45 44L55 50L64 46V64Z" fill="#020612"/><path d="M9 43L11 45.500L9 45L7 46ZM25 39L27.500 42L25 41.500L22.500 42.500Z" fill="#cfe6ff" opacity=".8"/>' +
      '<path d="M10 56L13 48L16 56ZM17 58L20 50L23 58ZM44 57L47 49L50 57ZM51 58L54 51L57 58Z" fill="#010409"/>';
  }
  function sMedusa() {
    var t = "", i, xs = [22, 27, 32, 37, 42], cols = ["#ff9ae8", "#c79bff", "#9fe8ff", "#c79bff", "#ff9ae8"];
    for (i = 0; i < xs.length; i++) {
      var x = xs[i], L = 22 + (i % 3) * 3;
      t += '<g class="k-wave' + (i % 2 ? " w2" : "") + '"><path d="M' + x + " 30C" + (x - 4) + " 36 " + (x + 4) + " 40 " + x + " 45S" + (x - 3) + " " + (50 + (i % 3)) + " " + x + " " + (30 + L) + '" fill="none" stroke="' + cols[i] + '" stroke-width="' + (i === 2 ? 1.800 : 1.300) + '" stroke-linecap="round" opacity=".85"/></g>';
    }
    return '<circle cx="32" cy="28" r="22" fill="url(#tg-glow)" opacity=".5"/>' +
      '<g class="k-float">' + t +
      '<g class="k-wave"><path d="M28 30C26 38 30 42 27 50M36 30C38 38 34 42 37 50" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.600" stroke-linecap="round"/></g>' +
      '<g class="k-swim"><path d="M16 31C15 17 24 8 32 8C40 8 49 17 48 31C44 28 40 30 36.500 27.500C34 30 30 30 27.500 27.500C24 30 20 28 16 31Z" fill="url(#tb-jelly)"/>' +
      '<path d="M16 31C15 17 24 8 32 8C40 8 49 17 48 31" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/>' +
      '<path d="M22 15C25 11 29 10 32 10" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.600" stroke-linecap="round"/>' +
      '<g fill="#fff"><circle cx="27" cy="20" r="1.600" opacity=".7"/><circle cx="36" cy="18" r="1.200" opacity=".6"/><circle cx="32" cy="24" r="1.400" opacity=".7"/><circle cx="40" cy="24" r="1" opacity=".5"/><circle cx="24" cy="25" r="1" opacity=".5"/></g></g>' +
      '</g>' +
      '<g class="k-ember e1"><circle cx="14" cy="50" r="1.200" fill="#cfeeff"/></g><g class="k-ember e2"><circle cx="50" cy="46" r="1" fill="#ffd0f6"/></g><g class="k-ember e3"><circle cx="44" cy="54" r=".9" fill="#fff"/></g>' +
      dots(61, 9, [6, 6, 58, 40], ["#fff", "#e9defe"]);
  }
  function sSistema() {
    return '<circle cx="32" cy="32" r="14" fill="url(#tg-glow2)" opacity=".5"/>' +
      '<circle cx="32" cy="32" r="9.500" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".6"/><circle cx="32" cy="32" r="15.500" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".6"/><circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".6"/>' +
      '<g class="k-orbA"><circle cx="32" cy="22.500" r="1.700" fill="#ffb27a"/></g>' +
      '<g class="k-orbB"><circle cx="32" cy="16.500" r="2.600" fill="#5aa8ff"/><circle cx="30.800" cy="15.600" r="1" fill="#9fe08a" opacity=".8"/></g>' +
      '<g class="k-orbC"><g transform="translate(32 10)"><ellipse rx="5.600" ry="1.600" transform="rotate(-18)" fill="none" stroke="#ffe2a0" stroke-width="1"/><circle r="2.700" fill="#ffd08a"/></g></g>' +
      '<circle cx="32" cy="32" r="5.200" fill="url(#tg-sun)"/><circle class="k-beat" cx="32" cy="32" r="2.600" fill="#fffdf2"/>' +
      dots(71, 9, [5, 5, 59, 59], ["#fff", "#cfe3ff"]);
  }
  function sPulsar() {
    return dots(73, 10, [5, 5, 59, 59], ["#fff", "#cfe9ff"]) +
      '<g class="k-spin-rev"><ellipse cx="32" cy="32" rx="15" ry="5.500" transform="rotate(55 32 32)" fill="none" stroke="#7fd8ff" stroke-opacity=".4" stroke-width=".8"/><ellipse cx="32" cy="32" rx="15" ry="5.500" transform="rotate(-55 32 32)" fill="none" stroke="#7fd8ff" stroke-opacity=".4" stroke-width=".8"/></g>' +
      '<g class="k-ring"><circle cx="32" cy="32" r="6" fill="none" stroke="#9fe8ff" stroke-width="1"/></g><g class="k-ring r2"><circle cx="32" cy="32" r="6" fill="none" stroke="#fff" stroke-width=".8"/></g>' +
      '<g class="k-beamspin"><path d="M32 32L27 2H37Z" fill="url(#tb-pul)"/><path transform="rotate(180 32 32)" d="M32 32L27 2H37Z" fill="url(#tb-pul)"/></g>' +
      '<circle cx="32" cy="32" r="7" fill="url(#tg-core)"/><circle class="k-beat" cx="32" cy="32" r="3.600" fill="#fff"/>';
  }
  function sOjo() {
    var rays = "", i, a;
    for (i = 0; i < 28; i++) { a = i * Math.PI / 14; rays += "M" + f(32 + 5 * Math.cos(a)) + " " + f(32 + 5 * Math.sin(a)) + "L" + f(32 + 11 * Math.cos(a)) + " " + f(32 + 11 * Math.sin(a)); }
    return dots(75, 8, [5, 5, 59, 59], ["#fff", "#ffd9f2"]) +
      '<g class="k-lid">' +
      '<path d="M5 32Q32 6 59 32Q32 58 5 32Z" fill="#0b0518"/>' +
      '<g clip-path="url(#tb-eye)"><g class="k-look"><circle cx="32" cy="32" r="12.500" fill="url(#tb-iris)"/>' +
      '<g class="k-spin-slow"><path d="' + rays + '" stroke="#fff" stroke-opacity=".45" stroke-width=".6" stroke-linecap="round"/></g>' +
      '<circle cx="32" cy="32" r="12.500" fill="none" stroke="#2a0a5a" stroke-width="1.200"/><circle cx="32" cy="32" r="5" fill="#04010a"/><circle cx="29.800" cy="29.500" r="1.800" fill="#fff"/><circle cx="34.500" cy="34.500" r=".8" fill="#fff" opacity=".7"/></g></g>' +
      '<path d="M5 32Q32 6 59 32Q32 58 5 32Z" fill="none" stroke="#ffd2f6" stroke-width="1.200"/></g>' +
      spark(10, 14, 2.600, "k-tw t1") + spark(54, 50, 2.400, "k-tw t2", "#ffd0f6");
  }
  function sReloj() {
    return '<circle cx="32" cy="32" r="18" fill="url(#tg-glow)" opacity=".35"/>' +
      '<g class="k-flip">' +
      '<path d="M20 14H44C44 24 36 28 36 32C36 36 44 40 44 50H20C20 40 28 36 28 32C28 28 20 24 20 14Z" fill="#9fd8ff" fill-opacity=".14" stroke="#cfeeff" stroke-opacity=".8" stroke-width="1"/>' +
      '<g clip-path="url(#tb-hgT)"><rect class="k-sandT" x="18" y="14" width="28" height="18" fill="url(#tb-sand)"/></g>' +
      '<g clip-path="url(#tb-hgB)"><rect class="k-sandB" x="18" y="32" width="28" height="18" fill="url(#tb-sand)"/></g>' +
      '<path class="k-sandline" d="M32 31V49" stroke="#ffd27a" stroke-width="1.100" stroke-dasharray="1.600 2.200" stroke-linecap="round"/>' +
      '<rect x="16" y="9.500" width="32" height="4.500" rx="2" fill="url(#tb-kite)"/><rect x="16" y="50" width="32" height="4.500" rx="2" fill="url(#tb-kite)"/>' +
      '<path d="M22 14V50M42 14V50" stroke="#c69a3e" stroke-opacity=".0" stroke-width="1"/>' +
      '</g>' + spark(12, 20, 2.400, "k-tw t1", "#ffe9a8") + spark(53, 46, 2.200, "k-tw t2") + dots(79, 6, [5, 5, 59, 59], ["#fff", "#ffe9b8"]);
  }
  function sSatelite() {
    var cont = '<path d="M26 27C28 25 31 26 32 28C31 30 28 31 27 33C25 31 25 29 26 27Z" fill="#4cae5a"/><path d="M34 33C37 32 40 34 39 37C37 38 35 37 34 35Z" fill="#4cae5a"/>';
    return dots(85, 10, [5, 5, 59, 59], ["#fff", "#cfe3ff"]) +
      '<circle cx="32" cy="32" r="21.500" fill="none" stroke="#bfe0ff" stroke-opacity=".28" stroke-width=".7" stroke-dasharray="1.200 2.400"/>' +
      '<circle cx="32" cy="32" r="12" fill="url(#tg-atmo)" opacity=".7"/><circle cx="32" cy="32" r="8.800" fill="url(#tg-ocean)"/>' +
      '<g class="k-spin-slow" style="animation-duration:30s"><g>' + cont + '</g></g>' +
      '<circle cx="32" cy="32" r="8.800" fill="url(#tg-limb)"/>' +
      '<g class="k-orbS"><g transform="translate(32 10.500)">' +
      '<rect x="-9" y="-1.300" width="6.200" height="2.600" fill="#3a7aff" stroke="#bfe0ff" stroke-width=".4"/><rect x="2.800" y="-1.300" width="6.200" height="2.600" fill="#3a7aff" stroke="#bfe0ff" stroke-width=".4"/>' +
      '<path d="M-7 -1.300V1.300M-5 -1.300V1.300M5 -1.300V1.300M7 -1.300V1.300" stroke="#bfe0ff" stroke-width=".3"/>' +
      '<rect x="-2.800" y="-2.200" width="5.600" height="4.400" rx="1" fill="url(#tb-kite)"/><path d="M0 -2.200V-4.500" stroke="#fff" stroke-width=".5"/><circle cx="0" cy="-4.800" r=".7" fill="#ff7a6a"/>' +
      '</g></g>';
  }
  function blob(cx, cy, r, seed, fill, op) {
    var sd = rnd(seed), n = 8, pts = [], i, d = "";
    for (i = 0; i < n; i++) { var a = i * 2 * Math.PI / n, rr = r * (0.72 + sd() * 0.5); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.82]); }
    d = "M" + f((pts[0][0] + pts[n - 1][0]) / 2) + " " + f((pts[0][1] + pts[n - 1][1]) / 2);
    for (i = 0; i < n; i++) { var nx = pts[(i + 1) % n]; d += "Q" + f(pts[i][0]) + " " + f(pts[i][1]) + " " + f((pts[i][0] + nx[0]) / 2) + " " + f((pts[i][1] + nx[1]) / 2); }
    return '<path d="' + d + 'Z" fill="url(#' + fill + ')" opacity="' + op + '"/>';
  }
  function sNebulosa() {
    return '<g class="k-spin-slow">' +
      blob(24, 22, 17, 3, "tb-nC", 0.9) + blob(42, 40, 18, 5, "tb-nA", 0.85) + blob(40, 20, 13, 8, "tb-nB", 0.8) + blob(20, 44, 13, 11, "tb-nB", 0.75) +
      '<path d="M6 40C20 34 30 38 44 28S58 20 62 22" fill="none" stroke="#080320" stroke-opacity=".6" stroke-width="3.600" stroke-linecap="round"/>' +
      '</g><g class="k-spin-rev">' + blob(32, 32, 14, 14, "tb-nD", 0.7) + blob(46, 28, 9, 17, "tb-nA", 0.6) + blob(18, 30, 9, 21, "tb-nC", 0.6) + "</g>" +
      '<circle class="k-pulse" cx="32" cy="32" r="9" fill="url(#tg-core)" opacity=".9"/>' +
      '<g class="k-tw t1"><path d="M32 22V42M22 32H42" stroke="#fff" stroke-opacity=".7" stroke-width=".8" stroke-linecap="round"/></g>' +
      '<circle cx="32" cy="32" r="2.200" fill="#fff"/>' +
      '<g class="k-tw t0"><circle cx="28" cy="35" r="1" fill="#ffe0f6"/></g><g class="k-tw t2"><circle cx="36.500" cy="28.500" r="1.100" fill="#cfeeff"/></g><g class="k-tw t3"><circle cx="35" cy="37" r=".8" fill="#fff"/></g>' +
      dots(31, 18, [4, 4, 60, 60], ["#fff", "#e9defe", "#bfe6ff"]) + spark(51, 13, 2.600, "k-tw t2") + spark(12, 52, 2, "k-tw t3", "#ffd0f0");
  }
  function sBrujula() {
    var tk = "", rose = "", i, a, r0, r1;
    for (i = 0; i < 72; i++) { a = i * Math.PI / 36; r0 = i % 18 === 0 ? 20.2 : i % 6 === 0 ? 21 : 21.9; r1 = 23; tk += "M" + f(32 + r0 * Math.cos(a)) + " " + f(32 + r0 * Math.sin(a)) + "L" + f(32 + r1 * Math.cos(a)) + " " + f(32 + r1 * Math.sin(a)); }
    var main = [[0, "#ff8a78", "#b82a1e"], [90, "#fff0c0", "#b8862e"], [180, "#fff0c0", "#b8862e"], [270, "#fff0c0", "#b8862e"]];
    for (i = 0; i < 4; i++) rose += '<g transform="rotate(' + (45 + i * 90) + ' 32 32)"><path d="M32 20L33.600 29.500L32 32Z" fill="#e8d9b0"/><path d="M32 20L30.400 29.500L32 32Z" fill="#8a7040"/></g>';
    for (i = 0; i < 4; i++) rose += '<g transform="rotate(' + main[i][0] + ' 32 32)"><path d="M32 14.500L35.600 28.400L32 32Z" fill="' + main[i][1] + '"/><path d="M32 14.500L28.400 28.400L32 32Z" fill="' + main[i][2] + '"/></g>';
    var L = '<g fill="none" stroke="#ffe29a" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round">' +
      '<g transform="translate(32 10.600)" stroke="#ff6a5a"><path d="M-1.300 1.800V-1.800L1.300 1.800V-1.800"/></g>' +
      '<g transform="translate(53.400 32)"><path d="M1 -1.800H-1V1.800H1M-1 0H.8"/></g>' +
      '<g transform="translate(32 53.400)"><path d="M1.200 -1.300C1 -1.900 -1.200 -1.900 -1.200 -.7C-1.200 .3 1.200 0 1.200 1C1.200 2 -.9 2 -1.200 1.400"/></g>' +
      '<g transform="translate(10.600 32)"><path d="M-1.700 -1.800L-.8 1.800L0 -.4L.8 1.800L1.700 -1.800"/></g></g>';
    return '<circle cx="32" cy="32" r="17" fill="url(#tg-glow)" opacity=".28"/>' +
      '<circle cx="32" cy="32" r="23.600" fill="none" stroke="#ffe29a" stroke-opacity=".75" stroke-width=".8"/><circle cx="32" cy="32" r="19.400" fill="none" stroke="#ffe29a" stroke-opacity=".28" stroke-width=".6"/>' +
      '<path d="' + tk + '" stroke="#ffe29a" stroke-opacity=".8" stroke-width=".6" stroke-linecap="round"/>' +
      '<g class="k-spin-rev"><circle cx="32" cy="32" r="16.200" fill="none" stroke="#9fe8ff" stroke-opacity=".4" stroke-width=".7" stroke-dasharray="1 3.200"/></g>' +
      L + rose +
      '<g class="k-needle"><path d="M32 16.500L34.800 32H29.200Z" fill="#ff4a3a"/><path d="M32 16.500L32 32H29.200Z" fill="#c82a1e"/><path d="M32 47.500L34.800 32H29.200Z" fill="#f4f6ff"/><path d="M32 47.500L32 32H29.200Z" fill="#aeb8d6"/></g>' +
      '<circle cx="32" cy="32" r="3.400" fill="url(#tb-kite)" stroke="#7a5a1c" stroke-width=".5"/><circle cx="32" cy="32" r="1.400" fill="#0a2430"/><circle cx="31.300" cy="31.300" r=".5" fill="#fff" opacity=".9"/>' +
      '<g class="k-tw t2"><circle cx="20" cy="18" r=".9" fill="#fff"/></g>';
  }
  function sLuna() {
    return dots(41, 7, [6, 6, 58, 58], ["#fff", "#dfe6ff"]) + '<circle cx="32" cy="32" r="22" fill="url(#tg-glow)" opacity=".4"/>' +
      fit('<g class="k-sway"><g clip-path="url(#tg-moonc)">' +
      '<circle cx="32" cy="32" r="23" fill="url(#tg-moon2)"/>' +
      '<g fill="#a89ad6" opacity=".5"><path d="M18 22Q24 16 30 21Q33 27 27 31Q19 31 18 22Z"/><path d="M34 36Q42 31 47 37Q46 45 38 46Q32 43 34 36Z"/><path d="M28 12Q34 9 38 13Q35 17 29 16Z"/></g>' +
      '<circle cx="22" cy="42" r="4.200" fill="#9a8cc8" opacity=".42"/><circle cx="22" cy="42" r="3.100" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>' +
      '<circle cx="41" cy="24" r="3" fill="#9a8cc8" opacity=".4"/><circle cx="35" cy="48" r="2.200" fill="#9a8cc8" opacity=".4"/><circle cx="14" cy="30" r="2.400" fill="#9a8cc8" opacity=".38"/><circle cx="48" cy="40" r="1.800" fill="#9a8cc8" opacity=".38"/>' +
      '<circle cx="32" cy="32" r="23" fill="url(#tg-limb2)"/><g class="k-phase"><circle cx="32" cy="32" r="23.500" fill="#070820" opacity=".86"/></g></g></g>', 0.82);
  }

  var OLD_IDS = { nebulosa: 1, agujero: 1, cometa: 1 };
  var STICKERS = [
    { id: "tierra", n: "Tierra", svg: badge("tierra", fit(earth(), 0.74) + '<g class="k-spin-slow"><circle cx="32" cy="8.500" r="2.100" fill="#e8e4ff"/><circle cx="31.500" cy="8" r=".8" fill="#9a8cc8" opacity=".6"/></g>') },
    { id: "galaxia", n: "Galaxia", svg: badge("galaxia", fit(galaxy2(), 1.02)) },
    { id: "estrella", n: "Estrella", svg: badge("estrella", sEstrella()) },
    { id: "planeta", n: "Saturno", svg: badge("planeta", sSaturno()) },
    { id: "nebulosa", n: "Nebulosa", svg: badge("nebulosa", sNebulosa()) },
    { id: "luna", n: "Luna", svg: badge("luna", sLuna()) },
    { id: "agujero", n: "Agujero negro", svg: badge("agujero", fit(oldArt("agujero"), 0.8)) },
    { id: "cometa", n: "Cometa", svg: badge("cometa", fit(oldArt("cometa"), 0.84, -1, 2)) },
    { id: "cohete", n: "Cohete", svg: badge("cohete", sCohete()) },
    { id: "ovni", n: "Ovni", svg: badge("ovni", sOvni()) },
    { id: "constelacion", n: "Constelación", svg: badge("constelacion", sConstelacion()) },
    { id: "eclipse", n: "Eclipse", svg: badge("eclipse", sEclipse()) },
    { id: "cristal", n: "Cristal", svg: badge("cristal", sCristal()) },
    { id: "aurora", n: "Aurora", svg: badge("aurora", sAurora()) },
    { id: "fenix", n: "Medusa estelar", svg: badge("fenix", sMedusa()) }, /* id histórico "fenix": se conserva para no perder el ícono en notas existentes */
    { id: "brujula", n: "Brújula estelar", svg: badge("brujula", sBrujula()) },
    { id: "sistema", n: "Sistema solar", svg: badge("sistema", sSistema()) },
    { id: "pulsar", n: "Púlsar", svg: badge("pulsar", sPulsar()) },
    { id: "ojo", n: "Ojo cósmico", svg: badge("ojo", sOjo()) },
    { id: "reloj", n: "Reloj de arena", svg: badge("reloj", sReloj()) },
    { id: "satelite", n: "Satélite", svg: badge("satelite", sSatelite()) }
  ];

  /* Ficha de cada detalle (se ve al mantener pulsado): tipo, descripción, qué hace su animación y un dato */
  var INFO = {
    tierra: { t: "Planeta", d: "Nuestro hogar, con sus continentes, océanos y una Luna que la acompaña. Está dibujada con un mapa real simplificado.", a: "Gira sobre su eje, las nubes van un poco más rápido y la Luna da vueltas alrededor.", c: "Un día completo dura 24 horas." },
    galaxia: { t: "Galaxia espiral", d: "Miles de millones de estrellas en brazos que giran alrededor de un núcleo cálido. Las bandas oscuras son polvo.", a: "Los brazos giran lento y la barra central gira al revés.", c: "La Vía Láctea tarda unos 230 millones de años en dar una vuelta." },
    estrella: { t: "Estrella", d: "Una esfera de gas que brilla por fusión nuclear. Los destellos en cruz son un efecto de la luz.", a: "Late, lanza ondas de luz y sus rayos giran en sentidos opuestos.", c: "El Sol es una estrella de tamaño mediano." },
    planeta: { t: "Saturno · gigante con anillos", d: "Un planeta gaseoso con bandas de nubes y anillos de hielo y roca.", a: "Las bandas se desplazan, el planeta se mece y un destello recorre el anillo.", c: "Sus anillos miden cientos de miles de km de ancho pero son delgadísimos." },
    nebulosa: { t: "Nube cósmica", d: "Nubes de gas y polvo de colores donde nacen las estrellas, con una banda de polvo oscuro y un cúmulo brillante en el centro.", a: "Las nubes giran despacio en sentidos opuestos, el cúmulo late y las estrellas titilan.", c: "La nebulosa de Orión se ve a simple vista como una mancha difusa." },
    luna: { t: "Satélite", d: "La Luna con sus mares oscuros y cráteres, iluminada por el Sol.", a: "Cambia de fase muy despacio y se balancea suave.", c: "La Luna se aleja de la Tierra unos 3,8 cm por año." },
    agujero: { t: "Agujero negro", d: "Una región donde la gravedad es tan fuerte que ni la luz escapa. El disco brillante es materia cayendo hacia él.", a: "El disco brilla con destellos que giran y la materia cae hacia el centro.", c: "Su borde, el horizonte de sucesos, es el punto sin retorno." },
    cometa: { t: "Cometa", d: "Una bola de hielo y polvo que, cerca del Sol, deja dos colas: una azul de gas y otra dorada de polvo.", a: "Flota mientras partículas de su cola salen disparadas.", c: "La cola siempre apunta en dirección contraria al Sol." },
    cohete: { t: "Nave", d: "Un cohete que despega rumbo al espacio, con la Tierra abajo.", a: "Flota, su llama vibra y las líneas de velocidad pasan de largo.", c: "Para escapar de la gravedad terrestre hay que superar unos 11 km por segundo." },
    ovni: { t: "Platillo", d: "Un platillo volador de fantasía con su rayo tractor sobre una colina.", a: "Flota, sus luces parpadean y el rayo pulsa con chispas que suben.", c: "Es un detalle de fantasía: ¡no hay avistamientos confirmados!" },
    constelacion: { t: "Constelación", d: "Un dibujo imaginario que une estrellas. En Tronx, las constelaciones son tus notas unidas.", a: "Las líneas avanzan punteadas, las estrellas titilan y de vez en cuando cruza una estrella fugaz.", c: "Hay 88 constelaciones reconocidas oficialmente." },
    eclipse: { t: "Eclipse total", d: "Cuando la Luna tapa al Sol y solo queda visible su corona.", a: "La corona late, sus rayos giran en sentidos opuestos y el anillo de diamante recorre el borde.", c: "Un eclipse total dura como máximo unos 7 minutos y medio." },
    cristal: { t: "Gema", d: "Un cristal tallado que refracta la luz en sus facetas.", a: "Flota y un destello de luz lo recorre, con chispas alrededor.", c: "Los cristales crecen átomo a átomo, durante miles de años." },
    aurora: { t: "Fenómeno polar", d: "Cortinas de luz verde, turquesa y rosa sobre un paisaje de montañas. Nacen cuando partículas del Sol chocan con la atmósfera.", a: "Las cortinas ondulan y cambian de intensidad.", c: "Las auroras ocurren a unos 100 km de altura." },
    fenix: { t: "Criatura del espacio", d: "Una medusa que flota entre estrellas, con su campana translúcida y tentáculos luminosos.", a: "La campana late nadando, los tentáculos ondulan y suben burbujas.", c: "Algunas medusas existen desde hace más de 500 millones de años, antes que los dinosaurios." },
    sistema: { t: "Sistema planetario", d: "Un sol con tres planetas en órbita: uno rocoso, uno azul con su lunita verde y uno con anillos.", a: "Cada planeta gira a su propia velocidad, más rápido cuanto más cerca del sol.", c: "Mercurio da una vuelta al Sol en 88 días; Neptuno tarda 165 años." },
    pulsar: { t: "Estrella de neutrones", d: "El núcleo ultradenso de una estrella muerta que gira a toda velocidad y lanza dos haces de luz como un faro.", a: "Los haces barren el espacio, el núcleo late y salen ondas.", c: "Algunos púlsares giran cientos de veces por segundo." },
    ojo: { t: "Mirada cósmica", d: "Un ojo con un iris hecho de galaxia que observa el universo.", a: "Mira de lado a lado, el iris gira despacio y parpadea de vez en cuando.", c: "Parpadeamos unas 15 veces por minuto." },
    reloj: { t: "Tiempo", d: "Un reloj de arena dorada: lo que se acaba arriba se acumula abajo.", a: "La arena cae, y al terminar el reloj se da vuelta para empezar de nuevo.", c: "Se usaban en barcos para medir la guardia, porque el vaivén no los afecta." },
    satelite: { t: "Nave orbital", d: "Un satélite con paneles solares dando vueltas alrededor de la Tierra.", a: "Orbita sin parar mientras la Tierra gira lento debajo.", c: "La Estación Espacial Internacional da una vuelta a la Tierra cada 90 minutos." },
    brujula: { t: "Instrumento", d: "Una rosa de los vientos con aguja magnética que busca el norte.", a: "La aguja oscila hasta asentarse y el aro exterior gira lento.", c: "La aguja apunta al norte magnético, que se desplaza unos 50 km por año." }
  };
  STICKERS.forEach(function (st) { st.info = INFO[st.id] || null; });


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
    '<radialGradient id="tg-ocean" cx=".38" cy=".32" r=".9"><stop offset="0" stop-color="#4fb3ff"/><stop offset=".55" stop-color="#1e6fd6"/><stop offset="1" stop-color="#0b2f86"/></radialGradient>' +
    '<linearGradient id="tg-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7bd86a"/><stop offset=".55" stop-color="#3fae55"/><stop offset="1" stop-color="#b9a45a"/></linearGradient>' +
    '<radialGradient id="tg-limb" cx=".36" cy=".32" r=".82"><stop offset=".45" stop-color="#020a2a" stop-opacity="0"/><stop offset=".82" stop-color="#020a2a" stop-opacity=".38"/><stop offset="1" stop-color="#020a2a" stop-opacity=".78"/></radialGradient>' +
    '<radialGradient id="tg-atmo"><stop offset=".72" stop-color="#5cc8ff" stop-opacity=".5"/><stop offset=".86" stop-color="#5cc8ff" stop-opacity=".16"/><stop offset="1" stop-color="#5cc8ff" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="tg-earth"><circle cx="32" cy="32" r="22"/></clipPath>' +
    '<radialGradient id="tg-moon2" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="#fffdf2"/><stop offset=".5" stop-color="#e6dcff"/><stop offset="1" stop-color="#9c88e6"/></radialGradient>' +
    '<radialGradient id="tg-limb2" cx=".4" cy=".35" r=".75"><stop offset=".55" stop-color="#1b1060" stop-opacity="0"/><stop offset="1" stop-color="#1b1060" stop-opacity=".45"/></radialGradient>' +
    '<clipPath id="tg-moonc"><circle cx="32" cy="32" r="23"/></clipPath>' +
    '<clipPath id="tg-front"><rect x="-40" y="0" width="80" height="20"/></clipPath>' +
    '<linearGradient id="tg-ion" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe6ff"/><stop offset=".5" stop-color="#5fb4ff" stop-opacity=".5"/><stop offset="1" stop-color="#5fb4ff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-tail2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6b8"/><stop offset=".4" stop-color="#d9a6ff" stop-opacity=".6"/><stop offset="1" stop-color="#9a7bff" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="tg-bulge"><stop offset="0" stop-color="#fffaf0"/><stop offset=".35" stop-color="#ffe3a8"/><stop offset=".75" stop-color="#ff9ec9" stop-opacity=".45"/><stop offset="1" stop-color="#b58bff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".42" stop-color="#ffe58a"/><stop offset=".78" stop-color="#ffa94d" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="tg-ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd978"/><stop offset="1" stop-color="#ff9f4a"/></linearGradient>' +
    '<radialGradient id="tg-glow2"><stop offset="0" stop-color="#ffdca3" stop-opacity=".9"/><stop offset=".5" stop-color="#ff9c6b" stop-opacity=".3"/><stop offset="1" stop-color="#ff9c6b" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-gas" cx=".34" cy=".3" r=".95"><stop offset="0" stop-color="#fff3d1"/><stop offset=".5" stop-color="#e8b86d"/><stop offset="1" stop-color="#7a4a26"/></radialGradient>' +
    '<linearGradient id="tg-ring2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe9b8"/><stop offset=".5" stop-color="#e2b46a"/><stop offset="1" stop-color="#fff2d2"/></linearGradient>' +
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
    ".ic.sk.anim .k-spin,.ic.sk.anim .k-spin-slow,.ic.sk.anim .k-spin-rev,.ic.sk.anim .k-gal-a,.ic.sk.anim .k-gal-b,.ic.sk.anim .k-suck{transform-box:view-box;transform-origin:32px 32px}" +
    ".ic.sk.anim .k-ring{transform-box:fill-box;transform-origin:center;animation:tk-ring 4s ease-out infinite}.ic.sk.anim .k-ring.r2{animation-delay:-2s}" +
    ".ic.sk.anim .k-spin-rev{animation:tk-spin-r 34s linear infinite}.ic.sk.anim .k-gal-a{animation:tk-spin 70s linear infinite}.ic.sk.anim .k-gal-b{animation:tk-spin-r 22s linear infinite}" +
    ".ic.sk.anim .k-phase{animation:tk-phase 28s ease-in-out infinite}" +
    ".ic.sk.anim .k-pil{transform-box:fill-box;transform-origin:50% 100%;animation:tk-pil 7s ease-in-out infinite}.ic.sk.anim .k-pil.p2{animation-duration:9s;animation-delay:-3s}" +
    ".ic.sk.anim .k-dash2{animation-duration:3.6s;animation-direction:reverse}" +
    ".ic.sk.anim .k-stream{animation:tk-stream 2.4s ease-in infinite}.ic.sk.anim .k-stream.s1{animation-delay:-.6s}.ic.sk.anim .k-stream.s2{animation-delay:-1.2s}.ic.sk.anim .k-stream.s3{animation-delay:-1.8s}" +
        ".ic.sk.anim .k-orn,.ic.sk.anim .k-diam,.ic.sk.anim .k-needle{transform-box:view-box;transform-origin:32px 32px}" +
    ".dart .ic.sk.anim .k-orn{animation:tk-spin 120s linear infinite}.ic.sk.anim .k-diam{animation:tk-spin 16s linear infinite}" +
    ".ic.sk.anim .k-needle{animation:tk-needle 8s ease-in-out infinite}" +
    ".ic.sk.anim .k-flap{transform-box:view-box;transform-origin:31px 36px;animation:tk-flap 1.4s ease-in-out infinite alternate}" +
    ".ic.sk.anim .k-streak{animation:tk-streak 1.5s linear infinite}.ic.sk.anim .k-streak.s1{animation-delay:-.4s}.ic.sk.anim .k-streak.s2{animation-delay:-.8s}.ic.sk.anim .k-streak.s3{animation-delay:-1.1s}" +
    ".ic.sk.anim .k-ember{transform-box:fill-box;transform-origin:50% 50%;animation:tk-ember 2.4s ease-out infinite}.ic.sk.anim .k-ember.e2{animation-delay:-.6s}.ic.sk.anim .k-ember.e3{animation-delay:-1.2s}.ic.sk.anim .k-ember.e4{animation-delay:-1.8s}" +
    ".ic.sk.anim .k-aur{transform-box:fill-box;transform-origin:50% 100%;animation:tk-aur 7s ease-in-out infinite}.ic.sk.anim .k-aur.a2{animation-duration:9s;animation-delay:-3s}.ic.sk.anim .k-aur.a3{animation-duration:11s;animation-delay:-5s}" +
    ".ic.sk.anim .k-sweep2{animation:tk-sweep2 4.4s ease-in-out infinite}" +
    ".ic.sk.anim .k-shoot{animation:tk-shoot 7s linear infinite}" +
    ".ic.sk.anim .k-blink{animation:tk-blink 1.8s ease-in-out infinite}.ic.sk.anim .k-blink.b2{animation-delay:-.6s}.ic.sk.anim .k-blink.b3{animation-delay:-1.2s}" +
    ".ic.sk.anim .k-flick{transform-box:fill-box;transform-origin:50% 0;animation:tk-flick 1.1s ease-in-out infinite}" +
    ".ic.sk.anim .k-beam{animation:tk-beam 2.6s ease-in-out infinite}" +
    ".ic.sk.anim .k-hover{animation:tk-hover 3.4s ease-in-out infinite}" +
    ".ic.sk.anim .k-orbA,.ic.sk.anim .k-orbB,.ic.sk.anim .k-orbC,.ic.sk.anim .k-orbS,.ic.sk.anim .k-beamspin,.ic.sk.anim .k-flip{transform-box:view-box;transform-origin:32px 32px}" +
    ".ic.sk.anim .k-orbA{animation:tk-spin 7s linear infinite}.ic.sk.anim .k-orbB{animation:tk-spin 13s linear infinite}.ic.sk.anim .k-orbC{animation:tk-spin 24s linear infinite}.ic.sk.anim .k-orbS{animation:tk-spin 9s linear infinite}" +
    ".ic.sk.anim .k-beamspin{animation:tk-spin 5s linear infinite}" +
    ".ic.sk.anim .k-wave{transform-box:fill-box;transform-origin:50% 0;animation:tk-wave 3s ease-in-out infinite alternate}.ic.sk.anim .k-wave.w2{animation-delay:-1.500s}" +
    ".ic.sk.anim .k-swim{transform-box:fill-box;transform-origin:50% 0;animation:tk-swim 2.600s ease-in-out infinite}" +
    ".ic.sk.anim .k-lid{transform-box:fill-box;transform-origin:50% 50%;animation:tk-lid 6s ease-in-out infinite}.ic.sk.anim .k-look{animation:tk-look 7s ease-in-out infinite alternate}" +
    ".ic.sk.anim .k-sunsurf{animation:tk-sunsurf 16s linear infinite}" +
    ".ic.sk.anim .k-flip{animation:tk-flip 10s ease-in-out infinite}" +
    ".ic.sk.anim .k-sandT{transform-box:fill-box;transform-origin:50% 100%;animation:tk-sandT 10s linear infinite}.ic.sk.anim .k-sandB{transform-box:fill-box;transform-origin:50% 100%;animation:tk-sandB 10s linear infinite}" +
    ".ic.sk.anim .k-sandline{animation:tk-dash 1s linear infinite,tk-sandl 10s linear infinite}" +
    ".ic.sk.anim .k-band{animation:tk-band 16s linear infinite}" +
    ".ic.sk.anim .k-orb{transform-box:fill-box;transform-origin:center;animation:tk-spin 2.6s linear infinite}.ic.sk.anim .k-pulse,.ic.sk.anim .k-beat,.ic.sk.anim .k-tw,.ic.sk.anim .k-float,.ic.sk.anim .k-sway,.ic.sk.anim .k-hover,.ic.sk.anim .k-fly,.ic.sk.anim .k-d1,.ic.sk.anim .k-d2,.ic.sk.anim .k-d3{transform-box:fill-box;transform-origin:center}" +
    ".ic.sk.anim .k-spin{animation:tk-spin 26s linear infinite}" +
    ".ic.sk.anim .k-earth{animation:tk-earth 110s linear infinite}.ic.sk.anim .k-cloud{animation:tk-earth 80s linear infinite}" +
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
    "@keyframes tk-phase{0%,100%{transform:translateX(-12px)}50%{transform:translateX(-38px)}}" +
    "@keyframes tk-pil{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}" +
    "@keyframes tk-stream{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(-13px,12px);opacity:0}}" +
        "@keyframes tk-needle{0%,100%{transform:rotate(-34deg)}15%{transform:rotate(24deg)}30%{transform:rotate(-14deg)}45%{transform:rotate(8deg)}60%{transform:rotate(-3deg)}75%{transform:rotate(1deg)}}" +
    "@keyframes tk-flap{from{transform:rotate(4deg)}to{transform:rotate(-12deg)}}" +
    "@keyframes tk-streak{0%{transform:translateY(-8px);opacity:0}25%{opacity:.85}100%{transform:translateY(16px);opacity:0}}" +
    "@keyframes tk-ember{0%{transform:translate(0,0) scale(1);opacity:0}15%{opacity:1}100%{transform:translate(2px,-16px) scale(.3);opacity:0}}" +
    "@keyframes tk-aur{0%,100%{transform:translateX(-2px) scaleY(1);opacity:.85}50%{transform:translateX(2px) scaleY(1.14);opacity:1}}" +
    "@keyframes tk-sweep2{0%,50%{transform:translateX(-28px)}100%{transform:translateX(60px)}}" +
    "@keyframes tk-shoot{0%,78%{transform:translate(0,0);opacity:0}80%{opacity:1}100%{transform:translate(-24px,18px);opacity:0}}" +
    "@keyframes tk-blink{0%,100%{opacity:.25}50%{opacity:1}}" +
    "@keyframes tk-flick{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.07)}}" +
    "@keyframes tk-beam{0%,100%{opacity:.55}50%{opacity:1}}" +
    "@keyframes tk-hover{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.600px)}}" +
    "@keyframes tk-wave{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}" +
    "@keyframes tk-swim{0%,100%{transform:scale(1.04,.94)}50%{transform:scale(.96,1.06)}}" +
    "@keyframes tk-lid{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.06)}}" +
    "@keyframes tk-look{from{transform:translateX(-4px)}to{transform:translateX(4px)}}" +
    "@keyframes tk-sunsurf{from{transform:translateX(0)}to{transform:translateX(-24px)}}" +
    "@keyframes tk-flip{0%,86%{transform:rotate(0)}98%,100%{transform:rotate(180deg)}}" +
    "@keyframes tk-sandT{0%{transform:scaleY(1)}86%,100%{transform:scaleY(0)}}" +
    "@keyframes tk-sandB{0%{transform:scaleY(0)}86%,100%{transform:scaleY(1)}}" +
    "@keyframes tk-sandl{0%,84%{opacity:1}88%,100%{opacity:0}}" +
    "@keyframes tk-spin{to{transform:rotate(360deg)}}" +
    "@keyframes tk-spin-r{to{transform:rotate(-360deg)}}" +
    "@keyframes tk-ring{0%{transform:scale(.7);opacity:.75}100%{transform:scale(2.7);opacity:0}}" +
    "@keyframes tk-band{from{transform:translateX(0)}to{transform:translateX(-40px)}}" +
    "@keyframes tk-earth{from{transform:translateX(-88px)}to{transform:translateX(0)}}" +
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
    var parts = [DEFS.replace("</defs>", badgeDefs() + "</defs>")];
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
