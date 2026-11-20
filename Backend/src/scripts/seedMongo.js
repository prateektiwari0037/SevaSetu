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
  Payment,
  Notification,
  Complaint,
  SubscriptionPlan,
  Subscription,
  PlatformSetting,
} from '../models/index.js';

async function seed() {
  console.log('🌱 Starting SevaSetu MongoDB Seeding Process...');

  await connectDB();

  // Clean existing collections
  await Promise.all([
    User.deleteMany({}),
    CustomerProfile.deleteMany({}),
    ProviderProfile.deleteMany({}),
    ShopProfile.deleteMany({}),
    AdminProfile.deleteMany({}),
    Address.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    Complaint.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    Subscription.deleteMany({}),
    PlatformSetting.deleteMany({}),
  ]);

  console.log('🧹 Cleaned existing MongoDB documents.');

  // Password hashes (bcrypt 10 rounds)
  const adminPass = await bcrypt.hash('Admin@1234', 10);
  const customerPass = await bcrypt.hash('Customer@1234', 10);
  const providerPass = await bcrypt.hash('Provider@1234', 10);
  const shopPass = await bcrypt.hash('Shop@1234', 10);

  // 1. Seed Admin
  const adminUser = await User.create({
    fullName: 'SevaSetu System Administrator',
    email: 'admin@sevasetu.com',
    mobile: '+919999900001',
    passwordHash: adminPass,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    mobileVerified: true,
  });

  await AdminProfile.create({
    userId: adminUser._id,
    fullName: 'SevaSetu System Administrator',
    department: 'Executive Operations',
    permissions: 'ALL_ACCESS',
  });
  console.log('✅ Admin user created: admin@sevasetu.com / Admin@1234');

  // 2. Seed Customer
  const customerUser = await User.create({
    fullName: 'Rajesh Kumar',
    email: 'customer@sevasetu.com',
    mobile: '+919820011223',
    passwordHash: customerPass,
    role: 'CUSTOMER',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    mobileVerified: true,
  });

  const customerProfile = await CustomerProfile.create({
    userId: customerUser._id,
    fullName: 'Rajesh Kumar',
    bio: 'Homeowner in South Mumbai seeking reliable electrical and plumbing services.',
    emergencyContact: '+919820099887',
  });

  await Address.create({
    userId: customerUser._id,
    label: 'Home',
    addressLine: 'Flat 402, Sea View Heights, Colaba Causeway',
    area: 'Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    isDefault: true,
  });
  console.log('✅ Customer user created: customer@sevasetu.com / Customer@1234');

  // 3. Seed Provider
  const providerUser = await User.create({
    fullName: 'Amit Sharma',
    email: 'provider@sevasetu.com',
    mobile: '+919820044556',
    passwordHash: providerPass,
    role: 'PROVIDER',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    mobileVerified: true,
  });

  const providerProfile = await ProviderProfile.create({
    userId: providerUser._id,
    fullName: 'Amit Sharma',
    businessName: 'Sharma Certified Electrical Works',
    bio: 'Licensed electrician with 8+ years expertise in commercial wiring and circuit breakers.',
    experienceYears: 8,
    skills: ['Wiring Repair', 'MCB Installation', 'Inverter Setup', 'Appliance Servicing'],
    primaryCategory: 'Electrical',
    city: 'Mumbai',
    area: 'Andheri West',
    servicePincode: '400053',
    serviceRadiusAreas: ['Andheri West', 'Andheri East', 'Juhu', 'Vile Parle'],
    verificationStatus: 'APPROVED',
    isAvailable: true,
    ratingAverage: 4.8,
    ratingCount: 36,
  });
  console.log('✅ Provider user created: provider@sevasetu.com / Provider@1234');

  // 4. Seed Shop Owner
  const shopUser = await User.create({
    fullName: 'Ramesh Patel',
    email: 'shop@sevasetu.com',
    mobile: '+919820077889',
    passwordHash: shopPass,
    role: 'SHOP_OWNER',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    mobileVerified: true,
  });

  await ShopProfile.create({
    userId: shopUser._id,
    shopName: 'Patel Hardware & Electrical Store',
    ownerName: 'Ramesh Patel',
    shopCategory: 'Hardware & Spares',
    address: 'Shop 12, Market Road, Near Station, Andheri West',
    streetAddress: 'Shop 12, Market Road',
    city: 'Mumbai',
    area: 'Andheri West',
    pincode: '400053',
    contactPhone: '+919820077889',
    verificationStatus: 'APPROVED',
  });
  console.log('✅ Shop owner created: shop@sevasetu.com / Shop@1234');

  // 5. Seed Categories
  const categoriesData = [
    { name: 'Electrical', slug: 'electrical', icon: 'Zap', description: 'Wiring, MCBs, lighting, switches, and appliance fixes' },
    { name: 'Plumbing', slug: 'plumbing', icon: 'Droplets', description: 'Pipes, faucets, water tanks, drainage, and leak fixes' },
    { name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Wrench', description: 'AC, refrigerator, microwave, and washing machine services' },
    { name: 'Home Cleaning', slug: 'home-cleaning', icon: 'Sparkles', description: 'Deep home cleaning, sofa, and kitchen sanitization' },
  ];

  const categories = await Category.insertMany(categoriesData);
  console.log(`✅ Seeded ${categories.length} service categories.`);

  // 6. Seed Services (Fixed Pricing Model)
  const electricalCategory = categories.find((c) => c.slug === 'electrical');
  const plumbingCategory = categories.find((c) => c.slug === 'plumbing');

  const servicesData = [
    {
      name: 'Complete MCB & Fuse Inspection',
      slug: 'mcb-fuse-inspection',
      categoryId: electricalCategory._id,
      description: 'Comprehensive electrical diagnostics for circuit breaker tripping, overloaded wiring, and fuse burnouts.',
      basePrice: 349,
      durationMinutes: 45,
      inclusions: ['Complete breaker panel diagnostic', 'Fault isolation', 'Safety earth test'],
      exclusions: ['Cost of replacement MCB switch or heavy cabling'],
      isActive: true,
    },
    {
      name: 'Ceiling Fan Repair & Installation',
      slug: 'ceiling-fan-repair',
      categoryId: electricalCategory._id,
      description: 'Professional installation, motor bearing lubrication, and regulator replacement.',
      basePrice: 249,
      durationMinutes: 40,
      inclusions: ['Mounting bracket fix', 'Capacitor and regulator wiring', 'Performance speed testing'],
      exclusions: ['New ceiling fan unit'],
      isActive: true,
    },
    {
      name: 'Emergency Pipe Leakage Sealing',
      slug: 'emergency-pipe-leakage',
      categoryId: plumbingCategory._id,
      description: 'Immediate repair and sealant clamping for ruptured water lines and burst plumbing joints.',
      basePrice: 499,
      durationMinutes: 60,
      inclusions: ['High-pressure joint clamp', 'Teflon sealant application', 'Leak pressure test'],
      exclusions: ['Extensive concealed wall demolition or main pipeline replacement'],
      isActive: true,
    },
    {
      name: 'Bathroom Tap & Showerhead Fix',
      slug: 'tap-showerhead-fix',
      categoryId: plumbingCategory._id,
      description: 'Precision servicing of dripping bib taps, mixer valves, and clogged shower nozzles.',
      basePrice: 199,
      durationMinutes: 30,
      inclusions: ['Washer and spindle replacement', 'Cartridge cleaning', 'Water flow balancing'],
      exclusions: ['New luxury faucet hardware'],
      isActive: true,
    },
  ];

  const services = await Service.insertMany(servicesData);
  console.log(`✅ Seeded ${services.length} fixed-price services.`);

  // 7. Seed Sample Booking with Cash on Service
  const sampleService = services[0];
  const booking = await Booking.create({
    bookingNumber: 'BK-100201-923',
    customerId: customerProfile._id,
    providerId: providerProfile._id,
    serviceId: sampleService._id,
    bookingType: 'NORMAL',
    status: 'ACCEPTED',
    problemDescription: 'Main circuit breaker trips whenever the AC and geyser are on together.',
    bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeSlot: '10:00 AM - 12:00 PM',
    serviceAddress: 'Flat 402, Sea View Heights, Colaba Causeway, Mumbai',
    addressArea: 'Colaba',
    addressCity: 'Mumbai',
    addressPincode: '400001',
    totalAmount: sampleService.basePrice,
    paymentMethod: 'CASH_ON_SERVICE',
    isPaid: false,
    statusHistory: [
      {
        status: 'PENDING',
        comment: 'Booking created by customer with Cash on Service',
        changedByUserId: customerUser._id,
      },
      {
        status: 'ACCEPTED',
        comment: 'Assigned provider accepted booking schedule',
        changedByUserId: providerUser._id,
      },
    ],
  });

  await Payment.create({
    bookingId: booking._id,
    transactionId: `TXN-${Date.now()}-1001`,
    amount: sampleService.basePrice,
    paymentMethod: 'CASH_ON_SERVICE',
    status: 'PENDING',
    notes: 'Cash payment to be collected on service completion',
  });

  console.log(`✅ Seeded sample booking (${booking.bookingNumber}) with Cash on Service.`);

  // 8. Seed Subscription Plans (Silver, Gold, Platinum)
  const plansData = [
    {
      name: 'Silver Home Maintenance',
      slug: 'silver-home-maintenance',
      tier: 'SILVER',
      category: 'General Maintenance',
      description: 'Essential preventive home upkeep plan with 1 complimentary technical inspection.',
      price: 499,
      durationDays: 30,
      serviceLimit: 1,
      features: ['1 Free Service Visit', 'Standard Helpline Support', '30-Day Work Warranty'],
      isActive: true,
    },
    {
      name: 'Gold Home Care',
      slug: 'gold-home-care',
      tier: 'GOLD',
      category: 'Comprehensive Residential',
      description: 'Quarterly maintenance coverage including electrical, plumbing, and appliance tune-ups.',
      price: 1299,
      durationDays: 90,
      serviceLimit: 3,
      features: ['3 Free Scheduled Inspections', 'Priority Emergency SOS Dispatch', '10% Off Hardware Catalog', '30-Day Work Warranty'],
      isActive: true,
    },
    {
      name: 'Platinum Annual Estate',
      slug: 'platinum-annual-estate',
      tier: 'PLATINUM',
      category: 'Full Property Coverage',
      description: 'Year-round complete peace of mind with 12 monthly visits and zero dispatch surcharge.',
      price: 3999,
      durationDays: 365,
      serviceLimit: 12,
      features: ['12 Monthly Comprehensive Inspections', 'Zero Booking Fee', '24/7 Priority Emergency SOS', '15% Off Spare Parts', 'Dedicated Support Manager'],
      isActive: true,
    },
  ];

  const plans = await SubscriptionPlan.insertMany(plansData);
  console.log(`✅ Seeded ${plans.length} subscription plans (Silver, Gold, Platinum).`);

  // Active subscription for sample customer
  await Subscription.create({
    customerId: customerProfile._id,
    planId: plans[1]._id, // Gold plan
    status: 'ACTIVE',
    paymentMethod: 'CASH',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    servicesRemaining: 3,
    totalPaid: plans[1].price,
  });
  console.log('✅ Seeded active sample customer subscription.');

  // 9. Seed Sample Support Complaint Ticket
  await Complaint.create({
    ticketNumber: 'CMP-100201-445',
    customerId: customerProfile._id,
    bookingId: booking._id,
    title: 'Delayed technician arrival for MCB inspection',
    description: 'Technician was delayed by 45 minutes beyond the scheduled 10:00 AM slot.',
    category: 'SERVICE_QUALITY',
    status: 'IN_REVIEW',
    assignedAdminId: adminUser._id,
    messages: [
      {
        senderUserId: customerUser._id,
        senderRole: 'CUSTOMER',
        message: 'Technician was delayed by 45 minutes beyond the scheduled 10:00 AM slot.',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        senderUserId: adminUser._id,
        senderRole: 'ADMIN',
        message: 'We apologize for the inconvenience. We have verified with the provider who faced traffic congestion. We are reviewing compensation options.',
        timestamp: new Date(),
      },
    ],
  });
  console.log('✅ Seeded sample dispute complaint ticket.');

  // 10. Seed Platform Configuration Settings
  const defaultSettings = [
    { key: 'platformCommissionPct', value: '10', description: 'Standard platform revenue commission percentage' },
    { key: 'standardWarrantyDays', value: '30', description: 'Standard service guarantee warranty in calendar days' },
    { key: 'emergencyRadiusKm', value: '15', description: 'Default radius in kilometers for emergency SOS dispatch' },
    { key: 'bookingCancellationRule', value: 'Cancellations allowed up to 2 hours before scheduled slot.', description: 'Cancellation policy rules' },
    { key: 'emergencyHotline', value: '+91 1800 123 4567', description: 'Public emergency helpline' },
    { key: 'supportEmail', value: 'support@sevasetu.com', description: 'Customer grievance support email' },
  ];

  await PlatformSetting.insertMany(defaultSettings);
  console.log(`✅ Seeded ${defaultSettings.length} platform configuration settings.`);
  console.log('\n🎉 SevaSetu MongoDB database seeding completed successfully!\n');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
