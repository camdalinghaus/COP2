/* ═══════════════════════════════════════════════════════════════════════
   The map. ArcGIS Maps SDK for JavaScript 4.30 (matches Enterprise 11.4),
   loaded from Esri's CDN with the AMD loader.

   DEMO-ONLY DEPARTURES from CLAUDE.md §9, on purpose:
   - SDK and assets come from js.arcgis.com, not a local copy.
   - Layers are client-side FeatureLayers built from js/data.js. The real
     app points the same layers at portal feature services.

   ONE MapView for the whole app. Pages that show a map leave an empty
   `.map-slot`; the map's host element moves into it, so tiles, layers and
   selection survive page changes.

   Popups are our own DOM element anchored to a map point and kept in step
   with the view, not the SDK's Popup widget — the card has to look exactly
   as designed (capability 2) and work by touch on an iPad.
   ═══════════════════════════════════════════════════════════════════════ */

const CopMap = (() => {
  const host = document.createElement('div');
  host.className = 'maphost';
  host.innerHTML = `<div class="maploading">Loading map…</div>
    <div class="pulse hid"></div>
    <div class="mappop hid" role="dialog"><div class="popbody"></div><i class="tip"></i></div>
    <div class="mapctl">
      <div class="grp"><button data-z="in" aria-label="Zoom in">${ui('plus')}</button><button data-z="out" aria-label="Zoom out">${ui('minus')}</button></div>
      <div class="grp"><button data-z="home" aria-label="Back to the incident area">${ui('home')}</button></div>
      <div class="grp"><button data-z="base" aria-label="Switch basemap">${ui('satellite')}</button></div>
    </div>`;
  const pulseEl = host.querySelector('.pulse'), popEl = host.querySelector('.mappop'), popBody = popEl.querySelector('.popbody'), tipEl = popEl.querySelector('.tip');

  let view = null, map = null, M = null;
  const L = {}, oid = {};
  let pending = null, highlightHandle = null, basemaps = {}, currentBase = 'sat';
  let onSelect = () => {}, pulseAt = null, popAt = null;
  const ESRI = 'https://services.arcgisonline.com/ArcGIS/rest/services/';

  const labelSym = (size = 9.5, weight = 'bold') => ({
    type: 'text', color: currentBase === 'sat' ? '#ffffff' : '#16302b',
    haloColor: currentBase === 'sat' ? 'rgba(10,22,26,0.9)' : 'rgba(255,255,255,0.95)', haloSize: 1.4,
    font: { family: 'Noto Sans', size, weight },
  });
  const labels = (minScale, size, extra = {}) => [{ labelExpressionInfo: { expression: '$feature.label' }, symbol: labelSym(size), labelPlacement: 'center-right', minScale, ...extra }];

  const pt = ([lon, lat]) => new M.Point({ longitude: lon, latitude: lat });
  const FIELDS = [{ name: 'oid', type: 'oid' }, { name: 'id', type: 'string' }, { name: 'kind', type: 'string' },
    { name: 'sym', type: 'string' }, { name: 'label', type: 'string' }, { name: 'status', type: 'string' }, { name: 'dir', type: 'double' }, { name: 'kn', type: 'double' }];

  function featureLayer(key, kind, geometryType, rows, extra = {}, oidStart = 0) {
    oid[key] = {};
    const source = rows.map((r, i) => {
      oid[key][r.attributes.id] = oidStart + i + 1;
      return new M.Graphic({ geometry: r.geometry, attributes: { oid: oidStart + i + 1, kind, ...r.attributes } });
    });
    return (L[key] = new M.FeatureLayer({
      id: key, source, objectIdField: 'oid', geometryType, spatialReference: { wkid: 4326 }, fields: FIELDS,
      outFields: ['*'], popupEnabled: false, legendEnabled: false, ...extra,
    }));
  }

  function ellipse({ center: [lon, lat], bearing, semiMajorM: a, semiMinorM: b }) {
    const th = (90 - bearing) * Math.PI / 180, mLat = 110540, mLon = 111320 * Math.cos(lat * Math.PI / 180), ring = [];
    for (let i = 0; i <= 72; i++) {
      const t = i / 72 * 2 * Math.PI, w = 1 + 0.12 * Math.sin(3 * t) + 0.06 * Math.cos(5 * t);
      const x = a * Math.cos(t) * w, y = b * Math.sin(t) * w;
      ring.push([lon + (x * Math.cos(th) - y * Math.sin(th)) / mLon, lat + (x * Math.sin(th) + y * Math.cos(th)) / mLat]);
    }
    return new M.Polygon({ rings: [ring], spatialReference: { wkid: 4326 } });
  }

  function buildLayers() {
    const { UniqueValueRenderer, SimpleRenderer } = M;
    L.bathy = new M.TileLayer({ id: 'bathy', url: ESRI + 'Ocean/World_Ocean_Base/MapServer', opacity: 0.55, visible: false });

    featureLayer('traj', 'traj', 'polygon', [{ geometry: ellipse(TRAJECTORY), attributes: { id: TRAJECTORY.incident } }], {
      renderer: new SimpleRenderer({ symbol: { type: 'simple-fill', color: [224, 138, 30, 0.32], outline: { color: [224, 138, 30, 1], width: 1.6, style: 'short-dash' } } }),
    });
    featureLayer('arch', 'arch', 'polygon', ARCH.map(a => ({
      geometry: new M.Polygon({ rings: [[...a.ring, a.ring[0]]], spatialReference: { wkid: 4326 } }), attributes: { id: a.id, label: 'Fictitious' },
    })), {
      visible: false,
      renderer: new SimpleRenderer({ symbol: { type: 'simple-fill', style: 'backward-diagonal', color: [176, 58, 41, 0.95], outline: { color: [176, 58, 41, 1], width: 1.75 } } }),
      labelingInfo: labels(60000, 8, { labelPlacement: 'always-horizontal' }),
    });
    featureLayer('cult', 'cult', 'polygon', CULTURAL.map(c => {
      const circle = new M.Circle({ center: pt(c.at), radius: c.radiusM, radiusUnit: 'meters', geodesic: true, numberOfPoints: 72 });
      return { geometry: new M.Polygon({ rings: circle.rings, spatialReference: circle.spatialReference }), attributes: { id: c.id, label: 'Fictitious' } };
    }), {
      renderer: new SimpleRenderer({ symbol: { type: 'simple-fill', color: [207, 74, 54, 0.34], outline: { color: [255, 214, 205, 1], width: 1.8, style: 'dash' } } }),
      labelingInfo: labels(60000, 8, { labelPlacement: 'always-horizontal' }),
    });
    featureLayer('cur', 'cur', 'point', CURRENTS.map((c, i) => ({ geometry: pt(c.at), attributes: { id: 'CUR-' + i, dir: c.dir, kn: c.kn } })), {
      visible: false,
      renderer: new SimpleRenderer({
        symbol: { type: 'picture-marker', url: ICON.current(), width: '12px', height: '20px' },
        visualVariables: [{ type: 'rotation', field: 'dir', rotationType: 'geographic' }, { type: 'size', field: 'kn', minDataValue: 0.5, maxDataValue: 3, minSize: 14, maxSize: 30 }],
      }),
    });
    featureLayer('grs', 'grs', 'point', GRS.map(g => ({ geometry: pt(g.at), attributes: { id: g.id, label: g.name } })), {
      renderer: new SimpleRenderer({ symbol: { type: 'picture-marker', url: ICON.grs(), width: '26px', height: '26px' } }),
      labelingInfo: labels(45000, 8.5),
    });

    const eqInfos = [];
    for (const cat of ['Fixed', 'Deployable']) for (const type of ['Cache', 'Vessel', 'Boom', 'Skimmer', 'Kit']) for (const cond of ['Ready', 'Service due', 'Out of service']) {
      eqInfos.push({ value: `${cat}|${type}|${cond}`, symbol: { type: 'picture-marker', url: ICON.equipment(cat, type, cond), width: '28px', height: '28px' } });
    }
    const eqRows = cat => EQUIPMENT.filter(e => e.cat === cat).map(e => ({ geometry: pt(e.at), attributes: { id: e.id, sym: `${e.cat}|${e.type}|${e.cond}`, label: e.name } }));
    featureLayer('eqf', 'eq', 'point', eqRows('Fixed'), { renderer: new UniqueValueRenderer({ field: 'sym', uniqueValueInfos: eqInfos }), labelingInfo: labels(30000, 8) });
    featureLayer('eqd', 'eq', 'point', eqRows('Deployable'), { renderer: new UniqueValueRenderer({ field: 'sym', uniqueValueInfos: eqInfos }), labelingInfo: labels(30000, 8) });

    featureLayer('obs', 'obs', 'point', Object.entries(OBSERVATIONS).flatMap(([inc, list]) => list.map(o => ({ geometry: pt(o.at), attributes: { id: o.id, status: inc } }))), {
      renderer: new SimpleRenderer({ symbol: { type: 'picture-marker', url: ICON.observation(), width: '18px', height: '18px' } }),
    });
    featureLayer('cultpts', 'cult', 'point', CULTURAL.map(c => ({ geometry: pt(c.at), attributes: { id: c.id } })), {
      renderer: new SimpleRenderer({ symbol: { type: 'picture-marker', url: ICON.cultural(), width: '20px', height: '20px' } }),
    });
    featureLayer('alerts', 'alert', 'point', ALERTS.map(a => ({ geometry: pt(a.at), attributes: { id: a.id, status: a.live ? 'live' : '' } })), {
      visible: false, renderer: new SimpleRenderer({ symbol: { type: 'picture-marker', url: ICON.alert(), width: '24px', height: '24px' } }),
    });

    const incInfos = [];
    for (const s of ['Active', 'Monitoring', 'Closed']) for (const t of [1, 2, 3]) {
      const px = ICON.incidentSize(t) + 4 + 'px';
      incInfos.push({ value: `${s}|${t}`, symbol: { type: 'picture-marker', url: ICON.incident(s, t), width: px, height: px } });
    }
    featureLayer('inc', 'inc', 'point', INCIDENTS.map(i => ({ geometry: pt(i.at), attributes: { id: i.id, status: i.status, sym: `${i.status}|${i.tier}`, label: i.name } })), {
      renderer: new UniqueValueRenderer({ field: 'sym', uniqueValueInfos: incInfos }),
      labelingInfo: [{ labelExpressionInfo: { expression: '$feature.label' }, symbol: labelSym(10), labelPlacement: 'above-center', where: "status <> 'Closed'" }],
    });
    return [L.bathy, L.traj, L.arch, L.cult, L.cur, L.grs, L.eqf, L.eqd, L.obs, L.cultpts, L.alerts, L.inc];
  }

  function relabel() {
    for (const lyr of Object.values(L)) {
      if (!lyr.labelingInfo) continue;
      lyr.labelingInfo = lyr.labelingInfo.map(li => {
        const c = li.clone();
        c.symbol.color = currentBase === 'sat' ? '#ffffff' : '#16302b';
        c.symbol.haloColor = currentBase === 'sat' ? 'rgba(10,22,26,0.9)' : 'rgba(255,255,255,0.95)';
        return c;
      });
    }
  }
  function setBasemap(key) {
    currentBase = key;
    if (map) { map.basemap = basemaps[key]; relabel(); }
    document.dispatchEvent(new CustomEvent('cop:basemap', { detail: key }));
  }

  /* `cult` drives both the buffers and their triangles. */
  function applyVisible(vis) {
    for (const [k, on] of Object.entries(vis)) {
      if (L[k]) L[k].visible = !!on;
      if (k === 'cult' && L.cultpts) L.cultpts.visible = !!on;
    }
    place();
  }
  function setIncidentFilter(expr) { if (L.inc) L.inc.definitionExpression = expr; place(); }
  function setObsFilter(incId) { if (L.obs) L.obs.definitionExpression = incId ? `status = '${incId}'` : '1=0'; }
  function setLive(live) {
    if (L.traj) L.traj.definitionExpression = live ? '1=1' : '1=0';
    if (L.alerts) L.alerts.definitionExpression = live ? '1=1' : "status <> 'live'";
  }

  /* Overlays that follow the map: the amber pulse and the popup. */
  function place() {
    if (!view || !view.ready) return;
    const W = host.clientWidth, H = host.clientHeight, inside = s => s && s.x > -10 && s.y > -10 && s.x < W + 10 && s.y < H + 10;
    const sp = pulseAt && L.inc?.visible ? view.toScreen(pt(pulseAt)) : null;
    pulseEl.classList.toggle('hid', !inside(sp));
    if (sp) { pulseEl.style.left = sp.x + 'px'; pulseEl.style.top = sp.y + 'px'; }

    if (!popAt) return;
    const s = view.toScreen(pt(popAt));
    if (!inside(s)) { popEl.style.visibility = 'hidden'; return; }
    popEl.style.visibility = '';
    const w = popEl.offsetWidth, h = popEl.offsetHeight, gap = 20;
    const below = s.y - h - gap < 8;
    const left = Math.min(Math.max(8, s.x - w / 2), W - w - 8);
    popEl.style.left = left + 'px';
    popEl.style.top = (below ? s.y + gap : s.y - h - gap) + 'px';
    popEl.classList.toggle('below', below);
    tipEl.style.left = Math.min(Math.max(14, s.x - left), w - 14) + 'px';
  }
  function showPopup(html, lonlat) {
    popAt = lonlat; popBody.innerHTML = html; popEl.classList.remove('hid');
    popEl.style.visibility = 'hidden'; requestAnimationFrame(place);
  }
  function hidePopup() { popAt = null; popEl.classList.add('hid'); }
  function setPulse(lonlat) { pulseAt = lonlat; place(); }

  async function highlight(kind, id) {
    if (highlightHandle) { highlightHandle.remove(); highlightHandle = null; }
    if (!view || !kind) return;
    const keys = { inc: ['inc'], grs: ['grs'], eq: ['eqf', 'eqd'], cult: ['cult', 'cultpts'], arch: ['arch'], obs: ['obs'], alert: ['alerts'] }[kind] || [];
    const handles = [];
    for (const k of keys) {
      const o = oid[k]?.[id];
      if (!o || !L[k]) continue;
      handles.push((await view.whenLayerView(L[k])).highlight(o));
    }
    highlightHandle = { remove: () => handles.forEach(h => h.remove()) };
  }

  function goTo(target, opts = {}) {
    if (!view || !view.ready) { pending = { ...(pending || {}), goTo: target, zoom: opts.zoom }; return; }
    let t = target;
    if (Array.isArray(target) && typeof target[0] === 'number') t = { target: pt(target), zoom: opts.zoom || Math.max(view.zoom, 13) };
    else if (Array.isArray(target)) {
      const xs = target.map(p => p[0]), ys = target.map(p => p[1]);
      const px = Math.max(0.01, (Math.max(...xs) - Math.min(...xs)) * 0.1), py = Math.max(0.006, (Math.max(...ys) - Math.min(...ys)) * 0.1);
      t = new M.Extent({ xmin: Math.min(...xs) - px, xmax: Math.max(...xs) + px, ymin: Math.min(...ys) - py, ymax: Math.max(...ys) + py, spatialReference: { wkid: 4326 } });
    } else if (target === 'home') t = { center: HOME.center, zoom: HOME.zoom };
    view.goTo(t, { duration: opts.instant ? 0 : 650, easing: 'ease-in-out' }).catch(() => {});
  }

  function mount(slot, cfg = {}) {
    slot.appendChild(host);
    hidePopup();
    if (!view) { pending = cfg; if (M) createView(); return; }
    apply(cfg);
  }
  function apply(cfg) {
    if (cfg.visible) applyVisible(cfg.visible);
    if (cfg.incidentExpr) setIncidentFilter(cfg.incidentExpr);
    if ('obsFor' in cfg) setObsFilter(cfg.obsFor);
    if ('live' in cfg) setLive(cfg.live);
    if ('pulse' in cfg) setPulse(cfg.pulse);
    if (cfg.padding) view.padding = cfg.padding;
    if (cfg.goTo) goTo(cfg.goTo, { zoom: cfg.zoom, instant: cfg.instant });
    if ('select' in cfg) highlight(cfg.select?.kind, cfg.select?.id);
  }
  function park() { hidePopup(); document.getElementById('parking').appendChild(host); }

  function createView() {
    view = new M.MapView({
      container: host, map, center: HOME.center, zoom: HOME.zoom,
      constraints: { minZoom: 8, maxZoom: 18, rotationEnabled: false, snapToZoom: false },
      highlightOptions: { color: [63, 179, 154, 1], haloOpacity: 1, fillOpacity: 0.18 },
      ui: { components: ['attribution'] },
    });
    view.ui.add(new M.ScaleBar({ view, unit: 'metric', style: 'line' }), 'bottom-left');
    view.ui.padding = { top: 12, right: 12, bottom: 12, left: 12 };
    view.when(() => {
      host.querySelector('.maploading')?.remove();
      if (pending) { apply(pending); pending = null; }
    });
    M.reactiveUtils.watch(() => [view.extent, view.size], place);
    view.on('click', async e => {
      const r = await view.hitTest(e, { include: [L.inc, L.alerts, L.cultpts, L.obs, L.eqd, L.eqf, L.grs, L.cult, L.arch] });
      const hit = r.results.find(x => x.graphic?.attributes?.kind);
      onSelect(hit ? hit.graphic.attributes.kind : null, hit ? hit.graphic.attributes.id : null, [e.mapPoint.longitude, e.mapPoint.latitude]);
    });
  }

  host.querySelector('.mapctl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !view) return;
    const z = b.dataset.z;
    if (z === 'in') view.goTo({ zoom: view.zoom + 1 }, { duration: 250 });
    if (z === 'out') view.goTo({ zoom: view.zoom - 1 }, { duration: 250 });
    if (z === 'home') goTo('home');
    if (z === 'base') setBasemap(currentBase === 'sat' ? 'gray' : 'sat');
  });

  function init() {
    require(['esri/Map', 'esri/views/MapView', 'esri/Basemap', 'esri/layers/TileLayer', 'esri/layers/FeatureLayer', 'esri/Graphic',
      'esri/geometry/Point', 'esri/geometry/Polygon', 'esri/geometry/Circle', 'esri/geometry/Extent', 'esri/core/reactiveUtils',
      'esri/widgets/ScaleBar', 'esri/renderers/UniqueValueRenderer', 'esri/renderers/SimpleRenderer'],
    (Map, MapView, Basemap, TileLayer, FeatureLayer, Graphic, Point, Polygon, Circle, Extent, reactiveUtils, ScaleBar, UniqueValueRenderer, SimpleRenderer) => {
      M = { Map, MapView, Basemap, TileLayer, FeatureLayer, Graphic, Point, Polygon, Circle, Extent, reactiveUtils, ScaleBar, UniqueValueRenderer, SimpleRenderer };
      basemaps.sat = new Basemap({ id: 'sat', baseLayers: [new TileLayer({ url: ESRI + 'World_Imagery/MapServer' })],
        referenceLayers: [new TileLayer({ url: ESRI + 'Reference/World_Boundaries_and_Places/MapServer' })] });
      basemaps.gray = new Basemap({ id: 'gray', baseLayers: [new TileLayer({ url: ESRI + 'Canvas/World_Light_Gray_Base/MapServer' })],
        referenceLayers: [new TileLayer({ url: ESRI + 'Canvas/World_Light_Gray_Reference/MapServer' })] });
      map = new Map({ basemap: basemaps[currentBase], layers: buildLayers() });
      if (host.isConnected && host.parentElement?.id !== 'parking') createView();
    });
  }

  async function updateEquipment(e) {
    const key = e.cat === 'Fixed' ? 'eqf' : 'eqd';
    if (!L[key]) return;
    await L[key].applyEdits({ updateFeatures: [new M.Graphic({ attributes: { oid: oid[key][e.id], sym: `${e.cat}|${e.type}|${e.cond}` } })] });
  }

  return {
    init, mount, park, goTo, highlight, setBasemap, updateEquipment, showPopup, hidePopup,
    update: cfg => { if (view && view.ready) apply(cfg); else pending = { ...(pending || {}), ...cfg }; },
    viewpoint: () => (view && view.ready ? view.viewpoint.clone() : null),
    onSelect: fn => { onSelect = fn; },
    get basemap() { return currentBase; },
  };
})();
