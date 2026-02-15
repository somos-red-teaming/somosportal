# Exercise Timer Feature - Implementation Plan

**Branch:** `feature/exercise-timers`  
**Date:** 2026-02-14  
**Status:** In Progress

## Overview
Add optional time limits to exercises with countdown timer, auto-pause on leave, and hard lock on expiry.

## Design Decisions
- **Timer Mode:** Total timer (cumulative across sessions)
- **Enforcement:** Hard limit (locks exercise when time expires)
- **Pause Behavior:** Auto-pause when user leaves page, no manual pause
- **Grace Period:** None (immediate lock on expiry)
- **Warnings:** 5 minutes, 1 minute before expiry
- **Early Completion:** "End Exercise" button available

## Implementation Steps

### Phase 1: Database (✅ Ready)
- [x] Create migration file: `database/add-exercise-timers.sql`
- [ ] Run migration in Supabase
- [ ] Verify RLS policies work correctly

### Phase 2: Admin Interface
- [x] Add timer settings to exercise creation form
  - [x] Enable/disable timer checkbox
  - [x] Time limit input (minutes)
- [x] Update exercise edit form with same fields
- [ ] Add timer info to exercise list view

### Phase 3: API Endpoints
- [x] Create `/api/exercises/timer` (POST/GET) - Start timer & get status
- [x] Create `/api/exercises/timer/update` (PUT) - Update elapsed time
- [x] Create `/api/exercises/timer/complete` (POST) - Mark exercise complete

### Phase 4: Timer UI Component
- [x] Create `TimerDisplay` component
  - [x] Countdown display (MM:SS format)
  - [x] Warning states (5 min, 1 min)
  - [x] Expired state
- [x] Add to ChatBox header
- [x] Implement client-side countdown
- [x] Sync with server on mount/unmount

### Phase 5: Timer Logic
- [x] Auto-start timer on exercise join
- [x] Track elapsed time in background
- [x] Pause timer on page unload/visibility change
- [x] Resume timer on page load
- [x] Lock chatbox when time expires
- [x] Show completion modal

### Phase 6: Admin Analytics
- [ ] Show timer stats in admin dashboard
  - [ ] Average completion time
  - [ ] Time expired count
  - [ ] Early completion count
- [ ] Add timer info to conversation export

### Phase 7: Testing & Documentation
- [ ] Test timer accuracy
- [ ] Test pause/resume behavior
- [ ] Test hard lock enforcement
- [ ] Create technical documentation
- [ ] Create admin user guide
- [ ] Update changelog

## Database Schema

### New Table: `exercise_participation`
```sql
- id (UUID, PK)
- exercise_id (UUID, FK -> exercises)
- user_id (UUID, FK -> users)
- time_spent_seconds (INTEGER)
- last_checkpoint (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
- time_expired (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

### Modified Table: `exercises`
```sql
+ time_limit_minutes (INTEGER, nullable)
+ timer_enabled (BOOLEAN, default false)
```

## API Endpoints

### POST `/api/exercises/timer/start`
**Body:** `{ exerciseId: string }`  
**Response:** `{ participantId: string, timeRemaining: number }`

### PUT `/api/exercises/timer/update`
**Body:** `{ participantId: string, elapsedSeconds: number }`  
**Response:** `{ timeRemaining: number, expired: boolean }`

### POST `/api/exercises/timer/complete`
**Body:** `{ participantId: string, reason: 'manual' | 'expired' }`  
**Response:** `{ success: boolean }`

### GET `/api/exercises/timer/status?exerciseId=xxx`
**Response:** `{ active: boolean, timeRemaining: number, expired: boolean }`

## UI Components

### TimerDisplay
- Location: ChatBox header (top-right)
- States:
  - Normal: `⏱️ 23:45`
  - Warning (5 min): `⏱️ 04:32` (yellow)
  - Critical (1 min): `⏱️ 00:45` (red, pulsing)
  - Expired: `⏱️ Time Expired` (red)

### End Exercise Button
- Location: ChatBox header (next to timer)
- Action: Mark exercise complete, lock chatbox
- Confirmation: "Are you sure you want to end this exercise early?"

### Expired Modal
- Title: "Time Expired"
- Message: "Your time for this exercise has ended. Your conversation has been saved."
- Action: "View Results" (navigate to exercise list)

## Edge Cases

1. **Network disconnect during exercise**
   - Timer pauses automatically (page unload)
   - Resumes when reconnected
   - Server validates elapsed time

2. **Browser refresh**
   - Timer state fetched from server
   - Continues from last checkpoint

3. **Multiple tabs**
   - Only one active timer per exercise
   - Other tabs show "Exercise in progress in another tab"

4. **Time manipulation**
   - All time tracking server-side
   - Client countdown is display-only
   - Server validates elapsed time on each update

5. **Exercise without timer**
   - Timer UI hidden
   - No participant record created
   - Works as before

## Testing Checklist

- [ ] Timer starts correctly on join
- [ ] Timer pauses when leaving page
- [ ] Timer resumes correctly on return
- [ ] Warnings appear at correct times
- [ ] Hard lock works on expiry
- [ ] Early completion works
- [ ] Admin can see timer stats
- [ ] RLS policies prevent tampering
- [ ] Works with/without timer enabled
- [ ] Multiple users don't interfere

## Rollout Plan

1. Deploy database migration
2. Deploy backend API endpoints
3. Deploy admin interface (create/edit exercises)
4. Deploy timer UI (ChatBox)
5. Test with internal team
6. Enable for production exercises
7. Monitor for issues
8. Gather feedback

## Success Metrics

- Timer accuracy within ±5 seconds
- No timer state loss on page refresh
- Zero unauthorized time extensions
- Admin can track completion times
- Users understand timer behavior

## Notes

- Timer is optional per exercise
- Existing exercises unaffected
- Can enable/disable timer anytime (admin)
- Timer state persists across sessions
- No manual pause to prevent gaming
