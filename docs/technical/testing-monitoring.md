# Testing & Monitoring Technical Documentation

**Last Updated:** December 3, 2025  
**Status:** ✅ Production Ready

---

## Overview

SOMOS uses a comprehensive testing and monitoring stack:
- **Playwright** - End-to-end browser testing
- **Sentry** - Error monitoring and session replay
- **Snyk** - Security vulnerability scanning

---

## Playwright E2E Testing

### Setup

**Configuration File:** `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/auth.spec.ts
```

### Test Structure

**Location:** `tests/` directory

**Example Test:** `tests/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

const DEACTIVATED_USER = {
  email: process.env.TEST_DEACTIVATED_EMAIL || '',
  password: process.env.TEST_DEACTIVATED_PASSWORD || ''
}

const ACTIVE_USER = {
  email: process.env.TEST_ACTIVE_EMAIL || '',
  password: process.env.TEST_ACTIVE_PASSWORD || ''
}

test('deactivated user sees deactivation page', async ({ page }) => {
  await page.goto('/login/')
  await page.fill('#email', DEACTIVATED_USER.email)
  await page.fill('#password', DEACTIVATED_USER.password)
  await page.click('button[type="submit"]')
  
  await page.waitForTimeout(3000)
  await expect(page).toHaveURL('/account-deactivated/', { timeout: 10000 })
  await expect(page.locator('h1')).toContainText('Account Deactivated')
})

test('active user can login successfully', async ({ page }) => {
  await page.goto('/login/')
  await page.fill('#email', ACTIVE_USER.email)
  await page.fill('#password', ACTIVE_USER.password)
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard/', { timeout: 10000 })
})
```

### Writing New Tests

**Best Practices:**
1. Use `#id` selectors when possible
2. Add appropriate timeouts for async operations
3. Use `test.skip()` for conditional tests
4. Keep tests independent (no shared state)

**Common Selectors:**
```typescript
// Form inputs
await page.fill('#email', 'user@test.com')
await page.fill('input[type="password"]', 'password')

// Buttons
await page.click('button[type="submit"]')
await page.click('text=Sign In')

// Navigation
await page.goto('/dashboard/')
await expect(page).toHaveURL('/dashboard/')

// Content assertions
await expect(page.locator('h1')).toContainText('Dashboard')
```

### Test Results

Results are stored in `test-results/` directory (gitignored).

---

## Sentry Error Monitoring

### Configuration Files

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Browser-side error tracking |
| `sentry.server.config.ts` | Server-side error tracking |
| `sentry.edge.config.ts` | Edge runtime error tracking |
| `instrumentation.ts` | Next.js instrumentation hook |
| `instrumentation-client.ts` | Client instrumentation |

### Client Configuration

**File:** `sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://xxx@xxx.ingest.us.sentry.io/xxx",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### Server Configuration

**File:** `sentry.server.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://xxx@xxx.ingest.us.sentry.io/xxx",
  tracesSampleRate: 1.0,
})
```

### Instrumentation

**File:** `instrumentation.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exception
try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error)
}

// Capture message
Sentry.captureMessage('Something happened', 'info')

// Add context
Sentry.setUser({ id: userId, email: userEmail })
Sentry.setTag('feature', 'exercise-management')
```

### Environment Variables

**Required in Cloudflare Pages:**
```
SENTRY_AUTH_TOKEN=sntrys_xxx...
```

### Sentry Dashboard

- **URL:** https://sentry.io
- **Organization:** somos-civic-lab
- **Project:** javascript-nextjs

**Features:**
- Real-time error alerts
- Session replay videos
- Performance monitoring
- Release tracking

---

## Snyk Security Scanning

### Setup

Snyk is integrated via GitHub:
1. Connected repository in Snyk dashboard
2. Automatic scanning on push/PR
3. Security alerts for vulnerabilities

### Dashboard

- **URL:** https://app.snyk.io
- **Integration:** GitHub repository linked

### What Snyk Scans

| Type | Description |
|------|-------------|
| Dependencies | npm packages in `package.json` |
| Code | Static analysis of source files |
| Container | Docker images (if applicable) |
| IaC | Infrastructure as code (if applicable) |

### Vulnerability Severity

| Level | Action |
|-------|--------|
| Critical | Fix immediately |
| High | Fix before deploy |
| Medium | Fix in next sprint |
| Low | Track and plan |

### Fixing Vulnerabilities

```bash
# Check for vulnerabilities locally
npx snyk test

# Auto-fix where possible
npm audit fix

# Update specific package
npm update package-name
```

---

## CI/CD Integration

### GitHub Actions (Future)

```yaml
name: Test & Security

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --legacy-peer-deps
      - run: npx playwright install chromium
      - run: npm run test:e2e
```

### Cloudflare Pages

- Sentry auth token set in environment variables
- Errors automatically captured in production
- Source maps uploaded for better stack traces

---

## Monitoring Checklist

### Daily
- [ ] Check Sentry for new errors
- [ ] Review error trends

### Weekly
- [ ] Review Snyk security alerts
- [ ] Run E2E tests locally
- [ ] Check performance metrics in Sentry

### Before Deploy
- [ ] All E2E tests pass
- [ ] No critical Snyk vulnerabilities
- [ ] Sentry release tagged

---

*Documentation for SOMOS Testing & Monitoring - December 2025*
