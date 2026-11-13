/* =========================================================
   NEXO Guion · lógica de la app
   - Todo se guarda en el celular (localStorage): funciona sin internet.
   - Con internet solo se usa para buscar actualizaciones.
   ========================================================= */
(function () {
'use strict';

/* ---------- 1. Configuración ---------- */
const CONFIG = {
  VERSION: '1.0.2'
  // La app de Android no se conecta a ningún servidor: las versiones nuevas
  // las arma Claude y te llegan como archivo APK por el chat.
};
const KEY = 'nexo-guion-db';            // nombre del "cajón" donde se guarda todo
const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const Plug = n => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n];

/* ---------- 2. Listas para tocar (chips y selectores) ---------- */
const O = {
  tipo: ['General', 'Entero', 'Medio', 'Primer plano', 'Detalle'],
  ang: ['Normal', 'Picado', 'Contrapicado', 'Cenital'],
  mov: ['Fija', 'Paneo', 'Travelling', 'Zoom', 'En mano'],
  lugar: ['Interior', 'Exterior'],
  momento: ['Mañana', 'Tarde', 'Noche'],
  ambiente: ['Tranquilo', 'Tenso', 'Divertido', 'Emocional', 'Épico'],
  luz: ['Natural', 'Lámpara', 'Ring light', 'Mixta'],
  alt: ['A los ojos', 'Alta', 'Baja', 'Al piso'],
  obj: ['Vender', 'Enseñar', 'Entretener', 'Confianza'],
  redes: ['9:16', '16:9'],
  filmora: ['Transición zoom', 'Texto pop-up', 'Subtítulos auto', 'Glitch', 'Barrido', 'Desenfoque de fondo', 'Cámara lenta', 'Efecto de sonido'],
  colores: ['#03BDDE', '#F0101C', '#7C3AED', '#E07A1F', '#14975A', '#2563EB', '#DB2777', '#10202A']
};
const ESTADOS = ['idea', 'guion', 'grabado', 'editado', 'publicado'];
const ST = { idea: 'Idea', guion: 'Guion', grabado: 'Grabado', editado: 'Editado', publicado: 'Publicado' };
const RED_TXT = { '9:16': '9:16 TikTok/Reels', '16:9': '16:9 YouTube' };

/* ---------- 3. Utilidades ---------- */
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
const est = s => words(s) ? Math.max(1, Math.round(words(s) / 2.5)) : 0; // 2,5 palabras por segundo
const opts = (arr, sel) => arr.map(o => `<option${o === sel ? ' selected' : ''}>${esc(o)}</option>`).join('');
const iniciales = n => (n || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 3).toUpperCase();
const hace = t => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); return d === 1 ? 'ayer' : `hace ${d} días`;
};
const fecha = iso => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + (iso.length > 10 ? ' · ' + d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''); };

/* ---------- 4. Base de datos local ---------- */
function semilla() {
  const now = Date.now();
  const r = (k, o) => Object.assign({ id: uid(), k }, o);
  return {
    v: 1,
    ideas: [],
    planes: [{ n: 'Básico', v: 4 }, { n: 'Estándar', v: 8 }, { n: 'Pro', v: 12 }],
    clientes: [{ id: 'nexo', n: 'NEXO PC', c: '#03BDDE', logo: 'icons/icon-192.png', plan: 'Pro', nota: 'Hardware y gaming', wa: '', ig: '', tt: '', fb: '', yt: '' }],
    ganchos: [
      { id: uid(), tipo: 'Error', t: 'Deja de [hacer X]…', ej: 'Deja de comprar PC sin ver esto' },
      { id: uid(), tipo: 'Pregunta', t: '¿Sabías que [dato]?', ej: '¿Sabías que tu PC se calienta por esto?' },
      { id: uid(), tipo: 'Resultado', t: 'Así pasé de [A] a [B]', ej: 'Así pasé de 30 a 120 FPS' },
      { id: uid(), tipo: 'Lista', t: '[3] cosas que…', ej: '3 piezas que nunca debes ahorrar' },
      { id: uid(), tipo: 'Local', t: 'En Quibdó nadie te dice…', ej: 'En Quibdó nadie te dice cuánto vale armar un PC gamer' },
      { id: uid(), tipo: 'Reto', t: 'Armé un PC con [$X]', ej: 'Armé un PC gamer con 2 millones' }
    ],
    plantillas: [],
    videos: [{
      id: uid(), ejemplo: true, cli: 'nexo', t: 'Ejemplo: Armé un PC gamer con 2 millones', obj: 'Vender', redes: ['9:16', '16:9'], st: 1, fg: '', fe: '',
      g: 'Armé un PC gamer con 2 millones… ¿y corre todo?', p: 'En Quibdó nadie te dice cuánto cuesta armar un PC de verdad.',
      s: 'Mostramos cada pieza, su precio y los FPS reales.', c: 'Escríbenos por WhatsApp y te cotizamos el tuyo.',
      creado: now, act: now,
      escenas: [
        escenaNueva({ nombre: 'Presentación en la tienda', ambiente: 'Divertido', luz: 'Ring light', rows: [
          r('cam', { pos: 'Frente a la mesa de armado, a 1,5 m', alt: 'A los ojos' }),
          r('pla', { tipo: 'Medio', ang: 'Normal', mov: 'Fija', s: 4, ok: false }),
          r('per', { p: 'P1', rol: 'Cristóbal', d: '¿Se puede armar un PC gamer con 2 millones en Quibdó? Hoy lo comprobamos.', hace: 'Camiseta NEXO PC, de pie junto a la mesa' }),
          r('pla', { tipo: 'Primer plano', ang: 'Normal', mov: 'Zoom', s: 3, ok: false }),
          r('per', { p: 'P2', rol: 'Cliente', d: '¿Y eso sí corre Fortnite?', hace: 'Sentado frente al monitor' })] }),
        escenaNueva({ nombre: 'Armado pieza por pieza', luz: 'Ring light', rows: [
          r('cam', { pos: 'Encima de la mesa, mirando hacia abajo', alt: 'Alta' }),
          r('pla', { tipo: 'Detalle', ang: 'Cenital', mov: 'Fija', s: 6, ok: false }),
          r('per', { p: 'P1', rol: 'Cristóbal', d: 'Procesador, tarjeta de video y 16 GB de RAM: todo suma 1,9 millones.', hace: 'Solo se ven las manos' })] }),
        escenaNueva({ nombre: 'Prueba de FPS y cierre', momento: 'Noche', ambiente: 'Épico', luz: 'Mixta', rows: [
          r('pla', { tipo: 'Primer plano', ang: 'Contrapicado', mov: 'En mano', s: 5, ok: false }),
          r('per', { p: 'P1', rol: 'Cristóbal', d: '120 FPS. Si quieres el tuyo, escríbenos por WhatsApp.', hace: 'Señala la pantalla' })] })
      ]
    }],
    ajustes: { tema: 'auto', pin: null, respaldo: null, inicio: now, ultimoVideo: null }
  };
}
function escenaNueva(o) {
  return Object.assign({ id: uid(), nombre: '', lugar: 'Interior', momento: 'Tarde', ambiente: 'Tranquilo', luz: 'Natural', detalle: '', sonido: '', objetos: '', musica: '', texto: '', filmora: [], rows: [], mapa: null }, o || {});
}
let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
if (!db || db.v !== 1) db = semilla();
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); flashSaved(); }
    catch (e) { toast('⚠ No se pudo guardar: el celular no tiene espacio'); }
  }, 250);
}
function flashSaved() { const s = $('#savedIco'); if (s) { s.style.opacity = 1; } }
// Pide al navegador que no borre los datos (iPhone/Android)
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* Deshacer: guardamos una copia antes de borrar algo */
let undoCopy = null;
const snapshot = () => { undoCopy = JSON.stringify(db); };
function undo() { if (!undoCopy) return; db = JSON.parse(undoCopy); undoCopy = null; save(); render(cur.name, cur.arg, true); toast('Listo, se deshizo'); }

const cli = id => db.clientes.find(c => c.id === id) || { id: '', n: 'Sin cliente', c: '#8FA3AB', plan: '' };
const vid = id => db.videos.find(v => v.id === id);
const planCupo = n => (db.planes.find(p => p.n === n) || {}).v || 0;
const delMes = c => { const d = new Date(); const ini = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); return db.videos.filter(v => v.cli === c.id && v.creado >= ini && !v.ejemplo).length; };
function stats(v) {
  let pl = 0, s = 0, ok = 0, dlg = 0; const ps = new Set();
  v.escenas.forEach(e => e.rows.forEach(r => {
    if (r.k === 'pla') { pl++; s += (+r.s || 0); if (r.ok) ok++; }
    if (r.k === 'per') { ps.add(r.p); dlg += est(r.d); }
  }));
  return { esc: v.escenas.length, per: ps.size, pl, s, ok, dlg };
}
const touch = v => { v.act = Date.now(); save(); };

/* ---------- 5. Íconos ---------- */
const sv = (d, w = 20, sw = 2.2) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  back: sv('<path d="M15 18l-6-6 6-6"/>'),
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--muted);flex:none" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  plus: sv('<path d="M12 5v14M5 12h14"/>', 18, 2.6),
  bulb: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', 22),
  arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 22, 2.6),
  trash: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 19, 2),
  dots: sv('<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>', 20, 2.4),
  per: sv('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c.7-4 3.4-6 7-6s6.3 2 7 6"/>', 16),
  pla: sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 5l-2 4M13 5l-2 4M18 5l-2 4"/>', 16),
  cam: sv('<rect x="2" y="7" width="14" height="11" rx="2"/><path d="M16 11l6-3v9l-6-3"/>', 16),
  pdf: sv('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', 20),
  check: sv('<path d="M5 12l5 5 9-10"/>', 22, 3),
  up: sv('<path d="M12 19V5M6 11l6-6 6 6"/>', 20),
  down: sv('<path d="M12 5v14M6 13l6 6 6-6"/>', 20),
  copy: sv('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 20),
  cal: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 20),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 18),
  play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--on-a)" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  wa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>'
};
const MARK = '<svg width="38" height="34" viewBox="0 0 48 42" aria-hidden="true"><rect x="3" y="3" width="42" height="27" rx="6" fill="none" stroke="var(--a)" stroke-width="3.6"/><rect x="21" y="30" width="6" height="5" fill="var(--a)"/><rect x="13" y="34.5" width="22" height="4" rx="2" fill="var(--a)"/><g transform="rotate(-32 24 16.5)" fill="none" stroke="var(--a2)" stroke-width="3.4" stroke-linecap="round"><path d="M22 12.2h-4.3a4.3 4.3 0 0 0 0 8.6H20"/><path d="M26 20.8h4.3a4.3 4.3 0 0 0 0-8.6H28"/><path d="M20.5 16.5h7"/></g></svg>';

const av = (c, sz) => {
  const st = `background-color:${c.c};${c.logo ? `background-image:url('${c.logo}');background-color:#fff;` : ''}${sz ? `width:${sz}px;height:${sz}px;font-size:${Math.round(sz / 3.2)}px;border-radius:${Math.round(sz / 3.5)}px;` : ''}`;
  return `<span class="avatar" style="${st}">${c.logo ? '' : esc(iniciales(c.n))}</span>`;
};
const pill = i => `<span class="pill st-${ESTADOS[i]}"><span class="dot"></span>${ST[ESTADOS[i]]}</span>`;
const chips = (list, sel, attr, sm) => `<div class="chips" ${attr || ''}>${list.map(x => `<button class="chip${sm ? ' sm' : ''}" data-val="${esc(x)}" aria-pressed="${Array.isArray(sel) ? sel.includes(x) : sel === x}">${esc(x)}</button>`).join('')}</div>`;
const netPill = () => `<span class="net ${navigator.onLine ? '' : 'off'}"><i></i>${navigator.onLine ? 'En línea' : 'Sin internet'}</span>`;

/* ---------- 6. Pantallas ---------- */
const V = {};

function vrow(v) {
  const c = cli(v.cli);
  return `<button class="row" data-open="${v.id}">${av(c)}<div class="grow"><div class="t">${esc(v.t)}</div><div class="s">${esc(c.n)} · ${v.redes.join(' + ')} · ${hace(v.act)}</div></div>${pill(v.st)}</button>`;
}
function respaldoViejo() {
  const ref = db.ajustes.respaldo || db.ajustes.inicio;
  return (Date.now() - ref) / 86400000 >= 7;
}

V.home = () => {
  const last = vid(db.ajustes.ultimoVideo);
  const ideas = db.ideas.filter(i => !i.video);
  const prog = db.videos.filter(v => v.st < 4).sort((a, b) => b.act - a.act);
  return {
    tab: 'home', fab: 1,
    top: `<div class="brandrow">${MARK}<div class="name">NEXO <i>Guion</i></div></div>${netPill()}`,
    body: `
    <div class="idea"><label for="ideaIn">${I.bulb} Nueva idea</label>
      <div class="in"><textarea id="ideaIn" placeholder="Escribe y toca la flecha…" enterkeyhint="done"></textarea><button class="go" data-act="ideaSave" aria-label="Guardar idea">${I.arrow}</button></div></div>
    <button class="btn b-add" data-act="newVideo">${I.plus} Nuevo video</button>
    ${last ? `<button class="continue" data-open="${last.id}"><span class="play">${I.play}</span><span class="grow"><span style="display:block;font-size:11px;color:var(--a-ink);font-weight:700;text-transform:uppercase;letter-spacing:.06em">Continuar donde quedé</span><span style="display:block;font-weight:600;margin-top:2px">${esc(last.t)}</span><span style="display:block;font-size:12px;color:var(--muted)">${esc(cli(last.cli).n)} · ${hace(last.act)}</span></span>${I.chev}</button>` : ''}
    ${respaldoViejo() ? `<button class="warnbox" data-go="ajustes" style="text-align:left;width:100%"><b>⚠ Haz tu respaldo semanal</b><br>Toca aquí para guardar una copia de tus guiones.</button>` : ''}
    <div class="sec-t">Ideas (${ideas.length})</div>
    <div class="list">${ideas.length ? ideas.map(i => `<div class="row ideaRow"><button class="grow" data-idea="${i.id}" style="border:0;background:none;text-align:left;padding:0"><div style="font-weight:500">${esc(i.t)}</div><div class="s">${hace(i.creado)}</div></button><button class="btn b-add mini" data-conv="${i.id}">→ Video</button></div>`).join('') : '<p class="empty">Aquí aparecen tus ideas. Toca el bombillo amarillo para guardar una en segundos.</p>'}</div>
    <div class="sec-t">En progreso</div>
    <div class="list">${prog.length ? prog.slice(0, 6).map(vrow).join('') : '<p class="empty">No hay videos en progreso.</p>'}</div>`
  };
};

V.hoja = id => {
  const v = vid(id); if (!v) return V.home();
  const c = cli(v.cli);
  return {
    back: 1, foot: 1, rec: S.rec,
    top: `<h2>${esc(v.t)}</h2><span class="saved" id="savedIco">${sv('<path d="M5 12l5 5 9-10"/>', 14, 3)} Guardado</span><button class="iconbtn" data-act="videoMenu" aria-label="Más opciones">${I.dots}</button>`,
    body: `
    <div class="sticky">
      <div class="summary" id="sum"></div>
      <div class="mode"><button data-rec="0" aria-pressed="${!S.rec}">✍ Escribir</button><button data-rec="1" aria-pressed="${S.rec}">🎬 Grabar</button></div>
      <p class="note" id="dlgNote" hidden></p>
    </div>
    <details class="box hide-rec"><summary>${av(c, 24)} ${esc(c.n)} · ${v.redes.join(' + ')} · ${esc(v.obj || '')}</summary><div class="in">
      <label class="field-t" for="vTitle">Título</label><input class="free" id="vTitle" data-v="t" value="${esc(v.t)}">
      <span class="field-t">Cliente</span>${chips(db.clientes.map(x => x.n), c.n, 'data-vk="cli"', 1)}
      <span class="field-t">Redes</span>${chips(O.redes.map(r => RED_TXT[r]), v.redes.map(r => RED_TXT[r]), 'data-vk="redes"', 1)}
      <span class="field-t">Objetivo</span>${chips(O.obj, v.obj, 'data-vk="obj"', 1)}
    </div></details>
    <div class="stepper hide-rec">${ESTADOS.map((e, i) => `<button data-st="${i}" class="${i <= v.st ? 'done' : ''} ${i === v.st ? 'cur' : ''}"><i></i>${ST[e]}</button>`).join('')}</div>
    <div class="dates hide-rec">
      <label>📅 Grabación<input type="datetime-local" data-v="fg" value="${esc(v.fg)}"></label>
      <label>📦 Entrega<input type="date" data-v="fe" value="${esc(v.fe)}"></label>
    </div>
    <details class="box hide-rec" ${v.g ? '' : 'open'}><summary>Estructura G-P-S-C</summary><div class="in">
      ${[['g', 'G', 'Gancho: lo primero que se dice'], ['p', 'P', 'Problema'], ['s', 'S', 'Solución'], ['c', 'C', 'Llamado a la acción']].map(([k, l, ph]) => `<div class="gp"><b>${l}</b><textarea class="inl" data-v="${k}" rows="1" placeholder="${ph}">${esc(v[k])}</textarea></div>`).join('')}
      <button class="btn b-neu mini" data-act="pickHook" style="align-self:flex-start">🪝 Elegir del banco de ganchos</button>
    </div></details>
    <div id="escenas" style="display:flex;flex-direction:column;gap:12px">${v.escenas.map((e, si) => sceneHTML(e, si)).join('') || '<p class="empty">Toca “+ Escena” para empezar.</p>'}</div>
    <p class="note hide-rec">Todo se guarda solo en tu celular, sin internet.</p>`,
    after() { updSum(); autosizeAll(); }
  };
};

function sceneHTML(e, si) {
  let n = 0;
  return `<section class="scene" data-s="${si}">
    <div class="scene-h"><span class="num">ESC ${si + 1}</span><input class="inl" data-e="nombre" value="${esc(e.nombre)}" placeholder="Nombre de la escena"><button class="dots" data-act="sceneMenu" aria-label="Opciones de escena">${I.dots}</button></div>
    <div class="props">${['lugar', 'momento', 'ambiente', 'luz'].map(k => `<select data-e="${k}" aria-label="${k}">${opts(O[k], e[k])}</select>`).join('')}</div>
    <details class="more"><summary>+ Detalles: lugar exacto, sonido, música, Filmora…</summary><div class="in">
      <input data-e="detalle" value="${esc(e.detalle)}" placeholder="Lugar exacto (ej.: mesa de armado)">
      <input data-e="objetos" value="${esc(e.objetos)}" placeholder="Objetos en escena">
      <input data-e="sonido" value="${esc(e.sonido)}" placeholder="Sonido ambiente">
      <input data-e="musica" value="${esc(e.musica)}" placeholder="Música">
      <input data-e="texto" value="${esc(e.texto)}" placeholder="Texto en pantalla">
      <span class="field-t" style="margin:4px 0 0">Efectos de Filmora 16</span>
      ${chips(O.filmora, e.filmora || [], 'data-filmora', 1)}
    </div></details>
    <div class="rows">${e.rows.map((r, ri) => rowHTML(r, ri, r.k === 'pla' ? ++n : 0)).join('') || '<p class="hint">Agrega la primera fila con los botones de abajo.</p>'}</div>
    <div class="addbar">
      <button class="btn b-per" data-add="per">${I.plus} Persona</button>
      <button class="btn b-pla" data-add="pla">${I.plus} Plano</button>
      <button class="btn b-cam" data-add="cam">${I.plus} Cámara</button>
    </div></section>`;
}
function rowHTML(r, ri, n) {
  const m = `<button class="dots" data-act="rowMenu" aria-label="Opciones">${I.dots}</button>`;
  if (r.k === 'per') return `<div class="rw per" data-r="${ri}"><span class="stripe"></span><div class="body">
    <div class="rw-h"><span class="kind">${I.per}</span><select class="ptag" data-f="p" aria-label="Persona">${opts(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], r.p)}</select><input class="inl" data-f="rol" value="${esc(r.rol)}" placeholder="¿Quién es?" style="font-weight:600"><span class="est" data-est>≈ ${est(r.d)} s</span>${m}</div>
    <textarea class="inl" data-f="d" rows="1" placeholder="¿Qué dice?">${esc(r.d)}</textarea>
    <input class="inl hide-rec" data-f="hace" value="${esc(r.hace)}" placeholder="Ropa / qué hace (opcional)" style="font-size:14px;color:var(--muted)">
  </div></div>`;
  if (r.k === 'pla') return `<div class="rw pla ${r.ok ? 'done' : ''}" data-r="${ri}"><span class="stripe"></span><div class="body">
    <div class="rw-h"><button class="chk" data-ok aria-pressed="${!!r.ok}" aria-label="Plano grabado">${I.check}</button><span class="kind">${I.pla} Plano ${n}</span><span class="grow"></span>
      <input class="secin" data-f="s" type="number" inputmode="numeric" min="1" value="${r.s}" aria-label="Segundos"><span class="est">seg</span>${m}</div>
    <div class="rw-h"><select class="s3" data-f="tipo" aria-label="Tipo de plano">${opts(O.tipo, r.tipo)}</select><select class="s3" data-f="ang" aria-label="Ángulo">${opts(O.ang, r.ang)}</select><select class="s3" data-f="mov" aria-label="Movimiento">${opts(O.mov, r.mov)}</select></div>
  </div></div>`;
  return `<div class="rw cam" data-r="${ri}"><span class="stripe"></span><div class="body">
    <div class="rw-h"><span class="kind">${I.cam} Cámara</span><span class="grow"></span><select class="s3" data-f="alt" style="flex:none;width:110px" aria-label="Altura">${opts(O.alt, r.alt)}</select><button class="mapb" data-act="map">🗺 Mapa</button>${m}</div>
    <input class="inl" data-f="pos" value="${esc(r.pos)}" placeholder="¿Dónde va la cámara?">
  </div></div>`;
}
function updSum() {
  const v = vid(cur.arg), el = $('#sum'); if (!v || !el) return;
  const s = stats(v);
  el.innerHTML = S.rec
    ? `<div><b>${s.ok}/${s.pl}</b><span>grabados</span></div><div><b>${s.esc}</b><span>escenas</span></div><div><b>${s.per}</b><span>personas</span></div><div><b>${s.s}</b><span>segundos</span></div>`
    : `<div><b>${s.esc}</b><span>escenas</span></div><div><b>${s.per}</b><span>personas</span></div><div><b>${s.pl}</b><span>planos</span></div><div><b>${s.s}</b><span>segundos</span></div>`;
  const n = $('#dlgNote');
  if (n) { const show = !S.rec && s.dlg > s.s && s.pl; n.hidden = !show; if (show) n.textContent = `El diálogo dura ≈ ${s.dlg} s y los planos suman ${s.s} s: alarga los planos.`; }
}
function autosize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function autosizeAll() { document.querySelectorAll('#screen textarea.inl').forEach(autosize); }

V.mapa = ([vidId, si]) => ({
  back: 1, top: `<h2>Mapa · Escena ${+si + 1}</h2>`,
  body: `<div class="tools">
    <button class="sw" data-col="fg" aria-pressed="true" style="background:var(--fg)" aria-label="Negro"></button>
    <button class="sw" data-col="cam" aria-pressed="false" style="background:var(--c-cam)" aria-label="Rosado"></button>
    <button class="sw" data-col="pla" aria-pressed="false" style="background:var(--c-pla)" aria-label="Azul"></button>
    <span class="grow"></span>
    <button class="btn b-neu mini" id="mUndo">↶ Deshacer</button><button class="btn b-del mini" id="mClear">Borrar</button></div>
    <div class="canvaswrap" id="cw"><div class="grid-bg"></div><canvas id="cv"></canvas></div>
    <div class="palette">
      <button class="b-cam" data-stamp="cam"><span>📷</span>Cámara</button>
      <button class="b-per" data-stamp="per"><span>🧍</span>Persona</button>
      <button class="b-idea" data-stamp="luz"><span>💡</span>Luz</button>
      <button class="b-neu" data-stamp="obj"><span>📦</span>Objeto</button></div>
    <p class="note">Dibuja con el dedo. Toca un ícono para ponerlo y arrástralo. Toca dos veces un ícono para quitarlo. Se guarda solo.</p>`,
  after() { initMap(vidId, +si); }
});

V.pdf = id => {
  const v = vid(id), c = cli(v.cli), pv = S.pdf;
  return {
    back: 1, top: `<h2>PDF del guion</h2>`,
    body: `<div class="mode"><button data-pv="cliente" aria-pressed="${pv.ver === 'cliente'}">Para el cliente</button><button data-pv="equipo" aria-pressed="${pv.ver === 'equipo'}">Para el equipo</button></div>
    <div class="card setrow"><div class="grow"><b>Mostrar el plan del cliente</b><div style="font-size:12.5px;color:var(--muted)">Ej.: “Video 3 de 12 · Plan Pro”</div></div><button class="toggle" data-act="pdfPlan" aria-pressed="${pv.plan}" aria-label="Mostrar plan"></button></div>
    <div class="card" style="padding:8px;overflow:hidden" id="prevBox"><div id="prev" style="transform-origin:0 0"></div></div>
    ${c.wa ? `<div class="card setrow"><div class="grow"><div style="font-size:12px;color:var(--muted)">WhatsApp de ${esc(c.n)}</div><b style="font-size:17px">${esc(c.wa)}</b></div><button class="btn b-neu mini" data-copy="${esc(c.wa)}">${I.copy} Copiar</button></div>` : ''}
    <button class="btn b-send" data-act="sendPdf">${I.wa} Mandar por WhatsApp</button>
    <button class="btn b-pdf" data-act="sharePdf">${I.pdf} Guardar o compartir PDF</button>
    <p class="note">Se abre el menú de compartir del celular: elige WhatsApp y el chat.</p>`,
    after() {
      const box = $('#prevBox'), p = $('#prev');
      p.innerHTML = paperHTML(v, pv, true);
      const k = (box.clientWidth - 16) / 794; p.style.transform = `scale(${k})`;
      requestAnimationFrame(() => { box.style.height = (p.firstElementChild.offsetHeight * k + 16) + 'px'; });
    }
  };
};

V.clientes = () => ({
  tab: 'clientes', fab: 1, top: `<h2>Clientes</h2>`,
  body: `<button class="btn b-add" data-go="clienteForm">${I.plus} Nuevo cliente</button>
  <div class="list">${db.clientes.map(c => { const cup = planCupo(c.plan), h = delMes(c); return `<button class="row" data-go="cliente:${c.id}">${av(c)}<div class="grow"><div class="t">${esc(c.n)}</div><div class="s">${c.plan ? `Plan ${esc(c.plan)} · ${h} de ${cup} videos este mes` : 'Sin plan'}</div>${cup ? `<div class="planbar"><i style="width:${Math.min(100, h / cup * 100)}%"></i></div>` : ''}</div>${I.chev}</button>`; }).join('')}</div>
  <div class="sec-t">Paquetes</div>
  <div class="card" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">${db.planes.map(p => `<div style="background:var(--bg);border-radius:12px;padding:10px 4px"><b style="font-family:var(--f-display);font-size:20px;display:block">${p.v}</b><span style="font-size:11.5px;color:var(--muted)">videos/mes</span><div style="font-weight:600;font-size:13px;margin-top:4px">${esc(p.n)}</div></div>`).join('')}</div>`
});

V.cliente = id => {
  const c = cli(id); if (!c.id) return V.clientes();
  const cup = planCupo(c.plan), h = delMes(c), vs = db.videos.filter(v => v.cli === id).sort((a, b) => b.act - a.act);
  const redes = [['Instagram', c.ig], ['TikTok', c.tt], ['Facebook', c.fb], ['YouTube', c.yt], ['WhatsApp', c.wa]].filter(x => x[1]);
  return {
    back: 1, top: `<h2>${esc(c.n)}</h2><button class="iconbtn" data-go="clienteForm:${id}" aria-label="Editar">${I.edit}</button>`,
    body: `<div class="card setrow">${av(c, 58)}<div class="grow"><b style="font-size:16px">${esc(c.n)}</b>
      <div style="font-size:12.5px;color:var(--muted)">${c.plan ? 'Plan ' + esc(c.plan) : 'Sin plan'}${c.nota ? ' · ' + esc(c.nota) : ''}</div>
      ${cup ? `<div class="planbar"><i style="width:${Math.min(100, h / cup * 100)}%"></i></div><div style="font-size:12px;color:var(--muted);margin-top:4px">${h} de ${cup} videos este mes · faltan ${Math.max(0, cup - h)}</div>` : ''}</div></div>
    ${redes.length ? `<div class="card" style="font-size:13px;line-height:1.7">${redes.map(r => `<b>${r[0]}:</b> ${esc(r[1])}`).join('<br>')}</div>` : ''}
    <button class="btn b-add" data-act="newVideo" data-cli="${id}">${I.plus} Nuevo video para ${esc(c.n)}</button>
    <div class="sec-t">Videos (${vs.length})</div><div class="list">${vs.map(vrow).join('') || '<p class="empty">Aún no hay videos.</p>'}</div>`
  };
};

V.clienteForm = id => {
  const c = id ? cli(id) : null;
  // S.formLive = true mientras el formulario está abierto (así no se pierden los cambios al refrescar)
  if (!S.formLive) { S.form = c ? JSON.parse(JSON.stringify(c)) : { id: '', n: '', c: O.colores[db.clientes.length % O.colores.length], logo: '', plan: '', nota: '', wa: '', ig: '', tt: '', fb: '', yt: '' }; S.formLive = true; }
  const f = S.form;
  return {
    back: 1, top: `<h2>${c ? 'Editar cliente' : 'Nuevo cliente'}</h2>`,
    body: `<div class="form">
      <div class="setrow"><span id="fAv">${av(f.n ? f : Object.assign({}, f, { n: '?' }), 64)}</span><div class="grow" style="display:flex;flex-direction:column;gap:6px">
        <label class="btn b-neu mini" style="width:auto;align-self:flex-start">🖼 ${f.logo ? 'Cambiar logo' : 'Poner logo'}<input type="file" accept="image/*" id="fLogo" hidden></label>
        ${f.logo ? '<button class="btn b-del mini" data-act="logoOff" style="align-self:flex-start">Quitar logo</button>' : ''}</div></div>
      <div><label class="field-t" for="fN">Nombre</label><input class="free" id="fN" data-cf="n" value="${esc(f.n)}" placeholder="Ej.: Celulares Atrato"></div>
      <div><span class="field-t">Color de marca</span><div class="swatches">${O.colores.map(x => `<button class="sw" data-ccol="${x}" aria-pressed="${f.c === x}" style="background:${x}" aria-label="Color ${x}"></button>`).join('')}</div></div>
      <div><span class="field-t">Paquete</span>${chips(['Sin plan', ...db.planes.map(p => `${p.n} (${p.v})`)], f.plan ? `${f.plan} (${planCupo(f.plan)})` : 'Sin plan', 'data-cplan')}</div>
      <div><label class="field-t" for="fNota">Nota del plan</label><input class="free" id="fNota" data-cf="nota" value="${esc(f.nota)}" placeholder="Ej.: incluye 1 reel con dron"></div>
      <div><label class="field-t" for="fWa">WhatsApp</label><input class="free" id="fWa" data-cf="wa" type="tel" inputmode="tel" value="${esc(f.wa)}" placeholder="Ej.: 300 123 4567"></div>
      <div class="btns2">
        <input class="free" data-cf="ig" value="${esc(f.ig)}" placeholder="Instagram" aria-label="Instagram">
        <input class="free" data-cf="tt" value="${esc(f.tt)}" placeholder="TikTok" aria-label="TikTok">
        <input class="free" data-cf="fb" value="${esc(f.fb)}" placeholder="Facebook" aria-label="Facebook">
        <input class="free" data-cf="yt" value="${esc(f.yt)}" placeholder="YouTube" aria-label="YouTube">
      </div>
      <button class="btn b-add" data-act="clienteSave">${I.check} ${c ? 'Listo' : 'Crear cliente'}</button>
      ${c && c.id !== 'nexo' ? '<button class="btn b-del" data-act="clienteDel">Borrar cliente</button>' : ''}
    </div>`
  };
};

V.buscar = () => ({
  tab: 'buscar', fab: 1, top: `<h2>Filtrar videos</h2>`,
  body: `<input class="free" id="q" value="${esc(S.f.q)}" placeholder="Buscar por título…" enterkeyhint="search">
  <div><span class="field-t">Estado</span><div class="chips">${[['progreso', 'En progreso'], ['todos', 'Todos'], ...ESTADOS.map(e => [e, ST[e]])].map(([v, l]) => `<button class="chip sm" data-flt="st|${v}" aria-pressed="${S.f.st === v}">${l}</button>`).join('')}</div></div>
  <div><span class="field-t">Cliente</span><div class="chips">${[['todos', 'Todos'], ...db.clientes.map(c => [c.id, c.n])].map(([v, l]) => `<button class="chip sm" data-flt="cli|${v}" aria-pressed="${S.f.cli === v}">${esc(l)}</button>`).join('')}</div></div>
  <div><span class="field-t">Red</span><div class="chips">${[['todas', 'Todas'], ['9:16', '9:16'], ['16:9', '16:9']].map(([v, l]) => `<button class="chip sm" data-flt="red|${v}" aria-pressed="${S.f.red === v}">${l}</button>`).join('')}</div></div>
  <div id="res"></div>`,
  after: filtrar
});
function filtrar() {
  const f = S.f, q = f.q.trim().toLowerCase();
  const list = db.videos.filter(v => (f.cli === 'todos' || v.cli === f.cli) && (f.st === 'todos' || (f.st === 'progreso' ? v.st < 4 : ESTADOS[v.st] === f.st)) && (f.red === 'todas' || v.redes.includes(f.red)) && (!q || v.t.toLowerCase().includes(q))).sort((a, b) => b.act - a.act);
  $('#res').innerHTML = `<div class="sec-t" style="margin-bottom:10px">${list.length} video${list.length === 1 ? '' : 's'}</div><div class="list">${list.map(vrow).join('') || '<p class="empty">Ningún video con esos filtros.</p>'}</div>`;
}

V.ajustes = () => {
  const a = db.ajustes;
  return {
    tab: 'ajustes', fab: 1, top: `<h2>Ajustes</h2>${netPill()}`,
    body: `
    <div class="sec-t">Respaldo</div>
    <div class="${respaldoViejo() ? 'warnbox' : 'card'}" style="font-size:13px;line-height:1.45">${a.respaldo ? `<b>Último respaldo: ${hace(a.respaldo)}</b>` : '<b>Todavía no has hecho un respaldo</b>'}<br>Si borras la app o los datos del navegador, se pierden los guiones. Guarda el archivo en Drive o mándatelo por WhatsApp.</div>
    <button class="btn b-add" data-act="backupOut">⬇ Exportar respaldo</button>
    <label class="btn b-neu">⬆ Importar respaldo<input type="file" accept=".json,application/json" id="backupIn" hidden></label>

    <div class="sec-t">Apariencia</div>
    <div class="card"><span class="field-t">Tema</span>${chips(['Automático', 'Claro', 'Oscuro'], { auto: 'Automático', light: 'Claro', dark: 'Oscuro' }[a.tema], 'data-tema')}</div>

    <div class="sec-t">Seguridad</div>
    <div class="card setrow"><div class="grow"><b>Bloquear con PIN</b><div style="font-size:12.5px;color:var(--muted)">Pide 4 números al abrir la app</div></div><button class="toggle" data-act="pinToggle" aria-pressed="${!!a.pin}" aria-label="Bloquear con PIN"></button></div>

    <div class="sec-t">Contenido</div>
    <div class="list">
      <button class="row" data-go="ganchos"><span class="avatar" style="background:var(--soft);font-size:20px">🪝</span><div class="grow"><div class="t">Banco de ganchos</div><div class="s">${db.ganchos.length} ganchos</div></div>${I.chev}</button>
      <button class="row" data-go="plantillas"><span class="avatar" style="background:var(--soft);font-size:20px">🧩</span><div class="grow"><div class="t">Plantillas</div><div class="s">${db.plantillas.length} guardadas</div></div>${I.chev}</button>
    </div>

    <div class="sec-t">Colores de los botones</div>
    <div class="card lg">
      <span><i style="background:var(--c-idea)"></i>Idea</span><span><i style="background:var(--c-add)"></i>Crear / agregar</span>
      <span><i style="background:var(--c-per)"></i>Persona</span><span><i style="background:var(--c-pla)"></i>Plano</span>
      <span><i style="background:var(--c-cam)"></i>Cámara</span><span><i style="background:var(--c-pdf)"></i>PDF</span>
      <span><i style="background:var(--c-send)"></i>WhatsApp</span><span><i style="background:var(--c-del)"></i>Borrar</span></div>

    <div class="sec-t">Actualizaciones</div>
    <div class="card" style="font-size:13px;line-height:1.45;color:var(--muted)">Versión <b style="color:var(--fg)">${CONFIG.VERSION}</b>${isNative ? ' · Android' : ' · Web'}. La app funciona 100 % sin internet${isNative ? ' y no se conecta a ningún servidor' : ''}.</div>
    <button class="btn b-neu" data-act="update">${isNative ? 'ℹ Cómo actualizar' : '🔄 Buscar actualizaciones'}</button>

    <div class="sec-t">Zona peligrosa</div>
    <button class="btn b-del" data-act="wipe">Borrar todos los datos</button>
    <p class="note">NEXO Guion · Excelencia digital, confianza real</p>`
  };
};

V.ganchos = () => ({
  back: 1, top: `<h2>Banco de ganchos</h2>`,
  body: `<button class="btn b-add" data-act="hookNew">${I.plus} Agregar gancho</button>
  <div class="list">${db.ganchos.map(g => `<div class="row"><div class="grow"><div class="s" style="margin:0 0 2px;text-transform:uppercase;font-weight:700;letter-spacing:.05em">${esc(g.tipo)}</div><div class="t">${esc(g.t)}</div><div class="s">Ej.: ${esc(g.ej)}</div></div><button class="dots" data-hookdel="${g.id}" aria-label="Borrar">${I.trash}</button></div>`).join('')}</div>`
});

V.plantillas = () => ({
  back: 1, top: `<h2>Plantillas</h2>`,
  body: db.plantillas.length ? `<div class="list">${db.plantillas.map(p => `<div class="row"><span class="avatar" style="background:var(--soft);font-size:20px">${p.tipo === 'video' ? '🎬' : '🎞'}</span><div class="grow"><div class="t">${esc(p.nombre)}</div><div class="s">Plantilla de ${p.tipo}</div></div><button class="dots" data-tpldel="${p.id}" aria-label="Borrar" style="color:var(--c-del)">${I.trash}</button></div>`).join('')}</div>`
    : '<p class="empty">Aún no tienes plantillas.<br>En un video toca ⋮ → “Guardar como plantilla”.<br>En una escena toca ⋮ → “Guardar escena como plantilla”.</p>'
});

/* ---------- 7. Motor de pantallas y navegación ---------- */
const S = { formLive: false, rec: false, pdf: { ver: 'cliente', plan: false }, f: { q: '', st: 'progreso', cli: 'todos', red: 'todas' }, stack: [], form: null };
const cur = { name: 'home', arg: null };
const scr = $('#screen'), topEl = $('#top'), tabs = $('#tabs'), foot = $('#foot'), fab = $('#fab'), modalEl = $('#modal');

function render(name, arg, keepScroll) {
  const y = scr.scrollTop;
  if (name !== 'clienteForm') S.formLive = false;
  cur.name = name; cur.arg = arg;
  const v = V[name](arg);
  topEl.innerHTML = (v.back ? `<button class="back" data-back aria-label="Atrás">${I.back}</button>` : '') + v.top;
  scr.innerHTML = v.body;
  scr.classList.toggle('rec', !!v.rec);
  tabs.hidden = !!v.back; fab.hidden = !v.fab; foot.hidden = !v.foot;
  if (v.foot) foot.innerHTML = `<button class="btn b-add" data-act="addScene">${I.plus} Escena</button><button class="btn b-pdf" data-go="pdf:${arg}">${I.pdf} PDF</button>`;
  tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === v.tab ? 'page' : 'false'));
  if (v.after) v.after();
  scr.scrollTop = keepScroll ? y : 0;
}
function go(target) {
  const i = target.indexOf(':'); const name = i < 0 ? target : target.slice(0, i); let arg = i < 0 ? null : target.slice(i + 1);
  if (name === 'mapa') arg = arg.split(',');
  S.stack.push([cur.name, cur.arg, scr.scrollTop]);
  render(name, arg);
}
function back() {
  if (modalEl.innerHTML) { closeModal(); return true; }
  const p = S.stack.pop(); if (!p) return false;
  render(p[0], p[1]); scr.scrollTop = p[2] || 0; return true;
}
function openVideo(id) {
  db.ajustes.ultimoVideo = id; save();
  S.rec = false;
  if (cur.name === 'hoja') render('hoja', id); else go('hoja:' + id);
}

/* ---------- 8. Ventanas, avisos y confirmaciones ---------- */
let tt;
function toast(msg, withUndo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? '<button data-act="undo">Deshacer</button>' : ''}`;
  t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), withUndo ? 5000 : 2400);
}
function sheet(html) { modalEl.innerHTML = `<div class="modal" data-close><div class="sheet" role="dialog"><span class="grab"></span>${html}</div></div>`; }
function closeModal() { modalEl.innerHTML = ''; }
function confirmar(titulo, texto, okTxt) {
  return new Promise(res => {
    sheet(`<h3>${esc(titulo)}</h3><p>${esc(texto)}</p><div class="btns2"><button class="btn b-neu" id="cNo">Cancelar</button><button class="btn b-delfill" id="cSi">${esc(okTxt || 'Borrar')}</button></div>`);
    $('#cNo').onclick = () => { closeModal(); res(false); };
    $('#cSi').onclick = () => { closeModal(); res(true); };
  });
}
function menu(titulo, items) {
  sheet(`<h3>${esc(titulo)}</h3><div class="menu">${items.map((it, i) => `<button class="btn ${it.cls || 'b-neu'}" data-mi="${i}">${it.ico || ''} ${esc(it.t)}</button>`).join('')}</div>`);
  modalEl.querySelectorAll('[data-mi]').forEach(b => b.onclick = () => { closeModal(); items[+b.dataset.mi].fn(); });
}

/* ---------- 9. Acciones ---------- */
function guardarIdea(texto) {
  const t = (texto || '').trim(); if (!t) return false;
  db.ideas.unshift({ id: uid(), t, creado: Date.now(), video: null }); save();
  toast('💡 Idea guardada'); return true;
}
function quickIdea() {
  sheet(`<h3>💡 Nueva idea</h3><textarea class="free" id="qIdea" rows="3" placeholder="Escribe la idea…"></textarea><button class="btn b-idea" id="qSave">${I.arrow} Guardar idea</button>`);
  const t = $('#qIdea'); setTimeout(() => t.focus(), 60);
  $('#qSave').onclick = () => { if (guardarIdea(t.value)) { closeModal(); if (cur.name === 'home') render('home', null, true); } else t.focus(); };
}
function ideaMenu(id) {
  const i = db.ideas.find(x => x.id === id); if (!i) return;
  sheet(`<h3>Idea</h3><textarea class="free" id="eIdea" rows="3">${esc(i.t)}</textarea>
    <button class="btn b-add" id="eConv">→ Convertir en video</button>
    <div class="btns2"><button class="btn b-neu" id="eOk">Listo</button><button class="btn b-del" id="eDel">Borrar idea</button></div>`);
  const t = $('#eIdea');
  const guardar = () => { if (t.value.trim()) { i.t = t.value.trim(); save(); } };
  $('#eOk').onclick = () => { guardar(); closeModal(); render('home', null, true); };
  $('#eConv').onclick = () => { guardar(); nuevoVideo({ titulo: i.t, idea: i.id }); };
  $('#eDel').onclick = () => { snapshot(); db.ideas = db.ideas.filter(x => x.id !== id); save(); closeModal(); render('home', null, true); toast('Idea borrada', true); };
}

/* Crear video: título, cliente, red, objetivo y (opcional) plantilla */
function nuevoVideo(o) {
  o = o || {};
  const n = { cli: o.cli || (db.clientes[0] && db.clientes[0].id) || '', redes: ['9:16'], obj: 'Vender', tpl: '' };
  const tpls = db.plantillas.filter(p => p.tipo === 'video');
  sheet(`<h3>Nuevo video</h3>
    <input class="free" id="nT" value="${esc(o.titulo || '')}" placeholder="Título del video">
    <div><span class="field-t">Cliente</span>${chips(db.clientes.map(c => c.n), cli(n.cli).n, 'id="nCli"', 1)}</div>
    <div><span class="field-t">Red</span>${chips(O.redes.map(r => RED_TXT[r]), [RED_TXT['9:16']], 'id="nRed"', 1)}</div>
    <div><span class="field-t">Objetivo</span>${chips(O.obj, n.obj, 'id="nObj"', 1)}</div>
    ${tpls.length ? `<div><span class="field-t">Plantilla</span>${chips(['Vacía', ...tpls.map(t => t.nombre)], 'Vacía', 'id="nTpl"', 1)}</div>` : ''}
    <button class="btn b-add" id="nGo">${I.plus} Crear hoja de rodaje</button>`);
  const one = (sel, fn) => { const g = $(sel); if (!g) return; g.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; g.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); fn(b.dataset.val); }; };
  one('#nCli', v => n.cli = db.clientes.find(c => c.n === v).id);
  one('#nObj', v => n.obj = v);
  one('#nTpl', v => n.tpl = v === 'Vacía' ? '' : v);
  $('#nRed').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); n.redes = [...$('#nRed').querySelectorAll('[aria-pressed="true"]')].map(x => O.redes.find(r => RED_TXT[r] === x.dataset.val)); };
  if (!o.titulo) setTimeout(() => $('#nT').focus(), 60);
  $('#nGo').onclick = () => {
    const now = Date.now();
    let base = { g: '', p: '', s: '', c: '', escenas: [escenaNueva()] };
    const tp = tpls.find(t => t.nombre === n.tpl);
    if (tp) base = JSON.parse(JSON.stringify(tp.data));
    base.escenas.forEach(e => { e.id = uid(); e.rows.forEach(r => { r.id = uid(); r.ok = false; }); });
    const v = Object.assign(base, { id: uid(), cli: n.cli, t: $('#nT').value.trim() || 'Video sin título', obj: n.obj, redes: n.redes.length ? n.redes : ['9:16'], st: 1, fg: '', fe: '', creado: now, act: now });
    db.videos.unshift(v);
    if (o.idea) { const i = db.ideas.find(x => x.id === o.idea); if (i) i.video = v.id; }
    save(); closeModal(); openVideo(v.id); toast('Hoja creada: agrega filas con los botones de colores');
  };
}

function videoMenu() {
  const v = vid(cur.arg);
  menu('Opciones del video', [
    { t: 'Duplicar video', ico: '⧉', fn: () => { const c = dupVideo(v); c.t += ' (copia)'; openVideo(c.id); toast('Video duplicado'); } },
    { t: 'Versión para otra red', ico: '↔', cls: 'b-add', fn: () => otraRed(v) },
    { t: 'Guardar como plantilla', ico: '🧩', fn: () => guardarPlantilla('video', v) },
    { t: 'Agregar fechas a mi calendario', ico: '📅', fn: () => exportarICS(v) },
    { t: 'Borrar video', ico: '🗑', cls: 'b-del', fn: async () => { if (!await confirmar('¿Borrar este video?', 'Se borran sus escenas, planos y dibujos.')) return; snapshot(); db.videos = db.videos.filter(x => x.id !== v.id); save(); S.stack = []; render('home'); toast('Video borrado', true); } }
  ]);
}
function dupVideo(v) {
  const c = JSON.parse(JSON.stringify(v)); c.id = uid(); c.creado = c.act = Date.now(); c.ejemplo = false;
  c.escenas.forEach(e => { e.id = uid(); e.rows.forEach(r => { r.id = uid(); r.ok = false; }); });
  db.videos.unshift(c); save(); return c;
}
function otraRed(v) {
  const otras = O.redes.filter(r => !(v.redes.length === 1 && v.redes[0] === r));
  menu('¿Para qué red es la nueva versión?', otras.map(r => ({ t: RED_TXT[r], fn: () => { const c = dupVideo(v); c.redes = [r]; c.t = v.t + ' (' + r + ')'; c.st = Math.min(c.st, 1); save(); openVideo(c.id); toast('Versión ' + r + ' creada'); } })));
}
function guardarPlantilla(tipo, obj) {
  sheet(`<h3>Guardar plantilla</h3><input class="free" id="tplN" value="${esc(tipo === 'video' ? obj.t : (obj.nombre || 'Escena'))}" placeholder="Nombre de la plantilla"><button class="btn b-add" id="tplOk">${I.check} Guardar plantilla</button>`);
  $('#tplOk').onclick = () => {
    const nombre = $('#tplN').value.trim() || 'Plantilla';
    const data = tipo === 'video'
      ? { g: obj.g, p: obj.p, s: obj.s, c: obj.c, escenas: JSON.parse(JSON.stringify(obj.escenas)) }
      : JSON.parse(JSON.stringify(obj));
    db.plantillas.unshift({ id: uid(), nombre, tipo: tipo === 'video' ? 'video' : 'escena', data }); save(); closeModal(); toast('🧩 Plantilla guardada');
  };
}
function addScene() {
  const v = vid(cur.arg);
  const tpls = db.plantillas.filter(p => p.tipo === 'escena');
  const push = e => { e.id = uid(); e.rows.forEach(r => { r.id = uid(); r.ok = false; }); v.escenas.push(e); touch(v); render('hoja', v.id, true); const el = scr.querySelector(`[data-s="${v.escenas.length - 1}"]`); el && el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  if (!tpls.length) return push(escenaNueva());
  menu('Nueva escena', [{ t: 'Escena vacía', cls: 'b-add', ico: '+', fn: () => push(escenaNueva()) }, ...tpls.map(t => ({ t: t.nombre, ico: '🎞', fn: () => push(JSON.parse(JSON.stringify(t.data))) }))]);
}
function sceneMenu(si) {
  const v = vid(cur.arg), e = v.escenas[si];
  const mover = d => { const j = si + d; if (j < 0 || j >= v.escenas.length) return; v.escenas.splice(j, 0, v.escenas.splice(si, 1)[0]); touch(v); render('hoja', v.id, true); };
  menu(`Escena ${si + 1}`, [
    { t: 'Subir', ico: I.up, fn: () => mover(-1) },
    { t: 'Bajar', ico: I.down, fn: () => mover(1) },
    { t: 'Duplicar escena', ico: '⧉', fn: () => { const c = JSON.parse(JSON.stringify(e)); c.id = uid(); c.rows.forEach(r => { r.id = uid(); r.ok = false; }); v.escenas.splice(si + 1, 0, c); touch(v); render('hoja', v.id, true); toast('Escena duplicada'); } },
    { t: 'Guardar escena como plantilla', ico: '🧩', fn: () => guardarPlantilla('escena', e) },
    { t: 'Borrar escena', ico: '🗑', cls: 'b-del', fn: () => { snapshot(); v.escenas.splice(si, 1); touch(v); render('hoja', v.id, true); toast('Escena borrada', true); } }
  ]);
}
function rowMenu(si, ri) {
  const v = vid(cur.arg), rows = v.escenas[si].rows;
  const mover = d => { const j = ri + d; if (j < 0 || j >= rows.length) return; rows.splice(j, 0, rows.splice(ri, 1)[0]); touch(v); render('hoja', v.id, true); };
  menu('Fila', [
    { t: 'Subir', ico: I.up, fn: () => mover(-1) },
    { t: 'Bajar', ico: I.down, fn: () => mover(1) },
    { t: 'Duplicar', ico: '⧉', fn: () => { const c = JSON.parse(JSON.stringify(rows[ri])); c.id = uid(); c.ok = false; rows.splice(ri + 1, 0, c); touch(v); render('hoja', v.id, true); } },
    { t: 'Borrar fila', ico: '🗑', cls: 'b-del', fn: () => { snapshot(); rows.splice(ri, 1); touch(v); render('hoja', v.id, true); toast('Fila borrada', true); } }
  ]);
}
function addRow(si, k) {
  const v = vid(cur.arg), rows = v.escenas[si].rows;
  const pers = rows.filter(r => r.k === 'per');
  const lastP = pers[pers.length - 1];
  let row;
  if (k === 'per') row = { p: lastP ? (lastP.p === 'P1' ? 'P2' : 'P1') : 'P1', rol: '', d: '', hace: '' };
  else if (k === 'pla') row = { tipo: 'Medio', ang: 'Normal', mov: 'Fija', s: lastP && est(lastP.d) ? est(lastP.d) : 3, ok: false };
  else row = { pos: '', alt: 'A los ojos' };
  if (k === 'per' && lastP && lastP.rol && row.p === lastP.p) row.rol = lastP.rol;
  const prevRol = pers.find(r => r.p === row.p && r.rol); if (k === 'per' && prevRol) row.rol = prevRol.rol;
  rows.push(Object.assign({ id: uid(), k }, row)); touch(v);
  render('hoja', v.id, true);
  const el = scr.querySelector(`[data-s="${si}"] [data-r="${rows.length - 1}"]`);
  if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); const f = el.querySelector(k === 'per' ? (row.rol ? 'textarea' : 'input') : k === 'cam' ? 'input.inl' : 'select'); if (f && k !== 'pla') f.focus({ preventScroll: true }); }
}
function pickHook() {
  const v = vid(cur.arg);
  sheet(`<h3>🪝 Banco de ganchos</h3><div class="list">${db.ganchos.map(g => `<button class="row" data-hk="${g.id}"><div class="grow"><div class="s" style="margin:0 0 2px;text-transform:uppercase;font-weight:700">${esc(g.tipo)}</div><div class="t">${esc(g.ej)}</div><div class="s">${esc(g.t)}</div></div></button>`).join('')}</div>`);
  modalEl.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => { const g = db.ganchos.find(x => x.id === b.dataset.hk); v.g = g.ej; touch(v); closeModal(); render('hoja', v.id, true); toast('Gancho puesto: edítalo a tu gusto'); });
}
function hookNew() {
  sheet(`<h3>Nuevo gancho</h3>
    <input class="free" id="hT" placeholder="Tipo (ej.: Pregunta, Reto, Local)">
    <input class="free" id="hP" placeholder="Plantilla (ej.: ¿Sabías que [dato]?)">
    <input class="free" id="hE" placeholder="Ejemplo (ej.: ¿Sabías que tu PC…?)">
    <button class="btn b-add" id="hOk">${I.plus} Agregar gancho</button>`);
  $('#hOk').onclick = () => { const e = $('#hE').value.trim() || $('#hP').value.trim(); if (!e) return $('#hE').focus(); db.ganchos.unshift({ id: uid(), tipo: $('#hT').value.trim() || 'Propio', t: $('#hP').value.trim() || e, ej: e, propio: true }); save(); closeModal(); render('ganchos'); toast('Gancho agregado'); };
}

/* Clientes */
function clienteSave() {
  const f = S.form; f.n = f.n.trim();
  if (!f.n) { toast('Escribe el nombre del cliente'); $('#fN').focus(); return; }
  if (f.id) { const i = db.clientes.findIndex(c => c.id === f.id); db.clientes[i] = f; }
  else { f.id = uid(); db.clientes.push(f); }
  save(); S.formLive = false;
  if (cur.arg) back(); else render('cliente', f.id);   // editar: vuelve; nuevo: abre el cliente
  toast('Cliente guardado');
}
async function clienteDel() {
  const f = S.form, n = db.videos.filter(v => v.cli === f.id).length;
  if (!await confirmar('¿Borrar cliente?', n ? `También se borran sus ${n} videos.` : 'Esta acción se puede deshacer unos segundos.')) return;
  snapshot(); db.clientes = db.clientes.filter(c => c.id !== f.id); db.videos = db.videos.filter(v => v.cli !== f.id); save();
  S.stack = []; render('clientes'); toast('Cliente borrado', true);
}
function leerLogo(file) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = 256, k = Math.min(s / img.width, s / img.height), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      S.form.logo = cv.toDataURL('image/png'); refreshForm();
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function refreshForm() { render('clienteForm', cur.arg, true); }
function rebindForm() {
  // vuelve a pintar el formulario con los datos actuales (sin perderlos)
  const f = S.form;
  scr.querySelectorAll('[data-cf]').forEach(i => i.value = f[i.dataset.cf] || '');
  $('#fAv').innerHTML = av(f.n ? f : Object.assign({}, f, { n: '?' }), 64);
  scr.querySelectorAll('[data-ccol]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ccol === f.c));
  scr.querySelectorAll('[data-cplan] .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.val.startsWith(f.plan || 'Sin plan')));
}

/* ---------- 10. Respaldo y calendario ---------- */
async function backupOut() {
  const d = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
  const ok = await compartir(blob, `nexo-guion-respaldo-${d}.json`);
  if (ok) { db.ajustes.respaldo = Date.now(); save(); render('ajustes', null, true); toast('✅ Respaldo listo'); }
}
function backupIn(file) {
  const fr = new FileReader();
  fr.onload = async () => {
    let data; try { data = JSON.parse(fr.result); } catch (e) { toast('⚠ Ese archivo no es un respaldo válido'); return; }
    if (!data || data.v !== 1 || !Array.isArray(data.videos)) { toast('⚠ Ese archivo no es un respaldo de NEXO Guion'); return; }
    if (!await confirmar('¿Importar respaldo?', `Tiene ${data.videos.length} videos y ${data.clientes.length} clientes. Reemplaza lo que hay ahora en la app.`, 'Importar')) return;
    snapshot(); db = data; save(); applyTheme(); S.stack = []; render('home'); toast('✅ Respaldo importado', true);
  };
  fr.readAsText(file);
}
function exportarICS(v) {
  if (!v.fg && !v.fe) { toast('Primero pon la fecha de grabación o de entrega'); return; }
  const pad = n => String(n).padStart(2, '0');
  const dt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const day = s => s.replace(/-/g, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NEXO PC//NEXO Guion//ES', 'CALSCALE:GREGORIAN'];
  const stamp = dt(new Date());
  if (v.fg) {
    const ini = new Date(v.fg), fin = new Date(ini.getTime() + 2 * 3600000);
    L.push('BEGIN:VEVENT', `UID:${v.id}-g@nexoguion`, `DTSTAMP:${stamp}`, `DTSTART:${dt(ini)}`, `DTEND:${dt(fin)}`, `SUMMARY:🎬 Grabar: ${v.t}`, `DESCRIPTION:Cliente: ${cli(v.cli).n}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana grabas', 'END:VALARM', 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Grabas en 2 horas', 'END:VALARM', 'END:VEVENT');
  }
  if (v.fe) {
    const d2 = new Date(v.fe + 'T00:00'); d2.setDate(d2.getDate() + 1);
    L.push('BEGIN:VEVENT', `UID:${v.id}-e@nexoguion`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(v.fe)}`, `DTEND;VALUE=DATE:${d2.getFullYear()}${pad(d2.getMonth() + 1)}${pad(d2.getDate())}`, `SUMMARY:📦 Entregar: ${v.t}`, `DESCRIPTION:Cliente: ${cli(v.cli).n}`,
      'BEGIN:VALARM', 'TRIGGER:-PT15H', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana entregas', 'END:VALARM', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  compartir(new Blob([L.join('\r\n')], { type: 'text/calendar' }), `${slug(v.t)}.ics`);
}
const slug = s => (s || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'video';

/* Compartir un archivo: en el APK usa el menú nativo; en el iPhone/navegador usa el de la web */
function blobToBase64(blob) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); }); }
async function compartir(blob, nombre) {
  try {
    if (isNative && Plug('Filesystem') && Plug('Share')) {
      const data = await blobToBase64(blob);
      const r = await Plug('Filesystem').writeFile({ path: nombre, data, directory: 'CACHE' });
      await Plug('Share').share({ title: nombre, files: [r.uri], dialogTitle: 'Compartir' });
      return true;
    }
    const file = new File([blob], nombre, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: nombre }); return true; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
  } catch (e) {
    if (e && (e.name === 'AbortError' || /cancel/i.test(e.message || ''))) return false;
    toast('⚠ No se pudo compartir: ' + (e.message || e)); return false;
  }
}

/* ---------- 11. PDF con tarjetas ---------- */
function paperHTML(v, pv, preview) {
  const c = cli(v.cli), s = stats(v), col = { per: '#F97316', pla: '#2563EB', cam: '#DB2777' };
  const tag = (t, color) => `<b style="color:${color}">${t}</b>`;
  let html = `<div class="paper" style="--cli:${c.c}">
    <div class="blk"><div class="ph"><img src="icons/logo-nexo.png" alt="NEXO PC"><div class="cl">${av(c, 48)}${esc(c.n)}</div></div></div>
    <div class="blk"><h1>${esc(v.t)}</h1><div class="meta">${pv.ver === 'equipo' ? 'Hoja de rodaje' : 'Guion del video'} · ${ST[ESTADOS[v.st]]}${v.fg ? ' · Grabación: ' + fecha(v.fg) : ''}${v.fe ? ' · Entrega: ' + fecha(v.fe) : ''}</div>
      <div class="tags">${v.redes.map(r => `<span class="tag">${RED_TXT[r]}</span>`).join('')}<span class="tag">${s.s} s</span><span class="tag">${s.esc} escenas</span><span class="tag">${s.per} personas</span><span class="tag">${s.pl} planos</span>${v.obj ? `<span class="tag">${esc(v.obj)}</span>` : ''}</div></div>
    ${pv.plan && c.plan ? `<div class="blk"><div class="planline">Video ${Math.max(1, delMes(c))} de ${planCupo(c.plan)} · Plan ${esc(c.plan)}</div></div>` : ''}
    <div class="blk"><div class="g4">${[['Gancho', v.g], ['Problema', v.p], ['Solución', v.s], ['Llamado a la acción', v.c]].map(([k, t]) => `<div class="pc"><span class="k">${k}</span>${esc(t) || '—'}</div>`).join('')}</div></div>`;
  if (pv.ver === 'equipo') {
    v.escenas.forEach((e, i) => {
      let n = 0;
      const img = !preview && mapaTieneAlgo(e.mapa) ? mapToDataURL(e.mapa, 440, 550, false) : '';
      const props = [e.lugar + (e.detalle ? ' (' + e.detalle + ')' : ''), e.momento, e.ambiente, 'Luz: ' + e.luz, e.objetos && 'Objetos: ' + e.objetos, e.sonido && 'Sonido: ' + e.sonido, e.musica && 'Música: ' + e.musica, e.texto && 'Texto: ' + e.texto, (e.filmora || []).length && 'Filmora: ' + e.filmora.join(', ')].filter(Boolean).map(esc).join(' · ');
      html += `<div class="blk"><div class="sc"><div class="sch"><span class="n">ESC ${i + 1}</span><b>${esc(e.nombre) || 'Escena ' + (i + 1)}</b></div>
        <div class="scb ${img || (preview && mapaTieneAlgo(e.mapa)) ? '' : 'nomap'}"><div>${e.rows.map(r => `<div class="pr"><i style="background:${col[r.k]}"></i><span>${r.k === 'per' ? `${tag(r.p + ' ' + esc(r.rol) + ':', '#C2410C')} “${esc(r.d)}”${r.hace ? `<br><span style="color:#5E717A;font-size:12px">${esc(r.hace)}</span>` : ''}` : r.k === 'pla' ? `${tag('Plano ' + (++n) + ':', '#1D4ED8')} ${r.tipo} · ${r.ang} · ${r.mov} · <b>${r.s} s</b>` : `${tag('Cámara:', '#BE185D')} ${esc(r.pos) || '—'} (${r.alt})`}</span></div>`).join('') || '<span style="color:#8FA3AB">Sin filas</span>'}</div>
        ${img ? `<img class="mapimg" src="${img}" alt="">` : preview && mapaTieneAlgo(e.mapa) ? '<div class="mapimg" style="height:275px;display:grid;place-items:center;color:#8FA3AB;background:#F4F7F8">Mapa</div>' : ''}</div>
        <div class="props">${props}</div></div></div>`;
    });
  } else {
    html += `<div class="blk"><div class="pc"><span class="k">Lo que vas a ver</span>${v.escenas.map((e, i) => `${i + 1}. ${esc(e.nombre) || 'Escena ' + (i + 1)}`).join('<br>') || '—'}</div></div>`;
    const dl = v.escenas.flatMap(e => e.rows.filter(r => r.k === 'per' && r.d));
    if (dl.length) html += `<div class="blk"><div class="pc"><span class="k">Lo que se dice</span>${dl.map(r => `${tag(r.p + (r.rol ? ' ' + esc(r.rol) : '') + ':', '#C2410C')} “${esc(r.d)}”`).join('<br>')}</div></div>`;
  }
  html += `<div class="blk"><div class="foot">Hecho con NEXO Guion · NEXO PC · Excelencia digital, confianza real</div></div></div>`;
  return html;
}
async function crearPDF(v) {
  const stage = $('#pdfStage');
  stage.innerHTML = paperHTML(v, S.pdf, false);
  await Promise.all([...stage.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), k = W / 794, M = 28;
  let y = M;
  for (const b of stage.querySelectorAll('.blk')) {
    const cv = await html2canvas(b, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const w = 714 * k, h = cv.height / 2 * k;
    if (y + h > H - M && y > M) { pdf.addPage(); y = M; }
    pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 40 * k, y, w, Math.min(h, H - 2 * M));
    y += h;
  }
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(140); pdf.text(`Página ${i} de ${n}`, W - 40 * k, H - 14, { align: 'right' }); }
  stage.innerHTML = '';
  return pdf.output('blob');
}
async function sharePdf() {
  const v = vid(cur.arg);
  toast('Creando el PDF…');
  try {
    const blob = await crearPDF(v);
    await compartir(blob, `${slug(v.t)}-${S.pdf.ver}.pdf`);
  } catch (e) { toast('⚠ No se pudo crear el PDF: ' + (e.message || e)); }
}

/* ---------- 12. Mapa de la escena ---------- */
const STAMP = { cam: ['📷', 'Cámara', '--c-cam'], per: ['🧍', 'P', '--c-per'], luz: ['💡', 'Luz', '--c-idea'], obj: ['📦', 'Objeto', '--muted'] };
const COLS_PDF = { fg: '#10202A', cam: '#DB2777', pla: '#2563EB', muted: '#8FA3AB' };
const mapaTieneAlgo = m => m && ((m.strokes && m.strokes.length) || (m.stamps && m.stamps.length));
function colorDe(c, pdf) { if (pdf) return COLS_PDF[c] || '#10202A'; const t = { fg: '--fg', cam: '--c-cam', pla: '--c-pla', muted: '--muted' }[c] || '--fg'; return getComputedStyle(document.documentElement).getPropertyValue(t).trim() || '#000'; }
function dibujar(ctx, m, W, H, pdf) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, W / 90);
  (m.strokes || []).forEach(s => { ctx.strokeStyle = colorDe(s.c, pdf); ctx.beginPath(); s.p.forEach((p, i) => i ? ctx.lineTo(p[0] * W, p[1] * H) : ctx.moveTo(p[0] * W, p[1] * H)); ctx.stroke(); });
}
function mapToDataURL(m, W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#EEF2F4'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  dibujar(ctx, m, W, H, true);
  const pc = { '--c-cam': '#DB2777', '--c-per': '#F97316', '--c-idea': '#FFC107', '--muted': '#8FA3AB' };
  (m.stamps || []).forEach(s => {
    const [e, , c] = STAMP[s.t]; const x = s.x * W, y = s.y * H;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = pc[c]; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 22, y - 22, 44, 44, 12) : ctx.rect(x - 22, y - 22, 44, 44); ctx.fill(); ctx.stroke();
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(e, x, y + 1);
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#10202A'; ctx.fillText(s.l, x, y + 34);
  });
  return cv.toDataURL('image/png');
}
function initMap(vidId, si) {
  const v = vid(vidId), e = v.escenas[si];
  if (!e.mapa) e.mapa = { strokes: [], stamps: [] };
  const m = e.mapa, cw = $('#cw'), cv = $('#cv'), ctx = cv.getContext('2d');
  let curS = null, col = 'fg';
  const W = () => cw.clientWidth, H = () => cw.clientHeight;
  function size() { const d = devicePixelRatio || 1; cv.width = W() * d; cv.height = H() * d; ctx.setTransform(d, 0, 0, d, 0, 0); draw(); }
  function draw() { ctx.clearRect(0, 0, W(), H()); dibujar(ctx, m, W(), H(), false); }
  const pt = ev => { const r = cw.getBoundingClientRect(); return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))]; };
  cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); curS = { c: col, p: [pt(ev)] }; m.strokes.push(curS); });
  cv.addEventListener('pointermove', ev => { if (!curS) return; const p = pt(ev), l = curS.p[curS.p.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.004) { curS.p.push([+p[0].toFixed(4), +p[1].toFixed(4)]); draw(); } });
  const fin = () => { if (curS) { curS = null; touch(v); } };
  cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  function stampEl(s) {
    const [em, , c] = STAMP[s.t], el = document.createElement('div');
    el.className = 'stamp'; el.style.setProperty('--sc', `var(${c})`); el.innerHTML = `${em}<small>${esc(s.l)}</small>`;
    const place = () => { el.style.left = s.x * 100 + '%'; el.style.top = s.y * 100 + '%'; }; place();
    let lastTap = 0;
    el.addEventListener('pointerdown', ev => {
      ev.stopPropagation(); el.setPointerCapture(ev.pointerId);
      const now = Date.now(); if (now - lastTap < 350) { m.stamps.splice(m.stamps.indexOf(s), 1); el.remove(); touch(v); toast('Ícono quitado'); return; } lastTap = now;
      el.onpointermove = mv => { const p = pt(mv); s.x = Math.min(.95, Math.max(.05, p[0])); s.y = Math.min(.95, Math.max(.05, p[1])); place(); };
      el.onpointerup = () => { el.onpointermove = null; touch(v); };
    });
    cw.appendChild(el);
  }
  m.stamps.forEach(stampEl);
  size(); new ResizeObserver(size).observe(cw);
  scr.querySelectorAll('.sw[data-col]').forEach(b => b.onclick = () => { col = b.dataset.col; scr.querySelectorAll('.sw[data-col]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('#mUndo').onclick = () => { m.strokes.pop(); draw(); touch(v); };
  $('#mClear').onclick = async () => { if (!await confirmar('¿Borrar el mapa?', 'Se quitan los trazos y los íconos.')) return; m.strokes = []; m.stamps = []; cw.querySelectorAll('.stamp').forEach(x => x.remove()); draw(); touch(v); };
  scr.querySelectorAll('[data-stamp]').forEach(b => b.onclick = () => {
    const t = b.dataset.stamp; let l = STAMP[t][1];
    if (t === 'per') l = 'P' + (m.stamps.filter(s => s.t === 'per').length + 1);
    const s = { t, l, x: .5, y: .5 }; m.stamps.push(s); stampEl(s); touch(v); toast('Arrástralo a su lugar');
  });
}

/* ---------- 13. PIN ---------- */
async function hash(t) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nexo:' + t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 0; for (const ch of 'nexo:' + t) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'x' + h; }
}
function keypad(titulo, sub, onDone, cancelable) {
  const el = document.createElement('div'); el.className = 'lock';
  el.innerHTML = `${MARK}<h3 style="font-family:var(--f-display);margin:0;font-size:20px">${esc(titulo)}</h3><p style="margin:0;color:var(--muted)">${esc(sub)}</p>
    <div class="pdots">${'<i></i>'.repeat(4)}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<span></span><button data-k="0">0</button><button data-k="del" aria-label="Borrar">⌫</button></div>
    ${cancelable ? '<button class="btn b-neu mini" data-k="x">Cancelar</button>' : ''}`;
  let val = '';
  const dots = () => el.querySelectorAll('.pdots i').forEach((d, i) => d.classList.toggle('on', i < val.length));
  el.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'x') { el.remove(); return; }
    if (k === 'del') val = val.slice(0, -1); else if (val.length < 4) val += k;
    dots();
    if (val.length === 4) { const ok = await onDone(val); if (ok) el.remove(); else { el.querySelector('.pdots').classList.add('shake'); setTimeout(() => { val = ''; dots(); el.querySelector('.pdots').classList.remove('shake'); }, 320); } }
  });
  $('#app').appendChild(el);
}
function pedirPin() {
  if (!db.ajustes.pin || document.querySelector('.lock')) return;
  keypad('NEXO Guion', 'Escribe tu PIN', async v => (await hash(v)) === db.ajustes.pin, false);
}
function pinToggle() {
  if (db.ajustes.pin) {
    keypad('Quitar PIN', 'Escribe tu PIN actual', async v => { if ((await hash(v)) !== db.ajustes.pin) return false; db.ajustes.pin = null; save(); render('ajustes', null, true); toast('PIN desactivado'); return true; }, true);
  } else {
    keypad('Nuevo PIN', 'Escribe 4 números', async v1 => {
      setTimeout(() => keypad('Repite el PIN', 'Escríbelo otra vez', async v2 => { if (v1 !== v2) { toast('No coinciden, intenta otra vez'); return false; } db.ajustes.pin = await hash(v2); save(); render('ajustes', null, true); toast('🔒 PIN activado'); return true; }, true), 50);
      return true;
    }, true);
  }
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 60000) pedirPin(); });

/* ---------- 14. Tema ---------- */
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = db.ajustes.tema, dark = t === 'dark' || (t === 'auto' && mq.matches);
  document.documentElement.classList.toggle('dark', dark);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0B1114' : '#F4F7F8';
}
mq.addEventListener ? mq.addEventListener('change', () => { applyTheme(); if (cur.name === 'mapa') render('mapa', cur.arg, true); }) : 0;

/* ---------- 15. Actualizaciones ---------- */
let swReg = null;
async function buscarActualizacion() {
  if (!isNative) {
    if (!navigator.onLine) { toast('Sin internet: lo intento cuando te conectes'); return; }
    if (!swReg) { toast('Tienes la última versión'); return; }
    await swReg.update().catch(() => {});
    setTimeout(() => { if (swReg.waiting) ofrecerRecarga(); else toast('✅ Tienes la última versión'); }, 1500);
    return;
  }
  // Android: no se consulta ningún servidor (la app nunca se conecta a internet)
  sheet(`<h3>Versión ${CONFIG.VERSION}</h3>
    <p>Esta app no se conecta a ningún servidor. Cuando haya una versión nueva, Claude te manda el archivo <b>APK</b> por el chat.</p>
    <p>Instálalo encima de esta: <b>tus guiones no se borran</b>.</p>
    <button class="btn b-add" id="updOk">Entendido</button>`);
  $('#updOk').onclick = closeModal;
}
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
function ofrecerRecarga() {
  sheet(`<h3>Versión nueva lista</h3><p>Toca para actualizar. Tus guiones no se borran.</p><button class="btn b-add" id="reload">🔄 Actualizar ahora</button>`);
  $('#reload').onclick = () => { swReg.waiting && swReg.waiting.postMessage('skipWaiting'); };
}
if (!isNative && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    swReg = reg;
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ofrecerRecarga(); }); });
  }).catch(() => {});
  let recargado = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recargado) { recargado = true; location.reload(); } });
}
addEventListener('online', () => { if (['home', 'ajustes'].includes(cur.name)) render(cur.name, cur.arg, true); });
addEventListener('offline', () => { if (['home', 'ajustes'].includes(cur.name)) render(cur.name, cur.arg, true); });

/* ---------- 16. Eventos: toques ---------- */
document.getElementById('app').addEventListener('click', async ev => {
  const b = ev.target.closest('button');
  if (!b) { if (ev.target.hasAttribute && ev.target.hasAttribute('data-close')) closeModal(); return; }
  if (b.closest('.lock')) return;
  const d = b.dataset, sec = b.closest('[data-s]'), si = sec ? +sec.dataset.s : null, rw = b.closest('[data-r]'), ri = rw ? +rw.dataset.r : null;
  const v = cur.name === 'hoja' || cur.name === 'pdf' ? vid(cur.arg) : null;

  if (d.tab) { S.stack = []; render(d.tab); return; }
  if (b.hasAttribute('data-back')) { back(); return; }
  if (b.id === 'fab') { quickIdea(); return; }
  if (d.open) { openVideo(d.open); return; }
  if (d.go) { go(d.go); return; }
  if (d.conv) { const i = db.ideas.find(x => x.id === d.conv); nuevoVideo({ titulo: i.t, idea: i.id }); return; }
  if (d.idea) { ideaMenu(d.idea); return; }
  if (d.copy) { try { await navigator.clipboard.writeText(d.copy); toast('Número copiado'); } catch (e) { toast(d.copy); } return; }

  switch (d.act) {
    case 'ideaSave': { const t = $('#ideaIn'); if (guardarIdea(t.value)) render('home', null, true); else t.focus(); return; }
    case 'newVideo': nuevoVideo({ cli: d.cli }); return;
    case 'videoMenu': videoMenu(); return;
    case 'sceneMenu': sceneMenu(si); return;
    case 'rowMenu': rowMenu(si, ri); return;
    case 'addScene': addScene(); return;
    case 'pickHook': pickHook(); return;
    case 'map': go(`mapa:${cur.arg},${si}`); return;
    case 'pdfPlan': S.pdf.plan = !S.pdf.plan; render('pdf', cur.arg, true); return;
    case 'sendPdf': case 'sharePdf': sharePdf(); return;
    case 'clienteSave': clienteSave(); return;
    case 'clienteDel': clienteDel(); return;
    case 'logoOff': S.form.logo = ''; refreshForm(); return;
    case 'backupOut': backupOut(); return;
    case 'pinToggle': pinToggle(); return;
    case 'update': buscarActualizacion(); return;
    case 'hookNew': hookNew(); return;
    case 'undo': undo(); return;
    case 'wipe': if (await confirmar('¿Borrar TODOS los datos?', 'Se borran ideas, clientes y guiones. Haz un respaldo antes.', 'Borrar todo')) { snapshot(); db = semilla(); db.videos = []; save(); applyTheme(); S.stack = []; render('home'); toast('Datos borrados', true); } return;
  }
  if (d.add) { addRow(si, d.add); return; }
  if (b.hasAttribute('data-ok')) { const r = v.escenas[si].rows[ri]; r.ok = !r.ok; b.setAttribute('aria-pressed', r.ok); rw.classList.toggle('done', r.ok); touch(v); updSum(); const s = stats(v); if (s.ok === s.pl && s.pl) { if (v.st < 2) { v.st = 2; save(); } toast('✅ Todos los planos grabados: estado “Grabado”'); } return; }
  if (d.rec !== undefined) { S.rec = d.rec === '1'; render('hoja', cur.arg, true); if (S.rec) toast('🎬 Toca ✓ en cada plano que grabes'); return; }
  if (d.st !== undefined) { v.st = +d.st; touch(v); render('hoja', v.id, true); return; }
  if (d.pv) { S.pdf.ver = d.pv; render('pdf', cur.arg, true); return; }
  if (d.flt) { const [k, val] = d.flt.split('|'); S.f[k] = val; b.parentElement.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); filtrar(); return; }
  if (d.hookdel) { snapshot(); db.ganchos = db.ganchos.filter(g => g.id !== d.hookdel); save(); render('ganchos', null, true); toast('Gancho borrado', true); return; }
  if (d.tpldel) { snapshot(); db.plantillas = db.plantillas.filter(g => g.id !== d.tpldel); save(); render('plantillas', null, true); toast('Plantilla borrada', true); return; }
  if (d.ccol) { S.form.c = d.ccol; rebindForm(); return; }

  // chips con significado según su grupo
  if (b.classList.contains('chip')) {
    const g = b.parentElement;
    if (g.hasAttribute('data-tema')) { db.ajustes.tema = { 'Automático': 'auto', 'Claro': 'light', 'Oscuro': 'dark' }[d.val]; save(); applyTheme(); render('ajustes', null, true); return; }
    if (g.hasAttribute('data-cplan')) { S.form.plan = d.val === 'Sin plan' ? '' : d.val.replace(/ \(\d+\)$/, ''); rebindForm(); return; }
    if (g.hasAttribute('data-filmora')) { const e = v.escenas[si]; e.filmora = e.filmora || []; const on = !e.filmora.includes(d.val); e.filmora = on ? [...e.filmora, d.val] : e.filmora.filter(x => x !== d.val); b.setAttribute('aria-pressed', on); touch(v); return; }
    if (g.dataset.vk === 'cli') { v.cli = db.clientes.find(c => c.n === d.val).id; touch(v); render('hoja', v.id, true); return; }
    if (g.dataset.vk === 'obj') { v.obj = d.val; touch(v); render('hoja', v.id, true); return; }
    if (g.dataset.vk === 'redes') { const r = O.redes.find(x => RED_TXT[x] === d.val); const on = !v.redes.includes(r); if (!on && v.redes.length === 1) { toast('Debe quedar al menos una red'); return; } v.redes = on ? [...v.redes, r] : v.redes.filter(x => x !== r); touch(v); render('hoja', v.id, true); return; }
  }
});

/* ---------- 17. Eventos: escribir (se guarda solo) ---------- */
function onEdit(ev) {
  const t = ev.target;
  if (t.id === 'q') { S.f.q = t.value; filtrar(); return; }
  if (t.dataset.cf !== undefined && S.form) { S.form[t.dataset.cf] = t.value; if (t.dataset.cf === 'n') $('#fAv').innerHTML = av(t.value ? S.form : Object.assign({}, S.form, { n: '?' }), 64); return; }
  if (cur.name !== 'hoja') return;
  const v = vid(cur.arg); if (!v) return;
  if (t.tagName === 'TEXTAREA') autosize(t);
  if (t.dataset.v) { v[t.dataset.v] = t.value; if (t.dataset.v === 't') topEl.querySelector('h2').textContent = t.value; touch(v); return; }
  const sec = t.closest('[data-s]'); if (!sec) return; const e = v.escenas[+sec.dataset.s];
  if (t.dataset.e) { e[t.dataset.e] = t.value; touch(v); return; }
  const rw = t.closest('[data-r]');
  if (rw && t.dataset.f) {
    const r = e.rows[+rw.dataset.r]; r[t.dataset.f] = t.dataset.f === 's' ? Math.max(0, +t.value || 0) : t.value;
    if (t.dataset.f === 'd') { const es = rw.querySelector('[data-est]'); if (es) es.textContent = '≈ ' + est(t.value) + ' s'; }
    touch(v); updSum();
  }
}
scr.addEventListener('input', onEdit);
scr.addEventListener('change', ev => {
  if (ev.target.tagName === 'SELECT' || ev.target.type === 'date' || ev.target.type === 'datetime-local') onEdit(ev);
  if (ev.target.id === 'fLogo' && ev.target.files[0]) leerLogo(ev.target.files[0]);
  if (ev.target.id === 'backupIn' && ev.target.files[0]) { backupIn(ev.target.files[0]); ev.target.value = ''; }
});
// Enter en la idea rápida = guardar
scr.addEventListener('keydown', ev => { if (ev.target.id === 'ideaIn' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (guardarIdea(ev.target.value)) render('home', null, true); } });

/* Botón "atrás" de Android */
if (isNative && Plug('App')) Plug('App').addListener('backButton', () => { if (document.querySelector('.lock')) return; if (!back()) Plug('App').exitApp(); });

/* ---------- 17b. Teclado: mantener visible lo que escribes ---------- */
// Cuando sale el teclado la pantalla se encoge; movemos el campo activo al centro.
function mostrarCampo() {
  const el = document.activeElement;
  if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.closest('.lock')) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
let kbT;
addEventListener('resize', () => { clearTimeout(kbT); kbT = setTimeout(mostrarCampo, 120); });
if (window.visualViewport) visualViewport.addEventListener('resize', () => { clearTimeout(kbT); kbT = setTimeout(mostrarCampo, 120); });
document.addEventListener('focusin', () => setTimeout(mostrarCampo, 350));

/* ---------- 18. Arranque ---------- */
applyTheme();
render('home');
pedirPin();
window.__nexo = { db: () => db }; // solo para pruebas
})();
