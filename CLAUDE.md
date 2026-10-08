# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
EventHub is a full-stack event ticket booking platform built for QA training. Users browse events, book tickets, manage bookings, and create events. Each user operates in an isolated sandbox (see "Per-user sandboxing" below).

## Tech Stack
- **Frontend** (`frontend/`, port 3000): Next.js 14 App Router, React 18, TypeScript, Tailwind, React Query v5, axios
- **Backend** (`backend/`, port 3001): Express, Prisma 5, MySQL 8+, express-validator, Swagger UI at `/api/docs`
- **Auth**: JWT (7-day expiry), bcryptjs
- **Testing**: Playwright E2E (Chromium only), in `tests/`

## Commands
```bash
npm run setup        # npm install in backend/ and frontend/
npm run db:push      # push Prisma schema to MySQL (non-interactive)
npm run migrate      # prisma migrate dev (interactive)
npm run seed         # seed 10 static events
npm run dev          # backend (nodemon) + frontend (next dev) concurrently
npm run build        # build frontend
npm run lint         # next lint (frontend only; backend has no linter)
npm run test         # all Playwright tests
npm run test:ui      # Playwright UI mode
npm run test:report  # open last HTML report
npx playwright test tests/<file>.spec.js --reporter=line   # single file
npx playwright test -g "<test title>"                      # single test
docker compose run --rm tests                              # run tests in the Playwright container
```

Local env files: `backend/.env` (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`, optional `JWT_SECRET` with a hardcoded fallback in `src/config/env.js`) and `frontend/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:3001/api`).

**Important:** `playwright.config.ts` sets `baseURL` to the live deployment `https://eventhub.rahulshettyacademy.com`, not localhost. Tests (locally, in Docker, and in `.github/workflows/playwright.yml` on push to main) hit the live site. Override `baseURL` if you need to test local changes.

## Backend Architecture
Layered: `routes → controllers → services → repositories → Prisma`. `app.js` wires middleware and routes; `server.js` starts the listener.
- All `/api/events` and `/api/bookings` routes are behind `authMiddleware` (Bearer JWT → `req.user = { userId, email }`). `/api/auth`, `/api/health`, `/api/config` are public.
- Business rules and ownership checks live in **services**; repositories take `userId` and scope queries.
- Errors: throw classes from `src/utils/errors.js` (`NotFoundError` 404, `ValidationError`/`InsufficientSeatsError` 400, `ForbiddenError` 403); `middleware/errorHandler.js` maps them to `{ success: false, error }` responses.
- Swagger docs are JSDoc `@swagger` blocks on the route files — update them when changing endpoints.

### Per-user sandboxing
- Events visible to a user = static seeded events (`isStatic: true`, `userId: null`) OR events the user created (`eventRepository.findAll` ownership clause).
- Static events are shared rows but `availableSeats` is computed per user (`withPersonalSeats` in `eventService.js` subtracts only that user's bookings), so one user's bookings never affect another's seat count.
- Static events cannot be updated or deleted; non-owned events return 403.

## Frontend Architecture
- Pages in `frontend/app/` (`events`, `bookings`, `admin`, `login`, `register`); shared UI in `components/`.
- `lib/api/client.js` is the axios instance: attaches the JWT from `localStorage['eventhub_token']` and clears it on 401. `lib/hooks/` holds React Query hooks and `useAuth`; `lib/providers.jsx` sets up the QueryClient.

## Key Business Rules
- Max 6 user-created events per user; creating a 7th prunes the oldest (FIFO)
- Max 9 bookings per user; FIFO pruning prefers the oldest booking for a *different* event
- Booking ref first character = event title first character (uppercase)
- Seat count reduces on booking, restores on cancellation
- Refund eligibility: 1 ticket = eligible, >1 ticket = not eligible (client-side only)
- Cross-user booking access returns "Access Denied" in the UI (403 from API)

## Testing Conventions
- Test files: `tests/<feature-name>.spec.js` (JavaScript)
- Locator priority: data-testid > role > label/placeholder > ID > CSS class
- No `page.waitForTimeout()` — use web-first assertions like `expect().toBeVisible()`
- Tests must be self-contained (login → action → assert); `fullyParallel: false`
- Test account: `rahulshetty1@gmail.com` / `Magiclife1!`
- Add step comments in tests

## Project Skills (`.claude/skills/`)
Reference skills (read before writing/reviewing tests):
- `playwright-best-practices` — testing standards
- `eventhub-domain` — domain knowledge; sub-files `api-reference.md`, `business-rules.md`, `ui-selectors.md`, `user-flows.md`

User-invoked agent skills:
- `/generate-tests <feature>` — writes and validates Playwright tests
- `/review-tests <file>` — reviews test code quality
- `/create-scenarios <area>` — writes test scenario docs (output in `docs/test-scenarios.md`)
- `/test-strategy <scenarios>` — assigns tests to pyramid layers (output in `docs/test-strategy.md`)

## Code Style
- Backend: JavaScript (CommonJS) with JSDoc
- Frontend: TypeScript, React hooks, Tailwind utility classes
