# Academy SaaS (AcademyOS) - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application called "Academy SaaS" for managing youth football academies. Multi-tenant architecture using club_id. Core modules: Auth, Players, Teams, Training, Matches, Calendar, Scouting, Parent Portal, Announcements, Dashboard, Reports, Settings, Seasons.

## Architecture
- **Frontend**: React.js (CRA) + TailwindCSS + Recharts + FullCalendar + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver) + WebSocket
- **Auth**: JWT-based custom authentication
- **Multi-tenant**: club_id isolation on all collections
- **AI**: GPT 5.2 via Emergent Integrations (insights + translation)
- **Storage**: Emergent Object Storage for file uploads
- **Design**: Dark/Light theme toggle with CSS variables
- **i18n**: 7 languages (EN, ES, DE, FR, PT, IT, AR) with RTL support

## What's Been Implemented

### Backend (FastAPI) - 65+ endpoints
All core CRUD + advanced features:
- JWT auth, multi-tenant CRUD for players, teams, training, matches, calendar, scouting, announcements, reports
- Season management + leaderboard
- Advanced Match: team_stats, events, heatmap, formation comparison
- Formation CRUD with 5 presets
- **Player Stats API**: aggregated metrics + match stats per player
- **AI Insights** (GPT 5.2): analyze academy data, generate structured recommendations
- **Auto-Translate** (GPT 5.2): translate announcements to 7 languages
- **WebSocket**: real-time notifications with per-user connections, ping/pong, club broadcast
- File upload via Object Storage, CSV/PDF export

### Frontend (React) - 30+ screens
- Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Notifications, Parent Portal, Admin, Settings
- Match Report: 5-tab view (Stats, Timeline, Heatmap, Player Ratings, Formation Comparison)
- Formation Analysis: drag-and-drop editor with auto-assign
- **Player Comparison**: radar charts + match stats side-by-side
- **AI Insights page**: GPT 5.2 analysis with overview, player/team insights, recommendations
- **Auto-translate button** on announcements with localized content display
- **Dark/Light theme toggle** with CSS variables and localStorage persistence
- **WebSocket** real-time notification updates in sidebar bell
- Season Management with podium leaderboard, FootballPitch SVG component
- All 7 languages translated, RTL for Arabic

### Testing Status (10 iterations, all passing)
- Iteration 10: Backend 100% (19/19), Frontend 100% — Theme, Comparison, AI, Translate, WebSocket
- Iteration 9: Backend 100% (12/12), Frontend 100% — Formation Comparison
- Iteration 8: Backend 100% (19/19), Frontend 100% — Heatmap + Formations
- Iteration 7: Backend 100% (23/23), Frontend 100% — Advanced Match Stats
- Earlier iterations: All passing

## Demo Credentials
- Admin: admin@academy.com / admin123
- Coach: carlos@academy.com / coach123
- Parent: parent@academy.com / parent123

## Prioritized Backlog

### All Done
- [x] Core modules (Auth, Dashboard, Players, Teams, Training, Matches, Calendar, Scouting, Reports, Announcements, Parent Portal, Admin, Settings)
- [x] i18n (7 languages + RTL), File Upload, CSV/PDF Export, Notifications
- [x] Season Management with Leaderboard
- [x] Advanced Match Statistics, Tactical Heatmap, Formation Analysis, Formation Comparison
- [x] Dark/Light Theme Toggle
- [x] Player Comparison Tool (Radar + Stats)
- [x] AI Performance Insights (GPT 5.2)
- [x] Auto-Translation of Announcements (GPT 5.2)
- [x] Real-time Notifications (WebSocket)

### P2 (Nice to Have)
- [ ] Subscription/billing (Stripe)
- [ ] Email notifications via SendGrid/Resend
- [ ] Advanced training drill library
- [ ] Player injury tracking improvements
- [ ] Mobile app (React Native)
