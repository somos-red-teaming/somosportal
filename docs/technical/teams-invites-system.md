# Teams & Invites System - Technical Documentation

## Overview

The Teams & Invites system provides granular access control for exercises beyond simple public visibility.

---

## Database Schema

### Tables

```sql
-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Exercise-Team Assignment
CREATE TABLE exercise_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, team_id)
);

-- Exercise Invites
CREATE TABLE exercise_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(exercise_id, user_id)
);

-- Exercise Visibility Column
ALTER TABLE exercises ADD COLUMN visibility VARCHAR(20) DEFAULT 'public';
-- Values: 'public', 'team_only', 'invite_only'
```

### Relationships

```
exercises
    ├── exercise_teams (many-to-many with teams)
    │       └── teams
    │             └── team_members (many-to-many with users)
    │                   └── users
    └── exercise_invites (many-to-many with users)
            └── users
```

---

## RLS Policies

### Key Consideration
The `users` table uses `auth_user_id` (not `id`) to reference `auth.uid()`.

### Exercises Visibility Policy

```sql
CREATE POLICY "users_view_exercises" ON exercises FOR SELECT
  USING (
    -- Admins see all
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
    OR
    -- Public exercises
    visibility = 'public' OR visibility IS NULL
    OR
    -- Team exercises where user is member
    (visibility = 'team_only' AND EXISTS (
      SELECT 1 FROM exercise_teams et
      JOIN team_members tm ON tm.team_id = et.team_id
      JOIN users u ON u.id = tm.user_id
      WHERE et.exercise_id = exercises.id AND u.auth_user_id = auth.uid()
    ))
    OR
    -- Invite-only exercises where user is invited
    (visibility = 'invite_only' AND EXISTS (
      SELECT 1 FROM exercise_invites ei
      JOIN users u ON u.id = ei.user_id
      WHERE ei.exercise_id = exercises.id AND u.auth_user_id = auth.uid()
    ))
  );
```

### Teams Policies

```sql
-- Admins manage all teams
CREATE POLICY "admins_all_teams" ON teams FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- Users see teams they're in
CREATE POLICY "members_view_teams" ON teams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm 
    JOIN users u ON u.id = tm.user_id 
    WHERE tm.team_id = teams.id AND u.auth_user_id = auth.uid()
  ));
```

---

## API Usage

### Teams Management (Admin)

```typescript
// Create team
const { data: { user } } = await supabase.auth.getUser()
const { data: userData } = await supabase
  .from('users')
  .select('id')
  .eq('auth_user_id', user.id)
  .single()

await supabase.from('teams').insert({
  name: 'Research Group A',
  description: 'PhD students',
  created_by: userData.id  // Use users.id, not auth uid
})

// Add member
await supabase.from('team_members').insert({
  team_id: teamId,
  user_id: userId  // users.id
})

// Remove member
await supabase.from('team_members').delete()
  .eq('team_id', teamId)
  .eq('user_id', userId)
```

### Exercise Team Assignment

```typescript
// Assign teams to exercise
await supabase.from('exercise_teams').delete().eq('exercise_id', exerciseId)
await supabase.from('exercise_teams').insert(
  teamIds.map(teamId => ({ exercise_id: exerciseId, team_id: teamId }))
)
```

### Invites Management

```typescript
// Send invite
await supabase.from('exercise_invites').insert({
  exercise_id: exerciseId,
  user_id: userId
})

// Accept invite (on join)
await supabase.from('exercise_invites')
  .update({ status: 'accepted', responded_at: new Date().toISOString() })
  .eq('exercise_id', exerciseId)
  .eq('user_id', userId)

// Fetch invites with user details
const { data } = await supabase
  .from('exercise_invites')
  .select('id, user_id, status, user:users(email, full_name)')
  .eq('exercise_id', exerciseId)

// Note: Supabase returns relations as arrays, flatten:
const invites = data.map(d => ({
  ...d,
  user: Array.isArray(d.user) ? d.user[0] : d.user
}))
```

### Fetching Exercises with Visibility

```typescript
// RLS handles filtering automatically
const { data } = await supabase
  .from('exercises')
  .select('*, visibility')
  .eq('status', 'active')

// Client-side tab filtering
const publicExercises = data.filter(e => e.visibility === 'public' || !e.visibility)
const teamExercises = data.filter(e => e.visibility === 'team_only')
const inviteExercises = data.filter(e => e.visibility === 'invite_only')
```

---

## UI Components

### Admin Pages
- `/admin/teams` - Create/edit teams, manage members
- `/admin/exercises` - Visibility selector, team assignment, invite management

### Participant Pages
- `/exercises` - Tabs for Public / My Teams / My Invites

### Header
- Notification badge showing pending invite count

---

## Data Flow

### Team-Only Exercise Access
```
1. Admin creates team
2. Admin adds users to team
3. Admin creates exercise with visibility='team_only'
4. Admin assigns team(s) to exercise
5. Team members see exercise in "My Teams" tab
6. Non-members cannot see exercise (RLS blocks)
```

### Invite-Only Exercise Access
```
1. Admin creates exercise with visibility='invite_only'
2. Admin opens invite dialog, searches users
3. Admin clicks user to send invite
4. User sees notification badge in header
5. User sees exercise in "My Invites" tab
6. User joins → invite status updates to 'accepted'
```

---

## Common Issues

### Foreign Key Errors
The `teams.created_by` references `users.id`, not `auth.uid()`. Always fetch the user's `users.id` first:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('id')
  .eq('auth_user_id', authUser.id)
  .single()
```

### RLS 403 Errors
Ensure policies use `auth_user_id = auth.uid()` not `id = auth.uid()`.

### Supabase Relations as Arrays
When using `.select('*, relation:table(fields)')`, the relation comes as an array. Flatten it:
```typescript
const item = { ...data, relation: Array.isArray(data.relation) ? data.relation[0] : data.relation }
```
