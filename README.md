# Marine COP — walkthrough demo (Broughton Archipelago)

A clickable demonstration of the Common Operating Picture on real satellite
imagery of the Broughton. It shows how the system would be used; it is not the
production build.

**Everything except the basemap is fictitious.** Incidents, people, equipment,
response strategies, plans, observations, alerts, and every cultural and
archaeological feature are invented. Place names are real so the map reads.
The things placed at them are not.

## Before showing it to anyone

**Check the fictitious cultural and archaeological placements against the real
data.** They are in `js/data.js` (`CULTURAL`, `ARCH`). The only check I could do
was distance: each sits in a bay at least 5.8 km from the nearest Indian Reserve
point in the Canadian Geographical Names Database. That is **not** a check
against cultural data, which never came near this folder.

| ID | Bay | Shape | Nearest reserve point |
|---|---|---|---|
| DEMO-CS-01 | Reid Bay | 450 m buffer | 6.1 km |
| DEMO-CS-02 | Harry Bay | 400 m buffer | 8.7 km |
| DEMO-CS-03 | Laura Bay | 400 m buffer | 6.4 km |
| DEMO-CS-04 | Cullen Harbour | 500 m buffer | 7.3 km |
| DEMO-CS-05 | Cockatrice Bay | 450 m buffer | 7.8 km |
| DEMO-CS-06 | Wahkana Bay | 450 m buffer | 7.1 km |
| DEMO-CS-07 | Levesque Bay | 400 m buffer | 12.1 km |
| DEMO-AR-01 | Dobbin Bay | polygon | 10.8 km |
| DEMO-AR-02 | Watson Cove | polygon | 7.6 km |

To move one, change its `at` (or `ring`) coordinates, given as `[longitude, latitude]`.

## Run it locally

It needs a web server; opening `index.html` straight from disk is not reliable
with the ArcGIS SDK. Any static server works:

```
npx serve .
```

Then open the address it prints.

## Publish on GitHub Pages

1. Make a **new public repository** just for this demo. Don't use the COP repo.
   That repo is meant to live private in the Nanwakolas organisation (CLAUDE.md §10),
   and Pages on a private repo needs a paid plan.
2. Upload the contents of this folder (`index.html`, `css/`, `js/`, this README) to the repo root.
3. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root.**
4. The site appears at `https://<account>.github.io/<repo>/` within a minute or two.

A Pages site is public. The page asks search engines not to index it (`noindex`),
but anyone with the link can open it.

## Walkthrough script (about 10 minutes)

1. **COP, live incident.** Amber means one thing: something is happening right
   now. Point at the switcher, the pulsing marker, the slick, and the ops dock.
2. **Pan and zoom** around the Broughton. Use the satellite / light grey toggle
   (layer panel, or the globe button) to show why the calm grey ground exists.
3. **Click things**: a GRS ring, then **Strategy sheet**. The PDF opens inside
   the app. Click an equipment icon and note the condition dot.
4. **Layers → Cultural sites + buffers.** It's off by default, and fictitious.
5. **Incident page** (dock card or rail): the timeline puts activity, field
   observations and ICS forms on one spine. Open **ICS 201** and switch between
   OP 1 and OP 2. Click a field observation to find it on the map.
6. **Tasks / Resources**: edit a status live.
7. **Crew**: certification flags; drag a person onto a dashed ICS slot.
8. **Assets**: change a condition and watch the map icon change.
9. **Log**: closed incidents folded away; selection follows the map.
10. **Demo scenario → Readiness.** The amber disappears and the dock flips to
    readiness. Toggle the **moon** button for the dark ops theme.

Edits last until the page reloads. Reloading resets the demo.

## How it is built, and where it differs from production

- Plain HTML/CSS/JS with no build step. Production is React + TypeScript + Vite (CLAUDE.md §3).
- ArcGIS Maps SDK **4.30** (matches Enterprise 11.4), loaded from Esri's CDN.
  Production bundles the SDK and its assets locally (§9).
- Layers are client-side `FeatureLayer`s built from `js/data.js`. Production
  points the same layers at portal feature services. Renderers, labels and
  click handling keep the same shape.
- Basemaps are Esri's public raster tile services (World Imagery, Light Gray
  Canvas, World Ocean Base). No API key needed; checked 2026-10-14.
- Strategy sheets and plans are real PDFs that `js/pdf.js` generates in the
  browser, each watermarked FICTITIOUS.
- No sign-in. The access model is deliberately out of scope for this demo.

| File | What it holds |
|---|---|
| `js/data.js` | All fixtures. Edit here to change the scenario |
| `js/icons.js` | Every map symbol and UI icon, one source |
| `js/map.js` | The single shared MapView and its layers |
| `js/app.js` | Pages, cards, editing, drag and drop |
| `js/pdf.js` | Fake PDF generator |
| `css/app.css` | Design tokens (CLAUDE.md §7) and layout |

## Known limits

- Built and checked in Chrome at desktop size. Safari/iPad and phone layouts
  were not tested. iPad Safari tends to show only the first page of an inline PDF.
- Drag and drop was exercised with scripted drag events. A real mouse drag in
  Chrome should behave the same but was not tested by hand.
- Dates are fixed to 13–14 October 2026, so certification expiry flags are
  computed against that date, not today.
