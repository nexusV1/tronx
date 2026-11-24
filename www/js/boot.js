// Si el universo no llegó a cargar, la app no puede quedar tapada ni inerte.
window.addEventListener("load", function () {
  if (window.TronxUniverse) return;
  var sp = document.getElementById("splash"), ap = document.getElementById("app");
  if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  if (ap) { ap.removeAttribute("inert"); ap.removeAttribute("aria-hidden"); }
  try { document.dispatchEvent(new CustomEvent("tronx:enter")); } catch (e) {}
});
