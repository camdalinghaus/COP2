/* ═══════════════════════════════════════════════════════════════════════
   Fake PDFs, generated in the browser.

   Capability 1 (CLAUDE.md §8) is inline PDF viewing. The demo has no real
   strategy sheets or plans — and must not — so it writes small, genuine
   PDF files from the fixtures and shows them in the browser's own PDF
   viewer, inside the app. Every page carries a FICTITIOUS watermark.

   The writer is deliberately tiny: Helvetica / Courier text, lines and
   rectangles. Non-ASCII characters are written as WinAnsi octal escapes so
   the file stays ASCII and the xref byte offsets are simple string lengths.
   ═══════════════════════════════════════════════════════════════════════ */

const PDF = (() => {
  const W = 612, H = 792;  // US Letter, points
  const WIN = { '—': 151, '–': 150, '’': 146, '‘': 145, '“': 147, '”': 148, '·': 183, '•': 149, '≈': 126, '×': 215, 'é': 233, 'ó': 243, '³': 179, '°': 176 };
  const esc = s => String(s).replace(/[\\()]/g, m => '\\' + m).replace(/[^\x20-\x7e]/g, ch => {
    const code = WIN[ch] ?? (ch.charCodeAt(0) < 256 ? ch.charCodeAt(0) : 63);
    return '\\' + code.toString(8).padStart(3, '0');
  });
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(v => v.toFixed(3)).join(' '); };

  /* A page is a list of drawing ops collected by this little builder. */
  function page() {
    const ops = [];
    const p = {
      ops,
      text(x, y, str, { size = 10, font = 'F1', color = '#16302b' } = {}) { ops.push(`BT /${font} ${size} Tf ${rgb(color)} rg ${x} ${y} Td (${esc(str)}) Tj ET`); return p; },
      /* crude wrap: Helvetica averages ~0.5em per character */
      para(x, y, str, { size = 10, width = 470, lead = 1.4, ...o } = {}) {
        const max = Math.floor(width / (size * 0.5)); let line = '', yy = y;
        for (const w of String(str).split(/\s+/)) {
          if ((line + ' ' + w).trim().length > max) { p.text(x, yy, line.trim(), { size, ...o }); yy -= size * lead; line = w; } else line += ' ' + w;
        }
        if (line.trim()) { p.text(x, yy, line.trim(), { size, ...o }); yy -= size * lead; }
        return yy;
      },
      rect(x, y, w, h, { fill, stroke, lw = 1 } = {}) {
        ops.push(`${fill ? rgb(fill) + ' rg ' : ''}${stroke ? rgb(stroke) + ' RG ' : ''}${lw} w ${x} ${y} ${w} ${h} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`); return p;
      },
      line(pts, { stroke = '#16302b', lw = 1, dash } = {}) {
        ops.push(`${rgb(stroke)} RG ${lw} w ${dash ? `[${dash}] 0 d ` : ''}${pts.map(([x, y], i) => `${x} ${y} ${i ? 'l' : 'm'}`).join(' ')} S [] 0 d`); return p;
      },
      dot(x, y, r, color) {  // circle from four béziers
        const k = r * 0.5523;
        ops.push(`${rgb(color)} rg ${x + r} ${y} m ${x + r} ${y + k} ${x + k} ${y + r} ${x} ${y + r} c ${x - k} ${y + r} ${x - r} ${y + k} ${x - r} ${y} c ${x - r} ${y - k} ${x - k} ${y - r} ${x} ${y - r} c ${x + k} ${y - r} ${x + r} ${y - k} ${x + r} ${y} c f`); return p;
      },
      watermark() {  // drawn first so it sits behind everything
        const a = 0.5, c = Math.cos(a).toFixed(3), s = Math.sin(a).toFixed(3);
        ops.unshift(`BT /F2 64 Tf 0.93 0.90 0.90 rg ${c} ${s} -${s} ${c} 92 210 Tm (FICTITIOUS - DEMO) Tj ET`);
        return p;
      },
    };
    return p;
  }

  function build(pages) {
    const objs = [];  // index i -> object number i+1
    const add = body => { objs.push(body); return objs.length; };
    const catalog = add(null), pagesObj = add(null);
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const f3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
    const kids = pages.map(pg => {
      const stream = pg.ops.join('\n');
      const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${content} 0 R >>`);
    });
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
    objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
    let out = '%PDF-1.4\n', offs = [];
    objs.forEach((b, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${b}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
  }

  /* Shared page furniture */
  function frame(pg, { accent, kicker, title, sub, n, of }) {
    pg.watermark();
    pg.rect(0, H - 8, W, 8, { fill: accent });
    pg.text(48, H - 44, kicker.toUpperCase(), { size: 8, font: 'F2', color: '#3f5b54' });
    pg.text(48, H - 70, title, { size: 20, font: 'F2' });
    if (sub) pg.text(48, H - 88, sub, { size: 9, font: 'F3', color: '#3f5b54' });
    pg.line([[48, H - 100], [W - 48, H - 100]], { stroke: '#d3dedb' });
    pg.rect(48, 36, W - 96, 22, { fill: '#fbeceb' });
    pg.text(56, 44, 'FICTITIOUS DEMONSTRATION DOCUMENT - not a real strategy, plan or site. Generated by the COP demo.', { size: 8, font: 'F2', color: '#8f191e' });
    pg.text(W - 90, 18, `Page ${n} of ${of}`, { size: 8, color: '#3f5b54' });
  }
  function kvRows(pg, x, y, rows, w = 240) {
    rows.forEach(([k, v]) => { pg.text(x, y, k, { size: 8, font: 'F2', color: '#3f5b54' }); y = pg.para(x + 92, y, v, { size: 9.5, width: w - 92 }) - 4; });
    return y;
  }
  function section(pg, y, label) { pg.text(48, y, label.toUpperCase(), { size: 8, font: 'F2', color: '#3f5b54' }); pg.line([[48, y - 5], [W - 48, y - 5]], { stroke: '#e3ebe9' }); return y - 20; }

  /* ── GRS strategy sheet ─────────────────────────────────────────────── */
  function grs(site) {
    const violet = '#7a68b8';
    const p1 = page(), p2 = page();
    frame(p1, { accent: violet, kicker: 'Geographic Response Strategy', title: `${site.name} - ${site.strategy}`, sub: `${site.id}  ·  ${site.at[1].toFixed(4)} N  ${Math.abs(site.at[0]).toFixed(4)} W`, n: 1, of: 2 });
    let y = section(p1, H - 124, 'Strategy summary');
    y = kvRows(p1, 48, y, [['Objective', `${site.strategy} booming to protect: ${(site.protects || 'nearshore habitat').toLowerCase()}.`], ['Boom', site.boom], ['Anchors', `${site.anchors} sets (Danforth 15 kg, 30 m rode)`], ['Tide', site.tide], ['Access', site.access || 'Skiff from Echo Bay'], ['Last exercised', site.exercised || 'Not yet exercised']], 300);
    /* schematic: shoreline, boom with floats, flow arrows */
    const bx = 360, by = H - 330, bw = 204, bh = 190;
    p1.rect(bx, by, bw, bh, { fill: '#eef3f2', stroke: '#d3dedb' });
    p1.text(bx + 8, by + bh - 14, 'SCHEMATIC (NOT TO SCALE)', { size: 7, font: 'F2', color: '#3f5b54' });
    p1.line([[bx + 10, by + 30], [bx + 40, by + 70], [bx + 60, by + 120], [bx + 110, by + 150], [bx + 160, by + 135], [bx + 194, by + 150]], { stroke: '#6b8b96', lw: 2 });
    p1.text(bx + 120, by + 160, 'shoreline', { size: 7, color: '#3f5b54' });
    const boomPts = site.strategy === 'Exclusion' ? [[bx + 46, by + 78], [bx + 90, by + 92], [bx + 140, by + 104], [bx + 172, by + 138]]
      : [[bx + 30, by + 60], [bx + 80, by + 70], [bx + 130, by + 74], [bx + 180, by + 90]];
    p1.line(boomPts, { stroke: violet, lw: 3 });
    boomPts.forEach(([x, yy]) => p1.dot(x, yy, 3.4, violet));
    [[bx + 60, by + 30], [bx + 120, by + 34]].forEach(([x, yy]) => { p1.line([[x, yy], [x + 34, yy + 6]], { lw: 1.2 }); p1.line([[x + 28, yy + 9], [x + 34, yy + 6], [x + 29, yy + 1]], { lw: 1.2 }); });
    p1.text(bx + 60, by + 16, 'flow (ebb)', { size: 7, color: '#3f5b54' });
    y = Math.min(y, by - 20);
    y = section(p1, y, 'Resources at risk');
    y = p1.para(48, y, `${site.protects || 'Nearshore habitat'}. Sensitivities are summarised only; detailed values are held by the Nations and are not reproduced on strategy sheets.`, { size: 9.5, width: 516 }) - 8;
    y = section(p1, y, 'Equipment');
    ['Containment boom, ' + site.boom, `${site.anchors} anchor sets with buoys and tag lines`, 'Two vessels (one boom-towing), skiff for anchor work', 'Sorbent boom for the shoreline end'].forEach(t => { p1.text(56, y, '•  ' + t, { size: 9.5 }); y -= 14; });

    frame(p2, { accent: violet, kicker: 'Geographic Response Strategy', title: 'Deployment steps', sub: site.id, n: 2, of: 2 });
    y = section(p2, H - 124, 'Sequence');
    ['Confirm tide window and current direction on arrival.', 'Set the upstream anchor first; attach boom with a bridle.', 'Tow boom out on the planned angle; keep the skirt down.', 'Set intermediate anchors every 200 ft.', 'Land the shore end on sorbent boom; check for gaps at low water.', 'Log the deployment (time, length, tide) as an ICS 214 entry.', 'Check boom at every slack; adjust anchors as the tide turns.']
      .forEach((t, i) => { p2.text(48, y, `${i + 1}.`, { size: 10, font: 'F2' }); y = p2.para(66, y, t, { size: 10, width: 498 }) - 6; });
    y = section(p2, y - 6, 'Safety');
    y = p2.para(48, y, 'Two-person minimum on boom work. PFDs at all times. Never stand in a bight of tow line. Stop work when wind exceeds 20 kn or visibility is under 0.5 nm.', { size: 10, width: 516 }) - 8;
    y = section(p2, y, 'Contacts');
    p2.text(48, y, '[Contact list is held in the private folder - not reproduced here.]', { size: 10, font: 'F3', color: '#3f5b54' });
    return build([p1, p2]);
  }

  /* ── Plan document ──────────────────────────────────────────────────── */
  const LEVEL = { territorial: 'Territorial plan', sub_regional: 'Sub-regional plan', nsb: 'Northern Shelf Bioregion', toolkit: 'Toolkit' };
  function plan(pl, accent) {
    const pages = [];
    const n = pl.pages;
    const p1 = page(); pages.push(p1);
    frame(p1, { accent, kicker: LEVEL[pl.tier], title: pl.title, sub: `${pl.id}  ·  ${pl.version}  ·  updated ${pl.updated}  ·  ${pl.status}`, n: 1, of: n });
    let y = section(p1, H - 124, 'Document control');
    y = kvRows(p1, 48, y, [['Owner', pl.owner], ['Scope', pl.scope || pl.owner], ['Version', pl.version], ['Updated', pl.updated], ['Status', pl.status]], 400) - 10;
    y = section(p1, y, 'Purpose');
    y = p1.para(48, y, 'This placeholder stands in for a real document so the demo can show how plans open inline, beside the map and the incident, without leaving the COP. The text is generic and describes no real plan, Nation, territory or procedure.', { size: 10, width: 516 }) - 10;
    y = section(p1, y, 'Contents');
    ['1. Activation and notification', '2. Roles and the ICS structure', '3. Priority protection areas', '4. Equipment and staging', '5. Demobilization and recovery'].forEach(t => { p1.text(56, y, t, { size: 10 }); y -= 15; });
    const heads = ['Activation and notification', 'Roles and the ICS structure', 'Priority protection areas', 'Equipment and staging', 'Demobilization and recovery'];
    for (let i = 1; i < n; i++) {
      const pg = page(); pages.push(pg);
      frame(pg, { accent, kicker: pl.title, title: `${i}. ${heads[i - 1]}`, sub: `${pl.id} · ${pl.version}`, n: i + 1, of: n });
      let yy = H - 130;
      for (let k = 0; k < 4; k++) {
        yy = pg.para(48, yy, 'Placeholder paragraph. In the live COP this page is the attached PDF from the MR_Plans table, opened in the app. Version, owner and status above come from the table row, so they stay current when the attachment is replaced.', { size: 10, width: 516 }) - 10;
      }
      yy = section(pg, yy, 'Checklist');
      ['Confirm the incident record exists in the COP', 'Notify per the activation table', 'Record decisions in the activity log'].forEach(t => { pg.rect(52, yy - 2, 8, 8, { stroke: '#3f5b54' }); pg.text(68, yy, t, { size: 10 }); yy -= 16; });
    }
    return build(pages);
  }

  return { grs, plan };
})();
