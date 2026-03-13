# Flag Analytics & Deliberation Features - Implementation Plan

**Date:** March 12, 2026  
**Requested by:** Carlos  
**Goal:** Make flag data useful for deliberation by linking flags to conversations and showing visual trends

---

## Problem Statement

Current flag exports show metadata (category, severity, status) but not the actual conversation content. With many participants, it's impossible to:
- Understand what was flagged without cross-referencing
- See patterns and trends across flags
- Deliberate on results efficiently

---

## Solution Overview

1. **Enhanced Flag Export** - Include conversation content with flags
2. **Flag Analytics Dashboard** - Visual trends and patterns
3. **Deliberation View** - Summary for participants to review

---

## Implementation Tasks

### Phase 1: Enhanced Flag Export (Priority: HIGH)

**Goal:** Include full conversation context in flag exports

#### Task 1.1: Update Flag Data Query
- [ ] Modify flag export query to JOIN with interactions table
- [ ] Include: user prompt, AI response, conversation history
- [ ] Add conversation_id to flag records for linking
- [ ] Test query performance with large datasets

**Files to modify:**
- `app/admin/export/page.tsx` - Export functionality
- Database query to join `flags` with `interactions`

**Data structure:**
```
Flag Export Row:
- flag_id
- category
- severity
- status
- description
- exercise_name
- model_name
- user_prompt (from interactions)
- ai_response (from interactions)
- conversation_history (JSON or formatted text)
- flagged_at
- flagged_by (user email)
```

#### Task 1.2: Update CSV/JSON Export Format
- [ ] Add new columns for conversation data
- [ ] Handle multi-turn conversations (format as readable text)
- [ ] Ensure large text fields don't break CSV format
- [ ] Add option to export with/without conversation content

**Files to modify:**
- `app/admin/export/page.tsx` - CSV generation logic

---

### Phase 2: Flag Analytics Dashboard (Priority: HIGH)

**Goal:** Visual summary of flag patterns and trends

#### Task 2.1: Create Flag Analytics Page
- [ ] New page: `app/admin/flag-analytics/page.tsx`
- [ ] Add navigation link in admin menu

#### Task 2.2: Aggregate Flag Statistics
- [ ] Query: Count flags by category
- [ ] Query: Count flags by severity level
- [ ] Query: Count flags by model
- [ ] Query: Count flags by exercise
- [ ] Query: Flags over time (trend)

**API endpoint (optional):**
- `app/api/flags/analytics/route.ts`

#### Task 2.3: Build Visualizations
- [ ] Bar chart: Flags by category (top 10)
- [ ] Pie chart: Severity distribution
- [ ] Heatmap: Model vs Category matrix
- [ ] Line chart: Flags over time
- [ ] Summary cards: Total flags, pending flags, resolved flags

**Libraries to use:**
- Recharts (already in project?) or Chart.js
- Or simple HTML/CSS bar charts for MVP

**UI Components:**
```
Flag Analytics Dashboard
├── Summary Cards (top)
│   ├── Total Flags
│   ├── Pending Review
│   ├── Resolved
│   └── Top Category
├── Charts (main area)
│   ├── Flags by Category (bar chart)
│   ├── Severity Distribution (pie/donut)
│   ├── Model Comparison (heatmap)
│   └── Trend Over Time (line chart)
└── Filters (sidebar)
    ├── Date range
    ├── Exercise
    ├── Model
    └── Status
```

---

### Phase 3: Enhanced Flag Review UI (Priority: MEDIUM)

**Goal:** Show conversation context when reviewing individual flags

#### Task 3.1: Update Admin Flags Page
- [ ] Modify `app/admin/flags/page.tsx`
- [ ] Add "View Conversation" button/modal for each flag
- [ ] Show full conversation thread when viewing flag details
- [ ] Highlight the specific interaction that was flagged

#### Task 3.2: Flag Detail Modal
- [ ] Create modal component to show:
  - Flag metadata (category, severity, description)
  - Full conversation history
  - User who flagged it
  - Timestamp
  - Action buttons (resolve, escalate, etc.)

---

### Phase 4: Deliberation Summary View (Priority: MEDIUM)

**Goal:** Participant-friendly summary for post-exercise deliberation

#### Task 4.1: Create Public Deliberation Page
- [ ] New page: `app/exercise/[id]/results/page.tsx`
- [ ] Accessible to exercise participants (not just admins)
- [ ] Show aggregated results for that exercise only

#### Task 4.2: Summary Content
- [ ] Top 5 harm categories identified
- [ ] Example flags for each category (2-3 examples)
- [ ] Model comparison (which model had more flags)
- [ ] Participant statistics (how many people flagged issues)

**UI Structure:**
```
Exercise Results Summary
├── Overview
│   ├── Total participants
│   ├── Total flags submitted
│   └── Exercise completion rate
├── Key Findings
│   ├── Top Harm Categories (with counts)
│   └── Example for each category
├── Model Comparison
│   └── Flags per model (anonymized as Alpha, Beta, etc.)
└── Export Options
    └── Download full results (CSV)
```

---

## Database Schema Changes

### Option A: No schema changes (use existing data)
- Flags already have `interaction_id` or `session_id`?
- Check current schema to see if we can JOIN

### Option B: Add conversation reference (if missing)
```sql
ALTER TABLE flags ADD COLUMN interaction_id UUID REFERENCES interactions(id);
ALTER TABLE flags ADD COLUMN session_id UUID;
```

**Action:** Check current schema first before deciding

---

## Technical Considerations

### Performance
- Flag analytics queries may be slow with large datasets
- Consider adding database indexes:
  - `CREATE INDEX idx_flags_category ON flags(category);`
  - `CREATE INDEX idx_flags_created_at ON flags(created_at);`
  - `CREATE INDEX idx_flags_exercise_id ON flags(exercise_id);`

### Data Privacy
- Ensure conversation content in exports respects privacy
- Consider anonymizing user identifiers in exports
- Add admin-only access controls for detailed data

### Export File Size
- Large conversations may create huge CSV files
- Consider pagination or splitting exports by exercise
- Add option to export "summary only" vs "full detail"

---

## Implementation Priority

**For Tomorrow (Carlos's deadline):**
1. ✅ Enhanced Flag Export (Phase 1) - MUST HAVE
2. ✅ Basic Flag Analytics (Phase 2.1-2.2) - MUST HAVE
3. ⏳ Simple visualizations (Phase 2.3) - NICE TO HAVE

**Next Week:**
4. Enhanced Flag Review UI (Phase 3)
5. Deliberation Summary View (Phase 4)

---

## Testing Checklist

- [ ] Export flags with conversation content (CSV)
- [ ] Export flags with conversation content (JSON)
- [ ] Verify conversation text is readable in spreadsheet
- [ ] Test with multi-turn conversations
- [ ] Test with large datasets (100+ flags)
- [ ] Verify analytics calculations are correct
- [ ] Test filters on analytics dashboard
- [ ] Check mobile responsiveness of charts
- [ ] Verify RLS policies allow admins to see all data

---

## Questions to Clarify with Carlos

1. Does he want conversation content in the export by default, or as an option?
2. What specific visualizations are most important for deliberation?
3. Should participants see aggregated results, or only admins?
4. What time range should analytics cover (all time, per exercise, custom)?
5. Does he need this for a specific exercise happening tomorrow?

---

## Files to Create/Modify

**New Files:**
- `app/admin/flag-analytics/page.tsx` - Analytics dashboard
- `app/api/flags/analytics/route.ts` - Analytics API (optional)
- `app/exercise/[id]/results/page.tsx` - Deliberation view (later)
- `components/FlagAnalyticsCharts.tsx` - Chart components

**Modified Files:**
- `app/admin/export/page.tsx` - Enhanced export
- `app/admin/flags/page.tsx` - Add conversation view
- `app/admin/page.tsx` - Add link to analytics

---

## Success Criteria

✅ Admins can export flags with full conversation context  
✅ Admins can see visual trends (which categories are most flagged)  
✅ Deliberation is possible without manually cross-referencing data  
✅ Participants can understand results without technical knowledge  
✅ Export files are readable in Excel/Google Sheets  

---

## Next Steps

1. Review this plan with Carlos
2. Clarify questions above
3. Check current database schema for conversation linking
4. Start with Phase 1 (Enhanced Export) - highest priority
5. Build Phase 2 (Analytics) in parallel if time allows
