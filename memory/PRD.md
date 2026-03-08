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

## What's Been Implemented (Jan 2026)
### Backend (FastAPI)
- Full REST API with 30+ endpoints
- JWT auth (signup, login, me)
- All CRUD operations for: players, teams, training, matches, calendar events, announcements, evaluations, injuries, metrics
- Dashboard aggregation endpoint with charts data
- Parent portal endpoints
- Admin user management
- Club settings
- Seed data endpoint (1 club, 4 teams, 60 players, 10 training sessions, 6 matches, 5 announcements, 15 evaluations)
- Multi-tenant club_id filtering on all queries

### Frontend (React)
- 18+ screens implemented:
  1. Landing page (public)
  2. Login page with demo credentials
  3. Signup page
  4. Dashboard (stats widgets + Recharts charts + announcements)
  5. Players list (search, filters, table view)
  6. Player profile (6 tabs: Overview, Metrics, Medical, Matches, Training, Scouting)
  7. Teams list (card grid)
  8. Team profile (roster, training, matches)
  9. Training sessions (list + attendance detail)
  10. Matches list
  11. Match report (scoreboard + player stats)
  12. Calendar (FullCalendar with events)
  13. Scouting/Evaluations (radar charts)
  14. Parent portal (player overview, schedule, announcements)
  15. Announcements feed
  16. Admin (user management)
  17. Settings (club settings form)
  18. Reports (analytics with pie/bar charts)
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
- Backend: 100% (21/21 API tests passed)
- Frontend: 95% (16/17 UI tests passed)
- One LOW priority issue: mobile menu toggle automation timing

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

### P1 (Important)
- [ ] File/image upload (player photos, club logo)
- [ ] Email notifications for announcements
- [ ] Export data (CSV/PDF reports)
- [ ] Advanced match statistics & formations

### P2 (Nice to Have)
- [ ] Real-time notifications (WebSocket)
- [ ] Player comparison tool
- [ ] Season management
- [ ] Subscription/billing (Stripe)
- [ ] Drag-and-drop training planner
- [ ] Performance analytics with AI insights
- [ ] Multiple language support (i18n)
- [ ] Dark/Light theme toggle

## Next Tasks
1. Add file upload for player photos and club logos
2. Implement CSV export for player and match data
3. Add email notifications via SendGrid/Resend
4. Build season management module
5. Add subscription billing with Stripe
