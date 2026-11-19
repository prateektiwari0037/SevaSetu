import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderApp, currentLocation, customerUser } from './utils';
import { bookings, categories, services } from './fixtures';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const baseRoutes = {
  'GET /bookings': bookings,
  'GET /categories': categories,
  'GET /services': services,
  'GET /providers/nearby': [],
  'GET /users/addresses': [],
  'GET /reviews/my-reviews': [],
  'GET /complaints': [],
  'GET /subscription-plans': [],
  'GET /subscriptions': [],
  'GET /users/me': customerUser,
};

describe('protected customer routes', () => {
  beforeEach(() => mockApi(baseRoutes));

  it('redirects unauthenticated visitors to login with a return path', async () => {
    renderApp('/customer/bookings?tab=completed');
    await waitFor(() => expect(currentLocation()).toBe('/login?redirect=%2Fcustomer%2Fbookings%3Ftab%3Dcompleted'));
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('shows Forbidden to a logged-in provider', async () => {
    const provider = { ...customerUser, role: 'PROVIDER', providerProfile: { fullName: 'P' } };
    mockApi({ ...baseRoutes, 'GET /auth/me': { user: provider } });
    loginAs(provider);
    renderApp('/customer/dashboard');
    expect(await screen.findByText(/403/i)).toBeInTheDocument();
  });

  it('renders the dashboard for a customer with a welcome message', async () => {
    loginAs();
    renderApp('/customer/dashboard');
    expect(await screen.findByRole('heading', { name: /welcome back, asha verma/i })).toBeInTheDocument();
  });

  it('redirects the legacy /customer/book-service link to the booking flow', async () => {
    loginAs();
    mockApi({ ...baseRoutes, 'GET /services/s-fan': { ...services[0], providerServices: [] } });
    renderApp('/customer/book-service?serviceId=s-fan&providerId=p1');
    await waitFor(() => expect(currentLocation()).toBe('/customer/book/s-fan?providerId=p1'));
  });
});

describe('customer navigation', () => {
  beforeEach(() => {
    mockApi(baseRoutes);
    loginAs();
  });

  const expected = [
    ['Browse Services', '/customer/services', /browse services/i],
    ['Find Providers', '/customer/providers', /find providers/i],
    ['My Bookings', '/customer/bookings', /my bookings/i],
    ['Favorites', '/customer/favorites', /favorite providers/i],
    ['My Reviews', '/customer/reviews', /my reviews/i],
    ['Saved Addresses', '/customer/addresses', /saved addresses/i],
    ['Notifications', '/customer/notifications', /notifications/i],
    ['Complaints', '/customer/complaints', /complaints/i],
    ['Subscriptions', '/customer/subscriptions', /subscriptions/i],
    ['Profile', '/customer/profile', /my profile/i],
    ['Settings', '/customer/settings', /account settings/i],
  ];

  it.each(expected)('sidebar link "%s" opens %s', async (label, path, heading) => {
    const user = userEvent.setup();
    renderApp('/customer/dashboard');
    const nav = await screen.findByRole('navigation', { name: /dashboard navigation/i });
    await user.click(within(nav).getByRole('link', { name: new RegExp(`^${label}`) }));
    await waitFor(() => expect(currentLocation()).toBe(path));
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: new RegExp(`^${label}`) })).toHaveAttribute('aria-current', 'page');
  });

  it('switches sidebar labels to Hindi', async () => {
    const user = userEvent.setup();
    renderApp('/customer/dashboard');
    await screen.findByRole('navigation', { name: /dashboard navigation/i });
    await user.click(screen.getByRole('button', { name: /language: english/i }));
    expect(await screen.findByRole('link', { name: /मेरी बुकिंग/ })).toBeInTheDocument();
  });
});
