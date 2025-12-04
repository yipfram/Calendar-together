# Calendar Together - MVP Implementation Tasks

## Phase 0: Project Setup & Infrastructure
- [/] Initialize project structure (monorepo)
- [ ] Configure Docker Compose (PostgreSQL + Redis)
- [ ] Setup frontend (Vite + React + Tailwind)
- [ ] Setup backend (Fastify + Prisma)
- [ ] Configure development environment

## Phase 1: Authentication & User Management
- [ ] Implement magic link authentication
- [ ] Setup OAuth flow for Google
- [ ] Setup OAuth flow for Microsoft
- [ ] Create user profile endpoints
- [ ] Build login/signup UI

## Phase 2: Calendar Integration
- [ ] Google Calendar connector (OAuth + free/busy API)
- [ ] Microsoft Graph connector (OAuth + free/busy API)
- [ ] Token storage & encryption
- [ ] Background sync jobs (BullMQ)
- [ ] Calendar connection UI

## Phase 3: Rooms & Collaboration
- [ ] Room creation & management API
- [ ] Member invitation system (link-based)
- [ ] Room membership endpoints
- [ ] Rooms list UI
- [ ] Room detail view

## Phase 4: Availability & Timeline View
- [ ] Free/busy aggregation logic
- [ ] Combined availability endpoint
- [ ] Timeline visualization component
- [ ] Real-time sync (Socket.io)
- [ ] Multi-user overlay rendering

## Phase 5: Event Proposal & Creation
- [ ] Drag & drop slot selection
- [ ] Proposal API endpoints
- [ ] Real-time proposal broadcasting
- [ ] Event creation logic (send calendar invites)
- [ ] Confirmation UI

## Phase 6: PWA & Polish
- [ ] Service Worker setup
- [ ] Offline capabilities
- [ ] Web Push notifications
- [ ] Install prompts
- [ ] Mobile responsive polish

## Phase 7: Testing & Deployment
- [ ] Unit tests (critical paths)
- [ ] E2E tests (Playwright)
- [ ] GDPR compliance checklist
- [ ] Deployment configuration
- [ ] Beta launch
