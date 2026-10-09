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

### TC-005: Browse, search, and filter the event catalogue
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is authenticated and events exist in the shared catalogue.
**Steps**:
1. Navigate to Upcoming Events.
2. Search for a word appearing in an event title, description, or venue.
3. Select a category and a city.
4. Clear the filters.
**Expected Results**:
- Search results match title, description, or venue.
- Category and city filters narrow results, and combined filters are applied together.
- Clearing filters restores the unfiltered results.
**Business Rule**: The events endpoint supports free-text search and category and city filters.
**Suggested Layer**: E2E

### TC-006: Open an event and review its details
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is authenticated and an event is available.
**Steps**:
1. Open the event catalogue.
2. Select an event card and open its detail page.
3. Review the event information and available ticket action.
**Expected Results**:
- The detail page shows the selected event's title, description, category, date, venue, city, price, and available seats.
- The displayed event matches the card selected.
- The user can proceed to book the event when seats are available.
**Business Rule**: Authenticated users can retrieve shared static events and their own dynamic events by ID.
**Suggested Layer**: E2E

### TC-007: Create a custom event
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User is authenticated and is on the Admin Events page.
**Steps**:
1. Enter a title, description, category, venue, city, future date, price, and total seats.
2. Optionally enter a valid image URL.
3. Submit the event form.
4. Find the new event in the admin list and event catalogue.
**Expected Results**:
- A success notification appears and the form resets.
- The new event is listed for its creator and has available seats equal to total seats.
- The event is not exposed as a shared static event.
**Business Rule**: Custom events belong to the creating user, and available seats start at total seats.
**Suggested Layer**: E2E

### TC-008: Update an owned custom event
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User owns a custom event.
**Steps**:
1. Open Admin Events and select Edit for the custom event.
2. Change the title and one or more other event fields.
3. Submit the update.
4. Reopen the event and inspect the saved values.
**Expected Results**:
- The edit form is pre-filled with the selected event's current values.
- The changes are saved and shown in the admin list and event detail.
- No other event is changed.
**Business Rule**: Users may update their own dynamic events.
**Suggested Layer**: E2E

### TC-009: Delete an owned custom event and its bookings
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User owns a custom event with at least one booking.
**Steps**:
1. Open Admin Events and select Delete for the custom event.
2. Cancel the confirmation dialog and verify the event remains.
3. Select Delete again and confirm.
4. Inspect the event catalogue and bookings list.
**Expected Results**:
- Canceling the confirmation does not delete the event.
- Confirming removes the event and its associated bookings.
- The event no longer appears in the catalogue or event detail route.
**Business Rule**: Deleting a dynamic event cascades to its bookings; the UI requires confirmation.
**Suggested Layer**: E2E

### TC-105: Creating a seventh custom event replaces only the oldest owned event
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has created six custom events in a known order.
**Steps**:
1. Record the six event titles and creation order.
2. Create a seventh custom event.
3. Review the user's event list and another user's event list.
**Expected Results**:
- The newly created event is present and the oldest of the six is removed.
- The five newer existing events remain.
- Other users' events and shared static events remain unchanged.
**Business Rule**: Each account can hold up to six custom events; creation at the limit prunes that user's oldest event (FIFO).
**Suggested Layer**: API

### TC-106: Static events are shared but excluded from custom-event management
**Category**: Business Rule
**Priority**: P1
**Preconditions**: At least one static event and one custom event exist.
**Steps**:
1. Open the event catalogue and Admin Events as two different users.
2. Compare visibility of the static event and the custom event.
3. Review available actions for each event in Admin Events.
**Expected Results**:
- Both users can see the static event.
- Each user sees their own custom event but not another user's custom event.
- Static events are marked as featured/read-only and do not offer edit or delete actions.
- Static events do not count toward the six-custom-event limit.
**Business Rule**: Static events are shared and immutable; custom events are scoped to their owner.
**Suggested Layer**: E2E

### TC-107: Event catalogue pagination returns the correct page and count
**Category**: Business Rule
**Priority**: P1
**Preconditions**: The authenticated user's visible catalogue contains more than 12 events.
**Steps**:
1. Open Upcoming Events and record the first page of results.
2. Navigate to the next page.
3. Return to the previous page.
**Expected Results**:
- The public event page shows at most 12 event cards per page.
- Pagination reflects the total result count and correct current page.
- The next page contains the remaining results without duplicating first-page entries.
**Business Rule**: Event results are paginated; the event page requests 12 entries per page.
**Suggested Layer**: E2E

### TC-108: Static-event seat availability is isolated per user
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Two users can access the same static event with enough seats.
**Steps**:
1. Record the static event's available seats as User A.
2. Book tickets as User A and revisit the event as User A.
3. Open the same event as User B and record the available seats.
**Expected Results**:
- User A sees their available seats reduced by their booking quantity.
- User B's available seats are unaffected by User A's booking.
- The static event remains visible to both users.
**Business Rule**: Static events are shared, but seat availability is calculated per user using that user's bookings.
**Suggested Layer**: API

### TC-202: Event endpoints reject unauthenticated requests
**Category**: Security
**Priority**: P0
**Preconditions**: No valid bearer token is available.
**Steps**:
1. Call the event list and detail endpoints without a token.
2. Attempt to create, update, and delete an event without a token.
**Expected Results**:
- Each request is rejected as unauthorized.
- No event data or mutation is returned to or performed for the unauthenticated caller.
**Business Rule**: All event API routes require authentication.
**Suggested Layer**: API

### TC-203: A user cannot read or change another user's custom event
**Category**: Security
**Priority**: P0
**Preconditions**: User A owns a custom event; User B is authenticated separately and knows its ID.
**Steps**:
1. As User B, request the event list and User A's event detail URL.
2. Attempt to update and delete User A's event using its ID.
3. Verify the event remains unchanged for User A.
**Expected Results**:
- User A's custom event is absent from User B's list and is not retrievable by User B.
- User B cannot update or delete the event.
- User A's event and its fields remain unchanged.
**Business Rule**: Dynamic events are visible and manageable only by their owner.
**Suggested Layer**: API

### TC-204: Static-event mutation requests are forbidden
**Category**: Security
**Priority**: P1
**Preconditions**: User is authenticated and knows a static event ID.
**Steps**:
1. Attempt to update the static event through the API.
2. Attempt to delete the static event through the API.
3. Verify the event remains available in the catalogue.
**Expected Results**:
- Update and delete requests are rejected with a forbidden response.
- The static event's data remains unchanged and the event remains available.
**Business Rule**: Static events cannot be edited or deleted.
**Suggested Layer**: API

### TC-302: Event creation rejects missing required fields and invalid dates
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated and has fewer than six custom events.
**Steps**:
1. Submit the create form with each required field missing or whitespace-only, one field at a time.
2. Submit an invalid date and then a date in the past.
3. Try to submit each invalid form.
**Expected Results**:
- Client-side validation identifies missing required values.
- Invalid or past dates are rejected with a validation error.
- No event is created for any invalid submission, and entered values remain available for correction.
**Business Rule**: Title, category, venue, city, event date, price, and total seats are required; event dates must be valid and in the future.
**Suggested Layer**: API

### TC-303: Event creation rejects invalid price, seat count, and image URL
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated and can create a custom event.
**Steps**:
1. Submit an event with a negative or non-numeric price.
2. Submit an event with zero, negative, or fractional total seats.
3. Submit an event with a malformed image URL.
**Expected Results**:
- Each invalid value is rejected with a field-specific validation error.
- No event is created from an invalid submission.
- A price of zero and an omitted optional image URL are accepted when all other values are valid.
**Business Rule**: Price must be a non-negative number, total seats a positive integer, and an optional image URL a valid URL.
**Suggested Layer**: API

### TC-304: Requesting an unknown or non-owned event ID does not expose event data
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated; the requested ID is either nonexistent or belongs to another user.
**Steps**:
1. Request event details using the ID.
2. Attempt to update and delete the event using the same ID.
**Expected Results**:
- The event is not returned to the caller.
- Update and delete operations do not change another user's event.
- The API returns a not-found or other documented denial response without disclosing event details.
**Business Rule**: Event lookup and mutation are restricted to shared static events and the current user's events.
**Suggested Layer**: API

### TC-402: Event creation accepts minimum valid numeric values
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User is authenticated and is below the six-event limit.
**Steps**:
1. Create a custom event with price zero and exactly one seat.
2. Reopen the event and inspect its stored details.
**Expected Results**:
- The event is created successfully.
- Price remains zero, total seats is one, and available seats starts at one.
**Business Rule**: Event price may be zero; total seats must be at least one.
**Suggested Layer**: API

### TC-403: Search with no matches shows a recoverable empty state
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User is authenticated and event search is available.
**Steps**:
1. Search for a unique term that does not appear in any visible event.
2. Replace the search with a term known to match an event.
3. Clear the search.
**Expected Results**:
- No-match search shows the “No events found” state rather than a broken or stale list.
- Replacing or clearing the search loads matching events again.
**Business Rule**: Search filters the visible event collection and may return an empty result.
**Suggested Layer**: Component

### TC-502: Events page shows loading, error, and retry states
**Category**: UI State
**Priority**: P1
**Preconditions**: User is authenticated; the event API can be delayed or made unavailable in a controlled test.
**Steps**:
1. Delay the event-list response while opening Upcoming Events.
2. Verify loading placeholders appear.
3. Make the request fail and verify the error state.
4. Restore the API and activate Retry.
**Expected Results**:
- Loading placeholders appear while events are being fetched.
- A recoverable error message and Retry action appear after failure.
- Retry reloads and displays events once the API is available.
**Business Rule**: Event-list loading and request failures have explicit UI states.
**Suggested Layer**: Component

### TC-503: Admin Events page handles an empty event list and edit cancellation
**Category**: UI State
**Priority**: P2
**Preconditions**: User is authenticated and has no custom events.
**Steps**:
1. Open Admin Events and inspect the event list.
2. Create a custom event and select Edit.
3. Cancel editing without submitting changes.
**Expected Results**:
- An empty-state prompt is shown when the user has no visible events.
- Selecting Edit pre-fills the form and changes its heading and submit action.
- Cancel edit restores the new-event form without changing the saved event.
**Business Rule**: The admin event list and form adapt to empty, create, and edit states.
**Suggested Layer**: Component
