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

### Backend (FastAPI) - 55+ endpoints
- JWT auth, CRUD for all modules, dashboard aggregation
- Season management with CRUD + stats aggregation
- Season Leaderboard - Top scorers, top assists, best attendance, top rated
- File upload via Emergent Object Storage
- User language preference, mock parent notification system
- Advanced Match Statistics: enriched match data with team_stats, events, player_stats, MOTM, summary, formation
- Match events API (POST /api/matches/{match_id}/events)
- **Tactical Heatmap**: auto-generated 24-zone (4x6 grid) heatmap per player based on position type
- **Formation CRUD**: presets (5 formations), save/load/update/delete per team
- Seed data (1 club, 4 teams, 60 players, 10 training, 6 matches with events/stats, 5 announcements, 15 evaluations, 3 seasons)

### Frontend (React) - 25+ screens
- Full dashboard, player management (with photo upload), team management
- Training with attendance, match center, calendar, scouting with radar charts
- Reports with CSV/PDF export
- Season Management with leaderboard (podium-style top 3 + ranked list, 4 categories)
- Advanced Match Report: 4-tab view (Team Stats, Timeline, **Heatmap**, Player Ratings), MOTM card, formation display
- **Tactical Heatmap Tab**: SVG football pitch with radial gradient heat zones, player selector for individual/combined views
- **Formation Analysis Page** (/formations): drag-and-drop formation editor, 5 preset formations, auto-assign players, save/load/delete formations
- **FootballPitch** reusable SVG component with field markings
- Notifications UI, announcements, parent portal, admin, settings (with logo upload)
- All 7 languages translated, RTL for Arabic

### Testing Status (8 iterations, all passing)
- Iteration 8: Backend 100% (19/19), Frontend 100% — Heatmap + Formations
- Iteration 7: Backend 100% (23/23), Frontend 100% — Advanced Match Stats
- Iteration 6: Backend 100% (14/14), Frontend 100% — Leaderboard
- Iteration 5: Backend 100% (12/12), Frontend 100% — Seasons
- Iteration 4: Backend 100% (16/16) — Notifications/Upload/Export
- Iteration 3: Backend 100% (18/18) — i18n

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
- [x] Tactical Heatmap (match report 4th tab)
- [x] Formation Analysis with drag & drop editor

### P1 (Important)
- [ ] Auto-translation for announcements using LLM
- [ ] Email notifications via SendGrid/Resend

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Subscription/billing (Stripe)
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle
