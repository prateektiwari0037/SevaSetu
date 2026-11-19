import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, loginAs, renderPage, currentLocation, apiMock, fail } from './utils';
import { categories, services, providerA, providerB, serviceDetail } from './fixtures';
import CustomerServices from '../pages/customer/CustomerServices';
import CustomerServiceDetail from '../pages/customer/CustomerServiceDetail';
import CustomerProviders from '../pages/customer/CustomerProviders';
import CustomerProviderDetail from '../pages/customer/CustomerProviderDetail';
import { FavoritesProvider } from '../context/FavoritesContext';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const servicesCalls = () => apiMock().get.mock.calls.filter(([url]) => url === '/services');

describe('service discovery', () => {
  beforeEach(() => {
    loginAs();
    mockApi({
      'GET /categories': categories,
      'GET /services': (cfg) => {
        const p = cfg?.params || {};
        let list = services;
        if (p.categoryId) list = list.filter((s) => s.categoryId === p.categoryId);
        if (p.search) list = list.filter((s) => s.name.toLowerCase().includes(p.search.toLowerCase()));
        return Promise.resolve({ success: true, data: list });
      },
      'GET /providers/nearby': [providerA, providerB],
    });
  });

  it('shows a loading skeleton, then service cards with fixed prices', async () => {
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    expect(screen.getByRole('status')).toHaveTextContent(/loading services/i);
    expect(await screen.findByRole('heading', { name: 'Ceiling Fan Repair' })).toBeInTheDocument();
    expect(screen.getByText('₹299')).toBeInTheDocument();
    expect(screen.getByText(/2 services found/i)).toBeInTheDocument();
  });

  it('sends search and price filters to GET /services and stores them in the URL', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    await screen.findByRole('heading', { name: 'Ceiling Fan Repair' });

    await user.type(screen.getByRole('searchbox'), 'tap');
    await user.type(screen.getByLabelText(/max price/i), '250');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Ceiling Fan Repair' })).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Tap Leakage Fix' })).toBeInTheDocument();
    expect(servicesCalls().at(-1)[1].params).toEqual({ search: 'tap', maxPrice: '250' });
    expect(currentLocation()).toContain('search=tap');
  });

  it('filters by category via the quick chips', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    await screen.findByRole('heading', { name: 'Ceiling Fan Repair' });
    await user.click(screen.getByRole('button', { name: 'Plumber', pressed: false }));
    await waitFor(() => expect(servicesCalls().at(-1)[1].params).toEqual({ categoryId: 'c-plumb' }));
    expect(await screen.findByRole('heading', { name: 'Tap Leakage Fix' })).toBeInTheDocument();
  });

  it('applies city / PIN / rating / verified filters through eligible providers', async () => {
    renderPage(<CustomerServices />, {
      route: '/customer/services?city=pune&pincode=411038&minRating=4&verified=1',
      path: '/customer/services',
    });
    expect(await screen.findByRole('heading', { name: 'Tap Leakage Fix' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ceiling Fan Repair' })).not.toBeInTheDocument();
    const providerCall = apiMock().get.mock.calls.find(([url]) => url === '/providers/nearby');
    expect(providerCall[1].params).toEqual({ pincode: '411038', minRating: '4' });
  });

  it('rejects an invalid price range', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    await screen.findByRole('heading', { name: 'Ceiling Fan Repair' });
    await user.type(screen.getByLabelText(/min price/i), '500');
    await user.type(screen.getByLabelText(/max price/i), '100');
    await user.click(screen.getByRole('button', { name: /^apply$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/min price cannot be greater/i);
  });

  it('paginates results (9 per page)', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...services[0], id: `s${i}`, name: `Service ${i + 1}` }));
    mockApi({ 'GET /categories': [], 'GET /services': many });
    const user = userEvent.setup();
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    expect(await screen.findByRole('heading', { name: 'Service 1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Service 10' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByRole('heading', { name: 'Service 10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows an empty state and an error state with retry', async () => {
    mockApi({ 'GET /categories': [], 'GET /services': [] });
    const { unmount } = renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    expect(await screen.findByText(/no services match your filters/i)).toBeInTheDocument();
    unmount();

    let calls = 0;
    mockApi({
      'GET /categories': [],
      'GET /services': () => (++calls === 1 ? fail('Server down', 500) : Promise.resolve({ success: true, data: services })),
    });
    const user = userEvent.setup();
    renderPage(<CustomerServices />, { route: '/customer/services', path: '/customer/services' });
    expect(await screen.findByText('Server down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByRole('heading', { name: 'Ceiling Fan Repair' })).toBeInTheDocument();
  });

  it('service detail lists eligible providers with their fixed price and a booking link', async () => {
    mockApi({ 'GET /services/s-fan': serviceDetail });
    renderPage(
      <FavoritesProvider>
        <CustomerServiceDetail />
      </FavoritesProvider>,
      { route: '/customer/services/s-fan', path: '/customer/services/:id' }
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Ceiling Fan Repair' })).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(within(card).getByText('Sharma Electricals')).toBeInTheDocument();
    expect(within(card).getByText('₹349')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /book ceiling fan repair with sharma electricals/i })).toHaveAttribute(
      'href',
      '/customer/book/s-fan?providerId=p-ravi'
    );
  });

  it('service detail shows not-found for a 404', async () => {
    mockApi({ 'GET /services/missing': () => fail('Service not found', 404) });
    renderPage(<CustomerServiceDetail />, { route: '/customer/services/missing', path: '/customer/services/:id' });
    expect(await screen.findByText('Service not found', { selector: 'p.font-semibold' })).toBeInTheDocument();
  });
});

describe('provider discovery', () => {
  beforeEach(() => {
    loginAs();
    mockApi({ 'GET /categories': categories, 'GET /providers/nearby': [providerA, providerB] });
  });

  it('lists providers with rating, experience, area, verification and price', async () => {
    renderPage(
      <FavoritesProvider>
        <CustomerProviders />
      </FavoritesProvider>,
      { route: '/customer/providers', path: '/customer/providers' }
    );
    const card = (await screen.findByRole('link', { name: 'Sharma Electricals' })).closest('article');
    expect(within(card).getByLabelText('Rated 4.7 out of 5')).toBeInTheDocument();
    expect(within(card).getByText('Verified')).toBeInTheDocument();
    expect(within(card).getByText(/6 yrs experience/)).toBeInTheDocument();
    expect(within(card).getByText(/Andheri, Mumbai · PIN 400053/)).toBeInTheDocument();
    expect(within(card).getByText('₹349')).toBeInTheDocument();
    expect(within(card).getByText(/Mon, Tue, Wed, Thu, Fri, Sat/)).toBeInTheDocument();
  });

  it('passes server filters and applies city client-side', async () => {
    const user = userEvent.setup();
    renderPage(<CustomerProviders />, { route: '/customer/providers', path: '/customer/providers' });
    await screen.findByRole('link', { name: 'Sharma Electricals' });
    await user.type(screen.getByLabelText(/^city$/i), 'pune');
    await user.click(screen.getByLabelText(/available now/i));
    await user.click(screen.getByRole('button', { name: /^apply$/i }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Sharma Electricals' })).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Meera Patil' })).toBeInTheDocument();
    const last = apiMock().get.mock.calls.filter(([u]) => u === '/providers/nearby').at(-1);
    expect(last[1].params).toEqual({ isAvailable: 'true' });
  });

  it('provider detail shows services with book links and weekly hours', async () => {
    mockApi({ 'GET /providers/p-ravi': providerA });
    renderPage(<CustomerProviderDetail />, { route: '/customer/providers/p-ravi', path: '/customer/providers/:id' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Sharma Electricals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book ceiling fan repair with sharma electricals/i })).toHaveAttribute(
      'href',
      '/customer/book/s-fan?providerId=p-ravi'
    );
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });

  it('disables booking for an unverified provider', async () => {
    mockApi({ 'GET /providers/p-x': { ...providerA, id: 'p-x', verificationStatus: 'PENDING' } });
    renderPage(<CustomerProviderDetail />, { route: '/customer/providers/p-x', path: '/customer/providers/:id' });
    expect(await screen.findByText(/not verified yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book now/i })).toBeDisabled();
  });
});
