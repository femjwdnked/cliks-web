/* La mascota de Cliks: un asterisco esponjoso con dos ojitos.
   - Botón de ayuda flotando abajo a la derecha: al pulsarlo abre un chat de ayuda con las dudas más comunes y, si no basta, un botón para hablar con una persona por WhatsApp.
   - Cualquier <span class="cliks-mascota" data-tam="120" data-estado="feliz"></span> se convierte en mascota.
   Los ojitos siguen el mouse (o el dedo), parpadea, flota. Respeta "reducir movimiento". */
(function () {
  "use strict";
  var WHATSAPP = "https://wa.me/525566738980?text=" + encodeURIComponent("Hola, tengo una duda sobre Cliks.");
  var CORREO = "mailto:contacto@cliks.mx?subject=" + encodeURIComponent("Duda sobre Cliks");
  var COTIZAR = "https://wa.me/525566738980?text=" + encodeURIComponent("Hola, somos un despacho o empresa y queremos una cotización de Cliks.");
  var CANCELAR = "https://billing.stripe.com/p/login/5kQcMY9Lz4Mz1Cs0IoefC00";

  // Las dudas de quien visita el sitio. Cada respuesta son párrafos; un trozo puede ser texto o un enlace {t, h}.
  var FAQ = [
    { p: "¿Qué es Cliks?", r: [["Es una app para Mac y Windows que baja por ti, con la e.firma, los documentos del SAT de tus clientes (opinión de cumplimiento y constancia de situación fiscal) y te avisa cuándo vence cada e.firma. Todo queda en tu computadora."]] },
    { p: "¿Cuánto cuesta y cómo es la prueba?", r: [["Empiezas con ", "7 días gratis", ": hoy no se te cobra nada y puedes cancelar cuando quieras. Los planes y precios están en ", { t: "«Elige cada cuánto quieres pagar»", h: "#seccion-precio" }, "."]] },
    { p: "¿Mi e.firma sale de mi computadora?", r: [["No. Se guarda cifrada en tu computadora y nunca se sube a ningún servidor nuestro: la app entra al portal del SAT desde tu propio equipo."]] },
    { p: "¿Cómo cancelo?", r: [["Al instante y sin hablar con nadie, desde ", { t: "este enlace", h: CANCELAR }, ". Si cancelas durante la prueba, no se te cobra."]] },
    { p: "¿Dan factura?", r: [["Sí. En la pantalla de pago marca la casilla ", "«Estoy comprando en calidad de empresa»", " (también si eres persona física), escribe tu RFC y tu nombre o razón social como salen en tu constancia de situación fiscal, y llena código postal, régimen y uso de CFDI. La factura se emite cuando se hace el primer cobro (la prueba gratis no genera cobro)."], ["Si se te pasó, escríbenos a contacto@cliks.mx con esos datos."]] },
    { p: "Somos un despacho o empresa grande, ¿hay algo especial?", r: [["Sí, con gusto. Cuéntanos cuántas personas y computadoras son y si necesitan factura o una forma de pago distinta, y te respondemos con una propuesta a tu medida."], [{ t: "Pedir una cotización por WhatsApp", h: COTIZAR }, " o escribe a contacto@cliks.mx."]] },
    { p: "Ya pagué, ¿cómo la instalo?", r: [["Aquí está la guía paso a paso: ", { t: "Cómo instalar", h: "instalar.html" }, ". La primera vez, Windows o Mac muestran una advertencia normal con los programas nuevos; la guía explica qué hacer."]] },
    { p: "¿Funciona en Mac y en Windows?", r: [["Sí, en las dos. Te pide tu correo para entrar y no necesitas contraseñas."]] }
  ];
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
    ".cm-panel{position:fixed;right:14px;bottom:112px;z-index:61;width:340px;max-width:calc(100vw - 20px);max-height:min(540px,calc(100vh - 130px));display:none;flex-direction:column;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 30px 70px -18px rgba(16,24,40,.45),0 0 0 1px rgba(16,24,40,.07);font:14px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#101828}",
    ".cm-panel.abierto{display:flex;animation:cm-entra .18s ease-out}",
    "@keyframes cm-entra{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}",
    ".cm-cab{display:flex;align-items:center;justify-content:space-between;padding:13px 10px 13px 18px;background:linear-gradient(135deg,#eaf1ff,#f4f0ff)}",
    ".cm-cab b{font-size:15px}.cm-cab small{display:block;color:#667085;font-size:12px;font-weight:400}",
    ".cm-x{border:0;background:none;font-size:24px;line-height:1;width:36px;height:36px;border-radius:50%;cursor:pointer;color:#475467}.cm-x:hover{background:rgba(16,24,40,.07)}",
    ".cm-cuerpo{overflow-y:auto;padding:14px 16px 8px;flex:1}",
    ".cm-saludo{margin:0 0 10px;color:#344054}",
    ".cm-q{display:block;width:100%;text-align:left;border:1px solid #e4e7ec;background:#fff;border-radius:12px;padding:10px 13px;margin:0 0 7px;font:inherit;font-size:13.5px;color:#101828;cursor:pointer}.cm-q:hover,.cm-q:focus-visible{border-color:#2f6fed;background:#f5f8ff;outline:none}",
    ".cm-volver{border:0;background:none;color:#2f6fed;font:inherit;font-weight:600;font-size:13px;cursor:pointer;padding:0;margin:0 0 8px}",
    ".cm-pregunta{font-weight:700;margin:0 0 8px}.cm-resp{margin:0 0 10px;color:#344054}.cm-resp a{color:#2f6fed;font-weight:600}",
    ".cm-pie{padding:10px 16px 14px;border-top:1px solid #eef0f4;background:#fafbfe}",
    ".cm-pie p{margin:0 0 8px;font-size:12.5px;color:#667085}",
    ".cm-btn{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;border-radius:999px;padding:10px 14px;font-weight:700;font-size:13.5px;margin:0 0 7px}",
    ".cm-btn.wa{background:#2f6fed;color:#fff}.cm-btn.co{background:#fff;color:#344054;border:1px solid #d0d5dd;font-weight:600}",
    "@media (max-width:760px){.cm-soporte{right:8px;bottom:8px}.cm-soporte .cm{--t:70px}.cm-burbuja{display:none}.cm-panel{right:8px;bottom:92px;max-height:calc(100vh - 110px)}}",
    "@media (prefers-reduced-motion:reduce){.cm-flota,.cm-sombra{animation:none}.cm .o{transition:none}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function crear(tam, estado, sigue) {
    var m = document.createElement("span"); m.className = "cm" + (estado === "feliz" ? " feliz" : ""); m.style.setProperty("--t", tam + "px");
    if (sigue) m.setAttribute("data-sigue", "1");
    m.innerHTML = '<span class="cm-sombra"></span><span class="cm-flota"><img src="imagenes/mascota-cuerpo.webp" alt="" width="360" height="384" decoding="async"><i class="o i"></i><i class="o d"></i></span>';
    return m;
  }
  // --- el chat de ayuda ---
  var panel = null, cuerpo = null, abierto = false;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function parrafo(partes) {
    var p = el("p", "cm-resp");
    partes.forEach(function (t) {
      if (typeof t === "string") { p.appendChild(document.createTextNode(t)); return; }
      var a = el("a", "", t.t); a.href = t.h;
      if (/^https?:/.test(t.h)) { a.target = "_blank"; a.rel = "noopener"; } else a.addEventListener("click", cierra);
      p.appendChild(a);
    });
    return p;
  }
  function lista() {
    cuerpo.textContent = "";
    cuerpo.appendChild(el("p", "cm-saludo", "¡Hola! Soy la mascota de Cliks. ¿Qué quieres saber?"));
    FAQ.forEach(function (f, i) {
      var b = el("button", "cm-q", f.p); b.type = "button"; b.addEventListener("click", function () { respuesta(i); }); cuerpo.appendChild(b);
    });
  }
  function respuesta(i) {
    var f = FAQ[i]; cuerpo.textContent = "";
    var v = el("button", "cm-volver", "← Otras preguntas"); v.type = "button"; v.addEventListener("click", lista); cuerpo.appendChild(v);
    cuerpo.appendChild(el("p", "cm-pregunta", f.p));
    f.r.forEach(function (par) { cuerpo.appendChild(parrafo(par)); });
    cuerpo.scrollTop = 0;
  }
  function construye() {
    panel = el("div", "cm-panel"); panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ayuda de Cliks");
    var cab = el("div", "cm-cab"), t = el("div"); t.appendChild(el("b", "", "Ayuda de Cliks")); t.appendChild(el("small", "", "Respuestas al momento"));
    var x = el("button", "cm-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Cerrar"); x.addEventListener("click", cierra);
    cab.appendChild(t); cab.appendChild(x); panel.appendChild(cab);
    cuerpo = el("div", "cm-cuerpo"); panel.appendChild(cuerpo);
    var pie = el("div", "cm-pie"); pie.appendChild(el("p", "", "¿No encontraste lo que buscabas?"));
    var wa = el("a", "cm-btn wa", "Hablar con una persona (WhatsApp)"); wa.href = WHATSAPP; wa.target = "_blank"; wa.rel = "noopener";
    var co = el("a", "cm-btn co", "Escribirnos un correo"); co.href = CORREO;
    pie.appendChild(wa); pie.appendChild(co); panel.appendChild(pie);
    document.body.appendChild(panel); lista();
  }
  function abre() { if (!panel) construye(); else lista(); panel.classList.add("abierto"); abierto = true; }
  function cierra() { if (panel) panel.classList.remove("abierto"); abierto = false; }
  window.cliksAyuda = { abrir: abre, cerrar: cierra };
  addEventListener("keydown", function (e) { if (e.key === "Escape" && abierto) cierra(); });

  function parpadea(m) {
    if (quieto) return;
    setTimeout(function () { m.classList.add("p"); setTimeout(function () { m.classList.remove("p"); parpadea(m); }, 140); }, 2200 + Math.random() * 3300);
  }
  function inicia() {
    document.querySelectorAll(".cliks-mascota").forEach(function (h) {
      var m = crear(parseInt(h.getAttribute("data-tam") || "110", 10), h.getAttribute("data-estado"), true); h.appendChild(m); parpadea(m);
    });
    // Botón de soporte
    // Sigue siendo un enlace a WhatsApp por si el script falla; con el script, abre el chat de ayuda.
    var a = document.createElement("a"); a.className = "cm-soporte"; a.href = WHATSAPP; a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", "Abrir el chat de ayuda");
    a.addEventListener("click", function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); a.classList.remove("dice"); if (abierto) cierra(); else abre(); });
    var b = document.createElement("span"); b.className = "cm-burbuja"; b.textContent = "¿Dudas? Pregúntame"; a.appendChild(b);
    var m = crear(88, "", true); a.appendChild(m); document.body.appendChild(a); parpadea(m);
    // se asoma con su globito una sola vez por visita
    try {
      if (!quieto && innerWidth > 760 && !sessionStorage.getItem("cm-dijo")) {          // en el celular no, para no tapar el botón
        setTimeout(function () { a.classList.add("dice"); sessionStorage.setItem("cm-dijo", "1"); setTimeout(function () { a.classList.remove("dice"); }, 5500); }, 7000);
      }
    } catch (e) {}
    // Cualquier botón con data-abrir-ayuda abre el mismo chat (por ejemplo, el del pie de la página).
    document.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-abrir-ayuda]"); if (t) { e.preventDefault(); abre(); } });
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
