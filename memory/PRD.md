# Academy SaaS (AcademyOS) - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application called "Academy SaaS" that manages youth football academies (soccer clubs). Multi-tenant architecture using club_id. Modules: Auth, Players, Teams, Training, Matches, Calendar, Scouting, Parent Portal, Announcements, Dashboard, Reports, Settings, Seasons.

## Architecture
- **Frontend**: React.js (CRA) + TailwindCSS + Recharts + FullCalendar + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based custom authentication
- **Multi-tenant**: club_id isolation on all collections
- **Storage**: Emergent Object Storage for file uploads
- **Design**: Dark theme (Linear/Vercel-style) with green accents

## What's Been Implemented

### Backend (FastAPI) - 45+ endpoints
- JWT auth (signup, login, me)
- CRUD: players, teams, training, matches, calendar events, announcements, evaluations, injuries, metrics
- Dashboard aggregation with charts data
- Parent portal, admin user management, club settings
- User language preference, mock parent notification system
- **File upload** via Emergent Object Storage
- **Season Management** - Full CRUD with stats aggregation (matches, training in date range, W/D/L, goals)
- Seed data (1 club, 4 teams, 60 players, 10 training, 6 matches, 5 announcements, 15 evaluations, 3 seasons)

### Frontend (React) - 22+ screens
- **i18n**: 7 languages (EN, ES, DE, FR, PT, IT, AR) with RTL support
- **Notifications UI**: Compose/send, notification list, bell badge in sidebar
- **File Upload**: Player photos, club logos
- **CSV/PDF Export**: Players CSV, academy PDF report
- **Season Management**: Season list with cards (status badges, stats), create/delete/activate, season detail page with:
  - Stats grid (matches, wins, draws, losses, training, goals for/against)
  - Team performance bar chart
  - Matches and Training tabs with data tables
- All 7 languages translated for seasons module

### Testing Status (5 iterations)
- Iteration 5: Backend 100% (12/12), Frontend 100% — Season Management
- Iteration 4: Backend 100% (16/16), Frontend 95% — Notifications/Upload/Export
- Iteration 3: Backend 100% (18/18), Frontend 95% — i18n Expansion
- Previous: All passing

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### P0 (Critical) - All Done
- [x] All core modules (Auth, Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Parent Portal, Admin, Settings)
- [x] i18n - 7 languages with RTL
- [x] Notifications UI, File Upload, CSV/PDF Export
- [x] Season Management

### P1 (Important)
- [ ] Auto-translation for announcements using LLM
- [ ] Email notifications via SendGrid/Resend
- [ ] Advanced match statistics & formations

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Subscription/billing (Stripe)
- [ ] Drag-and-drop training planner
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle
