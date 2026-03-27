# Carlos Requests - March 2026

## 1. Flags Stats Filter by Exercise
**Priority:** High (bug fix)
**Branch:** `fix/flags-stats-exercise-filter`
**Page:** `/admin/flags/`

### Problem
When filtering flags by exercise on the admin flags page, the data viz charts still show aggregated stats across all exercises instead of reflecting the selected exercise filter.

### Fix
- Pass exercise filter param from flags page to `/api/flags/admin/stats` endpoint
- Update `get_flag_statistics()` SQL function to accept optional `exercise_id` parameter
- Filter the stats query when exercise is selected
- Charts update reactively when exercise filter changes

### Files
- `app/admin/flags/page.tsx` - Pass exercise filter to stats fetch
- `app/api/flags/admin/stats/route.ts` - Accept exercise_id query param
- `database/get_flag_statistics.sql` - Add WHERE clause for exercise_id

---

## 2. Constellation Cluster Visualization
**Priority:** Medium (new feature)
**Branch:** `feat/deliberation-clusters`
**Page:** `/admin/deliberation/` (new)

### Purpose
Visual tool for deliberation sessions. Shows flagged harms as a constellation/network graph on dark background. Used to guide group discussions about AI harm patterns.

### Design
- Dark/black background (constellation aesthetic)
- SOMOS brand colors for clusters
- Nodes = individual flags, size = severity level
- Clusters = harm categories grouping together
- Lines connecting related flags (same exercise, same model, etc.)
- Color-coded by harm category
- Interactive: zoom, pan, click to drill into clusters

### Reference
- Carlos's reference image: Shutterstock network visualization (force-directed graph)
- Existing internal D3 force graph code to adapt (NetworkGraph component with zoom, drag, hover)

### Tech
- D3.js force-directed graph
- Data source: flags table with categories, severity, exercise, model info
- Exercise selector dropdown to filter which data to visualize

### Files
- `app/admin/deliberation/page.tsx` - New page with exercise selector + dark canvas
- `components/ConstellationGraph.tsx` - D3 force graph component
- `app/api/flags/admin/clusters/route.ts` - API endpoint for cluster data

### Deliberation UX
- Full-screen friendly (projector use during sessions)
- Click cluster → shows list of flags in that category
- Hover node → shows flag details (prompt, response, severity)
- Legend showing category colors and severity scale

---

## TODO

- [x] **Stats filter:** Update SQL function to accept exercise_id param
- [x] **Stats filter:** Update stats API to pass exercise_id
- [x] **Stats filter:** Update flags page to send exercise filter to stats fetch
- [x] **Stats filter:** Test charts update when exercise selected
- [x] **Stats filter:** Push and verify on preview
- [x] **Constellation:** Create `/admin/deliberation/` page layout (dark theme)
- [x] **Constellation:** Build cluster data API endpoint
- [x] **Constellation:** Adapt D3 force graph component for flags data
- [x] **Constellation:** Add SOMOS brand colors and severity sizing
- [x] **Constellation:** Add hover tooltips (flag details)
- [x] **Constellation:** Add click-to-drill into clusters
- [x] **Constellation:** Add exercise selector dropdown
- [x] **Constellation:** Test with real flag data
- [x] **Constellation:** Push and verify on preview
- [ ] **Security:** Add server-side admin auth to `/api/flags/admin/*` (clusters, stats, route) - currently uses service role key without verifying caller is admin
- [ ] **Security:** Add server-side admin auth to `/api/export/*` (flags, exercises, interactions) - same issue
- [x] **Security:** Remove console.log from deliberation page fetchClusters (leaks prompt/response snippets)
- [ ] **Polish:** Tighten cluster force so nodes stay closer to labels
- [ ] **Polish:** Add glow/pulse on high severity nodes
- [x] **Polish:** Add nav links to admin page and dashboard
