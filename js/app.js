/* ═══════════════════════════════════════════════════════════════════════
   Marine COP demo — the app.

   Plain JavaScript, no framework: a walkthrough demo, not the production
   build (React + TypeScript + Vite, CLAUDE.md §3).

   - S holds all UI state. Edits change the fixtures in memory; a reload
     resets the demo.
   - Each page has build() (skeleton, once) and paint() (fill regions).
     Pages with a map leave a `.map-slot`; CopMap moves the one shared map
     into it. paint() never touches the slot.
   - Selecting anything — on the map or in a list — opens a popup anchored
     to it on the map.
   - Clicks go through one delegated listener reading data-act.
   - Touch first: the demo runs on an iPad Air.
   ═══════════════════════════════════════════════════════════════════════ */

const S = {
  page: 'cop', live: true, ops: false, incId: '2026-041',
  sel: null,                       // {kind, id} — what the map popup shows
  /* Cultural buffers default ON here so the scenario reads at a glance.
     Production defaults them off (CLAUDE.md §2). */
  layers: { inc: true, traj: true, obs: true, grs: true, eqf: true, eqd: true, cult: true, arch: false, cur: false, bathy: false, alerts: false },
  layersCollapsed: false, ctxOpen: false, copVP: null,
  doc: null,                       // {kind: 'grs'|'plan', id} open in the drawer
  incTab: 'timeline', op201: null,
  logQuery: '', closedOpen: false,
  assetFilter: 'All',
  pick: null,                      // crew id picked for tap-to-assign
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = d => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${+dd} ${MON[m - 1]} ${y}`; };
const fmtDT = s => { if (!s) return '—'; const [d, t] = s.split(' '); const [, m, dd] = d.split('-'); return `${+dd} ${MON[m - 1]}${t ? ' ' + t : ''}`; };
const daysUntil = d => Math.round((new Date(d + 'T00:00') - new Date(DEMO_DATE + 'T00:00')) / 864e5);
const km = ([lo1, la1], [lo2, la2]) => {
  const r = x => x * Math.PI / 180, h = Math.sin(r(la2 - la1) / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const fmtN = n => n.toLocaleString('en-CA');
const centroid = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const incidents = () => INCIDENTS.filter(i => S.live || i.id !== '2026-041');
const actives = () => incidents().filter(i => i.status === 'Active');
const incById = id => incidents().find(i => i.id === id);
const crewById = id => CREW.find(c => c.id === id);
const grsById = id => GRS.find(g => g.id === id);
const eqById = id => EQUIPMENT.find(e => e.id === id);
const obsById = id => Object.values(OBSERVATIONS).flat().find(o => o.id === id);
const latest = arr => [...(arr || [])].sort((a, b) => b.op - a.op)[0];
const condCls = c => ({ 'Ready': 'ready', 'Service due': 'due', 'Out of service': 'out' }[c]);
const certState = d => { const n = daysUntil(d); return n < 0 ? 'exp' : n <= 30 ? 'soon' : ''; };
const LEVEL = { territorial: 'Territorial', sub_regional: 'Sub-regional', nsb: 'Northern Shelf Bioregion', toolkit: 'Toolkit' };
const incExpr = (includeClosed, alsoId) => {
  const p = [];
  if (!includeClosed) p.push(`(status <> 'Closed'${alsoId ? ` OR id = '${alsoId}'` : ''})`);
  if (!S.live) p.push(`id <> '2026-041'`);
  return p.join(' AND ') || '1=1';
};
const pulse = () => actives()[0]?.at || null;
const ALL_OFF = { inc: false, traj: false, obs: false, grs: false, eqf: false, eqd: false, cult: false, arch: false, cur: false, bathy: false, alerts: false };
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }

/* ═══════════════════════════════════════════════════════════════════════
   Frame
   ═══════════════════════════════════════════════════════════════════════ */
const NAV = [['cop', 'COP'], ['incident', 'Incident'], ['log', 'Log'], ['assets', 'Assets'], ['crew', 'Crew'], ['grs', 'GRS'], ['plans', 'Plans']];
function renderFrame() {
  $('#rail-nav').innerHTML = NAV.map(([k, l]) =>
    `<button data-act="page" data-p="${k}" class="${S.page === k ? 'on' : ''}">${ui(k)}${l}${k === 'incident' && actives().length ? '<i class="badge"></i>' : ''}</button>`).join('');
  const sel = incById(S.incId), live = actives().length > 0;
  $('#switcher').classList.toggle('live', live);
  $('#switcher-btn').innerHTML = `${live ? '<span class="livetag">Live</span>' : ''}<span class="lbl">${sel ? esc(sel.name) : 'No active incident'}</span>${sel ? `<span class="pill ${sel.status}">${sel.status}</span>` : ''}${ui('chevron')}`;
  $('#democtl').innerHTML = `<span class="cat">Demo scenario</span><div class="seg">
    <button data-act="live" data-v="1" class="${S.live ? 'on' : ''}">Live incident</button><button data-act="live" data-v="0" class="${!S.live ? 'on' : ''}">Readiness</button></div>`;
  $('#theme-btn').innerHTML = ui(S.ops ? 'sun' : 'moon');
  $('#theme-btn').setAttribute('aria-label', S.ops ? 'Light theme' : 'Dark ops theme');
  document.body.classList.toggle('ops', S.ops);
}
function renderMenu() {
  const list = incidents().filter(i => i.status !== 'Closed');
  $('#switch-menu').innerHTML = list.map(i => `<button data-act="open-inc" data-id="${i.id}" class="${i.id === S.incId ? 'on' : ''}"><span class="dot ${i.status}"></span>
      <span><b>${esc(i.name)}</b><span class="sub">INC ${i.id} · ${esc(i.type)}</span></span><span class="pill ${i.status}">${i.status}</span></button>`).join('')
    + `<button data-act="page" data-p="log" style="grid-template-columns:1fr"><span class="muted">All incidents →</span></button>`;
}
function tickClock() {
  const d = new Date();
  $('#clock').innerHTML = `<b>${d.toTimeString().slice(0, 5)}</b><span>${d.toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   Map popups — one card per kind of feature, anchored to it on the map
   ═══════════════════════════════════════════════════════════════════════ */
function anchorOf(kind, id, tapAt) {
  if (kind === 'inc') return incById(id)?.at;
  if (kind === 'grs') return grsById(id)?.at;
  if (kind === 'eq') return eqById(id)?.at;
  if (kind === 'obs') return obsById(id)?.at;
  if (kind === 'alert') return ALERTS.find(a => a.id === id)?.at;
  if (kind === 'cult') return CULTURAL.find(c => c.id === id)?.at;
  return tapAt || ARCH.find(a => a.id === id)?.ring[0];
}
function popupHTML(kind, id) {
  const x = `<button class="x" data-act="close-pop" aria-label="Close">${ui('close')}</button>`;
  const kv = rows => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const card = (cls, inner) => `<div class="card ${cls}"><div class="bar"></div><div class="body">${x}${inner}</div></div>`;
  if (kind === 'inc') {
    const i = incById(id); if (!i) return '';
    const near = i.status !== 'Closed' ? CULTURAL.map(c => km(i.at, c.at)).sort((a, b) => a - b)[0] : null;
    const onIt = S.page === 'incident' && S.incId === i.id;
    return card(i.status, `<div class="cat"><span class="pill ${i.status}">${i.status}</span>&nbsp; INC ${i.id}</div><h3>${esc(i.name)}</h3><div class="sub">${esc(i.type)}</div>
      ${kv([['Product', `${esc(i.product)} · ${esc(i.released)}`], ['Severity tier', i.tier], ['Reported', fmtDT(i.reported)]])}
      ${near != null && near < 3 ? `<div class="flag">Cultural buffer ${near.toFixed(1)} km away</div>` : ''}
      ${onIt ? '' : `<div class="actions"><button class="btn sm primary" data-act="open-inc" data-id="${i.id}">Open incident</button></div>`}`);
  }
  if (kind === 'grs') {
    const g = grsById(id), stale = !g.exercised || daysUntil(g.exercised) < -365;
    return card('violet', `<div class="cat">GRS · ${g.strategy}</div><h3>${esc(g.name)}</h3><div class="sub">${g.id.replace('DEMO-', '')}</div>
      ${kv([['Boom', `${g.boom} · ${g.anchors} anchors`], ['Tide', g.tide], ['Exercised', g.exercised ? fmtD(g.exercised) : 'Never']])}
      ${stale ? `<div class="flag warn">${g.exercised ? 'Not exercised in 12 months' : 'Never exercised'}</div>` : ''}
      <div class="actions"><button class="btn sm primary" data-act="doc" data-kind="grs" data-id="${g.id}">${ui('doc')}Strategy sheet</button></div>`);
  }
  if (kind === 'eq') {
    const e = eqById(id);
    return card('copper', `<div class="cat">${e.cat === 'Fixed' ? 'Cache' : e.type}</div><h3>${esc(e.name)}</h3><div class="sub">${esc(e.qty)}</div>
      ${kv([['Status', `<span class="pill ${condCls(e.cond)}">${e.cond}</span>`], ['Location', esc(e.base)], ['Service', fmtD(e.service)]])}
      ${S.page !== 'assets' ? `<div class="actions"><button class="btn sm" data-act="open-asset" data-id="${e.id}">View in Assets</button></div>` : ''}`);
  }
  if (kind === 'cult' || kind === 'arch') {
    return card('coral', `<div class="cat">${kind === 'cult' ? 'Cultural sensitivity' : 'Archaeological site'} &nbsp;<span class="pill fict">Fictitious</span></div>
      <h3>Sensitive area</h3><p class="muted">Invented for this demo. Not a real site and not drawn from any cultural data.</p>`);
  }
  if (kind === 'obs') {
    const o = obsById(id);
    return card('', `<div class="cat">Observation · ${esc(o.type)}</div><h3 style="font-size:1rem">${esc(o.text)}</h3><div class="sub">${fmtDT(o.t)} · ${esc(o.by)}</div>`);
  }
  if (kind === 'alert') {
    const a = ALERTS.find(x => x.id === id);
    return card('ink', `<div class="cat">Marine alert</div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p>`);
  }
  return '';
}
/* Select a feature: highlight, popup, and let the page react (list rows etc.). */
function select(kind, id, tapAt, { fly = false } = {}) {
  if (!kind || kind === 'cur' || kind === 'traj') { clearSel(); return; }
  S.sel = { kind, id };
  const at = anchorOf(kind, id, tapAt);
  CopMap.highlight(kind, id);
  if (fly && at) CopMap.goTo(at, { zoom: kind === 'inc' ? 13.3 : 14 });
  CopMap.showPopup(popupHTML(kind, id), at);
  PAGES[S.page].onSelect?.();
}
function clearSel() { S.sel = null; CopMap.hidePopup(); CopMap.highlight(null); PAGES[S.page].onSelect?.(); }
CopMap.onSelect((kind, id, at) => select(kind, id, at));

/* ═══════════════════════════════════════════════════════════════════════
   Document drawer — fake and real PDFs alike, rendered with PDF.js
   ═══════════════════════════════════════════════════════════════════════ */
const PDF_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const PDF_FONTS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/';  // Helvetica etc. for PDFs that don't embed fonts
const docCache = {};
function docUrl({ kind, id }) {
  const key = kind + ':' + id;
  if (!docCache[key]) {
    if (kind === 'grs') docCache[key] = PDF.grs(grsById(id));
    else { const p = PLANS.find(x => x.id === id); docCache[key] = p.file || PDF.plan(p, { territorial: '#1f8f76', sub_regional: '#b0632f', nsb: '#7a68b8', toolkit: '#5b7f95' }[p.tier]); }
  }
  return docCache[key];
}
function renderDrawer() {
  const el = $('#drawer');
  if (!S.doc) { el.innerHTML = ''; return; }
  const g = S.doc.kind === 'grs' ? grsById(S.doc.id) : null, p = g ? null : PLANS.find(x => x.id === S.doc.id);
  el.innerHTML = `<div class="drawer"><div class="vh"><div class="t"><div class="cat">${g ? 'Strategy sheet · ' + g.id.replace('DEMO-', '') : LEVEL[p.tier] + ' · ' + p.version}</div><b>${esc(g ? g.name + ' — ' + g.strategy : p.title)}</b></div>
    <button class="iconbtn" data-act="close-doc" aria-label="Close document">${ui('close')}</button></div><div class="pdfpages"></div></div>`;
  showPdf(docUrl(S.doc), $('#drawer .pdfpages'));
}
let pdfWorkerReady = false;
async function showPdf(url, el) {
  if (!window.pdfjsLib) { el.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:0"></iframe>`; return; }
  if (!pdfWorkerReady) {
    /* The worker is cross-origin on the CDN; a same-origin blob that imports it is allowed. */
    pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(new Blob([`importScripts('${PDF_WORKER}')`], { type: 'text/javascript' })));
    pdfWorkerReady = true;
  }
  const token = (el._token = {});
  el.innerHTML = '<div class="msg">Loading document…</div>';
  try {
    const doc = await pdfjsLib.getDocument({ url, standardFontDataUrl: PDF_FONTS }).promise;
    if (el._token !== token) return;
    el.innerHTML = '';
    const width = el.clientWidth - 24, dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Pages render as they scroll into view, so a long plan opens instantly. */
    const io = new IntersectionObserver(entries => entries.forEach(async en => {
      if (!en.isIntersecting || en.target._done) return;
      en.target._done = true; io.unobserve(en.target);
      const page = await doc.getPage(+en.target.dataset.n), vp = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * dpr });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      en.target.style.minHeight = ''; en.target.appendChild(c);
    }), { root: el, rootMargin: '400px' });
    const first = (await doc.getPage(1)).getViewport({ scale: 1 });
    for (let n = 1; n <= doc.numPages; n++) {
      const pg = document.createElement('div'); pg.className = 'pg'; pg.dataset.n = n;
      pg.style.minHeight = (width * first.height / first.width) + 'px';
      el.appendChild(pg); io.observe(pg);
    }
  } catch (err) { el.innerHTML = `<div class="msg">Could not open this document.</div>`; }
}

/* ═══════════════════════════════════════════════════════════════════════
   COP — map hero, layer panel, bottom bar
   ═══════════════════════════════════════════════════════════════════════ */
const fillSw = (bg, border) => `<span class="fillsw" style="background:${bg};border:1.5px ${border}"></span>`;
const LAYER_GROUPS = [
  ['Operations', null, [
    ['inc', 'Incidents', () => swatch(ICON.incident('Active', 1))],
    ['traj', 'Sheen extent', () => fillSw('rgba(224,138,30,.35)', 'dashed #e08a1e'), true],
    ['obs', 'Field observations', () => swatch(ICON.observation())],
    ['grs', 'GRS sites', () => swatch(ICON.grs())],
    ['eqf', 'Caches', () => swatch(ICON.equipment('Fixed', 'Cache', 'Ready'))],
    ['eqd', 'Vessels and boom', () => swatch(ICON.equipment('Deployable', 'Vessel', 'Ready'))]]],
  ['Sensitive', 'Fictitious', [
    ['cult', 'Cultural sites', () => swatch(ICON.cultural())],
    ['arch', 'Archaeological', () => fillSw('repeating-linear-gradient(135deg,#b03a29 0 1.5px,transparent 1.5px 5px)', 'solid #b03a29')]]],
  ['Context', null, [
    ['cur', 'Currents', () => `<img class="sw" style="width:11px;height:18px;transform:rotate(60deg)" src="${ICON.current()}" alt="">`],
    ['bathy', 'Bathymetry', () => fillSw('linear-gradient(90deg,#cfe3ea,#5f8fa8)', 'solid #5f8fa8')],
    ['alerts', 'Marine alerts', () => swatch(ICON.alert())]]],
];
const copPage = {
  build: () => `<div class="coppage"><div class="mapwrap"><div class="map-slot"></div><aside class="float layers" id="cop-layers"></aside></div><div class="strip" id="dock"></div></div>`,
  map: () => ({ visible: { ...S.layers, traj: S.layers.traj && S.live }, incidentExpr: incExpr(false), obsFor: S.live ? '2026-041' : null, live: S.live, pulse: pulse(),
    padding: { left: S.layersCollapsed ? 0 : 264, top: 0, right: 0, bottom: 0 }, goTo: S.copVP || 'home', instant: !!S.copVP, select: null }),
  paint() {
    const lp = $('#cop-layers');
    lp.classList.toggle('collapsed', S.layersCollapsed);
    lp.innerHTML = S.layersCollapsed
      ? `<div class="hd"><button data-act="collapse" aria-label="Show layers">${ui('layers')}</button></div>`
      : `<div class="hd">${ui('layers')}<b>Layers</b><button data-act="collapse" aria-label="Hide layers">${ui('close')}</button></div>
      <div class="scroll"><div class="seg">${['sat', 'gray'].map(k => `<button data-act="basemap" data-v="${k}" class="${CopMap.basemap === k ? 'on' : ''}">${k === 'sat' ? 'Satellite' : 'Light grey'}</button>`).join('')}</div>
      ${LAYER_GROUPS.map(([name, tag, items]) => { const fold = name === 'Context', open = !fold || S.ctxOpen;
        return (fold ? `<button class="grp fold" data-act="ctx"><span class="cat">${name}</span>${ui('chevron', open ? '' : 'shut')}</button>` : `<div class="grp"><span class="cat">${name}</span>${tag ? `<span class="pill fict">${tag}</span>` : ''}</div>`)
        + (!open ? '' : items.map(([key, label, sw, liveOnly]) => { const dis = liveOnly && !S.live, on = S.layers[key] && !dis;
          return `<label class="lrow ${on ? '' : 'off'} ${dis ? 'dis' : ''}"><span class="swbox">${sw()}</span><span class="nm">${label}</span><input type="checkbox" class="toggle" data-layer="${key}" ${on ? 'checked' : ''}></label>`; }).join('')); }).join('')}</div>`;
    paintDock();
  },
};
function paintDock() {
  const a = actives()[0], dock = $('#dock');
  const cell = (attrs, k, v, d, cls = '') => `<button class="cell ${cls}" ${attrs}><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></button>`;
  dock.className = 'strip' + (a ? ' ops' : '');
  if (a) {
    const open = (TASKS[a.id] || []).filter(t => t.status !== 'Complete'), obs = [...(OBSERVATIONS[a.id] || [])].sort((x, y) => y.t.localeCompare(x.t)), g = grsById(a.grs);
    dock.innerHTML = cell(`data-act="open-inc" data-id="${a.id}" style="flex:1.8"`, `Active incident · severity tier ${a.tier}`, esc(a.name), `INC ${a.id} · ${esc(a.product)}`, 'opsid')
      + cell(`data-act="inc-tab" data-tab="ics201"`, 'Op period', `OP ${a.opPeriod}`, 'ICS 201 at 06:40')
      + cell(`data-act="inc-tab" data-tab="tasks"`, 'Open tasks', open.length, `${open.filter(t => !t.who).length} unassigned`)
      + cell(`data-act="inc-tab" data-tab="obs"`, 'Observations', obs.length, obs[0] ? 'last ' + obs[0].t.slice(11) : '')
      + cell(`data-act="doc" data-kind="grs" data-id="${g.id}"`, 'Nearest GRS', esc(g.name), g.id.replace('DEMO-', '') + ' · ' + g.strategy)
      + `<div class="act"><button class="btn primary" data-act="open-inc" data-id="${a.id}">Open incident →</button></div>`;
    dock.style.gridTemplateColumns = '1.7fr 1fr 1fr 1fr 1.2fr auto';
    return;
  }
  dock.style.gridTemplateColumns = '';
  const ready = EQUIPMENT.filter(e => e.cond === 'Ready'), vessels = EQUIPMENT.filter(e => e.type === 'Vessel');
  const certs = CREW.flatMap(c => c.certs.map(([, d]) => certState(d))), attention = EQUIPMENT.filter(e => e.cond !== 'Ready');
  const mon = incidents().filter(i => i.status === 'Monitoring');
  dock.innerHTML = cell('data-act="page" data-p="assets"', 'Boom ready', `${fmtN(ready.reduce((s, e) => s + e.boomFt, 0))} <small>ft</small>`, 'staged across the Broughton')
    + cell('data-act="page" data-p="assets"', 'Vessels ready', `${vessels.filter(v => v.cond === 'Ready').length}<small> / ${vessels.length}</small>`, 'response vessels')
    + cell('data-act="page" data-p="crew"', 'Crew available', `${CREW.filter(c => c.avail === 'Available').length}<small> / ${CREW.length}</small>`, 'Guardians and staff')
    + cell('data-act="page" data-p="crew"', 'Certifications', certs.filter(x => x === 'exp').length + certs.filter(x => x === 'soon').length, `${certs.filter(x => x === 'exp').length} expired · ${certs.filter(x => x === 'soon').length} within 30 days`, 'flag-c')
    + cell('data-act="page" data-p="assets"', 'Equipment', attention.length, 'need service', attention.length ? 'flag-c' : '')
    + cell(mon[0] ? `data-act="open-inc" data-id="${mon[0].id}"` : '', 'Monitoring', mon.length, mon.map(i => esc(i.name)).join(', ') || 'none');
}

/* ═══════════════════════════════════════════════════════════════════════
   Incident project view
   ═══════════════════════════════════════════════════════════════════════ */
function currentInc() {
  let i = incById(S.incId);
  if (!i) { i = actives()[0] || incidents().find(x => x.status === 'Monitoring') || incidents()[0]; S.incId = i.id; }
  return i;
}
const INC_TABS = [['timeline', 'Timeline'], ['ics201', 'ICS 201'], ['ics209', 'ICS 209'], ['obs', 'Field obs'], ['tasks', 'Tasks'], ['resources', 'Resources']];
const incPage = {
  build: () => `<div class="incpage"><header class="inchead" id="inchead"></header>
    <div class="incbody"><div class="incmap"><div class="mapbox"><div class="map-slot"></div></div><div class="strip" id="opsstrip"></div></div>
    <section class="incpanel"><nav class="tabs" id="inctabs"></nav><div class="tabbody" id="tabbody"></div></section></div></div>`,
  map() {
    const i = currentInc();
    return { visible: { ...ALL_OFF, inc: true, traj: S.live, obs: true, grs: true, eqf: true, eqd: true, cult: S.layers.cult, arch: S.layers.arch, alerts: S.layers.alerts },
      incidentExpr: incExpr(false, i.id), obsFor: i.id, live: S.live, pulse: i.status === 'Active' ? i.at : null,
      padding: { left: 0, top: 0, right: 0, bottom: 0 }, select: null,
      /* centre the live incident with what it threatens: nearby buffers and its strategy site */
      goTo: i.status === 'Active' ? centroid([i.at, grsById(i.grs).at, ...CULTURAL.filter(c => km(i.at, c.at) < 3).map(c => c.at)]) : i.at, zoom: 13.6 };
  },
  paint() {
    const i = currentInc();
    $('#inchead').className = `inchead ${i.status}`;
    $('#inchead').innerHTML = `<h2>${esc(i.name)} <span class="pill ${i.status}">${i.status}</span></h2>
      <div class="facts"><div><span>Incident</span>INC ${i.id}</div><div><span>Type</span>${esc(i.type)}</div><div><span>Product</span>${esc(i.product)}</div>
        <div><span>Severity tier</span>${i.tier}</div><div><span>IC</span>${esc(i.ic)}</div><div><span>Reported</span>${fmtDT(i.reported)}</div></div>
      ${i.grs ? `<button class="btn sm" data-act="doc" data-kind="grs" data-id="${i.grs}">${ui('doc')}Strategy sheet</button>` : ''}`;
    const tasks = TASKS[i.id] || [], res = RESOURCES[i.id] || [], obs = OBSERVATIONS[i.id] || [], r201 = latest(ICS201[i.id]);
    const cell = (tab, k, v) => `<button class="cell" data-act="inc-tab" data-tab="${tab}"><span class="k">${k}</span><span class="v">${v}</span></button>`;
    $('#opsstrip').innerHTML = cell('tasks', 'Open tasks', tasks.filter(t => t.status !== 'Complete').length) + cell('resources', 'Resources', res.filter(r => /On scene|Deployed|Patrol/.test(r.status)).length)
      + cell('obs', 'Observations', obs.length) + cell('ics201', 'Latest ICS 201', r201 ? 'OP ' + r201.op : '—');
    $('#inctabs').innerHTML = INC_TABS.map(([k, l]) => `<button data-act="inc-tab" data-tab="${k}" class="${S.incTab === k ? 'on' : ''}">${l}</button>`).join('');
    $('#tabbody').innerHTML = ({ timeline: tabTimeline, ics201: tab201, ics209: tab209, obs: tabObs, tasks: tabTasks, resources: tabResources })[S.incTab](i);
  },
  onSelect() { if (S.incTab === 'obs') $$('.obscard').forEach(c => c.classList.toggle('sel', S.sel?.kind === 'obs' && c.dataset.id === S.sel.id)); },
};
function tabTimeline(i) {
  const items = [
    ...(ACTIVITY[i.id] || []).map(a => ({ t: a.t, cls: '', html: esc(a.text) })),
    ...(OBSERVATIONS[i.id] || []).map(o => ({ t: o.t, cls: 'obs', html: `<button data-act="obs" data-id="${o.id}">${esc(o.type)}: ${esc(o.text)}</button>` })),
    ...(ICS201[i.id] || []).map(r => ({ t: r.submitted, cls: 'form', html: `<button class="link" data-act="op201" data-op="${r.op}">ICS 201 · OP ${r.op} briefing</button>` })),
    ...(ICS209[i.id] || []).map(r => ({ t: r.submitted, cls: 'form', html: `<button class="link" data-act="inc-tab" data-tab="ics209">ICS 209 · OP ${r.op} status</button>` })),
  ].sort((a, b) => b.t.localeCompare(a.t));
  if (!items.length) return '<div class="empty">No activity recorded.</div>';
  let day = '';
  return '<ul class="timeline">' + items.map(it => {
    const d = it.t.slice(0, 10), head = d !== day ? `<li class="day">${fmtD(d)}</li>` : ''; day = d;
    return head + `<li class="${it.cls}"><div class="when">${it.t.slice(11)}</div>${it.html}</li>`;
  }).join('') + '</ul>';
}
const opChips = (list, cur) => list.length > 1 ? `<div class="opchips">${[...list].sort((a, b) => b.op - a.op).map((r, k) =>
  `<button class="btn sm ${r.op === cur ? 'primary' : ''}" data-act="op201" data-op="${r.op}">OP ${r.op}${k === 0 ? ' · latest' : ''}</button>`).join('')}</div>` : '';
function tab201(i) {
  const list = ICS201[i.id]; if (!list) return '<div class="empty">No ICS 201 submitted.</div>';
  const r = list.find(x => x.op === S.op201) || latest(list);
  const org = i.id === '2026-041' ? ORG.map(o => `<div><span class="muted">${o.pos}:</span> ${o.who ? esc(crewById(o.who).name) : '<span class="vac">vacant</span>'}</div>`).join('') : `<div>${esc(i.ic)}, IC</div>`;
  return opChips(list, r.op) + `<article class="doc ${i.status}">
    <div class="dh"><div><div class="cat">ICS 201 · Incident Briefing</div><h3>${esc(i.name)} · OP ${r.op}</h3></div><div class="meta">${esc(r.period)}<br>${esc(r.by)} · ${fmtDT(r.submitted)}</div></div>
    <div class="sec"><span>Situation</span><p>${esc(r.situation)}</p></div>
    <div class="sec"><span>Objectives</span><ol>${r.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ol></div>
    <div class="sec"><span>Actions taken</span><table>${r.actions.map(([t, a]) => `<tr><td class="mono" style="width:56px">${t}</td><td>${esc(a)}</td></tr>`).join('')}</table></div>
    <div class="sec"><span>Planned</span><ul>${r.planned.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
    <div class="sec"><span>Organization</span><div class="org">${org}</div></div>
    <div class="sec"><span>Weather and tides</span><p>${esc(r.weather)}</p></div>
    <div class="sec"><span>Safety</span><p>${esc(r.safety)}</p></div></article>`;
}
function tab209(i) {
  const r = latest(ICS209[i.id]); if (!r) return '<div class="empty">No ICS 209 submitted.</div>';
  return `<article class="doc ${i.status}"><div class="dh"><div><div class="cat">ICS 209 · Status Summary</div><h3>${esc(i.name)} · OP ${r.op}</h3></div><div class="meta">${fmtDT(r.submitted)}</div></div>
    <table style="margin-top:10px">${r.kv.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table></article>`;
}
function tabObs(i) {
  const list = [...(OBSERVATIONS[i.id] || [])].sort((a, b) => b.t.localeCompare(a.t));
  if (!list.length) return '<div class="empty">No field submissions.</div>';
  return list.map(o => `<button class="obscard ${S.sel?.id === o.id ? 'sel' : ''}" data-act="obs" data-id="${o.id}"><div class="cat">${esc(o.type)} · ${fmtDT(o.t)} · ${esc(o.by)}</div><div>${esc(o.text)}</div></button>`).join('');
}
const opt = (vals, cur, label = v => v || '—') => vals.map(v => `<option ${v === cur ? 'selected' : ''} value="${esc(v)}">${esc(label(v))}</option>`).join('');
function tabTasks(i) {
  const list = TASKS[i.id] || [];
  return `<table class="t"><thead><tr><th>Task</th><th style="width:124px">Status</th><th style="width:140px">Assigned</th></tr></thead><tbody>
    ${list.map((t, k) => `<tr><td><input type="text" value="${esc(t.title)}" data-edit="task" data-k="${k}" data-f="title"></td>
      <td><select data-edit="task" data-k="${k}" data-f="status">${opt(['Not started', 'In progress', 'Complete'], t.status)}</select></td>
      <td><select data-edit="task" data-k="${k}" data-f="who">${opt(['', ...CREW.map(c => c.name)], t.who)}</select></td></tr>`).join('')}
    </tbody></table><div class="actions"><button class="btn sm" data-act="add-task">${ui('plus')}Add task</button></div>`;
}
function tabResources(i) {
  const list = RESOURCES[i.id] || [];
  if (!list.length) return '<div class="empty">No resources assigned.</div>';
  return `<table class="t"><thead><tr><th>Resource</th><th>Qty</th><th style="width:140px">Status</th></tr></thead><tbody>
    ${list.map((r, k) => `<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td><select data-edit="res" data-k="${k}">${opt(['Requested', 'En route', 'Staged', 'On scene', 'Deployed', 'Patrol', 'Released'], r.status)}</select></td></tr>`).join('')}
    </tbody></table>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   Log
   ═══════════════════════════════════════════════════════════════════════ */
const logPage = {
  build: () => `<div class="split"><div class="listcol"><h2 class="h2">Incidents</h2>
      <div class="search">${ui('search')}<input id="logq" placeholder="Search" value="${esc(S.logQuery)}" autocomplete="off"></div><div id="loglist"></div></div>
    <div class="mapcol"><div class="map-slot"></div></div></div>`,
  map: () => ({ visible: { ...ALL_OFF, inc: true, traj: S.live }, incidentExpr: incExpr(true), live: S.live, pulse: pulse(),
    padding: { left: 0, top: 0, right: 0, bottom: 0 }, goTo: incidents().map(i => i.at), select: null }),
  paint() {
    const q = S.logQuery.toLowerCase();
    const list = incidents().filter(i => !q || [i.id, i.name, i.type, i.product].join(' ').toLowerCase().includes(q));
    const row = i => `<button class="row ${S.sel?.kind === 'inc' && S.sel.id === i.id ? 'sel' : ''}" data-act="sel" data-kind="inc" data-id="${i.id}" id="row-${i.id}"><span class="stripe ${i.status}"></span>
      <span><h4>${esc(i.name)}</h4><div class="small">INC ${i.id} · ${esc(i.type)} · ${fmtDT(i.reported)}</div></span><span class="pill ${i.status}">${i.status}</span></button>`;
    const open = list.filter(i => i.status !== 'Closed'), closed = list.filter(i => i.status === 'Closed'), showClosed = S.closedOpen || !!q;
    $('#loglist').innerHTML = `<div class="grouphead cat">Open</div>${open.map(row).join('') || '<div class="empty">None open.</div>'}
      <div class="grouphead"><button class="cat" data-act="toggle-closed">${ui('chevron')}Closed · ${closed.length}</button></div>${showClosed ? closed.map(row).join('') : ''}`;
    if (!showClosed) $('#loglist [data-act="toggle-closed"] .ico').style.transform = 'rotate(-90deg)';
  },
  onSelect() {
    if (S.sel?.kind === 'inc' && incById(S.sel.id)?.status === 'Closed' && !S.closedOpen) S.closedOpen = true;
    logPage.paint(); if (S.sel) $('#row-' + S.sel.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   Assets
   ═══════════════════════════════════════════════════════════════════════ */
const assetPage = {
  build: () => `<div class="page pad"><div class="strip boxed" id="assetstats"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><h2 class="h2" style="margin:0;flex:1">Equipment</h2><div class="chips" id="assetfilter"></div></div>
      <div class="assetgrid"><div class="tablewrap" id="assettable"></div><div class="mapcard"><div class="map-slot"></div></div></div></div>`,
  map: () => ({ visible: { ...ALL_OFF, eqf: S.assetFilter !== 'Deployable', eqd: S.assetFilter !== 'Fixed' }, pulse: null,
    padding: { left: 0, top: 0, right: 0, bottom: 0 }, goTo: EQUIPMENT.map(e => e.at), select: null }),
  paint() {
    const ready = EQUIPMENT.filter(e => e.cond === 'Ready'), vessels = EQUIPMENT.filter(e => e.type === 'Vessel');
    const st = (k, v, cls = '') => `<div class="cell ${cls}"><span class="k">${k}</span><span class="v">${v}</span></div>`;
    $('#assetstats').innerHTML = st('Boom ready', `${fmtN(ready.reduce((s, e) => s + e.boomFt, 0))} <small>ft</small>`) + st('Vessels ready', `${vessels.filter(v => v.cond === 'Ready').length}<small> / ${vessels.length}</small>`)
      + st('Service due', EQUIPMENT.filter(e => e.cond === 'Service due').length, 'flag-c') + st('Out of service', EQUIPMENT.filter(e => e.cond === 'Out of service').length, 'flag-r');
    $('#assetfilter').innerHTML = ['All', 'Fixed', 'Deployable'].map(f => `<button data-act="asset-filter" data-v="${f}" class="${S.assetFilter === f ? 'on' : ''}">${f}</button>`).join('');
    const list = EQUIPMENT.filter(e => S.assetFilter === 'All' || e.cat === S.assetFilter);
    $('#assettable').innerHTML = `<table class="t"><thead><tr><th></th><th>Item</th><th>Location</th><th style="width:150px">Condition</th><th>Service</th></tr></thead><tbody>
      ${list.map(e => `<tr class="tap ${S.sel?.id === e.id ? 'sel' : ''}" data-act="sel" data-kind="eq" data-id="${e.id}" id="row-${e.id}">
        <td style="width:40px">${swatch(ICON.equipment(e.cat, e.type, e.cond))}</td><td><b>${esc(e.name)}</b><div class="small">${esc(e.qty)}</div></td><td>${esc(e.base)}</td>
        <td><select class="condsel ${condCls(e.cond)}" data-edit="cond" data-id="${e.id}">${opt(['Ready', 'Service due', 'Out of service'], e.cond)}</select></td>
        <td><span class="chip ${certState(e.service)}">${fmtD(e.service)}</span></td></tr>`).join('')}</tbody></table>`;
  },
  onSelect() { assetPage.paint(); if (S.sel) $('#row-' + S.sel.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
};

/* ═══════════════════════════════════════════════════════════════════════
   Crew — roster, and an ICS org chart you assign by drag or by tap
   ═══════════════════════════════════════════════════════════════════════ */
const crewPage = {
  build: () => `<div class="page pad"><div class="strip boxed" id="crewstats"></div><div class="crewgrid"><div id="roster"></div><div id="org"></div></div></div>`,
  paint() {
    const certs = CREW.flatMap(c => c.certs.map(([, d]) => certState(d)));
    const st = (k, v, cls = '') => `<div class="cell ${cls}"><span class="k">${k}</span><span class="v">${v}</span></div>`;
    $('#crewstats').innerHTML = st('Available', CREW.filter(c => c.avail === 'Available').length) + st('Deployed', CREW.filter(c => c.avail === 'Deployed').length)
      + st('Certs expired', certs.filter(x => x === 'exp').length, 'flag-r') + st('Expiring ≤ 30 days', certs.filter(x => x === 'soon').length, 'flag-c');
    const assigned = Object.fromEntries(ORG.filter(o => o.who).map(o => [o.who, o.pos]));
    $('#roster').innerHTML = `<table class="t"><thead><tr><th></th><th>Person</th><th style="width:132px">Availability</th><th>Certifications</th></tr></thead><tbody>
      ${CREW.map(c => `<tr class="${S.pick === c.id ? 'picked' : ''}">
        <td class="grab" data-grab="${c.id}" style="width:40px">${ui('grip')}</td>
        <td class="grab" data-grab="${c.id}"><b>${esc(c.name)}</b><div class="small">${S.live && assigned[c.id] ? `<span style="color:var(--tidewater);font-weight:600">${assigned[c.id]}</span>` : `${esc(c.role)} · ${esc(c.base)}`}</div></td>
        <td><select data-edit="avail" data-id="${c.id}">${opt(['Available', 'Deployed', 'Unavailable'], c.avail)}</select></td>
        <td><div style="display:flex;gap:4px;flex-wrap:wrap">${c.certs.map(([n, d]) => { const s = certState(d); return `<span class="chip ${s}">${esc(n)}${s === 'exp' ? ' · expired' : s === 'soon' ? ' · ' + daysUntil(d) + ' d' : ''}</span>`; }).join('')}</div></td></tr>`).join('')}
      </tbody></table>`;
    const a = actives()[0];
    if (!a) { $('#org').innerHTML = `<div class="orgchart"><div class="cat">ICS organization</div><div class="empty" style="margin-top:10px">No active incident.</div></div>`; return; }
    const picked = S.pick && crewById(S.pick);
    $('#org').innerHTML = `<div class="orgchart"><div class="cat">ICS organization · ${esc(a.name)}</div>
      <div class="hint">${picked ? `Tap a position for <b>${esc(picked.name)}</b>.` : 'Drag a person onto a position, or tap a person then a position.'}</div>
      ${[0, 1, 2, 3].map(r => `<div class="orow">${ORG.map((o, k) => ({ ...o, k })).filter(o => o.row === r).map(o => { const c = o.who && crewById(o.who);
        return `<button class="slot ${c ? 'filled grab' : 'empty'} ${picked ? 'target' : ''}" data-act="slot" data-slot="${o.k}" ${c ? `data-grab="${c.id}" data-from="${o.k}"` : ''}>
          <div class="pos">${o.pos}</div><div class="who">${c ? esc(c.name) : 'Vacant'}</div></button>`; }).join('')}</div>`).join('')}</div>`;
  },
};
function assign(crewId, k, from) {
  const c = crewById(crewId);
  if (c.avail === 'Unavailable') { toast(`${c.name} is unavailable`); return; }
  const prev = ORG[k].who;
  ORG.forEach(o => { if (o.who === c.id) o.who = null; });
  if (from != null && prev && prev !== c.id) ORG[from].who = prev;   // dragging onto a filled slot swaps
  ORG[k].who = c.id;
  if (c.avail === 'Available') c.avail = 'Deployed';
  S.pick = null; crewPage.paint();
}
/* Pointer-based drag (works with a finger on iPad; HTML5 drag-and-drop does not). */
let drag = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('[data-grab]'); if (!h || S.page !== 'crew') return;
  drag = { crew: h.dataset.grab, from: h.dataset.from != null ? +h.dataset.from : null, x: e.clientX, y: e.clientY, ghost: null };
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.ghost = document.createElement('div'); drag.ghost.className = 'ghost'; drag.ghost.textContent = crewById(drag.crew).name; document.body.appendChild(drag.ghost);
  }
  drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
  const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]');
  $$('.slot.over').forEach(s => s !== slot && s.classList.remove('over')); slot?.classList.add('over');
});
const endDrag = e => {
  if (!drag) return;
  const d = drag; drag = null;
  if (!d.ghost) { if (d.from == null) { S.pick = S.pick === d.crew ? null : d.crew; crewPage.paint(); } return; }   // a tap, not a drag
  d.ghost.remove(); suppressClick = true; setTimeout(() => { suppressClick = false; }, 350);
  const slot = e.type === 'pointerup' && document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]');
  if (slot) assign(d.crew, +slot.dataset.slot, d.from); else crewPage.paint();
};
let suppressClick = false;
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

/* ═══════════════════════════════════════════════════════════════════════
   GRS
   ═══════════════════════════════════════════════════════════════════════ */
const grsPage = {
  build: () => `<div class="split"><div class="listcol"><h2 class="h2">Response strategies</h2><div id="grslist"></div></div><div class="mapcol"><div class="map-slot"></div></div></div>`,
  map: () => ({ visible: { ...ALL_OFF, grs: true, inc: true, traj: S.live, cult: S.layers.cult }, incidentExpr: incExpr(false), live: S.live, pulse: pulse(),
    padding: { left: 0, top: 0, right: 0, bottom: 0 }, goTo: GRS.slice(0, 4).map(g => g.at), select: null }),
  paint() {
    const near = actives()[0]?.grs;
    $('#grslist').innerHTML = GRS.map(g => {
      const stale = !g.exercised || daysUntil(g.exercised) < -365;
      return `<button class="row ${S.sel?.id === g.id ? 'sel' : ''}" data-act="sel" data-kind="grs" data-id="${g.id}" id="row-${g.id}"><span class="stripe grs"></span>
        <span><h4>${esc(g.name)}</h4><div class="small">${g.id.replace('DEMO-', '')} · ${g.strategy} · ${g.boom}${stale ? ' · <span style="color:var(--copper)">' + (g.exercised ? 'exercise overdue' : 'never exercised') + '</span>' : ''}</div></span>
        ${g.id === near ? '<span class="livetag">Nearest</span>' : ''}</button>`;
    }).join('');
  },
  onSelect() { grsPage.paint(); if (S.sel) $('#row-' + S.sel.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
};

/* ═══════════════════════════════════════════════════════════════════════
   Plans
   ═══════════════════════════════════════════════════════════════════════ */
const planPage = {
  build: () => `<div class="page pad"><h2 class="h2">Plans</h2><div id="planlist"></div></div>`,
  paint() {
    $('#planlist').innerHTML = `<div class="plangrid">${PLANS.map(p => `<button class="card ${p.tier} ${S.doc?.id === p.id ? 'sel' : ''}" data-act="doc" data-kind="plan" data-id="${p.id}"><div class="bar"></div><div class="body">
      <div class="cat">${LEVEL[p.tier]}</div><h3>${esc(p.title)}</h3><div class="sub">${esc(p.owner)} · ${p.version} · ${fmtD(p.updated)}</div></div></button>`).join('')}</div>`;
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════════════════════ */
const PAGES = { cop: copPage, incident: incPage, log: logPage, assets: assetPage, crew: crewPage, grs: grsPage, plans: planPage };
function go(page, opts = {}) {
  if (S.page === 'cop' && page !== 'cop') S.copVP = CopMap.viewpoint();
  if (page !== S.page) { S.sel = null; S.doc = null; S.pick = null; }
  Object.assign(S, opts, { page });
  render();
}
function render() {
  CopMap.park();
  $('#switch-menu').classList.add('hid');
  renderFrame();
  const P = PAGES[S.page];
  $('#view').innerHTML = P.build();
  P.paint();
  renderDrawer();
  const slot = $('#view .map-slot');
  if (slot && P.map) CopMap.mount(slot, P.map());
}
function remap() { const P = PAGES[S.page]; if (P.map) { const cfg = P.map(); delete cfg.goTo; delete cfg.select; CopMap.update(cfg); } }

document.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; if (e.target.closest('[data-slot]')) return; }
  if (!e.target.closest('#switcher')) $('#switch-menu').classList.add('hid');
  const t = e.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset;
  switch (d.act) {
    case 'page': go(d.p); break;
    case 'switch': renderMenu(); $('#switch-menu').classList.toggle('hid'); break;
    case 'live':
      S.live = d.v === '1';
      S.incId = S.live ? '2026-041' : (S.incId === '2026-041' ? null : S.incId);
      S.copVP = null; render(); break;
    case 'theme': S.ops = !S.ops; renderFrame(); break;
    case 'ctx': S.ctxOpen = !S.ctxOpen; copPage.paint(); break;
    case 'collapse': S.layersCollapsed = !S.layersCollapsed; copPage.paint(); remap(); break;
    case 'basemap': CopMap.setBasemap(d.v); break;
    case 'close-pop': clearSel(); break;
    case 'sel': select(d.kind, d.id, null, { fly: true }); break;
    case 'open-inc': go('incident', { incId: d.id, incTab: 'timeline', op201: null }); break;
    case 'open-asset': go('assets', { assetFilter: 'All' }); requestAnimationFrame(() => select('eq', d.id, null, { fly: true })); break;
    case 'inc-tab':
      if (S.page !== 'incident') { go('incident', { incId: actives()[0]?.id || S.incId, incTab: d.tab }); break; }
      S.incTab = d.tab; incPage.paint(); break;
    case 'op201': S.incTab = 'ics201'; S.op201 = +d.op; incPage.paint(); break;
    case 'obs': select('obs', d.id, null, { fly: true }); if (S.incTab === 'obs') incPage.onSelect(); break;
    case 'doc': S.doc = { kind: d.kind, id: d.id }; renderDrawer(); if (S.page === 'plans') planPage.paint(); break;
    case 'close-doc': S.doc = null; renderDrawer(); if (S.page === 'plans') planPage.paint(); break;
    case 'toggle-closed': S.closedOpen = !S.closedOpen; logPage.paint(); break;
    case 'asset-filter': S.assetFilter = d.v; clearSel(); assetPage.paint(); remap(); break;
    case 'add-task': { const i = currentInc(); (TASKS[i.id] = TASKS[i.id] || []).push({ title: 'New task', status: 'Not started', pri: 'Medium', who: '' }); incPage.paint(); $('#tabbody tbody tr:last-child input')?.focus(); break; }
    case 'slot':
      if (S.pick) assign(S.pick, +d.slot, null);
      else if (ORG[+d.slot].who) { S.pick = ORG[+d.slot].who; crewPage.paint(); }
      break;
  }
});
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  if (d.layer) { S.layers[d.layer] = t.checked; copPage.paint(); remap(); return; }
  if (!d.edit) return;
  if (d.edit === 'task') { TASKS[currentInc().id][+d.k][d.f] = t.value; incPage.paint(); }
  if (d.edit === 'res') { RESOURCES[currentInc().id][+d.k].status = t.value; incPage.paint(); }
  if (d.edit === 'cond') { const eq = eqById(d.id); eq.cond = t.value; CopMap.updateEquipment(eq); assetPage.paint(); if (S.sel?.id === eq.id) select('eq', eq.id); }
  if (d.edit === 'avail') { crewById(d.id).avail = t.value; crewPage.paint(); }
});
document.addEventListener('input', e => { if (e.target.id === 'logq') { S.logQuery = e.target.value; logPage.paint(); } });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (S.doc) { S.doc = null; renderDrawer(); } else clearSel();
});
document.addEventListener('cop:basemap', () => { if (S.page === 'cop') copPage.paint(); });

/* iOS Safari only applies :active styles when a touch listener exists. */
document.addEventListener('touchstart', () => {}, { passive: true });

tickClock(); setInterval(tickClock, 10000);
CopMap.init();
render();
