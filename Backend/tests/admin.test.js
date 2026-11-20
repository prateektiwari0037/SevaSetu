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
  AdminProfile,
  Category,
  Service,
  Booking,
  Complaint,
  SubscriptionPlan,
  Subscription,
  PlatformSetting,
  AuditLog,
} from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/token.js';

let server;
let baseUrl;

let adminUser;
let adminToken;
let customerUser;
let customerToken;
let customerProfile;
let providerUser;
let providerToken;
let providerProfile;
let shopUser;
let shopProfile;

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

describe('SevaSetu Member 5 Admin & Platform Modules Test Suite', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean test data
    await Promise.all([
      User.deleteMany({ email: /@admintest\.com$/ }),
      CustomerProfile.deleteMany({}),
      ProviderProfile.deleteMany({}),
      ShopProfile.deleteMany({}),
      AdminProfile.deleteMany({}),
      Category.deleteMany({ slug: /^test-/ }),
      Service.deleteMany({ slug: /^test-/ }),
      Booking.deleteMany({ bookingNumber: /^BK-TEST/ }),
      Complaint.deleteMany({ ticketNumber: /^CMP-TEST/ }),
      SubscriptionPlan.deleteMany({ slug: /^test-/ }),
      Subscription.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    // 1. Admin User
    adminUser = await User.create({
      fullName: 'Chief Administrator',
      email: 'admin@admintest.com',
      mobile: '+919999000101',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    await AdminProfile.create({ userId: adminUser._id, fullName: 'Chief Administrator' });
    adminToken = generateAccessToken(adminUser);

    // 2. Customer User
    customerUser = await User.create({
      fullName: 'Regular Customer',
      email: 'customer@admintest.com',
      mobile: '+919999000102',
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    customerProfile = await CustomerProfile.create({
      userId: customerUser._id,
      fullName: 'Regular Customer',
    });
    customerToken = generateAccessToken(customerUser);

    // 3. Provider User (Pending Verification)
    providerUser = await User.create({
      fullName: 'Technician Test',
      email: 'provider@admintest.com',
      mobile: '+919999000103',
      passwordHash,
      role: 'PROVIDER',
      accountStatus: 'ACTIVE',
    });
    providerProfile = await ProviderProfile.create({
      userId: providerUser._id,
      fullName: 'Technician Test',
      businessName: 'Test Tech Works',
      verificationStatus: 'PENDING',
      city: 'Mumbai',
    });
    providerToken = generateAccessToken(providerUser);

    // 4. Shop Owner User (Pending Verification)
    shopUser = await User.create({
      fullName: 'Merchant Test',
      email: 'shop@admintest.com',
      mobile: '+919999000104',
      passwordHash,
      role: 'SHOP_OWNER',
      accountStatus: 'ACTIVE',
    });
    shopProfile = await ShopProfile.create({
      userId: shopUser._id,
      shopName: 'Test Spares & Hardware',
      ownerName: 'Merchant Test',
      verificationStatus: 'PENDING_VERIFICATION',
      city: 'Mumbai',
    });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  // -------------------------------------------------------------
  // 1. RBAC & Access Control
  // -------------------------------------------------------------
  describe('Admin Security & RBAC Protection', () => {
    it('rejects unauthenticated requests to /api/v1/admin/dashboard with 401', async () => {
      const res = await request('/api/v1/admin/dashboard');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it('rejects CUSTOMER access to /api/v1/admin/dashboard with 403', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it('rejects PROVIDER access to /api/v1/admin/dashboard with 403', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it('allows ADMIN access to /api/v1/admin/dashboard with 200', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.totalCustomers >= 1);
      assert.ok(res.data.data.cashCollectionSummaries !== undefined);
      assert.ok(res.data.data.platformCommissionSummaries !== undefined);
    });
  });

  // -------------------------------------------------------------
  // 2. User Governance
  // -------------------------------------------------------------
  describe('User Management API', () => {
    it('lists platform users with role filter', async () => {
      const res = await request('/api/v1/admin/users?role=CUSTOMER', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      const hasCustomer = res.data.data.some((u) => u.email === 'customer@admintest.com');
      assert.ok(hasCustomer);
    });

    it('updates user account status to SUSPENDED', async () => {
      const res = await request(`/api/v1/admin/users/${customerUser._id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { accountStatus: 'SUSPENDED', reason: 'Test policy breach' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.accountStatus, 'SUSPENDED');

      // Verify suspended user cannot access protected endpoints
      const checkRes = await request('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(checkRes.status, 403);
    });

    it('reactivates suspended user back to ACTIVE', async () => {
      const res = await request(`/api/v1/admin/users/${customerUser._id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { accountStatus: 'ACTIVE' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.accountStatus, 'ACTIVE');
    });

    it('prevents administrator from self-suspending active account', async () => {
      const res = await request(`/api/v1/admin/users/${adminUser._id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { accountStatus: 'SUSPENDED' },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /cannot suspend their own active account/i);
    });
  });

  // -------------------------------------------------------------
  // 3. Provider KYC Management
  // -------------------------------------------------------------
  describe('Provider KYC Verification', () => {
    it('lists providers and shows pending verification queue', async () => {
      const res = await request('/api/v1/admin/providers?verificationStatus=PENDING', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some((p) => p._id === providerProfile._id.toString()));
    });

    it('approves a provider via POST /api/v1/admin/providers/:id/approve', async () => {
      const res = await request(`/api/v1/admin/providers/${providerProfile._id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { notes: 'Documents verified and certified' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.verificationStatus, 'APPROVED');

      // Verify DB record
      const updated = await ProviderProfile.findById(providerProfile._id);
      assert.equal(updated.verificationStatus, 'APPROVED');
    });

    it('rejects a provider with mandatory rejection reason', async () => {
      // Rejection without reason fails
      const badRes = await request(`/api/v1/admin/providers/${providerProfile._id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {},
      });
      assert.equal(badRes.status, 400);

      // Rejection with reason succeeds
      const res = await request(`/api/v1/admin/providers/${providerProfile._id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { rejectionReason: 'Trade certificate has expired' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.verificationStatus, 'REJECTED');
      assert.equal(res.data.data.rejectionReason, 'Trade certificate has expired');
    });
  });

  // -------------------------------------------------------------
  // 4. Shop Verification Management
  // -------------------------------------------------------------
  describe('Shop Approval Desk', () => {
    it('lists shops awaiting approval', async () => {
      const res = await request('/api/v1/admin/shops', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some((s) => s.shopName === 'Test Spares & Hardware'));
    });

    it('approves storefront via POST /api/v1/admin/shops/:id/approve', async () => {
      const res = await request(`/api/v1/admin/shops/${shopProfile._id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.verificationStatus, 'APPROVED');
    });
  });

  // -------------------------------------------------------------
  // 5. Booking Monitoring & Disputes
  // -------------------------------------------------------------
  describe('Booking Monitoring API', () => {
    let testCategory;
    let testService;
    let testBooking;

    before(async () => {
      testCategory = await Category.create({
        name: 'Test Electrical',
        slug: 'test-electrical',
      });
      testService = await Service.create({
        name: 'Test Wiring Diagnostic',
        slug: 'test-wiring-diagnostic',
        categoryId: testCategory._id,
        basePrice: 350,
      });
      testBooking = await Booking.create({
        bookingNumber: 'BK-TEST-1001',
        customerId: customerProfile._id,
        providerId: providerProfile._id,
        serviceId: testService._id,
        bookingType: 'NORMAL',
        status: 'COMPLETED',
        problemDescription: 'Test circuit check',
        bookingDate: new Date(),
        timeSlot: '10:00 AM - 12:00 PM',
        serviceAddress: '101 Test Colony',
        addressPincode: '400001',
        totalAmount: 350,
        paymentMethod: 'CASH_ON_SERVICE',
        isPaid: true,
      });
    });

    it('retrieves all platform bookings with summary metrics', async () => {
      const res = await request('/api/v1/admin/bookings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some((b) => b.bookingNumber === 'BK-TEST-1001'));
      assert.ok(res.data.summary.totalVolume >= 350);
    });

    it('prevents destructive deletion of a category referenced by historical bookings', async () => {
      const res = await request(`/api/v1/categories/${testCategory._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.match(res.data.message, /disabled instead of deleted to protect order history/i);

      // Verify category was deactivated rather than deleted
      const catInDb = await Category.findById(testCategory._id);
      assert.ok(catInDb);
      assert.equal(catInDb.isActive, false);
    });
  });

  // -------------------------------------------------------------
  // 6. Complaints Resolution Desk
  // -------------------------------------------------------------
  describe('Complaint Management Workflow', () => {
    let complaintTicket;

    it('allows customer to submit a new complaint ticket', async () => {
      const res = await request('/api/v1/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          category: 'BILLING',
          title: 'Incorrect fee requested by technician',
          description: 'Technician demanded additional cash beyond fixed catalogue price.',
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.data.ticketNumber.startsWith('CMP-'));
      assert.equal(res.data.data.status, 'OPEN');
      complaintTicket = res.data.data;
    });

    it('admin views complaint in queue', async () => {
      const res = await request('/api/v1/admin/complaints', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some((c) => c.ticketNumber === complaintTicket.ticketNumber));
    });

    it('admin posts a message on the complaint thread', async () => {
      const res = await request(`/api/v1/admin/complaints/${complaintTicket._id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { message: 'We have initiated an inquiry with the service provider.' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.senderRole, 'ADMIN');

      // Verify status advanced to IN_REVIEW
      const updated = await Complaint.findById(complaintTicket._id);
      assert.equal(updated.status, 'IN_REVIEW');
    });

    it('admin resolves the complaint ticket with resolution notes', async () => {
      const res = await request(`/api/v1/admin/complaints/${complaintTicket._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          status: 'RESOLVED',
          resolution: 'Warning issued to technician; customer compensated with free next visit.',
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'RESOLVED');
      assert.equal(
        res.data.data.resolution.notes,
        'Warning issued to technician; customer compensated with free next visit.'
      );
    });
  });

  // -------------------------------------------------------------
  // 7. Subscriptions & Plans Management
  // -------------------------------------------------------------
  describe('Subscription Management Workflow', () => {
    let createdPlan;
    let customerSub;

    it('admin creates a configurable subscription plan', async () => {
      const res = await request('/api/v1/admin/subscription-plans', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Test Gold Home Care',
          slug: 'test-gold-care',
          tier: 'GOLD',
          price: 1199,
          durationDays: 90,
          serviceLimit: 3,
          features: ['3 Free Visits', 'Priority Dispatch'],
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.slug, 'test-gold-care');
      assert.equal(res.data.data.price, 1199);
      createdPlan = res.data.data;
    });

    it('customer subscribes to plan with Cash / Offline collection', async () => {
      const res = await request('/api/v1/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { planId: createdPlan._id, paymentMethod: 'CASH' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.status, 'ACTIVE');
      assert.equal(res.data.data.servicesRemaining, 3);
      customerSub = res.data.data;
    });

    it('admin views all active platform subscriptions', async () => {
      const res = await request('/api/v1/admin/subscriptions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some((s) => s._id === customerSub._id));
    });

    it('admin approves and verifies manual payment for a subscription', async () => {
      const res = await request(`/api/v1/admin/subscriptions/${customerSub._id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { approvalNotes: 'Cash collected by authorized agent' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'ACTIVE');
    });

    it('customer can cancel active subscription', async () => {
      const res = await request(`/api/v1/subscriptions/${customerSub._id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'CANCELLED');
    });
  });

  // -------------------------------------------------------------
  // 8. Platform Reports & Aggregations
  // -------------------------------------------------------------
  describe('Analytics & Platform Reports API', () => {
    it('returns MongoDB aggregations for demand, cash collections, and users', async () => {
      const res = await request('/api/v1/admin/reports', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.usersByRole !== undefined);
      assert.ok(res.data.data.bookingsByStatus !== undefined);
      assert.ok(res.data.data.cashCollection !== undefined);
      assert.ok(res.data.data.providerStats !== undefined);
    });
  });

  // -------------------------------------------------------------
  // 9. Platform Settings & Audit Logs
  // -------------------------------------------------------------
  describe('Platform Settings & Audit Logs API', () => {
    it('updates platform commission percentage setting', async () => {
      const res = await request('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { key: 'platformCommissionPct', value: '12', description: 'Updated commission' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.value, '12');

      // Verify setting read
      const getRes = await request('/api/v1/admin/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(getRes.status, 200);
      assert.ok(getRes.data.data.some((s) => s.key === 'platformCommissionPct' && s.value === '12'));
    });

    it('retrieves recorded administrative audit logs', async () => {
      const res = await request('/api/v1/admin/audit-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length > 0);
      const actions = res.data.data.map((l) => l.action);
      assert.ok(actions.includes('ADMIN_UPDATE_PLATFORM_SETTING'));
    });
  });
});
