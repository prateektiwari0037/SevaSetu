/**
 * Test harness for customer pages.
 *
 * Tests mock only the shared axios client (`services/api`). Every page therefore
 * exercises the real customerApi layer, so assertions on `api.get/post/...`
 * calls verify the exact endpoint + payload contract sent to the backend.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import api from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ToastProvider } from '../context/ToastContext';
import App from '../App';

export const ok = (data, message = 'OK') => Promise.resolve({ success: true, message, data });
export const fail = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return Promise.reject(err);
};

export const customerUser = {
  id: 'u1',
  email: 'asha@example.com',
  role: 'CUSTOMER',
  mobile: '9876543210',
  customerProfile: { fullName: 'Asha Verma' },
};

/**
 * Route table: { 'GET /bookings': data | (config, url) => promise }.
 * Paths are matched exactly first, then by prefix pattern with ":param".
 */
export function mockApi(routes = {}) {
  const defaults = {
    'GET /auth/me': { user: customerUser },
    'GET /notifications': { notifications: [], unreadCount: 0 },
    'GET /favorites': [],
  };
  const table = { ...defaults, ...routes };
  const match = (method, url) => {
    const path = url.split('?')[0];
    const key = `${method} ${path}`;
    if (key in table) return table[key];
    for (const [pattern, value] of Object.entries(table)) {
      const [m, p] = pattern.split(' ');
      if (m !== method || !p.includes(':')) continue;
      const re = new RegExp(`^${p.replace(/:[^/]+/g, '[^/]+')}$`);
      if (re.test(path)) return value;
    }
    return undefined;
  };
  const handler = (method) => (url, bodyOrConfig, maybeConfig) => {
    const value = match(method, url);
    if (value === undefined) return fail(`Unmocked ${method} ${url}`, 404);
    if (typeof value === 'function') return value(bodyOrConfig, url, maybeConfig);
    if (value instanceof Error) return Promise.reject(value);
    return ok(value);
  };
  api.get.mockImplementation(handler('GET'));
  api.post.mockImplementation(handler('POST'));
  api.patch.mockImplementation(handler('PATCH'));
  api.delete.mockImplementation(handler('DELETE'));
}

export function loginAs(user = customerUser) {
  localStorage.setItem('sevasetu_token', 'test-token');
  localStorage.setItem('sevasetu_user', JSON.stringify(user));
}

function LocationProbe() {
  const loc = useLocation();
  return (
    <div data-testid="location" hidden>
      {loc.pathname}
      {loc.search}
    </div>
  );
}

/** Render the full App (real routes, guards, layout) at `route`. */
export function renderApp(route = '/customer/dashboard') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <App />
              <LocationProbe />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

/** Render a single element inside providers + a route definition (for :params). */
export function renderPage(element, { route = '/', path = '/', extraRoutes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <Routes>
                <Route path={path} element={element} />
                {extraRoutes.map(([p, el]) => (
                  <Route key={p} path={p} element={el} />
                ))}
              </Routes>
              <LocationProbe />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

export const currentLocation = () => screen.getByTestId('location').textContent;

export const apiMock = () => vi.mocked(api);
