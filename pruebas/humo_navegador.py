"""
PRUEBA DE HUMO EN UN NAVEGADOR REAL (Chrome automático):  python pruebas/humo_navegador.py

Abre la página como la abriría una persona y comprueba lo que NO se puede ver leyendo el código: que cargue sin errores, que el selector de plan
funcione, que al pagar se mande lo que el servidor espera, y que el botón de pago vuelva a servir cuando se regresa de la pantalla de pago
(un error real que ya pasó: Safari/Chrome guardan la página «congelada» y el botón se quedaba apagado).

El servidor de licencias NO se toca: sus respuestas se simulan. Necesita:  pip install playwright && playwright install chromium
"""
import json
import socket
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
fallas: list[str] = []


def revisar(nombre: str, condicion: bool, detalle: str = "") -> None:
    print(("  ✔ " if condicion else "  ✘ ") + nombre + (f"  [{detalle}]" if detalle and not condicion else ""))
    if not condicion:
        fallas.append(nombre)


class Callado(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


puerto = (lambda s: (s.bind(("127.0.0.1", 0)), s.getsockname()[1], s.close())[1])(socket.socket())
servidor = ThreadingHTTPServer(("127.0.0.1", puerto), partial(Callado, directory=str(RAIZ)))
threading.Thread(target=servidor.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{puerto}"

with sync_playwright() as p:
    nav = p.chromium.launch()
    contexto = nav.new_context(viewport={"width": 1280, "height": 900})
    pagina = contexto.new_page()
    errores_de_consola, peticiones_al_servidor = [], []
    pagina.on("pageerror", lambda e: errores_de_consola.append(str(e)))
    pagina.on("console", lambda m: errores_de_consola.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)

    estado = {"quedan": 7, "caido": False, "responder_409": False}

    def precios_del_servidor():
        quedan = estado["quedan"]
        activo = quedan > 0
        vigente = {"1": 69 if activo else 99, "3": 180 if activo else 269, "6": 330 if activo else 479, "12": 499 if activo else 899}
        lista = {"1": 99, "3": 269, "6": 479, "12": 899}
        lanz = {"1": 69, "3": 180, "6": 330, "12": 499}
        return {"iva_incluido": True, "lanzamiento": {"activo": activo, "quedan": quedan, "cupo": 10},
                "planes": {m: {"nombre": n, "precio": vigente[m], "lista": lista[m], "lanzamiento": lanz[m]}
                           for m, n in (("1", "1 mes"), ("3", "3 meses"), ("6", "6 meses"), ("12", "1 año"))}}

    def simular_servidor(ruta):
        peticion = ruta.request
        if peticion.url.endswith("/aviso"):
            ruta.fulfill(status=200, content_type="application/json", body=json.dumps({"activo": False, "mensaje": ""}))
        elif peticion.url.endswith("/precios"):
            if estado["caido"]:
                ruta.abort()
            else:
                ruta.fulfill(status=200, content_type="application/json", body=json.dumps(precios_del_servidor()))
        elif peticion.url.endswith("/clientes/pagar"):
            peticiones_al_servidor.append(json.loads(peticion.post_data))
            if estado["responder_409"]:
                estado["responder_409"] = False
                estado["quedan"] = 0                       # justo se acabó el lanzamiento mientras la persona decidía
                ruta.fulfill(status=409, content_type="application/json", body=json.dumps({"detail": "Los precios cambiaron mientras decidías. Revisa el monto nuevo y vuelve a aceptar."}))
            else:
                ruta.fulfill(status=200, content_type="application/json", body=json.dumps({"url_de_pago": f"{BASE}/gracias.html"}))
        else:
            ruta.fulfill(status=204, body="")
    contexto.route("https://servidor-licencias-37nv.onrender.com/**", simular_servidor)
    contexto.route("**/visita", lambda r: r.fulfill(status=204, body=""))

    def precios_en_pantalla():
        botones = pagina.locator("#planes button")
        precios = {}
        for i in range(botones.count()):
            botones.nth(i).click(force=True)
            precios[botones.nth(i).get_attribute("data-meses")] = pagina.locator("#resumen-total").inner_text().replace(",", "")
        return precios

    print("Portada CON promoción (quedan 7 lugares):")
    pagina.goto(BASE + "/index.html", wait_until="networkidle")
    revisar("carga sin errores de JavaScript", not errores_de_consola, "; ".join(errores_de_consola[:3]))
    revisar("hay 4 plazos para elegir", pagina.locator("#planes button").count() == 4)
    revisar("aparece el aviso de promoción en los precios, con los lugares que quedan",
            pagina.locator("#promo").is_visible() and "quedan 7 lugares" in pagina.locator("#promo").inner_text(), pagina.locator("#promo").inner_text())
    revisar("aparece el aviso de promoción en la portada", pagina.locator("#promo-hero").is_visible() and "primeras 10" in pagina.locator("#promo-hero").inner_text())
    precios = precios_en_pantalla()
    revisar("los precios son $69, $180, $330 y $499", all(f"${v}" in precios[k] for k, v in (("1", "69"), ("3", "180"), ("6", "330"), ("12", "499"))), str(precios))
    revisar("dice «IVA incluido»", all("IVA incluido" in v for v in precios.values()), str(precios))
    pagina.locator("#planes button[data-meses='12']").click(force=True)
    revisar("el precio de lista sale tachado ($899) junto al de lanzamiento", pagina.locator("#resumen-total .pc-tach").inner_text().strip() == "$899")
    revisar("ya no hay selector de personas (se vende una licencia por persona)", pagina.locator("text=Personas").count() == 0)

    print("Pagar con promoción:")
    pagina.locator("#correo").fill("prueba@ejemplo.mx")
    pagina.locator("#btn-pagar").click()
    pagina.wait_for_timeout(300)
    revisar("sin aceptar los términos NO se manda nada", not peticiones_al_servidor)
    pagina.locator("#acepto").check(force=True)
    pagina.locator("#btn-pagar").click()
    pagina.wait_for_url("**/gracias.html", timeout=8000)
    cuerpo = peticiones_al_servidor[0] if peticiones_al_servidor else {}
    revisar("al pagar manda UNA licencia (asientos = 1)", cuerpo.get("asientos") == 1, str(cuerpo))
    revisar("manda el precio que la persona vio ($499 = 49900 centavos)", cuerpo.get("precio_mostrado_centavos") == 49900, str(cuerpo))
    revisar("manda el correo, el plan y la aceptación de términos", cuerpo.get("correo") == "prueba@ejemplo.mx" and cuerpo.get("duracion_meses") == 12
            and cuerpo.get("acepto_terminos") is True and bool(cuerpo.get("version_terminos")), str(cuerpo))
    revisar("la casilla de promociones NO viene marcada de entrada", cuerpo.get("acepta_promociones") is False, str(cuerpo))

    print("Si se acaba el lanzamiento MIENTRAS decide (el servidor contesta «los precios cambiaron»):")
    peticiones_al_servidor.clear()
    estado.update(quedan=1, responder_409=True)
    pagina.goto(BASE + "/index.html", wait_until="networkidle")
    revisar("con 1 lugar dice «queda 1 lugar»", "queda 1 lugar" in pagina.locator("#promo").inner_text(), pagina.locator("#promo").inner_text())
    pagina.locator("#correo").fill("prueba@ejemplo.mx")
    pagina.locator("#acepto").check(force=True)
    pagina.locator("#btn-pagar").click()
    pagina.wait_for_timeout(900)
    revisar("NO sigue a la pantalla de pago", "/gracias.html" not in pagina.url)
    revisar("avisa que los precios cambiaron y dice el monto nuevo", "precios cambiaron" in pagina.locator("#error").inner_text() and "$899" in pagina.locator("#error").inner_text(),
            pagina.locator("#error").inner_text())
    revisar("la promoción desaparece de la pantalla", not pagina.locator("#promo").is_visible() and not pagina.locator("#promo-hero").is_visible())
    revisar("el precio en pantalla ya es el de lista ($899)", "$899" in pagina.locator("#resumen-total").inner_text())
    revisar("hay que volver a aceptar (la casilla se desmarca)", not pagina.locator("#acepto").is_checked())
    revisar("el botón queda listo para volver a intentar", pagina.locator("#btn-pagar").is_enabled())

    print("Portada SIN promoción (ya se vendieron las 10):")
    estado.update(quedan=0)
    pagina.goto(BASE + "/index.html", wait_until="networkidle")
    revisar("no aparece ninguna promoción", not pagina.locator("#promo").is_visible() and not pagina.locator("#promo-hero").is_visible())
    precios = precios_en_pantalla()
    revisar("los precios son $99, $269, $479 y $899", all(f"${v}" in precios[k] for k, v in (("1", "99"), ("3", "269"), ("6", "479"), ("12", "899"))), str(precios))
    revisar("el 1 año sigue conviniendo (−24% contra pagar 12 meses sueltos)", "−24%" in pagina.locator("#planes button[data-meses='12']").inner_text())

    print("Si el servidor de precios no contesta:")
    estado.update(quedan=7, caido=True)
    pagina.goto(BASE + "/index.html", wait_until="networkidle")
    revisar("NO se muestra ninguna promoción que el servidor no confirmó", not pagina.locator("#promo").is_visible() and not pagina.locator("#promo-hero").is_visible())
    precios = precios_en_pantalla()
    revisar("se ven los precios de lista", "$899" in precios["12"] and "$99" in precios["1"], str(precios))
    estado.update(caido=False)

    print("Regresar de la pantalla de pago (el error del botón que no servía):")
    pagina.goto(BASE + "/index.html", wait_until="networkidle")
    pagina.evaluate("document.getElementById('btn-pagar').disabled = true; document.getElementById('btn-pagar').textContent = 'Abriendo pago...'")
    pagina.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}))")
    revisar("el botón vuelve a funcionar", pagina.locator("#btn-pagar").is_enabled() and "7 días gratis" in pagina.locator("#btn-pagar").inner_text())

    print("Las demás páginas:")
    for nombre in ("instalar.html", "privacidad.html", "terminos.html", "404.html"):
        errores_de_consola.clear()
        pagina.goto(f"{BASE}/{nombre}", wait_until="networkidle")
        revisar(f"{nombre} carga sin errores", not errores_de_consola, "; ".join(errores_de_consola[:2]))
    nav.close()

servidor.shutdown()
if fallas:
    print(f"\n✘ {len(fallas)} cosa(s) fallaron.")
    sys.exit(1)
print("\n✔ Todo bien en el navegador.")
