# Academy SaaS (AcademyOS) - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application called "Academy SaaS" that manages youth football academies (soccer clubs). Multi-tenant architecture using club_id. Modules: Auth, Players, Teams, Training, Matches, Calendar, Scouting, Parent Portal, Announcements, Dashboard, Reports, Settings.

## Architecture
- **Frontend**: React.js (CRA) + TailwindCSS + Recharts + FullCalendar + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based custom authentication
- **Multi-tenant**: club_id isolation on all collections
- **Storage**: Emergent Object Storage for file uploads
- **Design**: Dark theme (Linear/Vercel-style) with green accents

## User Personas
1. **Academy Admin** - Full access to all modules, manages users, settings, announcements, notifications
2. **Coach** - Manages players, training, matches, scouting, can send notifications
3. **Parent** - Read-only access to children's progress, schedule, attendance, notifications

## What's Been Implemented

### Backend (FastAPI) - 40+ endpoints
- JWT auth (signup, login, me)
- CRUD: players, teams, training, matches, calendar events, announcements, evaluations, injuries, metrics
- Dashboard aggregation with charts data
- Parent portal endpoints
- Admin user management, club settings
- User language preference (PUT/GET /api/user/language)
- Mock parent notification system (CRUD /api/notifications)
- **File upload** (POST /api/upload, GET /api/files/{path}) via Emergent Object Storage
- Seed data endpoint

### Frontend (React) - 20+ screens
- **i18n**: 7 languages (EN, ES, DE, FR, PT, IT, AR) with RTL support
- **Notifications UI**: Compose/send form for admin/coach, notification list with read/unread, badge in sidebar
- **File Upload**: Player photo upload (profile page), club logo upload (settings)
- **CSV/PDF Export**: Export players CSV, full academy PDF report on Reports page
- Player avatars with photos or initials in tables
- Full sidebar navigation with unread notification count
- Dark theme, mobile responsive, animations

### Testing Status
- Iteration 1: Backend 100% (21/21)
- Iteration 2: Frontend 94% (16/17)
- Iteration 3: Backend 100% (18/18), Frontend 95% (22/23)
- Iteration 4: Backend 100% (16/16), Frontend 95%

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### P0 (Critical) - All Done
- [x] Auth, Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Parent Portal, Admin, Settings
- [x] i18n - 7 languages with RTL support
- [x] User language preference persistence
- [x] Notifications UI (send + view + read/unread)
- [x] File/image upload (player photos, club logos)
- [x] CSV/PDF export

### P1 (Important)
- [ ] Auto-translation for announcements using LLM
- [ ] Email notifications via SendGrid/Resend
- [ ] Advanced match statistics & formations

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Season management
- [ ] Subscription/billing (Stripe)
- [ ] Drag-and-drop training planner
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle

## Next Tasks
1. Auto-translation for announcements (LLM integration - user needs to pick provider)
2. Email notifications via SendGrid/Resend
3. Season management module
4. Stripe billing integration
