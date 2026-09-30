/* La mascota de Cliks: un asterisco esponjoso con dos ojitos.
   - Botón de soporte (WhatsApp) flotando abajo a la derecha.
   - Cualquier <span class="cliks-mascota" data-tam="120" data-estado="feliz"></span> se convierte en mascota.
   Los ojitos siguen el mouse (o el dedo), parpadea, flota. Respeta "reducir movimiento". */
(function () {
  "use strict";
  var WHATSAPP = "https://wa.me/525566738980";
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css = [
    ".cm{position:relative;display:inline-block;width:var(--t,100px);height:calc(var(--t,100px)*664/622);flex-shrink:0}",
    ".cm-flota{position:absolute;inset:0;animation:cm-flota 3.6s ease-in-out infinite;transform-origin:50% 60%}",
    ".cm-sombra{position:absolute;left:18%;right:18%;bottom:-7%;height:9%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(40,50,120,.32),rgba(40,50,120,0) 70%);animation:cm-sombra 3.6s ease-in-out infinite}",
    ".cm img{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;user-select:none}",
    ".cm .o{position:absolute;top:48.5%;width:5%;height:9.9%;border-radius:50%;transform:translate(-50%,-50%) translate(var(--mx,0px),var(--my,0px)) scaleY(var(--b,1));transition:transform .09s ease-out;",
    "background:linear-gradient(135deg,#3d3b35 0%,#1b1b1c 55%,#0c0c0e 100%);box-shadow:calc(var(--t)*.008) calc(var(--t)*.011) calc(var(--t)*.014) rgba(15,25,95,.38),inset 0 calc(var(--t)*-.005) calc(var(--t)*.008) rgba(0,0,0,.45)}",
    ".cm .o::after{content:'';position:absolute;left:16%;top:9%;width:30%;height:33%;border-radius:50%;background:linear-gradient(#fff,rgba(255,255,255,.15));opacity:.85;transform:rotate(14deg)}",
    ".cm .o.i{left:41.6%}.cm .o.d{left:58%}",
    ".cm.p{--b:.1}",
    ".cm.feliz .o{width:9.6%;height:4.2%;border-radius:999px 999px 0 0;background:none;box-shadow:none;border:calc(var(--t)*.021) solid #17171a;border-bottom:none;top:49.5%}",
    ".cm.feliz .o::after{display:none}",
    "@keyframes cm-flota{0%,100%{transform:translateY(0) rotate(-1.6deg)}50%{transform:translateY(-6%) rotate(1.6deg)}}",
    "@keyframes cm-sombra{0%,100%{transform:scaleX(1);opacity:.95}50%{transform:scaleX(.86);opacity:.6}}",
    ".cm-soporte{position:fixed;right:14px;bottom:12px;z-index:60;display:flex;align-items:center;gap:8px;text-decoration:none;-webkit-tap-highlight-color:transparent}",
    ".cm-soporte .cm{--t:88px}",
    ".cm-burbuja{background:#fff;color:#101828;font:700 13.5px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;padding:10px 14px;border-radius:14px;box-shadow:0 12px 30px -10px rgba(16,24,40,.35),0 0 0 1px rgba(16,24,40,.06);white-space:nowrap;opacity:0;transform:translateX(8px) scale(.94);transform-origin:100% 50%;transition:opacity .2s,transform .2s;pointer-events:none;position:relative}",
    ".cm-burbuja::after{content:'';position:absolute;right:-6px;top:50%;width:12px;height:12px;margin-top:-6px;background:#fff;transform:rotate(45deg);border-radius:2px}",
    ".cm-soporte:hover .cm-burbuja,.cm-soporte:focus-visible .cm-burbuja,.cm-soporte.dice .cm-burbuja{opacity:1;transform:none}",
    ".cm-soporte:focus-visible{outline:3px solid #2f6fed;outline-offset:4px;border-radius:16px}",
    "@media (max-width:760px){.cm-soporte{right:8px;bottom:8px}.cm-soporte .cm{--t:70px}.cm-burbuja{display:none}}",
    "@media (prefers-reduced-motion:reduce){.cm-flota,.cm-sombra{animation:none}.cm .o{transition:none}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function crear(tam, estado, sigue) {
    var m = document.createElement("span"); m.className = "cm" + (estado === "feliz" ? " feliz" : ""); m.style.setProperty("--t", tam + "px");
    if (sigue) m.setAttribute("data-sigue", "1");
    m.innerHTML = '<span class="cm-sombra"></span><span class="cm-flota"><img src="imagenes/mascota-cuerpo.webp" alt="" width="360" height="384" decoding="async"><i class="o i"></i><i class="o d"></i></span>';
    return m;
  }
  function parpadea(m) {
    if (quieto) return;
    setTimeout(function () { m.classList.add("p"); setTimeout(function () { m.classList.remove("p"); parpadea(m); }, 140); }, 2200 + Math.random() * 3300);
  }
  function inicia() {
    document.querySelectorAll(".cliks-mascota").forEach(function (h) {
      var m = crear(parseInt(h.getAttribute("data-tam") || "110", 10), h.getAttribute("data-estado"), true); h.appendChild(m); parpadea(m);
    });
    // Botón de soporte
    var a = document.createElement("a"); a.className = "cm-soporte"; a.href = WHATSAPP; a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", "Soporte por WhatsApp");
    var b = document.createElement("span"); b.className = "cm-burbuja"; b.textContent = "¿Dudas? Escríbeme"; a.appendChild(b);
    var m = crear(88, "", true); a.appendChild(m); document.body.appendChild(a); parpadea(m);
    // se asoma con su globito una sola vez por visita
    try {
      if (!quieto && innerWidth > 760 && !sessionStorage.getItem("cm-dijo")) {          // en el celular no, para no tapar el botón
        setTimeout(function () { a.classList.add("dice"); sessionStorage.setItem("cm-dijo", "1"); setTimeout(function () { a.classList.remove("dice"); }, 5500); }, 7000);
      }
    } catch (e) {}
    // los ojitos siguen el mouse o el dedo
    var mx = 0, my = 0, pend = false;
    function sigue(e) {
      var p = e.touches ? e.touches[0] : e; if (!p) return; mx = p.clientX; my = p.clientY;
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        document.querySelectorAll(".cm[data-sigue='1']").forEach(function (el) {
          var r = el.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * .52), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
          el.style.setProperty("--mx", (dx / d * k * r.width * .045).toFixed(1) + "px"); el.style.setProperty("--my", (dy / d * k * r.width * .03).toFixed(1) + "px");
        });
      });
    }
    if (!quieto) { addEventListener("mousemove", sigue, { passive: true }); addEventListener("touchmove", sigue, { passive: true }); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicia); else inicia();
})();
