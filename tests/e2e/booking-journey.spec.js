import { test, expect } from '@playwright/test';

const BASE_URL      = 'https://eventhub.rahulshettyacademy.com';
const API_URL       = process.env.API_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api';
const USER_EMAIL    = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

const CUSTOMER = {
  customerName:  'E2E Journey User',
  customerEmail: 'e2e.journey@example.com',
  customerPhone: '9876543210',
};

// Same formatters the UI uses (BookingCard.jsx, events/[id]/page.tsx)
const fmtPrice = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Logs in via the API and returns the JWT. */
async function apiLogin(request) {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

/** Deletes all of the user's bookings via the API. */
async function clearBookings(request, token) {
  const res = await request.delete(`${API_URL}/bookings`, { headers: authHeaders(token) });
  expect(res.ok()).toBeTruthy();
}

/** Logs in via the API, injects the token into localStorage and clears bookings. */
async function setupSession(page, request) {
  const token = await apiLogin(request);
  await page.addInitScript((t) => localStorage.setItem('eventhub_token', t), token);
  await clearBookings(request, token);
  return token;
}

/** Reads "N / M seats" from the event detail page and returns N. */
async function readAvailableSeats(page) {
  const seatsText = page.getByText(/^\d+ \/ \d+ seats$/);
  await expect(seatsText).toBeVisible();
  return Number((await seatsText.textContent()).split('/')[0].trim());
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Booking Journey — E2E', () => {

  // TC-001 + TC-008 ──────────────────────────────────────────────────────────
  test('TC-001/TC-008: book a static event end-to-end, then view it in My Bookings', async ({ page, request }) => {
    // -- Step 1: Log in via API, inject token, clear bookings --
    const token = await setupSession(page, request);

    // -- Step 2: Open /events and pick a static event with plenty of seats --
    await page.goto(`${BASE_URL}/events`);
    const eventCard = page.getByTestId('event-card')
      .filter({ hasText: 'Featured' })
      .filter({ hasText: /\d+ seats available/ })
      .first();
    await expect(eventCard).toBeVisible();
    const eventTitle = (await eventCard.getByRole('heading', { level: 3 }).textContent()).trim();
    console.log(`Booking event: "${eventTitle}"`);

    // -- Step 3: Go to the event detail page and record seats before booking --
    await eventCard.getByTestId('book-now-btn').click();
    await expect(page).toHaveURL(/\/events\/\d+$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(eventTitle);
    const eventId = page.url().split('/').pop();
    const seatsBefore = await readAvailableSeats(page);

    // Ticket price comes from the API so the expected total is exact
    const eventRes = await request.get(`${API_URL}/events/${eventId}`, { headers: authHeaders(token) });
    expect(eventRes.ok()).toBeTruthy();
    const price = parseFloat((await eventRes.json()).data.price);
    const expectedTotal = fmtPrice(price * 2);

    // -- Step 4: Select 2 tickets and fill the booking form --
    await page.getByRole('button', { name: '+', exact: true }).click();
    await expect(page.locator('#ticket-count')).toHaveText('2');
    await page.getByLabel('Full Name').fill(CUSTOMER.customerName);
    await page.locator('#customer-email').fill(CUSTOMER.customerEmail);
    await page.getByPlaceholder('+91 98765 43210').fill(CUSTOMER.customerPhone);
    await page.locator('.confirm-booking-btn').click();

    // -- Step 5: Assert confirmation — ref prefix (TC-102) and total = price × 2 (TC-103) --
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();
    const refEl = page.locator('.booking-ref');
    const expectedPrefix = escapeRegExp(eventTitle[0].toUpperCase());
    await expect(refEl).toHaveText(new RegExp(`^${expectedPrefix}-[A-Z0-9]{6}$`));
    const bookingRef = (await refEl.textContent()).trim();
    console.log(`Booking confirmed. Ref: ${bookingRef}`);

    // Full-row match: "Total" label immediately followed by the exact amount and nothing after
    const confirmationTotal = page.getByText(new RegExp(`^Total\\s*${escapeRegExp(expectedTotal)}$`));
    await expect(confirmationTotal).toBeVisible();

    // -- Step 6 (TC-008): "View My Bookings" → booking card has the matching ref --
    await test.step('TC-008: confirmation → View My Bookings', async () => {
      await page.getByRole('link', { name: 'View My Bookings' }).click();
      await expect(page).toHaveURL(`${BASE_URL}/bookings`);
      const bookingCards = page.getByTestId('booking-card');
      const bookingCard = bookingCards.filter({
        has: page.locator('.booking-ref', { hasText: bookingRef }),
      });
      await expect(bookingCard).toHaveCount(1);
      await expect(bookingCard.locator('.booking-ref')).toHaveText(bookingRef);
      await expect(bookingCard).toContainText(eventTitle);
    });

    // -- Step 7: Reload the event page — seats decreased by 2 --
    await page.goto(`${BASE_URL}/events/${eventId}`);
    const seatsAfter = await readAvailableSeats(page);
    console.log(`Seats before: ${seatsBefore}, after: ${seatsAfter}`);
    expect(seatsAfter).toBe(seatsBefore - 2);
  });

  // TC-002 ───────────────────────────────────────────────────────────────────
  test('TC-002: bookings list shows real booking data from the API', async ({ page, request }) => {
    // -- Step 1: Log in via API, inject token, clear bookings --
    const token = await setupSession(page, request);

    // -- Step 2: Pick a static event with seats and book 2 tickets via the API --
    const eventsRes = await request.get(`${API_URL}/events`, { headers: authHeaders(token) });
    const event = (await eventsRes.json()).data.find((e) => e.isStatic && e.availableSeats > 10);
    expect(event, 'a static event with seats should exist').toBeTruthy();

    const bookingRes = await request.post(`${API_URL}/bookings`, {
      headers: authHeaders(token),
      data: { eventId: event.id, quantity: 2, ...CUSTOMER },
    });
    expect(bookingRes.status()).toBe(201);
    const booking = (await bookingRes.json()).data;
    console.log(`Booked via API. Ref: ${booking.bookingRef}, id: ${booking.id}`);

    // -- Step 3: Open /bookings --
    await page.goto(`${BASE_URL}/bookings`);
    const cards = page.getByTestId('booking-card');
    const card = cards.filter({
      has: page.locator('.booking-ref', { hasText: booking.bookingRef }),
    });
    await expect(card).toHaveCount(1);

    // -- Step 4: Assert every card field matches the API response --
    await expect(card.locator('.booking-ref')).toHaveText(booking.bookingRef);
    await expect(card).toContainText(booking.status);
    await expect(card.getByTestId('booking-id')).toHaveText(`#${booking.id}`);
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(event.title);
    await expect(card).toContainText(fmtDate(event.eventDate));
    await expect(card).toContainText(new RegExp(`(^|\\D)${booking.quantity} tickets`));
    await expect(card).toContainText(event.city);
    await expect(card).toContainText(`Booked ${fmtDate(booking.createdAt)}`);
    await expect(card).toContainText(fmtPrice(booking.totalPrice));
    await expect(card.getByRole('link', { name: 'View Details' })).toBeVisible();
    await expect(card.getByTestId('cancel-booking-btn')).toBeVisible();
  });
});
