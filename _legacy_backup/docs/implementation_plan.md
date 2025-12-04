# Calendar Together - Implementation Plan

## Overview

Building a collaborative calendar visualization tool that helps groups find common availability and schedule events in under 60 seconds. This MVP focuses on simplicity, privacy (free/busy only), and rapid iteration.

---

## Tech Stack

### Frontend
- **Vite 5** + **React 18** - Fast build tool with instant HMR
- **React Router v6** - Client-side routing for PWA
- **Zustand** - Lightweight state management (1kb)
- **TanStack Query** - API caching and synchronization
- **Socket.io-client** - Real-time updates
- **Tailwind CSS** - Utility-first styling
- **Headless UI** - Accessible components (optional)

### Backend
- **Node.js 20** + **Fastify** - High-performance REST API
- **Prisma ORM** - Type-safe database access with auto-migrations
- **PostgreSQL 16** - Relational database
- **Socket.io** - WebSocket server for real-time
- **BullMQ** + **Redis** - Job queue for calendar sync
- **Passport.js** - OAuth authentication

### Infrastructure & Tooling
- **Turborepo** - Monorepo build system with caching
- **PostgreSQL 16** - Local installation (Windows)
- **Redis 7** - Local installation (Memurai for Windows)
- **Railway/Render/VPS** - Deployment (100% portable)

---

## Project Structure (Turborepo Monorepo)

```
calendar-together/
├── apps/
│   ├── web/                   # Frontend app (Vite + React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── auth/      # Login, OAuth flows
│   │   │   │   ├── rooms/     # Room list, room detail
│   │   │   │   ├── timeline/  # Availability visualization
│   │   │   │   ├── calendar/  # Calendar connection
│   │   │   │   └── common/    # Shared UI components
│   │   │   ├── stores/
│   │   │   │   ├── authStore.js
│   │   │   │   ├── roomStore.js
│   │   │   │   └── socketStore.js
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.js
│   │   │   │   ├── useRooms.js
│   │   │   │   └── useAvailability.js
│   │   │   ├── lib/
│   │   │   │   ├── api.js     # API client
│   │   │   │   └── socket.js  # Socket.io setup
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── public/
│   │   │   ├── manifest.json  # PWA manifest
│   │   │   └── sw.js          # Service Worker
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                   # Backend app (Fastify)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.js
│       │   │   ├── calendars.js
│       │   │   ├── rooms.js
│       │   │   └── events.js
│       │   ├── services/
│       │   │   ├── authService.js
│       │   │   ├── calendarService.js
│       │   │   ├── roomService.js
│       │   │   └── eventService.js
│       │   ├── integrations/
│       │   │   ├── google/
│       │   │   │   ├── auth.js
│       │   │   │   └── calendar.js
│       │   │   └── microsoft/
│       │   │       ├── auth.js
│       │   │       └── calendar.js
│       │   ├── jobs/
│       │   │   ├── syncCalendar.js
│       │   │   └── refreshTokens.js
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   └── errorHandler.js
│       │   ├── utils/
│       │   │   ├── encryption.js
│       │   │   └── logger.js
│       │   ├── socket.js
│       │   └── server.js
│       ├── prisma/
│       │   ├── migrations/
│       │   └── schema.prisma
│       ├── package.json
│       └── .env.example
│
├── packages/
│   ├── ui/                    # Shared UI components (optional)
│   │   └── package.json
│   ├── config-eslint/         # Shared ESLint config
│   │   └── package.json
│   ├── config-typescript/     # Shared TypeScript config
│   │   └── package.json
│   └── types/                 # Shared TypeScript types
│       └── package.json
│
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # PNPM workspaces (or use npm/yarn)
└── README.md
```

---

## Database Schema (Prisma)

```prisma
// User authentication and profile
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  avatarUrl     String?
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  calendars     CalendarAccount[]
  memberships   Membership[]
  ownedRooms    Room[]
  tokens        MagicToken[]
}

// Magic link tokens for email auth
model MagicToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// Connected calendar accounts (Google, Microsoft)
model CalendarAccount {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider        String    // 'google' | 'microsoft'
  providerEmail   String    // Calendar email address
  encryptedToken  String    // OAuth access token (encrypted)
  refreshToken    String?   // OAuth refresh token (encrypted)
  tokenExpiresAt  DateTime?
  
  lastSyncAt      DateTime?
  syncEnabled     Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  freeBusySlots   FreeBusySlot[]
  
  @@unique([userId, provider, providerEmail])
  @@index([userId])
}

// Cached free/busy data
model FreeBusySlot {
  id            String    @id @default(cuid())
  calendarId    String
  calendar      CalendarAccount @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  
  startTime     DateTime
  endTime       DateTime
  status        String    // 'busy' | 'free'
  
  createdAt     DateTime  @default(now())
  
  @@index([calendarId, startTime, endTime])
}

// Rooms (groups)
model Room {
  id            String    @id @default(cuid())
  name          String
  inviteCode    String    @unique @default(cuid())
  
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  memberships   Membership[]
  events        ProposedEvent[]
}

// Room memberships
model Membership {
  id              String    @id @default(cuid())
  roomId          String
  room            Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role            String    @default("member") // 'owner' | 'admin' | 'member'
  shareFreeBusy   Boolean   @default(true)     // Privacy toggle
  
  joinedAt        DateTime  @default(now())
  
  @@unique([roomId, userId])
  @@index([userId])
}

// Proposed events
model ProposedEvent {
  id            String    @id @default(cuid())
  roomId        String
  room          Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  title         String?
  startTime     DateTime
  endTime       DateTime
  duration      Int       // minutes
  
  proposerId    String    // User who proposed
  status        String    @default("proposed") // 'proposed' | 'confirmed' | 'cancelled'
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([roomId, status])
}
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/magic-link         # Send magic link to email
POST   /api/auth/verify              # Verify magic link token
GET    /api/auth/me                  # Get current user
POST   /api/auth/logout              # Logout

# OAuth flows
GET    /api/auth/oauth/google        # Initiate Google OAuth
GET    /api/auth/oauth/google/callback
GET    /api/auth/oauth/microsoft     # Initiate Microsoft OAuth
GET    /api/auth/oauth/microsoft/callback
```

### Calendar Management

```
POST   /api/calendars/connect        # Connect calendar account (OAuth)
GET    /api/calendars                # List user's connected calendars
DELETE /api/calendars/:id            # Disconnect calendar
POST   /api/calendars/:id/sync       # Trigger manual sync
PATCH  /api/calendars/:id            # Update settings (shareFreeBusy)
```

### Rooms

```
POST   /api/rooms                    # Create new room
GET    /api/rooms                    # List user's rooms
GET    /api/rooms/:id                # Get room details
PATCH  /api/rooms/:id                # Update room
DELETE /api/rooms/:id                # Delete room

POST   /api/rooms/:id/join           # Join room via invite code
GET    /api/rooms/:id/members        # List room members
DELETE /api/rooms/:id/members/:userId # Remove member
```

### Availability

```
GET    /api/rooms/:id/availability   # Get combined free/busy
  Query params:
    - startDate: ISO date
    - endDate: ISO date
    - timezone: IANA timezone
```

### Events

```
POST   /api/rooms/:id/propose        # Propose time slot
GET    /api/rooms/:id/proposals      # List proposed events
POST   /api/rooms/:id/events         # Create confirmed event (send invites)
DELETE /api/rooms/:id/proposals/:id  # Cancel proposal
```

---

## WebSocket Events

### Client → Server

```javascript
// Join room for real-time updates
socket.emit('join-room', { roomId: 'abc123' })

// Leave room
socket.emit('leave-room', { roomId: 'abc123' })

// Propose time slot (broadcast to room)
socket.emit('propose-slot', {
  roomId: 'abc123',
  startTime: '2024-12-05T20:00:00Z',
  endTime: '2024-12-05T22:00:00Z',
  duration: 120
})
```

### Server → Client

```javascript
// Member joined room
socket.on('member-joined', {
  roomId: 'abc123',
  user: { id, name, avatarUrl }
})

// Member left room
socket.on('member-left', { roomId, userId })

// Availability data updated
socket.on('availability-updated', {
  roomId: 'abc123',
  userId: 'user456',
  slots: [{ startTime, endTime, status }]
})

// New slot proposed
socket.on('slot-proposed', {
  roomId: 'abc123',
  proposal: { id, startTime, endTime, proposerId }
})

// Event confirmed
socket.on('event-confirmed', {
  roomId: 'abc123',
  event: { id, title, startTime, endTime }
})
```

---

## Implementation Phases

### Phase 0: Project Setup (Week 1)

#### Turborepo Initialization
- [ ] Create root project: `npx create-turbo@latest`
- [ ] Configure Turborepo pipeline in `turbo.json`
- [ ] Setup PNPM workspaces (or npm/yarn workspaces)
- [ ] Configure shared TypeScript and ESLint configs

#### Local Database Setup (Windows)
- [ ] Install PostgreSQL 16 for Windows
  - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
  - Create database: `calendar_together`
  - Note: username, password, port (default 5432)
- [ ] Install Redis alternative for Windows
  - Option 1: **Memurai** (Redis-compatible, Windows-native)
  - Option 2: **WSL2** + Redis (if using WSL)
  - Option 3: **Redis Stack** (official Windows build)

#### Backend Setup (`apps/api`)
- [ ] Initialize Node.js project with Fastify
- [ ] Configure Prisma with PostgreSQL connection
- [ ] Create basic Fastify server structure
- [ ] Setup environment variables (.env)
- [ ] Configure CORS for local development
- [ ] Setup BullMQ with Redis connection

#### Frontend Setup (`apps/web`)
- [ ] Initialize Vite + React project
- [ ] Install and configure Tailwind CSS
- [ ] Setup React Router v6
- [ ] Configure Zustand stores
- [ ] Setup TanStack Query
- [ ] Create basic layout components

#### Files to Create
- `turbo.json` - Turborepo pipeline configuration
- `pnpm-workspace.yaml` - Workspace definition
- `apps/api/src/server.js` - Main Fastify server
- `apps/api/prisma/schema.prisma` - Database schema
- `apps/web/src/main.jsx` - React entry point
- `apps/web/tailwind.config.js` - Tailwind configuration

---

### Phase 1: Authentication (Week 1-2)

#### Backend
- [x] Implement magic link generation and verification
- [x] Setup Passport.js for OAuth
- [x] Create Google OAuth flow
- [x] Create Microsoft OAuth flow
- [x] Implement JWT token management
- [x] Add authentication middleware

#### Frontend
- [x] Build login screen with magic link
- [x] Create OAuth button components
- [x] Implement auth state management (Zustand)
- [x] Add protected route wrapper
- [x] Build user profile dropdown

#### API Endpoints
```javascript
POST /api/auth/magic-link
  Body: { email: string }
  Response: { message: "Magic link sent" }

POST /api/auth/verify
  Body: { token: string }
  Response: { user: User, accessToken: string }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { user: User }
```

---

### Phase 2: Calendar Integration (Week 2-3)

#### Backend
- [x] Create Google Calendar service
  - OAuth token exchange
  - FreeBusy query implementation
  - Token refresh logic
- [x] Create Microsoft Graph service
  - OAuth token exchange
  - Calendar availability query
  - Token refresh logic
- [x] Implement token encryption/decryption utility
- [x] Create BullMQ job for calendar sync
- [x] Setup cron job for periodic sync (every 15 min)

#### Frontend
- [x] Build calendar connection screen
- [x] Create OAuth consent flow UI
- [x] Display connected calendars list
- [x] Add disconnect calendar functionality
- [x] Show last sync status

#### Calendar Sync Logic
```javascript
// BullMQ job: syncCalendar
async function syncCalendar(calendarAccountId) {
  // 1. Get calendar account with tokens
  // 2. Check if token expired → refresh if needed
  // 3. Query free/busy for next 30 days
  // 4. Delete old FreeBusySlot entries
  // 5. Insert new FreeBusySlot entries
  // 6. Update lastSyncAt timestamp
  // 7. Emit socket event to notify room members
}
```

---

### Phase 3: Rooms & Members (Week 3-4)

#### Backend
- [x] Create room CRUD endpoints
- [x] Implement invite code generation
- [x] Add member management endpoints
- [x] Setup room authorization middleware

#### Frontend
- [x] Build room creation modal
- [x] Create rooms list view (grid/list)
- [x] Build room detail page with members
- [x] Add invite link sharing (copy to clipboard)
- [x] Create member list component with privacy toggles

#### Room Flow
1. User creates room → generates unique invite code
2. User shares invite link with friends
3. Friends click link → auto-join room (if authenticated)
4. Room owner can see all members + their calendar connection status

---

### Phase 4: Availability Visualization (Week 4-5)

#### Backend
- [x] Create availability aggregation endpoint
- [x] Optimize query performance (indexes)
- [x] Implement timezone conversion
- [x] Add caching layer (Redis) for availability data

#### Frontend
- [x] Build timeline component (horizontal scroll)
  - Day/week view toggle
  - Hourly grid
  - User rows (stacked)
- [x] Create availability overlay rendering
  - Color-coded by user
  - Opacity for overlapping free time
- [x] Add zoom controls (1h, 2h, 4h intervals)
- [x] Implement real-time updates via Socket.io

#### Timeline UI Library Options
- **Option 1**: Custom canvas-based timeline (full control)
- **Option 2**: FullCalendar library (customizable)
- **Option 3**: react-big-calendar (simple)

**Recommendation**: Custom implementation with HTML/CSS for MVP simplicity

---

### Phase 5: Event Proposal & Creation (Week 5-6)

#### Backend
- [x] Create proposal endpoints
- [x] Implement event creation with calendar invites
  - Google Calendar API: insert event
  - Microsoft Graph: create event
- [x] Setup email notifications (optional)

#### Frontend
- [x] Build drag-to-select on timeline
- [x] Create proposal card/modal
  - Duration selector (30/60/120 min)
  - Title input (optional)
  - Participant availability indicator
- [x] Add "Create Event" confirmation flow
- [x] Real-time proposal broadcasting (Socket.io)

#### Event Creation Flow
```javascript
// 1. User drags slot on timeline
// 2. Modal shows:
//    - Selected time
//    - Who's available (green) vs busy (red)
//    - Title input
//    - "Propose" vs "Create Event" buttons
// 3. If "Create Event":
//    → Backend creates event in all participants' calendars
//    → Broadcast to room via Socket.io
//    → Close modal
```

---

### Phase 6: PWA Features (Week 6-7)

#### Setup
- [x] Create manifest.json with app metadata
- [x] Design app icons (192x192, 512x512)
- [x] Implement Service Worker
  - Cache static assets
  - Offline fallback page
- [x] Add install prompt UI
- [x] Setup Web Push notifications (optional for MVP)

#### Frontend
- [x] Mobile-responsive polish
  - Touch gestures for timeline
  - Bottom sheet modals
  - Reduced navbar on mobile
- [x] Add "Add to Home Screen" prompt
- [x] Test offline mode

---

### Phase 7: Testing & Deployment (Week 7-8)

#### Testing
- [ ] Unit tests for core services (Vitest)
  - Calendar sync logic
  - Availability aggregation
  - Token encryption
- [ ] E2E tests (Playwright)
  - Login flow
  - Room creation
  - Calendar connection
  - Event proposal

#### GDPR Compliance
- [ ] Add privacy policy page
- [ ] Implement data export feature
- [ ] Add account deletion feature
- [ ] Cookie consent banner (if using analytics)
- [ ] Document data retention policies

#### Deployment
- [ ] Backend: Deploy to Railway/Render/VPS
  - PostgreSQL managed database
  - Redis instance
  - Environment variables setup
- [ ] Frontend: Deploy to Vercel/Netlify
  - Environment variables (API URL)
  - Custom domain (optional)
- [ ] Setup CI/CD (GitHub Actions)
  - Run tests on PR
  - Auto-deploy on main branch

---

## Configuration Files

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

### pnpm-workspace.yaml (or package.json workspaces)

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root package.json

```json
{
  "name": "calendar-together",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "turbo run db:migrate",
    "db:studio": "cd apps/api && pnpm prisma studio"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "latest",
    "eslint": "latest"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=8"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### PostgreSQL Setup (Windows)

```powershell
# After installing PostgreSQL from the installer:

# 1. Open pgAdmin or psql terminal
# 2. Create database
psql -U postgres
CREATE DATABASE calendar_together;
\q

# 3. Note your connection details for .env:
# Host: localhost
# Port: 5432
# User: postgres
# Password: <your-password>
# Database: calendar_together
```

### Redis Setup (Windows - Option 1: Memurai)

```powershell
# Download and install Memurai from memurai.com
# It runs as a Windows service automatically on port 6379

# Verify it's running:
memurai-cli ping
# Should return: PONG
```

### apps/api/.env.example

```env
# Database
DATABASE_URL="postgresql://dev:dev123@localhost:5432/calendar_together"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-secret-key-change-in-prod"
ENCRYPTION_KEY="32-byte-hex-key-for-token-encryption"

# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/oauth/google/callback"

# OAuth - Microsoft
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/auth/oauth/microsoft/callback"

# Email (for magic links - using SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Tailwind Configuration

```javascript
// apps/web/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## Verification Plan

### Automated Tests

#### Backend Unit Tests (Vitest)
```bash
# Test coverage targets
npm run test

# Critical paths:
- authService.generateMagicLink()
- calendarService.syncFreeBusy()
- roomService.getAvailability()
- encryption.encryptToken() / decryptToken()
```

#### Frontend E2E Tests (Playwright)
```bash
npx playwright test

# User flows to test:
1. Sign up with magic link
2. Connect Google Calendar
3. Create a room
4. Invite member via link
5. View combined availability
6. Propose time slot
7. Create event
```

### Manual Verification

#### Calendar Integration
- [ ] Connect Google Calendar → verify OAuth flow
- [ ] Check free/busy data accuracy (compare with Google Calendar)
- [ ] Connect Microsoft Calendar → verify OAuth flow
- [ ] Test token refresh after expiration
- [ ] Verify sync job runs every 15 minutes

#### Room Collaboration
- [ ] Create room with 3+ users
- [ ] Verify real-time updates (Socket.io)
- [ ] Test privacy toggle (share free/busy on/off)
- [ ] Check invite link works for new users

#### Event Creation
- [ ] Propose slot → verify all members notified
- [ ] Create event → verify appears in all calendars
- [ ] Test with users in different timezones
- [ ] Cancel event → verify removal from calendars

#### PWA Features
- [ ] Install on mobile (iOS + Android)
- [ ] Test offline mode (view cached data)
- [ ] Verify install prompt appears
- [ ] Check app icons and splash screen

#### Performance
- [ ] Load time < 3s (Lighthouse)
- [ ] Timeline renders smoothly with 10+ users
- [ ] API responses < 500ms (availability endpoint)
- [ ] Real-time updates latency < 100ms

---

## Success Criteria (MVP)

✅ User can sign up and connect Google/Microsoft calendar in < 2 minutes  
✅ Room creation and member invitation takes < 30 seconds  
✅ Combined availability view loads in < 2 seconds  
✅ Event creation (propose → confirm) takes < 60 seconds  
✅ Real-time updates appear instantly (< 500ms latency)  
✅ Works seamlessly on mobile (responsive + PWA)  
✅ No calendar event details leaked (only free/busy)  
✅ GDPR compliant (data export + deletion)  

---

## Next Steps

1. **Approve this plan** → Start Phase 0 setup
2. **Design mockups** → Create Figma/Sketch designs (optional but recommended)
3. **Setup OAuth credentials** → Register apps with Google + Microsoft
4. **Choose deployment platform** → Railway vs Render vs VPS

Ready to start implementation?
