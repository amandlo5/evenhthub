import { test, expect } from '@playwright/test';

const BASE_URL = 'https://eventhub.rahulshettyacademy.com';
const API_URL = process.env.API_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api';
const USER_EMAIL = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

const CUSTOMER = {
  customerName: 'Booking Manager',
  customerEmail: 'booking.manager@example.com',
  customerPhone: '9876543210',
};

async function apiLogin(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: USER_EMAIL, password: USER_PASSWORD },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.token;
}

async function clearBookings(request, token) {
  const response = await request.delete(`${API_URL}/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
}

async function setupSession(page, request) {
  const token = await apiLogin(request);
  await clearBookings(request, token);
  await page.addInitScript((storedToken) => {
    localStorage.setItem('eventhub_token', storedToken);
  }, token);
  return token;
}

test.describe('Booking Management', () => {
  test('TC-001: user can book, review, refund-check, and cancel a booking', async ({ page, request }) => {
    const token = await setupSession(page, request);

    const eventsResponse = await request.get(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(eventsResponse.status()).toBe(200);

    const events = (await eventsResponse.json()).data;
    const event = events.find((entry) => entry.isStatic && entry.availableSeats >= 10);
    expect(event, 'a static event with available seats should exist').toBeTruthy();

    await page.goto(`${BASE_URL}/events/${event.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(event.title);

    await page.getByRole('button', { name: '+' }).click();
    await expect(page.locator('#ticket-count')).toHaveText('2');

    await page.getByLabel('Full Name').fill(CUSTOMER.customerName);
    await page.locator('#customer-email').fill(CUSTOMER.customerEmail);
    await page.getByPlaceholder('+91 98765 43210').fill(CUSTOMER.customerPhone);

    const totalPrice = Number(event.price) * 2;
    const totalRow = page.locator('.bg-indigo-50').filter({ hasText: 'Total' }).first();
    await expect(totalRow).toContainText(`$${totalPrice}`);

    await page.locator('.confirm-booking-btn').click();

    await expect(page.getByText('Booking Confirmed!')).toBeVisible();

    const bookingRef = (await page.locator('.booking-ref').textContent()).trim();
    expect(bookingRef).toMatch(/^[A-Z]-[A-Z0-9]{6}$/);
    expect(bookingRef[0]).toBe(event.title.trim()[0].toUpperCase());

    await page.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(page).toHaveURL(/\/bookings$/);

    const bookingCard = page.locator('#booking-card').first();
    await expect(bookingCard).toBeVisible();
    await expect(bookingCard.locator('.booking-ref')).toHaveText(bookingRef);
    await expect(bookingCard).toContainText(event.title);

    await bookingCard.getByRole('link', { name: 'View Details' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(event.title);

    await expect(page.locator('#check-refund-btn')).toBeVisible();
    await page.locator('#check-refund-btn').click();
    await expect(page.locator('#refund-spinner')).toBeVisible();
    await expect(page.locator('#refund-result')).toContainText('Group bookings (2 tickets) are non-refundable', { timeout: 15000 });

    await page.getByRole('button', { name: 'Cancel Booking' }).click();
    const cancellation = page.waitForResponse((response) =>
      response.url().includes('/bookings/') &&
      response.url().endsWith('/cancel') &&
      response.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Yes, cancel it' }).click();

    expect((await cancellation).status()).toBe(200);
    await page.goto(`${BASE_URL}/bookings`);
    await expect(page.getByText('No bookings yet')).toBeVisible();
  });

  test('TC-004: clear all bookings from the list view', async ({ page, request }) => {
    const token = await setupSession(page, request);

    const eventsResponse = await request.get(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(eventsResponse.status()).toBe(200);

    const events = (await eventsResponse.json()).data;
    const firstEvent = events.find((entry) => entry.isStatic && entry.availableSeats >= 10);
    const secondEvent = events.find((entry) => entry.isStatic && entry.id !== firstEvent.id && entry.availableSeats >= 10);

    expect(firstEvent, 'first static event should exist').toBeTruthy();
    expect(secondEvent, 'second static event should exist').toBeTruthy();

    for (const event of [firstEvent, secondEvent]) {
      const response = await request.post(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          eventId: event.id,
          quantity: 1,
          customerName: CUSTOMER.customerName,
          customerEmail: CUSTOMER.customerEmail,
          customerPhone: CUSTOMER.customerPhone,
        },
      });

      expect(response.status()).toBe(201);
    }

    await page.goto(`${BASE_URL}/bookings`);
    await expect(page.locator('#booking-card')).toHaveCount(2);

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Clear all bookings' }).click();

    await expect(page.getByText('No bookings yet')).toBeVisible();
  });
});
