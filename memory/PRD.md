# Academy SaaS (AcademyOS) - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application called "Academy SaaS" for managing youth football academies. Multi-tenant architecture using club_id. Core modules: Auth, Players, Teams, Training, Matches, Calendar, Scouting, Parent Portal, Announcements, Dashboard, Reports, Settings, Seasons.

## Architecture
- **Frontend**: React.js (CRA) + TailwindCSS + Recharts + FullCalendar + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based custom authentication
- **Multi-tenant**: club_id isolation on all collections
- **Storage**: Emergent Object Storage for file uploads
- **Design**: Dark theme (Linear/Vercel-style) with green accents
- **i18n**: 7 languages (EN, ES, DE, FR, PT, IT, AR) with RTL support

## What's Been Implemented

### Backend (FastAPI) - 48+ endpoints
- JWT auth, CRUD for all modules, dashboard aggregation
- Season management with CRUD + stats aggregation
- Season Leaderboard - Top scorers, top assists, best attendance, top rated
- File upload via Emergent Object Storage
- User language preference, mock parent notification system
- Advanced Match Statistics: enriched match data with team_stats, events, player_stats, MOTM, summary, formation
- Match events API (POST /api/matches/{match_id}/events)
- Seed data (1 club, 4 teams, 60 players, 10 training, 6 matches with events/stats, 5 announcements, 15 evaluations, 3 seasons)

### Frontend (React) - 23+ screens
- Full dashboard, player management (with photo upload), team management
- Training with attendance, match center, calendar, scouting with radar charts
- Reports with CSV/PDF export
- Season Management with leaderboard (podium-style top 3 + ranked list, 4 categories)
- **Advanced Match Report**: 3-tab view (Team Stats comparison bars, Timeline with events, Player Ratings table), MOTM card, formation display, WIN/DRAW/LOSS badges
- Notifications UI, announcements, parent portal, admin, settings (with logo upload)
- All 7 languages translated, RTL for Arabic

### Testing Status (7 iterations, all passing)
- Iteration 7: Backend 100% (23/23), Frontend 100% — Advanced Match Statistics
- Iteration 6: Backend 100% (14/14), Frontend 100% — Leaderboard
- Iteration 5: Backend 100% (12/12), Frontend 100% — Seasons
- Iteration 4: Backend 100% (16/16) — Notifications/Upload/Export
- Iteration 3: Backend 100% (18/18) — i18n
- Earlier: All passing

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### All Done
- [x] Core modules (Auth, Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Parent Portal, Admin, Settings)
- [x] i18n (7 languages + RTL)
- [x] Notifications UI, File Upload, CSV/PDF Export
- [x] Season Management with Leaderboard
- [x] Advanced match statistics & formations

### P1 (Important)
- [ ] Auto-translation for announcements using LLM
- [ ] Email notifications via SendGrid/Resend

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Subscription/billing (Stripe)
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle
