# Calendar Together

Collaborative calendar visualization tool for groups.

## 🚀 Project Status

**Current Phase**: Phase 0 (Project Setup)
**Last Action**: Initialized Turborepo structure and configuration files.
**Blocker**: `npm` / `pnpm` not found on the current machine.

### ✅ Completed
- Defined Technical Stack (Vite + React + Tailwind + Fastify + Prisma).
- Created Monorepo structure (Turborepo).
- Created root configuration files:
  - `package.json`
  - `turbo.json`
  - `pnpm-workspace.yaml`
  - `.gitignore`
- Created directory structure for `apps/` and `packages/`.
- Documented Implementation Plan (`docs/implementation_plan.md`).
- Documented Task List (`docs/task.md`).

### 🚧 Pending / Next Steps
1. **Install Dependencies**: Need a machine with Node.js and pnpm installed.
2. **Initialize Apps**:
   - `apps/web`: Initialize Vite + React + Tailwind.
   - `apps/api`: Initialize Fastify + Prisma.
3. **Setup Database**: Install PostgreSQL and Redis (or Memurai) locally.

---

## 💻 How to Resume Work (New Machine)

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (LTS v20+)
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL 16** (Local server running on port 5432)
- **Redis** (Local server or Memurai running on port 6379)

### 2. Setup Project
```bash
# 1. Install dependencies
pnpm install

# 2. Initialize Frontend (if empty)
cd apps/web
pnpm create vite . --template react
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Initialize Backend (if empty)
cd ../api
npm init -y
pnpm add fastify @prisma/client
pnpm add -D prisma typescript @types/node ts-node
npx prisma init
```

### 3. Run Development Server
```bash
# From root directory
pnpm dev
```

---

## 📚 Documentation
- [Implementation Plan](docs/implementation_plan.md) - Detailed technical architecture and roadmap.
- [Task List](docs/task.md) - Checklist of tasks.
- [Product Description](Product%20descrition.md) - Original product requirements.
