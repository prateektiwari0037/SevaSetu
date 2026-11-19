/**
 * Customer module API layer.
 *
 * Every call goes through the shared axios client (`api`), which already unwraps
 * `{ success, message, data }` to the body and attaches the JWT. These helpers
 * return the `data` payload so pages don't have to know the envelope shape.
 *
 * Endpoint notes (see docs/CUSTOMER_MODULE_FRONTEND.md for the full gap list):
 *  - Provider listing uses the existing `GET /providers/nearby` (no `GET /providers`).
 *  - Customer bookings use `GET /bookings` (role-scoped) — no `/bookings/my`.
 *  - Cancellation uses `PATCH /bookings/:id/cancel` — not `POST`.
 *  - Reviews history uses `GET /reviews/my-reviews` — not `/reviews/my`.
 *  - Favorites and provider availability endpoints do NOT exist yet; the frontend
 *    calls the contract from the Member 2 brief and degrades gracefully on 404.
 */
import api from './api';

const payload = (res) => res?.data;
const asList = (res) => {
  const d = payload(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
};

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
  );

/** True when an error means "this endpoint is not implemented on the backend". */
export const isEndpointMissing = (err) => err?.status === 404 || err?.status === 405 || err?.status === 501;

// ---------- Catalog ----------
export const catalogApi = {
  categories: async () => asList(await api.get('/categories')),
  services: async (params) => asList(await api.get('/services', { params: clean(params) })),
  service: async (id) => payload(await api.get(`/services/${encodeURIComponent(id)}`)),
};

// ---------- Providers ----------
export const providerApi = {
  list: async (params) => asList(await api.get('/providers/nearby', { params: clean(params) })),
  get: async (id) => payload(await api.get(`/providers/${encodeURIComponent(id)}`)),
  reviews: async (id) => asList(await api.get(`/reviews/provider/${encodeURIComponent(id)}`)),
  /**
   * Expected contract (NOT implemented by backend yet):
   *   GET /providers/:id/availability?date=YYYY-MM-DD
   *   -> { data: { date, slots: [{ label: '10:00 AM - 12:00 PM', available: true }] } }
   * Returns null when the endpoint is missing so callers can fall back.
   */
  availability: async (id, date) => {
    try {
      const d = payload(
        await api.get(`/providers/${encodeURIComponent(id)}/availability`, { params: clean({ date }) })
      );
      const slots = Array.isArray(d) ? d : d?.slots;
      return Array.isArray(slots) ? slots : null;
    } catch (err) {
      if (isEndpointMissing(err)) return null;
      throw err;
    }
  },
};

// ---------- Bookings ----------
export const bookingApi = {
  create: async (body) => payload(await api.post('/bookings', body)),
  mine: async (params) => asList(await api.get('/bookings', { params: clean(params) })),
  get: async (id) => payload(await api.get(`/bookings/${encodeURIComponent(id)}`)),
  cancel: async (id, reason) =>
    payload(await api.patch(`/bookings/${encodeURIComponent(id)}/cancel`, { reason })),
};

// ---------- Favorites (expected contract, backend module missing) ----------
export const favoritesApi = {
  list: async () => asList(await api.get('/favorites')),
  add: async (providerId) => payload(await api.post('/favorites', { providerId })),
  remove: async (providerId) => payload(await api.delete(`/favorites/${encodeURIComponent(providerId)}`)),
};

// ---------- Reviews ----------
export const reviewApi = {
  submit: async ({ bookingId, rating, comment }) =>
    payload(await api.post('/reviews', { bookingId, rating, comment })),
  mine: async () => asList(await api.get('/reviews/my-reviews')),
};

// ---------- Addresses ----------
export const addressApi = {
  list: async () => asList(await api.get('/users/addresses')),
  create: async (body) => payload(await api.post('/users/addresses', body)),
  update: async (id, body) => payload(await api.patch(`/users/addresses/${encodeURIComponent(id)}`, body)),
  remove: async (id) => payload(await api.delete(`/users/addresses/${encodeURIComponent(id)}`)),
  // Backend has no dedicated /default route; PATCH with isDefault=true resets the others.
  setDefault: async (id) =>
    payload(await api.patch(`/users/addresses/${encodeURIComponent(id)}`, { isDefault: true })),
};

// ---------- Notifications ----------
export const notificationApi = {
  list: async () => {
    const d = payload(await api.get('/notifications'));
    return { notifications: d?.notifications || [], unreadCount: d?.unreadCount || 0 };
  },
  markRead: async (id) => payload(await api.patch(`/notifications/${encodeURIComponent(id)}/read`)),
  markAllRead: async () => payload(await api.patch('/notifications/read-all')),
  remove: async (id) => payload(await api.delete(`/notifications/${encodeURIComponent(id)}`)),
};

// ---------- Complaints ----------
export const complaintApi = {
  list: async () => asList(await api.get('/complaints')),
  get: async (id) => payload(await api.get(`/complaints/${encodeURIComponent(id)}`)),
  create: async ({ category, subject, description, bookingId }) =>
    payload(
      await api.post('/complaints', {
        category,
        subject,
        title: subject, // mongoose Complaint model names this field `title`
        description,
        ...(bookingId ? { bookingId } : {}),
      })
    ),
  reply: async (id, message) =>
    payload(await api.post(`/complaints/${encodeURIComponent(id)}/messages`, { message })),
};

// ---------- Subscriptions ----------
export const subscriptionApi = {
  plans: async () => asList(await api.get('/subscription-plans')),
  mine: async () => asList(await api.get('/subscriptions')),
  subscribe: async (planId) => payload(await api.post('/subscriptions', { planId })),
  cancel: async (id) => payload(await api.patch(`/subscriptions/${encodeURIComponent(id)}/cancel`)),
};

// ---------- Profile / account (Member 1 identity APIs) ----------
export const profileApi = {
  get: async () => payload(await api.get('/users/me')),
  update: async (body) => payload(await api.patch('/users/me', body)),
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) =>
    payload(await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword })),
  me: async () => payload(await api.get('/auth/me')),
};
