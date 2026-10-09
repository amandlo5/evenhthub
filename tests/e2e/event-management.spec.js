import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://eventhub.rahulshettyacademy.com';

function makeEvent(overrides = {}) {
  return {
    id: 1,
    title: 'Tech Summit',
    description: 'A technology conference',
    category: 'Conference',
    venue: 'Convention Centre',
    city: 'Bangalore',
    eventDate: '2027-08-15T10:00:00.000Z',
    price: 149,
    totalSeats: 100,
    availableSeats: 100,
    isStatic: false,
    userId: 1,
    ...overrides,
  };
}

async function mockEventApi(page, initialEvents = []) {
  const events = initialEvents.map((event) => ({ ...event }));
  let nextId = Math.max(0, ...events.map((event) => event.id)) + 1;

  await page.addInitScript(() => {
    localStorage.setItem('eventhub_token', 'event-test-token');
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const eventsPath = url.pathname.match(/\/events(?:\/(\d+))?$/);

    if (url.pathname.endsWith('/auth/me')) {
      await route.fulfill({
        json: { success: true, user: { userId: 1, email: 'event.tester@example.com' } },
      });
      return;
    }

    if (!eventsPath) {
      await route.fulfill({ status: 404, json: { success: false, error: 'Not found' } });
      return;
    }

    if (method === 'GET') {
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const category = url.searchParams.get('category');
      const city = url.searchParams.get('city');
      const matchingEvents = events.filter((event) =>
        (!search || `${event.title} ${event.description} ${event.venue}`.toLowerCase().includes(search))
        && (!category || event.category === category)
        && (!city || event.city === city),
      );

      await route.fulfill({
        json: {
          success: true,
          data: matchingEvents,
          pagination: { page: 1, totalPages: 1, total: matchingEvents.length, limit: 12 },
        },
      });
      return;
    }

    if (method === 'POST') {
      const input = route.request().postDataJSON();
      const event = makeEvent({
        ...input,
        id: nextId++,
        availableSeats: input.totalSeats,
        isStatic: false,
      });
      events.unshift(event);
      await route.fulfill({ status: 201, json: { success: true, data: event } });
      return;
    }

    const eventId = Number(eventsPath[1]);
    const eventIndex = events.findIndex((event) => event.id === eventId);

    if (method === 'PUT' && eventIndex !== -1) {
      const input = route.request().postDataJSON();
      events[eventIndex] = { ...events[eventIndex], ...input };
      await route.fulfill({ json: { success: true, data: events[eventIndex] } });
      return;
    }

    if (method === 'DELETE' && eventIndex !== -1) {
      events.splice(eventIndex, 1);
      await route.fulfill({ json: { success: true, message: 'Event deleted' } });
      return;
    }

    await route.fulfill({ status: 404, json: { success: false, error: 'Event not found' } });
  });
}

function futureDateTime(daysAhead = 30) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setSeconds(0, 0);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

test.describe('Event management', () => {
  test('searches events and combines category and city filters', async ({ page }) => {
    await mockEventApi(page, [
      makeEvent({ id: 1, title: 'Tech Summit', category: 'Conference', city: 'Bangalore' }),
      makeEvent({ id: 2, title: 'Makers Workshop', category: 'Workshop', city: 'Pune' }),
    ]);

    // -- Step 1: Open events with category and city filters --
    await page.goto(`${BASE_URL}/events?category=Conference&city=Bangalore`);

    // -- Step 2: Search within the filtered results --
    await page.getByPlaceholder('Search events, venues…').fill('Tech');
    const techCard = page.getByTestId('event-card').filter({ hasText: 'Tech Summit' });
    await expect(techCard).toBeVisible();
    await expect(page.getByTestId('event-card')).toHaveCount(1);

    // -- Step 3: Clear filters and search across all events --
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByPlaceholder('Search events, venues…').fill('Workshop');
    await expect(page.getByTestId('event-card').filter({ hasText: 'Makers Workshop' })).toBeVisible();
    await expect(page.getByTestId('event-card')).toHaveCount(1);
  });

  test('validates, creates, edits, and deletes a custom event', async ({ page }) => {
    await mockEventApi(page, [
      makeEvent({ id: 1, title: 'Featured Conference', isStatic: true, userId: null }),
    ]);

    // -- Step 1: Open event management and verify static events are read-only --
    await page.goto(`${BASE_URL}/admin/events`);
    const featuredRow = page.getByTestId('event-table-row').filter({ hasText: 'Featured Conference' });
    await expect(featuredRow).toContainText('Read-only');
    await expect(featuredRow.getByRole('button', { name: 'Edit' })).toHaveCount(0);

    // -- Step 2: Validate required fields and reject a past date --
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByText('Title is required')).toBeVisible();

    await page.getByLabel('Title').fill('QA Automation Summit');
    await page.getByLabel('City').fill('Hyderabad');
    await page.getByLabel('Venue').fill('Innovation Hall');
    await page.getByLabel('Event Date & Time').fill('2020-01-01T10:00');
    await page.getByLabel('Price ($)').fill('50');
    await page.getByLabel('Total Seats').fill('80');
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByText('Must be a future date')).toBeVisible();

    // -- Step 3: Create a valid custom event --
    await page.getByLabel('Event Date & Time').fill(futureDateTime());
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByText('Event created!')).toBeVisible();

    const eventRow = page.getByTestId('event-table-row').filter({ hasText: 'QA Automation Summit' });
    await expect(eventRow).toBeVisible();
    await expect(eventRow).toContainText('Hyderabad');
    await expect(eventRow).toContainText('80/80');

    // -- Step 4: Edit the new event --
    await eventRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: /Edit Event/ })).toBeVisible();
    await page.getByLabel('Title').fill('QA Engineering Summit');
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByText('Event updated!')).toBeVisible();
    const updatedRow = page.getByTestId('event-table-row').filter({ hasText: 'QA Engineering Summit' });
    await expect(updatedRow).toBeVisible();

    // -- Step 5: Delete the custom event --
    await updatedRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByTestId('confirm-dialog-yes').click();
    await expect(updatedRow).toHaveCount(0);
    await expect(page.getByText('Event deleted')).toBeVisible();
  });
});
