### TC-001: View and confirm my bookings after a successful purchase
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is authenticated and has at least one valid booking in the sandbox.
**Steps**:
1. Log in with a valid account.
2. Navigate to the events list and open an event with available seats.
3. Choose a ticket quantity and complete the booking form.
4. Confirm the booking.
5. Open the My Bookings page from the navigation.
6. Locate the newly created booking card.
**Expected Results**:
- The event is displayed in the bookings list with the booking reference and quantity.
- The booking is visible without refreshing the page.
- The user can open the booking detail view from the card.
**Business Rule**: Users can view their bookings from the bookings page after confirmation; the booking is persisted and visible in the user sandbox.
**Suggested Layer**: E2E

### TC-002: Open a booking detail page and inspect booking information
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one booking.
**Steps**:
1. Navigate to the My Bookings page.
2. Click View Details on one booking.
3. Review the booking detail content.
**Expected Results**:
- Booking detail page loads with the event title, booking reference, customer details, quantity, and total.
- The page communicates the booking clearly and does not show unrelated user bookings.
- The user can navigate back to the list without losing context.
**Business Rule**: Booking detail access is limited to the current user’s own bookings and displays complete purchase metadata.
**Suggested Layer**: E2E

### TC-003: Cancel a single booking from the detail page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has a booking that is not already canceled and the event still exists.
**Steps**:
1. Open a booking detail page.
2. Click the cancel button.
3. Confirm the cancellation action if the UI prompts for confirmation.
**Expected Results**:
- The booking is removed from the bookings list.
- The booking no longer appears on the detail route.
- The booking seat count is restored for the user’s available seat calculation.
**Business Rule**: Booking deletion immediately frees seats and is the standard cancellation flow for a single booking.
**Suggested Layer**: E2E

### TC-004: Clear all bookings from the bookings list
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has multiple bookings on the My Bookings page.
**Steps**:
1. Open My Bookings.
2. Click Clear All Bookings.
3. Confirm the action if required.
**Expected Results**:
- All bookings for the user are removed.
- The empty state is shown if no bookings remain.
- All seat availability for the user is restored on relevant events.
**Business Rule**: “Clear All Bookings” removes all bookings in one action and should release seats immediately.
**Suggested Layer**: E2E

### TC-100: Booking reference must match the event title first letter
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has an event titled with a recognizable leading letter, such as “Tech Summit”.
**Steps**:
1. Navigate to an event detail page.
2. Book one or more tickets.
3. Capture the generated booking reference.
**Expected Results**:
- The first character of the booking reference equals the event title’s first character in uppercase.
- The reference remains in the documented format like T-XXXXXX.
- The booking is created successfully only when the rule is respected.
**Business Rule**: Booking reference format is `[FIRST_LETTER]-[6_RANDOM_ALPHANUMERIC]` and the first letter derives from the event title uppercase value.
**Suggested Layer**: E2E

### TC-101: Booking limit is enforced at nine bookings with FIFO pruning
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User account is below the booking limit and can create multiple bookings across at least two events.
**Steps**:
1. Create a sequence of 9 distinct bookings.
2. Attempt to create a 10th booking.
3. Observe the booking list after creation.
**Expected Results**:
- The user can create up to 9 bookings.
- When the 10th booking is added, the oldest booking is pruned according to FIFO logic.
- The remaining bookings are kept in the correct order and the oldest booking is no longer visible.
**Business Rule**: Max 9 bookings per user; the new booking triggers FIFO replacement of the oldest booking.
**Suggested Layer**: E2E

### TC-102: Canceling one booking restores the user’s seat count for that event
**Category**: Business Rule
**Priority**: P0
**Preconditions**: The user has a booked quantity on an event and the event permits re-booking after cancellation.
**Steps**:
1. Book a quantity of tickets on an event.
2. Record the event’s available seats before and after the booking.
3. Cancel the booking.
4. Reopen the event or refresh the bookings list.
**Expected Results**:
- The available seat count increases back to the pre-booking value.
- The booking disappears from the user’s list after cancellation.
- The same user can rebook the released seats immediately.
**Business Rule**: Booking deletion immediately frees seats; seat count reduces on booking and restores on cancellation.
**Suggested Layer**: E2E

### TC-103: Booking list respects the page size and shows bookings in the correct order
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has more than 9 bookings in the sandbox.
**Steps**:
1. Create enough bookings to exceed the page limit.
2. Open My Bookings.
3. Observe the rendered list and the pagination or limit at 9 bookings.
**Expected Results**:
- No more than 9 bookings are displayed at one time.
- The list order follows the expected FIFO or newest-first business behavior as implemented.
- Extra bookings are not shown in the current page view.
**Business Rule**: Bookings page shows up to 9 bookings at a time and an account can hold up to 9 active bookings.
**Suggested Layer**: E2E

### TC-104: Refund eligibility is granted only for single-ticket bookings
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has one booking with quantity 1 and another with quantity greater than 1.
**Steps**:
1. Open the detail page for a single-ticket booking.
2. Click Check Refund Eligibility.
3. Wait for the 4-second spinner to finish.
4. Repeat for a multi-ticket booking.
**Expected Results**:
- Single-ticket booking shows “Single-ticket bookings qualify for a full refund”.
- Multi-ticket booking shows “Group bookings (N tickets) are non-refundable”.
- Both results appear after the spinner completes and the UI remains accessible.
**Business Rule**: Refund eligibility is client-side only; quantity 1 is eligible, quantity > 1 is not.
**Suggested Layer**: E2E

### TC-200: User cannot access another user’s booking by URL
**Category**: Security
**Priority**: P0
**Preconditions**: User A has created a booking and has the booking id or route; User B is authenticated as a different user.
**Steps**:
1. Log in as User A and capture a valid booking URL.
2. Log out or switch to User B.
3. Attempt to open User A’s booking URL directly.
**Expected Results**:
- User B is denied access.
- The UI shows an access denied message or equivalent forbidden state.
- The booking remains hidden from User B’s dashboard and route access is blocked.
**Business Rule**: Cross-user booking access returns 403 Forbidden / “Access Denied.”
**Suggested Layer**: E2E

### TC-201: Accessing bookings without a valid token is rejected
**Category**: Security
**Priority**: P0
**Preconditions**: User is not authenticated, or token is missing/invalid.
**Steps**:
1. Clear the JWT from the browser storage.
2. Attempt to open the bookings page or any booking detail URL.
**Expected Results**:
- Access is blocked.
- The user is redirected to login or sees an unauthorized error state.
- No booking data is exposed to an unauthenticated session.
**Business Rule**: Booking routes require Bearer authentication and reject missing or invalid tokens.
**Suggested Layer**: E2E

### TC-300: Booking cannot be created when available seats are insufficient
**Category**: Negative
**Priority**: P0
**Preconditions**: User is on an event where available seats are fewer than the desired quantity.
**Steps**:
1. Open an event detail page.
2. Set quantity to a value greater than remaining seats.
3. Attempt to confirm booking.
**Expected Results**:
- Submission is blocked.
- A validation or insufficient seats error is displayed.
- No booking is created and the user can adjust quantity and retry.
**Business Rule**: Insufficient seats returns 400 and a clear business validation message.
**Suggested Layer**: E2E

### TC-301: Booking form rejects invalid customer details
**Category**: Negative
**Priority**: P1
**Preconditions**: User is on the event booking form and has selected a valid quantity.
**Steps**:
1. Enter a customer name shorter than 2 characters.
2. Enter an invalid or malformed email.
3. Enter a phone number with fewer than 10 digits.
4. Attempt to confirm the booking.
**Expected Results**:
- Validation errors are displayed and the booking is prevented.
- The user is not taken to the confirmation screen.
- Information stays in the form so the user can correct it.
**Business Rule**: Booking inputs must pass the validator rules for name, email, and phone before booking creation is allowed.
**Suggested Layer**: E2E

### TC-400: Booking quantity boundary values at 1 and 10 are accepted correctly
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event has enough available seats for at least 10 tickets.
**Steps**:
1. Book a quantity of 1 ticket.
2. Capture the result.
3. Book another event or same event if available seats allow and set quantity to 10.
**Expected Results**:
- Quantity 1 is successfully accepted and the refund-eligible logic triggers correctly.
- Quantity 10 is successfully accepted within limit and produces a valid booking reference.
- Total price matches price x quantity for both cases.
**Business Rule**: Quantity must be within 1–10 and total price equals the per-ticket price times quantity.
**Suggested Layer**: E2E

### TC-401: Booking list handles a user with zero bookings
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User account has no bookings yet.
**Steps**:
1. Log in to a fresh account with no bookings.
2. Navigate to My Bookings.
**Expected Results**:
- The page shows an empty state instead of a broken list.
- No previous booking data or stale records appear.
- The user is invited to browse events and make a booking.
**Business Rule**: Empty state is expected when the user has no bookings in the sandbox.
**Suggested Layer**: UI State

### TC-500: My Bookings page shows warning banners and empty-state states correctly
**Category**: UI State
**Priority**: P1
**Preconditions**: User has either a low number of bookings or close to the booking limit.
**Steps**:
1. Navigate to My Bookings with a small number of bookings.
2. Add enough bookings to approach the limit.
3. Observe the banner logic on the page.
**Expected Results**:
- Banner appears when the user is close to or exceeds the booking threshold.
- The banner hides when counts are below the threshold.
- The list and empty-state conditional content remain consistent across each count.
**Business Rule**: Sandbox warning banners appear when counts are near or above the predefined thresholds and are hidden when counts are low.
**Suggested Layer**: UI State

### TC-501: Refund button shows loading spinner before the eligibility result appears
**Category**: UI State
**Priority**: P1
**Preconditions**: User has a booking detail page open.
**Steps**:
1. Click Check Refund Eligibility.
2. Observe the UI immediately after click.
3. Wait for the spinner to finish.
**Expected Results**:
- Spinner is visible for roughly 4 seconds.
- Result text is hidden until the spinner completes.
- After completion, the refund result is displayed with the correct message based on quantity.
**Business Rule**: Refund eligibility logic displays a 4-second spinner before revealing the result on the frontend.
**Suggested Layer**: Component
