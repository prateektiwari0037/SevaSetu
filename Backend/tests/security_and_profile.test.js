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
  AdminProfile,
  Address,
  RefreshSession,
} from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/token.js';

let server;
let baseUrl;

let customerUser;
let customerToken;
let providerUser;
let providerToken;
let adminUser;
let adminToken;
let otherCustomerUser;
let otherCustomerToken;

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

describe('SevaSetu Security, Authorization & Address Tests', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    await Promise.all([
      User.deleteMany({ email: /@securitytest\.com$/ }),
      CustomerProfile.deleteMany({}),
      Address.deleteMany({}),
      RefreshSession.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash('SecurePass@123', 10);

    // 1. Create Customer
    customerUser = await User.create({
      fullName: 'Security Customer',
      email: 'cust@securitytest.com',
      mobile: '+919833300001',
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
    });
    await CustomerProfile.create({ userId: customerUser._id, fullName: 'Security Customer' });
    customerToken = generateAccessToken(customerUser);

    // 2. Create Provider
    providerUser = await User.create({
      fullName: 'Security Provider',
      email: 'prov@securitytest.com',
      mobile: '+919833300002',
      passwordHash,
      role: 'PROVIDER',
      accountStatus: 'ACTIVE',
    });
    await ProviderProfile.create({
      userId: providerUser._id,
      fullName: 'Security Provider',
      verificationStatus: 'APPROVED',
    });
    providerToken = generateAccessToken(providerUser);

    // 3. Create Admin
    adminUser = await User.create({
      fullName: 'Security Admin',
      email: 'admin@securitytest.com',
      mobile: '+919833300003',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });
    await AdminProfile.create({ userId: adminUser._id, fullName: 'Security Admin' });
    adminToken = generateAccessToken(adminUser);

    // 4. Create Another Customer (for cross-user ownership tests)
    otherCustomerUser = await User.create({
      fullName: 'Other Customer',
      email: 'other@securitytest.com',
      mobile: '+919833300004',
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
    });
    await CustomerProfile.create({ userId: otherCustomerUser._id, fullName: 'Other Customer' });
    otherCustomerToken = generateAccessToken(otherCustomerUser);

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

  // 1. Authorization & Role Guard Tests
  describe('Role-Based Authorization', () => {
    it('should block unauthenticated requests to protected routes with 401', async () => {
      const res = await request('/api/v1/users/me');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it('should block CUSTOMER from accessing ADMIN endpoints with 403', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Access denied/i);
    });

    it('should block PROVIDER from accessing ADMIN endpoints with 403', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Access denied/i);
    });

    it('should allow ADMIN to access ADMIN endpoints with 200', async () => {
      const res = await request('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });
  });

  // 2. Profile Management
  describe('User Profile APIs', () => {
    it('should retrieve current user profile (/api/v1/users/me)', async () => {
      const res = await request('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.email, 'cust@securitytest.com');
      assert.equal(res.data.data.passwordHash, undefined);
    });

    it('should update user profile fields (/api/v1/users/me)', async () => {
      const res = await request('/api/v1/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          fullName: 'Security Customer Updated',
          preferredLanguage: 'hi',
          bio: 'Updated homeowner bio',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.fullName, 'Security Customer Updated');
      assert.equal(res.data.data.preferredLanguage, 'hi');
    });
  });

  // 3. Address Management & Ownership Isolation
  describe('Address Management & Cross-User Ownership', () => {
    let createdAddressId;

    it('should create an address with manual fields (no GPS / no maps)', async () => {
      const res = await request('/api/v1/users/me/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          label: 'Home',
          addressLine: 'Flat 101, Galaxy Tower',
          landmark: 'Opposite City Mall',
          area: 'Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
          isDefault: true,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.addressLine, 'Flat 101, Galaxy Tower');
      assert.equal(res.data.data.area, 'Andheri West');
      assert.equal(res.data.data.city, 'Mumbai');
      assert.equal(res.data.data.pincode, '400053');
      assert.equal(res.data.data.isDefault, true);

      createdAddressId = res.data.data._id;
    });

    it('should retrieve user address list', async () => {
      const res = await request('/api/v1/users/me/addresses', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.equal(res.data.data.length, 1);
    });

    it('should prevent another user from updating or deleting this address (ownership check)', async () => {
      // Attempt update as otherCustomerUser
      const updateRes = await request(`/api/v1/users/me/addresses/${createdAddressId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${otherCustomerToken}` },
        body: { addressLine: 'Hacked address line' },
      });

      assert.equal(updateRes.status, 404); // 404 unauthorized (cannot find address under other user)

      // Attempt delete as otherCustomerUser
      const deleteRes = await request(`/api/v1/users/me/addresses/${createdAddressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${otherCustomerToken}` },
      });

      assert.equal(deleteRes.status, 404);

      // Verify the address was NOT modified
      const checkAddress = await Address.findById(createdAddressId);
      assert.equal(checkAddress.addressLine, 'Flat 101, Galaxy Tower');
    });

    it('should allow the owner to update the address', async () => {
      const res = await request(`/api/v1/users/me/addresses/${createdAddressId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { landmark: 'Near Link Road Metro' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.landmark, 'Near Link Road Metro');
    });

    it('should allow the owner to delete the address', async () => {
      const res = await request(`/api/v1/users/me/addresses/${createdAddressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.equal(res.status, 200);

      const checkAddress = await Address.findById(createdAddressId);
      assert.equal(checkAddress, null);
    });
  });

  // 4. Change Password & Invalidate Sessions
  describe('Change Password & Revoke Sessions', () => {
    it('should reject password change when current password is wrong', async () => {
      const res = await request('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          currentPassword: 'WrongPassword@999',
          newPassword: 'UpdatedSecurePass@123',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /Current password is incorrect/i);
    });

    it('should successfully change password with valid current password', async () => {
      const res = await request('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          currentPassword: 'SecurePass@123',
          newPassword: 'UpdatedSecurePass@123',
          confirmPassword: 'UpdatedSecurePass@123',
        },
      });

      assert.equal(res.status, 200);

      // Verify login with new password
      const loginRes = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'cust@securitytest.com',
          password: 'UpdatedSecurePass@123',
        },
      });

      assert.equal(loginRes.status, 200);
    });
  });

  // 5. NoSQL Injection & Sanitization
  describe('Security: Sanitization & NoSQL Injection Protection', () => {
    it('should strip operator injection from request payload', async () => {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: { $gt: '' },
          password: 'password',
        },
      });

      // The sanitizer strips $gt, so email is empty, resulting in 400 validation error
      assert.equal(res.status, 400);
    });
  });
});
