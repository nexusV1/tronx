/* Stickers de Tronx: dibujos originales en SVG (sin imágenes). Se definen una sola vez en un "sprite" y las tarjetas
   los usan con <use>, así no pesan ni se duplican. Cada sticker vive en un cuadro de 64x64. */
(function () {
  "use strict";
  var STICKERS = [
    { id: "galaxia", n: "Galaxia", svg:
      '<ellipse cx="32" cy="32" rx="28" ry="12" transform="rotate(-24 32 32)" fill="url(#tg-glow)" opacity=".55"/>' +
      '<path d="M32 32c-3-9 4-17 14-16 9 1 15 8 13 15-6-6-13-6-18-3" fill="none" stroke="url(#tg-arm)" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M32 32c3 9-4 17-14 16-9-1-15-8-13-15 6 6 13 6 18 3" fill="none" stroke="url(#tg-arm)" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="32" cy="32" r="8" fill="url(#tg-core)"/><circle cx="14" cy="14" r="1.2" fill="#fff"/><circle cx="51" cy="52" r="1.1" fill="#dcd0ff"/><circle cx="52" cy="10" r=".9" fill="#fff"/>' },
    { id: "estrella", n: "Estrella", svg:
      '<circle cx="32" cy="32" r="22" fill="url(#tg-glow)" opacity=".5"/>' +
      '<path d="M32 4c1.6 14 5 24 7 25.5 2 1.5 12 5 21 2.5-9 2.5-19 6-21 7.5-2 1.5-5.4 11.5-7 24.500-1.600-13-5-23-7-24.500-2-1.500-12-5-21-7.500 9 2.500 19-1 21-2.500C27 28 30.400 18 32 4z" fill="url(#tg-star)"/>' +
      '<circle cx="32" cy="32" r="3.5" fill="#fff"/>' },
    { id: "planeta", n: "Planeta con anillos", svg:
      '<ellipse cx="32" cy="34" rx="29" ry="8.5" transform="rotate(-18 32 34)" fill="none" stroke="url(#tg-ring)" stroke-width="3.2" opacity=".85"/>' +
      '<circle cx="32" cy="32" r="14.500" fill="url(#tg-planet)"/>' +
      '<path d="M18 28c8 2 20 1 28-3M18.500 36c8 2 18 1 27-3" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M3 38c8 5.500 24 4 40-3 8-3.500 14-9 17-14.500" fill="none" stroke="url(#tg-ring)" stroke-width="3.200" stroke-linecap="round" transform="translate(0 0)" opacity="0"/>' +
      '<path d="M5 41.500c11 3.500 28 0 42-8" fill="none" stroke="url(#tg-ring)" stroke-width="3.200" stroke-linecap="round" clip-path="url(#tg-front)"/>' },
    { id: "nebulosa", n: "Nebulosa", svg:
      '<g filter="url(#tg-blur)"><ellipse cx="24" cy="30" rx="17" ry="13" fill="#7c4dff" opacity=".85"/><ellipse cx="40" cy="26" rx="16" ry="12" fill="#e052c8" opacity=".7"/><ellipse cx="34" cy="40" rx="17" ry="11" fill="#33b8ff" opacity=".65"/></g>' +
      '<circle cx="18" cy="16" r="1.200" fill="#fff"/><circle cx="48" cy="46" r="1.400" fill="#fff"/><circle cx="12" cy="46" r="1" fill="#e9defe"/><circle cx="50" cy="14" r="1" fill="#fff"/><circle cx="32" cy="32" r="2.200" fill="#fff" opacity=".9"/>' },
    { id: "luna", n: "Luna cósmica", svg:
      '<circle cx="32" cy="32" r="26" fill="url(#tg-glow)" opacity=".4"/>' +
      '<path d="M43 8A25 25 0 1 0 56 41 20 20 0 0 1 43 8z" fill="url(#tg-moon)"/>' +
      '<circle cx="26" cy="38" r="3.400" fill="#9a86e8" opacity=".55"/><circle cx="35" cy="48" r="2.200" fill="#9a86e8" opacity=".5"/><circle cx="19" cy="26" r="2.400" fill="#9a86e8" opacity=".5"/>' +
      '<path d="M51 14l1.200 3.300 3.300 1.200-3.300 1.200L51 23l-1.200-3.300-3.300-1.200 3.300-1.200z" fill="#fff"/>' },
    { id: "agujero", n: "Agujero negro", svg:
      '<ellipse cx="32" cy="32" rx="29" ry="9.500" transform="rotate(-14 32 32)" fill="url(#tg-disk)" opacity=".9"/>' +
      '<circle cx="32" cy="32" r="13" fill="#05030f" stroke="url(#tg-ring)" stroke-width="2.600"/>' +
      '<path d="M7 38c10 7 32 6 50-8" fill="none" stroke="url(#tg-disk)" stroke-width="3.400" stroke-linecap="round" clip-path="url(#tg-front)" opacity=".95"/>' +
      '<circle cx="12" cy="14" r="1.100" fill="#fff"/><circle cx="53" cy="50" r="1.200" fill="#fff"/><circle cx="50" cy="12" r=".9" fill="#d9ccff"/>' },
    { id: "cometa", n: "Cometa", svg:
      '<path d="M50 14C38 20 22 34 8 56c14-8 28-14 38-22" fill="url(#tg-tail)" opacity=".9"/>' +
      '<path d="M54 10C42 20 28 32 14 50" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.800" stroke-linecap="round"/>' +
      '<circle cx="48" cy="18" r="9" fill="url(#tg-glow)"/><circle cx="48" cy="18" r="5.600" fill="#fff"/>' +
      '<circle cx="14" cy="14" r="1.200" fill="#fff"/><circle cx="54" cy="46" r="1.200" fill="#fff"/><circle cx="26" cy="10" r=".9" fill="#d9ccff"/>' },
    { id: "cohete", n: "Cohete", svg:
      '<path d="M32 6c8 6 12 16 11 28l-5 5H26l-5-5C20 22 24 12 32 6z" fill="url(#tg-hull)"/>' +
      '<path d="M21 34l-9 9 3 6 8-4zM43 34l9 9-3 6-8-4z" fill="url(#tg-fin)"/>' +
      '<circle cx="32" cy="24" r="5.200" fill="#1a1250" stroke="#fff" stroke-opacity=".8" stroke-width="1.800"/><circle cx="30.500" cy="22.500" r="1.400" fill="#8fe0ff"/>' +
      '<path d="M27 40c0 7 2 12 5 18 3-6 5-11 5-18z" fill="url(#tg-flame)"/>' },
    { id: "ovni", n: "Platillo", svg:
      '<path d="M32 44l-10 14M32 44l10 14M32 44v14" stroke="url(#tg-beam)" stroke-width="0" fill="none"/>' +
      '<path d="M22 46L12 60h40L42 46z" fill="url(#tg-beam)" opacity=".5"/>' +
      '<path d="M22 28a10 10 0 0 1 20 0z" fill="url(#tg-glass)"/>' +
      '<ellipse cx="32" cy="32" rx="26" ry="8.500" fill="url(#tg-hull)"/>' +
      '<circle cx="17" cy="33" r="1.800" fill="#8fe0ff"/><circle cx="32" cy="36" r="1.800" fill="#ffd36e"/><circle cx="47" cy="33" r="1.800" fill="#8fe0ff"/>' },
    { id: "constelacion", n: "Constelación", svg:
      '<path d="M10 46L22 22 38 30 54 12M38 30l8 22" fill="none" stroke="#bda8ff" stroke-opacity=".7" stroke-width="1.600" stroke-linecap="round" stroke-dasharray="1 4"/>' +
      '<g fill="url(#tg-star)"><circle cx="10" cy="46" r="4"/><circle cx="22" cy="22" r="5"/><circle cx="38" cy="30" r="4.500"/><circle cx="54" cy="12" r="5"/><circle cx="46" cy="52" r="3.600"/></g>' +
      '<g fill="#fff"><circle cx="22" cy="22" r="1.800"/><circle cx="54" cy="12" r="1.800"/><circle cx="38" cy="30" r="1.600"/></g>' },
    { id: "eclipse", n: "Eclipse", svg:
      '<circle cx="32" cy="32" r="28" fill="url(#tg-glow)" opacity=".65"/>' +
      '<circle cx="32" cy="32" r="19" fill="none" stroke="url(#tg-ring)" stroke-width="3.500"/>' +
      '<circle cx="32" cy="32" r="17" fill="#06030f"/>' +
      '<path d="M32 4v6M32 54v6M4 32h6M54 32h6M12 12l4 4M48 48l4 4M52 12l-4 4M16 48l-4 4" stroke="#e8dcff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>' },
    { id: "cristal", n: "Cristal cósmico", svg:
      '<circle cx="32" cy="34" r="24" fill="url(#tg-glow)" opacity=".45"/>' +
      '<path d="M32 6l16 14-6 32H22l-6-32z" fill="url(#tg-crystal)"/>' +
      '<path d="M32 6l-6 14h12zM16 20h32M26 20l-4 32M38 20l4 32M32 20v32" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.400" stroke-linejoin="round"/>' +
      '<path d="M32 6l-6 14 6 32 6-32z" fill="#fff" fill-opacity=".13"/><circle cx="50" cy="12" r="1.600" fill="#fff"/><circle cx="12" cy="44" r="1.200" fill="#fff"/>' }
  ];
  var DEFS =
    '<defs>' +
    '<radialGradient id="tg-glow"><stop offset="0" stop-color="#b79bff" stop-opacity=".95"/><stop offset=".55" stop-color="#7c4dff" stop-opacity=".35"/><stop offset="1" stop-color="#7c4dff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="tg-core" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#e6d9ff"/><stop offset="1" stop-color="#8a5cf5" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="tg-arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset=".5" stop-color="#a98bff"/><stop offset="1" stop-color="#e072d6"/></linearGradient>' +
    '<linearGradient id="tg-star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c9"/><stop offset=".55" stop-color="#d9c2ff"/><stop offset="1" stop-color="#8f6bff"/></linearGradient>' +
    '<linearGradient id="tg-ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fd8ff"/><stop offset=".5" stop-color="#c8b2ff"/><stop offset="1" stop-color="#f09be0"/></linearGradient>' +
    '<radialGradient id="tg-planet" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d9c8ff"/><stop offset=".55" stop-color="#8a5cf5"/><stop offset="1" stop-color="#3a1e8f"/></radialGradient>' +
    '<filter id="tg-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>' +
    '<radialGradient id="tg-moon" cx=".4" cy=".35" r=".9"><stop offset="0" stop-color="#fff7da"/><stop offset=".6" stop-color="#d7c9ff"/><stop offset="1" stop-color="#8c76e0"/></radialGradient>' +
    '<linearGradient id="tg-disk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a5a" stop-opacity=".1"/><stop offset=".35" stop-color="#ffd27a"/><stop offset=".65" stop-color="#e072d6"/><stop offset="1" stop-color="#7c4dff" stop-opacity=".15"/></linearGradient>' +
    '<clipPath id="tg-front"><rect x="0" y="32" width="64" height="32"/></clipPath>' +
    '<linearGradient id="tg-tail" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe3ff"/><stop offset=".5" stop-color="#9a7bff" stop-opacity=".7"/><stop offset="1" stop-color="#9a7bff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-hull" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1eaff"/><stop offset=".6" stop-color="#b9a2ff"/><stop offset="1" stop-color="#6a45d6"/></linearGradient>' +
    '<linearGradient id="tg-fin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e072d6"/><stop offset="1" stop-color="#7a3fc4"/></linearGradient>' +
    '<linearGradient id="tg-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ff9a5a"/><stop offset="1" stop-color="#e0408a" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe3ff" stop-opacity=".8"/><stop offset="1" stop-color="#9fe3ff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="tg-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f4ff"/><stop offset="1" stop-color="#6aa8ff"/></linearGradient>' +
    '<linearGradient id="tg-crystal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe3ff"/><stop offset=".5" stop-color="#a98bff"/><stop offset="1" stop-color="#e072d6"/></linearGradient>' +
    '</defs>';

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
  }
  window.TronxStickers = { list: STICKERS, mount: mount };
})();
