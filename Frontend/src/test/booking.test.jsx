import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderPage, currentLocation, apiMock, fail } from './utils';
import { addresses, providerA, serviceDetail, services } from './fixtures';
import BookService from '../pages/customer/BookService';
import { toDateInputValue } from '../utils/customer';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

// A Wednesday two weeks out so the provider (Mon–Sat, 08:00–20:00) is working.
const nextWednesday = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
};

const renderWizard = (route = '/customer/book/s-fan') =>
  renderPage(<BookService />, {
    route,
    path: '/customer/book/:serviceId',
    extraRoutes: [['/customer/bookings/:id', <h1 key="d">Booking detail page</h1>]],
  });

const createdBooking = {
  id: 'b-new',
  bookingNumber: 'BK-555555-123',
  status: 'PENDING',
  bookingDate: '2026-12-02',
  timeSlot: '10:00 AM - 12:00 PM',
  totalAmount: 349,
};

async function goToSchedule(user) {
  await user.click(await screen.findByRole('radio', { name: /sharma electricals, ₹349/i }));
  await user.click(screen.getByRole('button', { name: /continue/i }));
  await screen.findByRole('radio', { name: /home:/i });
  await user.click(screen.getByRole('button', { name: /continue/i }));
}

describe('booking wizard', () => {
  beforeEach(() => {
    loginAs();
    mockApi({
      'GET /services/s-fan': serviceDetail,
      'GET /users/addresses': addresses,
      'GET /providers/p-ravi': providerA,
      'GET /providers/p-ravi/availability': () => fail('Not found', 404), // endpoint missing → fallback slots
      'POST /bookings': createdBooking,
    });
  });

  it('requires a provider before continuing', async () => {
    const user = userEvent.setup();
    renderWizard();
    await screen.findByRole('radio', { name: /sharma electricals/i });
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/please select a provider/i);
  });

  it('preselects the provider from ?providerId and the default address', async () => {
    const user = userEvent.setup();
    renderWizard('/customer/book/s-fan?providerId=p-ravi');
    expect(await screen.findByRole('radio', { name: /sharma electricals/i })).toBeChecked();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('radio', { name: /home:/i })).toBeChecked();
  });

  it('validates date, slot and problem description', async () => {
    const user = userEvent.setup();
    renderWizard();
    await goToSchedule(user);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Please select a date')).toBeInTheDocument();
    expect(screen.getByText('Please select a time slot')).toBeInTheDocument();
    expect(screen.getByText(/describe the problem \(at least 10/i)).toBeInTheDocument();
  });

  it('completes the flow: review shows the fixed price and Cash on Service, then POSTs the booking', async () => {
    const user = userEvent.setup();
    const date = nextWednesday();
    renderWizard();
    await goToSchedule(user);

    await user.type(screen.getByLabelText(/select date/i), date);
    await user.click(await screen.findByRole('radio', { name: '10:00 AM - 12:00 PM' }));
    await user.type(screen.getByLabelText(/describe the problem/i), 'Fan makes a loud grinding noise');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('heading', { name: /review your booking/i })).toBeInTheDocument();
    expect(screen.getByText('₹349')).toBeInTheDocument();
    expect(screen.getByText('Cash on Service')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(await screen.findByRole('heading', { name: /booking request placed/i })).toBeInTheDocument();
    expect(screen.getByText('#BK-555555-123')).toBeInTheDocument();

    const [url, body] = apiMock().post.mock.calls.find(([u]) => u === '/bookings');
    expect(url).toBe('/bookings');
    expect(body).toMatchObject({
      serviceId: 's-fan',
      providerId: 'p-ravi',
      bookingType: 'NORMAL',
      bookingDate: date,
      timeSlot: '10:00 AM - 12:00 PM',
      problemDescription: 'Fan makes a loud grinding noise',
      addressPincode: '400053',
      totalAmount: 349,
      paymentMethod: 'CASH',
    });
    expect(body.serviceAddress).toContain('Andheri West, Mumbai');
    expect(body).not.toHaveProperty('quotationId');

    await user.click(screen.getByRole('button', { name: /view booking details/i }));
    await waitFor(() => expect(currentLocation()).toBe('/customer/bookings/b-new'));
  });

  it('returns to the schedule step and blocks the slot when the backend reports it unavailable', async () => {
    mockApi({
      'GET /services/s-fan': serviceDetail,
      'GET /users/addresses': addresses,
      'GET /providers/p-ravi': providerA,
      'GET /providers/p-ravi/availability': () => fail('Not found', 404),
      'POST /bookings': () => fail('Selected time slot is no longer available', 409),
    });
    const user = userEvent.setup();
    renderWizard();
    await goToSchedule(user);
    await user.type(screen.getByLabelText(/select date/i), nextWednesday());
    await user.click(await screen.findByRole('radio', { name: '10:00 AM - 12:00 PM' }));
    await user.type(screen.getByLabelText(/describe the problem/i), 'Fan makes a loud grinding noise');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(await screen.findByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Selected time slot is no longer available');
    expect(screen.getByRole('radio', { name: /10:00 AM - 12:00 PM – unavailable/i })).toBeDisabled();
  });

  it('uses the availability endpoint when it exists', async () => {
    mockApi({
      'GET /services/s-fan': serviceDetail,
      'GET /users/addresses': addresses,
      'GET /providers/p-ravi': providerA,
      'GET /providers/p-ravi/availability': {
        slots: [
          { label: '09:00 AM - 11:00 AM', available: true },
          { label: '11:00 AM - 01:00 PM', available: false },
        ],
      },
    });
    const user = userEvent.setup();
    renderWizard();
    await goToSchedule(user);
    await user.type(screen.getByLabelText(/select date/i), nextWednesday());
    expect(await screen.findByRole('radio', { name: '09:00 AM - 11:00 AM' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: /11:00 AM - 01:00 PM – unavailable/i })).toBeDisabled();
  });

  it('shows backend validation errors on the review step', async () => {
    mockApi({
      'GET /services/s-fan': serviceDetail,
      'GET /users/addresses': addresses,
      'GET /providers/p-ravi': providerA,
      'GET /providers/p-ravi/availability': () => fail('Not found', 404),
      'POST /bookings': () => fail('Selected provider is not verified or unavailable', 400),
    });
    const user = userEvent.setup();
    renderWizard();
    await goToSchedule(user);
    await user.type(screen.getByLabelText(/select date/i), nextWednesday());
    await user.click(await screen.findByRole('radio', { name: '02:00 PM - 04:00 PM' }));
    await user.type(screen.getByLabelText(/describe the problem/i), 'Fan makes a loud grinding noise');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(await screen.findByRole('button', { name: /confirm booking/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/booking could not be placed/i);
    expect(alert).toHaveTextContent(/not verified or unavailable/i);
  });

  it('lets the customer add an address inline when none exist', async () => {
    let list = [];
    mockApi({
      'GET /services/s-fan': serviceDetail,
      'GET /users/addresses': () => Promise.resolve({ success: true, data: list }),
      'POST /users/addresses': (body) => {
        list = [{ id: 'a-new', ...body }];
        return Promise.resolve({ success: true, data: list[0] });
      },
      'GET /providers/p-ravi': providerA,
    });
    const user = userEvent.setup();
    renderWizard('/customer/book/s-fan?providerId=p-ravi');
    await user.click(await screen.findByRole('button', { name: /continue/i }));
    await user.click(await screen.findByRole('button', { name: /add new address/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/house \/ building/i), 'Flat 9');
    await user.type(within(dialog).getByLabelText(/^street/i), 'Link Road');
    await user.type(within(dialog).getByLabelText(/^area/i), 'Malad');
    await user.type(within(dialog).getByLabelText(/^city/i), 'Mumbai');
    await user.selectOptions(within(dialog).getByLabelText(/^state/i), 'Maharashtra');
    await user.type(within(dialog).getByLabelText(/pin code/i), '400064');
    await user.click(within(dialog).getByRole('button', { name: /save address/i }));
    expect(await screen.findByRole('radio', { name: /home: flat 9, link road/i })).toBeChecked();
  });

  it('service picker on /customer/book links into the wizard', async () => {
    mockApi({ 'GET /services': services });
    renderPage(<BookService />, { route: '/customer/book', path: '/customer/book' });
    expect(await screen.findByRole('link', { name: /ceiling fan repair/i })).toHaveAttribute('href', '/customer/book/s-fan');
  });
});
