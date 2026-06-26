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

### Backend (FastAPI) - 57+ endpoints
- JWT auth, CRUD for all modules, dashboard aggregation
- Season management with CRUD + stats aggregation + leaderboard
- File upload via Emergent Object Storage
- User language preference, mock parent notification system
- Advanced Match Statistics: team_stats, events, player_stats, MOTM, summary, formation
- Tactical Heatmap: 24-zone grid per player based on position type
- Formation CRUD: 5 presets, save/load/update/delete per team
- **Formation Comparison**: planned vs actual formation with player performance overlay
- Seed data (1 club, 4 teams, 60 players, 10 training, 6 matches with full data, 3 seasons)

### Frontend (React) - 26+ screens
- Full dashboard, player/team management, training with attendance
- Match center with 5-tab report (Stats, Timeline, Heatmap, Player Ratings, **Compare**)
- Calendar, scouting with radar charts, reports with CSV/PDF export
- Season Management with podium leaderboard
- **Formation Analysis** (/formations): drag-and-drop editor with auto-assign
- **Formation Comparison**: side-by-side pitches (planned vs actual), rating color-coding, summary table
- FootballPitch reusable SVG component
- Notifications, announcements, parent portal, admin, settings
- All 7 languages translated, RTL for Arabic

### Testing Status (9 iterations, all passing)
- Iteration 9: Backend 100% (12/12), Frontend 100% — Formation Comparison
- Iteration 8: Backend 100% (19/19), Frontend 100% — Heatmap + Formations
- Iteration 7: Backend 100% (23/23), Frontend 100% — Advanced Match Stats
- Iteration 6-3: All passing — Leaderboard, Seasons, i18n, Notifications, Export

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### All Done
- [x] Core modules (Auth, Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Parent Portal, Admin, Settings)
- [x] i18n (7 languages + RTL), Notifications UI, File Upload, CSV/PDF Export
- [x] Season Management with Leaderboard
- [x] Advanced match statistics & formations
- [x] Tactical Heatmap (match report tab)
- [x] Formation Analysis with drag & drop editor
- [x] Formation Comparison (planned vs actual with metrics)

### P1 (Important)
- [ ] Auto-translation for announcements using LLM
- [ ] Email notifications via SendGrid/Resend

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Subscription/billing (Stripe)
- [ ] Performance analytics with AI insights
- [ ] Dark/Light theme toggle
