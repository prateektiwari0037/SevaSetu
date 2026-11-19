import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderPage, apiMock, fail } from './utils';
import { bookings, providerA } from './fixtures';
import CustomerBookings from '../pages/customer/CustomerBookings';
import BookingDetails from '../pages/customer/BookingDetails';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('booking history', () => {
  beforeEach(() => {
    loginAs();
    mockApi({ 'GET /bookings': bookings });
  });

  it('defaults to upcoming and shows counts per tab', async () => {
    renderPage(<CustomerBookings />, { route: '/customer/bookings', path: '/customer/bookings' });
    expect(await screen.findByRole('link', { name: 'Ceiling Fan Repair' })).toBeInTheDocument();
    const tabs = screen.getByRole('tablist', { name: /booking status/i });
    expect(within(tabs).getByRole('tab', { name: /upcoming 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(tabs).getByRole('tab', { name: /cancelled 1/i })).toBeInTheDocument();
    expect(within(tabs).getByRole('tab', { name: /all 4/i })).toBeInTheDocument();
  });

  it.each([
    ['Active', 'BK-100002'],
    ['Completed', 'BK-100003'],
    ['Cancelled', 'BK-100004'],
    ['Pending', 'BK-100001'],
  ])('%s tab lists matching bookings', async (tab, number) => {
    const user = userEvent.setup();
    renderPage(<CustomerBookings />, { route: '/customer/bookings', path: '/customer/bookings' });
    await screen.findAllByRole('article');
    await user.click(screen.getByRole('tab', { name: new RegExp(`^${tab}`) }));
    const items = await screen.findAllByRole('article');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText(`#${number}`)).toBeInTheDocument();
  });

  it('shows an empty state when there are no bookings', async () => {
    mockApi({ 'GET /bookings': [] });
    renderPage(<CustomerBookings />, { route: '/customer/bookings?tab=all', path: '/customer/bookings' });
    expect(await screen.findByText(/no bookings here yet/i)).toBeInTheDocument();
  });
});

describe('booking details', () => {
  const pending = {
    ...bookings[0],
    statusHistory: [{ id: 'h1', status: 'PENDING', comment: 'Booking request created by customer', createdAt: bookings[0].createdAt }],
  };

  beforeEach(() => loginAs());

  it('shows timeline, provider, address, price snapshot and read-only Cash on Service payment', async () => {
    mockApi({ 'GET /bookings/b-pending': pending });
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-pending', path: '/customer/bookings/:id' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Ceiling Fan Repair' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /booking progress/i })).toBeInTheDocument();
    expect(screen.getByText('Booking request created by customer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sharma Electricals' })).toBeInTheDocument();
    expect(screen.getByText('Flat 402, Sunshine Heights, Mumbai')).toBeInTheDocument();
    expect(screen.getByText('₹349')).toBeInTheDocument();
    expect(screen.getByText('Cash on Service')).toBeInTheDocument();
    expect(screen.getByText('Due on service')).toBeInTheDocument();
    // No way to change payment status from the customer UI.
    expect(screen.queryByRole('button', { name: /pay|mark.*paid/i })).not.toBeInTheDocument();
  });

  it('cancels with a reason via PATCH /bookings/:id/cancel', async () => {
    let current = pending;
    mockApi({
      'GET /bookings/b-pending': () => Promise.resolve({ success: true, data: current }),
      'PATCH /bookings/b-pending/cancel': (body) => {
        current = { ...pending, status: 'CANCELLED', cancellationReason: body.reason };
        return Promise.resolve({ success: true, data: current });
      },
    });
    const user = userEvent.setup();
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-pending', path: '/customer/bookings/:id' });
    await user.click(await screen.findByRole('button', { name: /cancel booking/i }));
    const dialog = screen.getByRole('dialog', { name: /cancel booking/i });
    await user.selectOptions(within(dialog).getByLabelText(/reason for cancellation/i), 'Found another provider');
    await user.click(within(dialog).getByRole('button', { name: /cancel booking/i }));

    await waitFor(() =>
      expect(apiMock().patch).toHaveBeenCalledWith('/bookings/b-pending/cancel', { reason: 'Found another provider' })
    );
    expect(await screen.findByText(/reason: found another provider/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  });

  it('requires a custom reason when "Other" is chosen and shows backend errors', async () => {
    mockApi({
      'GET /bookings/b-pending': pending,
      'PATCH /bookings/b-pending/cancel': () => fail('Booking is already COMPLETED', 400),
    });
    const user = userEvent.setup();
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-pending', path: '/customer/bookings/:id' });
    await user.click(await screen.findByRole('button', { name: /cancel booking/i }));
    const dialog = screen.getByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(/reason for cancellation/i), 'Other');
    await user.click(within(dialog).getByRole('button', { name: /cancel booking/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/at least 5 characters/i);
    expect(apiMock().patch).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(/tell us more/i), 'Moving house next week');
    await user.click(within(dialog).getByRole('button', { name: /cancel booking/i }));
    expect(await within(dialog).findByText('Booking is already COMPLETED')).toBeInTheDocument();
  });

  it('hides cancellation for in-progress bookings', async () => {
    mockApi({ 'GET /bookings/b-progress': bookings[1] });
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-progress', path: '/customer/bookings/:id' });
    await screen.findByRole('heading', { level: 1, name: 'Tap Leakage Fix' });
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  });

  it('shows provider contact only once accepted', async () => {
    const accepted = { ...pending, status: 'ACCEPTED', provider: { ...providerA, user: { phone: '9000000001', email: 'ravi@x.com' } } };
    mockApi({ 'GET /bookings/b-pending': accepted });
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-pending', path: '/customer/bookings/:id' });
    expect(await screen.findByRole('link', { name: '9000000001' })).toHaveAttribute('href', 'tel:9000000001');
  });

  it('shows an access-denied message for a 403', async () => {
    mockApi({ 'GET /bookings/other': () => fail('Access denied', 403) });
    renderPage(<BookingDetails />, { route: '/customer/bookings/other', path: '/customer/bookings/:id' });
    expect(await screen.findByText(/you do not have access/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
