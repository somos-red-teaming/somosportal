# SOMOS Civic Lab - AI Red-Teaming Platform

> Democratizing AI governance through structured public participation in red teaming exercises.

## 🎉 Current Sprint: Week 3-4 RBAC & Admin 100% Complete ✅

### ✅ Week 3-4 RBAC & Admin Complete (100%)
- [x] Role-based access control (Admin/Participant)
- [x] Admin dashboard with platform statistics
- [x] User management (search, pagination, role toggle, activate/deactivate)
- [x] Exercise management CRUD (create, edit, delete)
- [x] Dynamic exercises loaded from database
- [x] Deactivated user blocking with redirect page
- [x] Dark/light mode persistence (localStorage)
- [x] Search and pagination for admin tables
- [x] Playwright E2E testing setup
- [x] Sentry error monitoring integration
- [x] Snyk security scanning (GitHub integration)

### ✅ Week 1-2 Foundation Complete (100%)
- [x] Next.js 14 + TypeScript + Tailwind CSS initialization  
- [x] Cloudflare Pages deployment (somos.website)
- [x] Complete database schema with 9 production-ready tables
- [x] Row Level Security (RLS) policies implemented
- [x] Email/password authentication system
- [x] Google & GitHub OAuth integration
- [x] User profile system with database integration
- [x] Password reset functionality

### 📋 Next Up (Week 5-6)
- [ ] Exercise lifecycle management
- [ ] Participant assignment to exercises
- [ ] Exercise guidelines and instructions system
- [ ] Exercise status tracking and updates

## 🚀 Live Demo
- **Production Site:** [somos.website](https://somos.website)
- **Status:** Full authentication + Admin system operational
- **Features:** User management, exercise CRUD, role-based access

## 🚀 Quick Start

```bash
npm install --legacy-peer-deps
npm run dev
```

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 🏗 Week 3-4 Achievements

### **Role-Based Access Control** 🔐
- **Two Roles:** Admin and Participant
- **useRole Hook:** Fetches user role from database
- **AdminRoute Component:** Protects admin-only pages
- **Header Integration:** Dynamic navigation based on role

### **Admin Dashboard** 📊
- **Platform Stats:** Users, exercises, flags, interactions counts
- **Quick Actions:** Links to user and exercise management
- **Protected Access:** Only accessible to admin users

### **User Management** 👥
- **User List:** View all registered users
- **Search:** Filter by email or name
- **Pagination:** 10 users per page
- **Role Toggle:** Switch users between admin/participant
- **Account Status:** Activate/deactivate user accounts
- **Deactivation Flow:** Blocked users redirected to info page

### **Exercise Management** 📝
- **Full CRUD:** Create, read, update, delete exercises
- **Form Fields:** Title, description, category, difficulty, status, guidelines
- **Status Options:** Draft, active, paused, completed
- **Search & Pagination:** Filter and navigate large lists

### **Testing & Monitoring** 🧪
- **Playwright:** E2E testing for critical user flows
- **Sentry:** Real-time error monitoring and tracking
- **Snyk:** Automated security vulnerability scanning

## 📚 Documentation
Detailed documentation available in [`/docs`](./docs/README.md)

## 🛠 Tech Stack
- **Frontend:** Next.js 16 • TypeScript • Tailwind CSS • Radix UI
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Cloudflare Pages
- **Testing:** Playwright
- **Monitoring:** Sentry
- **Security:** Snyk

## 📊 Progress Overview
| Week | Focus | Status |
|------|-------|--------|
| 1-2 | Foundation & Auth | ✅ 100% Complete |
| 3-4 | RBAC & Admin | ✅ 100% Complete |
| 5-6 | Exercise System | ⏳ Up Next |
| 7-8 | AI Integration | ⏳ Planned |
| 9 | Flagging System | ⏳ Planned |
| 10 | Analytics & Deploy | ⏳ Planned |

---
**Latest Update:** December 3, 2025 - Week 3-4 RBAC & Admin 100% Complete
