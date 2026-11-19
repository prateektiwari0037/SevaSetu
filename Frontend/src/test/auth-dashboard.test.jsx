import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderApp, currentLocation, apiMock, fail, customerUser } from './utils';
import { bookings, categories, services } from './fixtures';
import { validateRegistration } from '../pages/public/Register';
import { rankCategories, recommendServices } from '../pages/customer/CustomerDashboard';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('registration and login', () => {
  it('validates registration fields client-side', () => {
    const base = { fullName: 'Asha', email: 'a@b.co', phone: '9876543210', password: 'Secret@123', confirmPassword: 'Secret@123' };
    expect(validateRegistration(base)).toBe('');
    expect(validateRegistration({ ...base, phone: '12345' })).toMatch(/mobile/);
    expect(validateRegistration({ ...base, password: 'short', confirmPassword: 'short' })).toMatch(/8 characters/);
    expect(validateRegistration({ ...base, confirmPassword: 'nope' })).toMatch(/do not match/);
    expect(validateRegistration({ ...base, email: 'bad' })).toMatch(/email/);
  });

  it('registers a customer and lands on the customer dashboard', async () => {
    mockApi({
      'POST /auth/register': { user: customerUser, token: 'new-token' },
      'GET /bookings': [],
      'GET /categories': categories,
      'GET /services': services,
    });
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(await screen.findByLabelText(/full legal name/i), 'Asha Verma');
    await user.type(screen.getByLabelText(/email address/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/mobile phone/i), '9876543210');
    await user.type(screen.getByLabelText(/create password/i), 'Secret@123');
    await user.type(screen.getByLabelText(/^confirm password/i), 'Secret@12');
    await user.click(screen.getByRole('button', { name: /register as customer/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
    expect(apiMock().post).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^confirm password/i), '3');
    await user.click(screen.getByRole('button', { name: /register as customer/i }));
    await waitFor(() => expect(currentLocation()).toBe('/customer/dashboard'));
    expect(apiMock().post).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ role: 'CUSTOMER', email: 'asha@example.com', phone: '9876543210', password: 'Secret@123', confirmPassword: 'Secret@123' })
    );
    expect(localStorage.getItem('sevasetu_token')).toBe('new-token');
  });

  it('shows duplicate-account errors from the backend', async () => {
    mockApi({ 'POST /auth/register': () => fail('An account with this email address already exists', 409) });
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(await screen.findByLabelText(/full legal name/i), 'Asha Verma');
    await user.type(screen.getByLabelText(/email address/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/mobile phone/i), '9876543210');
    await user.type(screen.getByLabelText(/create password/i), 'Secret@123');
    await user.type(screen.getByLabelText(/^confirm password/i), 'Secret@123');
    await user.click(screen.getByRole('button', { name: /register as customer/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
  });

  it('logs in and returns to the originally requested customer page', async () => {
    mockApi({
      'POST /auth/login': { user: customerUser, token: 't' },
      'GET /bookings': bookings,
    });
    const user = userEvent.setup();
    renderApp('/customer/bookings');
    await waitFor(() => expect(currentLocation()).toMatch(/^\/login\?redirect=/));
    await user.type(screen.getByLabelText(/email address/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Secret@123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(currentLocation()).toBe('/customer/bookings'));
    expect(await screen.findByRole('heading', { level: 1, name: /my bookings/i })).toBeInTheDocument();
  });
});

describe('customer dashboard', () => {
  beforeEach(() => loginAs());

  it('shows booking stats, upcoming bookings, notifications, categories and recommendations', async () => {
    mockApi({
      'GET /bookings': bookings,
      'GET /categories': categories,
      'GET /services': services,
      'GET /notifications': {
        notifications: [{ id: 'n1', title: 'Booking Accepted', message: 'Ravi accepted', isRead: false, createdAt: '2026-11-18' }],
        unreadCount: 1,
      },
    });
    renderApp('/customer/dashboard');
    expect(await screen.findByRole('link', { name: /1 upcoming bookings/i })).toHaveAttribute('href', '/customer/bookings?tab=upcoming');
    expect(screen.getByRole('link', { name: /1 active bookings/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1 completed bookings/i })).toBeInTheDocument();
    expect(await screen.findByText('Booking Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /electrician 1 service/i })).toHaveAttribute('href', '/customer/services?category=c-elec');
    expect(screen.getByRole('heading', { name: /recommended services/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /book a service/i })[0]).toHaveAttribute('href', '/customer/book');
  });

  it('ranks categories and recommends services offered by the most providers', () => {
    expect(rankCategories(categories, [...services, { ...services[1], id: 'x' }]).map((c) => c.name)).toEqual(['Plumber', 'Electrician']);
    expect(recommendServices(services, 1).map((s) => s.id)).toEqual(['s-fan']);
  });
});

describe('api client token refresh', () => {
  it('retries a 401 once with a refreshed token', async () => {
    vi.resetModules();
    vi.doUnmock('../services/api');
    const axios = (await import('axios')).default;
    const realApi = (await import('../services/api')).default;
    localStorage.setItem('sevasetu_token', 'expired');

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { data: { token: 'fresh' } } });
    let calls = 0;
    realApi.defaults.adapter = async (config) => {
      calls += 1;
      if (config.headers.Authorization === 'Bearer expired') {
        const err = new Error('Unauthorized');
        err.config = config;
        err.response = { status: 401, data: { message: 'Token expired' } };
        throw err;
      }
      return { data: { success: true, data: { ok: true } }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const res = await realApi.get('/bookings');
    expect(res.data).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/refresh', {}, { withCredentials: true });
    expect(localStorage.getItem('sevasetu_token')).toBe('fresh');
    expect(calls).toBe(2);
    postSpy.mockRestore();
  });
});
