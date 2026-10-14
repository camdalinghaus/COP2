/* ═══════════════════════════════════════════════════════════════════════
   DEMO FIXTURES — EVERYTHING IN THIS FILE IS FICTITIOUS.

   Incidents, crew, equipment, strategies, plans, observations, alerts and
   every cultural / archaeological feature are invented. Place names are
   real so the map reads; the things placed at them are not.

   Bay, channel and rock positions come from the Canadian Geographical
   Names Database (geogratis.gc.ca), read 2026-10-14.

   Fictitious cultural buffers sit in bays at least 5.8 km from the nearest
   Indian Reserve point in that database. That is a distance rule only, NOT
   a check against real cultural data. Cam reviews placements before showing.

   People are role labels ("Guardian A"), never names. No feature,
   incident or person is attributed to any Nation.

   Coordinates are [longitude, latitude].
   ═══════════════════════════════════════════════════════════════════════ */

const DEMO_DATE = '2026-10-14';
/* Opening view: the live spill, its slick, the nearest strategies, the
   on-scene equipment and the nearby fictitious cultural buffer in one frame. */
const HOME = { center: [-126.5605, 50.8165], zoom: 13.7 };

/* `tier` is incident SEVERITY (COP data model §5); always shown as
   "severity tier" so it can't be read as Tier 1-2-3 engagement levels. */
const INCIDENTS = [
  { id: '2026-041', name: 'Trivett Rock', status: 'Active', tier: 2, type: 'Grounding — tug and barge', product: 'Diesel',
    ic: 'Coordinator 1', reported: '2026-10-13 16:20', grs: 'DEMO-GRS-04', at: [-126.5478, 50.8197], released: '≈ 2,000 L', opPeriod: 2,
    summary: 'Fuel barge aground on Trivett Rock, port bow tank breached. Breach sealed overnight. Sheen drifting west-southwest toward Hayle Bay on the ebb.' },
  { id: '2026-039', name: 'Wells Passage', status: 'Monitoring', tier: 1, type: 'Derelict vessel', product: 'Fuel suspected',
    ic: 'Coordinator 2', reported: '2026-10-09 11:05', grs: 'DEMO-GRS-07', at: [-126.9206, 50.8556], released: 'None seen', opPeriod: 1,
    summary: 'Abandoned troller partly submerged in a cove off the passage. Checked every second day.' },
  { id: '2026-036', name: 'Echo Bay', status: 'Closed', tier: 1, type: 'Sheen', product: 'Bilge water', ic: 'Guardian C',
    reported: '2026-09-22 08:15', closed: '2026-09-22 15:40', grs: 'DEMO-GRS-02', at: [-126.4967, 50.7519], released: '< 20 L',
    summary: 'Small bilge discharge at the marina. Dissipated by afternoon.' },
  { id: '2026-031', name: 'Blackfish Sound', status: 'Closed', tier: 2, type: 'Exercise', product: 'None', ic: 'Coordinator 1',
    reported: '2026-08-19 07:00', closed: '2026-08-20 16:00', grs: 'DEMO-GRS-11', at: [-126.7147, 50.5908], released: 'n/a',
    summary: 'Two-day GRS field exercise. Deflection boom set and recovered.' },
  { id: '2026-028', name: 'Kingcome Inlet', status: 'Closed', tier: 1, type: 'Fuel transfer spill', product: 'Gasoline', ic: 'Coordinator 2',
    reported: '2026-07-30 13:40', closed: '2026-07-31 10:10', grs: 'DEMO-GRS-08', at: [-126.4569, 50.9297], released: '≈ 40 L',
    summary: 'Overfill during fuelling at a float. Evaporated within hours.' },
  { id: '2026-022', name: 'Retreat Passage', status: 'Closed', tier: 1, type: 'Sunken vessel', product: 'Diesel', ic: 'Guardian D',
    reported: '2026-06-11 06:30', closed: '2026-06-14 12:00', grs: 'DEMO-GRS-09', at: [-126.6092, 50.6989], released: '≈ 150 L',
    summary: 'Pleasure craft sank at anchor. Vents plugged; vessel raised.' },
];

/* Live-incident slick (amber: it is a live-incident signal) */
const TRAJECTORY = { incident: '2026-041', center: [-126.5560, 50.8183], bearing: 253, semiMajorM: 620, semiMinorM: 210 };

const GRS = [
  { id: 'DEMO-GRS-04', name: 'Hayle Bay', strategy: 'Exclusion', at: [-126.5706, 50.8150], boom: '600 ft', anchors: 5, tide: 'Set on the flood', exercised: '2026-09-10' },
  { id: 'DEMO-GRS-05', name: 'Sir Edmund Bay', strategy: 'Exclusion', at: [-126.6022, 50.8331], boom: '700 ft', anchors: 5, tide: 'Set on the flood', exercised: null },
  { id: 'DEMO-GRS-13', name: 'Deep Harbour', strategy: 'Diversion', at: [-126.5867, 50.7969], boom: '1,000 ft', anchors: 7, tide: 'Set on the ebb', exercised: '2026-05-14' },
  { id: 'DEMO-GRS-01', name: 'Cypress Harbour', strategy: 'Exclusion', at: [-126.6669, 50.8367], boom: '1,200 ft', anchors: 8, tide: 'Set on the flood', exercised: '2026-05-14' },
  { id: 'DEMO-GRS-02', name: 'Echo Bay', strategy: 'Exclusion', at: [-126.4967, 50.7519], boom: '600 ft', anchors: 4, tide: 'Either', exercised: '2026-09-22' },
  { id: 'DEMO-GRS-03', name: 'Shoal Harbour', strategy: 'Exclusion', at: [-126.5003, 50.7364], boom: '800 ft', anchors: 6, tide: 'Set at low water', exercised: '2025-10-02' },
  { id: 'DEMO-GRS-06', name: 'Sullivan Bay', strategy: 'Exclusion', at: [-126.8286, 50.8853], boom: '500 ft', anchors: 4, tide: 'Either', exercised: '2026-05-03' },
  { id: 'DEMO-GRS-07', name: 'Tracey Harbour', strategy: 'Exclusion', at: [-126.8747, 50.8519], boom: '900 ft', anchors: 6, tide: 'Set on the flood', exercised: '2026-03-20' },
  { id: 'DEMO-GRS-08', name: 'Kingcome Inlet', strategy: 'Deflection', at: [-126.4569, 50.9297], boom: '1,500 ft', anchors: 10, tide: 'Set at slack', exercised: '2026-07-31' },
  { id: 'DEMO-GRS-09', name: 'Waddington Bay', strategy: 'Exclusion', at: [-126.6153, 50.7172], boom: '400 ft', anchors: 3, tide: 'Either', exercised: null },
  { id: 'DEMO-GRS-10', name: 'Viner Sound', strategy: 'Cascade', at: [-126.4167, 50.7875], boom: '2 × 600 ft', anchors: 8, tide: 'Set on the ebb', exercised: '2025-08-28' },
  { id: 'DEMO-GRS-11', name: 'Blackfish Sound', strategy: 'Deflection', at: [-126.7147, 50.5908], boom: '1,000 ft', anchors: 8, tide: 'Set at slack', exercised: '2026-08-20' },
];

const EQUIPMENT = [
  { id: 'EQ-D01', name: 'Guardian vessel 1', cat: 'Deployable', type: 'Vessel', qty: '8.5 m, twin outboard', boomFt: 0, cond: 'Ready', at: [-126.5505, 50.8188], base: 'On scene', service: '2026-12-15' },
  { id: 'EQ-D03', name: 'Boom package A', cat: 'Deployable', type: 'Boom', qty: '800 ft', boomFt: 800, cond: 'Ready', at: [-126.5458, 50.8206], base: 'Deployed at barge', service: '2027-04-01' },
  { id: 'EQ-D09', name: 'Boom package C', cat: 'Deployable', type: 'Boom', qty: '600 ft', boomFt: 600, cond: 'Ready', at: [-126.5690, 50.8162], base: 'Deployed · Hayle Bay', service: '2027-02-12' },
  { id: 'EQ-D02', name: 'Guardian vessel 2', cat: 'Deployable', type: 'Vessel', qty: '7 m landing craft', boomFt: 0, cond: 'Ready', at: [-126.5370, 50.8090], base: 'En route', service: '2027-01-30' },
  { id: 'EQ-F01', name: 'Echo Bay cache', cat: 'Fixed', type: 'Cache', qty: '1,500 ft boom, sorbents', boomFt: 1500, cond: 'Ready', at: [-126.4935, 50.7540], base: 'Echo Bay', service: '2027-02-01' },
  { id: 'EQ-D04', name: 'Weir skimmer', cat: 'Deployable', type: 'Skimmer', qty: '10 m³/h', boomFt: 0, cond: 'Out of service', at: [-126.4990, 50.7505], base: 'Echo Bay', service: '2026-08-01' },
  { id: 'EQ-D07', name: 'Wildlife kit', cat: 'Deployable', type: 'Kit', qty: '2 crates', boomFt: 0, cond: 'Ready', at: [-126.4955, 50.7528], base: 'Echo Bay', service: '2027-02-01' },
  { id: 'EQ-F02', name: 'Sullivan Bay cache', cat: 'Fixed', type: 'Cache', qty: '800 ft boom, sorbents', boomFt: 800, cond: 'Service due', at: [-126.8255, 50.8868], base: 'Sullivan Bay', service: '2026-10-20' },
  { id: 'EQ-D05', name: 'Workboat', cat: 'Deployable', type: 'Vessel', qty: '9 m, boom reel', boomFt: 600, cond: 'Service due', at: [-126.8310, 50.8840], base: 'Sullivan Bay', service: '2026-10-28' },
  { id: 'EQ-F03', name: 'Sointula cache', cat: 'Fixed', type: 'Cache', qty: '2,000 ft boom, skimmer', boomFt: 2000, cond: 'Ready', at: [-127.0150, 50.6345], base: 'Sointula', service: '2027-03-15' },
  { id: 'EQ-F04', name: 'Kingcome cache', cat: 'Fixed', type: 'Cache', qty: '600 ft boom', boomFt: 600, cond: 'Ready', at: [-126.1994, 50.9067], base: 'Anchorage Cove', service: '2027-01-10' },
];

/* FICTITIOUS cultural buffers and archaeological polygons (distance to nearest reserve point in comments) */
const CULTURAL = [
  { id: 'DEMO-CS-03', bay: 'Laura Bay',      at: [-126.5706, 50.8211], radiusM: 400 },  // 6.4 km
  { id: 'DEMO-CS-01', bay: 'Reid Bay',       at: [-126.6475, 50.8817], radiusM: 450 },  // 6.1 km
  { id: 'DEMO-CS-02', bay: 'Harry Bay',      at: [-126.6461, 50.8414], radiusM: 400 },  // 8.7 km
  { id: 'DEMO-CS-04', bay: 'Cullen Harbour', at: [-126.7428, 50.7739], radiusM: 500 },  // 7.3 km
  { id: 'DEMO-CS-05', bay: 'Cockatrice Bay', at: [-126.8453, 50.7939], radiusM: 450 },  // 7.8 km
  { id: 'DEMO-CS-06', bay: 'Wahkana Bay',    at: [-126.2714, 50.8225], radiusM: 450 },  // 7.1 km
  { id: 'DEMO-CS-07', bay: 'Levesque Bay',   at: [-126.3675, 50.6503], radiusM: 400 },  // 12.1 km
];
const ARCH = [
  { id: 'DEMO-AR-01', bay: 'Dobbin Bay',  ring: [[-126.8150, 50.7810], [-126.8070, 50.7818], [-126.8058, 50.7778], [-126.8138, 50.7770]] },  // 10.8 km
  { id: 'DEMO-AR-02', bay: 'Watson Cove', ring: [[-126.3105, 50.8506], [-126.3020, 50.8510], [-126.3012, 50.8470], [-126.3098, 50.8465]] },  // 7.6 km
];

/* Context layers (default off). Currents are an illustrative ebb set, not a model. */
const CURRENTS = [
  { at: [-126.5520, 50.8165], dir: 253, kn: 1.1 }, { at: [-126.5610, 50.8215], dir: 245, kn: 0.8 }, { at: [-126.5400, 50.8120], dir: 240, kn: 1.4 },
  { at: [-126.6361, 50.7819], dir: 282, kn: 1.4 }, { at: [-126.9206, 50.8556], dir: 215, kn: 1.8 }, { at: [-126.7433, 50.8761], dir: 268, kn: 1.1 },
  { at: [-126.5783, 50.8364], dir: 205, kn: 0.9 }, { at: [-126.2161, 50.8053], dir: 230, kn: 0.8 }, { at: [-126.7147, 50.5908], dir: 295, kn: 2.4 },
  { at: [-126.6092, 50.6989], dir: 200, kn: 1.0 }, { at: [-126.5222, 50.7469], dir: 222, kn: 0.9 }, { at: [-126.4569, 50.9297], dir: 228, kn: 1.6 },
];
const ALERTS = [
  { id: 'DEMO-NW-112', title: 'NAVWARN 112/26', text: 'Barge aground, Trivett Rock. Boom in the water. Keep 0.5 nm clear.', at: [-126.5425, 50.8225], live: true },
  { id: 'DEMO-NW-108', title: 'NAVWARN 108/26', text: 'Partly submerged derelict off Wells Passage.', at: [-126.9150, 50.8590] },
];

const CREW = [
  { id: 'C01', name: 'Coordinator 1', role: 'Marine coordinator', base: 'Port McNeill', avail: 'Deployed', certs: [['ICS-300', '2027-11-02'], ['SVOP', '2027-05-18']] },
  { id: 'C02', name: 'Guardian A', role: 'Guardian', base: 'Echo Bay', avail: 'Deployed', certs: [['SVOP', '2027-04-01'], ['First Aid', '2026-10-29']] },
  { id: 'C03', name: 'Guardian B', role: 'Guardian', base: 'Echo Bay', avail: 'Deployed', certs: [['SVOP', '2026-10-05'], ['ICS-100', '2028-02-11']] },
  { id: 'C04', name: 'Guardian C', role: 'Guardian', base: 'Sullivan Bay', avail: 'Available', certs: [['SVOP', '2028-03-30'], ['ICS-200', '2027-03-02']] },
  { id: 'C05', name: 'Guardian D', role: 'Guardian', base: 'Sointula', avail: 'Available', certs: [['SVOP', '2027-07-21'], ['Spill response', '2026-11-08']] },
  { id: 'C06', name: 'Guardian E', role: 'Guardian', base: 'Alert Bay', avail: 'Unavailable', certs: [['SVOP', '2027-02-14'], ['First Aid', '2026-09-30']] },
  { id: 'C07', name: 'Guardian F', role: 'Guardian (trainee)', base: 'Port McNeill', avail: 'Available', certs: [['ICS-100', '2028-06-01']] },
  { id: 'C08', name: 'Skipper G', role: 'Vessel master', base: 'Echo Bay', avail: 'Deployed', certs: [['Master Limited', '2029-04-10'], ['ROC-M', '2031-01-01']] },
  { id: 'C09', name: 'Analyst', role: 'Ocean protection analyst', base: 'Campbell River', avail: 'Deployed', certs: [['ICS-300', '2027-02-20']] },
  { id: 'C10', name: 'Coordinator 2', role: 'Marine coordinator', base: 'Alert Bay', avail: 'Deployed', certs: [['ICS-300', '2026-11-04'], ['SVOP', '2027-08-08']] },
  { id: 'C11', name: 'Guardian H', role: 'Guardian', base: 'Kingcome Inlet', avail: 'Available', certs: [['SVOP', '2027-10-01']] },
  { id: 'C12', name: 'Logistics lead', role: 'Logistics coordinator', base: 'Campbell River', avail: 'Available', certs: [['ICS-200', '2027-06-30']] },
];

/* ICS positions for the active incident; who = crew id, or null for a dashed slot. */
const ORG = [
  { pos: 'Incident Commander', who: 'C01', row: 0 },
  { pos: 'Safety Officer', who: null, row: 1 }, { pos: 'Liaison Officer', who: 'C10', row: 1 }, { pos: 'Information Officer', who: null, row: 1 },
  { pos: 'Operations', who: 'C02', row: 2 }, { pos: 'Planning', who: 'C09', row: 2 }, { pos: 'Logistics', who: null, row: 2 }, { pos: 'Finance / Admin', who: null, row: 2 },
  { pos: 'Division A', who: 'C03', row: 3 }, { pos: 'On-water Task Force', who: 'C08', row: 3 }, { pos: 'Shoreline Assessment', who: null, row: 3 },
];

const TASKS = {
  '2026-041': [
    { title: 'Maintain containment boom at the barge', status: 'In progress', pri: 'High', who: 'Guardian A' },
    { title: 'Exclusion boom at Hayle Bay (GRS-04)', status: 'Complete', pri: 'High', who: 'Guardian B' },
    { title: 'Shoreline assessment, Hayle Bay point', status: 'Not started', pri: 'High', who: '' },
    { title: 'Drone imagery of sheen at low water', status: 'In progress', pri: 'Medium', who: 'Analyst' },
    { title: 'Stage sorbents at Echo Bay float', status: 'In progress', pri: 'Medium', who: 'Logistics lead' },
    { title: 'Notify partner agencies', status: 'Complete', pri: 'High', who: 'Coordinator 1' },
  ],
  '2026-039': [ { title: 'Check for sheen every second day', status: 'In progress', pri: 'Medium', who: 'Guardian C' } ],
};
const RESOURCES = {
  '2026-041': [
    { name: 'Guardian vessel 1', kind: 'Vessel', qty: '1', status: 'On scene', eq: 'EQ-D01' },
    { name: 'Boom package A', kind: 'Boom', qty: '800 ft', status: 'Deployed', eq: 'EQ-D03' },
    { name: 'Boom package C', kind: 'Boom', qty: '600 ft', status: 'Deployed', eq: 'EQ-D09' },
    { name: 'Guardian vessel 2', kind: 'Vessel', qty: '1', status: 'En route', eq: 'EQ-D02' },
    { name: 'Coast Guard ER vessel', kind: 'Vessel', qty: '1', status: 'Requested', eq: '' },
  ],
  '2026-039': [ { name: 'Guardian vessel 2', kind: 'Vessel', qty: '1', status: 'Patrol', eq: 'EQ-D02' } ],
};
const OBSERVATIONS = {
  '2026-041': [
    { id: 'OBS-0412', t: '2026-10-13 17:05', type: 'Sheen', by: 'Guardian A', at: [-126.5525, 50.8188], text: 'Rainbow sheen ~300 m west of the barge, moving with the ebb.' },
    { id: 'OBS-0415', t: '2026-10-13 18:30', type: 'Vessel', by: 'Guardian B', at: [-126.5470, 50.8200], text: 'Barge holed at port bow. Tug standing by.' },
    { id: 'OBS-0421', t: '2026-10-14 06:55', type: 'Sheen', by: 'Guardian A', at: [-126.5600, 50.8175], text: 'Dull sheen in patches toward Hayle Bay.' },
    { id: 'OBS-0424', t: '2026-10-14 08:10', type: 'Shoreline', by: 'Guardian B', at: [-126.5641, 50.8170], text: 'Light oiling on rock, ~40 m. No wildlife oiled.' },
    { id: 'OBS-0426', t: '2026-10-14 08:40', type: 'Wildlife', by: 'Skipper G', at: [-126.5590, 50.8140], text: '~20 surf scoters south of the sheen. None oiled.' },
  ],
  '2026-039': [ { id: 'OBS-0405', t: '2026-10-12 10:40', type: 'Sheen', by: 'Guardian C', at: [-126.9155, 50.8585], text: 'No sheen observed.' } ],
};
const ACTIVITY = {  // ICS 214 pattern
  '2026-041': [
    { t: '2026-10-13 16:20', type: 'Report', text: 'VHF report from tug master: barge aground on Trivett Rock.' },
    { t: '2026-10-13 16:32', type: 'Decision', text: 'Incident opened, severity tier 2. Coordinator 1 is IC.' },
    { t: '2026-10-13 17:20', type: 'Action', text: 'Guardian vessel 1 departs Echo Bay with boom package A.' },
    { t: '2026-10-13 18:55', type: 'Action', text: 'Containment boom set at the barge.' },
    { t: '2026-10-13 21:30', type: 'Action', text: 'Exclusion boom set at Hayle Bay (GRS-04).' },
    { t: '2026-10-14 03:10', type: 'Action', text: 'Salvor seals the breach. Release stopped.' },
    { t: '2026-10-14 07:15', type: 'Resource', text: 'Coast Guard ER vessel requested.' },
  ],
  '2026-039': [ { t: '2026-10-09 11:30', type: 'Decision', text: 'Opened as Monitoring, severity tier 1.' } ],
};
const ICS201 = {
  '2026-041': [
    { op: 1, period: '13 Oct 17:00 – 14 Oct 06:00', submitted: '2026-10-13 18:10', by: 'Coordinator 1',
      situation: 'Fuel barge aground on Trivett Rock on a falling tide. Port bow tank breached; diesel releasing. Sheen moving west-southwest. No injuries.',
      objectives: ['Responder and public safety.', 'Contain the release at source.', 'Protect Hayle Bay (GRS-04).'],
      actions: [['17:20', 'Guardian vessel 1 departs Echo Bay with 800 ft boom.']],
      planned: ['Containment boom at the barge before dark.', 'Exclusion boom at Hayle Bay on the evening flood.'],
      weather: 'NW 10–15 kn easing. LW 19:42 (0.9 m), HW 02:05 (4.1 m).', safety: 'Work in pairs. PFDs at all times. No boarding the barge.' },
    { op: 2, period: '14 Oct 06:00 – 18:00', submitted: '2026-10-14 06:40', by: 'Coordinator 1',
      situation: 'Breach sealed 03:10; about 2,000 L released. Sheen in patches toward Hayle Bay; light shoreline oiling on the point. Containment and Hayle Bay boom holding.',
      objectives: ['Responder and public safety.', 'Hold containment until refloat.', 'Assess shoreline oiling.', 'Fill Logistics and Safety.'],
      actions: [['03:10', 'Salvor seals the breach.'], ['06:55', 'Sheen extent logged (OBS-0421).']],
      planned: ['Refloat on the 14:20 high water.', 'Shoreline assessment team to Hayle Bay point.', 'Drone imagery at low water.'],
      weather: 'Light, NW 10 kn afternoon. LW 08:01 (0.6 m), HW 14:20 (4.3 m).', safety: 'No solo work on oiled rock. All small craft 200 m clear during refloat.' },
  ],
  '2026-039': [
    { op: 1, period: '9 Oct – ongoing', submitted: '2026-10-09 13:20', by: 'Coordinator 2', situation: 'Derelict troller partly submerged. No sheen observed.',
      objectives: ['Monitor for release.', 'Confirm owner and fuel status.'], actions: [['11:05', 'Patrol report received.']], planned: ['Check every second day.'],
      weather: 'Seasonal.', safety: 'Do not board.' },
  ],
};
const ICS209 = {
  '2026-041': [
    { op: 2, submitted: '2026-10-14 07:05', kv: [['Release', 'Stopped 03:10'], ['Estimated release', '≈ 2,000 L diesel'], ['Recovered', '≈ 180 L'], ['Shoreline oiled', '~40 m, light'], ['Personnel', '8'], ['Boom deployed', '1,400 ft']] },
    { op: 1, submitted: '2026-10-13 19:00', kv: [['Release', 'Ongoing'], ['Recovered', '0'], ['Personnel', '6'], ['Boom deployed', '800 ft']] },
  ],
};

/* MR_Plans. `tier` here is PLAN LEVEL, shown as such. toolkit draws slate,
   not the amber the data model lists — amber is reserved (flagged to Cam). */
const PLANS = [
  { id: 'PLN-01', title: 'Territorial Marine Response Plan', tier: 'territorial', version: 'v2.1', updated: '2026-08-30', owner: '[Nation]', status: 'current', pages: 4 },
  { id: 'PLN-03', title: 'Sub-regional Response Plan', tier: 'sub_regional', version: 'draft 3', updated: '2026-06-14', owner: 'Council', status: 'current', pages: 4 },
  { id: 'PLN-04', title: 'Northern Shelf Bioregion Framework', tier: 'nsb', version: '2024', updated: '2024-11-01', owner: 'NSB partners', status: 'current', pages: 3 },
  { id: 'PLN-05', title: 'Shoreline Assessment Toolkit', tier: 'toolkit', version: 'v1.2', updated: '2026-05-02', owner: 'Council', status: 'current', pages: 3 },
  { id: 'PLN-06', title: 'ICS 201 Briefing Job Aid', tier: 'toolkit', version: 'v1', updated: '2026-03-15', owner: 'Council', status: 'current', pages: 2 },
];
