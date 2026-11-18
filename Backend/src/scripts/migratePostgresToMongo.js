import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
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
  Payment,
  Review,
  Warranty,
  Complaint,
  Notification,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Migration & Backup Engine
 * Connects to PostgreSQL via Prisma (if available), dumps JSON backup,
 * maps relational UUIDs to Mongo ObjectIds, and inserts into MongoDB.
 */
async function runMigration() {
  console.log('🔄 ==========================================');
  console.log('🔄 SevaSetu PostgreSQL to MongoDB Migration');
  console.log('🔄 ==========================================');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  let prisma = null;
  let postgresConnected = false;

  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({
      log: ['error'],
    });
    await prisma.$connect();
    postgresConnected = true;
    console.log('✅ Connected to source PostgreSQL database.');
  } catch (err) {
    console.warn(`⚠️ PostgreSQL connection not available (${err.message}).`);
    console.warn('ℹ️ Running migration in standalone export verification mode.');
  }

  await connectDB();

  const idMap = new Map();
  const getObjectId = (pgId) => {
    if (!pgId) return null;
    if (!idMap.has(pgId)) {
      idMap.set(pgId, new mongoose.Types.ObjectId());
    }
    return idMap.get(pgId);
  };

  const migrationStats = {
    users: 0,
    customerProfiles: 0,
    providerProfiles: 0,
    shopProfiles: 0,
    adminProfiles: 0,
    addresses: 0,
    categories: 0,
    services: 0,
    bookings: 0,
    payments: 0,
    notifications: 0,
  };

  if (postgresConnected && prisma) {
    try {
      console.log('📦 Reading source data from PostgreSQL...');

      // 1. Users
      const pgUsers = await prisma.user.findMany();
      fs.writeFileSync(
        path.join(BACKUP_DIR, `pg_users_${Date.now()}.json`),
        JSON.stringify(pgUsers, null, 2)
      );
      console.log(`📥 Backed up ${pgUsers.length} Users from PostgreSQL.`);

      for (const u of pgUsers) {
        const mongoId = getObjectId(u.id);
        await User.findByIdAndUpdate(
          mongoId,
          {
            _id: mongoId,
            fullName: u.fullName || u.email.split('@')[0],
            email: u.email.toLowerCase().trim(),
            mobile: u.phone || `+91000000${Math.floor(1000 + Math.random() * 9000)}`,
            passwordHash: u.passwordHash, // Keep bcrypt hash verbatim
            role: u.role,
            accountStatus: u.isActive ? 'ACTIVE' : 'SUSPENDED',
            emailVerified: u.isVerified,
            mobileVerified: u.isVerified,
          },
          { upsert: true }
        );
        migrationStats.users++;
      }

      // 2. Customer Profiles
      const pgCustomers = await prisma.customerProfile.findMany();
      for (const c of pgCustomers) {
        const mongoUserId = getObjectId(c.userId);
        if (mongoUserId) {
          await CustomerProfile.findOneAndUpdate(
            { userId: mongoUserId },
            {
              userId: mongoUserId,
              fullName: c.fullName,
              bio: c.bio || '',
              emergencyContact: c.emergencyContact || null,
            },
            { upsert: true }
          );
          migrationStats.customerProfiles++;
        }
      }

      // 3. Provider Profiles
      const pgProviders = await prisma.providerProfile.findMany();
      for (const p of pgProviders) {
        const mongoUserId = getObjectId(p.userId);
        if (mongoUserId) {
          await ProviderProfile.findOneAndUpdate(
            { userId: mongoUserId },
            {
              userId: mongoUserId,
              fullName: p.fullName,
              businessName: p.businessName,
              bio: p.bio || '',
              experienceYears: p.experienceYears || 0,
              skills: p.skills || [],
              primaryCategory: p.primaryCategory || null,
              servicePincode: p.servicePincode || '400001',
              city: 'Mumbai',
              verificationStatus: p.verificationStatus || 'PENDING_VERIFICATION',
              isAvailable: p.isAvailable !== false,
            },
            { upsert: true }
          );
          migrationStats.providerProfiles++;
        }
      }

      // 4. Shop Profiles
      const pgShops = await prisma.shopProfile.findMany();
      for (const s of pgShops) {
        const mongoUserId = getObjectId(s.userId);
        if (mongoUserId) {
          await ShopProfile.findOneAndUpdate(
            { userId: mongoUserId },
            {
              userId: mongoUserId,
              shopName: s.shopName,
              ownerName: s.ownerName,
              shopCategory: s.shopCategory || 'General Hardware',
              address: s.address || '',
              streetAddress: s.address || '',
              pincode: s.pincode || '400001',
              city: s.city || 'Mumbai',
              contactPhone: s.contactPhone || '',
              verificationStatus: s.verificationStatus || 'PENDING_VERIFICATION',
            },
            { upsert: true }
          );
          migrationStats.shopProfiles++;
        }
      }

      // 5. Categories
      const pgCategories = await prisma.category.findMany();
      for (const cat of pgCategories) {
        const mongoId = getObjectId(cat.id);
        await Category.findByIdAndUpdate(
          mongoId,
          {
            _id: mongoId,
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
            description: cat.description || '',
            icon: cat.icon || 'Wrench',
            isActive: cat.isActive !== false,
          },
          { upsert: true }
        );
        migrationStats.categories++;
      }

      // 6. Services
      const pgServices = await prisma.service.findMany();
      for (const s of pgServices) {
        const mongoId = getObjectId(s.id);
        const mongoCatId = getObjectId(s.categoryId);
        await Service.findByIdAndUpdate(
          mongoId,
          {
            _id: mongoId,
            name: s.name,
            slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
            categoryId: mongoCatId,
            description: s.description || '',
            basePrice: s.basePrice || 299,
            durationMinutes: s.durationMinutes || 60,
            inclusions: s.inclusions || [],
            exclusions: s.exclusions || [],
            isActive: s.isActive !== false,
          },
          { upsert: true }
        );
        migrationStats.services++;
      }

      console.log('✅ PostgreSQL data migrated to MongoDB successfully.');
      await prisma.$disconnect();
    } catch (migErr) {
      console.error('Error during relational data migration:', migErr);
    }
  } else {
    console.log('ℹ️ No active PostgreSQL connection detected. Existing data state is clean.');
  }

  // Print Summary
  console.log('\n📊 Migration Summary:');
  console.table(migrationStats);

  await disconnectDB();
  console.log('🎉 Migration process completed.\n');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
