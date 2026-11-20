import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  CustomerProfile,
  ProviderProfile,
  ShopProfile,
  Service,
  Category,
  Booking,
  Payment,
  Review,
  Warranty,
  Notification,
  Product,
  ShopInquiry,
  EmergencyRequest,
  SlotReservation,
} from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/token.js';
import SchedulerService from '../src/services/scheduler.service.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

describe('SevaSetu Member 4 - Booking Engine, Shops, SOS & Supporting Modules Tests', () => {
  let customerUser1, customerProfile1, customerToken1;
  let customerUser2, customerProfile2, customerToken2;
  let providerUser1, providerProfile1, providerToken1;
  let providerUser2, providerProfile2, providerToken2;
  let shopOwnerUser1, shopProfile1, shopOwnerToken1;
  let shopOwnerUser2, shopProfile2, shopOwnerToken2;
  let testCategory, testService;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await SlotReservation.init();

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Cleanup test data
    await Promise.all([
      User.deleteMany({ email: /@m4test\.com$/ }),
      CustomerProfile.deleteMany({ phone: /999444/ }),
      ProviderProfile.deleteMany({ servicePincode: '400050' }),
      ShopProfile.deleteMany({ pincode: '400050' }),
      Booking.deleteMany({ serviceAddress: /M4 Test Address/ }),
      Payment.deleteMany({}),
      Review.deleteMany({ comment: /M4 Review/ }),
      Warranty.deleteMany({}),
      Product.deleteMany({ name: /M4 Product/ }),
      ShopInquiry.deleteMany({ customerName: /M4 Inquiry/ }),
      EmergencyRequest.deleteMany({ emergencyCategory: /M4 Emergency/ }),
      SlotReservation.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    // 1. Setup Category & Service
    testCategory = await Category.findOneAndUpdate(
      { slug: 'm4-plumbing' },
      { name: 'M4 Plumbing', slug: 'm4-plumbing', isActive: true },
      { upsert: true, returnDocument: 'after' }
    );

    testService = await Service.findOneAndUpdate(
      { slug: 'm4-leak-repair' },
      {
        name: 'M4 Leak Repair',
        slug: 'm4-leak-repair',
        categoryId: testCategory._id,
        basePrice: 500,
        durationMinutes: 60,
        isActive: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Setup Customer 1 & 2
    customerUser1 = await User.create({
      fullName: 'M4 Customer One',
      email: 'cust1@m4test.com',
      mobile: '+919994440001',
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
    });
    customerProfile1 = await CustomerProfile.create({
      userId: customerUser1._id,
      fullName: 'M4 Customer One',
      phone: '+919994440001',
    });
    customerToken1 = generateAccessToken(customerUser1);

    customerUser2 = await User.create({
      fullName: 'M4 Customer Two',
      email: 'cust2@m4test.com',
      mobile: '+919994440002',
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
    });
    customerProfile2 = await CustomerProfile.create({
      userId: customerUser2._id,
      fullName: 'M4 Customer Two',
      phone: '+919994440002',
    });
    customerToken2 = generateAccessToken(customerUser2);

    // 3. Setup Provider 1 & 2
    providerUser1 = await User.create({
      fullName: 'M4 Provider One',
      email: 'prov1@m4test.com',
      mobile: '+919994440003',
      passwordHash,
      role: 'PROVIDER',
      accountStatus: 'ACTIVE',
    });
    providerProfile1 = await ProviderProfile.create({
      userId: providerUser1._id,
      fullName: 'M4 Provider One',
      verificationStatus: 'APPROVED',
      isAvailable: true,
      city: 'Mumbai',
      servicePincode: '400050',
      serviceAreas: [{ pincode: '400050', areaName: 'Bandra' }],
      serviceIds: [testService._id],
    });
    providerToken1 = generateAccessToken(providerUser1);

    providerUser2 = await User.create({
      fullName: 'M4 Provider Two',
      email: 'prov2@m4test.com',
      mobile: '+919994440004',
      passwordHash,
      role: 'PROVIDER',
      accountStatus: 'ACTIVE',
    });
    providerProfile2 = await ProviderProfile.create({
      userId: providerUser2._id,
      fullName: 'M4 Provider Two',
      verificationStatus: 'APPROVED',
      isAvailable: true,
      city: 'Mumbai',
      servicePincode: '400050',
      serviceAreas: [{ pincode: '400050', areaName: 'Bandra' }],
      serviceIds: [testService._id],
    });
    providerToken2 = generateAccessToken(providerUser2);

    // 4. Setup Shop Owner 1 & 2
    shopOwnerUser1 = await User.create({
      fullName: 'M4 Merchant One',
      email: 'shop1@m4test.com',
      mobile: '+919994440005',
      passwordHash,
      role: 'SHOP_OWNER',
      accountStatus: 'ACTIVE',
    });
    shopProfile1 = await ShopProfile.create({
      userId: shopOwnerUser1._id,
      ownerId: shopOwnerUser1._id,
      shopName: 'M4 Hardware & Pipes',
      ownerName: 'M4 Merchant One',
      shopCategory: 'Sanitary & Hardware',
      city: 'Mumbai',
      area: 'Bandra',
      pincode: '400050',
      verificationStatus: 'APPROVED',
      status: 'ACTIVE',
    });
    shopOwnerToken1 = generateAccessToken(shopOwnerUser1);

    shopOwnerUser2 = await User.create({
      fullName: 'M4 Merchant Two',
      email: 'shop2@m4test.com',
      mobile: '+919994440006',
      passwordHash,
      role: 'SHOP_OWNER',
      accountStatus: 'ACTIVE',
    });
    shopProfile2 = await ShopProfile.create({
      userId: shopOwnerUser2._id,
      ownerId: shopOwnerUser2._id,
      shopName: 'M4 Electrical Goods',
      ownerName: 'M4 Merchant Two',
      shopCategory: 'Electrical',
      city: 'Mumbai',
      area: 'Andheri',
      pincode: '400058',
      verificationStatus: 'APPROVED',
      status: 'ACTIVE',
    });
    shopOwnerToken2 = generateAccessToken(shopOwnerUser2);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  // =========================================================================
  // 1. BOOKING ENGINE & CONCURRENT DOUBLE-BOOKING PREVENTION
  // =========================================================================
  describe('1. Booking Engine & Double-Booking Prevention', () => {
    it('should create booking with complete snapshots, paise calculation, and CASH_ON_SERVICE', async () => {
      const res = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Water pipe leaking in bathroom',
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM',
          serviceAddress: 'Flat 402, M4 Test Address, Bandra',
          addressPincode: '400050',
          addressCity: 'Mumbai',
          addressArea: 'Bandra',
          totalAmount: 500,
          paymentMethod: 'CASH_ON_SERVICE',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      const b = res.data.data;
      assert.equal(b.status, 'PENDING');
      assert.equal(b.paymentStatus, 'UNPAID');
      assert.equal(b.collectionStatus, 'UNPAID');
      assert.equal(b.priceSnapshot.totalPaise, 50000); // 500 * 100
      assert.equal(b.priceSnapshot.commissionPaise, 5000); // 10%
      assert.equal(b.priceSnapshot.providerEarningsPaise, 45000);
      assert.equal(b.addressSnapshot.pincode, '400050');
      assert.equal(b.serviceSnapshot.name, 'M4 Leak Repair');
    });

    it('should detect slot conflict and prevent double-booking for the same provider at the same slot', async () => {
      // First booking reserves provider1 at 02:00 PM - 04:00 PM on 2026-12-02
      const firstRes = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'First slot reservation',
          bookingDate: '2026-12-02',
          timeSlot: '02:00 PM - 04:00 PM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 500,
        },
      });
      assert.equal(firstRes.status, 201);

      // Second booking attempt by Customer 2 for the EXACT SAME slot and provider must fail with 409
      const secondRes = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken2}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Conflicting second reservation attempt',
          bookingDate: '2026-12-02',
          timeSlot: '02:00 PM - 04:00 PM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 500,
        },
      });

      assert.equal(secondRes.status, 409);
      assert.match(secondRes.data.message, /already reserved or booked/i);
    });

    it('should safely handle concurrent booking requests using atomic conflict check', async () => {
      // Fire two concurrent requests at the exact same millisecond
      const [resA, resB] = await Promise.all([
        request('/api/v1/bookings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken1}` },
          body: {
            serviceId: testService._id.toString(),
            providerId: providerProfile2._id.toString(),
            problemDescription: 'Concurrent Candidate A',
            bookingDate: '2026-12-05',
            timeSlot: '04:00 PM - 06:00 PM',
            serviceAddress: 'M4 Test Address, Bandra',
            addressPincode: '400050',
            totalAmount: 500,
          },
        }),
        request('/api/v1/bookings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken2}` },
          body: {
            serviceId: testService._id.toString(),
            providerId: providerProfile2._id.toString(),
            problemDescription: 'Concurrent Candidate B',
            bookingDate: '2026-12-05',
            timeSlot: '04:00 PM - 06:00 PM',
            serviceAddress: 'M4 Test Address, Bandra',
            addressPincode: '400050',
            totalAmount: 500,
          },
        }),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly one must succeed (201) and the other must be rejected (409)
      assert.ok(statuses.includes(201), 'One concurrent reservation should succeed');
      assert.ok(statuses.includes(409), 'The conflicting concurrent reservation should receive 409');
    });
  });

  // =========================================================================
  // 2. BOOKING LIFECYCLE, OWNERSHIP & TRANSITIONS
  // =========================================================================
  describe('2. Booking Lifecycle, Ownership & Invalid Transitions', () => {
    let lifecycleBookingId;

    before(async () => {
      const res = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Lifecycle test booking',
          bookingDate: '2026-12-10',
          timeSlot: '11:00 AM - 01:00 PM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 500,
        },
      });
      lifecycleBookingId = res.data.data._id;
    });

    it('should reject starting work directly from PENDING status', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /must be ACCEPTED/i);
    });

    it('should prevent unauthorized provider from accepting someone elses booking', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken2}` },
      });
      assert.equal(res.status, 403);
    });

    it('should allow assigned provider to accept booking', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'ACCEPTED');
    });

    it('should allow assigned provider to start work', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'IN_PROGRESS');
    });

    it('should allow assigned provider to complete work', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
        body: { cashCollected: false },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'COMPLETED');
    });

    it('should prevent cancelling an already COMPLETED booking', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: { reason: 'Too late to cancel' },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot cancel/i);
    });

    it('should prevent unauthorized customer from viewing another customers booking', async () => {
      const res = await request(`/api/v1/bookings/${lifecycleBookingId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken2}` },
      });
      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 3. CASH ON SERVICE WORKFLOW (REPORT, CONFIRM, DISPUTE)
  // =========================================================================
  describe('3. Cash on Service Workflow & Audit Tracking', () => {
    let cosBookingId;

    before(async () => {
      const bRes = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Cash on service test job',
          bookingDate: '2026-12-15',
          timeSlot: '09:00 AM - 11:00 AM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 600,
        },
      });
      cosBookingId = bRes.data.data._id;
      // Accept and start
      await request(`/api/v1/bookings/${cosBookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      await request(`/api/v1/bookings/${cosBookingId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
    });

    it('should allow provider to report cash collection without prematurely marking verified paid', async () => {
      const res = await request(`/api/v1/bookings/${cosBookingId}/collection/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
        body: { amount: 600, notes: 'Received 600 cash from client' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.collectionStatus, 'PROVIDER_REPORTED');

      // Verify in DB that isPaid is still false
      const bCheck = await Booking.findById(cosBookingId);
      assert.equal(bCheck.collectionStatus, 'PROVIDER_REPORTED');
      assert.equal(bCheck.isPaid, false, 'Provider report alone must NOT mark payment as confirmed/paid');
    });

    it('should allow customer to confirm cash collection and settle earnings in paise', async () => {
      const res = await request(`/api/v1/bookings/${cosBookingId}/collection/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: { notes: 'Yes, handed over exact 600 cash' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.collectionStatus, 'CONFIRMED');
      assert.equal(res.data.data.isPaid, true);
      assert.equal(res.data.data.settlement.totalPaise, 60000);
      assert.equal(res.data.data.settlement.commissionPaise, 6000);
      assert.equal(res.data.data.settlement.providerEarningsPaise, 54000);

      const bCheck = await Booking.findById(cosBookingId);
      assert.equal(bCheck.collectionStatus, 'CONFIRMED');
      assert.equal(bCheck.isPaid, true);
    });

    it('should handle collection dispute flow', async () => {
      const res = await request(`/api/v1/bookings/${cosBookingId}/collection/dispute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: { reason: 'Provider charged 100 extra beyond quoted price' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.collectionStatus, 'DISPUTED');

      const bCheck = await Booking.findById(cosBookingId);
      assert.equal(bCheck.collectionStatus, 'DISPUTED');
      assert.match(bCheck.disputeReason, /charged 100 extra/i);
    });
  });

  // =========================================================================
  // 4. MANUAL LOCATION EMERGENCY SOS
  // =========================================================================
  describe('4. Emergency SOS (Manual Location Based)', () => {
    let emergencyId;

    it('should create emergency request matching active providers in PIN code', async () => {
      const res = await request('/api/v1/emergency-requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          emergencyCategory: 'M4 Emergency: Burst Pipe',
          description: 'Main pipe burst, water flooding living room',
          city: 'Mumbai',
          area: 'Bandra',
          pincode: '400050',
          fullAddress: 'Flat 101, M4 Test Address, Bandra West',
          contactNumber: '+919994440001',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.notifiedProvidersCount >= 1, 'Should notify at least provider1 in 400050');
      assert.match(res.data.data.disclaimer, /cannot be legally guaranteed/i);
      emergencyId = res.data.data.emergencyId;
    });

    it('should allow eligible provider to accept emergency request and auto-dispatch booking', async () => {
      const res = await request(`/api/v1/emergency-requests/${emergencyId}/respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
        body: { action: 'ACCEPT' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'ACCEPTED');
      assert.ok(res.data.data.bookingId, 'Should create emergency booking');

      // Verify second provider cannot accept already accepted emergency
      const secondRes = await request(`/api/v1/emergency-requests/${emergencyId}/respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken2}` },
        body: { action: 'ACCEPT' },
      });
      assert.equal(secondRes.status, 409);
    });
  });

  // =========================================================================
  // 5. LOCAL SHOP MODULE & INVENTORIES
  // =========================================================================
  describe('5. Local Shop Module & Inquiries', () => {
    let testProductId;

    it('should get authenticated shop owner profile via /api/v1/shops/me', async () => {
      const res = await request('/api/v1/shops/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${shopOwnerToken1}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.shopName, 'M4 Hardware & Pipes');
    });

    it('should create product in shop catalog via POST /api/v1/shops/me/products', async () => {
      const res = await request('/api/v1/shops/me/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${shopOwnerToken1}` },
        body: {
          name: 'M4 Product: CPVC 1-inch Pipe (3m)',
          description: 'High pressure CPVC pipe for plumbing lines',
          category: 'Pipes & Fittings',
          price: 250,
          unit: 'pipe',
          stockStatus: 'IN_STOCK',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.name, 'M4 Product: CPVC 1-inch Pipe (3m)');
      assert.equal(res.data.data.priceInPaise, 25000);
      testProductId = res.data.data.id;
    });

    it('should update product stock status via PATCH /api/v1/shops/me/products/:id', async () => {
      const res = await request(`/api/v1/shops/me/products/${testProductId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${shopOwnerToken1}` },
        body: {
          stockStatus: 'OUT_OF_STOCK',
          price: 275,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.stockStatus, 'OUT_OF_STOCK');
      assert.equal(res.data.data.inStock, false);
      assert.equal(res.data.data.price, 275);
    });

    it('should prevent unauthorized merchant from modifying another shops product', async () => {
      const res = await request(`/api/v1/shops/me/products/${testProductId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${shopOwnerToken2}` },
        body: { price: 10 },
      });

      assert.equal(res.status, 404);
    });

    it('should allow customer to send inquiry to shop', async () => {
      const res = await request(`/api/v1/shops/${shopProfile1._id}/inquiries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          customerName: 'M4 Inquiry Customer',
          customerPhone: '+919994440001',
          message: 'Do you have 20 pieces of CPVC 1-inch pipe in stock?',
          itemName: 'CPVC 1-inch Pipe',
          productId: testProductId,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.status, 'PENDING');
    });

    it('should allow shop owner to view received customer inquiries', async () => {
      const res = await request('/api/v1/shops/me/inquiries', {
        method: 'GET',
        headers: { Authorization: `Bearer ${shopOwnerToken1}` },
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 1);
      assert.equal(res.data.data[0].customerName, 'M4 Inquiry Customer');
    });
  });

  // =========================================================================
  // 6. WARRANTY & REVISITS
  // =========================================================================
  describe('6. Warranty Module & Revisits', () => {
    let warrantyBookingId;
    let warrantyCertificateId;

    before(async () => {
      // Create and complete a booking
      const bRes = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Warranty testing job',
          bookingDate: '2026-12-20',
          timeSlot: '01:00 PM - 03:00 PM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 499,
        },
      });
      warrantyBookingId = bRes.data.data._id;
      await request(`/api/v1/bookings/${warrantyBookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      await request(`/api/v1/bookings/${warrantyBookingId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      await request(`/api/v1/bookings/${warrantyBookingId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
        body: { cashCollected: true },
      });
    });

    it('should automatically generate warranty upon booking completion and show in /api/v1/warranties/my', async () => {
      const res = await request('/api/v1/warranties/my', {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken1}` },
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      const targetWarranty = res.data.data.find(
        (w) => w.bookingId?._id?.toString() === warrantyBookingId
      );
      assert.ok(targetWarranty, 'Completed booking should have an auto-generated warranty');
      assert.equal(targetWarranty.status, 'ACTIVE');
      assert.equal(targetWarranty.durationDays, 30);
      warrantyCertificateId = targetWarranty._id;
    });

    it('should submit warranty revisit request via POST /api/v1/warranties/:id/revisits', async () => {
      const res = await request(`/api/v1/warranties/${warrantyCertificateId}/revisits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          reason: 'Pipe started leaking slightly again from joint',
          preferredDate: '2026-12-22',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.revisit.status, 'PENDING');
      assert.match(res.data.data.revisit.reason, /leaking slightly/i);
    });
  });

  // =========================================================================
  // 7. REVIEWS & ELIGIBILITY VALIDATION
  // =========================================================================
  describe('7. Reviews Backend & Eligibility', () => {
    let reviewBookingId;

    before(async () => {
      const bRes = await request('/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          serviceId: testService._id.toString(),
          providerId: providerProfile1._id.toString(),
          problemDescription: 'Review test job',
          bookingDate: '2026-12-24',
          timeSlot: '03:00 PM - 05:00 PM',
          serviceAddress: 'M4 Test Address, Bandra',
          addressPincode: '400050',
          totalAmount: 500,
        },
      });
      reviewBookingId = bRes.data.data._id;
    });

    it('should reject submitting review when booking is not yet COMPLETED', async () => {
      const res = await request('/api/v1/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          bookingId: reviewBookingId,
          rating: 5,
          comment: 'M4 Review: Tried to review too early',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /completed services/i);
    });

    it('should allow customer to review completed booking and update provider rating', async () => {
      // Advance booking to COMPLETED
      await request(`/api/v1/bookings/${reviewBookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      await request(`/api/v1/bookings/${reviewBookingId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
      });
      await request(`/api/v1/bookings/${reviewBookingId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${providerToken1}` },
        body: { cashCollected: true },
      });

      const res = await request('/api/v1/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          bookingId: reviewBookingId,
          rating: 5,
          comment: 'M4 Review: Superb workmanship and fast fix!',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.rating, 5);

      // Verify provider rating recalculated
      const provCheck = await ProviderProfile.findById(providerProfile1._id);
      assert.ok(provCheck.ratingAverage >= 4.0);
    });

    it('should prevent duplicate reviews for the same booking', async () => {
      const res = await request('/api/v1/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken1}` },
        body: {
          bookingId: reviewBookingId,
          rating: 4,
          comment: 'M4 Review: Duplicate review attempt',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /already submitted a review/i);
    });
  });

  // =========================================================================
  // 8. NOTIFICATIONS & BACKGROUND TASKS
  // =========================================================================
  describe('8. Notifications & Background Tasks', () => {
    it('should fetch user notifications and mark them as read', async () => {
      const res = await request('/api/v1/notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken1}` },
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.notifications));

      if (res.data.data.notifications.length > 0) {
        const notifId = res.data.data.notifications[0].id;
        const markRes = await request(`/api/v1/notifications/${notifId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assert.equal(markRes.status, 200);
      }
    });

    it('should execute idempotent scheduled background tasks cleanly', async () => {
      const jobsResult = await SchedulerService.runAllJobs();
      assert.equal(jobsResult.cleanupReservations.success, true);
      assert.equal(jobsResult.emergencyTimeouts.success, true);
      assert.equal(jobsResult.warrantyExpiry.success, true);
      assert.equal(jobsResult.reminders.success, true);
    });
  });
});
