# EventHub — Booking Management Test Strategy
Generated: 2026-10-08
Input: docs/test-scenarios.md (17 scenarios, TC-001 to TC-501)

## 1. Layer Distribution Summary

| Layer | TC Count | Focus | Tooling | Status (runnable today / needs setup) | Approx. Run Time |
|---|---:|---|---|---|---|
| Unit | 2 | Booking ref prefix and quantity/price validation logic | Node built-in `node:test` (recommended, zero dependencies) | Needs setup | < 50 ms/test |
| API | 7 | Booking auth, validation, FIFO, ownership, seat checks, and cancellation behaviour | Playwright `APIRequestContext` against `/api/bookings` | Runnable today with local backend or live API | < 500 ms/test |
| Component | 4 | refund spinner and detail-page state handling, empty states, banner logic | Playwright page-level UI with `page.route()` or direct page state | Runnable today | < 2 s/test |
| E2E | 4 | Book → confirm → view → cancel flow; cross-user access; user sandbox journey | Playwright `page` against live app or local app | Runnable today | < 30 s/test |

Pyramid check: the repo does not yet have a unit runner installed, so the Unit layer is intentionally narrow. The Bookings area still keeps the expected bottom-heavy shape: API coverage is the main workhorse, with a small but important unit layer and a few UI/E2E smoke checks.

## 2. Tooling Gaps & Setup Needed

- Missing unit runner: no `vitest` or `node:test` setup is currently configured in the repo. Recommended: `node:test` because it is zero-dependency and already available in Node. Install cost: effectively none; only a simple `test` script or a small `tests/unit` folder is needed.
- Blocked or not yet implemented: TC-100 and TC-400 are the main Unit cases and should be added as soon as the unit harness exists.
- Component layer can run in Playwright today for the UI-only states (refund spinner, banner logic, empty state) without a new framework. The repo already has Playwright and the booking detail page is a good candidate for `page.route()` mocks.
- API layer is the strongest and most direct fit for the booking rules. It uses the existing backend and is runnable with the project’s Playwright stack immediately.

## 3. Layer Assignments

### Unit

| TC | Title | Priority | Target (function / endpoint / component / page) | Source file:line | Environment (live / local-only) |
|---|---|---|---|---|---|
| TC-100 | Booking reference must match the event title first letter | P0 | `bookingService.randomRef` and `bookingService.generateUniqueRef` | backend/src/services/bookingService.js | local-only |
| TC-400 | Booking quantity boundary values at 1 and 10 are accepted correctly | P1 | price × quantity calculation and quantity validation | backend/src/services/bookingService.js; backend/src/validators/bookingValidator.js | local-only |

### API

| TC | Title | Priority | Target (function / endpoint / component / page) | Source file:line | Environment (live / local-only) |
|---|---|---|---|---|---|
| TC-101 | Booking limit is enforced at nine bookings with FIFO pruning | P0 | `bookingService.createBooking` and `bookingRepository.findOldestUserBooking*` | backend/src/services/bookingService.js | local-only |
| TC-102 | Canceling one booking restores the user’s seat count for that event | P0 | `bookingService.cancelBooking` and `bookingController.cancelBooking` | backend/src/services/bookingService.js; backend/src/controllers/bookingController.js | local-only |
| TC-103 | Booking list respects the page size and shows bookings in the correct order | P1 | `bookingService.getBookings` + `/api/bookings` | backend/src/services/bookingService.js; backend/src/controllers/bookingController.js | local-only |
| TC-200 | User cannot access another user’s booking by URL | P0 | `bookingService.getBookingById` / `getBookingByRef` authorization check | backend/src/services/bookingService.js | local-only |
| TC-201 | Accessing bookings without a valid token is rejected | P0 | auth middleware + `GET /api/bookings` / `GET /api/bookings/:id` | backend/src/middleware/authMiddleware.js; backend/src/routes/bookingRoutes.js | local-only |
| TC-300 | Booking cannot be created when available seats are insufficient | P0 | `bookingService.createBooking` seat guard | backend/src/services/bookingService.js | local-only |
| TC-301 | Booking form rejects invalid customer details | P1 | `validateCreateBooking` in `bookingValidator.js` | backend/src/validators/bookingValidator.js | local-only |

### Component

| TC | Title | Priority | Target (function / endpoint / component / page) | Source file:line | Environment (live / local-only) |
|---|---|---|---|---|---|
| TC-104 | Refund eligibility is granted only for single-ticket bookings | P1 | `RefundEligibility` component on booking detail page | frontend/app/bookings/[id]/page.tsx | live (UI-only state) |
| TC-401 | Booking list handles a user with zero bookings | P2 | empty-state handling in bookings list page | frontend/app/bookings/page.tsx | live |
| TC-500 | My Bookings page shows warning banners and empty-state states correctly | P1 | list page conditional rendering and banner logic | frontend/app/bookings/page.tsx | live |
| TC-501 | Refund button shows loading spinner before the eligibility result appears | P1 | `RefundEligibility` loading + result transitions | frontend/app/bookings/[id]/page.tsx | live |

### E2E

| TC | Title | Priority | Target (function / endpoint / component / page) | Source file:line | Environment (live / local-only) |
|---|---|---|---|---|---|
| TC-001 | View and confirm my bookings after a successful purchase | P0 | book flow on event detail page → bookings page | frontend/app/events/[id]/page.tsx; frontend/app/bookings/page.tsx | live (with API cleanup) |
| TC-002 | Open a booking detail page and inspect booking information | P0 | booking detail page data rendering | frontend/app/bookings/[id]/page.tsx | live (with API cleanup) |
| TC-003 | Cancel a single booking from the detail page | P0 | cancel flow and booking list refresh | frontend/app/bookings/[id]/page.tsx; frontend/app/bookings/page.tsx | live (with API cleanup) |
| TC-004 | Clear all bookings from the bookings list | P1 | bulk cancel flow in bookings list page | frontend/app/bookings/page.tsx | live (with API cleanup) |

## 4. Multi-Layer Coverage (Defense-in-Depth)

| Rule | Unit | API | Component | E2E | TCs |
|---|---|---|---|---|---|
| Booking ref prefix | Yes | Yes | No | Yes | TC-100, TC-101, TC-001 |
| Price × quantity | Yes | Yes | No | Yes | TC-400, TC-300, TC-001 |
| Seat reduce / restore | No | Yes | No | Yes | TC-102, TC-003, TC-001 |
| Cross-user isolation | No | Yes | No | Yes | TC-200, TC-002 |
| FIFO limits | No | Yes | No | No | TC-101 |
| Refund eligibility | No | No | Yes | No | TC-104, TC-501 |

## 5. Decision Rationale (contested assignments)

- TC-100 — Assigned: Unit. Alternative: E2E. Reason: the rule is deterministic and belongs to the pure generator logic in `randomRef`/`generateUniqueRef` inside `backend/src/services/bookingService.js`; it does not need the browser to validate the prefix rule.
- TC-101 — Assigned: API. Alternative: E2E. Reason: FIFO pruning is a server-side business rule with repo-side state mutation and count checks in `bookingService.createBooking`; the API contract is the lowest layer that proves the effect on the user’s account.
- TC-102 — Assigned: API. Alternative: E2E. Reason: seat restoration after delete is a backend-side effect and calls `bookingRepository.delete`/`cancelBooking`; it should be asserted through the HTTP contract before a browser smoke check.
- TC-104 — Assigned: Component. Alternative: E2E. Reason: the refund logic is entirely client-side in `frontend/app/bookings/[id]/page.tsx` using a 4-second local timer; the user observes it on the detail page, but it is not an API behaviour.
- TC-200 — Assigned: API. Alternative: E2E. Reason: authorization is enforced at the HTTP layer via user ownership checks (`bookingService.getBookingById` / `getBookingByRef`) and should be verified at the contract boundary before a browser-level smoke check.

## 6. Known-Defect Tests

| TC | Finding | Intended behaviour asserted | Mark as `test.fail()` |
|---|---|---|---|
| — | No documented booking-management defects were captured in the current scenario set. | N/A | N/A |

## 7. Data, Environment & Execution Plan

- Setup/teardown helpers needed:
  - API login helper (`POST /api/auth/login`) with stored JWT.
  - Clear bookings helper (`DELETE /api/bookings`) before each booking-mutating test.
  - Create event helper for a test user when seat counts need to be seeded for limit or rebooking scenarios.
- Tags:
  - `@smoke` for P0 flows: TC-001, TC-002, TC-003, TC-101, TC-102, TC-200, TC-201, TC-300
  - `@regression` for the rest of the booking suite
  - `@destructive` for any tests that delete seeded or user-shared data; keep these local-only
  - `@local-only` for booking limit and negative API cases that mutate per-user state in a disposable DB
- Suites:
  - smoke: Playwright E2E + small API subset on push
  - full regression: nightly API + component + E2E booking suite
  - destructive / concurrency: local DB only, on demand
- Suggested spec split:
  - `tests/api/bookings.api.spec.js`
  - `tests/ui/booking-states.spec.js`
  - `tests/e2e/booking-journey.spec.js`

## 8. Existing Test Audit

### tests/e2e/booking-journey.spec.js

Covers:
- TC-001
- TC-002
- plus the business-rule assertions that align with TC-100 and TC-400 (ref prefix and price × quantity on the confirmation screen)

Anti-patterns found:
- It uses the live `baseURL` and should be treated as a smoke-suite dependency, not a local DIY data-builder.
- It is doing a lot of mixed concerns in one file: booking creation, assertions, and API setup.
- It should be split into API and UI/E2E modules once the test strategy is implemented.

Status:
- Keep the smoke intent.
- Split into tiered suites to keep the file from becoming a catch-all.
- Move repeated limit or validation checks into the API suite.

## 9. Coverage Gaps & Risks

- Unit coverage is currently the biggest gap because the repo has no unit-test harness yet. The most valuable first addition is `node:test` for booking ref generation and price/quantity logic.
- Booking-pruning and cross-user ownership tests are currently best placed in the API layer; they are too stateful and too easy to make flaky in browser E2E.
- The component layer should cover the refund spinner and empty-state logic, but the repo currently has only a thin E2E smoke suite and no dedicated booking-state tests.
- Concurrency and race scenarios (parallel booking posts on the same event) are not covered in this scenario set and should be reserved for a local-only P3 suite.
