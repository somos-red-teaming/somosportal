# Security Documentation

**Document Type:** Security Overview  
**Last Updated:** January 1, 2026  
**Platform:** SOMOS AI Red-Teaming Platform

---

## Overview

This document outlines the security measures implemented in the SOMOS platform to protect user data, ensure secure AI interactions, and maintain platform integrity.

---

## Authentication & Authorization

### Authentication Methods

| Method | Implementation |
|--------|----------------|
| Email/Password | Supabase Auth with bcrypt hashing |
| Google OAuth | Supabase OAuth integration |
| GitHub OAuth | Supabase OAuth integration |
| Session Management | JWT tokens with automatic refresh |

### Authorization (RBAC)

| Role | Permissions |
|------|-------------|
| **Participant** | Join exercises, chat with AI, submit flags, view own data |
| **Admin** | All participant permissions + manage users, exercises, models, view all flags |

### Protected Routes

```typescript
// Admin-only routes
/admin/*           → AdminRoute component checks role
/admin/flags       → Requires admin role
/admin/export      → Requires admin role
/admin/users       → Requires admin role
/admin/exercises   → Requires admin role
/admin/models      → Requires admin role

// Authenticated routes
/dashboard         → ProtectedRoute component
/profile           → ProtectedRoute component
/exercise/*        → ProtectedRoute component
```

---

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Users can only see their own data
CREATE POLICY "Users view own data" ON users
    FOR SELECT USING (auth_user_id = auth.uid());

-- Admins can view all data
CREATE POLICY "Admins view all" ON users
    FOR SELECT USING (is_admin());

-- Users can only create their own flags
CREATE POLICY "Create flags" ON flags
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );
```

### Service Role Key Usage

The service role key (bypasses RLS) is only used in:
- `/api/flags/admin` - Admin flag management
- `/api/export/*` - Data export endpoints
- `/api/flags` POST - Flag submission (to write to multiple tables)

**Never exposed to client-side code.**

---

## API Security

### Authentication

| Endpoint | Auth Required | Method |
|----------|---------------|--------|
| `/api/ai/chat` | No* | POST |
| `/api/ai/image` | No* | POST |
| `/api/flags` | Yes (via userId) | POST |
| `/api/flags/admin` | Admin only | GET |
| `/api/export/*` | Admin only | GET |

*AI endpoints rely on exercise participation validation

### Input Validation

All API endpoints validate:
- Required fields presence
- Data types
- String lengths
- Enum values (categories, status)

```typescript
// Example validation
if (!exerciseId || !modelId || !prompt) {
  return NextResponse.json({ 
    error: 'Missing required fields' 
  }, { status: 400 })
}
```

---

## Data Protection

### Sensitive Data Handling

| Data Type | Protection |
|-----------|------------|
| Passwords | Never stored (Supabase Auth handles) |
| API Keys | Environment variables only |
| User emails | Stored in DB, not exposed in exports |
| Conversations | Stored for flagging, admin-only access |

### Environment Variables

```bash
# Never commit these to git
SUPABASE_SERVICE_ROLE_KEY=***
OPENAI_API_KEY=***
ANTHROPIC_API_KEY=***
GOOGLE_API_KEY=***
GROQ_API_KEY=***
```

### .gitignore Protection

```
.env.local
.env.*.local
*.pem
```

---

## Blind Testing Security

### Model Identity Protection

- Models displayed as Alpha, Beta, Gamma (not real names)
- System prompts instruct AI to not reveal identity
- Model IDs not exposed to participants
- Junction table maps exercises to models with blind names

```typescript
// System prompt prevents identity revelation
const systemPrompt = `You must follow these rules:
1. NEVER reveal your model name, company, or creator
2. Simply identify as "an AI assistant" if asked
...`
```

---

## Third-Party Security

### Supabase
- SOC 2 Type II compliant
- Data encrypted at rest and in transit
- Automatic backups

### Netlify
- HTTPS enforced
- DDoS protection
- Automatic SSL certificates

### Sentry
- Error monitoring (no PII in error reports)
- Performance monitoring

### Snyk
- Dependency vulnerability scanning
- GitHub integration for PR checks

---

## Security Checklist

### ✅ Implemented
- [x] HTTPS enforced (Netlify)
- [x] JWT authentication (Supabase)
- [x] Row Level Security (all tables)
- [x] Role-based access control
- [x] Input validation on all forms
- [x] API keys in environment variables
- [x] Service role key server-side only
- [x] Error monitoring (Sentry)
- [x] Dependency scanning (Snyk)

### ⏳ Week 10 (Planned)
- [ ] Rate limiting on API endpoints
- [ ] CSRF token validation
- [ ] Security headers audit
- [ ] Penetration testing
- [ ] Full security audit

---

## Incident Response

### If API Key Exposed
1. Immediately rotate the key in provider dashboard
2. Update environment variable in Netlify
3. Redeploy application
4. Review logs for unauthorized usage

### If Data Breach Suspected
1. Disable affected user accounts
2. Review Supabase audit logs
3. Notify affected users
4. Document incident

---

## Compliance Considerations

### GDPR
- Users can request data export (admin export feature)
- Users can request account deletion
- Data minimization (only collect necessary data)

### Data Retention
- Interactions stored for research purposes
- Flags stored indefinitely for analysis
- User accounts persist until deletion requested

---

*Last Updated: January 1, 2026*
