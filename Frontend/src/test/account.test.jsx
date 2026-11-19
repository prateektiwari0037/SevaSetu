import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderPage, apiMock, fail, customerUser } from './utils';
import { addresses, bookings } from './fixtures';
import Addresses from '../pages/customer/Addresses';
import CustomerNotifications from '../pages/customer/CustomerNotifications';
import CustomerComplaints from '../pages/customer/CustomerComplaints';
import CustomerSubscriptions from '../pages/customer/CustomerSubscriptions';
import CustomerProfile from '../pages/customer/CustomerProfile';
import CustomerSettings from '../pages/customer/CustomerSettings';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('address management', () => {
  beforeEach(() => loginAs());

  it('lists addresses with default badge', async () => {
    mockApi({ 'GET /users/addresses': addresses });
    renderPage(<Addresses />, { route: '/customer/addresses', path: '/customer/addresses' });
    expect(await screen.findByText(/Flat 402, Sunshine Heights, MG Road/)).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set work as default/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /set home as default/i })).not.toBeInTheDocument();
  });

  it('validates and creates a new address with all fields', async () => {
    mockApi({ 'GET /users/addresses': [], 'POST /users/addresses': { id: 'a1' } });
    const user = userEvent.setup();
    renderPage(<Addresses />, { route: '/customer/addresses', path: '/customer/addresses' });
    await user.click((await screen.findAllByRole('button', { name: /add new address/i }))[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /save address/i }));
    expect(within(dialog).getByText('House / building is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a valid 6-digit PIN code')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/house \/ building/i)).toHaveAttribute('aria-invalid', 'true');
    expect(apiMock().post).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(/house \/ building/i), 'B-12, Lotus Apts');
    await user.type(within(dialog).getByLabelText(/^street/i), 'SV Road');
    await user.type(within(dialog).getByLabelText(/landmark/i), 'Near Station');
    await user.type(within(dialog).getByLabelText(/^area/i), 'Goregaon');
    await user.type(within(dialog).getByLabelText(/^city/i), 'Mumbai');
    await user.selectOptions(within(dialog).getByLabelText(/^state/i), 'Maharashtra');
    await user.type(within(dialog).getByLabelText(/pin code/i), '40a0062');
    await user.click(within(dialog).getByRole('button', { name: /save address/i }));

    await waitFor(() =>
      expect(apiMock().post).toHaveBeenCalledWith('/users/addresses', {
        label: 'Home',
        addressLine: 'B-12, Lotus Apts | SV Road',
        landmark: 'Near Station',
        area: 'Goregaon',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400062',
        isDefault: false,
      })
    );
  });

  it('edits an address, splitting house and street back into fields', async () => {
    mockApi({ 'GET /users/addresses': addresses, 'PATCH /users/addresses/a-home': addresses[0] });
    const user = userEvent.setup();
    renderPage(<Addresses />, { route: '/customer/addresses', path: '/customer/addresses' });
    await user.click(await screen.findByRole('button', { name: /edit home/i }));
    const dialog = screen.getByRole('dialog', { name: /edit address/i });
    expect(within(dialog).getByLabelText(/house \/ building/i)).toHaveValue('Flat 402, Sunshine Heights');
    expect(within(dialog).getByLabelText(/^street/i)).toHaveValue('MG Road');
    await user.clear(within(dialog).getByLabelText(/^street/i));
    await user.type(within(dialog).getByLabelText(/^street/i), 'Link Road');
    await user.click(within(dialog).getByRole('button', { name: /save address/i }));
    await waitFor(() =>
      expect(apiMock().patch).toHaveBeenCalledWith(
        '/users/addresses/a-home',
        expect.objectContaining({ addressLine: 'Flat 402, Sunshine Heights | Link Road', isDefault: true })
      )
    );
  });

  it('sets default and deletes after confirmation', async () => {
    mockApi({
      'GET /users/addresses': addresses,
      'PATCH /users/addresses/a-work': {},
      'DELETE /users/addresses/a-work': {},
    });
    const user = userEvent.setup();
    renderPage(<Addresses />, { route: '/customer/addresses', path: '/customer/addresses' });
    await user.click(await screen.findByRole('button', { name: /set work as default/i }));
    await waitFor(() => expect(apiMock().patch).toHaveBeenCalledWith('/users/addresses/a-work', { isDefault: true }));

    await user.click(screen.getByRole('button', { name: /delete work/i }));
    const dialog = screen.getByRole('dialog', { name: /delete address/i });
    expect(apiMock().delete).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiMock().delete).toHaveBeenCalledWith('/users/addresses/a-work'));
  });
});

describe('notifications', () => {
  const list = [
    { id: 'n1', title: 'Booking Accepted', message: 'Ravi accepted #BK-1', type: 'BOOKING', link: '/customer/bookings/b1', isRead: false, createdAt: '2026-11-18T10:00:00Z' },
    { id: 'n2', title: 'Welcome', message: 'Hello', type: 'SYSTEM', isRead: true, createdAt: '2026-11-01T10:00:00Z' },
  ];

  beforeEach(() => {
    loginAs();
    mockApi({
      'GET /notifications': { notifications: list, unreadCount: 1 },
      'PATCH /notifications/n1/read': {},
      'PATCH /notifications/read-all': {},
      'DELETE /notifications/n2': {},
    });
  });

  it('shows the inbox with unread count and booking links', async () => {
    renderPage(<CustomerNotifications />, { route: '/customer/notifications', path: '/customer/notifications' });
    expect(await screen.findByText('Booking Accepted')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view booking details/i })).toHaveAttribute('href', '/customer/bookings/b1');
  });

  it('marks one as read, marks all as read, and deletes', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerNotifications />, { route: '/customer/notifications', path: '/customer/notifications' });
    await user.click(await screen.findByRole('button', { name: /mark "booking accepted" as read/i }));
    await waitFor(() => expect(apiMock().patch).toHaveBeenCalledWith('/notifications/n1/read'));
    expect(await screen.findByText(/you are all caught up/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete "welcome"/i }));
    await waitFor(() => expect(apiMock().delete).toHaveBeenCalledWith('/notifications/n2'));
    await waitFor(() => expect(screen.queryByText('Welcome')).not.toBeInTheDocument());
  });

  it('filters to booking notifications', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerNotifications />, { route: '/customer/notifications', path: '/customer/notifications' });
    await screen.findByText('Booking Accepted');
    await user.click(screen.getByRole('tab', { name: /my bookings/i }));
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^all/i }));
    await user.click(screen.getByRole('button', { name: /mark all as read/i }));
    await waitFor(() => expect(apiMock().patch).toHaveBeenCalledWith('/notifications/read-all'));
  });
});

describe('complaints', () => {
  beforeEach(() => loginAs());

  it('validates and submits a complaint linked to a booking (preset from ?bookingId)', async () => {
    mockApi({
      'GET /complaints': [],
      'GET /bookings': bookings,
      'POST /complaints': { id: 'c1', ticketNumber: 'CMP-1' },
    });
    const user = userEvent.setup();
    renderPage(<CustomerComplaints />, { route: '/customer/complaints?bookingId=b-done', path: '/customer/complaints' });
    const dialog = await screen.findByRole('dialog', { name: /new complaint/i });
    await waitFor(() => expect(within(dialog).getByLabelText(/related booking/i)).toHaveValue('b-done'));
    await user.click(within(dialog).getByRole('button', { name: /submit complaint/i }));
    expect(within(dialog).getByText('Select a category', { selector: '[id$="-error"]' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^category/i)).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByText(/at least 20 characters/i)).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText(/^category/i), 'NO_SHOW');
    await user.type(within(dialog).getByLabelText(/^subject/i), 'Provider never came');
    await user.type(within(dialog).getByLabelText(/^description/i), 'Waited all afternoon and nobody arrived or called.');
    await user.click(within(dialog).getByRole('button', { name: /submit complaint/i }));
    await waitFor(() =>
      expect(apiMock().post).toHaveBeenCalledWith('/complaints', {
        category: 'NO_SHOW',
        subject: 'Provider never came',
        title: 'Provider never came',
        description: 'Waited all afternoon and nobody arrived or called.',
        bookingId: 'b-done',
      })
    );
  });

  it('shows history with status and admin responses', async () => {
    mockApi({
      'GET /complaints': [{ id: 'c1', ticketNumber: 'CMP-9', subject: 'Late arrival', status: 'UNDER_REVIEW', description: 'Came 2 hours late', createdAt: '2026-11-10', _count: { messages: 2 } }],
      'GET /bookings': [],
      'GET /complaints/c1': {
        id: 'c1',
        ticketNumber: 'CMP-9',
        status: 'UNDER_REVIEW',
        messages: [
          { id: 'm1', senderUserId: 'u1', senderRole: 'CUSTOMER', message: 'Came 2 hours late' },
          { id: 'm2', senderUserId: 'admin', senderRole: 'ADMIN', message: 'We have contacted the provider.' },
        ],
      },
    });
    const user = userEvent.setup();
    renderPage(<CustomerComplaints />, { route: '/customer/complaints', path: '/customer/complaints' });
    expect(await screen.findByText('Late arrival')).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view \(2\)/i }));
    expect(await screen.findByText('We have contacted the provider.')).toBeInTheDocument();
    expect(screen.getByText(/sevasetu support/i)).toBeInTheDocument();
  });
});

describe('subscriptions', () => {
  const plans = [
    { id: 'pl1', name: 'AC Care Annual', category: 'AC', price: 1999, durationDays: 365, serviceLimit: 3, features: ['Priority support'] },
  ];

  beforeEach(() => loginAs());

  it('shows plans, activates one, and displays active usage and expiry', async () => {
    let mine = [];
    mockApi({
      'GET /subscription-plans': plans,
      'GET /subscriptions': () => Promise.resolve({ success: true, data: mine }),
      'POST /subscriptions': () => {
        mine = [{ id: 's1', planId: 'pl1', plan: plans[0], status: 'ACTIVE', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), servicesRemaining: 2 }];
        return Promise.resolve({ success: true, data: mine[0] });
      },
    });
    const user = userEvent.setup();
    renderPage(<CustomerSubscriptions />, { route: '/customer/subscriptions', path: '/customer/subscriptions' });
    expect(await screen.findByText('Priority support')).toBeInTheDocument();
    expect(screen.getByText(/you don't have an active subscription/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /activate plan/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^activate$/i }));
    await waitFor(() => expect(apiMock().post).toHaveBeenCalledWith('/subscriptions', { planId: 'pl1' }));
    expect(await screen.findByText(/1 of 3 visits used · 2 left/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /service visits used/i })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('button', { name: /current plan/i })).toBeDisabled();
  });
});

describe('profile and settings', () => {
  beforeEach(() => loginAs());

  it('validates and saves profile edits through PATCH /users/me', async () => {
    mockApi({
      'GET /users/me': { ...customerUser, customerProfile: { fullName: 'Asha Verma', emergencyContact: '' } },
      'PATCH /users/me': (body) => Promise.resolve({ success: true, data: { ...customerUser, customerProfile: { fullName: body.fullName } } }),
    });
    const user = userEvent.setup();
    renderPage(<CustomerProfile />, { route: '/customer/profile', path: '/customer/profile' });
    const name = await screen.findByLabelText(/full name/i);
    await waitFor(() => expect(name).toHaveValue('Asha Verma'));
    expect(screen.getByLabelText(/^email/i)).toBeDisabled();

    await user.clear(screen.getByLabelText(/mobile number/i));
    await user.type(screen.getByLabelText(/mobile number/i), '12345');
    await user.type(screen.getByLabelText(/avatar image url/i), 'not-a-url');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText(/valid 10-digit indian mobile/i)).toBeInTheDocument();
    expect(screen.getByText(/starting with http/i)).toBeInTheDocument();
    expect(apiMock().patch).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/mobile number/i));
    await user.type(screen.getByLabelText(/mobile number/i), '9123456780');
    await user.clear(screen.getByLabelText(/avatar image url/i));
    await user.type(screen.getByLabelText(/avatar image url/i), 'https://img.example.com/a.png');
    await user.clear(name);
    await user.type(name, 'Asha V. Verma');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(apiMock().patch).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({ fullName: 'Asha V. Verma', mobile: '9123456780', avatarUrl: 'https://img.example.com/a.png' })
      )
    );
    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
  });

  it('validates password change and sends currentPassword to the auth API', async () => {
    mockApi({ 'POST /auth/change-password': () => fail('Current password is incorrect', 400) });
    const user = userEvent.setup();
    renderPage(<CustomerSettings />, { route: '/customer/settings', path: '/customer/settings' });
    await user.type(screen.getByLabelText(/current password/i), 'OldPass@123');
    await user.type(screen.getByLabelText(/^new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'different');
    await user.click(screen.getByRole('button', { name: /^change password$/i }));
    expect(screen.getByText(/at least 8 characters/i, { selector: '[id$="-error"]' })).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), 'NewPass@123');
    await user.clear(screen.getByLabelText(/confirm new password/i));
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass@123');
    await user.click(screen.getByRole('button', { name: /^change password$/i }));
    await waitFor(() =>
      expect(apiMock().post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      })
    );
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
  });

  it('switches language to Hindi', async () => {
    mockApi({ 'PATCH /users/me': {} });
    const user = userEvent.setup();
    renderPage(<CustomerSettings />, { route: '/customer/settings', path: '/customer/settings' });
    await user.click(screen.getByRole('radio', { name: /hindi/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'खाता सेटिंग्स' })).toBeInTheDocument();
    expect(apiMock().patch).toHaveBeenCalledWith('/users/me', { preferredLanguage: 'hi' });
  });
});
