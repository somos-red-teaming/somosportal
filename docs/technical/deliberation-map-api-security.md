# Deliberation Map & API Security

**Document Type:** Technical Documentation  
**Last Updated:** March 27, 2026  
**Platform:** SOMOS AI Red-Teaming Platform

---

## Overview

This document covers two additions to the platform: the Deliberation Map visualization system and the server-side admin authentication guard applied to all admin API routes.

---

## Server-Side Admin Authentication

### Problem

Admin API routes (`/api/flags/admin/*`, `/api/export/*`) used the Supabase service role key to query data but never verified the caller was an authenticated admin. Anyone with the URL could access sensitive flag data, prompts, responses, and exports.

### Solution

A reusable `requireAdmin()` helper verifies the caller's session and role before any data is returned.

### Implementation

```
lib/auth/requireAdmin.ts
```

**How it works:**

1. Reads the Supabase session from request cookies (SSR client)
2. Calls `supabase.auth.getUser()` to verify authentication
3. Looks up the user's role in the `users` table
4. Returns `401 Unauthorized` if not authenticated
5. Returns `403 Forbidden` if authenticated but not admin
6. Returns `{ authorized: true, userId }` if admin

### Protected Routes

| Route | Data Exposed |
|-------|-------------|
| `/api/flags/admin/` | Full flag list with details |
| `/api/flags/admin/stats` | Aggregated flag statistics |
| `/api/flags/admin/clusters` | Flag cluster data with prompt/response previews |
| `/api/export/flags` | CSV/JSON export of all flags |
| `/api/export/exercises` | Exercise data export |
| `/api/export/interactions` | All interactions export |

### Usage in Route Handlers

```typescript
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response
  }
  // ... proceed with service role queries
}
```

---

## Deliberation Map

### Purpose

Visual tool for deliberation sessions. Displays flagged harms as a constellation-style network graph, designed for projector use during group discussions about AI harm patterns.

### Architecture

```
Page:       app/admin/deliberation/page.tsx
Component:  components/ConstellationGraph.tsx
API:        app/api/flags/admin/clusters/route.ts
```

### Cluster Data API

**Endpoint:** `GET /api/flags/admin/clusters`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `exercise_id` | UUID | null | Filter by exercise (optional) |
| `limit` | number | 50 | Max nodes per cluster (max 200) |

**Response:**

```json
{
  "clusters": [
    { "id": "misinformation", "name": "misinformation", "totalCount": 15, "avgSeverity": 6.2, "nodeCount": 15 }
  ],
  "nodes": [
    { "id": "flag-uuid", "category": "misinformation", "severity": 7, "status": "pending", "modelName": "Haiku4", "exerciseTitle": "Rwanda Scenario", "promptPreview": "...", "responsePreview": "..." }
  ],
  "links": [
    { "source": "flag-uuid-1", "target": "flag-uuid-2" }
  ]
}
```

**Scale handling:**
- Flags are aggregated into clusters server-side
- Nodes are capped per cluster (default 50, max 200) to prevent browser overload
- Links are O(n) per cluster (chain + cross-links), not O(n²)
- Highest severity flags are prioritized when capping

### D3 Force Graph

The `ConstellationGraph` component uses D3.js force simulation with:

| Force | Purpose |
|-------|---------|
| `forceLink` | Connects nodes within clusters |
| `forceManyBody` | Repels nodes to prevent overlap |
| `forceCollide` | Collision detection based on node radius |
| Custom cluster force | Pulls nodes toward their category center |
| `forceCenter` | Keeps the graph centered |

**Node sizing:** Severity 1–10 maps to radius 4–28px  
**Glow effect:** SVG filter applied to nodes with severity ≥ 8  
**Colors:** SOMOS brand palette (gold, sage, peach, mauve, warm gray, soft blue, soft green, soft pink)

### Flags Stats Filter by Exercise

**Problem:** Charts on `/admin/flags/` showed aggregated stats regardless of exercise filter selection.

**Fix:**
- `get_flag_statistics()` SQL function updated to accept optional `p_exercise_id` parameter
- Stats API accepts `exercise_id` query param
- Flags page re-fetches stats when exercise filter changes
- All sub-queries (status, severity, category, model, user) filter by exercise via `interactions.exercise_id`

**SQL function location:** `database/get_flag_statistics.sql`

---

## Exercise Model Selector

**Problem:** Exercise creation form hid valid models due to aggressive name filters (`.not('name', 'ilike', '%test%')`) and displayed models as inline badges that were hard to scan.

**Fix:**
- Removed test name filters — all active models now appear
- Replaced badges with scrollable checkbox list
- Each row shows: checkbox, display name, `provider/model_id`
- Models ordered by provider then name

**File:** `app/admin/exercises/page.tsx`
