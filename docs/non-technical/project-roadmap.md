# SOMOS Civic Lab - Project Roadmap

**Project Vision:** Democratizing AI governance through structured public participation in red teaming exercises

**Timeline:** 10-Week Development Cycle  
**Current Status:** 🎉 Week 5-6 Complete - Exercise System

---

## 🎯 Project Overview

The SOMOS Civic Lab AI Red-Teaming Platform empowers communities to participate in AI safety and governance by providing structured exercises where participants can test AI models, identify issues, and contribute to making AI systems more reliable and trustworthy.

### Key Platform Features
- **AI Model Testing:** Test multiple AI providers in blind comparisons
- **Community Participation:** Structured exercises for public engagement
- **Issue Reporting:** Flag problematic AI responses with detailed categorization
- **Admin Management:** Full control over users and exercises

---

## 📅 Development Timeline

### 🏗 **Phase 1: Foundation & Setup (Weeks 1-2)** ✅ COMPLETE

**What we built:**
- ✅ Next.js 16 + TypeScript + Tailwind CSS
- ✅ Cloudflare Pages deployment (somos.website)
- ✅ Complete database schema (9 tables)
- ✅ Email/password + OAuth authentication
- ✅ User profile system
- ✅ Password reset functionality

---

### 👥 **Phase 2: RBAC & Admin (Weeks 3-4)** ✅ COMPLETE

**What we built:**
- ✅ Role-based access control (Admin/Participant)
- ✅ Admin dashboard with statistics
- ✅ User management (search, pagination, roles)
- ✅ Exercise management (CRUD)
- ✅ Deactivated user blocking
- ✅ Playwright E2E testing
- ✅ Sentry error monitoring
- ✅ Snyk security scanning

---

### 📝 **Phase 3: Exercise System (Weeks 5-6)** ✅ COMPLETE

**What we built:**
- ✅ Exercise lifecycle management with scheduling (start/end dates)
- ✅ Participant assignment system with limits (max_participants)
- ✅ Join/leave functionality with exercise full validation
- ✅ Progress tracking with real-time participant counts
- ✅ RLS-safe participant counting function
- ✅ Enhanced admin interface with new exercise fields
- ✅ Target AI models selection for future integration
- ✅ UI improvements (loading states, colored action buttons)
- ✅ Multi-user testing and system recovery completed

---

### 🤖 **Phase 4: AI Integration (Weeks 7-8)** ⏳ PLANNED

- Multi-provider AI APIs
- Blind testing system
- API documentation

---

### 🚩 **Phase 5: Flagging (Week 9)** ⏳ PLANNED

- Issue reporting system
- Moderation tools

---

### 📊 **Phase 6: Launch (Week 10)** ⏳ PLANNED

- Analytics dashboard
- Production optimization

---

## 📈 Progress: 60% Complete

| Phase | Status |
|-------|--------|
| Foundation & Auth | ✅ 100% |
| RBAC & Admin | ✅ 100% |
| Exercise System | ✅ 100% |
| AI Integration | ⏳ 0% |
| Flagging | ⏳ 0% |
| Launch | ⏳ 0% |

---

*Last Updated: December 11, 2025*
