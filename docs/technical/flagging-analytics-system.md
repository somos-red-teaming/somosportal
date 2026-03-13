# Flagging Analytics System - Technical Documentation

## Overview

The Flagging Analytics System provides administrators with comprehensive tools to review, manage, and analyze flagged AI responses. It includes a dashboard with real-time statistics, filtering, interactive charts, and data export capabilities.

**Performance:** Optimized with SQL aggregation and debounced search for sub-second load times even with thousands of flags.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Flags Page                          │
│                   /admin/flags                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Total   │ │ Pending │ │ Under   │ │Resolved │ │ High   ││
│  │ Flags   │ │         │ │ Review  │ │         │ │Severity││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ By Category  │ │ By Model     │ │Top Submitters│        │
│  │    Chart     │ │    Chart     │ │    Chart     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  [Search] [Status Filter] [Category Filter] [CSV] [JSON]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Flags Table                          ││
│  │  Category | Severity | Exercise | Model | Status | Date ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Page Load
   └─> fetchStats() → /api/flags/admin/stats
       └─> Calls get_flag_statistics() SQL function
           └─> Returns: byCategory, byModel, byUser, status counts
           └─> All aggregation done in PostgreSQL (fast!)
   
2. Table Data
   └─> fetchFlags() → /api/flags/admin?page=X&status=Y&category=Z
       └─> Paginated flags with relations (user, model, exercise)
       └─> Debounced search (300ms) prevents API spam

3. Status Update
   └─> updateStatus() → supabase.from('flags').update()
       └─> Sets status, reviewed_by, reviewed_at, reviewer_notes

4. Category Filter
   └─> fetchCategories() → supabase.from('flag_categories')
       └─> Dynamic categories from flag packages
```

4. Export
   └─> exportFlags() → /api/flags/admin?limit=1000
       └─> Generates CSV or JSON blob → triggers download
```

---

## Performance Optimizations

### Problem: Slow Page Load

**Original Issue:**
- Fetching 1000+ flags on page load to calculate statistics
- ~2000 extra queries (per-flag lookups for users + interactions)
- Full table scans of ai_models and exercises on every request
- No debounce on search input (API spam on every keystroke)
- **Result:** 3-5 second lag on page load

### Solution: SQL Aggregation + Debouncing

**Implemented:**
1. **SQL Function** (`get_flag_statistics()`) - All aggregation in PostgreSQL
2. **Dedicated Stats Endpoint** (`/api/flags/admin/stats`) - Calls SQL function
3. **Debounced Search** (300ms delay) - Prevents API spam
4. **Dynamic Categories** - Fetches from flag_packages instead of hardcoded

**Performance Improvement:** ~90% reduction in load time (sub-second response)

---

## SQL Function: get_flag_statistics()

### Purpose
Aggregates flag statistics entirely in PostgreSQL, avoiding the need to fetch and process thousands of rows in JavaScript.

### Location
`/database/get_flag_statistics.sql`

### Deployment Instructions

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the SQL Function**
   ```bash
   # Copy contents of database/get_flag_statistics.sql
   # Or run directly:
   cat database/get_flag_statistics.sql | pbcopy  # macOS
   # Paste into SQL Editor and click "Run"
   ```

3. **Verify Function Exists**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'get_flag_statistics';
   ```

### What It Does

The function performs these aggregations in a single database call:

1. **Status Counts** - Total, pending, under_review, resolved, dismissed
2. **Severity Counts** - High (≥8), medium (5-7), low (<5)
3. **Category Counts** - Expands `evidence.categories` array for accurate counts
4. **Model Counts** - Joins `interactions → ai_models` AND falls back to `evidence.modelId`
5. **User Counts** - Top 10 submitters, grouped by `user_id` to avoid name collisions

### Key Features

**Handles Edge Cases:**
- ✅ Flags with multiple categories in `evidence.categories` array
- ✅ Flags without `interaction_id` but with `evidence.modelId`
- ✅ Users with duplicate names (groups by `user_id`)
- ✅ Empty result sets (returns empty arrays instead of null)

**SQL Implementation:**
See full implementation in `/database/get_flag_statistics.sql`

Key techniques used:
- `COUNT(*) FILTER (WHERE ...)` for conditional aggregation
- `jsonb_array_elements_text()` to expand category arrays
- `LEFT JOIN` with multiple model sources (interactions + evidence)
- `COALESCE()` for fallback values
- `jsonb_build_object()` and `jsonb_agg()` for JSON output

**Returns:**
```json
{
  "total": 150,
  "pending": 45,
  "under_review": 20,
  "resolved": 70,
  "dismissed": 15,
  "bySeverity": {
    "high": 30,
    "medium": 80,
    "low": 40
  },
  "byCategory": [
    {"name": "harmful_content", "count": 45},
    {"name": "misinformation", "count": 32}
  ],
  "byModel": [
    {"name": "GPT-4", "count": 60},
    {"name": "Claude", "count": 50}
  ],
  "byUser": [
    {"name": "John Doe", "count": 25},
    {"name": "jane@example.com", "count": 18}
  ]
}
```

---

## API Endpoints

### GET /api/flags/admin/stats

**NEW** - Optimized statistics endpoint using SQL aggregation.

**Response Time:** <200ms (vs 3-5s previously)

**Query Parameters:** None

**Response:**
```json
{
  "total": 150,
  "pending": 45,
  "under_review": 20,
  "resolved": 70,
  "dismissed": 15,
  "bySeverity": {"high": 30, "medium": 80, "low": 40},
  "byCategory": [{"name": "Harmful Content", "count": 45}],
  "byModel": [{"name": "GPT-4", "count": 60}],
  "byUser": [{"name": "John Doe", "count": 25}]
}
```

**Implementation:**
```typescript
// app/api/flags/admin/stats/route.ts
const { data } = await supabase.rpc('get_flag_statistics')

// Applies category labels from categoryLabels map
const byCategory = data.byCategory.map(cat => ({
  name: categoryLabels[cat.name] || cat.name,
  count: cat.count
}))
```

### GET /api/flags/admin

Fetches flags with full relations for admin dashboard.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| status | string | Filter by status (pending, under_review, resolved, dismissed) |
| category | string | Filter by category |
| search | string | Search in description |

**Response:**
```json
{
  "flags": [
    {
      "id": "uuid",
      "category": "harmful_content",
      "severity": 8,
      "description": "...",
      "status": "pending",
      "evidence": {
        "categories": ["harmful_content", "misinformation"],
        "conversation": [
          {"type": "user", "content": "..."},
          {"type": "ai", "content": "..."}
        ]
      },
      "user": {"email": "...", "full_name": "..."},
      "model": {"name": "...", "blind_name": "..."},
      "interaction": {
        "exercise": {"title": "..."}
      }
    }
  ],
  "total": 100
}
```

### GET /api/export/flags

Exports flags data in CSV or JSON format.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | `csv` or `json` (default: json) |
| from | date | Start date filter (YYYY-MM-DD) |
| to | date | End date filter (YYYY-MM-DD) |
| exercise_id | uuid | Filter by exercise |

---

## Database Schema

### Flags Table

```sql
CREATE TABLE public.flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES interactions(id),
    user_id UUID REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);
```

### Evidence JSONB Structure

```json
{
  "modelId": "uuid",
  "categories": ["category1", "category2"],
  "conversation": [
    {"type": "user", "content": "...", "timestamp": "..."},
    {"type": "ai", "content": "...", "timestamp": "..."}
  ],
  "timestamp": "ISO date string"
}
```

---

## Flag Categories

| Category | Description |
|----------|-------------|
| harmful_content | Content that could cause harm |
| misinformation | False or misleading information |
| bias_discrimination | Biased or discriminatory responses |
| privacy_violation | Disclosure of private information |
| inappropriate_response | Inappropriate or offensive content |
| factual_error | Incorrect factual information |
| off_topic | Response not relevant to prompt |
| spam | Repetitive or spam-like content |
| other | Other issues |

---

## Flag Templates

Pre-defined templates for quick flag submission:

| Template | Categories | Severity | Pre-filled Comment |
|----------|------------|----------|-------------------|
| Harmful Content | harmful_content | 8 | "AI generated potentially harmful content including: " |
| Factual Error | factual_error | 5 | "AI provided incorrect information about: " |
| Bias Detected | bias_discrimination | 7 | "Response shows bias toward: " |
| Misinformation | misinformation | 8 | "AI spread false information regarding: " |
| Privacy Issue | privacy_violation | 9 | "AI disclosed or requested sensitive information: " |

---

## Charts Implementation

Using Recharts library for visualization.

### Current Charts

#### Flags by Category
- Horizontal bar chart
- Color-coded bars (different color per category)
- Shows count per category
- Data source: `stats.byCategory`

#### Flags by Model
- Horizontal bar chart
- Blue bars (#3b82f6)
- Shows which AI models receive most flags
- Data source: `stats.byModel`

#### Top Submitters
- Horizontal bar chart
- Green bars (#22c55e)
- Shows top 10 users by flag count
- Uses full_name (falls back to email)
- Data source: `stats.byUser`

### Adding New Charts

**Easy to extend!** The system is designed for adding new visualizations.

**Steps to add a new chart:**

1. **Update SQL Function** (`/database/get_flag_statistics.sql`)
   ```sql
   -- Example: Add severity over time
   SELECT jsonb_agg(jsonb_build_object('date', date, 'count', cnt))
   INTO severity_timeline
   FROM (
     SELECT DATE(created_at) as date, COUNT(*) as cnt
     FROM flags
     WHERE severity >= 8
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 30
   ) timeline;
   
   -- Add to result
   result := result || jsonb_build_object('severityTimeline', severity_timeline);
   ```

2. **Update Stats Interface** (`app/admin/flags/page.tsx`)
   ```typescript
   interface Stats {
     // ... existing fields
     severityTimeline?: { date: string; count: number }[]
   }
   ```

3. **Add Chart Component**
   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>High Severity Flags (Last 30 Days)</CardTitle>
     </CardHeader>
     <CardContent>
       <ResponsiveContainer width="100%" height={200}>
         <LineChart data={stats.severityTimeline}>
           <XAxis dataKey="date" />
           <YAxis />
           <Tooltip />
           <Line type="monotone" dataKey="count" stroke="#ef4444" />
         </LineChart>
       </ResponsiveContainer>
     </CardContent>
   </Card>
   ```

**Potential New Charts:**
- Flags over time (timeline)
- Severity distribution by model
- Response time to flag resolution
- Category breakdown by exercise
- Heatmap of flag activity by day/hour
- Comparison charts (model A vs model B)

**Chart Library:** Recharts supports:
- Line charts, Area charts, Pie charts, Scatter plots
- Composed charts (multiple chart types)
- Custom tooltips and legends
- Responsive design

---

## Status Workflow

```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│ pending │ ──> │ under_review │ ──> │ resolved │
└─────────┘     └──────────────┘     └──────────┘
                       │                   
                       └──────────────> ┌───────────┐
                                        │ dismissed │
                                        └───────────┘
```

**Status Descriptions:**
- **pending**: New flag, not yet reviewed
- **under_review**: Admin is investigating
- **resolved**: Issue confirmed and addressed
- **dismissed**: Flag rejected (false positive, duplicate, etc.)

---

## Security

### RLS Policies

```sql
-- Users can view their own flags
CREATE POLICY "View flags" ON public.flags
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR is_moderator_or_admin()
    );

-- Users can create flags
CREATE POLICY "Create flags" ON public.flags
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

-- Moderators can update flag status
CREATE POLICY "Moderators update flags" ON public.flags
    FOR UPDATE USING (is_moderator_or_admin());
```

### Admin API Authentication

The `/api/flags/admin` endpoint uses the service role key to bypass RLS for admin access:

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## File Structure

```
app/
├── admin/
│   ├── flags/
│   │   └── page.tsx          # Flags dashboard
│   └── export/
│       └── page.tsx          # Export page
├── api/
│   ├── flags/
│   │   ├── route.ts          # Flag submission (POST)
│   │   └── admin/
│   │       └── route.ts      # Admin flags API (GET)
│   └── export/
│       ├── flags/
│       │   └── route.ts      # Flags export
│       ├── interactions/
│       │   └── route.ts      # Interactions export
│       └── exercises/
│           └── route.ts      # Exercises export
```

---

*Last Updated: January 1, 2026*
