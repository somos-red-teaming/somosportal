# Admin System Technical Documentation

**Last Updated:** December 3, 2025  
**Status:** ✅ Production Ready

---

## Overview

The SOMOS admin system provides role-based access control (RBAC) with two roles: **Admin** and **Participant**. Admins have access to user management, exercise management, and platform statistics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Header                              │
│  (Shows "Admin" link only if useRole().isAdmin = true)  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AdminRoute                            │
│  (Wrapper component - redirects non-admins)             │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  /admin  │    │  /admin  │    │  /admin  │
    │          │    │  /users  │    │/exercises│
    │Dashboard │    │   User   │    │ Exercise │
    │          │    │Management│    │Management│
    └──────────┘    └──────────┘    └──────────┘
```

---

## Components

### 1. useRole Hook

**File:** `hooks/useRole.tsx`

**Purpose:** Fetches and manages user role from database.

```typescript
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export function useRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<'admin' | 'participant'>('participant')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (data?.role === 'admin') setRole('admin')
      setLoading(false)
    }

    fetchRole()
  }, [user])

  return { role, isAdmin: role === 'admin', loading }
}
```

**Usage:**
```typescript
const { isAdmin, loading } = useRole()

if (isAdmin) {
  // Show admin features
}
```

### 2. AdminRoute Component

**File:** `components/AdminRoute.tsx`

**Purpose:** Protects admin-only pages by checking role and redirecting unauthorized users.

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && !roleLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, authLoading, roleLoading, router])

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return <>{children}</>
}
```

**Usage:**
```typescript
export default function AdminPage() {
  return (
    <AdminRoute>
      {/* Admin-only content */}
    </AdminRoute>
  )
}
```

---

## Admin Pages

### Admin Dashboard (`/admin`)

**File:** `app/admin/page.tsx`

**Features:**
- Platform statistics (users, exercises, flags, interactions)
- Quick navigation cards
- Real-time counts from Supabase

**Stats Query:**
```typescript
const [users, exercises, flags, interactions] = await Promise.all([
  supabase.from('users').select('id', { count: 'exact', head: true }),
  supabase.from('exercises').select('id', { count: 'exact', head: true }),
  supabase.from('flags').select('id', { count: 'exact', head: true }),
  supabase.from('interactions').select('id', { count: 'exact', head: true }),
])
```

### User Management (`/admin/users`)

**File:** `app/admin/users/page.tsx`

**Features:**
| Feature | Implementation |
|---------|----------------|
| List users | Paginated query with 10 per page |
| Search | `ilike` filter on email and full_name |
| Toggle role | Update `role` column |
| Activate/Deactivate | Update `is_active` column |

**Search Query:**
```typescript
let query = supabase
  .from('users')
  .select('*', { count: 'exact' })

if (search) {
  query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
}

const { data, count } = await query
  .order('created_at', { ascending: false })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
```

### Exercise Management (`/admin/exercises`)

**File:** `app/admin/exercises/page.tsx`

**Features:**
| Feature | Implementation |
|---------|----------------|
| Create | Insert with `created_by` from current user |
| Edit | Update by exercise ID |
| Delete | Delete with confirmation |
| Search | Filter by title or category |
| Pagination | 10 per page |

**Form Fields:**
- `title` (required)
- `description` (required)
- `category` (required)
- `difficulty_level` (beginner/intermediate/advanced)
- `status` (draft/active/paused/completed)
- `guidelines` (required)

---

## Database Requirements

### RLS Policy for Admin Updates

Admins need permission to update other users:

```sql
CREATE POLICY "Admins can update users" ON public.users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);
```

### Role Column

The `users` table must have a `role` column:

```sql
role VARCHAR(20) DEFAULT 'participant' 
  CHECK (role IN ('admin', 'participant'))
```

---

## Security Considerations

1. **Role Verification:** Always verify role server-side for sensitive operations
2. **RLS Policies:** Database-level security prevents unauthorized access
3. **Client-Side Checks:** UI hides admin features but doesn't replace server security
4. **Audit Trail:** Consider logging admin actions for accountability

---

## Testing Admin Features

### Manual Testing Checklist

- [ ] Non-admin cannot access `/admin/*` pages
- [ ] Admin can view all users
- [ ] Admin can change user roles
- [ ] Admin can deactivate users
- [ ] Deactivated users cannot login
- [ ] Admin can create exercises
- [ ] Admin can edit exercises
- [ ] Admin can delete exercises
- [ ] Search filters work correctly
- [ ] Pagination works correctly

### E2E Test Example

```typescript
test('admin can access admin dashboard', async ({ page }) => {
  // Login as admin
  await page.goto('/login/')
  await page.fill('#email', 'admin@test.com')
  await page.fill('#password', 'password')
  await page.click('button[type="submit"]')
  
  // Navigate to admin
  await page.goto('/admin/')
  await expect(page.locator('h1')).toContainText('Admin Dashboard')
})
```

---

*Documentation for SOMOS Admin System - December 2025*
