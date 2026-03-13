# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
- `/` — Landing page
- `/intake` — Patient enrollment form (TODO)
- `/queue` — Reviewer dashboard (TODO)

### API Routes
- `GET/POST /api/intakes` — List and create intakes
- `GET/PATCH /api/intakes/[id]` — View and update a single intake
- `GET /api/users` — List users

All API routes are currently stubbed (return 501).

### Key Files
- `src/lib/prisma.ts` — Prisma client singleton (reused across hot reloads)
- `prisma/schema.prisma` — Data models: User, Intake, AuditLog, Document
- `prisma/seed.ts` — Demo data: `patient@demo.com` (PATIENT), `reviewer@demo.com` (REVIEWER)
- `prisma.config.ts` — Prisma config with seed command using ts-node

### Database
SQLite via `dev.db` at project root. Prisma uses libSQL adapter for edge compatibility. `DATABASE_URL` set in `.env`.

### Data Models
- **User** — `PATIENT` or `REVIEWER` role, linked to intakes and audit logs
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

The project is scaffolded with working DB schema, seed data, and routing — but all API endpoints and UI components are stubs awaiting implementation. Design mockups are in `/public/design-inspiration/`.
