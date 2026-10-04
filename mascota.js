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
  // El asistente con IA vive en nuestro servidor (la llave nunca está en esta página). Si está apagado o no contesta, el chat sigue como siempre.
  var API = "https://servidor-licencias-37nv.onrender.com";
  var ENLACES_OK = [CANCELAR, "https://wa.me/525566738980"], DOMINIOS_OK = ["cliks.mx", "www.cliks.mx"];

  // Las dudas de quien visita el sitio. Cada respuesta son párrafos; un trozo puede ser texto o un enlace {t, h}.
  var FAQ = [
    { p: "¿Qué es Cliks?", r: [["Es una app para Mac y Windows que baja por ti, con la e.firma, los documentos del SAT de tus clientes (opinión de cumplimiento y constancia de situación fiscal) y te avisa cuándo vence cada e.firma. Todo queda en tu computadora."]] },
    { p: "¿Cuánto cuesta y cómo es la prueba?", r: [["Empiezas con ", "7 días gratis", ": hoy no se te cobra nada y puedes cancelar cuando quieras. Los planes y precios están en ", { t: "«Elige cada cuánto quieres pagar»", h: "#seccion-precio" }, "."]] },
    { p: "¿Mi e.firma sale de mi computadora?", r: [["No. Se guarda cifrada en tu computadora y nunca se sube a ningún servidor nuestro: la app entra al portal del SAT desde tu propio equipo."]] },
    { p: "¿Cómo cancelo?", r: [["Sin hablar con nadie, desde ", { t: "este enlace", h: CANCELAR }, ". No se te vuelve a cobrar y conservas el acceso hasta que termine lo que ya pagaste. Si cancelas durante la prueba, no se te cobra."]] },
    { p: "¿Dan factura?", r: [["Sí. En la pantalla de pago marca la casilla ", "«Estoy comprando en calidad de empresa»", " (también si eres persona física), escribe tu RFC y tu nombre o razón social como salen en tu constancia de situación fiscal, y llena código postal, régimen y uso de CFDI. La factura se emite cuando se hace el primer cobro (la prueba gratis no genera cobro)."], ["Si se te pasó, escríbenos a contacto@cliks.mx con esos datos."]] },
    { p: "Somos un despacho o empresa grande, ¿hay algo especial?", r: [["Sí, con gusto. Cuéntanos cuántas personas y computadoras son y si necesitan factura o una forma de pago distinta, y te respondemos con una propuesta a tu medida."], [{ t: "Pedir una cotización por WhatsApp", h: COTIZAR }, " o escribe a contacto@cliks.mx."]] },
    { p: "Ya pagué, ¿cómo la instalo?", r: [["Aquí está la guía paso a paso: ", { t: "Cómo instalar", h: "instalar.html" }, ". La primera vez, Windows o Mac muestran una advertencia normal con los programas nuevos; la guía explica qué hacer."]] },
    { p: "¿Funciona en Mac y en Windows?", r: [["Sí, en las dos. Te pide tu correo y te manda un código para entrar. Si prefieres, también puedes crear una contraseña (es opcional)."]] }
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
    ".cm-panel{position:fixed;right:14px;bottom:112px;z-index:61;width:340px;max-width:calc(100vw - 20px);max-height:min(540px,calc(100vh - 130px));display:none;flex-direction:column;background:linear-gradient(150deg,rgba(255,255,255,.60),rgba(238,244,255,.30) 55%,rgba(230,226,255,.28));-webkit-backdrop-filter:blur(30px) saturate(1.9) brightness(1.03);backdrop-filter:blur(30px) saturate(1.9) brightness(1.03);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.65);box-shadow:0 34px 70px -22px rgba(26,42,122,.45),0 2px 10px -4px rgba(16,24,40,.12),inset 0 1.5px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(255,255,255,.35),inset 1px 0 0 rgba(255,255,255,.45);font:14px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#101828}",
    ".cm-panel.abierto{display:flex;animation:cm-entra .18s ease-out}",
    ".cm-panel::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(120% 55% at 18% -8%,rgba(255,255,255,.65),transparent 58%),radial-gradient(70% 40% at 100% 100%,rgba(181,139,255,.16),transparent 70%)}",
    ".cm-panel>*{position:relative}",
    "@keyframes cm-entra{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}",
    ".cm-cab{display:flex;align-items:center;justify-content:space-between;padding:14px 12px 10px 20px}",
    ".cm-cab b{font-size:15px}.cm-cab small{display:block;color:#667085;font-size:12px;font-weight:400}",
    ".cm-x{border:0;background:none;font-size:24px;line-height:1;width:36px;height:36px;border-radius:50%;cursor:pointer;color:#475467}.cm-x:hover{background:rgba(16,24,40,.07)}",
    ".cm-cuerpo{overflow-y:auto;padding:14px 16px 8px;flex:1}",
    ".cm-saludo{margin:0 0 10px;color:#344054}",
    ".cm-q{display:block;width:100%;text-align:left;border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.42);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:16px;padding:11px 14px;margin:0 0 7px;box-shadow:0 8px 18px -14px rgba(26,42,122,.4),inset 0 1px 0 rgba(255,255,255,.8);font:inherit;font-size:13.5px;color:#101828;cursor:pointer}.cm-q:hover,.cm-q:focus-visible{border-color:#2f6fed;background:#f5f8ff;outline:none}",
    ".cm-volver{border:0;background:none;color:#2f6fed;font:inherit;font-weight:600;font-size:13px;cursor:pointer;padding:0;margin:0 0 8px}",
    ".cm-pregunta{font-weight:700;margin:0 0 8px}.cm-resp{margin:0 0 10px;color:#344054}.cm-resp a{color:#2f6fed;font-weight:600}",
    ".cm-pie{padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.22)}",
    ".cm-pie p{margin:0 0 8px;font-size:12.5px;color:#667085}",
    ".cm-btn{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;border-radius:999px;padding:10px 14px;font-weight:700;font-size:13.5px;margin:0 0 7px}",
    ".cm-btn.wa{background:linear-gradient(180deg,#4a98ff,#2f6fed);color:#fff;box-shadow:0 12px 22px -12px rgba(47,111,237,.8)}.cm-btn.co{background:rgba(255,255,255,.65);color:#344054;border:1px solid rgba(255,255,255,.95);font-weight:600}",
    ".cm-msg{max-width:88%;margin:0 0 8px;padding:9px 12px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}",
    ".cm-msg.yo{margin-left:auto;background:linear-gradient(180deg,rgba(74,152,255,.93),rgba(47,111,237,.93));color:#fff;border-bottom-right-radius:6px;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 18px -12px rgba(47,111,237,.8)}",
    ".cm-msg.ia{background:rgba(255,255,255,.58);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#283142;border:1px solid rgba(255,255,255,.85);border-bottom-left-radius:6px;box-shadow:0 8px 18px -14px rgba(26,42,122,.4),inset 0 1px 0 rgba(255,255,255,.85)}",
    ".cm-msg.ia a{color:#2f6fed;font-weight:600}",
    ".cm-msg.pensando{color:#667085;display:flex;align-items:center;gap:10px;padding:6px 14px 6px 8px}.cm-msg.pensando canvas{width:44px;height:44px;flex:none}",
    ".cm-msg.ia{position:relative;overflow:hidden}.cm-msg .cm-mos{position:absolute;inset:0;display:grid;pointer-events:none}.cm-msg .cm-mos i{border-radius:2px;margin:1px;opacity:0}",
    ".cm-form{display:flex;gap:6px;margin:0 0 6px}",
    ".cm-form input{flex:1;min-width:0;border:1px solid rgba(255,255,255,.85);background:rgba(255,255,255,.55);box-shadow:inset 0 1px 2px rgba(16,24,40,.06);border-radius:999px;padding:10px 14px;font:inherit;font-size:13.5px;color:#101828}.cm-form input:focus{outline:2px solid #2f6fed}",
    ".cm-form button{border:0;border-radius:999px;padding:0 16px;font:inherit;font-weight:700;font-size:13.5px;color:#fff;background:linear-gradient(180deg,rgba(74,152,255,.95),rgba(47,111,237,.95));box-shadow:inset 0 1px 0 rgba(255,255,255,.45);cursor:pointer}.cm-form button:disabled,.cm-form input:disabled{opacity:.55;cursor:default}",
    ".cm-aviso-ia{margin:0 0 8px !important;font-size:11.5px !important;color:#667085}",
    ".cm-pie details{margin:0}.cm-pie summary{cursor:pointer;font-size:12.5px;color:#475467;font-weight:600;padding:2px 0}",
    "@media (max-width:760px){.cm-soporte{right:8px;bottom:8px}.cm-soporte .cm{--t:70px}.cm-burbuja{display:none}.cm-panel{right:8px;bottom:92px;max-height:calc(100vh - 110px)}}",
    "@media (prefers-reduced-motion:reduce){.cm-flota,.cm-sombra{animation:none}.cm .o{transition:none}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function crear(tam, estado, sigue, color) {
    var m = document.createElement("span"); m.className = "cm" + (estado === "feliz" ? " feliz" : ""); m.style.setProperty("--t", tam + "px");
    if (sigue) m.setAttribute("data-sigue", "1");
    m.innerHTML = '<span class="cm-sombra"></span><span class="cm-flota"><img src="imagenes/mascota-' + (color || "cuerpo") + '.webp" alt="" width="360" height="384" decoding="async"><i class="o i"></i><i class="o d"></i></span>';
    return m;
  }
  // --- el chat de ayuda ---
  var panel = null, cuerpo = null, pie = null, subtitulo = null, abierto = false;
  var ia = { activo: false, revisado: false, boleto: "", historial: [], esperando: false };
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
  // ¿Está prendido el asistente con IA? Se pregunta una vez; si no contesta pronto, se sigue sin él.
  function revisaIA(cuando) {
    if (ia.revisado) { cuando && cuando(); return; }
    ia.revisado = true;
    var fin = function () { cuando && cuando(); };
    if (!window.fetch) { fin(); return; }
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); }, 9000);
    fetch(API + "/asistente/estado", { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { ia.activo = !!d && d.activo === true && typeof d.boleto === "string"; ia.boleto = ia.activo ? d.boleto : ""; })
      .catch(function () {})
      .then(function () { clearTimeout(t); fin(); });
  }
  // Sólo se hacen links los de la lista; cualquier otra dirección que venga en la respuesta se muestra como texto.
  function enlazable(u) {
    u = u.replace(/[.,;:!?]+$/, "");
    if (ENLACES_OK.indexOf(u) >= 0 || ENLACES_OK.some(function (e) { return u.indexOf(e + "?") === 0; })) return true;
    var m = /^https:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i.exec(u); return !!m && DOMINIOS_OK.indexOf(m[1].toLowerCase()) >= 0;
  }
  function conEnlaces(p, texto) {
    var re = /https?:\/\/[^\s)\]>"']+/g, i = 0, m;
    while ((m = re.exec(texto))) {
      p.appendChild(document.createTextNode(texto.slice(i, m.index)));
      var u = m[0].replace(/[.,;:!?]+$/, ""), resto = m[0].slice(u.length);
      if (enlazable(u)) { var a = el("a", "", u.indexOf("wa.me") > 0 ? "WhatsApp" : u.indexOf("stripe") > 0 ? "este enlace" : u.replace(/^https:\/\//, "")); a.href = u; a.target = "_blank"; a.rel = "noopener"; p.appendChild(a); }
      else p.appendChild(document.createTextNode(m[0]));
      if (resto) p.appendChild(document.createTextNode(resto));
      i = m.index + m[0].length;
    }
    p.appendChild(document.createTextNode(texto.slice(i)));
  }
  // El orbe de «pensando»: un globo de puntos que gira con partículas en órbita (lo dibuja un canvas; se detiene solo al quitarse de la página).
  function orbe(lienzo) {
    var cx = lienzo.getContext("2d"), W = lienzo.width, N = 110, P = [], t0 = performance.now(), quieto = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
    for (var i = 0; i < N; i++) { var y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963; P.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
    function dibuja(ahora) {
      if (!document.body.contains(lienzo)) return;
      var t = quieto ? 0 : (ahora - t0) / 1000, c = W / 2, R = W * .34, tilt = .5, ang = t * .35;
      cx.clearRect(0, 0, W, W);
      for (var k = 0; k < N; k++) {
        var p = P[k], x = p[0] * Math.cos(ang) + p[2] * Math.sin(ang), z = -p[0] * Math.sin(ang) + p[2] * Math.cos(ang);
        var y2 = p[1] * Math.cos(tilt) - z * Math.sin(tilt), z2 = p[1] * Math.sin(tilt) + z * Math.cos(tilt), d = (z2 + 1) / 2;
        cx.fillStyle = "rgba(47,111,237," + (.3 + .55 * d) + ")"; cx.beginPath(); cx.arc(c + x * R, c + y2 * R, (1.2 + 1.5 * d) * W / 96, 0, 6.283); cx.fill();
      }
      for (var o = 0; o < 3; o++) for (var j = 0; j < 8; j++) {
        var an = t * (1.1 + o * .35) + j / 8 * 6.283 + o * 2.1, rot = o * 1.05 + .4, ox = Math.cos(an) * R * 1.18, oy = Math.sin(an) * R * 1.18 * (.32 + .12 * o);
        cx.fillStyle = "rgba(109,93,246," + (.35 + .5 * ((Math.sin(an) + 1) / 2)) + ")"; cx.beginPath();
        cx.arc(c + ox * Math.cos(rot) - oy * Math.sin(rot), c + ox * Math.sin(rot) + oy * Math.cos(rot), 2.2 * W / 96, 0, 6.283); cx.fill();
      }
      if (!quieto) requestAnimationFrame(dibuja);
    }
    requestAnimationFrame(dibuja);
  }
  // Al llegar una respuesta, la burbuja se «revela» con un mosaico de cuadritos (rápido; con «reducir movimiento» no se hace).
  function revela(burbuja) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    var cols = 12, filas = 4, colores = ["#2f6fed", "#4a98ff", "#6d5df6", "#8fb7ff", "#b9a8fb"], mos = el("div", "cm-mos"), celdas = [], hijos = [];
    mos.style.gridTemplateColumns = "repeat(" + cols + ",1fr)"; mos.style.gridTemplateRows = "repeat(" + filas + ",1fr)";
    for (var i = 0; i < cols * filas; i++) { var c = el("i"); c.style.background = colores[Math.floor(Math.random() * colores.length)]; mos.appendChild(c); celdas.push(c); }
    for (var h = 0; h < burbuja.childNodes.length; h++) hijos.push(burbuja.childNodes[h]);
    burbuja.style.color = "transparent"; for (var q = 0; q < hijos.length; q++) if (hijos[q].style) hijos[q].style.opacity = "0";
    burbuja.appendChild(mos);
    celdas.forEach(function (c) {
      var d = Math.random() * 380; c.style.transition = "opacity .16s ease " + d + "ms"; void c.offsetWidth; c.style.opacity = ".92";
      setTimeout(function () { c.style.transition = "opacity .3s ease"; c.style.opacity = "0"; }, d + 260 + Math.random() * 260);
    });
    setTimeout(function () { burbuja.style.color = ""; for (var q = 0; q < hijos.length; q++) if (hijos[q].style) hijos[q].style.opacity = ""; }, 380);
    setTimeout(function () { if (mos.parentNode) mos.parentNode.removeChild(mos); }, 1100);
  }
  function mensaje(quien, texto) {
    var d = el("div", "cm-msg " + quien); if (quien === "ia") conEnlaces(d, texto); else d.textContent = texto;
    cuerpo.appendChild(d); cuerpo.scrollTop = cuerpo.scrollHeight; return d;
  }
  function botonPersona() {
    var wa = el("a", "cm-btn wa", "Hablar con una persona (WhatsApp)"); wa.href = WHATSAPP; wa.target = "_blank"; wa.rel = "noopener"; cuerpo.appendChild(wa); cuerpo.scrollTop = cuerpo.scrollHeight;
  }
  function conversacion() {
    cuerpo.textContent = "";
    var v = el("button", "cm-volver", "← Otras preguntas"); v.type = "button"; v.addEventListener("click", lista); cuerpo.appendChild(v);
  }
  function enviar(texto, campo, boton) {
    texto = texto.replace(/\s+/g, " ").trim(); if (!texto || ia.esperando) return;
    if (!ia.historial.length) conversacion();
    ia.historial.push({ rol: "usuario", texto: texto.slice(0, 600) }); mensaje("yo", texto);
    ia.esperando = true; campo.value = ""; campo.disabled = boton.disabled = true;
    var pens = el("div", "cm-msg ia pensando"); pens.setAttribute("aria-label", "Escribiendo"); var lienzo = el("canvas"); lienzo.width = lienzo.height = 132; pens.appendChild(lienzo); pens.appendChild(el("span", "", "Pensando…")); cuerpo.appendChild(pens); orbe(lienzo); cuerpo.scrollTop = cuerpo.scrollHeight;
    var listo = function (txt, persona, guardar) {
      pens.remove(); ia.esperando = false; campo.disabled = boton.disabled = false; revela(mensaje("ia", txt)); if (persona) botonPersona();
      if (guardar) ia.historial.push({ rol: "asistente", texto: txt.slice(0, 600) });      // los avisos de error no cuentan como parte de la plática
      campo.focus();
    };
    var pregunta = function (reintento) {
      var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); }, 40000);
      fetch(API + "/asistente/preguntar", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl ? ctl.signal : undefined, body: JSON.stringify({ boleto: ia.boleto, mensajes: ia.historial.slice(-8) }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, estado: r.status, d: d }; }); })
        .then(function (x) {
          clearTimeout(t);
          if (x.ok && typeof x.d.respuesta === "string") { listo(x.d.respuesta, x.d.necesita_persona === true, true); return; }
          if (x.estado === 401 && !reintento) {                      // el boleto venció (la visita fue larga): se pide otro y se repite UNA vez
            ia.revisado = false; ia.activo = false;
            revisaIA(function () { if (ia.activo) pregunta(true); else { pintaPie(); listo("Ahora mismo no puedo contestar. Escríbenos por WhatsApp y una persona te ayuda.", true, false); } });
            return;
          }
          if (x.estado === 404) { ia.activo = false; pintaPie(); }
          var detalle = typeof x.d.detail === "string" ? x.d.detail : "Ahora mismo no puedo contestar. Escríbenos por WhatsApp y una persona te ayuda.";
          listo(detalle, true, false);
        })
        .catch(function () { clearTimeout(t); listo("No pude conectarme. Revisa tu internet o escríbenos por WhatsApp y una persona te ayuda.", true, false); });
    };
    pregunta(false);
  }
  function pintaPie() {
    if (!pie) return;
    pie.textContent = "";
    if (subtitulo) subtitulo.textContent = ia.activo ? "Asistente con IA · puede equivocarse" : "Respuestas al momento";
    if (ia.activo) {
      var f = el("form", "cm-form"), campo = el("input"); campo.type = "text"; campo.maxLength = 600; campo.placeholder = "Escribe tu duda…"; campo.setAttribute("aria-label", "Escribe tu duda");
      campo.autocomplete = "off"; var b = el("button", "", "Enviar"); b.type = "submit"; f.appendChild(campo); f.appendChild(b);
      f.addEventListener("submit", function (e) { e.preventDefault(); enviar(campo.value, campo, b); });
      pie.appendChild(f);
      pie.appendChild(el("p", "cm-aviso-ia", "Es una IA: puede equivocarse. No escribas contraseñas, tarjetas ni datos de tu e.firma."));
      var d = el("details"); d.appendChild(el("summary", "", "¿Prefieres hablar con una persona?")); d.appendChild(contactos()); pie.appendChild(d);
    } else {
      pie.appendChild(el("p", "", "¿No encontraste lo que buscabas?")); pie.appendChild(contactos());
    }
  }
  function contactos() {
    var c = el("div"), wa = el("a", "cm-btn wa", "Hablar con una persona (WhatsApp)"); wa.href = WHATSAPP; wa.target = "_blank"; wa.rel = "noopener";
    var co = el("a", "cm-btn co", "Escribirnos un correo"); co.href = CORREO; c.appendChild(wa); c.appendChild(co); return c;
  }
  // «¡Buenas tardes! ¿Cómo estás? Hoy es sábado 3 de octubre.» según la hora y la fecha de quien visita (se arma aquí, sin mandar nada a nadie).
  function saludoDeHoy() {
    var ahora = new Date(), h = ahora.getHours();
    var momento = h < 12 ? "Buenos días" : (h < 20 ? "Buenas tardes" : "Buenas noches");
    var fecha = "";
    try { fecha = ahora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }); } catch (e) { fecha = ""; }
    return "¡" + momento + "! ¿Cómo estás?" + (fecha ? " Hoy es " + fecha + "." : "");
  }

  function lista() {
    cuerpo.textContent = ""; ia.historial = []; ia.esperando = false;
    cuerpo.appendChild(el("p", "cm-saludo", ia.activo ? saludoDeHoy() + " Soy el asistente con IA de Cliks. ¿En qué te ayudo? Escribe tu duda abajo o elige una de estas:" : "¡Hola! Soy la mascota de Cliks. ¿Qué quieres saber?"));
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
    var cab = el("div", "cm-cab"), t = el("div"); t.appendChild(el("b", "", "Ayuda de Cliks")); subtitulo = el("small", "", "Respuestas al momento"); t.appendChild(subtitulo);
    var x = el("button", "cm-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Cerrar"); x.addEventListener("click", cierra);
    cab.appendChild(t); cab.appendChild(x); panel.appendChild(cab);
    cuerpo = el("div", "cm-cuerpo"); panel.appendChild(cuerpo);
    pie = el("div", "cm-pie"); panel.appendChild(pie); pintaPie();
    document.body.appendChild(panel); lista();
  }
  function abre() {
    if (!panel) construye(); else if (!ia.esperando) lista();
    panel.classList.add("abierto"); abierto = true;
    revisaIA(function () { if (ia.activo && panel) { pintaPie(); if (!ia.historial.length && !ia.esperando) lista(); } });
  }
  function cierra() { if (panel) panel.classList.remove("abierto"); abierto = false; }
  window.cliksAyuda = { abrir: abre, cerrar: cierra };
  addEventListener("keydown", function (e) { if (e.key === "Escape" && abierto) cierra(); });

  function parpadea(m) {
    if (quieto) return;
    setTimeout(function () { m.classList.add("p"); setTimeout(function () { m.classList.remove("p"); parpadea(m); }, 140); }, 2200 + Math.random() * 3300);
  }
  function inicia() {
    document.querySelectorAll(".cliks-mascota").forEach(function (h) {
      var m = crear(parseInt(h.getAttribute("data-tam") || "110", 10), h.getAttribute("data-estado"), true, h.getAttribute("data-color")); h.appendChild(m); parpadea(m);
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
    setTimeout(function () { revisaIA(); }, 2500);          // así, al abrir el chat ya se sabe (y el servidor ya despertó)
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
