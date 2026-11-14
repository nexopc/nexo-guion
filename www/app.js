/* =========================================================
   NEXO Guion 1.1 · lógica de la app
   - De un reel a una película: proyectos con un camino de pasos.
   - Lógica fija para rellenar: Escena (dónde, cuándo, quiénes) →
     Plano paso a paso (qué se ve, quién sale, por persona: parte,
     emoción, qué hace, qué dice → cámara → duración) → tarjeta.
   - Todo se guarda en el celular (localStorage). Sin internet.
   ========================================================= */
(function () {
'use strict';

/* ---------- 1. Configuración ---------- */
const CONFIG = { VERSION: '1.1.0' };
const KEY = 'nexo-guion-db';
const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const Plug = n => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n];

/* ---------- 2. Listas predefinidas (la "lógica fija") ---------- */
const TIPOS = { // tipos de proyecto y sus pasos
  video:    { e: '📱', n: 'Video de cliente', pasos: ['idea', 'guion', 'rodaje'] },
  corto:    { e: '🎬', n: 'Cortometraje',     pasos: ['idea', 'historia', 'guion', 'preparar', 'rodaje'] },
  pelicula: { e: '🎞️', n: 'Película',         pasos: ['idea', 'historia', 'guion', 'preparar', 'rodaje'] },
  serie:    { e: '📺', n: 'Serie',            pasos: ['idea', 'historia', 'guion', 'preparar', 'rodaje'] }
};
const PASOS = {
  idea:     ['Idea', 'Logline, género y tema'],
  ideaV:    ['Idea', 'Cliente, red, objetivo y gancho (G-P-S-C)'],
  historia: ['Historia', '3 actos guiados'],
  guion:    ['Guion', 'Escenas y planos paso a paso'],
  preparar: ['Preparar', 'Personajes y reparto'],
  rodaje:   ['Rodaje', 'Modo Grabar, fechas y PDF']
};
const PLANOS = [['General', 'Todo el lugar', 'gen'], ['Entero', 'Cuerpo completo', 'ent'], ['Medio', 'De la cintura arriba', 'med'], ['Primer plano', 'Cara y hombros', 'pp'], ['Detalle', 'Un objeto o parte', 'det']];
const PARTE_POR_PLANO = { General: 'Cuerpo entero', Entero: 'Cuerpo entero', Medio: 'Medio cuerpo', 'Primer plano': 'Cara', Detalle: 'Manos' };
const PARTES = [['🧍', 'Cuerpo entero'], ['👕', 'Medio cuerpo'], ['🙂', 'Cara'], ['✋', 'Manos'], ['🔙', 'De espaldas'], ['🔈', 'Solo voz']];
const EMOC = [['😐', 'Serio'], ['😀', 'Feliz'], ['😢', 'Triste'], ['😠', 'Enojado'], ['😨', 'Asustado'], ['😲', 'Sorprendido'], ['🤔', 'Pensativo'], ['😴', 'Cansado'], ['😍', 'Enamorado']];
const ALT = [['👁', 'A los ojos'], ['⬆', 'Desde arriba'], ['⬇', 'Desde abajo'], ['🔝', 'Cenital']];
const MOV = [['📌', 'Fija', 'No se mueve'], ['↔', 'Paneo', 'Gira a un lado'], ['🚶', 'Travelling', 'Se desplaza'], ['🔍', 'Zoom', 'Se acerca'], ['🤳', 'En mano', 'Movida, natural']];
const LUGAR = [['🏠', 'Interior'], ['🌳', 'Exterior']];
const MOMENTO = [['🌅', 'Mañana'], ['☀️', 'Tarde'], ['🌙', 'Noche']];
const AMBIENTE = ['Tranquilo', 'Tenso', 'Divertido', 'Emocional', 'Épico'];
const LUZ = ['Natural', 'Lámpara', 'Ring light', 'Mixta'];
const FILMORA = ['Transición zoom', 'Texto pop-up', 'Subtítulos auto', 'Glitch', 'Barrido', 'Desenfoque de fondo', 'Cámara lenta', 'Efecto de sonido'];
const GENEROS = ['Drama', 'Comedia', 'Terror', 'Acción', 'Ciencia ficción', 'Romance', 'Suspenso', 'Documental'];
const OBJ = ['Vender', 'Enseñar', 'Entretener', 'Confianza'];
const REDES = ['9:16', '16:9'];
const RED_TXT = { '9:16': '9:16 TikTok/Reels', '16:9': '16:9 YouTube' };
const ESTADOS = ['idea', 'guion', 'grabado', 'editado', 'publicado'];
const ST = { idea: 'Idea', guion: 'Guion', grabado: 'Grabado', editado: 'Editado', publicado: 'Publicado' };
const ACTOS = [
  { n: 'Acto 1', r: 'Planteamiento · 25 %', beats: ['detonante', 'noretorno'] },
  { n: 'Acto 2', r: 'Confrontación · 50 %', beats: ['medio', 'crisis'] },
  { n: 'Acto 3', r: 'Resolución · 25 %', beats: ['climax', 'final'] }
];
const BEATS = {
  detonante: ['Detonante', 'El momento que rompe la vida normal del protagonista y lo obliga a actuar. Pasa cerca del 10 % de la historia.', 'Andrés enciende un PC viejo y aparece un mensaje con su nombre y la fecha de mañana.'],
  noretorno: ['Punto de no retorno', 'El protagonista decide entrar a la aventura y ya no puede volver atrás. Cierra el Acto 1.', 'Andrés usa el mensaje para evitar un accidente: ahora sabe que es real.'],
  medio: ['Punto medio', 'Algo cambia el juego a mitad de la historia: una verdad, una victoria falsa o una pérdida.', 'Descubre que cada mensaje que usa le borra un recuerdo a su abuela.'],
  crisis: ['Crisis', 'El peor momento. Parece que todo está perdido. Cierra el Acto 2.', 'La abuela ya no lo reconoce y el barrio está a punto de inundarse.'],
  climax: ['Clímax', 'La gran decisión o enfrentamiento final. El protagonista usa lo que aprendió.', 'Andrés usa el último mensaje para salvar el barrio, sabiendo lo que le cuesta.'],
  final: ['Final', 'Cómo quedó el mundo y cómo cambió el protagonista.', 'Andrés le cuenta a su abuela, desde cero, quién es él.']
};
const COLORES = ['#03BDDE', '#F0101C', '#7C3AED', '#E07A1F', '#14975A', '#2563EB', '#DB2777', '#10202A'];

/* ---------- 3. Utilidades ---------- */
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
const iniciales = n => (n || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 3).toUpperCase();
const clone = o => JSON.parse(JSON.stringify(o));
const hace = t => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); return d === 1 ? 'ayer' : `hace ${d} días`;
};
const fecha = iso => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + (iso.length > 10 ? ' · ' + d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''); };
const emoji = em => (EMOC.find(e => e[1] === em) || ['😐'])[0];
const slug = s => (s || 'guion').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'guion';

/* ---------- 4. Base de datos local ---------- */
const escenaNueva = o => Object.assign({ id: uid(), det: '', lugar: 'Interior', mom: 'Tarde', ambiente: 'Tranquilo', luz: 'Natural', reparto: [], beat: '', planos: [], mapa: null, filmora: [], notas: '' }, o || {});
const planoNuevo = o => Object.assign({ id: uid(), tipo: 'General', quien: [], alt: 'A los ojos', mov: 'Fija', pos: '', s: 3, ok: false, dibujo: null }, o || {});
const proyectoNuevo = (tipo, o) => Object.assign({
  id: uid(), tipo, nombre: '', creado: Date.now(), act: Date.now(), ejemplo: false,
  // video de cliente
  cli: '', redes: ['9:16'], obj: 'Vender', st: 1, fg: '', fe: '', g: '', p: '', s: '', c: '',
  // historias
  logline: '', generos: [], tema: '', min: '',
  pers: [], beats: {}, escenas: [], caps: tipo === 'serie' ? [{ id: uid(), nombre: 'Capítulo 1', beats: {}, escenas: [] }] : []
}, o || {});

function semilla() {
  const now = Date.now();
  const pA = { id: uid(), n: 'Andrés', actor: 'Cristóbal', desc: '17 años, técnico' };
  const pR = { id: uid(), n: 'Doña Rosa', actor: '', desc: '70 años, abuela' };
  const ej = proyectoNuevo('pelicula', {
    ejemplo: true, nombre: 'Ejemplo: La Señal', min: '95',
    logline: 'Un joven técnico de Quibdó quiere salvar su barrio con los mensajes de un PC del futuro, pero cada mensaje le borra un recuerdo a su abuela.',
    generos: ['Drama', 'Ciencia ficción'], tema: 'El precio de cambiar el destino',
    pers: [pA, pR],
    beats: { detonante: 'Andrés enciende un PC viejo y recibe un mensaje del futuro.' }
  });
  ej.escenas = [escenaNueva({
    det: 'Tienda de computadores', lugar: 'Interior', mom: 'Noche', luz: 'Lámpara', reparto: [pA.id, pR.id], beat: 'detonante',
    planos: [
      planoNuevo({ tipo: 'General', quien: [{ p: pA.id, parte: 'Cuerpo entero', em: 'Pensativo', hace: 'Suelda una tarjeta en el mostrador', dice: '' }, { p: pR.id, parte: 'De espaldas', em: 'Cansado', hace: 'Entra por la puerta', dice: '' }], s: 5 }),
      planoNuevo({ tipo: 'Primer plano', quien: [{ p: pR.id, parte: 'Cara', em: 'Serio', hace: 'Se recuesta en la puerta', dice: 'Mijo, cierre que ya es tarde.' }], s: 3 }),
      planoNuevo({ tipo: 'Medio', quien: [{ p: pA.id, parte: 'Medio cuerpo', em: 'Feliz', hace: 'Sigue soldando sin mirarla', dice: 'Ya voy, abuela. Solo pruebo este último.' }], alt: 'Desde abajo', mov: 'Zoom', s: 4 })
    ]
  })];
  return {
    v: 2, ideas: [], ganchosPropios: [],
    planes: [{ n: 'Básico', v: 4 }, { n: 'Estándar', v: 8 }, { n: 'Pro', v: 12 }],
    clientes: [{ id: 'nexo', n: 'NEXO PC', c: '#03BDDE', logo: 'icons/icon-192.png', plan: 'Pro', nota: 'Hardware y gaming', wa: '', ig: '', tt: '', fb: '', yt: '' }],
    proyectos: [ej],
    ajustes: { tema: 'auto', pin: null, respaldo: null, inicio: now, ultimo: null }
  };
}

/* Convierte los datos de la versión 1.0 (videos con filas) al formato nuevo */
function migrarV1(old) {
  const n = semilla();
  n.proyectos = [];
  n.ideas = (old.ideas || []).map(i => ({ id: i.id, t: i.t, creado: i.creado, proy: null }));
  n.clientes = old.clientes && old.clientes.length ? old.clientes : n.clientes;
  n.planes = old.planes || n.planes;
  n.ajustes = Object.assign(n.ajustes, old.ajustes || {}, { ultimo: null });
  const ANG = { Normal: 'A los ojos', Picado: 'Desde arriba', Contrapicado: 'Desde abajo', Cenital: 'Cenital' };
  (old.videos || []).forEach(v => {
    const p = proyectoNuevo('video', { id: v.id, nombre: v.t, cli: v.cli, redes: v.redes || ['9:16'], obj: v.obj || 'Vender', st: v.st || 1, fg: v.fg || '', fe: v.fe || '', g: v.g || '', p: v.p || '', s: v.s || '', c: v.c || '', creado: v.creado || Date.now(), act: v.act || Date.now(), ejemplo: !!v.ejemplo });
    const persPor = {}; // P1/P2… → personaje
    const persona = (tag, rol) => {
      const k = (rol || tag || 'P1').trim();
      if (!persPor[k]) { persPor[k] = { id: uid(), n: k, actor: '', desc: '' }; p.pers.push(persPor[k]); }
      return persPor[k].id;
    };
    (v.escenas || []).forEach(e => {
      const ne = escenaNueva({ id: e.id, det: e.nombre || e.detalle || '', lugar: e.lugar, mom: e.momento, ambiente: e.ambiente, luz: e.luz, mapa: e.mapa, filmora: e.filmora || [], notas: [e.objetos, e.sonido, e.musica, e.texto].filter(Boolean).join(' · ') });
      let cur = null, alt = 'A los ojos', pos = '';
      (e.rows || []).forEach(r => {
        if (r.k === 'cam') { alt = ANG[r.alt] || (r.alt === 'Alta' ? 'Desde arriba' : r.alt === 'Baja' || r.alt === 'Al piso' ? 'Desde abajo' : 'A los ojos'); pos = r.pos || ''; }
        else if (r.k === 'pla') { cur = planoNuevo({ tipo: r.tipo || 'Medio', alt: ANG[r.ang] || alt, mov: r.mov || 'Fija', s: +r.s || 3, ok: !!r.ok, pos }); ne.planos.push(cur); }
        else if (r.k === 'per') {
          if (!cur) { cur = planoNuevo({ tipo: 'Medio', alt, pos }); ne.planos.push(cur); }
          const pid = persona(r.p, r.rol);
          if (!ne.reparto.includes(pid)) ne.reparto.push(pid);
          cur.quien.push({ p: pid, parte: 'Medio cuerpo', em: 'Serio', hace: r.hace || '', dice: r.d || '' });
        }
      });
      p.escenas.push(ne);
    });
    n.proyectos.push(p);
  });
  return n;
}

let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
if (db && db.v === 1) { try { localStorage.setItem(KEY + '-v1-copia', JSON.stringify(db)); } catch (e) {} db = migrarV1(db); }
if (!db || db.v !== 2) db = semilla();
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('⚠ No se pudo guardar: el celular no tiene espacio'); } }, 250);
}
save();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

let undoCopy = null;
const snapshot = () => { undoCopy = JSON.stringify(db); };
function undo() { if (!undoCopy) return; db = JSON.parse(undoCopy); undoCopy = null; save(); render(cur.name, cur.arg, true); toast('Listo, se deshizo'); }

/* Ayudantes de datos */
const proy = id => db.proyectos.find(p => p.id === id);
const cli = id => db.clientes.find(c => c.id === id) || { id: '', n: 'Sin cliente', c: '#8FA3AB' };
const per = (p, id) => p.pers.find(x => x.id === id) || { id, n: '¿?' };
const planCupo = n => (db.planes.find(p => p.n === n) || {}).v || 0;
const delMes = c => { const d = new Date(); const ini = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); return db.proyectos.filter(p => p.tipo === 'video' && p.cli === c.id && p.creado >= ini && !p.ejemplo).length; };
const touch = p => { p.act = Date.now(); save(); };
/* En una serie, cada capítulo tiene sus escenas e historia. "cont" devuelve dónde están. */
function cont(p) {
  if (p.tipo !== 'serie') return p;
  if (!p.caps.length) p.caps.push({ id: uid(), nombre: 'Capítulo 1', beats: {}, escenas: [] });
  S.cap = Math.min(S.cap, p.caps.length - 1);
  return p.caps[S.cap];
}
function stats(c) {
  let pl = 0, s = 0, ok = 0, dl = 0; const ps = new Set();
  c.escenas.forEach(e => e.planos.forEach(x => { pl++; s += +x.s || 0; if (x.ok) ok++; x.quien.forEach(q => { ps.add(q.p); dl += words(q.dice); }); }));
  return { esc: c.escenas.length, per: ps.size, pl, s, ok, dl };
}
function avance(p, paso) {
  const c = cont(p), st = stats(c);
  if (paso === 'idea') return p.tipo === 'video' ? [p.g, p.p, p.s, p.c].filter(Boolean).length * 25 : (p.logline ? 60 : 0) + (p.generos.length ? 20 : 0) + (p.tema ? 20 : 0);
  if (paso === 'historia') return Math.round(Object.values(c.beats || {}).filter(Boolean).length / 6 * 100);
  if (paso === 'guion') return c.escenas.length ? Math.round(c.escenas.filter(e => e.planos.length).length / c.escenas.length * 100) : 0;
  if (paso === 'preparar') return p.pers.length ? Math.round(p.pers.filter(x => x.actor).length / p.pers.length * 100) : 0;
  if (paso === 'rodaje') return st.pl ? Math.round(st.ok / st.pl * 100) : 0;
  return 0;
}
function avanceTotal(p) { const ps = TIPOS[p.tipo].pasos; return Math.round(ps.reduce((a, x) => a + avance(p, x), 0) / ps.length); }

/* ---------- 5. Íconos y piezas visuales ---------- */
const sv = (d, w = 20, sw = 2.2) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  back: sv('<path d="M15 18l-6-6 6-6"/>'),
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--muted);flex:none" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  plus: sv('<path d="M12 5v14M5 12h14"/>', 18, 2.6),
  bulb: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', 22),
  arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 22, 2.6),
  dots: sv('<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>', 20, 2.4),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', 20),
  check: sv('<path d="M5 12l5 5 9-10"/>', 22, 3),
  copy: sv('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 20),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 18),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 18, 2),
  wa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>'
};
const MARK = '<svg width="38" height="34" viewBox="0 0 48 42" aria-hidden="true"><rect x="3" y="3" width="42" height="27" rx="6" fill="none" stroke="var(--a)" stroke-width="3.6"/><rect x="21" y="30" width="6" height="5" fill="var(--a)"/><rect x="13" y="34.5" width="22" height="4" rx="2" fill="var(--a)"/><g transform="rotate(-32 24 16.5)" fill="none" stroke="var(--a2)" stroke-width="3.4" stroke-linecap="round"><path d="M22 12.2h-4.3a4.3 4.3 0 0 0 0 8.6H20"/><path d="M26 20.8h4.3a4.3 4.3 0 0 0 0-8.6H28"/><path d="M20.5 16.5h7"/></g></svg>';
function ill(k) { // dibujos de los tipos de plano
  const p = { gen: '<rect x="8" y="22" width="22" height="20" fill="none" stroke="currentColor" stroke-width="2"/><rect x="38" y="16" width="24" height="26" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="76" cy="26" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M76 30v10M71 34h10M73 46l3-6 3 6" stroke="currentColor" stroke-width="2" fill="none"/>', ent: '<circle cx="50" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50 18v20M40 26h20M44 52l6-14 6 14" stroke="currentColor" stroke-width="2" fill="none"/>', med: '<circle cx="50" cy="18" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 56c2-18 38-18 40 0" fill="none" stroke="currentColor" stroke-width="2"/>', pp: '<circle cx="50" cy="26" r="16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="44" cy="23" r="1.6" fill="currentColor"/><circle cx="56" cy="23" r="1.6" fill="currentColor"/><path d="M44 32q6 4 12 0" fill="none" stroke="currentColor" stroke-width="2"/>', det: '<rect x="30" y="12" width="40" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M36 22h22M36 30h14" stroke="currentColor" stroke-width="2"/>' }[k] || '';
  return `<svg viewBox="0 0 100 56" aria-hidden="true">${p}</svg>`;
}
const illPlano = tipo => ill((PLANOS.find(x => x[0] === tipo) || PLANOS[0])[2]);
const av = (c, sz) => {
  const st = `background-color:${c.c};${c.logo ? `background-image:url('${c.logo}');background-color:#fff;` : ''}${sz ? `width:${sz}px;height:${sz}px;font-size:${Math.round(sz / 3.2)}px;border-radius:${Math.round(sz / 3.5)}px;` : ''}`;
  return `<span class="avatar" style="${st}">${c.logo ? '' : esc(iniciales(c.n))}</span>`;
};
const chips = (list, sel, attr, sm) => `<div class="chips" ${attr || ''}>${list.map(x => `<button class="chip${sm ? ' sm' : ''}" data-val="${esc(x)}" aria-pressed="${Array.isArray(sel) ? sel.includes(x) : sel === x}">${esc(x)}</button>`).join('')}</div>`;
const pill = i => `<span class="pill st-${ESTADOS[i]}"><span class="dot"></span>${ST[ESTADOS[i]]}</span>`;
const help = (key, txt) => `<button class="help" data-help="${key}">❓ <b>¿Qué va aquí?</b> ${txt}</button>`;

/* ---------- 6. Estado de navegación ---------- */
const S = { stack: [], cap: 0, esc: 0, f: { q: '', tipo: 'todos' }, pdf: { ver: 'cliente', plan: false }, form: null, formLive: false, hookCat: 'Vender', hookQ: '' };
const cur = { name: 'home', arg: null };
const scr = $('#screen'), topEl = $('#top'), preEl = $('#pre'), tabs = $('#tabs'), foot = $('#foot'), fab = $('#fab'), modalEl = $('#modal'), wizEl = $('#wiz');

/* ---------- 7. Pantallas ---------- */
const V = {};

function prow(p) {
  const t = TIPOS[p.tipo], c = cont(p), st = stats(c), a = avanceTotal(p);
  const sub = p.tipo === 'video' ? `${esc(cli(p.cli).n)} · ${p.redes.join(' + ')}` : p.tipo === 'serie' ? `${p.caps.length} capítulo${p.caps.length === 1 ? '' : 's'}` : `${st.esc} escenas · ${st.pl} planos`;
  return `<button class="row" data-open="${p.id}"><span class="ico">${t.e}</span><div class="grow"><span class="ptype">${t.n}</span><div class="t">${esc(p.nombre) || 'Sin nombre'}</div><div class="s">${sub} · ${hace(p.act)}</div><div class="planbar"><i style="width:${a}%"></i></div></div>${I.chev}</button>`;
}
function respaldoViejo() { return (Date.now() - (db.ajustes.respaldo || db.ajustes.inicio)) / 86400000 >= 7; }

V.home = () => {
  const ideas = db.ideas.filter(i => !i.proy);
  const f = S.f, q = f.q.trim().toLowerCase();
  const list = db.proyectos.filter(p => (f.tipo === 'todos' || p.tipo === f.tipo) && (!q || (p.nombre || '').toLowerCase().includes(q))).sort((a, b) => b.act - a.act);
  return {
    tab: 'home', fab: 1,
    top: `<div class="brandrow">${MARK}<div class="name">NEXO <i>Guion</i></div></div><button class="iconbtn" data-go="ajustes" aria-label="Ajustes">${I.gear}</button>`,
    body: `
    <div class="idea"><label for="ideaIn">${I.bulb} Nueva idea</label>
      <div class="in"><textarea id="ideaIn" placeholder="Escribe y toca la flecha…" enterkeyhint="done"></textarea><button class="go" data-act="ideaSave" aria-label="Guardar idea">${I.arrow}</button></div></div>
    <button class="btn b-add" data-act="nuevoProy">${I.plus} Nuevo proyecto</button>
    ${respaldoViejo() ? `<button class="warnbox" data-go="ajustes" style="text-align:left;width:100%"><b>⚠ Haz tu respaldo semanal</b><br>Toca aquí para guardar una copia de tus guiones.</button>` : ''}
    ${ideas.length ? `<div class="sec-t">Ideas (${ideas.length})</div><div class="list">${ideas.map(i => `<div class="row ideaRow"><button class="grow" data-idea="${i.id}" style="border:0;background:none;text-align:left;padding:0"><div style="font-weight:500">${esc(i.t)}</div><div class="s">${hace(i.creado)}</div></button><button class="btn b-add mini" data-conv="${i.id}">→ Proyecto</button></div>`).join('')}</div>` : ''}
    <div class="sec-t">Proyectos</div>
    <input class="free" id="q" value="${esc(f.q)}" placeholder="Buscar proyecto…" enterkeyhint="search">
    <div class="chips">${[['todos', 'Todos'], ['video', '📱 Videos'], ['corto', '🎬 Cortos'], ['pelicula', '🎞️ Películas'], ['serie', '📺 Series']].map(([k, l]) => `<button class="chip sm" data-ftipo="${k}" aria-pressed="${f.tipo === k}">${l}</button>`).join('')}</div>
    <div class="list" id="plist">${list.map(prow).join('') || '<p class="empty">No hay proyectos aquí. Toca “Nuevo proyecto”.</p>'}</div>`
  };
};

V.proyecto = id => {
  const p = proy(id); if (!p) return V.home();
  const t = TIPOS[p.tipo];
  const caps = p.tipo === 'serie' ? `<div class="sec-t">Capítulo</div><div class="chips">${p.caps.map((c, i) => `<button class="chip" data-cap="${i}" aria-pressed="${i === S.cap}">${esc(c.nombre)}</button>`).join('')}<button class="chip sm" data-act="capNuevo" style="border-style:dashed;color:var(--a-ink)">＋ Capítulo</button></div>` : '';
  const pasos = t.pasos.map((k, i) => {
    const a = avance(p, k), info = PASOS[k === 'idea' && p.tipo === 'video' ? 'ideaV' : k];
    const cls = a >= 100 ? 'done' : (a > 0 || i === 0 ? 'now' : '');
    return `<button class="step ${cls}" data-go="${k}:${p.id}"><span class="n">${a >= 100 ? '✓' : i + 1}</span><div><div class="t">${info[0]}</div><div class="s">${info[1]}</div>${a > 0 && a < 100 ? `<div class="prog"><i style="width:${a}%"></i></div>` : ''}</div>${I.chev}</button>`;
  }).join('');
  return {
    back: 1,
    top: `<h2>${esc(p.nombre) || 'Sin nombre'}<small>${t.e} ${t.n}${p.min ? ' · ' + esc(p.min) + ' min' : ''}</small></h2><button class="iconbtn" data-act="proyMenu" aria-label="Opciones">${I.dots}</button>`,
    body: `${caps}<p class="note" style="text-align:left">Recorre los pasos en orden. Puedes volver a cualquiera: nada se bloquea.</p><div class="path">${pasos}</div>
    <button class="btn b-pdf" data-go="pdf:${p.id}">📄 PDF del proyecto</button>`
  };
};

V.idea = id => {
  const p = proy(id);
  if (p.tipo === 'video') {
    const c = cli(p.cli);
    return {
      back: 1, top: `<h2>1 · Idea<small>${esc(p.nombre)}</small></h2><span class="saved">✓ Guardado</span>`,
      body: `
      <div class="fld"><label for="pN">Título del video</label><input class="free" id="pN" data-pv="nombre" value="${esc(p.nombre)}"></div>
      <div class="fld"><span class="lbl">Cliente</span>${chips(db.clientes.map(x => x.n), c.n, 'data-vk="cli"', 1)}</div>
      <div class="fld"><span class="lbl">Red</span>${chips(REDES.map(r => RED_TXT[r]), p.redes.map(r => RED_TXT[r]), 'data-vk="redes"', 1)}</div>
      <div class="fld"><span class="lbl">Objetivo</span>${chips(OBJ, p.obj, 'data-vk="obj"', 1)}</div>
      <div class="sec-t">Estructura G-P-S-C</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px">
        ${[['g', 'G', 'Gancho: lo primero que se dice'], ['p', 'P', 'Problema'], ['s', 'S', 'Solución'], ['c', 'C', 'Llamado a la acción']].map(([k, l, ph]) => `<div class="gp"><b>${l}</b><textarea class="inl" data-pv="${k}" rows="1" placeholder="${ph}">${esc(p[k])}</textarea></div>`).join('')}
        <button class="btn b-neu mini" data-act="pickHook" style="align-self:flex-start">🪝 Elegir del banco de ganchos</button>
      </div>`,
      after: autosizeAll
    };
  }
  return {
    back: 1, top: `<h2>1 · Idea<small>${esc(p.nombre)}</small></h2><span class="saved">✓ Guardado</span>`,
    body: `
    <div class="fld"><label for="pN">Nombre del proyecto</label><input class="free" id="pN" data-pv="nombre" value="${esc(p.nombre)}"></div>
    <div class="fld"><label for="pL">Logline (tu historia en una frase)</label><textarea class="free" id="pL" data-pv="logline" rows="2" placeholder="[Protagonista] quiere [objetivo], pero [obstáculo].">${esc(p.logline)}</textarea></div>
    ${help('logline', 'Quién + qué quiere + qué se lo impide.')}
    <div class="fld"><span class="lbl">Género</span>${chips(GENEROS, p.generos, 'data-vk="generos"', 1)}</div>
    <div class="fld"><label for="pT">Tema (lo que la historia quiere decir)</label><input class="free" id="pT" data-pv="tema" value="${esc(p.tema)}" placeholder="Ej.: el precio de cambiar el destino"></div>
    <div class="fld"><label for="pM">Duración aproximada (minutos)</label><input class="free" id="pM" data-pv="min" inputmode="numeric" value="${esc(p.min)}" placeholder="${p.tipo === 'corto' ? 'Ej.: 12' : p.tipo === 'serie' ? 'Por capítulo, ej.: 25' : 'Ej.: 95'}"></div>
    <div class="fld"><span class="lbl">Gancho de apertura</span><button class="btn b-neu mini" data-act="pickHookF" style="align-self:flex-start">🪝 Ver ganchos de ficción</button></div>`,
    after: autosizeAll
  };
};

V.historia = id => {
  const p = proy(id), c = cont(p); c.beats = c.beats || {};
  return {
    back: 1, top: `<h2>2 · Historia<small>${esc(p.nombre)}${p.tipo === 'serie' ? ' · ' + esc(c.nombre) : ''}</small></h2><span class="saved">✓ Guardado</span>`,
    body: `<p class="note" style="text-align:left">Escribe <b>una línea</b> por momento. Después asígnale las escenas que lo cuentan.</p>
    ${ACTOS.map(a => `<div class="act"><div class="act-h"><b>${a.n}</b><span>${a.r}</span></div>${a.beats.map(b => {
      const es = c.escenas.map((e, i) => [e, i]).filter(([e]) => e.beat === b);
      return `<div class="beat"><div class="bt">${BEATS[b][0]}<button data-help="${b}">❓ ¿Qué va aquí?</button></div>
        <textarea class="inl" data-beat="${b}" rows="1" placeholder="Una línea: ¿qué pasa aquí?">${esc(c.beats[b])}</textarea>
        ${es.map(([e, i]) => `<div class="scard"><i>ESC ${i + 1}</i>${esc(e.det) || 'Escena ' + (i + 1)}</div>`).join('')}
        <button class="linkbtn" data-asig="${b}">＋ Asignar escena</button></div>`;
    }).join('')}</div>`).join('')}`,
    after: autosizeAll
  };
};

V.guion = id => {
  const p = proy(id), c = cont(p);
  S.esc = Math.min(S.esc, Math.max(0, c.escenas.length - 1));
  const e = c.escenas[S.esc];
  const tabsS = `<div class="tabsS">${c.escenas.map((x, i) => `<button data-esc="${i}" aria-current="${i === S.esc}">ESC ${i + 1}</button>`).join('')}<button data-act="escNueva" class="addS" aria-label="Nueva escena">＋</button></div>`;
  let body;
  if (!e) body = `<p class="empty">Aún no hay escenas.<br>Toca <b>＋</b> arriba y responde 3 preguntas:<br>¿dónde?, ¿cuándo? y ¿quiénes están?</p><button class="btn b-add" data-act="escNueva">${I.plus} Crear la primera escena</button>`;
  else {
    const st = stats({ escenas: [e] });
    body = `<div class="shead"><div class="w"><b>${esc(e.det) || 'Escena ' + (S.esc + 1)}</b><span class="tag">${e.lugar}</span><span class="tag">${e.mom}</span><button class="iconbtn sm" data-act="escMenu" aria-label="Opciones de la escena">${I.dots}</button></div>
      <div class="cast"><span class="lbl">Reparto</span>${e.reparto.map(pid => `<span class="pp"><i>${esc(per(p, pid).n[0] || '?')}</i>${esc(per(p, pid).n)}</span>`).join('') || '<span class="note">Nadie todavía</span>'}</div>
      <div class="cast"><button class="sbtn" data-act="escDet">⚙ ${e.ambiente} · ${e.luz}</button><button class="sbtn map" data-act="map">🗺 Mapa</button><span class="note" style="margin-left:auto">${st.pl} planos · ${st.s} s</span></div></div>
      ${e.planos.map((x, i) => cardPlano(p, x, i)).join('') || '<p class="empty">Esta escena aún no tiene planos.<br>Toca <b>＋ Nuevo plano</b> y responde las preguntas.</p>'}`;
  }
  return {
    back: 1, foot: e ? 'guion' : '', pre: tabsS,
    top: `<h2>${TIPOS[p.tipo].pasos.indexOf('guion') + 1} · Guion<small>${esc(p.nombre)}${p.tipo === 'serie' ? ' · ' + esc(c.nombre) : ''}</small></h2><span class="saved">✓ Guardado</span>`,
    body
  };
};
function cardPlano(p, x, i) {
  return `<button class="pc" data-plano="${i}"><div class="pc-h"><span class="fr">${x.dibujo && x.dibujo.length ? `<img src="${dibujoURL(x.dibujo, 160, 90)}" alt="">` : illPlano(x.tipo)}</span><div><div class="n">Plano ${i + 1}</div><div class="k">${x.tipo}</div></div><span class="d">${x.s} s</span></div>
    ${x.quien.length ? x.quien.map(q => `<div class="who"><span class="em">${emoji(q.em)}</span><span class="l1">${esc(per(p, q.p).n)} <span>· ${q.parte} · ${q.em}</span></span><span class="l2">${q.hace ? esc(q.hace) : ''}${q.hace && q.dice ? '<br>' : ''}${q.dice ? `<q>${esc(q.dice)}</q>` : ''}${!q.hace && !q.dice ? '<span style="color:var(--muted)">—</span>' : ''}</span></div>`).join('') : '<div class="who"><span class="em">🏞</span><span class="l2" style="color:var(--muted)">Nadie en cuadro: solo el lugar u objeto</span></div>'}
    <div class="camline">📷 ${x.alt} · ${x.mov}${x.pos ? ' · ' + esc(x.pos) : ''}</div></button>`;
}

V.preparar = id => {
  const p = proy(id);
  const usos = pid => { let n = 0; p.escenas.concat(...p.caps.map(c => c.escenas)).forEach(e => { if (e.reparto.includes(pid)) n++; }); return n; };
  return {
    back: 1, top: `<h2>4 · Preparar<small>${esc(p.nombre)}</small></h2><span class="saved">✓ Guardado</span>`,
    body: `<div class="sec-t">Personajes y reparto</div>
    ${p.pers.map(x => `<div class="card perso"><div class="ph"><span class="ppi">${esc(x.n[0] || '?')}</span><input class="inl big" data-pers="${x.id}" data-pf="n" value="${esc(x.n)}" aria-label="Nombre"><span class="note">${usos(x.id)} esc.</span><button class="iconbtn sm" data-perdel="${x.id}" aria-label="Borrar personaje">${I.dots}</button></div>
      <input class="inl" data-pers="${x.id}" data-pf="actor" value="${esc(x.actor)}" placeholder="¿Quién lo actúa?">
      <input class="inl" data-pers="${x.id}" data-pf="desc" value="${esc(x.desc)}" placeholder="Edad, ropa, cómo es…"></div>`).join('') || '<p class="empty">Aún no hay personajes. Se crean solos al armar el reparto de una escena.</p>'}
    <button class="btn b-neu" data-act="perNuevo">${I.plus} Nuevo personaje</button>
    <div class="card soon">📍 <b>Locaciones</b>, 👕 <b>utilería y vestuario</b> y 💰 <b>presupuesto</b> llegan en la versión 1.2.</div>`
  };
};

V.rodaje = id => {
  const p = proy(id), c = cont(p), st = stats(c);
  const video = p.tipo === 'video';
  return {
    back: 1, top: `<h2>${TIPOS[p.tipo].pasos.indexOf('rodaje') + 1} · Rodaje<small>${esc(p.nombre)}</small></h2><span class="saved">✓ Guardado</span>`,
    body: `
    ${video ? `<div class="sec-t">Estado</div><div class="stepper">${ESTADOS.map((e, i) => `<button data-st="${i}" class="${i <= p.st ? 'done' : ''} ${i === p.st ? 'cur' : ''}"><i></i>${ST[e]}</button>`).join('')}</div>` : ''}
    <div class="dates"><label>📅 Grabación<input type="datetime-local" data-pv="fg" value="${esc(p.fg)}"></label><label>📦 Entrega<input type="date" data-pv="fe" value="${esc(p.fe)}"></label></div>
    <button class="btn b-neu" data-act="ics">📅 Agregar fechas a mi calendario</button>
    <div class="sec-t">Modo Grabar · ${st.ok}/${st.pl} planos</div>
    <div class="planbar" style="height:8px"><i style="width:${st.pl ? st.ok / st.pl * 100 : 0}%;background:var(--ok)"></i></div>
    ${c.escenas.map((e, ei) => `<div class="card recesc"><div class="rh"><span class="num">ESC ${ei + 1}</span><b>${esc(e.det) || 'Escena ' + (ei + 1)}</b><span class="note">${e.lugar} · ${e.mom}</span></div>
      ${e.planos.map((x, pi) => `<div class="recrow ${x.ok ? 'done' : ''}"><button class="chk2" data-ok="${ei}|${pi}" aria-pressed="${x.ok}" aria-label="Plano grabado">${I.check}</button><div class="grow"><b>Plano ${pi + 1} · ${x.tipo}</b> <span class="note">${x.s} s · ${x.alt} · ${x.mov}</span>${x.quien.map(q => `<div class="rq">${emoji(q.em)} <b>${esc(per(p, q.p).n)}</b>${q.dice ? ': “' + esc(q.dice) + '”' : q.hace ? ': ' + esc(q.hace) : ''}</div>`).join('')}</div></div>`).join('') || '<p class="note">Sin planos.</p>'}</div>`).join('') || '<p class="empty">Primero crea escenas y planos en el paso Guion.</p>'}
    ${video ? '' : '<div class="card soon">🗓 El <b>plan por días</b> y la <b>hoja de llamado</b> llegan en la versión 1.3.</div>'}
    <button class="btn b-pdf" data-go="pdf:${p.id}">📄 PDF del guion</button>`
  };
};

V.mapa = ([pid, ei]) => ({
  back: 1, top: `<h2>🗺 Mapa · ESC ${+ei + 1}<small>Vista desde arriba</small></h2>`,
  body: `<div class="tools">
    <button class="sw" data-col="fg" aria-pressed="true" style="background:var(--fg)" aria-label="Negro"></button>
    <button class="sw" data-col="cam" aria-pressed="false" style="background:var(--c-cam)" aria-label="Rosado"></button>
    <button class="sw" data-col="pla" aria-pressed="false" style="background:var(--c-pla)" aria-label="Azul"></button>
    <span class="grow"></span><button class="btn b-neu mini" id="mUndo">↶ Deshacer</button><button class="btn b-del mini" id="mClear">Borrar</button></div>
    <div class="canvaswrap" id="cw"><div class="grid-bg"></div><canvas id="cv"></canvas></div>
    <div class="palette"><button class="b-cam" data-stamp="cam"><span>📷</span>Cámara</button><button class="b-per" data-stamp="per"><span>🧍</span>Persona</button><button class="b-idea" data-stamp="luz"><span>💡</span>Luz</button><button class="b-neu" data-stamp="obj"><span>📦</span>Objeto</button></div>
    <p class="note">Dibuja con el dedo. Toca un ícono para ponerlo y arrástralo. Toca dos veces un ícono para quitarlo. Se guarda solo.</p>`,
  after() { const p = proy(pid); initMap(p, cont(p).escenas[+ei], 'mapa'); }
});

V.pdf = id => {
  const p = proy(id), c = cli(p.cli), pv = S.pdf;
  return {
    back: 1, top: `<h2>PDF<small>${esc(p.nombre)}</small></h2>`,
    body: `<div class="mode"><button data-pver="cliente" aria-pressed="${pv.ver === 'cliente'}">Para leer</button><button data-pver="equipo" aria-pressed="${pv.ver === 'equipo'}">Para grabar</button></div>
    ${p.tipo === 'video' ? `<div class="card setrow"><div class="grow"><b>Mostrar el plan del cliente</b><div class="note" style="text-align:left">Ej.: “Video 3 de 12 · Plan Pro”</div></div><button class="toggle" data-act="pdfPlan" aria-pressed="${pv.plan}" aria-label="Mostrar plan"></button></div>` : ''}
    <div class="card" style="padding:8px;overflow:hidden" id="prevBox"><div id="prev" style="transform-origin:0 0"></div></div>
    ${p.tipo === 'video' && c.wa ? `<div class="card setrow"><div class="grow"><div class="note" style="text-align:left">WhatsApp de ${esc(c.n)}</div><b style="font-size:17px">${esc(c.wa)}</b></div><button class="btn b-neu mini" data-copy="${esc(c.wa)}">${I.copy} Copiar</button></div>` : ''}
    <button class="btn b-send" data-act="sharePdf">${I.wa} Mandar por WhatsApp</button>
    <button class="btn b-pdf" data-act="sharePdf">📄 Guardar o compartir PDF</button>`,
    after() {
      const box = $('#prevBox'), pr = $('#prev');
      pr.innerHTML = paperHTML(p, pv, true);
      const k = (box.clientWidth - 16) / 794; pr.style.transform = `scale(${k})`;
      requestAnimationFrame(() => { box.style.height = (pr.firstElementChild.offsetHeight * k + 16) + 'px'; });
    }
  };
};

V.clientes = () => ({
  tab: 'clientes', fab: 1, top: `<h2>Clientes</h2>`,
  body: `<button class="btn b-add" data-go="clienteForm">${I.plus} Nuevo cliente</button>
  <div class="list">${db.clientes.map(c => { const cup = planCupo(c.plan), h = delMes(c); return `<button class="row" data-go="cliente:${c.id}">${av(c)}<div class="grow"><div class="t">${esc(c.n)}</div><div class="s">${c.plan ? `Plan ${esc(c.plan)} · ${h} de ${cup} videos este mes` : 'Sin plan'}</div>${cup ? `<div class="planbar"><i style="width:${Math.min(100, h / cup * 100)}%"></i></div>` : ''}</div>${I.chev}</button>`; }).join('')}</div>`
});
V.cliente = id => {
  const c = cli(id); if (!c.id) return V.clientes();
  const cup = planCupo(c.plan), h = delMes(c), ps = db.proyectos.filter(p => p.cli === id).sort((a, b) => b.act - a.act);
  return {
    back: 1, top: `<h2>${esc(c.n)}</h2><button class="iconbtn" data-go="clienteForm:${id}" aria-label="Editar">${I.edit}</button>`,
    body: `<div class="card setrow">${av(c, 58)}<div class="grow"><b style="font-size:16px">${esc(c.n)}</b><div class="note" style="text-align:left">${c.plan ? 'Plan ' + esc(c.plan) : 'Sin plan'}${c.nota ? ' · ' + esc(c.nota) : ''}</div>
      ${cup ? `<div class="planbar"><i style="width:${Math.min(100, h / cup * 100)}%"></i></div><div class="note" style="text-align:left;margin-top:4px">${h} de ${cup} videos este mes · faltan ${Math.max(0, cup - h)}</div>` : ''}</div></div>
    <button class="btn b-add" data-act="nuevoVideo" data-cli="${id}">${I.plus} Nuevo video para ${esc(c.n)}</button>
    <div class="sec-t">Videos (${ps.length})</div><div class="list">${ps.map(prow).join('') || '<p class="empty">Aún no hay videos.</p>'}</div>`
  };
};
V.clienteForm = id => {
  const c = id ? cli(id) : null;
  if (!S.formLive) { S.form = c ? clone(c) : { id: '', n: '', c: COLORES[db.clientes.length % COLORES.length], logo: '', plan: '', nota: '', wa: '', ig: '', tt: '', fb: '', yt: '' }; S.formLive = true; }
  const f = S.form;
  return {
    back: 1, top: `<h2>${c ? 'Editar cliente' : 'Nuevo cliente'}</h2>`,
    body: `<div class="form">
      <div class="setrow"><span id="fAv">${av(f.n ? f : Object.assign({}, f, { n: '?' }), 64)}</span><div class="grow" style="display:flex;flex-direction:column;gap:6px">
        <label class="btn b-neu mini" style="width:auto;align-self:flex-start">🖼 ${f.logo ? 'Cambiar logo' : 'Poner logo'}<input type="file" accept="image/*" id="fLogo" hidden></label>
        ${f.logo ? '<button class="btn b-del mini" data-act="logoOff" style="align-self:flex-start">Quitar logo</button>' : ''}</div></div>
      <div><label class="lbl" for="fN">Nombre</label><input class="free" id="fN" data-cf="n" value="${esc(f.n)}" placeholder="Ej.: Celulares Atrato"></div>
      <div><span class="lbl">Color de marca</span><div class="swatches">${COLORES.map(x => `<button class="sw" data-ccol="${x}" aria-pressed="${f.c === x}" style="background:${x}" aria-label="Color ${x}"></button>`).join('')}</div></div>
      <div><span class="lbl">Paquete</span>${chips(['Sin plan', ...db.planes.map(p => `${p.n} (${p.v})`)], f.plan ? `${f.plan} (${planCupo(f.plan)})` : 'Sin plan', 'data-cplan')}</div>
      <div><label class="lbl" for="fNota">Nota del plan</label><input class="free" id="fNota" data-cf="nota" value="${esc(f.nota)}" placeholder="Ej.: incluye 1 reel con dron"></div>
      <div><label class="lbl" for="fWa">WhatsApp</label><input class="free" id="fWa" data-cf="wa" type="tel" inputmode="tel" value="${esc(f.wa)}" placeholder="Ej.: 300 123 4567"></div>
      <div class="btns2"><input class="free" data-cf="ig" value="${esc(f.ig)}" placeholder="Instagram" aria-label="Instagram"><input class="free" data-cf="tt" value="${esc(f.tt)}" placeholder="TikTok" aria-label="TikTok"><input class="free" data-cf="fb" value="${esc(f.fb)}" placeholder="Facebook" aria-label="Facebook"><input class="free" data-cf="yt" value="${esc(f.yt)}" placeholder="YouTube" aria-label="YouTube"></div>
      <button class="btn b-add" data-act="clienteSave">${I.check} ${c ? 'Listo' : 'Crear cliente'}</button>
      ${c && c.id !== 'nexo' ? '<button class="btn b-del" data-act="clienteDel">Borrar cliente</button>' : ''}</div>`
  };
};

function todosGanchos() {
  const G = window.GANCHOS || {};
  const out = {};
  Object.keys(G).forEach(k => out[k] = G[k].map(h => ({ tipo: h[0], t: h[1], ej: h[2] })));
  out['Míos'] = db.ganchosPropios;
  return out;
}
V.ganchos = () => {
  const G = todosGanchos(), q = S.hookQ.trim().toLowerCase();
  const list = (G[S.hookCat] || []).filter(h => !q || (h.t + h.ej + h.tipo).toLowerCase().includes(q));
  return {
    tab: 'ganchos', fab: 1, top: `<h2>Banco de ganchos<small>${Object.values(G).reduce((a, x) => a + x.length, 0)} fórmulas</small></h2>`,
    body: `<div class="chips">${Object.keys(G).map(k => `<button class="chip sm" data-hcat="${k}" aria-pressed="${k === S.hookCat}">${k} (${G[k].length})</button>`).join('')}</div>
    <input class="free" id="hq" value="${esc(S.hookQ)}" placeholder="Buscar gancho…">
    ${S.hookCat === 'Míos' ? `<button class="btn b-add" data-act="hookNew">${I.plus} Agregar mi gancho</button>` : ''}
    <div class="list">${list.map((h, i) => `<button class="hook" data-hk="${i}"><span class="k">${esc(h.tipo)}</span><span class="p">${esc(h.t)}</span><span class="x">Ej.: ${esc(h.ej)}</span></button>`).join('') || '<p class="empty">Nada por aquí.</p>'}</div>
    <p class="note">Toca un gancho para copiarlo. Las partes entre [corchetes] se cambian por lo tuyo.</p>`
  };
};

V.aprender = () => ({
  tab: 'aprender', fab: 1, top: `<h2>Aprender<small>De la idea al guion · 5 min cada una</small></h2>`,
  body: `<div class="list">${(window.LECCIONES || []).map((l, i) => `<button class="row" data-go="leccion:${i}"><span class="ico num">${i + 1}</span><div class="grow"><div class="t">${l.t}</div><div class="s">${l.s}</div></div>${I.chev}</button>`).join('')}</div>`
});
V.leccion = i => {
  const L = window.LECCIONES, l = L[+i];
  return { back: 1, top: `<h2>${+i + 1} · ${l.t}<small>Aprender</small></h2>`, body: `<div class="lesson">${l.html}</div>${+i < L.length - 1 ? `<button class="btn b-add" data-replace="leccion:${+i + 1}">Siguiente lección →</button>` : '<p class="note">¡Terminaste! Ahora crea un proyecto y aplica lo aprendido.</p>'}` };
};

V.ajustes = () => {
  const a = db.ajustes;
  return {
    back: 1, top: `<h2>Ajustes</h2>`,
    body: `
    <div class="sec-t">Respaldo</div>
    <div class="${respaldoViejo() ? 'warnbox' : 'card'}" style="font-size:13px;line-height:1.45">${a.respaldo ? `<b>Último respaldo: ${hace(a.respaldo)}</b>` : '<b>Todavía no has hecho un respaldo</b>'}<br>Si borras la app, se pierden los guiones. Guarda el archivo en Drive o mándatelo por WhatsApp.</div>
    <button class="btn b-add" data-act="backupOut">⬇ Exportar respaldo</button>
    <label class="btn b-neu">⬆ Importar respaldo<input type="file" accept=".json,application/json" id="backupIn" hidden></label>
    <div class="sec-t">Apariencia</div>
    <div class="card"><span class="lbl">Tema</span>${chips(['Automático', 'Claro', 'Oscuro'], { auto: 'Automático', light: 'Claro', dark: 'Oscuro' }[a.tema], 'data-tema')}</div>
    <div class="sec-t">Seguridad</div>
    <div class="card setrow"><div class="grow"><b>Bloquear con PIN</b><div class="note" style="text-align:left">Pide 4 números al abrir la app</div></div><button class="toggle" data-act="pinToggle" aria-pressed="${!!a.pin}" aria-label="Bloquear con PIN"></button></div>
    <div class="sec-t">Colores de los botones</div>
    <div class="card lg"><span><i style="background:var(--c-idea)"></i>Idea</span><span><i style="background:var(--c-add)"></i>Crear / agregar</span><span><i style="background:var(--c-per)"></i>Persona</span><span><i style="background:var(--c-pla)"></i>Plano</span><span><i style="background:var(--c-cam)"></i>Cámara</span><span><i style="background:var(--c-pdf)"></i>PDF</span><span><i style="background:var(--c-send)"></i>WhatsApp</span><span><i style="background:var(--c-del)"></i>Borrar</span></div>
    <div class="sec-t">Versión</div>
    <div class="card" style="font-size:13px;line-height:1.5;color:var(--muted)">NEXO Guion <b style="color:var(--fg)">${CONFIG.VERSION}</b>. Funciona 100 % sin internet${isNative ? ' y no se conecta a ningún servidor' : ''}. Las versiones nuevas te llegan como archivo APK por el chat con Claude: instálalas encima y tus guiones no se borran.</div>
    <div class="sec-t">Zona peligrosa</div>
    <button class="btn b-del" data-act="wipe">Borrar todos los datos</button>
    <p class="note">NEXO Guion · Excelencia digital, confianza real</p>`
  };
};

/* ---------- 8. Motor de pantallas ---------- */
function render(name, arg, keep) {
  const y = scr.scrollTop;
  if (name !== 'clienteForm') S.formLive = false;
  cur.name = name; cur.arg = arg;
  const v = V[name](arg);
  topEl.innerHTML = (v.back ? `<button class="back" data-back aria-label="Atrás">${I.back}</button>` : '') + v.top;
  preEl.innerHTML = v.pre || '';
  scr.innerHTML = v.body;
  tabs.hidden = !!v.back; fab.hidden = !v.fab; foot.hidden = !v.foot;
  if (v.foot === 'guion') foot.innerHTML = `<button class="btn b-neu" data-go="rodaje:${arg}">🎬 Grabar</button><button class="btn b-add" data-act="planoNuevo">${I.plus} Nuevo plano</button><button class="btn b-pdf" data-go="pdf:${arg}">📄 PDF</button>`;
  tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === v.tab ? 'page' : 'false'));
  if (v.after) v.after();
  scr.scrollTop = keep ? y : 0;
}
function go(t) { const i = t.indexOf(':'); const n = i < 0 ? t : t.slice(0, i); let a = i < 0 ? null : t.slice(i + 1); if (n === 'mapa') a = a.split(','); S.stack.push([cur.name, cur.arg, scr.scrollTop]); render(n, a); }
function back() {
  if (wizEl.innerHTML) { cerrarWiz(); return true; }
  if (modalEl.innerHTML) { closeModal(); return true; }
  const p = S.stack.pop(); if (!p) return false;
  render(p[0], p[1]); scr.scrollTop = p[2] || 0; return true;
}
function abrirProyecto(id) { db.ajustes.ultimo = id; save(); S.cap = 0; S.esc = 0; go('proyecto:' + id); }

/* ---------- 9. Avisos, ventanas y menús ---------- */
let tt;
function toast(msg, withUndo) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? '<button data-act="undo">Deshacer</button>' : ''}`; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), withUndo ? 5000 : 2400); }
function sheet(html) { modalEl.innerHTML = `<div class="modal" data-close><div class="sheet" role="dialog"><span class="grab"></span>${html}</div></div>`; }
function closeModal() { modalEl.innerHTML = ''; }
function confirmar(titulo, texto, okTxt) {
  return new Promise(res => {
    sheet(`<h3>${esc(titulo)}</h3><p>${esc(texto)}</p><div class="btns2"><button class="btn b-neu" id="cNo">Cancelar</button><button class="btn b-delfill" id="cSi">${esc(okTxt || 'Borrar')}</button></div>`);
    $('#cNo').onclick = () => { closeModal(); res(false); }; $('#cSi').onclick = () => { closeModal(); res(true); };
  });
}
function menu(titulo, items) {
  sheet(`<h3>${esc(titulo)}</h3><div class="menu">${items.map((it, i) => `<button class="btn ${it.cls || 'b-neu'}" data-mi="${i}">${it.ico || ''} ${esc(it.t)}</button>`).join('')}</div>`);
  modalEl.querySelectorAll('[data-mi]').forEach(b => b.onclick = () => { closeModal(); items[+b.dataset.mi].fn(); });
}
function preguntar(titulo, valor, ph, okTxt) {
  return new Promise(res => {
    sheet(`<h3>${esc(titulo)}</h3><input class="free" id="pqIn" value="${esc(valor || '')}" placeholder="${esc(ph || '')}"><button class="btn b-add" id="pqOk">${esc(okTxt || 'Listo')}</button>`);
    const i = $('#pqIn'); setTimeout(() => i.focus(), 60);
    $('#pqOk').onclick = () => { const v = i.value.trim(); closeModal(); res(v || null); };
  });
}
function ayuda(key) {
  const h = key === 'logline' ? ['Logline: tu historia en una frase', 'Quién es el protagonista + qué quiere + qué se lo impide. Si no cabe en una frase con un "pero", todavía es una idea.', 'Un joven técnico de Quibdó quiere salvar su barrio con mensajes del futuro, pero cada mensaje le borra un recuerdo a su abuela.'] : BEATS[key];
  sheet(`<h3>❓ ${h[0]}</h3><p>${h[1]}</p><div class="ex"><b>Ejemplo:</b> ${h[2]}</div><button class="btn b-add" data-close-btn>Entendido</button>`);
}

/* ---------- 10. Acciones de proyectos e ideas ---------- */
function guardarIdea(t) { t = (t || '').trim(); if (!t) return false; db.ideas.unshift({ id: uid(), t, creado: Date.now(), proy: null }); save(); toast('💡 Idea guardada'); return true; }
function quickIdea() {
  sheet(`<h3>💡 Nueva idea</h3><textarea class="free" id="qIdea" rows="3" placeholder="Escribe la idea…"></textarea><button class="btn b-idea" id="qSave">${I.arrow} Guardar idea</button>`);
  const t = $('#qIdea'); setTimeout(() => t.focus(), 60);
  $('#qSave').onclick = () => { if (guardarIdea(t.value)) { closeModal(); if (cur.name === 'home') render('home', null, true); } else t.focus(); };
}
function ideaMenu(id) {
  const i = db.ideas.find(x => x.id === id); if (!i) return;
  sheet(`<h3>Idea</h3><textarea class="free" id="eIdea" rows="3">${esc(i.t)}</textarea><button class="btn b-add" id="eConv">→ Convertir en proyecto</button>
    <div class="btns2"><button class="btn b-neu" id="eOk">Listo</button><button class="btn b-del" id="eDel">Borrar idea</button></div>`);
  const t = $('#eIdea'), guardar = () => { if (t.value.trim()) { i.t = t.value.trim(); save(); } };
  $('#eOk').onclick = () => { guardar(); closeModal(); render('home', null, true); };
  $('#eConv').onclick = () => { guardar(); nuevoProyecto({ nombre: i.t, idea: i.id }); };
  $('#eDel').onclick = () => { snapshot(); db.ideas = db.ideas.filter(x => x.id !== id); save(); closeModal(); render('home', null, true); toast('Idea borrada', true); };
}
function nuevoProyecto(o) {
  o = o || {};
  sheet(`<h3>Nuevo proyecto</h3><p>¿Qué vas a crear?</p><div class="menu">${Object.entries(TIPOS).map(([k, t]) => `<button class="row" data-tp="${k}"><span class="ico">${t.e}</span><div class="grow"><div class="t">${t.n}</div><div class="s">${t.pasos.length} pasos: ${t.pasos.map(x => PASOS[x][0]).join(' → ')}</div></div></button>`).join('')}</div>`);
  modalEl.querySelectorAll('[data-tp]').forEach(b => b.onclick = async () => {
    const tipo = b.dataset.tp; closeModal();
    const nombre = o.nombre || await preguntar(tipo === 'video' ? 'Título del video' : 'Nombre del proyecto', '', tipo === 'video' ? 'Ej.: Armé un PC gamer con 2 millones' : 'Ej.: La Señal', 'Crear');
    if (!nombre) return;
    const p = proyectoNuevo(tipo, { nombre, cli: o.cli || (tipo === 'video' ? 'nexo' : '') });
    db.proyectos.unshift(p);
    if (o.idea) { const i = db.ideas.find(x => x.id === o.idea); if (i) i.proy = p.id; }
    save(); abrirProyecto(p.id); toast('Proyecto creado: empieza por el paso 1');
  });
}
function proyMenu() {
  const p = proy(cur.arg);
  menu('Opciones del proyecto', [
    { t: 'Cambiar nombre', ico: '✏', fn: async () => { const n = await preguntar('Nombre', p.nombre); if (n) { p.nombre = n; touch(p); render('proyecto', p.id, true); } } },
    { t: 'Duplicar proyecto', ico: '⧉', fn: () => { const c = clone(p); c.id = uid(); c.nombre += ' (copia)'; c.creado = c.act = Date.now(); c.ejemplo = false; db.proyectos.unshift(c); save(); S.stack.pop(); abrirProyecto(c.id); toast('Proyecto duplicado'); } },
    ...(p.tipo === 'video' ? [{ t: 'Versión para otra red', ico: '↔', cls: 'b-add', fn: () => menu('¿Para qué red?', REDES.map(r => ({ t: RED_TXT[r], fn: () => { const c = clone(p); c.id = uid(); c.redes = [r]; c.nombre = p.nombre + ' (' + r + ')'; c.creado = c.act = Date.now(); c.escenas.forEach(e => e.planos.forEach(x => x.ok = false)); db.proyectos.unshift(c); save(); S.stack.pop(); abrirProyecto(c.id); toast('Versión ' + r + ' creada'); } }))) }] : []),
    ...(p.tipo === 'serie' ? [{ t: 'Renombrar capítulo', ico: '📺', fn: async () => { const c = cont(p); const n = await preguntar('Nombre del capítulo', c.nombre); if (n) { c.nombre = n; touch(p); render('proyecto', p.id, true); } } }] : []),
    { t: 'Borrar proyecto', ico: '🗑', cls: 'b-del', fn: async () => { if (!await confirmar('¿Borrar este proyecto?', 'Se borran sus escenas, planos y dibujos.')) return; snapshot(); db.proyectos = db.proyectos.filter(x => x.id !== p.id); save(); S.stack = []; render('home'); toast('Proyecto borrado', true); } }
  ]);
}

/* ---------- 11. Asistentes paso a paso (escena y plano) ---------- */
let W = null;
function cerrarWiz() { wizEl.innerHTML = ''; W = null; }
function wizShell(titulo, paso, total, body, last, extra) {
  wizEl.innerHTML = `<div class="wiz"><div class="wtop"><button class="iconbtn" data-wclose aria-label="Cerrar">✕</button><b>${titulo}</b><span>Paso ${paso} de ${total}</span>${extra || ''}</div><div class="pbar"><i style="width:${paso / total * 100}%"></i></div>
    <div class="wbody">${body}</div><div class="wfoot"><button class="btn b-neu" data-wprev ${paso > 1 ? '' : 'disabled style="opacity:.4"'}>← Atrás</button><button class="btn b-add" data-wnext>${last ? '✓ Guardar' : 'Siguiente →'}</button></div></div>`;
  const ta = wizEl.querySelectorAll('textarea'); ta.forEach(autosize);
}

/* Escena: ¿dónde? → ¿cuándo? → ¿quiénes están? */
function wizEscena(idx) {
  const p = proy(cur.arg), c = cont(p);
  const base = idx != null ? clone(c.escenas[idx]) : escenaNueva(c.escenas.length ? { reparto: c.escenas[c.escenas.length - 1].reparto.slice(), lugar: c.escenas[c.escenas.length - 1].lugar } : {});
  W = { kind: 'esc', idx, e: base, step: 0 };
  drawEsc();
}
function drawEsc() {
  const p = proy(cur.arg), c = cont(p), e = W.e, k = W.step;
  let body;
  if (k === 0) body = `<p class="q">¿Dónde pasa la escena?</p><div class="opts">${LUGAR.map(o => `<button class="op" data-eset="lugar" data-v="${o[1]}" aria-pressed="${e.lugar === o[1]}"><span class="big">${o[0]}</span>${o[1]}</button>`).join('')}</div><div class="sub">Lugar exacto</div><textarea class="in" data-ein="det" rows="1" placeholder="Ej.: Puente del Atrato">${esc(e.det)}</textarea>`;
  else if (k === 1) body = `<p class="q">¿Cuándo pasa?</p><div class="opts c3">${MOMENTO.map(o => `<button class="op" data-eset="mom" data-v="${o[1]}" aria-pressed="${e.mom === o[1]}"><span class="big">${o[0]}</span>${o[1]}</button>`).join('')}</div>`;
  else body = `<p class="q">¿Quiénes están en la escena?</p><p class="qh">Después, cada plano solo te pregunta cuáles de ellos salen.</p>${p.pers.map(x => `<button class="chkrow" data-erep="${x.id}" aria-pressed="${e.reparto.includes(x.id)}"><span class="box">✓</span>🧍 ${esc(x.n)}</button>`).join('')}<button class="chkrow add" data-act="perNuevoW"><span class="box">＋</span>Nuevo personaje</button>`;
  wizShell(W.idx != null ? `Escena ${W.idx + 1}` : `Escena ${c.escenas.length + 1}`, k + 1, 3, body, k === 2);
}

/* Plano: qué se ve → quién sale → por persona → cámara → duración */
function wizPlano(idx) {
  const p = proy(cur.arg), e = cont(p).escenas[S.esc];
  const prev = e.planos[e.planos.length - 1];
  let base;
  if (idx != null) base = clone(e.planos[idx]);
  else if (prev) base = planoNuevo({ tipo: prev.tipo, alt: prev.alt, mov: prev.mov, pos: prev.pos, quien: prev.quien.filter(q => q.parte !== 'Solo voz').map(q => ({ p: q.p, parte: q.parte, em: q.em, hace: '', dice: '' })) });
  else base = planoNuevo({ tipo: 'General', quien: e.reparto.map(pid => ({ p: pid, parte: 'Cuerpo entero', em: 'Serio', hace: '', dice: '' })) });
  W = { kind: 'pla', idx, x: base, step: 0, nuevo: idx == null, sug: false };
  drawPlano();
}
const pasosPlano = () => ['tipo', 'quien', ...W.x.quien.map((q, i) => 'per' + i), 'cam', 'dur'];
function drawPlano() {
  const p = proy(cur.arg), e = cont(p).escenas[S.esc], x = W.x, st = pasosPlano(), k = st[W.step];
  const num = W.idx != null ? W.idx + 1 : e.planos.length + 1;
  let body;
  if (k === 'tipo') body = `<p class="q">¿Qué se ve en el plano?</p><p class="qh">Elige qué tan cerca está la cámara.</p><div class="opts">${PLANOS.map(t => `<button class="op" data-xset="tipo" data-v="${t[0]}" aria-pressed="${x.tipo === t[0]}"><span class="ill">${ill(t[2])}</span>${t[0]}<small>${t[1]}</small></button>`).join('')}</div>`;
  else if (k === 'quien') body = `<p class="q">¿Quién sale en el plano?</p><p class="qh">Solo aparecen las personas del reparto de esta escena.</p>${e.reparto.map(pid => `<button class="chkrow" data-who="${pid}" aria-pressed="${x.quien.some(q => q.p === pid)}"><span class="box">✓</span>🧍 ${esc(per(p, pid).n)}</button>`).join('') || '<p class="note">Esta escena no tiene reparto. Agrégalo en ⋮ → Editar escena.</p>'}<button class="chkrow" data-who="" aria-pressed="${!x.quien.length}"><span class="box">✓</span>🏞 Nadie (solo el lugar u objeto)</button>`;
  else if (k.startsWith('per')) {
    const qi = +k.slice(3), q = x.quien[qi];
    body = `<div class="who-on">🧍 ${esc(per(p, q.p).n)}${x.quien.length > 1 ? ` · persona ${qi + 1} de ${x.quien.length}` : ''}</div>
    <div class="sub">¿Qué parte se ve?</div><div class="opts c3">${PARTES.map(o => `<button class="op" data-qset="parte" data-v="${o[1]}" aria-pressed="${q.parte === o[1]}"><span class="big">${o[0]}</span>${o[1]}</button>`).join('')}</div>
    <div class="sub">¿Cómo está?</div><div class="opts c3">${EMOC.map(o => `<button class="op" data-qset="em" data-v="${o[1]}" aria-pressed="${q.em === o[1]}"><span class="big">${o[0]}</span>${o[1]}</button>`).join('')}</div>
    <div class="sub">¿Qué hace?</div><textarea class="in" data-qin="hace" rows="1" placeholder="Ej.: mira por la ventana">${esc(q.hace)}</textarea>
    <div class="sub">¿Qué dice?</div><textarea class="in" data-qin="dice" rows="1" placeholder="Déjalo vacío si no habla">${esc(q.dice)}</textarea>`;
  } else if (k === 'cam') body = `<p class="q">¿Dónde va la cámara?</p><div class="sub">Altura</div><div class="opts">${ALT.map(o => `<button class="op" data-xset="alt" data-v="${o[1]}" aria-pressed="${x.alt === o[1]}"><span class="big">${o[0]}</span>${o[1]}</button>`).join('')}</div>
    <div class="sub">Movimiento</div><div class="opts c3">${MOV.map(o => `<button class="op" data-xset="mov" data-v="${o[1]}" aria-pressed="${x.mov === o[1]}"><span class="big">${o[0]}</span>${o[1]}<small>${o[2]}</small></button>`).join('')}</div>
    <div class="sub">Posición exacta (opcional)</div><textarea class="in" data-xin="pos" rows="1" placeholder="Ej.: detrás del mostrador, a 2 m">${esc(x.pos)}</textarea>`;
  else {
    const w = x.quien.reduce((a, q) => a + words(q.dice), 0), sug = Math.max(2, Math.round(w / 2.5) + 1);
    if (W.nuevo && !W.sug) { x.s = sug; W.sug = true; }
    body = `<p class="q">¿Cuánto dura?</p><p class="qh">${w ? `Sugerido por el diálogo (${w} palabras): <b>${sug} s</b>.` : 'Sin diálogo: un plano corto dura de 2 a 4 s.'}</p>
    <div class="durstep"><button data-dur="-1" aria-label="Menos">−</button><b>${x.s} s</b><button data-dur="1" aria-label="Más">+</button></div>
    <div class="sub">Dibujo del plano (opcional)</div><div class="sbwrap" id="sbw"><canvas id="sbc"></canvas>${x.dibujo && x.dibujo.length ? '' : `<span class="sbhint">${illPlano(x.tipo)}</span>`}</div>
    <div class="tools"><button class="btn b-neu mini" id="sbUndo">↶ Deshacer</button><button class="btn b-del mini" id="sbClear">Borrar dibujo</button></div>`;
  }
  const extra = W.idx != null && W.step === 0 ? `<button class="iconbtn" data-act="planoMenu" aria-label="Opciones del plano">${I.dots}</button>` : '';
  wizShell(`Plano ${num}`, W.step + 1, st.length, body, W.step === st.length - 1, extra);
  if (k === 'dur') initDibujo();
}
function guardarWiz() {
  const p = proy(cur.arg), c = cont(p);
  if (W.kind === 'esc') {
    if (!W.e.det) W.e.det = W.e.lugar;
    if (W.idx != null) c.escenas[W.idx] = W.e; else { c.escenas.push(W.e); S.esc = c.escenas.length - 1; }
    touch(p); cerrarWiz(); render('guion', p.id); toast(W && W.idx != null ? '✓ Escena guardada' : '✓ Escena lista: ahora agrega planos');
  } else {
    const e = c.escenas[S.esc];
    if (W.idx != null) e.planos[W.idx] = W.x; else e.planos.push(W.x);
    touch(p); const nuevo = W.idx == null; cerrarWiz(); render('guion', p.id, true); if (nuevo) scr.scrollTop = scr.scrollHeight; toast('✓ Plano guardado');
  }
}
function planoMenu() {
  const p = proy(cur.arg), e = cont(p).escenas[S.esc], i = W.idx;
  menu(`Plano ${i + 1}`, [
    { t: 'Subir', ico: '↑', fn: () => { if (i > 0) { e.planos.splice(i - 1, 0, e.planos.splice(i, 1)[0]); touch(p); } cerrarWiz(); render('guion', p.id, true); } },
    { t: 'Bajar', ico: '↓', fn: () => { if (i < e.planos.length - 1) { e.planos.splice(i + 1, 0, e.planos.splice(i, 1)[0]); touch(p); } cerrarWiz(); render('guion', p.id, true); } },
    { t: 'Duplicar', ico: '⧉', fn: () => { const d = clone(e.planos[i]); d.id = uid(); d.ok = false; e.planos.splice(i + 1, 0, d); touch(p); cerrarWiz(); render('guion', p.id, true); toast('Plano duplicado'); } },
    { t: 'Borrar plano', ico: '🗑', cls: 'b-del', fn: () => { snapshot(); e.planos.splice(i, 1); touch(p); cerrarWiz(); render('guion', p.id, true); toast('Plano borrado', true); } }
  ]);
}
function escMenu() {
  const p = proy(cur.arg), c = cont(p), i = S.esc, e = c.escenas[i];
  const mover = d => { const j = i + d; if (j < 0 || j >= c.escenas.length) return; c.escenas.splice(j, 0, c.escenas.splice(i, 1)[0]); S.esc = j; touch(p); render('guion', p.id); };
  menu(`Escena ${i + 1}`, [
    { t: 'Editar dónde, cuándo y reparto', ico: '✏', cls: 'b-add', fn: () => wizEscena(i) },
    { t: 'Subir', ico: '↑', fn: () => mover(-1) },
    { t: 'Bajar', ico: '↓', fn: () => mover(1) },
    { t: 'Duplicar escena', ico: '⧉', fn: () => { const d = clone(e); d.id = uid(); d.planos.forEach(x => { x.id = uid(); x.ok = false; }); c.escenas.splice(i + 1, 0, d); S.esc = i + 1; touch(p); render('guion', p.id); toast('Escena duplicada'); } },
    { t: 'Borrar escena', ico: '🗑', cls: 'b-del', fn: () => { snapshot(); c.escenas.splice(i, 1); S.esc = Math.max(0, i - 1); touch(p); render('guion', p.id); toast('Escena borrada', true); } }
  ]);
}
function escDet() {
  const p = proy(cur.arg), e = cont(p).escenas[S.esc];
  sheet(`<h3>⚙ Detalles de la escena</h3>
    <span class="lbl">Ambiente</span>${chips(AMBIENTE, e.ambiente, 'data-ed="ambiente"', 1)}
    <span class="lbl">Luz</span>${chips(LUZ, e.luz, 'data-ed="luz"', 1)}
    <span class="lbl">Efectos de Filmora 16</span>${chips(FILMORA, e.filmora || [], 'data-ed="filmora"', 1)}
    <span class="lbl">Notas: sonido, música, objetos, texto en pantalla</span><textarea class="free" id="edN" rows="2">${esc(e.notas)}</textarea>
    <button class="btn b-add" id="edOk">Listo</button>`);
  modalEl.querySelectorAll('[data-ed]').forEach(g => g.onclick = ev => {
    const b = ev.target.closest('.chip'); if (!b) return; const k = g.dataset.ed;
    if (k === 'filmora') { const on = !e.filmora.includes(b.dataset.val); e.filmora = on ? [...e.filmora, b.dataset.val] : e.filmora.filter(x => x !== b.dataset.val); b.setAttribute('aria-pressed', on); }
    else { e[k] = b.dataset.val; g.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); }
    touch(p);
  });
  $('#edOk').onclick = () => { e.notas = $('#edN').value; touch(p); closeModal(); render('guion', p.id, true); };
}
async function nuevoPersonaje(enWiz) {
  const p = proy(cur.arg);
  const n = await preguntar('Nuevo personaje', '', 'Ej.: Mateo', 'Agregar');
  if (!n) return;
  const x = { id: uid(), n, actor: '', desc: '' }; p.pers.push(x); touch(p);
  if (enWiz && W && W.kind === 'esc') { W.e.reparto.push(x.id); drawEsc(); } else render(cur.name, cur.arg, true);
}
function asignarBeat(b) {
  const p = proy(cur.arg), c = cont(p);
  if (!c.escenas.length) { toast('Primero crea escenas en el paso Guion'); return; }
  menu(`Escenas para “${BEATS[b][0]}”`, c.escenas.map((e, i) => ({ t: `ESC ${i + 1} · ${e.det || 'Escena ' + (i + 1)}${e.beat === b ? ' ✓' : ''}`, fn: () => { e.beat = e.beat === b ? '' : b; touch(p); render('historia', p.id, true); } })));
}
function pickHook(cat) {
  const G = todosGanchos(), c = cat || 'Vender';
  const p = proy(cur.arg);
  sheet(`<h3>🪝 Ganchos · ${c}</h3><div class="chips">${Object.keys(G).map(k => `<button class="chip sm" data-pc="${k}" aria-pressed="${k === c}">${k}</button>`).join('')}</div><div class="list">${G[c].map((h, i) => `<button class="hook" data-ph="${i}"><span class="k">${esc(h.tipo)}</span><span class="p">${esc(h.ej)}</span><span class="x">${esc(h.t)}</span></button>`).join('')}</div>`);
  modalEl.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => pickHook(b.dataset.pc));
  modalEl.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => {
    const h = G[c][+b.dataset.ph];
    if (p.tipo === 'video') { p.g = h.ej; touch(p); closeModal(); render('idea', p.id, true); toast('Gancho puesto: edítalo a tu gusto'); }
    else { copiar(h.ej); closeModal(); }
  });
}
async function copiar(t) { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch (e) { toast(t); } }

/* Clientes */
function clienteSave() {
  const f = S.form; f.n = f.n.trim();
  if (!f.n) { toast('Escribe el nombre del cliente'); $('#fN').focus(); return; }
  if (f.id) db.clientes[db.clientes.findIndex(c => c.id === f.id)] = f; else { f.id = uid(); db.clientes.push(f); }
  save(); S.formLive = false;
  if (cur.arg) back(); else render('cliente', f.id);
  toast('Cliente guardado');
}
async function clienteDel() {
  const f = S.form;
  if (!await confirmar('¿Borrar cliente?', 'Sus videos se quedan, pero sin cliente.')) return;
  snapshot(); db.clientes = db.clientes.filter(c => c.id !== f.id); db.proyectos.forEach(p => { if (p.cli === f.id) p.cli = ''; }); save();
  S.stack = []; render('clientes'); toast('Cliente borrado', true);
}
function leerLogo(file) {
  const fr = new FileReader();
  fr.onload = () => { const img = new Image(); img.onload = () => { const s = 256, k = Math.min(s / img.width, s / img.height), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); S.form.logo = cv.toDataURL('image/png'); render('clienteForm', cur.arg, true); }; img.src = fr.result; };
  fr.readAsDataURL(file);
}
function rebindForm() {
  const f = S.form;
  $('#fAv').innerHTML = av(f.n ? f : Object.assign({}, f, { n: '?' }), 64);
  scr.querySelectorAll('[data-ccol]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ccol === f.c));
  scr.querySelectorAll('[data-cplan] .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.val.startsWith(f.plan || 'Sin plan')));
}

/* ---------- 12. Respaldo, calendario y compartir ---------- */
async function backupOut() {
  const d = new Date().toISOString().slice(0, 10);
  if (await compartir(new Blob([JSON.stringify(db)], { type: 'application/json' }), `nexo-guion-respaldo-${d}.json`)) { db.ajustes.respaldo = Date.now(); save(); render('ajustes', null, true); toast('✅ Respaldo listo'); }
}
function backupIn(file) {
  const fr = new FileReader();
  fr.onload = async () => {
    let data; try { data = JSON.parse(fr.result); } catch (e) { toast('⚠ Ese archivo no es un respaldo válido'); return; }
    if (data && data.v === 1 && Array.isArray(data.videos)) data = migrarV1(data);
    if (!data || data.v !== 2 || !Array.isArray(data.proyectos)) { toast('⚠ Ese archivo no es un respaldo de NEXO Guion'); return; }
    if (!await confirmar('¿Importar respaldo?', `Tiene ${data.proyectos.length} proyectos y ${data.clientes.length} clientes. Reemplaza lo que hay ahora.`, 'Importar')) return;
    snapshot(); db = data; save(); applyTheme(); S.stack = []; render('home'); toast('✅ Respaldo importado', true);
  };
  fr.readAsText(file);
}
function exportarICS(p) {
  if (!p.fg && !p.fe) { toast('Primero pon la fecha de grabación o de entrega'); return; }
  const pad = n => String(n).padStart(2, '0'), dt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NEXO PC//NEXO Guion//ES', 'CALSCALE:GREGORIAN'], stamp = dt(new Date());
  if (p.fg) { const a = new Date(p.fg), b = new Date(a.getTime() + 2 * 3600000); L.push('BEGIN:VEVENT', `UID:${p.id}-g@nexoguion`, `DTSTAMP:${stamp}`, `DTSTART:${dt(a)}`, `DTEND:${dt(b)}`, `SUMMARY:🎬 Grabar: ${p.nombre}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana grabas', 'END:VALARM', 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Grabas en 2 horas', 'END:VALARM', 'END:VEVENT'); }
  if (p.fe) { const d2 = new Date(p.fe + 'T00:00'); d2.setDate(d2.getDate() + 1); L.push('BEGIN:VEVENT', `UID:${p.id}-e@nexoguion`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${p.fe.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${d2.getFullYear()}${pad(d2.getMonth() + 1)}${pad(d2.getDate())}`, `SUMMARY:📦 Entregar: ${p.nombre}`, 'BEGIN:VALARM', 'TRIGGER:-PT15H', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana entregas', 'END:VALARM', 'END:VEVENT'); }
  L.push('END:VCALENDAR');
  compartir(new Blob([L.join('\r\n')], { type: 'text/calendar' }), `${slug(p.nombre)}.ics`);
}
function blobToBase64(blob) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); }); }
async function compartir(blob, nombre) {
  try {
    if (isNative && Plug('Filesystem') && Plug('Share')) {
      const r = await Plug('Filesystem').writeFile({ path: nombre, data: await blobToBase64(blob), directory: 'CACHE' });
      await Plug('Share').share({ title: nombre, files: [r.uri], dialogTitle: 'Compartir' }); return true;
    }
    const file = new File([blob], nombre, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: nombre }); return true; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
  } catch (e) {
    if (e && (e.name === 'AbortError' || /cancel/i.test(e.message || ''))) return false;
    toast('⚠ No se pudo compartir: ' + (e.message || e)); return false;
  }
}

/* ---------- 13. PDF ---------- */
function paperHTML(p, pv, preview) {
  const c = cli(p.cli), video = p.tipo === 'video';
  const caps = p.tipo === 'serie' ? [cont(p)] : [p];
  const cc = caps[0], s = stats(cc);
  const head = video ? `${av(c, 48)}${esc(c.n)}` : `<span style="font-size:30px">${TIPOS[p.tipo].e}</span>${TIPOS[p.tipo].n}`;
  let html = `<div class="paper" style="--cli:${video ? c.c : '#03BDDE'}">
    <div class="blk"><div class="ph"><img src="icons/logo-nexo.png" alt="NEXO PC"><div class="cl">${head}</div></div></div>
    <div class="blk"><h1>${esc(p.nombre)}${p.tipo === 'serie' ? ' · ' + esc(cc.nombre) : ''}</h1><div class="meta">${pv.ver === 'equipo' ? 'Hoja de rodaje' : 'Guion'}${p.fg ? ' · Grabación: ' + fecha(p.fg) : ''}${p.fe ? ' · Entrega: ' + fecha(p.fe) : ''}</div>
      <div class="tags">${video ? p.redes.map(r => `<span class="tag">${RED_TXT[r]}</span>`).join('') : (p.generos || []).map(g => `<span class="tag">${esc(g)}</span>`).join('')}<span class="tag">${s.s} s</span><span class="tag">${s.esc} escenas</span><span class="tag">${s.per} personas</span><span class="tag">${s.pl} planos</span></div></div>
    ${video && pv.plan && c.plan ? `<div class="blk"><div class="planline">Video ${Math.max(1, delMes(c))} de ${planCupo(c.plan)} · Plan ${esc(c.plan)}</div></div>` : ''}
    ${video ? `<div class="blk"><div class="g4">${[['Gancho', p.g], ['Problema', p.p], ['Solución', p.s], ['Llamado a la acción', p.c]].map(([k, t]) => `<div class="pc"><span class="k">${k}</span>${esc(t) || '—'}</div>`).join('')}</div></div>`
      : `${p.logline ? `<div class="blk"><div class="pc"><span class="k">Logline</span>${esc(p.logline)}</div></div>` : ''}`}`;
  if (pv.ver === 'equipo') {
    cc.escenas.forEach((e, i) => {
      const img = !preview && mapaTieneAlgo(e.mapa) ? mapToDataURL(e.mapa, 440, 550) : '';
      html += `<div class="blk"><div class="sc"><div class="sch"><span class="n">ESC ${i + 1}</span><b>${esc(e.det)}</b><span class="meta">${e.lugar} · ${e.mom} · ${e.ambiente} · Luz: ${e.luz}</span></div>
        <div class="scb ${img ? '' : 'nomap'}"><div><div class="meta" style="margin-bottom:8px"><b>Reparto:</b> ${e.reparto.map(id => esc(per(p, id).n)).join(', ') || '—'}</div>
        ${e.planos.map((x, j) => `<div class="pl"><div class="plh"><b>Plano ${j + 1} · ${x.tipo}</b><span>${x.s} s · 📷 ${x.alt} · ${x.mov}${x.pos ? ' · ' + esc(x.pos) : ''}</span></div>
          ${x.quien.map(q => `<div class="pr"><i style="background:#F97316"></i><span><b style="color:#C2410C">${esc(per(p, q.p).n)}</b> <span class="meta">(${q.parte}, ${emoji(q.em)} ${q.em})</span>${q.hace ? ' ' + esc(q.hace) + '.' : ''}${q.dice ? ` <b>“${esc(q.dice)}”</b>` : ''}</span></div>`).join('') || '<div class="meta">Nadie en cuadro</div>'}</div>`).join('') || '<span class="meta">Sin planos</span>'}</div>
        ${img ? `<img class="mapimg" src="${img}" alt="">` : ''}</div>
        ${e.notas || (e.filmora || []).length ? `<div class="props">${[e.notas, (e.filmora || []).length && 'Filmora: ' + e.filmora.join(', ')].filter(Boolean).map(esc).join(' · ')}</div>` : ''}</div></div>`;
    });
  } else {
    html += `<div class="blk"><div class="pc"><span class="k">Escenas</span>${cc.escenas.map((e, i) => `${i + 1}. ${esc(e.det)} (${e.lugar}, ${e.mom})`).join('<br>') || '—'}</div></div>`;
    cc.escenas.forEach((e, i) => {
      const dl = e.planos.flatMap(x => x.quien.filter(q => q.dice || q.hace).map(q => `<b style="color:#C2410C">${esc(per(p, q.p).n)}</b> ${emoji(q.em)}${q.hace ? ' <i>' + esc(q.hace) + '</i>' : ''}${q.dice ? ': “' + esc(q.dice) + '”' : ''}`));
      if (dl.length) html += `<div class="blk"><div class="pc"><span class="k">ESC ${i + 1} · ${esc(e.det)}</span>${dl.join('<br>')}</div></div>`;
    });
  }
  return html + `<div class="blk"><div class="foot">Hecho con NEXO Guion · NEXO PC · Excelencia digital, confianza real</div></div></div>`;
}
async function crearPDF(p) {
  const stage = $('#pdfStage'); stage.innerHTML = paperHTML(p, S.pdf, false);
  await Promise.all([...stage.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), k = W / 794, M = 28;
  let y = M;
  for (const b of stage.querySelectorAll('.blk')) {
    const cv = await html2canvas(b, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const h = cv.height / 2 * k;
    if (y + h > H - M && y > M) { pdf.addPage(); y = M; }
    pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 40 * k, y, 714 * k, Math.min(h, H - 2 * M)); y += h;
  }
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(140); pdf.text(`Página ${i} de ${n}`, W - 40 * k, H - 14, { align: 'right' }); }
  stage.innerHTML = '';
  return pdf.output('blob');
}
async function sharePdf() {
  const p = proy(cur.arg); toast('Creando el PDF…');
  try { await compartir(await crearPDF(p), `${slug(p.nombre)}-${S.pdf.ver === 'equipo' ? 'rodaje' : 'guion'}.pdf`); }
  catch (e) { toast('⚠ No se pudo crear el PDF: ' + (e.message || e)); }
}

/* ---------- 14. Dibujo: mapa de escena y storyboard de plano ---------- */
const STAMP = { cam: ['📷', 'Cámara', '--c-cam'], per: ['🧍', 'P', '--c-per'], luz: ['💡', 'Luz', '--c-idea'], obj: ['📦', 'Objeto', '--muted'] };
const COLS_PDF = { fg: '#10202A', cam: '#DB2777', pla: '#2563EB', muted: '#8FA3AB' };
const mapaTieneAlgo = m => m && ((m.strokes && m.strokes.length) || (m.stamps && m.stamps.length));
function colorDe(c, pdf) { if (pdf) return COLS_PDF[c] || '#10202A'; return getComputedStyle(document.documentElement).getPropertyValue({ fg: '--fg', cam: '--c-cam', pla: '--c-pla', muted: '--muted' }[c] || '--fg').trim() || '#000'; }
function trazos(ctx, strokes, W, H, pdf) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, W / 90); (strokes || []).forEach(s => { ctx.strokeStyle = colorDe(s.c, pdf); ctx.beginPath(); s.p.forEach((q, i) => i ? ctx.lineTo(q[0] * W, q[1] * H) : ctx.moveTo(q[0] * W, q[1] * H)); ctx.stroke(); }); }
function dibujoURL(strokes, W, H) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); trazos(ctx, strokes, W, H, true); return cv.toDataURL('image/png'); }
function mapToDataURL(m, W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#EEF2F4'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  trazos(ctx, m.strokes, W, H, true);
  const pc = { '--c-cam': '#DB2777', '--c-per': '#F97316', '--c-idea': '#FFC107', '--muted': '#8FA3AB' };
  (m.stamps || []).forEach(s => { const [e, , c] = STAMP[s.t], x = s.x * W, y = s.y * H; ctx.fillStyle = '#fff'; ctx.strokeStyle = pc[c]; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 22, y - 22, 44, 44, 12) : ctx.rect(x - 22, y - 22, 44, 44); ctx.fill(); ctx.stroke(); ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(e, x, y + 1); ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#10202A'; ctx.fillText(s.l, x, y + 34); });
  return cv.toDataURL('image/png');
}
/* Lienzo genérico: dibuja con el dedo sobre "wrap" y guarda en la lista "strokes" */
function lienzo(wrap, cv, strokes, onChange, getCol, fijo) { // fijo = colores fijos (fondo blanco)
  const ctx = cv.getContext('2d'); let curS = null;
  const W = () => wrap.clientWidth, H = () => wrap.clientHeight;
  const draw = () => { ctx.clearRect(0, 0, W(), H()); trazos(ctx, strokes, W(), H(), !!fijo); };
  const size = () => { const d = devicePixelRatio || 1; cv.width = W() * d; cv.height = H() * d; ctx.setTransform(d, 0, 0, d, 0, 0); draw(); };
  const pt = ev => { const r = wrap.getBoundingClientRect(); return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))]; };
  cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); curS = { c: getCol(), p: [pt(ev)] }; strokes.push(curS); const h = wrap.querySelector('.sbhint'); if (h) h.remove(); });
  cv.addEventListener('pointermove', ev => { if (!curS) return; const q = pt(ev), l = curS.p[curS.p.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.004) { curS.p.push([+q[0].toFixed(4), +q[1].toFixed(4)]); draw(); } });
  const fin = () => { if (curS) { curS = null; onChange(); } }; cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  size(); new ResizeObserver(size).observe(wrap);
  return { draw, pt };
}
function initDibujo() {
  W.x.dibujo = W.x.dibujo || [];
  const st = W.x.dibujo, lz = lienzo($('#sbw'), $('#sbc'), st, () => {}, () => 'fg', true);
  $('#sbUndo').onclick = () => { st.pop(); lz.draw(); };
  $('#sbClear').onclick = () => { st.length = 0; lz.draw(); };
}
function initMap(p, e) {
  if (!e.mapa) e.mapa = { strokes: [], stamps: [] };
  const m = e.mapa, cw = $('#cw'); let col = 'fg';
  const lz = lienzo(cw, $('#cv'), m.strokes, () => touch(p), () => col);
  function stampEl(s) {
    const [em, , c] = STAMP[s.t], el = document.createElement('div');
    el.className = 'stamp'; el.style.setProperty('--sc', `var(${c})`); el.innerHTML = `${em}<small>${esc(s.l)}</small>`;
    const place = () => { el.style.left = s.x * 100 + '%'; el.style.top = s.y * 100 + '%'; }; place();
    let last = 0;
    el.addEventListener('pointerdown', ev => {
      ev.stopPropagation(); el.setPointerCapture(ev.pointerId);
      const now = Date.now(); if (now - last < 350) { m.stamps.splice(m.stamps.indexOf(s), 1); el.remove(); touch(p); toast('Ícono quitado'); return; } last = now;
      el.onpointermove = mv => { const q = lz.pt(mv); s.x = Math.min(.95, Math.max(.05, q[0])); s.y = Math.min(.95, Math.max(.05, q[1])); place(); };
      el.onpointerup = () => { el.onpointermove = null; touch(p); };
    });
    cw.appendChild(el);
  }
  m.stamps.forEach(stampEl);
  scr.querySelectorAll('.sw[data-col]').forEach(b => b.onclick = () => { col = b.dataset.col; scr.querySelectorAll('.sw[data-col]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('#mUndo').onclick = () => { m.strokes.pop(); lz.draw(); touch(p); };
  $('#mClear').onclick = async () => { if (!await confirmar('¿Borrar el mapa?', 'Se quitan los trazos y los íconos.')) return; m.strokes.length = 0; m.stamps.length = 0; cw.querySelectorAll('.stamp').forEach(x => x.remove()); lz.draw(); touch(p); };
  scr.querySelectorAll('[data-stamp]').forEach(b => b.onclick = () => {
    const t = b.dataset.stamp; let l = STAMP[t][1]; if (t === 'per') l = 'P' + (m.stamps.filter(s => s.t === 'per').length + 1);
    const s = { t, l, x: .5, y: .5 }; m.stamps.push(s); stampEl(s); touch(p); toast('Arrástralo a su lugar');
  });
}

/* ---------- 15. PIN ---------- */
async function hash(t) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nexo:' + t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { let h = 0; for (const ch of 'nexo:' + t) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'x' + h; } }
function keypad(titulo, sub, onDone, cancelable) {
  const el = document.createElement('div'); el.className = 'lock';
  el.innerHTML = `${MARK}<h3 style="font-family:var(--f-display);margin:0;font-size:20px">${esc(titulo)}</h3><p style="margin:0;color:var(--muted)">${esc(sub)}</p><div class="pdots">${'<i></i>'.repeat(4)}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<span></span><button data-k="0">0</button><button data-k="del" aria-label="Borrar">⌫</button></div>${cancelable ? '<button class="btn b-neu mini" data-k="x">Cancelar</button>' : ''}`;
  let val = ''; const dots = () => el.querySelectorAll('.pdots i').forEach((d, i) => d.classList.toggle('on', i < val.length));
  el.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'x') { el.remove(); return; }
    if (k === 'del') val = val.slice(0, -1); else if (val.length < 4) val += k; dots();
    if (val.length === 4) { if (await onDone(val)) el.remove(); else { el.querySelector('.pdots').classList.add('shake'); setTimeout(() => { val = ''; dots(); el.querySelector('.pdots').classList.remove('shake'); }, 320); } }
  });
  $('#app').appendChild(el);
}
function pedirPin() { if (!db.ajustes.pin || document.querySelector('.lock')) return; keypad('NEXO Guion', 'Escribe tu PIN', async v => (await hash(v)) === db.ajustes.pin, false); }
function pinToggle() {
  if (db.ajustes.pin) keypad('Quitar PIN', 'Escribe tu PIN actual', async v => { if ((await hash(v)) !== db.ajustes.pin) return false; db.ajustes.pin = null; save(); render('ajustes', null, true); toast('PIN desactivado'); return true; }, true);
  else keypad('Nuevo PIN', 'Escribe 4 números', async v1 => { setTimeout(() => keypad('Repite el PIN', 'Escríbelo otra vez', async v2 => { if (v1 !== v2) { toast('No coinciden'); return false; } db.ajustes.pin = await hash(v2); save(); render('ajustes', null, true); toast('🔒 PIN activado'); return true; }, true), 50); return true; }, true);
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 60000) pedirPin(); });

/* ---------- 16. Tema ---------- */
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() { const t = db.ajustes.tema, dark = t === 'dark' || (t === 'auto' && mq.matches); document.documentElement.classList.toggle('dark', dark); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0B1114' : '#F4F7F8'; }
if (mq.addEventListener) mq.addEventListener('change', () => { applyTheme(); if (cur.name === 'mapa') render('mapa', cur.arg, true); });

/* ---------- 17. Toques ---------- */
document.getElementById('app').addEventListener('click', async ev => {
  const b = ev.target.closest('button');
  if (!b) { if (ev.target.hasAttribute && ev.target.hasAttribute('data-close')) closeModal(); return; }
  if (b.closest('.lock')) return;
  const d = b.dataset;
  const p = cur.arg && typeof cur.arg === 'string' ? proy(cur.arg) : null;

  /* --- asistentes --- */
  if (W && b.closest('#wiz')) {
    if (b.hasAttribute('data-wclose')) { cerrarWiz(); return; }
    if (b.hasAttribute('data-wprev')) { if (W.step) W.step--; W.kind === 'esc' ? drawEsc() : drawPlano(); return; }
    if (b.hasAttribute('data-wnext')) { const total = W.kind === 'esc' ? 3 : pasosPlano().length; if (W.step < total - 1) { W.step++; W.kind === 'esc' ? drawEsc() : drawPlano(); } else guardarWiz(); return; }
    if (d.act === 'planoMenu') { planoMenu(); return; }
    if (d.act === 'perNuevoW') { nuevoPersonaje(true); return; }
    if (d.eset) { W.e[d.eset] = d.v; drawEsc(); return; }
    if (d.erep) { const i = W.e.reparto.indexOf(d.erep); i >= 0 ? W.e.reparto.splice(i, 1) : W.e.reparto.push(d.erep); b.setAttribute('aria-pressed', i < 0); return; }
    if (d.xset) {
      W.x[d.xset] = d.v; b.parentElement.querySelectorAll('.op').forEach(x => x.setAttribute('aria-pressed', x === b));
      // Lógica fija: el tipo de plano decide la parte visible (menos "de espaldas" y "solo voz")
      if (d.xset === 'tipo') { const parte = PARTE_POR_PLANO[d.v]; W.x.quien.forEach(q => { if (q.parte !== 'De espaldas' && q.parte !== 'Solo voz') q.parte = parte; }); }
      return;
    }
    if (d.who !== undefined) { if (d.who === '') W.x.quien = []; else { const i = W.x.quien.findIndex(q => q.p === d.who); if (i >= 0) W.x.quien.splice(i, 1); else W.x.quien.push({ p: d.who, parte: PARTE_POR_PLANO[W.x.tipo] || 'Medio cuerpo', em: 'Serio', hace: '', dice: '' }); } drawPlano(); return; }
    if (d.qset) { const qi = +pasosPlano()[W.step].slice(3); W.x.quien[qi][d.qset] = d.v; b.parentElement.querySelectorAll('.op').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
    if (d.dur) { W.x.s = Math.max(1, W.x.s + +d.dur); wizEl.querySelector('.durstep b').textContent = W.x.s + ' s'; return; }
    return;
  }

  if (d.tab) { S.stack = []; render(d.tab); return; }
  if (b.hasAttribute('data-back')) { back(); return; }
  if (b.hasAttribute('data-close-btn')) { closeModal(); return; }
  if (b.id === 'fab') { quickIdea(); return; }
  if (d.open) { abrirProyecto(d.open); return; }
  if (d.go) { go(d.go); return; }
  if (d.replace) { const i = d.replace.indexOf(':'); render(d.replace.slice(0, i), d.replace.slice(i + 1)); return; }
  if (d.conv) { const i = db.ideas.find(x => x.id === d.conv); nuevoProyecto({ nombre: i.t, idea: i.id }); return; }
  if (d.idea) { ideaMenu(d.idea); return; }
  if (d.copy) { copiar(d.copy); return; }
  if (d.help) { ayuda(d.help); return; }

  switch (d.act) {
    case 'ideaSave': { const t = $('#ideaIn'); if (guardarIdea(t.value)) render('home', null, true); else t.focus(); return; }
    case 'nuevoProy': nuevoProyecto(); return;
    case 'nuevoVideo': nuevoProyecto({ cli: d.cli }); return;
    case 'proyMenu': proyMenu(); return;
    case 'capNuevo': { const n = await preguntar('Nuevo capítulo', `Capítulo ${p.caps.length + 1}`, '', 'Crear'); if (n) { p.caps.push({ id: uid(), nombre: n, beats: {}, escenas: [] }); S.cap = p.caps.length - 1; touch(p); render('proyecto', p.id, true); } return; }
    case 'escNueva': wizEscena(null); return;
    case 'escMenu': escMenu(); return;
    case 'escDet': escDet(); return;
    case 'planoNuevo': wizPlano(null); return;
    case 'map': go(`mapa:${p.id},${S.esc}`); return;
    case 'perNuevo': nuevoPersonaje(false); return;
    case 'pickHook': pickHook('Vender'); return;
    case 'pickHookF': pickHook('Ficción'); return;
    case 'ics': exportarICS(p); return;
    case 'pdfPlan': S.pdf.plan = !S.pdf.plan; render('pdf', cur.arg, true); return;
    case 'sharePdf': sharePdf(); return;
    case 'clienteSave': clienteSave(); return;
    case 'clienteDel': clienteDel(); return;
    case 'logoOff': S.form.logo = ''; render('clienteForm', cur.arg, true); return;
    case 'backupOut': backupOut(); return;
    case 'pinToggle': pinToggle(); return;
    case 'hookNew': { const t = await preguntar('Tu gancho', '', 'Ej.: Lo que nadie te dice de…', 'Agregar'); if (t) { db.ganchosPropios.unshift({ tipo: 'Propio', t, ej: t }); save(); render('ganchos', null, true); } return; }
    case 'undo': undo(); return;
    case 'wipe': if (await confirmar('¿Borrar TODOS los datos?', 'Se borran ideas, clientes y proyectos. Haz un respaldo antes.', 'Borrar todo')) { snapshot(); db = semilla(); db.proyectos = []; save(); applyTheme(); S.stack = []; render('home'); toast('Datos borrados', true); } return;
  }
  if (d.cap !== undefined) { S.cap = +d.cap; S.esc = 0; render('proyecto', cur.arg, true); return; }
  if (d.esc !== undefined) { S.esc = +d.esc; render('guion', cur.arg); return; }
  if (d.plano !== undefined) { wizPlano(+d.plano); return; }
  if (d.asig) { asignarBeat(d.asig); return; }
  if (d.ok) { const [ei, pi] = d.ok.split('|').map(Number), x = cont(p).escenas[ei].planos[pi]; x.ok = !x.ok; touch(p); const s = stats(cont(p)); render('rodaje', p.id, true); if (s.ok === s.pl && s.pl) { if (p.tipo === 'video' && p.st < 2) { p.st = 2; save(); } toast('✅ ¡Todos los planos grabados!'); } return; }
  if (d.st !== undefined) { p.st = +d.st; touch(p); render('rodaje', p.id, true); return; }
  if (d.pver) { S.pdf.ver = d.pver; render('pdf', cur.arg, true); return; }
  if (d.ftipo) { S.f.tipo = d.ftipo; render('home', null, true); return; }
  if (d.hcat) { S.hookCat = d.hcat; render('ganchos'); return; }
  if (d.hk !== undefined) { const h = todosGanchos()[S.hookCat].filter(h => !S.hookQ || (h.t + h.ej + h.tipo).toLowerCase().includes(S.hookQ.toLowerCase()))[+d.hk]; copiar(h.ej); return; }
  if (d.perdel) { const x = p.pers.find(y => y.id === d.perdel); menu(x.n, [{ t: 'Borrar personaje', ico: '🗑', cls: 'b-del', fn: () => { snapshot(); p.pers = p.pers.filter(y => y.id !== x.id); const limpia = e => { e.reparto = e.reparto.filter(id => id !== x.id); e.planos.forEach(pl => pl.quien = pl.quien.filter(q => q.p !== x.id)); }; p.escenas.forEach(limpia); p.caps.forEach(c => c.escenas.forEach(limpia)); touch(p); render('preparar', p.id, true); toast('Personaje borrado', true); } }]); return; }
  if (d.ccol) { S.form.c = d.ccol; rebindForm(); return; }
  if (b.classList.contains('chip')) {
    const g = b.parentElement;
    if (g.hasAttribute('data-tema')) { db.ajustes.tema = { 'Automático': 'auto', 'Claro': 'light', 'Oscuro': 'dark' }[d.val]; save(); applyTheme(); render('ajustes', null, true); return; }
    if (g.hasAttribute('data-cplan')) { S.form.plan = d.val === 'Sin plan' ? '' : d.val.replace(/ \(\d+\)$/, ''); rebindForm(); return; }
    const vk = g.dataset.vk;
    if (vk === 'cli') { p.cli = db.clientes.find(c => c.n === d.val).id; touch(p); render('idea', p.id, true); return; }
    if (vk === 'obj') { p.obj = d.val; touch(p); render('idea', p.id, true); return; }
    if (vk === 'redes') { const r = REDES.find(x => RED_TXT[x] === d.val), on = !p.redes.includes(r); if (!on && p.redes.length === 1) { toast('Debe quedar al menos una red'); return; } p.redes = on ? [...p.redes, r] : p.redes.filter(x => x !== r); touch(p); render('idea', p.id, true); return; }
    if (vk === 'generos') { const on = !p.generos.includes(d.val); p.generos = on ? [...p.generos, d.val] : p.generos.filter(x => x !== d.val); b.setAttribute('aria-pressed', on); touch(p); return; }
  }
});

/* ---------- 18. Escribir (se guarda solo) ---------- */
function autosize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function autosizeAll() { document.querySelectorAll('#screen textarea').forEach(autosize); }
function onEdit(ev) {
  const t = ev.target;
  if (t.tagName === 'TEXTAREA') autosize(t);
  /* asistentes */
  if (W && t.closest('#wiz')) {
    if (t.dataset.ein) W.e[t.dataset.ein] = t.value;
    if (t.dataset.xin) W.x[t.dataset.xin] = t.value;
    if (t.dataset.qin) { const qi = +pasosPlano()[W.step].slice(3); W.x.quien[qi][t.dataset.qin] = t.value; }
    return;
  }
  if (t.id === 'q') { S.f.q = t.value; const q = t.value.trim().toLowerCase(); const list = db.proyectos.filter(p => (S.f.tipo === 'todos' || p.tipo === S.f.tipo) && (!q || (p.nombre || '').toLowerCase().includes(q))).sort((a, b) => b.act - a.act); $('#plist').innerHTML = list.map(prow).join('') || '<p class="empty">Ningún proyecto con ese nombre.</p>'; return; }
  if (t.id === 'hq') { S.hookQ = t.value; const y = t.selectionStart; render('ganchos', null, true); const n = $('#hq'); n.focus(); n.setSelectionRange(y, y); return; }
  if (t.dataset.cf !== undefined && S.form) { S.form[t.dataset.cf] = t.value; if (t.dataset.cf === 'n') $('#fAv').innerHTML = av(t.value ? S.form : Object.assign({}, S.form, { n: '?' }), 64); return; }
  const p = typeof cur.arg === 'string' ? proy(cur.arg) : null; if (!p) return;
  if (t.dataset.pv) { p[t.dataset.pv] = t.value; touch(p); return; }
  if (t.dataset.beat) { const c = cont(p); c.beats = c.beats || {}; c.beats[t.dataset.beat] = t.value; touch(p); return; }
  if (t.dataset.pers) { const x = p.pers.find(y => y.id === t.dataset.pers); x[t.dataset.pf] = t.value; touch(p); return; }
}
document.getElementById('app').addEventListener('input', onEdit);
document.getElementById('app').addEventListener('change', ev => {
  if (ev.target.type === 'date' || ev.target.type === 'datetime-local') onEdit(ev);
  if (ev.target.id === 'fLogo' && ev.target.files[0]) leerLogo(ev.target.files[0]);
  if (ev.target.id === 'backupIn' && ev.target.files[0]) { backupIn(ev.target.files[0]); ev.target.value = ''; }
});
scr.addEventListener('keydown', ev => { if (ev.target.id === 'ideaIn' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (guardarIdea(ev.target.value)) render('home', null, true); } });

/* Teclado: mantener visible el campo donde escribes */
function mostrarCampo() { const el = document.activeElement; if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.closest('.lock')) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
let kbT; const kb = () => { clearTimeout(kbT); kbT = setTimeout(mostrarCampo, 120); };
addEventListener('resize', kb); if (window.visualViewport) visualViewport.addEventListener('resize', kb);
document.addEventListener('focusin', () => setTimeout(mostrarCampo, 350));

/* Botón "atrás" de Android */
if (isNative && Plug('App')) Plug('App').addListener('backButton', () => { if (document.querySelector('.lock')) return; if (!back()) Plug('App').exitApp(); });

/* Service worker (solo versión web) */
if (!isNative && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- 19. Arranque ---------- */
applyTheme();
render('home');
pedirPin();
window.__nexo = { db: () => db };
})();
