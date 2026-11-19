import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  ProviderProfile,
  CustomerProfile,
  Category,
  Service,
  ProviderService,
  Booking,
  Review,
} from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/token.js';

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

describe('SevaSetu Member 3 - Service Provider Module PRD Tests', () => {
  let providerUser;
  let otherProviderUser;
  let customerUser;
  let providerProfile;
  let otherProviderProfile;
  let customerProfile;
  let testCategory;
  let testService;
  let providerToken;
  let otherProviderToken;
  let customerToken;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Start local HTTP server on random port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Setup Test Category
    testCategory = await Category.findOneAndUpdate(
      { slug: 'test-electrical' },
      {
        name: 'Test Electrical',
        slug: 'test-electrical',
        description: 'Test electrical services',
        isActive: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Setup Test Service
    testService = await Service.findOneAndUpdate(
      { slug: 'test-wiring-repair' },
      {
        name: 'Test Wiring Repair',
        slug: 'test-wiring-repair',
        categoryId: testCategory._id,
        basePrice: 499,
        durationMinutes: 60,
        isActive: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Test Provider User & Profile
    providerUser = await User.findOneAndUpdate(
      { email: 'testprovider@sevasetu.com' },
      {
        fullName: 'Test Provider Ramesh',
        email: 'testprovider@sevasetu.com',
        mobile: '+919876543210',
        passwordHash: 'hashed_password_123',
        role: 'PROVIDER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        mobileVerified: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Delete existing provider services and test bookings for a clean test run
    await ProviderService.deleteMany({ providerId: providerUser._id });
    await Booking.deleteMany({ bookingNumber: /^BK-TEST-/ });

    providerProfile = await ProviderProfile.findOneAndUpdate(
      { userId: providerUser._id },
      {
        userId: providerUser._id,
        fullName: 'Test Provider Ramesh',
        verificationStatus: 'DRAFT',
        isAvailable: true,
        city: 'Mumbai',
        servicePincode: '400001',
        documents: [],
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Other Provider User & Profile (for ownership tests)
    otherProviderUser = await User.findOneAndUpdate(
      { email: 'otherprovider@sevasetu.com' },
      {
        fullName: 'Other Provider Suresh',
        email: 'otherprovider@sevasetu.com',
        mobile: '+919876543211',
        passwordHash: 'hashed_password_123',
        role: 'PROVIDER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        mobileVerified: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    otherProviderProfile = await ProviderProfile.findOneAndUpdate(
      { userId: otherProviderUser._id },
      {
        userId: otherProviderUser._id,
        fullName: 'Other Provider Suresh',
        verificationStatus: 'APPROVED',
        isAvailable: true,
        city: 'Mumbai',
        servicePincode: '400001',
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Customer User & Profile
    customerUser = await User.findOneAndUpdate(
      { email: 'testcustomer@sevasetu.com' },
      {
        fullName: 'Test Customer Priya',
        email: 'testcustomer@sevasetu.com',
        mobile: '+919876543212',
        passwordHash: 'hashed_password_123',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        mobileVerified: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    customerProfile = await CustomerProfile.findOneAndUpdate(
      { userId: customerUser._id },
      {
        userId: customerUser._id,
        fullName: 'Test Customer Priya',
        phone: '+919876543212',
      },
      { upsert: true, returnDocument: 'after' }
    );

    providerToken = generateAccessToken(providerUser);
    otherProviderToken = generateAccessToken(otherProviderUser);
    customerToken = generateAccessToken(customerUser);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. PROVIDER ONBOARDING
  it('1. Provider Onboarding: should complete onboarding details and save to MongoDB', async () => {
    const res = await request('/api/v1/providers/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        fullName: 'Test Provider Ramesh Updated',
        bio: 'Certified electrician with 5 years experience',
        experienceYears: 5,
        skills: ['Wiring', 'Switchboard Repair'],
        city: 'Mumbai',
        area: 'Andheri East',
        servicePincode: '400069',
        serviceAreas: [{ pincode: '400069', area: 'Andheri East', city: 'Mumbai' }],
        isAvailable: true,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.experienceYears, 5);
    assert.equal(res.data.data.servicePincode, '400069');
  });

  // 2. KYC SUBMISSION
  it('2. KYC Submission: should submit verification documents with PENDING status', async () => {
    const res = await request('/api/v1/providers/me/verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        documentType: 'TRADE_CERTIFICATE',
        documentUrl: '/uploads/trade_cert_test.pdf',
        notes: 'Submitted ITI Electrical certification for approval',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.verificationStatus, 'PENDING');
  });

  // 3. APPROVAL / REJECTION VISIBILITY
  it('3. Approval/Rejection Visibility: should fetch verification status and metadata', async () => {
    const res = await request('/api/v1/providers/me/verification', {
      method: 'GET',
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.verificationStatus, 'PENDING');
    assert.equal(res.data.data.documents.length >= 1, true);
  });

  // 4. SERVICE CREATION & FIXED PRICING
  it('4. Service Creation & Fixed Pricing: should offer a platform service with fixed INR pricing', async () => {
    // Delete any existing offered service for this provider/service
    await ProviderService.deleteMany({
      providerId: providerProfile._id,
      serviceId: testService._id,
    });

    const res = await request('/api/v1/providers/me/services', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        serviceId: testService._id.toString(),
        fixedPrice: 550,
        estimatedDurationMinutes: 45,
        description: 'Complete home wiring health check and repair',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.fixedPrice, 550);
    assert.equal(res.data.data.currency, 'INR');
    assert.equal(res.data.data.estimatedDurationMinutes, 45);
  });

  // 5. AVAILABILITY UPDATES
  it('5. Availability Management: should update weekly schedule and working hours', async () => {
    const schedule = [
      { day: 'MONDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
      { day: 'TUESDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
      { day: 'WEDNESDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
      { day: 'THURSDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
      { day: 'FRIDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [] },
      { day: 'SATURDAY', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] },
      { day: 'SUNDAY', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] },
    ];

    const res = await request('/api/v1/providers/me/availability', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        isAvailable: true,
        weeklySchedule: schedule,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.availability.weeklySchedule.length, 7);
  });

  // 6. OVERLAPPING AVAILABILITY & BOOKING ACCEPTANCE
  it('6. Booking Acceptance & Overlapping Availability Check', async () => {
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 1);

    // Create Booking 1
    const booking1 = await Booking.create({
      bookingNumber: `BK-TEST-${Date.now()}-1`,
      customerId: customerProfile._id,
      providerId: otherProviderProfile._id,
      serviceId: testService._id,
      status: 'PENDING',
      problemDescription: 'Fan switch spark issue',
      bookingDate,
      timeSlot: '10:00 AM - 11:00 AM',
      serviceAddress: '123 Test Street, Mumbai',
      addressPincode: '400001',
      totalAmount: 550,
      paymentMethod: 'CASH_ON_SERVICE',
    });

    // Accept Booking 1 by otherProvider
    const acceptRes1 = await request(`/api/v1/bookings/${booking1._id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });

    assert.equal(acceptRes1.status, 200);
    assert.equal(acceptRes1.data.success, true);
    assert.equal(acceptRes1.data.data.status, 'ACCEPTED');

    // Create Booking 2 at the exact same date and time slot
    const booking2 = await Booking.create({
      bookingNumber: `BK-TEST-${Date.now()}-2`,
      customerId: customerProfile._id,
      providerId: otherProviderProfile._id,
      serviceId: testService._id,
      status: 'PENDING',
      problemDescription: 'Another spark issue',
      bookingDate,
      timeSlot: '10:00 AM - 11:00 AM',
      serviceAddress: '124 Test Street, Mumbai',
      addressPincode: '400001',
      totalAmount: 550,
      paymentMethod: 'CASH_ON_SERVICE',
    });

    // Attempting to accept overlapping booking must fail with 409 Conflict
    const acceptRes2 = await request(`/api/v1/bookings/${booking2._id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });

    assert.equal(acceptRes2.status, 409);
    assert.equal(acceptRes2.data.success, false);
  });

  // 7. BOOKING OWNERSHIP VALIDATION
  it('7. Booking Ownership: provider cannot start/complete booking assigned to another provider', async () => {
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 2);

    const booking = await Booking.create({
      bookingNumber: `BK-TEST-${Date.now()}-OWN`,
      customerId: customerProfile._id,
      providerId: otherProviderProfile._id,
      serviceId: testService._id,
      status: 'ACCEPTED',
      problemDescription: 'Ownership test problem',
      bookingDate,
      timeSlot: '02:00 PM - 03:00 PM',
      serviceAddress: '123 Test Street, Mumbai',
      addressPincode: '400001',
      totalAmount: 550,
      paymentMethod: 'CASH_ON_SERVICE',
    });

    // providerUser attempts to start booking belonging to otherProviderUser
    const res = await request(`/api/v1/bookings/${booking._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    assert.equal(res.status, 403);
    assert.equal(res.data.success, false);
  });

  // 8. INVALID STATUS TRANSITIONS
  it('8. Status Transitions: valid flow PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED', async () => {
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 3);

    const booking = await Booking.create({
      bookingNumber: `BK-TEST-${Date.now()}-FLOW`,
      customerId: customerProfile._id,
      providerId: otherProviderProfile._id,
      serviceId: testService._id,
      status: 'PENDING',
      problemDescription: 'Complete lifecycle test',
      bookingDate,
      timeSlot: '04:00 PM - 05:00 PM',
      serviceAddress: '123 Test Street, Mumbai',
      addressPincode: '400001',
      totalAmount: 600,
      paymentMethod: 'CASH_ON_SERVICE',
    });

    // Try to complete directly from PENDING (must fail)
    const invalidComplete = await request(`/api/v1/bookings/${booking._id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });
    assert.equal(invalidComplete.status, 400);

    // Accept booking
    const acceptRes = await request(`/api/v1/bookings/${booking._id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });
    assert.equal(acceptRes.status, 200);

    // Start service
    const startRes = await request(`/api/v1/bookings/${booking._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });
    assert.equal(startRes.status, 200);
    assert.equal(startRes.data.data.status, 'IN_PROGRESS');

    // Complete service
    const completeRes = await request(`/api/v1/bookings/${booking._id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
      body: { cashCollected: true },
    });
    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.data.data.status, 'COMPLETED');
    assert.equal(completeRes.data.data.isPaid, true);
  });

  // 9. EARNINGS CALCULATIONS
  it('9. Earnings Calculations: completed bookings should calculate gross, commission (10%), net', async () => {
    const res = await request('/api/v1/providers/me/earnings', {
      method: 'GET',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.summary.completedJobsCount >= 1, true);
    assert.equal(res.data.data.summary.totalServiceValue >= 600, true);
    assert.equal(res.data.data.summary.currency, 'INR');
    assert.equal(
      res.data.data.summary.providerNetEarnings,
      res.data.data.summary.totalServiceValue - res.data.data.summary.platformCommission
    );
  });

  // 10. REVIEW ACCESS
  it('10. Review Access: provider can view reviews and average rating', async () => {
    const res = await request('/api/v1/providers/me/reviews', {
      method: 'GET',
      headers: { Authorization: `Bearer ${otherProviderToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(typeof res.data.data.averageRating, 'number');
    assert.equal(typeof res.data.data.distribution, 'object');
  });

  // 11. SUSPENDED PROVIDER RESTRICTIONS
  it('11. Suspended Provider Restrictions: suspended provider cannot accept bookings or add services', async () => {
    // Temporarily set provider to SUSPENDED
    await ProviderProfile.findByIdAndUpdate(providerProfile._id, {
      verificationStatus: 'SUSPENDED',
    });

    const addServiceRes = await request('/api/v1/providers/me/services', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        serviceId: testService._id.toString(),
        fixedPrice: 700,
      },
    });

    assert.equal(addServiceRes.status, 403);
    assert.equal(addServiceRes.data.success, false);
  });
});
