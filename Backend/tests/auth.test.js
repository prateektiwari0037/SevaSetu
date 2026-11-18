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
  RefreshSession,
} from '../src/models/index.js';
import emailService from '../src/services/email.service.js';

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

describe('SevaSetu Auth & User Migration Tests', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean test data
    await Promise.all([
      User.deleteMany({ email: /@test\.com$/ }),
      CustomerProfile.deleteMany({}),
      ProviderProfile.deleteMany({}),
      ShopProfile.deleteMany({}),
      RefreshSession.deleteMany({}),
    ]);

    // Start HTTP server on random free port
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

  // 1. Customer Registration
  describe('Customer Registration', () => {
    it('should register a customer with valid fields and return safe user data', async () => {
      emailService.clearSentEmails();

      const res = await request('/api/v1/auth/register/customer', {
        method: 'POST',
        body: {
          fullName: 'Test Customer',
          email: 'cust1@test.com',
          mobile: '+919811100001',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.user.role, 'CUSTOMER');
      assert.equal(res.data.data.user.email, 'cust1@test.com');
      assert.equal(res.data.data.user.passwordHash, undefined); // Never leak passwordHash
      assert.ok(res.data.data.token, 'Access token must be returned');
      assert.equal(res.data.data.dashboardDestination, '/customer/dashboard');

      // Verify email was dispatched to dev transport
      const emails = emailService.getSentEmails();
      assert.ok(emails.length > 0);
      assert.equal(emails[emails.length - 1].to, 'cust1@test.com');
    });

    it('should prevent duplicate registration with existing email', async () => {
      const res = await request('/api/v1/auth/register/customer', {
        method: 'POST',
        body: {
          fullName: 'Test Customer Dup',
          email: 'cust1@test.com',
          mobile: '+919811100099',
          password: 'Password@123',
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already exists/i);
    });

    it('should prevent duplicate registration with existing mobile', async () => {
      const res = await request('/api/v1/auth/register/customer', {
        method: 'POST',
        body: {
          fullName: 'Test Customer Dup Mobile',
          email: 'cust2@test.com',
          mobile: '+919811100001',
          password: 'Password@123',
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already exists/i);
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const res = await request('/api/v1/auth/register/customer', {
        method: 'POST',
        body: {
          fullName: 'Short Pass',
          email: 'shortpass@test.com',
          mobile: '+919811100002',
          password: '123',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /at least 8 characters/i);
    });
  });

  // 2. Provider Registration
  describe('Provider Registration', () => {
    it('should register a provider with PENDING_VERIFICATION status', async () => {
      const res = await request('/api/v1/auth/register/provider', {
        method: 'POST',
        body: {
          fullName: 'Test Electrician',
          email: 'provider1@test.com',
          mobile: '+919811100003',
          password: 'Password@123',
          businessName: 'Quick Wire Solutions',
          primaryCategory: 'Electrical',
          skills: ['Wiring', 'Lighting', 'MCB'],
          experienceYears: 5,
          city: 'Mumbai',
          area: 'Andheri West',
          servicePincode: '400053',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.user.role, 'PROVIDER');
      assert.equal(res.data.data.dashboardDestination, '/provider/dashboard');

      const profile = await ProviderProfile.findOne({ userId: res.data.data.user.id });
      assert.ok(profile);
      assert.equal(profile.verificationStatus, 'PENDING_VERIFICATION');
      assert.equal(profile.businessName, 'Quick Wire Solutions');
    });
  });

  // 3. Shop Owner Registration
  describe('Shop Owner Registration', () => {
    it('should register a shop owner with storefront record', async () => {
      const res = await request('/api/v1/auth/register/shop-owner', {
        method: 'POST',
        body: {
          ownerName: 'Test Merchant',
          email: 'shop1@test.com',
          mobile: '+919811100004',
          password: 'Password@123',
          shopName: 'Metro Hardware & Electricals',
          shopCategory: 'Hardware',
          streetAddress: 'Shop 4, Station Road',
          city: 'Mumbai',
          area: 'Bandra',
          pincode: '400050',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.user.role, 'SHOP_OWNER');
      assert.equal(res.data.data.dashboardDestination, '/shop/dashboard');

      const shop = await ShopProfile.findOne({ userId: res.data.data.user.id });
      assert.ok(shop);
      assert.equal(shop.shopName, 'Metro Hardware & Electricals');
      assert.equal(shop.verificationStatus, 'PENDING_VERIFICATION');
    });
  });

  // 4. Role Escalation Prevention
  describe('Security: Public Role Escalation Prevention', () => {
    it('should reject direct public registration as ADMIN', async () => {
      const res = await request('/api/v1/auth/register', {
        method: 'POST',
        body: {
          fullName: 'Malicious Actor',
          email: 'hacker@test.com',
          mobile: '+919811100099',
          password: 'Password@123',
          role: 'ADMIN',
        },
      });

      assert.equal(res.status, 403);
      assert.match(res.data.message, /not permitted/i);
    });
  });

  // 5. Unified Login System
  describe('Unified Login System', () => {
    it('should authenticate user with email and valid password', async () => {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust1@test.com',
          password: 'Password@123',
        },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.token);
      assert.ok(res.data.data.refreshToken);
      assert.equal(res.data.data.user.email, 'cust1@test.com');
      assert.equal(res.data.data.dashboardDestination, '/customer/dashboard');
    });

    it('should authenticate user with mobile number and valid password', async () => {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          mobile: '+919811100001',
          password: 'Password@123',
        },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.token);
      assert.equal(res.data.data.user.mobile, '+919811100001');
    });

    it('should reject invalid password', async () => {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust1@test.com',
          password: 'WrongPassword@999',
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it('should block login if accountStatus is SUSPENDED', async () => {
      await User.findOneAndUpdate({ email: 'cust1@test.com' }, { accountStatus: 'SUSPENDED' });

      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust1@test.com',
          password: 'Password@123',
        },
      });

      assert.equal(res.status, 403);
      assert.match(res.data.message, /suspended/i);

      // Restore active status
      await User.findOneAndUpdate({ email: 'cust1@test.com' }, { accountStatus: 'ACTIVE' });
    });
  });

  // 6. Session Management & Refresh Rotation
  describe('Session Management & Refresh Rotation', () => {
    it('should rotate refresh token and issue new access token', async () => {
      const loginRes = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust1@test.com',
          password: 'Password@123',
        },
      });

      const initialRefreshToken = loginRes.data.data.refreshToken;
      assert.ok(initialRefreshToken);

      const refreshRes = await request('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: initialRefreshToken },
      });

      assert.equal(refreshRes.status, 200);
      assert.ok(refreshRes.data.data.token);
      assert.ok(refreshRes.data.data.refreshToken);
      assert.notEqual(refreshRes.data.data.refreshToken, initialRefreshToken);

      // The old refresh token should now be revoked and rejected
      const retryOldRes = await request('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: initialRefreshToken },
      });

      assert.equal(retryOldRes.status, 401);
    });

    it('should revoke session on logout', async () => {
      const loginRes = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust1@test.com',
          password: 'Password@123',
        },
      });

      const refreshToken = loginRes.data.data.refreshToken;

      const logoutRes = await request('/api/v1/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });

      assert.equal(logoutRes.status, 200);

      // Attempting to refresh with logged-out token must fail
      const refreshRes = await request('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });

      assert.equal(refreshRes.status, 401);
    });
  });

  // 7. Password Reset & Verification Flow
  describe('Password Management Flow', () => {
    it('should handle forgot password and reset password with cryptographic token', async () => {
      emailService.clearSentEmails();

      const forgotRes = await request('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: { email: 'cust1@test.com' },
      });

      assert.equal(forgotRes.status, 200);

      const lastEmail = emailService.getLastSentEmail();
      assert.ok(lastEmail);
      assert.equal(lastEmail.type, 'PASSWORD_RESET');

      // Extract token from email text
      const tokenMatch = lastEmail.text.match(/reset token is:\s*([a-f0-9]{64})/i);
      assert.ok(tokenMatch, 'Reset token should be present in development email body');
      const resetToken = tokenMatch[1];

      // Reset password using the token
      const resetRes = await request('/api/v1/auth/reset-password', {
        method: 'POST',
        body: {
          token: resetToken,
          newPassword: 'BrandNewPassword@456',
          confirmPassword: 'BrandNewPassword@456',
        },
      });

      assert.equal(resetRes.status, 200);

      // Login with old password must fail
      const oldLogin = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'cust1@test.com', password: 'Password@123' },
      });
      assert.equal(oldLogin.status, 401);

      // Login with new password must succeed
      const newLogin = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'cust1@test.com', password: 'BrandNewPassword@456' },
      });
      assert.equal(newLogin.status, 200);
    });
  });

  // 8. Email Verification
  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      emailService.clearSentEmails();

      await request('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: { email: 'cust1@test.com' },
      });

      const lastEmail = emailService.getLastSentEmail();
      assert.ok(lastEmail);
      const tokenMatch = lastEmail.text.match(/verification token:\s*([a-f0-9]{64})/i);
      assert.ok(tokenMatch);
      const token = tokenMatch[1];

      const verifyRes = await request('/api/v1/auth/verify-email', {
        method: 'POST',
        body: { token, email: 'cust1@test.com' },
      });

      assert.equal(verifyRes.status, 200);

      const user = await User.findOne({ email: 'cust1@test.com' });
      assert.equal(user.emailVerified, true);
    });
  });
});
