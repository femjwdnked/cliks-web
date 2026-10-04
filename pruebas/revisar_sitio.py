"""
Revisión ESTÁTICA de la página (sin navegador, tarda un segundo):  python pruebas/revisar_sitio.py

Atrapa los descuidos que sólo se notan cuando ya está publicado: una imagen que no existe, un enlace roto entre páginas, una página sin título,
una dirección «http» (sin candado) mezclada en una página «https», un precio que ya no coincide en dos lugares, o una página de prueba que se
volvió pública por error. Sale con código 1 si algo falla (así lo usa GitHub antes de publicar).
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

RAIZ = Path(__file__).resolve().parent.parent
PAGINAS = sorted(RAIZ.glob("*.html"))
PRIVADAS = {"c.html", "gracias.html", "panel.html"}          # no se indexan: llevan noindex y están en robots.txt
fallas: list[str] = []


def falla(donde: str, que: str) -> None:
    fallas.append(f"{donde}: {que}")


class Lector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.enlaces, self.recursos, self.ids, self.imagenes_sin_alt = [], [], set(), []
        self.titulo, self.meta, self.en_titulo, self.lang = "", {}, False, None

    def handle_starttag(self, etiqueta, atributos):
        a = dict(atributos)
        if "id" in a:
            self.ids.add(a["id"])
        if etiqueta == "html":
            self.lang = a.get("lang")
        if etiqueta == "title":
            self.en_titulo = True
        if etiqueta == "meta" and a.get("name"):
            self.meta[a["name"]] = a.get("content", "")
        if etiqueta == "a" and a.get("href"):
            self.enlaces.append(a["href"])
        if etiqueta in ("img", "script", "source", "video", "link") and (a.get("src") or a.get("href") or a.get("poster")):
            self.recursos.append(a.get("src") or a.get("href") or a.get("poster"))
        if etiqueta == "img" and "alt" not in a:
            self.imagenes_sin_alt.append(a.get("src", "?"))

    def handle_endtag(self, etiqueta):
        if etiqueta == "title":
            self.en_titulo = False

    def handle_data(self, datos):
        if self.en_titulo:
            self.titulo += datos


def _existe(origen: Path, destino: str) -> bool:
    ruta = urlparse(destino).path
    if not ruta:
        return True
    return ((origen.parent / unquote(ruta)).resolve() if not ruta.startswith("/") else (RAIZ / unquote(ruta[1:])).resolve()).exists()


lectores: dict[str, Lector] = {}
for pagina in PAGINAS:
    texto = pagina.read_text(encoding="utf-8")
    l = Lector()
    l.feed(texto)
    lectores[pagina.name] = l
    if not l.lang:
        falla(pagina.name, "el <html> no dice su idioma (lang)")
    if not l.titulo.strip():
        falla(pagina.name, "no tiene <title>")
    if pagina.name not in PRIVADAS | {"404.html"} and not l.meta.get("description"):
        falla(pagina.name, "no tiene meta description")
    if pagina.name in PRIVADAS and "noindex" not in l.meta.get("robots", ""):
        falla(pagina.name, "es una página privada y no lleva noindex")
    for img in l.imagenes_sin_alt:
        falla(pagina.name, f"imagen sin texto alternativo: {img}")
    for destino in l.enlaces + l.recursos:
        if destino.startswith(("http://",)):
            falla(pagina.name, f"dirección sin https: {destino}")
        if destino.startswith(("https://", "mailto:", "tel:", "data:", "javascript:")) or destino.startswith("#"):
            continue
        if not _existe(pagina, destino):
            falla(pagina.name, f"apunta a algo que no existe: {destino}")
    for ancla in re.findall(r'href="#([^"]+)"', texto):
        if ancla not in l.ids:
            falla(pagina.name, f"enlace a una sección que no existe: #{ancla}")

# El mapa del sitio sólo lista páginas que existen y que son públicas.
mapa = (RAIZ / "sitemap.xml").read_text(encoding="utf-8")
for url in re.findall(r"<loc>https://cliks\.mx/?([^<]*)</loc>", mapa):
    archivo = url or "index.html"
    if not (RAIZ / archivo).exists():
        falla("sitemap.xml", f"lista una página que no existe: {archivo}")
    if archivo in PRIVADAS:
        falla("sitemap.xml", f"lista una página privada: {archivo}")
robots = (RAIZ / "robots.txt").read_text(encoding="utf-8")
for privada in PRIVADAS:
    if f"Disallow: /{privada}" not in robots:
        falla("robots.txt", f"no oculta {privada}")

# Los precios que se anuncian tienen que ser los mismos en la portada y en los términos (esto ya se descuadró una vez al cambiar de precio).
# Dos escalones: LISTA (lo que la portada muestra de arranque) y LANZAMIENTO (las primeras 10 ventas; lo dice el servidor y lo explican los términos).
LISTA = {1: 99, 3: 269, 6: 479, 12: 899}
LANZAMIENTO = {1: 69, 3: 180, 6: 330, 12: 499}
portada, terminos = (RAIZ / "index.html").read_text(encoding="utf-8"), (RAIZ / "terminos.html").read_text(encoding="utf-8")
for meses, precio in LISTA.items():
    if not re.search(rf"{meses}:\s*\{{[^}}]*precio:\s*{precio}\b[^}}]*lista:\s*{precio}\b", portada):
        falla("index.html", f"el plan de {meses} mes(es) no arranca con el precio de lista ${precio}")
    if f"${precio} MXN" not in terminos:
        falla("terminos.html", f"no menciona el precio de lista ${precio}")
for meses, precio in LANZAMIENTO.items():
    if f"${precio} MXN" not in terminos:
        falla("terminos.html", f"no menciona el precio de lanzamiento ${precio}")
if "IVA" not in re.sub(r"<[^>]+>", " ", terminos) or not re.search(r"\bIVA incluido\b", portada):
    falla("index.html / terminos.html", "tiene que decir «IVA incluido» junto al precio y en los términos")
# La promoción sólo se enciende cuando el servidor lo confirma: tiene que existir el pedido a /precios, los avisos (ocultos de arranque) y el 409.
for pieza, que in (('fetch(SERVIDOR + "/precios")', "pide los precios al servidor"), ('id="promo"', "tiene el aviso de promoción en los precios"),
                   ('id="promo-hero"', "tiene el aviso de promoción en la portada"), ("precio_mostrado_centavos", "manda el precio que la persona vio"),
                   ("respuesta.status === 409", "maneja el aviso de «los precios cambiaron»")):
    if pieza not in portada:
        falla("index.html", f"no {que}")
for aviso in ('id="promo" class="pc-promo" hidden', 'id="promo-hero" class="h4-promo" hidden'):
    if aviso not in portada:
        falla("index.html", f"el aviso de promoción no arranca oculto ({aviso.split()[0]}): se vería una promoción sin que el servidor la confirme")
visible = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", "", portada, flags=re.S)
if re.search(r"asiento|\$4\b|por persona adicional", visible, re.I):
    falla("index.html", "todavía habla de «asientos» o de un cobro por persona adicional (ya no se vende así)")

# Los Cliks (la mascota) de colores: el azul es el principal (portada, ícono de la app y asistente de ayuda); CUALQUIER otro color sólo puede
# aparecer UNA vez en todo el sitio, para que nada parezca repetido. Y cada color que se pida tiene que tener su imagen.
usos: dict[str, list[str]] = {}
for nombre, texto in ((p.name, p.read_text(encoding="utf-8")) for p in PAGINAS):
    for color in re.findall(r"imagenes/mascota-(\w+)\.webp", texto) + re.findall(r'data-color="(\w+)"', texto):
        usos.setdefault("cuerpo" if color == "cuerpo" else color, []).append(nombre)
        if color != "cuerpo" and not (RAIZ / "imagenes" / f"mascota-{color}.webp").exists():
            falla(nombre, f"pide un Clik «{color}» y no existe imagenes/mascota-{color}.webp")
for color, donde in usos.items():
    if color != "cuerpo" and len(donde) > 1:
        falla("mascotas", f"el color «{color}» se repite ({', '.join(donde)}): cada color de Clik, aparte del azul, va una sola vez")

if fallas:
    print("✘ La página tiene problemas:\n  - " + "\n  - ".join(fallas))
    sys.exit(1)
print(f"✔ {len(PAGINAS)} páginas revisadas: enlaces, imágenes, títulos, mapa del sitio, páginas privadas y precios, todo en orden.")
