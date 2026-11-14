# 📖 SevaSetu REST API Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Authentication Scheme:** Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)  
**Standard Response Envelope:**
```json
{
  "success": true,
  "message": "Human readable response message",
  "data": { ... }
}
```

---

## 1. Authentication & Account Management (`/api/v1/auth`)

### 1.1 Register User
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "Password@1234",
  "role": "CUSTOMER", // "CUSTOMER" | "PROVIDER" | "SHOP_OWNER"
  "fullName": "Rajesh Kumar",
  "profileData": {
    "experienceYears": 5, // if PROVIDER
    "skills": ["AC Repair", "Wiring"], // if PROVIDER
    "shopName": "Gupta Hardware", // if SHOP_OWNER
    "shopCategory": "Hardware & Spares", // if SHOP_OWNER
    "address": "Shop #4, Market Road", // if SHOP_OWNER
    "pincode": "400001",
    "city": "Mumbai"
  }
}
```
- **Response (201 Created):** Returns user object and signed JWT token.

### 1.2 Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "customer@sevasetu.com",
  "password": "Customer@1234"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "customer@sevasetu.com",
      "role": "CUSTOMER",
      "customerProfile": { "fullName": "Rajesh Kumar" }
    },
    "token": "eyJhbGciOi..."
  }
}
```

### 1.3 Current User (`me`)
- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated (Any role)
- **Response (200 OK):** Returns logged-in user profile and role details.

### 1.4 Change Password
- **Endpoint:** `PATCH /api/v1/auth/change-password`
- **Access:** Authenticated (Any role)
- **Request Body:** `{ "oldPassword": "...", "newPassword": "..." }`

---

## 2. Customer Address Management (`/api/v1/users/addresses`)

### 2.1 List Saved Addresses
- **Endpoint:** `GET /api/v1/users/addresses`
- **Access:** Customer

### 2.2 Add Address
- **Endpoint:** `POST /api/v1/users/addresses`
- **Access:** Customer
- **Request Body:**
```json
{
  "label": "Home",
  "streetAddress": "Flat 402, Sunshine Heights, MG Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true,
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

### 2.3 Set Default Address
- **Endpoint:** `PATCH /api/v1/users/addresses/:id/default`
- **Access:** Customer

---

## 3. Categories & Services Discovery (`/api/v1/categories`, `/api/v1/services`)

### 3.1 List Categories
- **Endpoint:** `GET /api/v1/categories`
- **Access:** Public
- **Query Params:** none
- **Response:** Array of categories (Electrician, Plumber, Appliance Repair, etc.)

### 3.2 List Catalog Services
- **Endpoint:** `GET /api/v1/services`
- **Access:** Public
- **Query Params:** `categoryId`, `priceType`

### 3.3 Search Services
- **Endpoint:** `GET /api/v1/services/search`
- **Access:** Public
- **Query Params:** `q=fan&category=electrician&pincode=400001`

---

## 4. Hyperlocal Provider Discovery (`/api/v1/providers`)

### 4.1 Nearby Service Providers (Haversine Formula)
- **Endpoint:** `GET /api/v1/providers/nearby`
- **Access:** Public
- **Query Params:**
  - `latitude`: User current GPS latitude (e.g. `19.0760`)
  - `longitude`: User current GPS longitude (e.g. `72.8777`)
  - `pincode`: Optional 6-digit postal code (fallback when GPS is denied)
  - `category`: Service category filter (e.g. `Electrician`)
  - `maxDistanceKm`: Maximum search radius in km (default: 25)
  - `minRating`: Minimum rating threshold (e.g. `4.0`)
- **Response:** List of approved providers with calculated `distanceKm`, verified badges, average ratings, and hourly rates.

### 4.2 Provider Public Profile
- **Endpoint:** `GET /api/v1/providers/:id`
- **Access:** Public
- **Response:** Public profile including bio, verification badge, reviews, and catalog services.

### 4.3 Provider Earnings & Platform Commission
- **Endpoint:** `GET /api/v1/providers/earnings`
- **Access:** Provider
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 359.1,
    "totalPlatformCommissions": 39.9,
    "completedBookingsCount": 1,
    "completedBookings": [ ... ]
  }
}
```

---

## 5. Direct & Emergency Bookings (`/api/v1/bookings`)

### 5.1 Create Booking
- **Endpoint:** `POST /api/v1/bookings`
- **Access:** Customer
- **Request Body:**
```json
{
  "serviceId": "uuid",
  "providerId": "uuid", // Optional if quotation discovery
  "bookingType": "NORMAL", // "NORMAL" | "EMERGENCY"
  "problemDescription": "Ceiling fan making squeaking noise at speed 4",
  "bookingDate": "2026-11-16",
  "timeSlot": "10:00 AM - 1:00 PM",
  "serviceAddress": "Flat 402, Sunshine Heights, Mumbai",
  "addressPincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "totalAmount": 399,
  "paymentMethod": "CASH" // "CASH" | "ONLINE" | "UPI"
}
```

### 5.2 Status Workflow Transitions
- `PATCH /api/v1/bookings/:id/accept` – Provider accepts pending booking.
- `PATCH /api/v1/bookings/:id/start` – Provider begins job (`IN_PROGRESS`).
- `PATCH /api/v1/bookings/:id/complete` – Provider completes job (`COMPLETED`), automatically generating a 30-day warranty certificate and financial ledger entry.
- `PATCH /api/v1/bookings/:id/cancel` – Customer or Provider cancels booking with mandatory reason.

---

## 6. Multiple Quotation Bidding Engine (`/api/v1/service-requests`, `/api/v1/quotations`)

> **Strict PRD Rule:** Price negotiation and counter-offers are strictly prohibited. Each provider submits their independent quote, and the customer transactionally accepts one winner.

### 6.1 Customer Creates Service Requirement
- **Endpoint:** `POST /api/v1/service-requests`
- **Access:** Customer
- **Request Body:**
```json
{
  "serviceId": "uuid",
  "title": "Main MCB tripping repeatedly in kitchen",
  "description": "High load microwave trips breaker immediately. Need technician inspection.",
  "address": "Flat 402, Sunshine Heights, Mumbai",
  "pincode": "400001",
  "preferredDate": "2026-11-17",
  "preferredTimeSlot": "Morning 10 AM - 1 PM"
}
```

### 6.2 Provider Submits Quotation
- **Endpoint:** `POST /api/v1/quotations`
- **Access:** Verified Provider
- **Request Body:**
```json
{
  "serviceRequestId": "uuid",
  "quotedAmount": 650,
  "estimatedDuration": "1.5 hours",
  "notes": "Includes wiring insulation testing and 32A MCB replacement if needed."
}
```

### 6.3 Customer Selects Winner Quotation
- **Endpoint:** `PATCH /api/v1/quotations/:id/select`
- **Access:** Customer
- **Transactional Behavior:**
  1. Selected quotation status updated to `SELECTED`.
  2. All other quotations for the request atomically marked `NOT_SELECTED`.
  3. Service request marked `CONFIRMED`.
  4. Confirmed booking automatically generated with status `ACCEPTED`.
  5. Winning provider received immediate booking notification.

---

## 7. Emergency SOS Dispatch (`/api/v1/emergency-requests`)

### 7.1 Priority SOS Dispatch
- **Endpoint:** `POST /api/v1/emergency-requests`
- **Access:** Customer
- **Request Body:**
```json
{
  "serviceId": "uuid",
  "problemDescription": "Water pipe burst in bathroom, flooding floor!",
  "address": "Building 5, Flat 101, Bandra West",
  "pincode": "400050",
  "latitude": 19.0596,
  "longitude": 72.8295
}
```
- **Behavior:** Priority broadcast dispatches notification alerts to all verified technicians within a 15 km radius.

---

## 8. Warranty & Revisit Tracking (`/api/v1/warranties`, `/api/v1/revisits`)

### 8.1 Fetch Warranty Certificate
- **Endpoint:** `GET /api/v1/warranties/booking/:bookingId`
- **Access:** Authenticated Customer / Provider

### 8.2 Request Warranty Revisit
- **Endpoint:** `POST /api/v1/revisits`
- **Access:** Customer
- **Request Body:**
```json
{
  "bookingId": "uuid",
  "reason": "Fan regulator stopped rotating smoothly 5 days after repair",
  "preferredDate": "2026-11-20"
}
```

---

## 9. Local Hardware & Spares Shops (`/api/v1/shops`)

### 9.1 Browse Nearby Shops
- **Endpoint:** `GET /api/v1/shops`
- **Access:** Public
- **Query Params:** `latitude`, `longitude`, `category`, `pincode`, `search`

### 9.2 Shop Owner Inventory Management
- `GET /api/v1/shops/owner/profile` – View merchant store profile.
- `PATCH /api/v1/shops/owner/profile` – Update store branding, location, hours.
- `GET /api/v1/shops/owner/catalog` – List spare parts catalog items.
- `POST /api/v1/shops/owner/catalog` – Add inventory item with price and stock status.
- `PATCH /api/v1/shops/owner/catalog/:id` – Edit item details or toggle in-stock.
- `DELETE /api/v1/shops/owner/catalog/:id` – Remove item from catalog.
- `GET /api/v1/shops/owner/inquiries` – View customer parts inquiries.

---

## 10. Platform Administration (`/api/v1/admin`)

### 10.1 Real-Time Dashboard KPI
- **Endpoint:** `GET /api/v1/admin/dashboard`
- **Access:** Admin
- **Metrics:** Total Customers, Verified Providers, Total Bookings, GMV, Platform Commission, and Recent Work Orders.

### 10.2 User Account Management
- `GET /api/v1/admin/users` – Filter by role, search, and active status.
- `PATCH /api/v1/admin/users/:id/status` – One-click account suspension / reactivation.

### 10.3 Provider & Shop Compliance Verification
- `GET /api/v1/admin/verifications` – Review pending documents and storefronts.
- `PATCH /api/v1/admin/providers/:id/verify` – Approve or reject provider with reason.
- `PATCH /api/v1/admin/shops/:id/verify` – Approve or reject merchant shop.

### 10.4 Global Platform Settings
- `GET /api/v1/admin/settings` – View platform settings.
- `PATCH /api/v1/admin/settings` – Update commission % (10%), SOS radius (15 km), warranty days (30), and helpline numbers.
