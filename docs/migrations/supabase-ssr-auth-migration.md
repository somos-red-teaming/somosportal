# Supabase SSR Auth Migration Plan

## Objective
Migrate from legacy Supabase singleton client to SSR-compatible clients to enable server-side authentication and history loading.

## Problem
- Current auth uses `@/lib/supabase` singleton (client-only)
- Server components can't read auth session
- History loading blocked because server sees `user = undefined`

## Solution
Replace all imports of `@/lib/supabase` with:
- `@/lib/supabase/client` for client components
- `@/lib/supabase/server` for server components/API routes

## Migration Scope: 24 Files + Middleware

### Phase 1: Critical Auth Infrastructure (MUST DO FIRST)
- [x] `hooks/useAuth.tsx` - Core auth hook ✅
- [x] `hooks/useRole.tsx` - Role checking ✅
- [ ] `lib/blind-assignment.ts` - Model assignment utility (DEFERRED - needs refactor to accept client param)

### Phase 2: Core Components (5 files)
- [ ] `components/header.tsx`
- [ ] `components/ChatBox.tsx`
- [ ] `app/exercise/[id]/ExerciseClient.tsx`
- [ ] `app/exercises/page.tsx`
- [ ] `app/dashboard/page.tsx`

### Phase 3: Admin Pages (7 files)
- [ ] `app/admin/page.tsx`
- [ ] `app/admin/teams/page.tsx`
- [ ] `app/admin/users/page.tsx`
- [ ] `app/admin/models/page.tsx`
- [ ] `app/admin/conversations/page.tsx`
- [ ] `app/admin/flags/page.tsx`
- [ ] `app/admin/flag-packages/page.tsx`
- [ ] `app/admin/exercises/page.tsx`

### Phase 4: API Routes (3 files)
- [ ] `app/api/ai/chat/route.ts`
- [ ] `app/api/models/route.ts`
- [ ] `app/api/ai/test/route.ts`

### Phase 5: Auth & Utility Pages (5 files)
- [ ] `app/profile/page.tsx`
- [ ] `app/auth/callback/page.tsx`
- [ ] `app/auth/reset-password/page.tsx`
- [ ] `app/api-tester/page.tsx`
- [ ] `app/test-db/page.tsx`

### Phase 6: Middleware
- [ ] Verify `middleware.ts` matcher covers all routes (already done)
- [ ] Ensure cookies are properly refreshed

## Testing Checklist
After each phase:
- [ ] Login works
- [ ] Logout works
- [ ] Session persists on page reload
- [ ] Protected routes still protected
- [ ] No console errors

Final test:
- [ ] Server component can read user session
- [ ] History loads on exercise page
- [ ] All existing features still work

## Rollback Plan
If migration fails:
```bash
git checkout main
git branch -D fix/migrate-supabase-ssr-auth
```

## Change Pattern

### Client Components/Hooks
**Before:**
```typescript
import { supabase } from '@/lib/supabase'
```

**After:**
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Server Components/API Routes
**Before:**
```typescript
import { supabase } from '@/lib/supabase'
```

**After:**
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

## Notes
- All client components must use `createClient()` from `/client`
- All server components must use `await createClient()` from `/server`
- Middleware already configured to refresh sessions
- Once complete, can delete `lib/supabase.ts` singleton

## Expected Outcome
- ✅ Server components can read auth session
- ✅ History loads automatically on exercise page
- ✅ All RLS policies work server-side
- ✅ No security vulnerabilities
- ✅ Consistent auth across entire app
