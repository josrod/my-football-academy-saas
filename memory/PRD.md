# AcademyOS - Product Requirements Document

## Original Problem Statement
Build a production-ready MVP SaaS application named "Academy SaaS" for managing youth football academies. Multi-tenant architecture using `club_id` for data isolation.

## Architecture
- **Frontend:** React, React Router, TailwindCSS, react-i18next, Recharts, Framer Motion, Context API
- **Backend:** FastAPI (Python), MongoDB (Pymongo/Motor), JWT Auth, WebSockets
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **Storage:** Emergent Object Storage for file uploads
- **i18n:** 7 languages (EN, ES, DE, FR, PT, IT, AR) with RTL support

## Core Modules (All Implemented)
1. Auth (JWT login/signup, role-based)
2. Players (CRUD, profiles, metrics, medical records)
3. Teams (CRUD, rosters, categories)
4. Training (Sessions, attendance tracking)
5. Matches (CRUD, scores, events timeline)
6. Calendar (FullCalendar integration)
7. Scouting (Player evaluations)
8. Parent Portal (Read-only view)
9. Announcements (with AI auto-translation)
10. Dashboard (Stats, charts)
11. Reports (Analytics, CSV/PDF export)
12. Settings (Club config, language prefs)
13. Season Management (Seasons, leaderboards)
14. Formation Analysis (Drag-and-drop, presets, comparison)
15. Player Comparison (Side-by-side radar charts)
16. AI Performance Analytics (GPT-5.2 insights)
17. Drill Library (20+ pre-loaded exercises, CRUD, categories)
18. Weekly Training Planner (Drag-and-drop drills into weekly calendar, **Duplicate plans** to other teams/weeks, **5 Predefined Templates**: Pretemporada, Recuperación, Semana de Partido, Técnica Intensiva, Porteros)
19. Notifications (Real-time WebSocket + in-app)
20. Light/Dark Theme Toggle

## Completed Features
- All 20 modules above fully implemented and tested
- Advanced Match Stats (Heatmaps, Formations, Timelines)
- Multi-language support (7 languages with RTL)
- File/image uploads via Emergent Object Storage
- Seed script with demo data
- Weekly Training Planner with drag-and-drop drill scheduling (July 2026)

## P1 Backlog
- Real parent notification system via email (currently mocked to in-app notifications)

## P2 Backlog
- Subscription billing plans (Free/Pro/Enterprise) with Stripe

## Technical Debt
- server.py is ~2500 lines - consider modularizing routes if adding more endpoints

## Test Credentials
- Coach: carlos@academy.com / coach123
