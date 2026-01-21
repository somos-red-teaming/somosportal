# SOMOS Platform - January 2026 Updates

**Date:** 2026-01-21  
**Sprint:** UX Improvements & Access Control

---

## Summary

Major feature release implementing exercise visibility controls, team management, invite system, and various UX improvements based on stakeholder feedback.

---

## Features Completed

### Access Control & Visibility

#### Teams System
- Create and manage teams from admin dashboard
- Add/remove team members with search and pagination
- Assign exercises to specific teams
- Team-only exercises visible only to team members

#### Invite System  
- Invite individual users to exercises
- Manage invites from exercise admin (add/remove users)
- Pending invites notification badge in header
- Invite status tracking (pending → accepted)

#### Exercise Visibility
- Three visibility options: **Public**, **Team Only**, **Invite Only**
- Exercises page tabs: Public | My Teams | My Invites
- RLS policies enforce visibility at database level

### Exercise Customization

#### Rich Text Editor
- TinyMCE editor for exercise descriptions and guidelines
- Formatting: bold, italic, underline, headers, bullet lists, horizontal rules
- Tailwind Typography plugin for proper rendering

#### Custom Icons & Colors
- 12 icon options (Shield, Brain, Eye, Lock, AlertTriangle, Zap, Target, etc.)
- 8 color options (blue, red, green, purple, orange, pink, cyan, yellow)
- Visual differentiation between exercises on listing pages

#### Flag Category Packages
- Admin page to create/edit/delete flag packages
- Assign package per exercise
- Custom categories for different use cases (Public Health, City 311, Justice System)

### AI Model Configuration

#### Temperature Settings
- Default temperature per AI model (0.0-2.0 range)
- Per-exercise temperature override
- Temperature hints in admin UI
- Included in data exports

#### Dynamic Model Fetching
- Fetch available models from provider APIs (OpenAI, Groq, Google, HuggingFace)
- Auto-fill capabilities for HuggingFace based on pipeline_tag
- Model dropdown populated dynamically in admin form

### Data & Export

#### Conversations Admin Page
- View all participant conversations grouped by session
- Multiple export formats: CSV Summary, CSV Full, JSON Full, JSON Stats
- Date range filtering
- Temperature data included in exports

### UX Improvements

#### Landing Page
- Removed mock/placeholder usage metrics

#### Exercise Cards
- Removed difficulty rating
- Prioritized dates ("Open until X" / "Starts on X")
- Category and Team badges with labels

#### Flagging System
- Changed "Report" to "Flag a harm"
- Added tooltip explaining flag purpose
- Removed quick template chips from modal

#### Form Validation
- Error summary near save button
- Clear errors on dialog open/close

---

## Database Changes

### New Tables
- `teams` - Team definitions
- `team_members` - Team membership junction
- `exercise_teams` - Exercise-team assignment
- `exercise_invites` - Individual user invites
- `flag_packages` - Flag category package definitions
- `flag_categories` - Categories within packages

### Schema Updates
- `exercises.visibility` - public/team_only/invite_only
- `exercises.icon` - Icon identifier
- `exercises.color` - Color identifier
- `exercises.flag_package_id` - FK to flag_packages
- `ai_models.temperature` - Default temperature
- `exercise_models.temperature_override` - Per-exercise override

### RLS Policies
- Updated exercises policy for visibility-based access
- Team and invite policies with proper auth_user_id matching

---

## Files Added/Modified

### New Pages
- `/app/admin/teams/page.tsx` - Team management
- `/app/admin/conversations/page.tsx` - Conversation viewer
- `/app/admin/flag-packages/page.tsx` - Flag package management
- `/app/api/models/list/route.ts` - Dynamic model fetching

### New Components
- `/components/RichTextEditor.tsx` - TinyMCE wrapper

### Modified
- Exercise admin form (visibility, teams, icons, colors, temperature)
- Exercises listing page (tabs, badges, icons)
- Header (notification badge)
- Chat API (temperature, conversation saving)
- Export APIs (temperature columns)

---

## Remaining TODO

From UX feedback analysis:
- Timer / Time limits for exercises
- Progress benchmarks (flag targets with levels)
- Gamification features
- AI Applications section (separate from raw models)
- Mid-exercise model changes

---

## Migration Scripts

Located in `/database/`:
- `add-teams.sql` - Teams, team_members, exercise_teams tables
- `add-invites.sql` - Exercise invites table
- `add-temperature-settings.sql` - Temperature columns

Run in Supabase SQL editor in order listed.
