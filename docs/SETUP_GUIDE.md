# 🛠️ SevaSetu Installation & Setup Guide

This guide describes how to run and deploy the **SevaSetu Hyperlocal Service Marketplace** on local developer machines and cloud production environments.

---

## 1. System Prerequisites

| Component | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0+` | `v20.x LTS` | Includes npm v9+ |
| **PostgreSQL** | `v15.0+` | `v16+` or `v18` | Configured with `UTF8` encoding |
| **Operating System**| Windows 10/11, macOS, Linux | Any | Cross-platform |

---

## 2. Repository Architecture

```
d:\SevaSetu\
├── Frontend\                # Frontend React 18 + Vite application
│   ├── src\
│   │   ├── components\      # Reusable UI widgets and layouts
│   │   ├── constants\       # English & Hindi translation dictionaries
│   │   ├── context\         # Auth, Language, and Notification contexts
│   │   ├── pages\           # Public, Customer, Provider, Shop, Admin screens
│   │   ├── routes\          # ProtectedRoute, PublicRoute, RoleBasedRoute
│   │   └── services\        # Axios interceptor API client
├── Backend\                 # Backend Express Node.js application
│   ├── prisma\              # Prisma schema (`schema.prisma`) and seed (`seed.js`)
│   ├── src\
│   │   ├── config\          # Database and JWT config
│   │   ├── middleware\      # Auth, Role guard, Error, File upload
│   │   ├── modules\         # Domain controllers and routes
│   │   └── server.js        # Server entry point
├── docs\                    # PRD, API docs, Database schema, Setup guide
└── README.md                # Platform documentation and walkthrough
```

---

## 3. Database Initialization (PostgreSQL)

### 3.1 Initialize Database with UTF-8 Encoding
On Windows or Linux, ensure the target database uses `UTF-8` encoding to prevent encoding mismatches with Hindi Unicode characters and Indian rupee symbols (`₹`):

```bash
# Example PostgreSQL command
createdb -h 127.0.0.1 -p 5433 -U postgres -T template0 -E UTF8 sevasetu
```

### 3.2 Configure Backend Environment Variables (`Backend/.env`)
Create or edit `Backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sevasetu?schema=public"
JWT_SECRET="sevasetu_super_secret_jwt_key_2026_dev_prod"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### 3.3 Apply Prisma Schema & Migrations
```bash
cd Backend
npm install
npx prisma generate
npx prisma db push
```

### 3.4 Seed Database with Demo Accounts & Initial Catalog
```bash
node prisma/seed.js
```
The seed script inserts:
- 1 Platform Administrator
- 1 Verified Residential Customer
- 3 Certified Service Providers (Electrician, Plumber, AC Repair)
- 1 Hardware & Spares Store Owner
- 10 Service Categories with high-resolution imagery
- Core service offerings with fixed pricing and 30-day warranties
- Active and completed sample bookings with warranty certificates
- Verified customer reviews and platform settings

---

## 4. Running the Platform

### 4.1 Start Backend API Server
```bash
cd Backend
node src/server.js
```
- API Base URL: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/api/health`

### 4.2 Start Frontend Vite Client
```bash
cd Frontend
npm install
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 5. Seed Test Accounts & Credentials

The platform includes four pre-configured user personas for immediate evaluation:

| Persona | Email | Password | Role | Features to Explore |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@sevasetu.com` | `Admin@1234` | `ADMIN` | Dashboard KPI, Provider Verifications, Catalog CRUD, Financial Ledger, Platform Settings |
| **Customer** | `customer@sevasetu.com` | `Customer@1234` | `CUSTOMER` | Book Service, Request Quotations, SOS Emergency, Active Bookings, 30-Day Warranty Revisit |
| **Electrician Pro** | `electrician@sevasetu.com` | `Provider@1234` | `PROVIDER` | Booking Requests, Submit Quotation Bids, Work Status Workflow, Earnings (90% share) |
| **Plumber Pro** | `plumber@sevasetu.com` | `Provider@1234` | `PROVIDER` | Availability slots, verification documents, customer reviews |
| **Shop Owner** | `shop@sevasetu.com` | `Shop@1234` | `SHOP_OWNER` | Hardware catalog management, customer part inquiries, storefront profile |

> **Pro Tip:** On the Login page (`/login`), click any of the **1-Click Demo Buttons** at the top of the form to automatically fill the credentials and sign in directly into that persona's dashboard!

---

## 6. Production Build Verification
To generate optimized production bundles for the frontend:
```bash
cd Frontend
npm run build
```
This produces the distribution bundle in `Frontend/dist/` ready to be served by NGINX, Cloudflare Pages, or static web hosting.
