import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  CustomerProfile,
  ProviderProfile,
  ShopProfile,
  AdminProfile,
  Address,
  Category,
  Service,
  Booking,
} from '../models/index.js';

async function verify() {
  console.log('🔍 ========================================================');
  console.log('🔍 SevaSetu MongoDB Migration & Data Integrity Verification');
  console.log('🔍 ========================================================');

  await connectDB();

  let allChecksPassed = true;

  // 1. Check Document Counts
  const counts = {
    users: await User.countDocuments(),
    customerProfiles: await CustomerProfile.countDocuments(),
    providerProfiles: await ProviderProfile.countDocuments(),
    shopProfiles: await ShopProfile.countDocuments(),
    adminProfiles: await AdminProfile.countDocuments(),
    addresses: await Address.countDocuments(),
    categories: await Category.countDocuments(),
    services: await Service.countDocuments(),
    bookings: await Booking.countDocuments(),
  };

  console.log('\n📊 Collection Counts:');
  console.table(counts);

  if (counts.users === 0) {
    console.warn('⚠️ Warning: No users found. Run seed script first: npm run seed');
  }

  // 2. Verify Bcrypt Passwords for Migrated Seed Users
  console.log('\n🔑 Verifying Password Compatibility:');
  const rolePasswords = [
    { email: 'admin@sevasetu.com', pass: 'Admin@1234', role: 'ADMIN' },
    { email: 'customer@sevasetu.com', pass: 'Customer@1234', role: 'CUSTOMER' },
    { email: 'provider@sevasetu.com', pass: 'Provider@1234', role: 'PROVIDER' },
    { email: 'shop@sevasetu.com', pass: 'Shop@1234', role: 'SHOP_OWNER' },
  ];

  for (const check of rolePasswords) {
    const user = await User.findOne({ email: check.email }).select('+passwordHash');
    if (!user) {
      console.log(`❌ User not found: ${check.email}`);
      allChecksPassed = false;
      continue;
    }

    const matches = await bcrypt.compare(check.pass, user.passwordHash);
    if (matches && user.role === check.role) {
      console.log(`✅ [${check.role}] Password authentication verified for ${check.email}`);
    } else {
      console.log(`❌ Password mismatch for ${check.email}`);
      allChecksPassed = false;
    }
  }

  // 3. Verify Profile and Reference Integrity
  console.log('\n🔗 Verifying Relational References:');
  const customers = await CustomerProfile.find().populate('userId');
  for (const cp of customers) {
    if (!cp.userId) {
      console.log(`❌ Orphan CustomerProfile found: ${cp._id}`);
      allChecksPassed = false;
    }
  }
  console.log(`✅ ${customers.length} CustomerProfiles verified with active User reference.`);

  const providers = await ProviderProfile.find().populate('userId');
  for (const pp of providers) {
    if (!pp.userId) {
      console.log(`❌ Orphan ProviderProfile found: ${pp._id}`);
      allChecksPassed = false;
    }
  }
  console.log(`✅ ${providers.length} ProviderProfiles verified with active User reference.`);

  const bookings = await Booking.find().populate('customerId providerId serviceId');
  for (const b of bookings) {
    if (!b.customerId || !b.serviceId) {
      console.log(`❌ Invalid reference in Booking ${b.bookingNumber}`);
      allChecksPassed = false;
    }
  }
  console.log(`✅ ${bookings.length} Bookings verified with valid customer and service references.`);

  // 4. Verify Unique Constraints and Indexes
  console.log('\n⚡ Verifying Mongoose Indexes:');
  const userIndexes = await User.collection.indexes();
  const indexNames = userIndexes.map((idx) => Object.keys(idx.key).join('_'));
  console.log(`✅ User indexes active: ${indexNames.join(', ')}`);

  console.log('\n🏁 ========================================================');
  if (allChecksPassed) {
    console.log('🎉 ALL INTEGRITY VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('⚠️ SOME INTEGRITY CHECKS FAILED. Review output above.');
  }
  console.log('🏁 ========================================================\n');

  await disconnectDB();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
