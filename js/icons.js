/* ═══════════════════════════════════════════════════════════════════════
   Icons. One source for every symbol, so the map, the legend and the cards
   always match. Map symbols are SVG strings turned into data URIs for
   ArcGIS PictureMarkerSymbols.

   Every map symbol carries a white keyline and a soft dark outer ring: the
   satellite basemap is busy and dark, and the light-grey one is pale, so a
   symbol has to hold its edge against both.

   Colours follow CLAUDE.md §7. Amber (#e08a1e) appears only on the Active
   incident marker. Monitoring uses the pale amber the semantic table allows.
   ═══════════════════════════════════════════════════════════════════════ */

const C = {
  amber: '#e08a1e', amberPale: '#c98a3a', closed: '#6b8b96',
  tidewater: '#1f8f76', tidewaterLt: '#3fb39a', copper: '#b0632f', coral: '#cf4a36',
  coralDeep: '#b03a29', violet: '#7a68b8', ink: '#16302b', slate: '#5b7f95', white: '#ffffff',
};
const svgUri = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const STATUS_FILL = { Active: C.amber, Monitoring: C.amberPale, Closed: C.closed };
const COND_PIP = { 'Ready': C.tidewaterLt, 'Service due': C.white, 'Out of service': C.coral };

/* Small white glyphs, drawn in a 24-unit box centred on (12,12). */
const GLYPH = {
  drop: '<path d="M12 5.2c2.6 3.4 4.3 5.9 4.3 8.1a4.3 4.3 0 01-8.6 0c0-2.2 1.7-4.7 4.3-8.1z" fill="#fff"/>',
  vessel: '<path d="M5 13.2h14l-2.2 4H7.2z M8.6 13.2V9.6h4.2l2 3.6 M11 9.6V7.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  boom: '<path d="M4.6 14.6c3.6-4.4 11.2-4.4 14.8 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="6.3" cy="12.8" r="1.4" fill="#fff"/><circle cx="12" cy="10.4" r="1.4" fill="#fff"/><circle cx="17.7" cy="12.8" r="1.4" fill="#fff"/>',
  skimmer: '<path d="M6 9h12M7.5 9v6.5h9V9 M10 12.5h4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  cache: '<path d="M6 10.4L12 7l6 3.4V17H6z M9.6 17v-3.6h4.8V17" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>',
  kit: '<path d="M6.5 9.5h11v7.5h-11z M10 9.5V8h4v1.5 M12 11.3v4 M10 13.3h4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
};
const EQ_GLYPH = { Vessel: 'vessel', Boom: 'boom', Skimmer: 'skimmer', Cache: 'cache', Kit: 'kit' };

/* ── Map symbols ─────────────────────────────────────────────────────── */
const ICON = {
  incident(status, tier = 1) {
    const f = STATUS_FILL[status] || C.closed;
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18.5" fill="rgba(10,20,24,.35)"/>
      <circle cx="20" cy="20" r="16.5" fill="#fff"/>
      <circle cx="20" cy="20" r="14" fill="${f}"/>
      <g transform="translate(8 8)">${GLYPH.drop}</g>
      ${tier >= 2 ? `<circle cx="20" cy="20" r="10.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2.2" opacity=".85"/>` : ''}
    </svg>`);
  },
  incidentSize: tier => ({ 1: 26, 2: 32, 3: 38 }[tier] || 26),

  grs() {
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14.6" fill="rgba(10,20,24,.35)"/>
      <circle cx="16" cy="16" r="13" fill="#fff"/>
      <circle cx="16" cy="16" r="10" fill="none" stroke="${C.violet}" stroke-width="4"/>
      <path d="M10.6 17.6c2.9-3.4 7.9-3.4 10.8 0" fill="none" stroke="${C.violet}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="12" cy="16.2" r="1.25" fill="${C.violet}"/><circle cx="16" cy="14.4" r="1.25" fill="${C.violet}"/><circle cx="20" cy="16.2" r="1.25" fill="${C.violet}"/>
    </svg>`);
  },

  equipment(cat, type, cond) {
    const g = GLYPH[EQ_GLYPH[type] || 'cache'];
    const body = cat === 'Fixed'
      ? `<rect x="2" y="4" width="28" height="28" rx="4" fill="rgba(10,20,24,.35)"/><rect x="3.5" y="5.5" width="25" height="25" rx="3.2" fill="#fff"/><rect x="5.5" y="7.5" width="21" height="21" rx="2.2" fill="${C.copper}"/>`
      : `<circle cx="16" cy="18" r="14.5" fill="rgba(10,20,24,.35)"/><circle cx="16" cy="18" r="13" fill="#fff"/><circle cx="16" cy="18" r="10.6" fill="${C.copper}"/>`;
    const pip = COND_PIP[cond] || C.white;
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34">
      ${body}<g transform="translate(4.4 6.4) scale(.97)">${g}</g>
      <circle cx="27" cy="7" r="5.6" fill="rgba(10,20,24,.45)"/><circle cx="27" cy="7" r="4.6" fill="${pip}" stroke="#fff" stroke-width="1.4"/>
      ${cond === 'Out of service' ? '<path d="M25.3 5.3l3.4 3.4M28.7 5.3l-3.4 3.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>' : ''}
      ${cond === 'Service due' ? `<circle cx="27" cy="7" r="1.5" fill="${C.copper}"/>` : ''}
    </svg>`);
  },

  cultural() {  // coral triangle (§7)
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
      <path d="M15 2.5L28.5 26.5H1.5Z" fill="rgba(10,20,24,.35)"/>
      <path d="M15 4.6L26.6 25.2H3.4Z" fill="#fff"/>
      <path d="M15 8.4L23.4 23.2H6.6Z" fill="${C.coral}"/>
    </svg>`);
  },

  alert() {  // ink diamond: deliberately not amber, not coral
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
      <path d="M15 1.4L28.6 15 15 28.6 1.4 15Z" fill="rgba(10,20,24,.35)"/>
      <path d="M15 3.4L26.6 15 15 26.6 3.4 15Z" fill="#fff"/>
      <path d="M15 6.2L23.8 15 15 23.8 6.2 15Z" fill="${C.ink}"/>
      <path d="M15 10.4v5.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="19.2" r="1.2" fill="#fff"/>
    </svg>`);
  },

  observation() {
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="rgba(10,20,24,.35)"/><circle cx="11" cy="11" r="8.6" fill="#fff"/>
      <circle cx="11" cy="11" r="6.4" fill="${C.tidewater}"/><circle cx="11" cy="11" r="2.2" fill="#fff"/>
    </svg>`);
  },

  current() {  // points up (north); the renderer rotates it
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40">
      <path d="M12 2L21 15h-5.5v22h-7V15H3z" fill="rgba(10,20,24,.55)"/>
      <path d="M12 4.8l6.6 9.4h-4.4V35H9.8V14.2H5.4z" fill="#fff"/>
    </svg>`);
  },
};

/* ── UI icons (rail, buttons): 24-unit stroke icons ──────────────────── */
const UI = {
  cop: '<path d="M9 4L3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z M9 4v13.6 M15 6.4V20"/>',
  incident: '<path d="M12 3.5l9 15.5H3z M12 9.5v4.5 M12 16.8v.2"/>',
  log: '<path d="M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01"/>',
  assets: '<path d="M12 3v15 M8.5 6.5h7 M5 13a7 7 0 0014 0 M3.5 13H6.5 M17.5 13h3 M12 3.2a1.6 1.6 0 110 .1"/>',
  crew: '<path d="M9 11a3.2 3.2 0 100-6.4A3.2 3.2 0 009 11z M3 20a6 6 0 0112 0 M16 4.8a3.2 3.2 0 010 6.2 M17.5 14.4A6 6 0 0121 20"/>',
  grs: '<path d="M3 16c4.5-6 13.5-6 18 0"/><circle cx="5.5" cy="13.6" r="1.6"/><circle cx="12" cy="10.6" r="1.6"/><circle cx="18.5" cy="13.6" r="1.6"/><path d="M3 20.5h18"/>',
  plans: '<path d="M5 4.5h9l5 5V20H5z M14 4.5v5h5 M8.5 13h7 M8.5 16.5h5"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4"/>',
  layers: '<path d="M12 3.5l9 4.8-9 4.8-9-4.8z M3 12.3l9 4.8 9-4.8 M3 16.3l9 4.8 9-4.8"/>',
  plus: '<path d="M12 5v14 M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  home: '<path d="M4 11.5L12 4.5l8 7 M6.5 9.5V19.5h11V9.5"/>',
  close: '<path d="M6 6l12 12 M18 6L6 18"/>',
  chevron: '<path d="M8 10l4 4 4-4"/>',
  doc: '<path d="M6 3.5h8l4 4V20.5H6z M14 3.5v4h4"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.6-4.6"/>',
  satellite: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17 M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5s1-6.1 3.6-8.5z"/>',
  grip: '<path d="M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01"/>',
};
const ui = (k, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${UI[k]}</svg>`;

/* Legend swatches reuse the map icons so the two can never drift apart. */
const swatch = uri => `<img class="sw" src="${uri}" alt="">`;
