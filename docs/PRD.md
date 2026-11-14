# 📄 SevaSetu – Product Requirements Document (PRD)

**Product Name:** SevaSetu  
**Product Type:** Hyperlocal Service Marketplace Web Application  
**Architecture:** Full-Stack Web Application (React + Vite, Node.js + Express, PostgreSQL + Prisma)  
**Target Roles:** Customers, Service Providers, Local Shop Owners, Administrators  
**Development Tool:** Google Antigravity  

---

## 🎯 1. Executive Summary & Objective

The objective of SevaSetu is to build a reliable, responsive, and scalable hyperlocal service marketplace connecting homeowners and residential customers with certified nearby service professionals (electricians, plumbers, home cleaners, appliance technicians, carpenters, painters, tutors) and local hardware stores.

The platform solves core hyperlocal pain points:
- Difficulty discovering trusted, background-checked local professionals.
- Lack of price transparency and arbitrary quotation inflation.
- Absence of centralized discovery for neighborhood hardware and spares stores.
- Unreliable emergency repair dispatch during critical home infrastructure failures (burst pipes, short circuits).
- Zero post-service recourse and warranty accountability for poor workmanship.

---

## 👥 2. Target Users & Personas

### 2.1 Customers
- Individuals and families requiring on-demand or scheduled home repairs.
- Require verified provider profiles, transparent price quotes, emergency dispatch, and warranty certificates.

### 2.2 Service Providers (Technicians & Contractors)
- Local trade professionals seeking a digital platform to showcase skills, manage bookings, bid on customer quotation requests, and track verified revenue.

### 2.3 Local Shop Owners (Hardware & Spares Merchants)
- Neighborhood brick-and-mortar stores stocking electrical, plumbing, paint, and appliance spare parts.
- Showcase live inventory and accept direct customer parts inquiries.

### 2.4 Administrators
- Platform operations team overseeing provider compliance, document verification, dispute mediation, platform commission accounting, and service taxonomy.

---

## ⚙️ 3. Core Functional Requirements

### 3.1 Authentication & Role-Based Authorization
- Secure JWT-based session management with role-specific authorization middleware.
- Passwords salted and hashed with bcrypt (10 rounds).
- Password reset, account change password, and profile picture management.
- Multi-role protected routes on both frontend (`RoleBasedRoute`) and backend (`requireRole`).

### 3.2 Hyperlocal Discovery & Geolocation (Haversine Formula)
- Providers and shops sorted by physical proximity using user GPS coordinates:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- Fallback postal pincode search when browser location access is denied.
- Filtering by category, minimum rating, distance radius, and verification badges.

### 3.3 Multiple Quotation Bidding Engine
- Customers broadcast structured service requirements with problem description, address, and preferred inspection time.
- Nearby verified technicians receive notifications and submit independent price proposals.
- **Strict Anti-Negotiation Policy:** Per PRD specification, price negotiation and counter-offers are strictly prohibited to ensure pricing integrity and prevent provider price gouging.
- Customer compares bids and selects one winning quotation with atomic database isolation. The winner is marked `SELECTED`, non-winners `NOT_SELECTED`, and an active booking is generated automatically.

### 3.4 Priority Emergency SOS Dispatch
- Dedicated high-urgency pipeline for dangerous electrical faults, burst pipes, and gas/water leakages.
- Real-time priority push broadcast to all verified technicians within a 15 km radius.

### 3.5 30-Day Service Guarantee & Revisit Tracking
- System automatically generates a unique tamper-evident **Warranty Certificate** upon booking completion valid for 30 calendar days.
- Customers can file a complimentary warranty revisit request if issues reoccur within the warranty window.

### 3.6 Local Shop & Catalog Integration
- Public directory of local hardware, sanitary, and electrical stores.
- Merchants manage catalog items with prices and stock status.
- Customers submit availability inquiries directly through store catalog cards.

### 3.7 Financial Ledger & Platform Commissions
- Transaction tracking supporting Cash-on-Delivery (COD), UPI, and Card orders.
- Automated platform commission accounting split (10% platform revenue, 90% net provider disbursement).

### 3.8 Customer Support & Dispute Resolution Desk
- Ticketed dispute management system with multi-message chat threads between customers and administrators.
- Status workflow (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`).

### 3.9 Residential Service Subscriptions
- Annual and monthly home maintenance plans (Silver, Gold, Platinum).
- Included service visit limits, priority SOS dispatch, and spare parts catalog discounts.

### 3.10 Bilingual Localization (English & Hindi)
- Native language toggle between English and हिन्दी (Hindi) across all user interfaces, status badges, and dashboard headers.

---

## 🏗️ 4. System Architecture & Tech Stack

- **Client:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Framer Motion, Axios, React Router v6.
- **Server:** Node.js, Express.js (ESM), Prisma ORM, JSON Web Tokens (JWT), Bcrypt, Multer.
- **Database:** PostgreSQL 18 (UTF-8 template, relational schema with 36+ models, foreign key cascades, and transactional isolation).
- **Communication:** REST API (`/api/v1/*`) with standard JSON envelopes.
