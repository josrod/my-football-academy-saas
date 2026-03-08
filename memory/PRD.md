# Academy SaaS (AcademyOS) - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application called "Academy SaaS" that manages youth football academies (soccer clubs). Multi-tenant architecture using club_id. Modules: Auth, Players, Teams, Training, Matches, Calendar, Scouting, Parent Portal, Announcements, Dashboard, Reports, Settings.

## Architecture
- **Frontend**: React.js (CRA) + TailwindCSS + Recharts + FullCalendar + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based custom authentication
- **Multi-tenant**: club_id isolation on all collections
- **Design**: Dark theme (Linear/Vercel-style) with green accents

## User Personas
1. **Academy Admin** - Full access to all modules, manages users, settings, announcements
2. **Coach** - Manages players, training, matches, scouting, can post announcements
3. **Parent** - Read-only access to children's progress, schedule, attendance, announcements

## Core Requirements
- Multi-tenant SaaS with club_id-based data isolation
- JWT authentication with role-based access (admin, coach, parent)
- Dashboard with widgets and charts (Recharts)
- Player management with profiles, metrics, medical records, match history
- Team management with rosters
- Training session management with attendance tracking
- Match management with player stats and reports
- Calendar with FullCalendar (training, matches, events)
- Scouting & player evaluations with radar charts
- Parent portal (read-only view)
- Announcements/communication system
- Admin user management
- Club settings

## What's Been Implemented

### Backend (FastAPI)
- Full REST API with 35+ endpoints
- JWT auth (signup, login, me)
- All CRUD operations for: players, teams, training, matches, calendar events, announcements, evaluations, injuries, metrics
- Dashboard aggregation endpoint with charts data
- Parent portal endpoints
- Admin user management
- Club settings
- **User language preference** (PUT/GET /api/user/language)
- **Mock parent notification system** (CRUD /api/notifications with email_simulated flag)
- Seed data endpoint (1 club, 4 teams, 60 players, 10 training sessions, 6 matches, 5 announcements, 15 evaluations)
- Multi-tenant club_id filtering on all queries

### Frontend (React)
- 18+ screens implemented
- **i18n (Internationalization)** - Full support for 7 languages:
  - English, Spanish, German, French, Portuguese, Italian, Arabic
  - Language switcher on landing page (7 language buttons)
  - Language switcher in sidebar (Globe icon with dropdown, all 7 languages)
  - All page titles, navigation, form labels, buttons, status labels translated
  - **RTL support for Arabic** (dynamic dir="rtl" on html element)
  - **User language preference persistence** (saved to DB on change, applied on login)
  - Language preference persisted in localStorage + backend
- Sidebar navigation (Linear-style)
- Dark theme with green (#22c55e) accents
- Mobile responsive with hamburger menu
- Framer Motion animations

### Seed Data
- 1 Club: FC Academy Elite
- 4 Teams: U10 Lions, U12 Tigers, U14 Eagles, U16 Wolves
- 60 Players across categories
- 10 Training sessions with attendance records
- 6 Matches (3 completed with stats, 3 scheduled)
- 15 Player evaluations
- 5 Announcements
- Demo users: admin, 4 coaches, 1 parent

## Testing Status
- Backend: 100% (18/18 API tests passed - iteration 3)
- Frontend: 95% (22/23 UI tests passed - iteration 3)
- Previous iterations: iteration_1 (21/21 backend), iteration_2 (16/17 frontend)

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### P0 (Critical) - All Done
- [x] Auth system
- [x] Dashboard
- [x] Player management
- [x] Team management
- [x] Training & attendance
- [x] Match management
- [x] i18n - 7 languages (EN, ES, DE, FR, PT, IT, AR)
- [x] RTL support for Arabic
- [x] User language preference persistence
- [x] Mock parent notification system (backend)

### P1 (Important)
- [ ] File/image upload (player photos, club logo)
- [ ] Email notifications for announcements
- [ ] Export data (CSV/PDF reports)
- [ ] Advanced match statistics & formations
- [ ] Notification UI for frontend (send/view notifications)

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Season management
- [ ] Subscription/billing (Stripe)
- [ ] Drag-and-drop training planner
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle

## Next Tasks
1. Build notification UI for coaches to send and parents to view
2. Add file upload for player photos and club logos
3. Implement CSV export for player and match data
4. Add email notifications via SendGrid/Resend
5. Build season management module
