// Contador de visitas de Cliks: sin cookies, sin guardar tu IP, sin identificarte.
// Sólo avisa al servidor qué página se abrió y de qué enlace o sitio llegaste.
(function () {
  try {
    var host = location.hostname;
    // Sólo cuenta el sitio de verdad: nada de pruebas en la computadora de nadie.
    if (host !== "cliks.mx" && host !== "www.cliks.mx") return;

    // Para no contarse a sí mismo: abrir cliks.mx/?nocontar=1 una vez en cada
    // navegador (y ?nocontar=0 para volver a contar).
    var params = new URLSearchParams(location.search);
    var marca = "cliks_no_contar";
    try {
      if (params.get("nocontar") === "1") localStorage.setItem(marca, "1");
      if (params.get("nocontar") === "0") localStorage.removeItem(marca);
      if (localStorage.getItem(marca) === "1") return;
    } catch (e) { /* sin almacenamiento: se cuenta normal */ }

    // Quien pide que no lo rastreen, no se cuenta.
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl) return;

    // Dirección del servidor: la misma que usa index.html.
    var SERVIDOR = "https://servidor-licencias-37nv.onrender.com";

    var referente = "";
    try {
      referente = document.referrer ? new URL(document.referrer).hostname : "";
    } catch (e) { referente = ""; }
    if (referente === host || referente === "www." + host) referente = "";   // navegar dentro del sitio

    var cuerpo = JSON.stringify({
      ruta: location.pathname,
      // El enlace que se pone en cada foro: cliks.mx/?f=foro1
      origen: params.get("f") || params.get("utm_source") || params.get("ref") || "",
      referente: referente
    });

    if (navigator.sendBeacon) {
      // Texto plano: así el navegador no hace la consulta previa (CORS).
      navigator.sendBeacon(SERVIDOR + "/visita", new Blob([cuerpo], { type: "text/plain" }));
    } else {
      fetch(SERVIDOR + "/visita", { method: "POST", body: cuerpo, keepalive: true, mode: "no-cors" });
    }
  } catch (e) { /* contar visitas nunca debe dar un error a nadie */ }
})();
