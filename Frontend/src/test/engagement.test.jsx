import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderPage, apiMock, fail } from './utils';
import { bookings, providerA, providerB } from './fixtures';
import Favorites from '../pages/customer/Favorites';
import CustomerProviders from '../pages/customer/CustomerProviders';
import CustomerReviews from '../pages/customer/CustomerReviews';
import BookingDetails from '../pages/customer/BookingDetails';
import { FavoritesProvider } from '../context/FavoritesContext';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const withFavorites = (el) => <FavoritesProvider>{el}</FavoritesProvider>;

describe('favorites', () => {
  beforeEach(() => loginAs());

  it('lists saved providers returned by GET /favorites', async () => {
    mockApi({ 'GET /favorites': [{ providerId: 'p-ravi', provider: providerA }] });
    renderPage(withFavorites(<Favorites />), { route: '/customer/favorites', path: '/customer/favorites' });
    expect(await screen.findByRole('link', { name: 'Sharma Electricals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove sharma electricals from favorites/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the empty state', async () => {
    mockApi({ 'GET /favorites': [] });
    renderPage(withFavorites(<Favorites />), { route: '/customer/favorites', path: '/customer/favorites' });
    expect(await screen.findByText(/no favorite providers yet/i)).toBeInTheDocument();
  });

  it('explains when the favorites API is not available (404) and hides heart buttons', async () => {
    mockApi({ 'GET /favorites': () => fail('Not found', 404), 'GET /providers/nearby': [providerA], 'GET /categories': [] });
    renderPage(
      withFavorites(
        <>
          <Favorites />
          <CustomerProviders />
        </>
      ),
      { route: '/customer/favorites', path: '/customer/favorites' }
    );
    expect(await screen.findByText(/favorites are not available yet/i)).toBeInTheDocument();
    await screen.findByRole('link', { name: 'Sharma Electricals' });
    expect(screen.queryByRole('button', { name: /favorites/i })).not.toBeInTheDocument();
  });

  it('adds and removes a provider with POST /favorites and DELETE /favorites/:providerId', async () => {
    mockApi({
      'GET /favorites': [],
      'GET /providers/nearby': [providerA, providerB],
      'GET /categories': [],
      'POST /favorites': {},
      'DELETE /favorites/:id': {},
    });
    const user = userEvent.setup();
    renderPage(withFavorites(<CustomerProviders />), { route: '/customer/providers', path: '/customer/providers' });
    const add = await screen.findByRole('button', { name: /add sharma electricals to favorites/i });
    expect(add).toHaveAttribute('aria-pressed', 'false');
    await user.click(add);
    await waitFor(() => expect(apiMock().post).toHaveBeenCalledWith('/favorites', { providerId: 'p-ravi' }));
    const remove = await screen.findByRole('button', { name: /remove sharma electricals from favorites/i });
    expect(remove).toHaveAttribute('aria-pressed', 'true');
    await user.click(remove);
    await waitFor(() => expect(apiMock().delete).toHaveBeenCalledWith('/favorites/p-ravi'));
    expect(await screen.findByRole('button', { name: /add sharma electricals to favorites/i })).toBeInTheDocument();
  });

  it('rolls back the optimistic toggle when the request fails', async () => {
    mockApi({
      'GET /favorites': [],
      'GET /providers/nearby': [providerA],
      'GET /categories': [],
      'POST /favorites': () => fail('Server error', 500),
    });
    const user = userEvent.setup();
    renderPage(withFavorites(<CustomerProviders />), { route: '/customer/providers', path: '/customer/providers' });
    await user.click(await screen.findByRole('button', { name: /add sharma electricals to favorites/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: /add sharma electricals to favorites/i })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('reviews', () => {
  beforeEach(() => loginAs());

  it('lists completed bookings awaiting review and the review history', async () => {
    mockApi({
      'GET /bookings': [bookings[2]],
      'GET /reviews/my-reviews': [
        { id: 'r1', bookingId: 'b-old', rating: 4, comment: 'Quick and tidy work', provider: providerB, booking: { service: { name: 'Tap Leakage Fix' } }, createdAt: '2026-10-01' },
      ],
    });
    renderPage(<CustomerReviews />, { route: '/customer/reviews', path: '/customer/reviews' });
    expect(await screen.findByRole('link', { name: 'Ceiling Fan Repair' })).toBeInTheDocument();
    expect(screen.getByText('Quick and tidy work')).toBeInTheDocument();
    expect(apiMock().get).toHaveBeenCalledWith('/bookings', { params: { status: 'COMPLETED' } });
  });

  it('requires a rating, then submits POST /reviews', async () => {
    let reviews = [];
    mockApi({
      'GET /bookings': [bookings[2]],
      'GET /reviews/my-reviews': () => Promise.resolve({ success: true, data: reviews }),
      'POST /reviews': (body) => {
        reviews = [{ id: 'r-new', ...body, provider: providerA, booking: { service: { name: 'Ceiling Fan Repair' } } }];
        return Promise.resolve({ success: true, data: reviews[0] });
      },
    });
    const user = userEvent.setup();
    renderPage(<CustomerReviews />, { route: '/customer/reviews', path: '/customer/reviews' });
    await user.click(await screen.findByRole('button', { name: /leave a review/i }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /submit review/i }));
    expect(within(dialog).getByText(/please select a rating/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: /5 stars/i }));
    await user.type(within(dialog).getByLabelText(/your review/i), 'Excellent and on time');
    await user.click(within(dialog).getByRole('button', { name: /submit review/i }));
    await waitFor(() =>
      expect(apiMock().post).toHaveBeenCalledWith('/reviews', { bookingId: 'b-done', rating: 5, comment: 'Excellent and on time' })
    );
    expect(await screen.findByText('Excellent and on time')).toBeInTheDocument();
    expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument();
  });

  it('shows the duplicate-review message from the backend', async () => {
    mockApi({
      'GET /bookings/b-done': bookings[2],
      'POST /reviews': () => fail('You have already submitted a review for this booking', 400),
    });
    const user = userEvent.setup();
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-done', path: '/customer/bookings/:id' });
    await user.click(await screen.findByRole('button', { name: /leave a review/i }));
    await user.click(screen.getByRole('radio', { name: /4 stars/i }));
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    const alert = await screen.findByText(/already submitted a review/i);
    expect(alert.closest('[role]')).toHaveTextContent(/already reviewed/i);
  });

  it('validates the minimum review length', async () => {
    mockApi({ 'GET /bookings/b-done': bookings[2] });
    const user = userEvent.setup();
    renderPage(<BookingDetails />, { route: '/customer/bookings/b-done', path: '/customer/bookings/:id' });
    await user.click(await screen.findByRole('button', { name: /leave a review/i }));
    await user.click(screen.getByRole('radio', { name: /3 stars/i }));
    await user.type(screen.getByLabelText(/your review/i), 'ok');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(apiMock().post).not.toHaveBeenCalled();
  });
});
