# Customer Module — Frontend Integration Notes (Member 2)

Scope: React frontend only. No backend, database or auth-backend files were modified.

## Routes

| Route | Page |
|---|---|
| `/register`, `/login` | Shared auth pages (client validation + accessibility added) |
| `/customer/dashboard` | `CustomerDashboard` |
| `/customer/services`, `/customer/services/:id` | `CustomerServices`, `CustomerServiceDetail` |
| `/customer/providers`, `/customer/providers/:id` | `CustomerProviders`, `CustomerProviderDetail` |
| `/customer/book` → `/customer/book/:serviceId` | `BookService` (service picker → 4-step wizard) |
| `/customer/bookings`, `/customer/bookings/:id` | `CustomerBookings`, `BookingDetails` |
| `/customer/favorites`, `/reviews`, `/addresses`, `/notifications`, `/complaints`, `/subscriptions`, `/profile`, `/settings` | Matching pages |
| `/customer/book-service?serviceId=…` | Legacy link, redirects to `/customer/book/:serviceId` |
| `/customer/quotations/:id` | Existing quotation page (route fixed; not part of the booking flow) |

All `/customer/*` routes sit behind `RoleBasedRoute(['CUSTOMER'])`. Signed-out visitors are sent to `/login?redirect=<original path>`.

## Endpoints consumed

All calls go through the shared axios client (`src/services/api.js`) via `src/services/customerApi.js`.

| Feature | Endpoint used | Note |
|---|---|---|
| Categories / services | `GET /categories`, `GET /services?categoryId&search&minPrice&maxPrice`, `GET /services/:id` | No server pagination → paginated client-side |
| Providers | `GET /providers/nearby?search&category&pincode&minRating&isAvailable`, `GET /providers/:id` | Brief lists `GET /providers`; the existing equivalent is `/nearby` |
| Bookings | `POST /bookings`, `GET /bookings[?status]`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel` | Brief lists `/bookings/my` and `POST …/cancel`; backend uses the forms shown here |
| Reviews | `POST /reviews`, `GET /reviews/my-reviews` | Brief lists `/reviews/my` |
| Addresses | `GET/POST /users/addresses`, `PATCH/DELETE /users/addresses/:id` | "Set default" = `PATCH {isDefault:true}` (no `/default` route exists) |
| Notifications | `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` | |
| Complaints | `GET/POST /complaints`, `GET /complaints/:id`, `POST /complaints/:id/messages` | Sends both `subject` and `title` (Prisma vs Mongoose field name) |
| Subscriptions | `GET /subscription-plans`, `GET/POST /subscriptions`, `PATCH /subscriptions/:id/cancel` | |
| Profile / account | `GET/PATCH /users/me`, `POST /auth/change-password`, `POST /auth/logout-all`, `DELETE /users/account` | |
| Session | `POST /auth/refresh` (httpOnly cookie) | Retried once on any 401, so users aren't logged out when the 15-min access token expires |

## Missing or unsupported backend APIs

1. **Favorites module is missing entirely.** The frontend calls the contract from the brief: `GET /favorites`, `POST /favorites {providerId}`, `DELETE /favorites/:providerId`. On a 404 the Favorites page shows a "not available yet" notice and heart buttons are hidden.
2. **`GET /providers/:id/availability` is missing.** Expected: `?date=YYYY-MM-DD → { slots: [{ label, available }] }`. Fallback: standard 2-hour slots, filtered by the provider's weekly hours (when returned) and by time already passed today. The backend must still reject double-booked slots; a 409 or slot-related error sends the user back to the date & time step with that slot blocked.
3. **`POST /bookings` does not validate slot availability.** The UI handles slot errors, but the backend never produces one today.
4. **No customer avatar upload endpoint.** The profile page accepts an image URL (`avatarUrl` via `PATCH /users/me`).
5. **No complaint attachment upload.** The form tells users attachments aren't supported yet.
6. **No pagination params** on services, providers or bookings. Pagination is client-side.

### ⚠️ Blocker for the end-to-end acceptance journey

`Backend/src/config/db.js` now exports **mongoose**, but these controllers still call Prisma-style methods on it (`prisma.booking.findMany`, …): `bookings`, `services`, `categories`, `providers`, `reviews`, `notifications`, `complaints`, `subscriptions`, `emergency`, `payments`, `quotations`, `shops`, `warranties`. Every call will throw (`Cannot read properties of undefined`) and return 500. Only `auth`, `users` and `admin` have been ported to the Mongoose models.

Until the owners port those modules, the real journey stops after Register / Login / Addresses / Profile. The frontend was therefore checked against the contracts in the controllers and `docs/API_DOCUMENTATION.md`, in two ways:

- **Unit/integration tests** (`npm test`): 89 tests. Only the axios client is mocked, so the tests also check the exact URLs and payloads sent.
- **Browser journey:** headless Chrome against `vite dev` plus a contract-faithful mock API. Register → Browse → Select provider → Add address → Book → Track → (provider completes, simulated) → Review. Checked at 390 / 820 / 1440 px with no horizontal overflow. Screenshots are in `docs/customer-module-evidence/`.

## Data-shape notes

- `Address.addressLine` is one field. The form's *House/building* and *Street* inputs are joined with `" | "` so they can be split back for editing. They display as `", "`.
- Booking `paymentMethod` is sent as `CASH` (accepted by both the Prisma and Mongoose enums) and shown as **Cash on Service**. Payment status is read-only.
- Field names are read defensively where Prisma and Mongoose differ (`estimatedDurationMinutes`/`durationMinutes`, `subject`/`title`, `createdAt`/`timestamp`, `id`/`_id`).
