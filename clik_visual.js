/* Clik visual: piezas para que Clik conteste con el PDF ya abierto, gráficas, tablas y tarjetas,
   no solo con texto. La usa la demostración del chat en index.html.
   Cada función regresa HTML listo para meter en un mensaje del chat. */
(function () {
  'use strict';
  const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SVG = {
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 15h6"/></svg>',
    candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    abrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    mano: '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4 15.5a1.6 1.6 0 0 1 2.4-2.1L9 16"/></svg>',
  };
  const CORTO = { opinion: 'Opinión', constancia: 'Constancia', cedula: 'Cédula' };
  const TITULO = { opinion: 'Opinión del cumplimiento de obligaciones fiscales', constancia: 'Constancia de Situación Fiscal', cedula: 'Cédula de identificación fiscal' };
  const CABECERA = { opinion: 'OPINIÓN DEL CUMPLIMIENTO', constancia: 'CONSTANCIA FISCAL', cedula: 'CÉDULA FISCAL' };
  const colorDe = (r) => r === 'Negativo' ? 'rojo' : r === 'Positivo' ? 'verde' : 'gris';
  const chip = (r, otro = 'Constancia') => r ? `<span class="cv-chip ${colorDe(r)}">${r === 'Positivo' ? SVG.ok : ''}${esc(r)}</span>` : `<span class="cv-chip gris">${esc(otro)}</span>`;
  const ini = (nombre, color, grande) => `<span class="cv-ini${grande ? ' grande' : ''}" style="background:linear-gradient(135deg,${color})">${esc(nombre.trim()[0] || '?')}</span>`;

  /* Registro de PDFs que se pueden abrir en el visor */
  const docs = new Map(); let sigDoc = 0;
  function doc(d) { const id = 'cvd' + (++sigDoc); docs.set(id, d); return id; }

  /* Código QR de adorno: siempre el mismo para el mismo folio */
  function qr(semilla) {
    let h = 2166136261; for (const ch of String(semilla)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    let d = '';
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if (rnd() < .5) d += `M${x} ${y}h1v1h-1z`;
    }
    const ojo = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
    return `<svg class="cv-qr" viewBox="0 0 21 21" aria-hidden="true"><path fill-rule="evenodd" d="${ojo(0, 0)}${ojo(14, 0)}${ojo(0, 14)}"/><path d="${d}"/></svg>`;
  }

  /* La hoja del PDF, dibujada (se ve igual en chico y en grande) */
  function hoja(d) {
    const op = (d.tipo || 'opinion') === 'opinion', neg = d.resultado === 'Negativo';
    const regimen = d.regimen || (String(d.rfc).length === 13 ? 'Régimen Simplificado de Confianza' : 'General de Ley Personas Morales');
    const caja = op
      ? `<div class="cv-h-caja ${neg ? 'neg' : 'pos'}"><small>Sentido de la opinión</small><b>${neg ? 'NEGATIVO' : 'POSITIVO'}</b></div>`
      : `<div class="cv-h-caja neutra"><small>Régimen</small><b>${esc(regimen)}</b></div>`;
    const pend = op && neg ? `<div class="cv-h-pend"><small class="cv-h-sub">Obligaciones con pendientes</small>${(d.pendientes || ['Declaración anual 2025 · ISR', 'Pago provisional sep 2026 · IVA']).map((p) => `<div>${esc(p)}</div>`).join('')}</div>` : '';
    return `<div class="cv-hoja">
      <div class="cv-h-cab"><i></i><span>SAT · ${CABECERA[d.tipo] || CABECERA.opinion}</span><em>Folio<b>${esc(d.folio)}</b></em></div>
      <div class="cv-h-tit">${TITULO[d.tipo] || TITULO.opinion}</div>
      <div class="cv-h-campos"><div><small>RFC</small><b>${esc(d.rfc)}</b></div><div><small>Emitida</small><b>${esc(d.fecha)}</b></div><div class="ancho"><small>Nombre o razón social</small><b>${esc(d.nombre)}</b></div></div>
      ${caja}
      <div class="cv-h-texto"><i style="width:97%"></i><i style="width:90%"></i><i style="width:94%"></i><i style="width:62%"></i></div>
      ${pend}
      <div class="cv-h-pie">${qr(d.folio)}<div class="cv-h-texto"><small class="cv-h-sub">Cadena original</small><i style="width:100%"></i><i style="width:100%"></i><i style="width:100%"></i><i style="width:54%"></i></div></div>
    </div>`;
  }

  /* PDF ya abierto: se ve la hoja; al tocarla se abre completa */
  function pdf(d) {
    const id = doc(d), col = (d.tipo || 'opinion') === 'opinion' ? colorDe(d.resultado) : 'gris';
    return `<div class="cv-pdf">
      <button type="button" class="cv-vista" data-cv-abrir="${id}" aria-label="Ver el PDF completo"><div class="cv-recorte">${hoja(d)}</div><span class="cv-lupa">${SVG.abrir}Ver completo</span></button>
      <div class="cv-pdf-pie"><span class="cv-ic ${col}">${SVG.pdf}</span><span class="cv-txt"><b>${esc(d.archivo)}</b><small>${esc(d.nombre)} · ${(d.tipo || 'opinion') === 'opinion' && d.resultado ? `Opinión ${d.resultado === 'Negativo' ? 'negativa' : 'positiva'}` : (CORTO[d.tipo] || 'Opinión')}</small></span>${d.acciones || ''}</div>
      <div class="cv-local">${SVG.candado}Se abre desde tu computadora. La IA no lee el PDF.</div>
    </div>`;
  }

  /* Visor (el PDF completo encima de todo) */
  let visor = null, opciones = {}, regreso = null;
  function iniciar(op = {}) {
    opciones = op;
    visor = document.createElement('div');
    visor.className = 'cv-visor' + (op.dentro ? ' dentro' : '') + (op.clase ? ' ' + op.clase : '');
    visor.hidden = true;
    visor.innerHTML = `<div class="cv-visor-fondo" data-cv-cerrar></div><div class="cv-visor-caja" role="dialog" aria-modal="true" aria-label="PDF"><div class="cv-visor-cab"></div><div class="cv-visor-hoja"></div><div class="cv-visor-pie">${SVG.candado}<span>Este PDF se abre desde tu computadora. La IA no lo lee.</span></div></div>`;
    (op.dentro || document.body).appendChild(visor);
  }
  function abrirDoc(id, desde) {
    const d = docs.get(id); if (!d || !visor) return;
    regreso = desde || document.activeElement;
    const col = (d.tipo || 'opinion') === 'opinion' ? colorDe(d.resultado) : 'gris';
    visor.querySelector('.cv-visor-cab').innerHTML = `<span class="cv-ic ${col}">${SVG.pdf}</span><span class="cv-txt"><b>${esc(d.archivo)}</b><small>${esc(d.ruta || d.nombre)}</small></span>`
      + `<button type="button" class="btn btn-2 btn-chico" data-cv-externo>${esc(opciones.externoTexto || 'Abrir en Vista Previa')}</button><button type="button" class="cv-x" data-cv-cerrar aria-label="Cerrar">${SVG.x}</button>`;
    visor.querySelector('.cv-visor-hoja').innerHTML = `<div class="cv-visor-papel">${hoja(d)}</div>`;
    visor.querySelector('.cv-visor-hoja').scrollTop = 0;
    visor._doc = d; visor.hidden = false;
    visor.querySelector('.cv-x').focus({ preventScroll: true });
  }
  function cerrarVisor() { if (!visor || visor.hidden) return; visor.hidden = true; if (regreso && regreso.focus) regreso.focus({ preventScroll: true }); }

  /* Dona: cuántos clientes hay en cada estado */
  function dona({ total, etiqueta = 'clientes', partes, nota, notaAttrs = '' }) {
    const suma = partes.reduce((s, p) => s + p.n, 0) || 1, llenas = partes.filter((p) => p.n > 0);
    const hueco = llenas.length > 1 ? 2 : 0; let acum = 0;
    const arcos = llenas.map((p, k) => {
      const largo = p.n / suma * 100, trazo = Math.max(largo - hueco, .5);
      const a = `<circle class="arco" r="15.915" cx="21" cy="21" fill="none" stroke-width="5.2" pathLength="100" stroke-dasharray="${trazo.toFixed(2)} ${(100 - trazo).toFixed(2)}" stroke-dashoffset="${(-acum - hueco / 2).toFixed(2)}" style="stroke:${p.col};animation-delay:${k * 120}ms"/>`;
      acum += largo; return a;
    }).join('');
    const ley = partes.map((p) => {
      const cuerpo = `<i style="background:${p.col}"></i><span>${esc(p.etq)}</span><b>${p.n}</b>`;
      return p.attrs ? `<button type="button" class="cv-ley" ${p.attrs}>${cuerpo}</button>` : `<div class="cv-ley">${cuerpo}</div>`;
    }).join('');
    const notaHTML = nota ? (notaAttrs ? `<button type="button" class="cv-nota" ${notaAttrs}>${SVG.reloj}<span>${nota}</span></button>` : `<div class="cv-nota">${SVG.reloj}<span>${nota}</span></div>`) : '';
    return `<div class="cv-tarjeta cv-resumen"><div class="cv-dona-caja"><div class="cv-dona"><svg viewBox="0 0 42 42" aria-hidden="true"><circle class="pista" r="15.915" cx="21" cy="21" fill="none" stroke-width="5.2"/>${arcos}</svg>
      <div class="cv-dona-centro"><b>${total ?? suma}</b><small>${esc(etiqueta)}</small></div></div><div class="cv-leyenda">${ley}</div></div>${notaHTML}</div>`;
  }

  /* Vigencias: cuántos días le quedan a cada e.firma, en barras de 0 a 90 días */
  function vigencias(filas, { max = 90 } = {}) {
    const nivel = (d) => d <= 30 ? 'rojo' : d <= 90 ? 'ambar' : 'verde';
    const esc0 = `<div class="cv-vig-esc"><span>Cliente</span><span class="cv-esc">${[0, 30, 60, 90].map((v) => `<em style="left:${v / max * 100}%">${v}</em>`).join('')}</span><span>Días</span></div>`;
    return `<div class="cv-tarjeta cv-vig">${esc0}${filas.map((f, k) => {
      const n = nivel(f.dias), tag = f.attrs ? 'button' : 'div';
      return `<${tag} ${tag === 'button' ? 'type="button" ' : ''}class="cv-vig-fila" ${f.attrs || ''}><span class="cv-vig-nom"><b>${esc(f.nombre)}</b><small>${esc(f.fecha || '')}</small></span>`
        + `<span class="cv-pista"><i style="width:${Math.max(3, Math.min(f.dias, max) / max * 100)}%;background:var(--${n});animation-delay:${k * 90}ms"></i></span><span class="cv-dias ${n}">${f.dias}<small>d</small></span></${tag}>`;
    }).join('')}</div>`;
  }

  /* Estado del portal del SAT con su gráfica de las últimas 24 horas */
  function sat(o) {
    const v = o.puntos, max = o.max || 6, n = v.length, tope = o.tope || 4;
    const P = v.map((y, i) => `${(i / (n - 1) * 100).toFixed(2)},${(40 - Math.min(y, max) / max * 40).toFixed(2)}`);
    const yt = 40 - tope / max * 40;
    return `<div class="cv-tarjeta cv-sat">
      <div class="cv-sat-cab"><span class="cv-luz${o.ok === false ? ' mal' : ''}"></span><b>${esc(o.titulo || 'El portal del SAT funciona')}</b><small class="cv-tenue">${esc(o.revisado || '')}</small></div>
      <div><div class="cv-chispa" data-v="${v.join(',')}" data-max="${max}" aria-label="Tiempo de respuesta del SAT en las últimas 24 horas" role="img">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="M0,40L${P.join('L')}L100,40Z"/><line class="tope" x1="0" x2="100" y1="${yt}" y2="${yt}"/><polyline class="linea" points="${P.join(' ')}"/></svg>
        <span class="cv-tope-etq" style="top:${yt / 40 * 100}%">Lento</span><span class="cv-guia"></span><span class="cv-pt"></span><span class="cv-tip"></span>
      </div><div class="cv-eje"><span>Hace 24 h</span><span>Pasa el mouse para ver cada hora</span><span>Ahora</span></div></div>
      <div class="cv-datos">${(o.datos || []).map(([k, val]) => `<div><small>${esc(k)}</small><b>${esc(val)}</b></div>`).join('')}</div>
    </div>`;
  }
  let chispaActiva = null;
  document.addEventListener('pointermove', (e) => {
    const z = e.target.closest ? e.target.closest('.cv-chispa') : null;
    if (chispaActiva && chispaActiva !== z) { chispaActiva.classList.remove('activa'); chispaActiva = null; }
    if (!z) return;
    const v = z.dataset.v.split(',').map(Number), max = +z.dataset.max, n = v.length;
    const r = z.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left) / r.width * (n - 1))));
    const x = i / (n - 1) * 100, y = (1 - Math.min(v[i], max) / max) * 100;
    z.querySelector('.cv-guia').style.left = x + '%';
    const pt = z.querySelector('.cv-pt'); pt.style.left = x + '%'; pt.style.top = y + '%';
    pt.style.background = v[i] >= 4 ? 'var(--ambar)' : '';
    const tip = z.querySelector('.cv-tip'); tip.style.left = Math.min(86, Math.max(14, x)) + '%';
    tip.textContent = `${i === n - 1 ? 'Ahora' : `Hace ${n - 1 - i} h`} · ${v[i].toFixed(1)} s${v[i] >= 4 ? ' · lento' : ''}`;
    z.classList.add('activa'); chispaActiva = z;
  });

  /* Descarga en vivo: cada cliente pasa de «En fila» a «Consultando…» y a su resultado */
  function progreso(filas, { titulo = 'Descargando opiniones' } = {}) {
    return `<div class="cv-tarjeta cv-prog" data-total="${filas.length}">
      <div class="cv-titulo"><b>${esc(titulo)}</b><small class="cv-prog-cuenta">0 de ${filas.length}</small></div>
      <div class="cv-prog-barra"><i></i></div>
      <div class="cv-prog-filas">${filas.map((f, i) => `<div class="cv-prog-fila" data-i="${i}" data-estado="espera">${ini(f.nombre, f.color)}<span class="cv-prog-nom">${esc(f.nombre)}</span><span class="cv-prog-est"><span class="cv-chip gris">En fila</span></span></div>`).join('')}</div>
    </div>`;
  }
  function marcar(tarjeta, i, estado, docId) {
    const fila = tarjeta && tarjeta.querySelector(`[data-i="${i}"]`); if (!fila) return;
    const clave = estado + (docId || ''); if (fila.dataset.clave === clave) return;
    fila.dataset.clave = clave; fila.dataset.estado = estado;
    const est = fila.querySelector('.cv-prog-est');
    const etq = estado === 'bajando' ? '<span class="cv-chip azul"><span class="cv-giro"></span>Consultando…</span>'
      : estado === 'Positivo' || estado === 'Negativo' ? (docId ? `<button type="button" class="cv-chip ${colorDe(estado)}" data-cv-abrir="${docId}" title="Ver el PDF">${estado === 'Positivo' ? SVG.ok : ''}${estado} · PDF</button>` : chip(estado))
      : '<span class="cv-chip gris">En fila</span>';
    est.innerHTML = etq;
    if (!QUIETO && est.firstElementChild && estado !== 'espera') est.firstElementChild.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
    const filas = [...tarjeta.querySelectorAll('.cv-prog-fila')], n = filas.length;
    const hechos = filas.filter((f) => f.dataset.estado === 'Positivo' || f.dataset.estado === 'Negativo').length;
    tarjeta.querySelector('.cv-prog-cuenta').textContent = `${hechos} de ${n}`;
    tarjeta.querySelector('.cv-prog-barra i').style.transform = `scaleX(${hechos / n})`;
    if (hechos === n && !tarjeta.classList.contains('lista')) { tarjeta.classList.add('lista'); tarjeta.querySelector('.cv-titulo b').textContent = 'Listo'; }
  }

  /* Tabla: últimas descargas; cada fila abre su PDF */
  function tabla(filas) {
    return `<div class="cv-tarjeta cv-tabla"><div class="cv-tabla-cab"><span>Cliente</span><span>Resultado</span><span style="text-align:right">Cuándo</span></div>${filas.map((f) =>
      `<button type="button" class="cv-tabla-fila" data-cv-abrir="${doc(f.doc)}"><span class="cv-tabla-nom"><b>${esc(f.doc.nombre)}</b><small>${CORTO[f.doc.tipo] || 'Opinión'}</small></span>${chip(f.doc.resultado)}<span>${f.cuando}</span></button>`).join('')}
      <div class="cv-tabla-pie">${SVG.mano}Toca una fila para ver su PDF</div></div>`;
  }

  /* Ficha de un cliente: su estado, sus últimas opiniones y datos clave */
  function ficha(o) {
    const pos = o.historial.filter((h) => h.r === 'Positivo').length, neg = o.historial.length - pos;
    return `<div class="cv-tarjeta cv-ficha">
      <div class="cv-ficha-cab">${ini(o.nombre, o.color, true)}<span class="cv-ficha-q"><b>${esc(o.nombre)}</b><span class="cv-ficha-sub"><small>${esc(o.rfc)}</small>${o.estado ? `<span class="cv-chip ${o.estadoCol || 'gris'}">${esc(o.estado)}</span>` : ''}</span></span></div>
      <div><div class="cv-titulo"><b>Últimas ${o.historial.length} opiniones</b><small>${pos} positivas · ${neg} negativas</small></div>
        <div class="cv-tira" style="margin-top:6px">${o.historial.map((h, k) => `<button type="button" class="${h.r === 'Negativo' ? 'n' : 'p'}" ${h.doc ? `data-cv-abrir="${h.doc}"` : ''} title="${esc(h.fecha)} · ${esc(h.r)}" aria-label="${esc(h.fecha)}, ${esc(h.r)}" style="animation-delay:${k * 25}ms"></button>`).join('')}</div>
        <div class="cv-eje"><span>${esc(o.historial[0] ? o.historial[0].fecha : '')}</span><span>Toca una para ver su PDF</span><span>Hoy</span></div></div>
      <div class="cv-datos">${(o.datos || []).map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
      ${o.acciones || ''}
    </div>`;
  }

  /* Barras por semana: cuántas opiniones salieron positivas y negativas */
  function barras({ titulo, sub, columnas }) {
    const max = Math.max(1, ...columnas.map((c) => c.pos + c.neg));
    return `<div class="cv-tarjeta cv-semanas"><div class="cv-titulo"><b>${esc(titulo)}</b><small>${esc(sub || '')}</small></div>
      <div class="cv-barras">${columnas.map((c, k) => {
        const tot = c.pos + c.neg;
        return `<div class="cv-col${k === columnas.length - 1 ? ' hoy' : ''}" title="${esc(c.etq)}: ${c.pos} positivas, ${c.neg} negativas"><em>${tot}</em><div class="cv-pila" style="height:${Math.max(3, Math.round(tot / max * 76))}px;animation-delay:${k * 70}ms">${c.neg ? `<i class="n" style="flex:${c.neg}"></i>` : ''}${c.pos ? `<i class="p" style="flex:${c.pos}"></i>` : ''}</div><small>${esc(c.etq)}</small></div>`;
      }).join('')}</div>
      <div class="cv-ley-h"><span><i style="background:var(--verde)"></i>Positivas</span><span><i style="background:var(--rojo)"></i>Negativas</span></div></div>`;
  }

  /* Clics y teclado */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cv-abrir]'); if (a) { abrirDoc(a.dataset.cvAbrir, a); return; }
    if (!visor || visor.hidden) return;
    if (e.target.closest('[data-cv-cerrar]')) cerrarVisor();
    else if (e.target.closest('[data-cv-externo]') && opciones.externo) opciones.externo(visor._doc);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visor && !visor.hidden) { e.preventDefault(); e.stopImmediatePropagation(); cerrarVisor(); }
  }, true);

  window.CV = { pdf, hoja, doc, dona, vigencias, sat, progreso, marcar, tabla, ficha, barras, iniciar, abrirDoc, cerrarVisor };
})();
