# Exercise System - Technical Implementation

**Status:** ✅ Complete (Week 5-6)  
**Last Updated:** December 11, 2025

---

## 🎯 System Overview

The Exercise System manages the complete lifecycle of AI red-teaming exercises, from creation to participant management and progress tracking. It provides both admin and participant interfaces for comprehensive exercise management.

---

## 🏗️ Architecture

### Database Schema Extensions

**Enhanced Exercises Table:**
```sql
-- New fields added to exercises table
ALTER TABLE exercises ADD COLUMN start_date TIMESTAMPTZ;
ALTER TABLE exercises ADD COLUMN end_date TIMESTAMPTZ;
ALTER TABLE exercises ADD COLUMN max_participants INTEGER;
ALTER TABLE exercises ADD COLUMN target_models TEXT[];
```

**RLS Function for Participant Counting:**
```sql
CREATE OR REPLACE FUNCTION get_exercise_participant_count(exercise_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.exercise_participation
    WHERE exercise_id = exercise_uuid
    AND status = 'active';
$$;
```

### Component Architecture

```
Exercise System
├── Admin Interface
│   ├── Exercise Creation/Edit Form
│   ├── Participant Management
│   └── Exercise Lifecycle Controls
├── Participant Interface
│   ├── Exercise Discovery
│   ├── Join/Leave Functionality
│   └── Progress Tracking
└── Shared Components
    ├── Exercise Cards
    ├── Participant Counters
    └── Status Indicators
```

---

## 🔧 Core Features

### 1. Exercise Lifecycle Management

**File:** `app/admin/exercises/page.tsx`

**Features:**
- Exercise creation with comprehensive configuration
- Scheduling with start/end dates
- Participant limits (max_participants)
- Target AI model selection
- Status management (draft, active, inactive)

**Implementation:**
```typescript
interface Exercise {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  status: string
  guidelines: string
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  target_models: string[] | null
  created_at: string
  participant_count?: number
}
```

### 2. Participant Management

**Files:**
- `app/exercises/page.tsx` - Exercise discovery and joining
- `app/exercise/[id]/ExerciseClient.tsx` - Individual exercise interaction

**Key Functions:**
```typescript
// Join exercise with validation
const handleJoin = async (exerciseId: string) => {
  // Check if exercise is full
  if (exercise?.max_participants && participantCount >= exercise.max_participants) {
    alert('This exercise is full and cannot accept more participants.')
    return
  }
  
  await supabase.from('exercise_participation').insert({
    exercise_id: exerciseId,
    user_id: userData.id,
    status: 'active',
  })
}

// Leave exercise
const handleLeave = async (exerciseId: string) => {
  await supabase.from('exercise_participation')
    .delete()
    .eq('exercise_id', exerciseId)
    .eq('user_id', userData.id)
}
```

### 3. Progress Tracking

**Real-time Participant Counting:**
```typescript
// RLS-safe participant count using database function
const { data: countData } = await supabase
  .rpc('get_exercise_participant_count', { exercise_uuid: params.id })
setParticipantCount(countData || 0)
```

**Progress Indicators:**
- Participant count with limits ("X participants / Y max")
- Exercise status badges (Joined, Full, Active)
- Date range displays
- Progress tracking for individual participants

---

## 🔒 Security Implementation

### Row Level Security (RLS)

**Challenge:** Participant counts needed to be visible to all users while maintaining privacy of individual participation records.

**Solution:** Created RLS-safe function using `SECURITY DEFINER`:

```sql
-- Function bypasses RLS for counting only
CREATE OR REPLACE FUNCTION get_exercise_participant_count(exercise_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER  -- Runs with elevated privileges
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.exercise_participation
    WHERE exercise_id = exercise_uuid
    AND status = 'active';
$$;
```

**Benefits:**
- Public participant counts without exposing individual data
- Maintains user privacy
- Enables real-time count updates across sessions

### Access Control

**Admin Permissions:**
- Full CRUD operations on exercises
- View all participant data
- Manage exercise lifecycle

**Participant Permissions:**
- View active exercises
- Join/leave exercises (if not full)
- View own participation status
- Access exercise content when joined

---

## 🎨 User Experience Features

### Enhanced UI Components

**Loading States:**
```typescript
const [saving, setSaving] = useState(false)

// Prevent double-clicks during form submission
<Button onClick={handleSave} disabled={saving}>
  {saving ? 'Saving...' : 'Save Exercise'}
</Button>
```

**Colored Action Buttons:**
- Make Admin: Blue (`bg-blue-500`)
- Make Participant: Gray (`bg-gray-500`)
- Activate: Blue (`bg-blue-500`)
- Deactivate: Red (`bg-red-500`)

**Exercise Status Indicators:**
- Joined exercises: Green checkmark badge
- Full exercises: "Exercise Full" disabled button
- Date ranges: Calendar icon with formatted dates

### Responsive Design

**Mobile Optimization:**
- Touch-friendly buttons and forms
- Responsive grid layouts
- Optimized typography for small screens
- Swipe-friendly card interfaces

---

## 📊 Data Flow

### Exercise Creation Flow
```
Admin → Form Input → Validation → Database Insert → UI Update → Notification
```

### Participant Join Flow
```
User → Exercise Selection → Capacity Check → Database Insert → Count Update → UI Refresh
```

### Real-time Updates
```
Database Change → RPC Function Call → State Update → UI Re-render
```

---

## 🧪 Testing Strategy

### Multi-User Testing
- Tested participant counting across different user sessions
- Verified exercise full state prevents new joins
- Confirmed RLS policies work correctly

### Edge Cases Handled
- Exercise at capacity
- Concurrent join attempts
- Network failures during join/leave
- Invalid date ranges
- Missing required fields

### Performance Testing
- Participant count queries optimized
- Database function performance validated
- UI responsiveness under load

---

## 🔄 Integration Points

### Prepared for AI Integration (Week 7-8)
- `target_models` field ready for AI provider selection
- Exercise configuration supports multiple AI models
- Participant tracking ready for interaction logging

### Database Relationships
```sql
exercises (1) → (many) exercise_participation
exercises (1) → (many) interactions (future)
users (1) → (many) exercise_participation
```

---

## 📈 Performance Metrics

**Database Queries:**
- Participant count: Single RPC call
- Exercise list: Optimized with pagination
- Join/leave: Single INSERT/DELETE operation

**UI Performance:**
- Loading states prevent double submissions
- Optimistic updates for better UX
- Minimal re-renders with proper state management

**Security:**
- RLS policies enforced on all tables
- Input validation on all forms
- SQL injection prevention with parameterized queries

---

## 🚀 Future Enhancements

**Ready for Week 7-8:**
- AI model integration using `target_models` field
- Real API responses replacing placeholder text
- Interaction logging and tracking

**Potential Improvements:**
- Real-time participant count updates via WebSocket
- Exercise templates for common scenarios
- Bulk participant management
- Exercise analytics dashboard

---

## Model Selector (Updated March 2026)

The exercise creation form fetches all active models from `ai_models` table and displays them in a scrollable checkbox list. Each row shows the display name and `provider/model_id`.

```typescript
// Query: all active models, ordered by provider then name
const { data } = await supabase
  .from('ai_models')
  .select('id, name, display_name, provider, model_id, temperature')
  .eq('is_active', true)
  .order('provider')
  .order('name')
```

Selected models are assigned to exercises via the `exercise_models` junction table with blind names and optional temperature overrides.

**File:** `app/admin/exercises/page.tsx`

---

*Exercise System Technical Documentation - Updated March 27, 2026*
