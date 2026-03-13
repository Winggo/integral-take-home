# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clinical trial enrollment system built with Next.js 16 (App Router), Prisma 7 (SQLite/libSQL), React 18, and TypeScript. Patients submit enrollment applications with PII; reviewers screen them with a redacted/privileged view toggle. Full audit trail for compliance.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals)
npm run db:migrate   # Run Prisma migrations (prisma migrate dev)
npm run db:seed      # Seed demo users + sample intake
npm run db:reset     # Reset DB and re-seed
npx prisma generate  # Regenerate Prisma client after schema changes
```

After modifying `prisma/schema.prisma`, run `npx prisma migrate dev` then restart the dev server.

## Architecture

**Next.js App Router** with the `src/` directory convention. Path alias: `@/*` → `./src/*`.

### Routes
- `/login` — Login page (credentials auth, role toggle)
- `/` — Redirects to `/login` (or role page if already authenticated)
- `/intake` — Patient enrollment form (TODO)
- `/queue` — Reviewer dashboard (TODO)

### API Routes
- `GET/POST /api/intakes` — List and create intakes
- `GET/PATCH /api/intakes/[id]` — View and update a single intake
- `GET /api/users` — List users
- `GET/POST /api/auth/[...nextauth]` — Auth.js v5 handlers

All business API routes are currently stubbed (return 501).

### Key Files
- `src/auth.ts` — Auth.js v5 config (CredentialsProvider, JWT session, role in token)
- `src/proxy.ts` — Next.js 16 route protection (renamed from `middleware.ts`)
- `src/lib/prisma.ts` — Prisma client singleton with libSQL adapter (required by Prisma 7)
- `prisma/schema.prisma` — Data models: User, Intake, AuditLog, Document
- `prisma/seed.ts` — Demo data: `patient@demo.com` / `reviewer@demo.com`, password: `password`
- `prisma.config.ts` — Prisma config with seed command using ts-node

### Authentication
Auth.js v5 (`next-auth@beta`) with credentials provider and JWT sessions.

- Session carries `id`, `role`, `organization` — extended via `declare module "next-auth"` in `src/auth.ts`
- Access session server-side: `const session = await auth()` (import from `@/auth`)
- Access session client-side: `useSession()` from `next-auth/react` (requires `SessionProvider` wrapper if used)
- `AUTH_SECRET` env var required — set in `.env`

**Demo credentials** (password: `password`):
- `patient@demo.com` (PATIENT) → lands on `/intake` after login
- `reviewer@demo.com` (REVIEWER) → lands on `/queue` after login

### Route Protection (`src/proxy.ts`)
Next.js 16 uses `proxy.ts` (not `middleware.ts`). Rules:
- `/` → redirects to `/login` or role page based on session
- `/intake` → requires PATIENT role; reviewers redirected to `/queue`
- `/queue` → requires REVIEWER role; patients redirected to `/intake`
- `/api/intakes*`, `/api/users` → requires any authenticated session (401 otherwise)

### Database
SQLite via `dev.db` at project root. Prisma 7 requires the libSQL adapter to be passed explicitly to `new PrismaClient({ adapter })` — see `src/lib/prisma.ts`. `DATABASE_URL` set in `.env`.

### Data Models
- **User** — `PATIENT` or `REVIEWER` role, `passwordHash` field for credentials auth
- **Intake** — Enrollment application with PII fields (`clientPhone`, `dateOfBirth`, `ssn`) that must be masked in redacted view. Status workflow: `PENDING → IN_REVIEW → APPROVED/REJECTED`
- **AuditLog** — Tracks actions (CREATED, STATUS_CHANGED, VIEWED, ASSIGNED, DOCUMENT_UPLOADED) with JSON details
- **Document** — File uploads attached to intakes (cascade delete)

### Privacy Model
- **Patients** always see their own full data
- **Reviewers** see redacted PII by default (e.g., SSN `***-**-4321`, phone `***-***-6543`), with toggle to privileged view
- PII fields to mask: `ssn`, `dateOfBirth`, `clientPhone`

### Components
- `src/components/IntakeDetail.tsx` — Detail view with `privileged` boolean prop for redaction toggle (TODO)
- `src/components/AuditLog.tsx` — Audit trail display for a given intake (TODO)

## Implementation Status

**Completed:**
- Auth.js v5 credentials login with role-based routing
- Route protection via `src/proxy.ts` (Next.js 16)
- Login page UI matching design mockup (`/login`)

**TODO** — all API endpoints and these UI components are stubs awaiting implementation:
- `GET/POST /api/intakes` — intake list and creation
- `GET/PATCH /api/intakes/[id]` — single intake view/update
- `GET /api/users` — user list
- `/intake` page — patient enrollment form with document upload
- `/queue` page — reviewer dashboard with intake list
- `IntakeDetail` component — with privileged/redacted PII toggle
- `AuditLog` component — audit trail display

Design mockups are in `/public/design-inspiration/`.
