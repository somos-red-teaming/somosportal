# Flagging Analytics System - Technical Documentation

## Overview

The Flagging Analytics System provides administrators with comprehensive tools to review, manage, and analyze flagged AI responses. It includes a dashboard with statistics, filtering, charts, and data export capabilities.

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
   └─> fetchStats() → /api/flags/admin?limit=1000
       └─> Aggregates: byCategory, byModel, byUser, status counts
   
2. Table Data
   └─> fetchFlags() → /api/flags/admin?page=X&status=Y&category=Z
       └─> Paginated flags with relations (user, model, exercise)

3. Status Update
   └─> updateStatus() → supabase.from('flags').update()
       └─> Sets status, reviewed_by, reviewed_at, reviewer_notes

4. Export
   └─> exportFlags() → /api/flags/admin?limit=1000
       └─> Generates CSV or JSON blob → triggers download
```

---

## API Endpoints

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

Using Recharts library for visualization:

### Flags by Category
- Horizontal bar chart
- Color-coded bars (different color per category)
- Shows count per category

### Flags by Model
- Horizontal bar chart
- Blue bars
- Shows which AI models receive most flags

### Top Submitters
- Horizontal bar chart
- Green bars
- Shows top 10 users by flag count
- Uses full_name (falls back to email)

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
