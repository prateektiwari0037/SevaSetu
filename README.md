# 🌟 SevaSetu – Hyperlocal Service Marketplace Platform

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)

**SevaSetu** is a modern, high-performance, and scalable full-stack hyperlocal service marketplace connecting homeowners and residential consumers with verified nearby trade professionals (electricians, plumbers, AC technicians, appliance mechanics) and local hardware stores.

---

## 🎯 Key Differentiating Capabilities

### 1. ⚡ Hyperlocal Service Discovery (Haversine Geolocation Engine)
- Discovers technicians and merchants sorted by real-time GPS distance.
- Graceful pincode and manual locality fallback when GPS location permissions are withheld.
- Filter by distance radius, customer ratings, hourly pricing, and verification badges.

### 2. 📑 Multiple Quotation Bidding Engine
- Customers post requirement descriptions with photos, location, and preferred inspection slots.
- Nearby verified technicians independently submit formal price proposals.
- **Strict Anti-Negotiation Policy:** Per PRD specification, price negotiation and counter-offers are strictly prohibited to prevent race-to-the-bottom pricing.
- Customers compare quotes side-by-side and atomically pick a winner with transactional database isolation.

### 3. 🚨 Priority Emergency SOS Dispatch
- Dedicated one-touch emergency request pipeline for urgent electrical hazards, water leakages, and burst pipes.
- Instantly broadcasts high-priority push notifications to all verified on-duty technicians within a 15 km radius.

### 4. 🛡️ 30-Day Service Guarantee & Revisit Tracking
- Every completed work order automatically issues a tamper-evident **Warranty Certificate** valid for 30 days.
- Dissatisfied customers can schedule complimentary warranty revisits directly through their booking timeline.

### 5. 🏪 Local Hardware & Spares Store Directory
- Integrated marketplace catalog connecting local hardware stores with customers and field technicians.
- Browse inventory in stock, compare prices, and submit direct parts availability inquiries.

### 6. 🌐 Bilingual English & हिन्दी (Hindi) Interface
- Comprehensive client-side localization system enabling frictionless instant switching between English and Hindi across public landing pages and private dashboards.

---

## 👥 Role-Based Architecture & Portals

### 🏠 Customer Portal (`/customer/*`)
- **Dashboard Overview:** Recent bookings, warranty revisits, active requests, and emergency shortcuts.
- **Service Booking Engine:** Normal scheduled bookings & Emergency SOS dispatches.
- **Quotation Comparison Deck:** Real-time side-by-side comparison of technician bids.
- **Booking Management:** Live progress tracking (`PENDING` -> `ACCEPTED` -> `IN_PROGRESS` -> `COMPLETED`).
- **Warranty Desk:** View warranty certificates and request free revisits.
- **Address Book & Favorites:** Manage multiple delivery locations and bookmarked technicians.
- **Complaints Desk:** File tickets with customer support mediation.

### 🔧 Service Provider Portal (`/provider/*`)
- **Job Console:** Accept or reject incoming booking requests with reasons.
- **Quotation Desk:** Browse open customer requests and submit non-negotiable bids.
- **Work Status Controls:** Transition active jobs through `ACCEPTED`, `IN_PROGRESS`, and `COMPLETED`.
- **Financial Ledger & Payouts:** View gross job value, 10% platform commission deductions, and 90% net technician disbursements.
- **Verification Desk:** Upload government identity documents (Aadhaar, PAN) and trade certificates.
- **Availability Schedule:** Configure working hours and weekly time slots.

### 🏬 Shop Owner Portal (`/shop/*`)
- **Merchant Dashboard:** Real-time metrics on customer inquiries and catalog size.
- **Catalog Management:** Add, edit, price, and mark spare parts in/out of stock.
- **Customer Inquiries:** Receive and reply to parts availability requests.
- **Storefront Profile:** Customize exterior photos, address, and operating hours.

### 🛡️ Platform Administrator Portal (`/admin/*`)
- **Executive Operations Center:** Real-time platform KPI metrics, revenue tracking, and order breakdown.
- **User Registry:** Search, filter, and suspend/reactivate user accounts.
- **Compliance Desk:** Review identity proofs and storefront images with one-click approve/reject actions.
- **Service & Category Manager:** Add, edit, and deactivate primary categories and services.
- **Booking & Quotation Monitor:** Audit all transactions across the entire marketplace.
- **Complaints Resolution Desk:** Direct two-way messaging with customers to resolve disputes.
- **Global Settings:** Modify platform commission fee percentage, SOS broadcast radius, and helplines.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18.17+` or `v20+`
- PostgreSQL `v16+` or `v18` configured on port `5433` (or update `DATABASE_URL` in `Backend/.env`)

### 2. Backend Setup
```bash
cd Backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node src/server.js
```
The backend starts at `http://localhost:5000` (`http://localhost:5000/api/v1`).

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:5173`.

---

## 🔑 Pre-Seeded Demo Accounts

For immediate testing, use the following credentials or the **1-Click Demo Login Buttons** on the sign-in screen:

| Role | Email | Password | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sevasetu.com` | `Admin@1234` | `/admin/dashboard` |
| **Residential Customer** | `customer@sevasetu.com` | `Customer@1234` | `/customer/dashboard` |
| **Electrician Pro** | `electrician@sevasetu.com` | `Provider@1234` | `/provider/dashboard` |
| **Plumber Pro** | `plumber@sevasetu.com` | `Provider@1234` | `/provider/dashboard` |
| **Hardware Shop Owner** | `shop@sevasetu.com` | `Shop@1234` | `/shop/dashboard` |

---

## 📚 Technical Documentation Suite

For exhaustive technical breakdowns, refer to the documentation files in the `docs/` folder:

- [📄 Product Requirements Document (PRD)](file:///d:/SevaSetu/docs/PRD.md)
- [📖 REST API Documentation](file:///d:/SevaSetu/docs/API_DOCUMENTATION.md)
- [🗄️ Database Relational Schema](file:///d:/SevaSetu/docs/DATABASE_SCHEMA.md)
- [🛠️ Setup & Deployment Guide](file:///d:/SevaSetu/docs/SETUP_GUIDE.md)

---

## 💻 Tech Stack Summary

- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Framer Motion, Axios, React Router v6.
- **Backend:** Node.js, Express.js (ESM), Prisma ORM, JSON Web Tokens (JWT), Bcrypt, Multer.
- **Database:** PostgreSQL (UTF-8, with full relational integrity, foreign key cascades, and transactional isolation).
- **Architecture:** Clean modular architecture separating routing, controllers, middleware, and database layers.
