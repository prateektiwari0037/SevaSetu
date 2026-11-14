import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

async function main() {
  console.log('🌱 Starting SevaSetu database seed...');

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.platformCommission.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.revisitRequest.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.complaintMessage.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.bookingAttachment.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.recurringBooking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.shopInquiry.deleteMany();
  await prisma.shopCatalogItem.deleteMany();
  await prisma.shopProfile.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.providerAvailability.deleteMany();
  await prisma.providerPortfolio.deleteMany();
  await prisma.providerDocument.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // Password hashes
  const adminPass = await bcrypt.hash('Admin@1234', 10);
  const customerPass = await bcrypt.hash('Customer@1234', 10);
  const providerPass = await bcrypt.hash('Provider@1234', 10);
  const shopPass = await bcrypt.hash('Shop@1234', 10);

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sevasetu.com',
      phone: '+919999900001',
      passwordHash: adminPass,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      adminProfile: {
        create: {
          fullName: 'SevaSetu System Administrator',
          department: 'Executive Operations',
          permissions: 'ALL_ACCESS',
        },
      },
    },
  });

  // 2. Create Customer
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@sevasetu.com',
      phone: '+919820011223',
      passwordHash: customerPass,
      role: 'CUSTOMER',
      isActive: true,
      isVerified: true,
      customerProfile: {
        create: {
          fullName: 'Rajesh Kumar',
          bio: 'Homeowner in South Mumbai interested in reliable electrical and plumbing maintenance.',
          emergencyContact: '+919820099887',
        },
      },
      addresses: {
        create: {
          label: 'Home',
          streetAddress: 'Flat 402, Sea View Heights, Colaba Causeway',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          latitude: 18.922,
          longitude: 72.834,
          isDefault: true,
        },
      },
    },
    include: { customerProfile: true, addresses: true },
  });

  // 3. Create Approved Electrician Provider
  const electricianUser = await prisma.user.create({
    data: {
      email: 'electrician@sevasetu.com',
      phone: '+919820123456',
      passwordHash: providerPass,
      role: 'PROVIDER',
      isActive: true,
      isVerified: true,
      providerProfile: {
        create: {
          fullName: 'Amit Sharma',
          businessName: 'Sharma Electrical Solutions',
          bio: 'Govt. certified licensed electrician with 8+ years experience in domestic and commercial electrical repairs, smart home wiring, and circuit diagnostics.',
          experienceYears: 8,
          skills: ['House Wiring', 'MCB Diagnostics', 'Inverter Setup', 'Appliance Power', 'Emergency Power Restore'],
          verificationStatus: 'APPROVED',
          isAvailable: true,
          ratingAverage: 4.9,
          ratingCount: 38,
          primaryCategory: 'Electrician',
          latitude: 18.932,
          longitude: 72.831,
          servicePincode: '400001',
          serviceRadiusKm: 15.0,
          documents: {
            create: [
              {
                docType: 'GOVT_ID',
                documentNumber: 'AADHAAR-XXXX-XXXX-4521',
                fileUrl: '/uploads/sample-id.jpg',
                verificationStatus: 'APPROVED',
              },
              {
                docType: 'TRADE_LICENSE',
                documentNumber: 'LIC-EL-MUM-2018-992',
                fileUrl: '/uploads/sample-license.jpg',
                verificationStatus: 'APPROVED',
              },
            ],
          },
          availability: {
            create: [1, 2, 3, 4, 5, 6].map((day) => ({
              dayOfWeek: day,
              startTime: '08:30',
              endTime: '19:30',
              isAvailable: true,
            })),
          },
        },
      },
    },
    include: { providerProfile: true },
  });

  // 4. Create Approved Plumber Provider
  const plumberUser = await prisma.user.create({
    data: {
      email: 'plumber@sevasetu.com',
      phone: '+919820234567',
      passwordHash: providerPass,
      role: 'PROVIDER',
      isActive: true,
      isVerified: true,
      providerProfile: {
        create: {
          fullName: 'Suresh Patil',
          businessName: 'Patil Express Plumbing',
          bio: 'Fast, dependable plumbing expert. Specializes in leakage detection, pipe replacements, bathroom fitting installations, and water pressure repair.',
          experienceYears: 6,
          skills: ['Pipe Leakage Fix', 'Bathroom Fixtures', 'Water Pump Repair', 'Drainage Unclogging'],
          verificationStatus: 'APPROVED',
          isAvailable: true,
          ratingAverage: 4.8,
          ratingCount: 29,
          primaryCategory: 'Plumber',
          latitude: 18.94,
          longitude: 72.825,
          servicePincode: '400001',
          serviceRadiusKm: 20.0,
          documents: {
            create: {
              docType: 'GOVT_ID',
              documentNumber: 'AADHAAR-XXXX-XXXX-8832',
              fileUrl: '/uploads/sample-id.jpg',
              verificationStatus: 'APPROVED',
            },
          },
          availability: {
            create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '18:00',
              isAvailable: true,
            })),
          },
        },
      },
    },
    include: { providerProfile: true },
  });

  // 5. Create Approved Home Cleaner Provider
  const cleanerUser = await prisma.user.create({
    data: {
      email: 'cleaner@sevasetu.com',
      phone: '+919820345678',
      passwordHash: providerPass,
      role: 'PROVIDER',
      isActive: true,
      isVerified: true,
      providerProfile: {
        create: {
          fullName: 'Sunita Devi',
          businessName: 'Sparkle Home Deep Cleaning',
          bio: 'Eco-friendly and meticulous home sanitation and deep cleaning services using industrial steamers and safe cleaning products.',
          experienceYears: 5,
          skills: ['Deep Home Cleaning', 'Kitchen Degreasing', 'Bathroom Scrubbing', 'Sofa & Carpet Wash'],
          verificationStatus: 'APPROVED',
          isAvailable: true,
          ratingAverage: 4.7,
          ratingCount: 22,
          primaryCategory: 'Home Cleaning',
          latitude: 18.915,
          longitude: 72.828,
          servicePincode: '400001',
          serviceRadiusKm: 15.0,
          availability: {
            create: [1, 2, 3, 4, 5, 6].map((day) => ({
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true,
            })),
          },
        },
      },
    },
    include: { providerProfile: true },
  });

  // 6. Create Pending Verification Provider (For testing Admin Verification approval workflow!)
  const pendingProviderUser = await prisma.user.create({
    data: {
      email: 'appliance@sevasetu.com',
      phone: '+919820456789',
      passwordHash: providerPass,
      role: 'PROVIDER',
      isActive: true,
      isVerified: false,
      providerProfile: {
        create: {
          fullName: 'Vikram Singh',
          businessName: 'Singh Appliance Care',
          bio: 'Technician for Refrigerator, Washing Machine, and Microwave oven repair. Awaiting document verification from SevaSetu team.',
          experienceYears: 4,
          skills: ['Refrigerator Gas Refill', 'Washing Machine Motor', 'Microwave PCB'],
          verificationStatus: 'PENDING',
          isAvailable: true,
          ratingAverage: 0.0,
          ratingCount: 0,
          primaryCategory: 'Appliance Repair',
          servicePincode: '400001',
          documents: {
            create: {
              docType: 'AADHAAR',
              documentNumber: 'AADHAAR-XXXX-XXXX-9912',
              fileUrl: '/uploads/sample-id.jpg',
              verificationStatus: 'PENDING',
            },
          },
        },
      },
    },
    include: { providerProfile: true },
  });

  // 7. Create Shop Owner
  const shopUser = await prisma.user.create({
    data: {
      email: 'shop@sevasetu.com',
      phone: '+919820567890',
      passwordHash: shopPass,
      role: 'SHOP_OWNER',
      isActive: true,
      isVerified: true,
      shopProfile: {
        create: {
          shopName: 'Gupta Hardware & Electrical Mart',
          ownerName: 'Ramesh Gupta',
          shopCategory: 'Hardware & Electrical',
          description: 'Trusted local shop providing genuine electrical switches, cables, PVC plumbing fittings, sanitary ware, and construction tools since 1998.',
          address: 'Shop 12, Market Lane, Near Churchgate Station',
          pincode: '400001',
          city: 'Mumbai',
          latitude: 18.925,
          longitude: 72.83,
          contactPhone: '+919820567890',
          contactEmail: 'guptahardware@sevasetu.com',
          openingHours: 'Mon-Sat 08:30 AM - 08:30 PM',
          verificationStatus: 'APPROVED',
          isActive: true,
          catalogItems: {
            create: [
              {
                name: 'Anchor Roma 6A Modular Switch',
                category: 'Electrical',
                description: 'Original poly-carbonate fire-retardant switch with 10-year company warranty.',
                price: 45,
                unit: 'piece',
                inStock: true,
              },
              {
                name: 'Havells 1.5 sq mm FR Multistrand Wire (90m coil)',
                category: 'Electrical',
                description: '100% pure electrolytic copper wire for reliable home electrical circuits.',
                price: 1450,
                unit: 'coil',
                inStock: true,
              },
              {
                name: 'Supreme PVC Pipe 1 inch (3 meters)',
                category: 'Plumbing',
                description: 'Heavy duty pressure PVC pipe for domestic water supply and drainage.',
                price: 220,
                unit: 'piece',
                inStock: true,
              },
              {
                name: 'Waterproof Brass Tap Inner Spindle 1/2"',
                category: 'Plumbing',
                description: 'Standard brass quarter-turn spindle for repair of leaking taps.',
                price: 180,
                unit: 'piece',
                inStock: true,
              },
              {
                name: 'Heavy Duty 10" Adjustable Pipe Wrench',
                category: 'Hardware Tools',
                description: 'Forged chrome-vanadium steel adjustable wrench with non-slip grip.',
                price: 350,
                unit: 'piece',
                inStock: true,
              },
            ],
          },
        },
      },
    },
    include: { shopProfile: true },
  });

  // 8. Create Categories
  const categoriesData = [
    {
      name: 'Electrician',
      slug: 'electrician',
      description: 'Expert residential and commercial electrical repair, installation, and inspection.',
      iconUrl: 'Zap',
      displayOrder: 1,
    },
    {
      name: 'Plumber',
      slug: 'plumber',
      description: 'Pipes, leakage repair, tap fixing, bathroom fixtures, and water tank cleaning.',
      iconUrl: 'Droplets',
      displayOrder: 2,
    },
    {
      name: 'Home Cleaning',
      slug: 'home-cleaning',
      description: 'Deep home cleaning, kitchen scrubbing, bathroom sanitization, and sofa washing.',
      iconUrl: 'Sparkles',
      displayOrder: 3,
    },
    {
      name: 'Appliance Repair',
      slug: 'appliance-repair',
      description: 'Repair for refrigerators, washing machines, microwaves, water purifiers, and TVs.',
      iconUrl: 'Tv',
      displayOrder: 4,
    },
    {
      name: 'Vehicle Repair',
      slug: 'vehicle-repair',
      description: 'Doorstep two-wheeler and four-wheeler breakdown assistance and periodic servicing.',
      iconUrl: 'Wrench',
      displayOrder: 5,
    },
    {
      name: 'Carpenter',
      slug: 'carpenter',
      description: 'Furniture assembly, hinge repairs, door lock fitting, and wood customization.',
      iconUrl: 'Hammer',
      displayOrder: 6,
    },
    {
      name: 'Painting',
      slug: 'painting',
      description: 'Interior and exterior wall painting, waterproof coating, and touch-up putty work.',
      iconUrl: 'Paintbrush',
      displayOrder: 7,
    },
    {
      name: 'Home Tutor',
      slug: 'home-tutor',
      description: 'Qualified home educators for school academics, competitive exam prep, and languages.',
      iconUrl: 'BookOpen',
      displayOrder: 8,
    },
    {
      name: 'AC Repair',
      slug: 'ac-repair',
      description: 'AC deep jet cleaning, gas charging, cooling inspection, and compressor repair.',
      iconUrl: 'Wind',
      displayOrder: 9,
    },
    {
      name: 'Other Services',
      slug: 'other-services',
      description: 'Pest control, masonry, gardening, and miscellaneous local service tasks.',
      iconUrl: 'Grid',
      displayOrder: 10,
    },
  ];

  const createdCategories = {};
  for (const cat of categoriesData) {
    createdCategories[cat.slug] = await prisma.category.create({
      data: cat,
    });
  }

  // 9. Create Core Services
  const servicesData = [
    // Electrician
    {
      categoryId: createdCategories['electrician'].id,
      name: 'Ceiling Fan Repair & Installation',
      slug: 'fan-repair-installation',
      description: 'Noise fix, regulator repair, blade balancing, and new ceiling fan installation.',
      basePrice: 299,
      priceType: 'FIXED',
      estimatedDurationMinutes: 45,
      warrantyDays: 30,
    },
    {
      categoryId: createdCategories['electrician'].id,
      name: 'Switchboard & MCB Tripping Diagnostic',
      slug: 'switchboard-mcb-repair',
      description: 'Locate short-circuit faults, replace faulty MCBs, and repair burned switches.',
      basePrice: 399,
      priceType: 'FIXED',
      estimatedDurationMinutes: 60,
      warrantyDays: 30,
    },
    {
      categoryId: createdCategories['electrician'].id,
      name: 'Full Home Electrical Inspection',
      slug: 'home-electrical-inspection',
      description: 'Comprehensive load check, earth resistance verification, and safety audit.',
      basePrice: 799,
      priceType: 'INSPECTION',
      estimatedDurationMinutes: 90,
      warrantyDays: 45,
    },
    // Plumber
    {
      categoryId: createdCategories['plumber'].id,
      name: 'Tap & Shower Leakage Fix',
      slug: 'tap-shower-leakage',
      description: 'Washer replacement, spindle repair, shower head descaling, and pipe joint fix.',
      basePrice: 249,
      priceType: 'FIXED',
      estimatedDurationMinutes: 45,
      warrantyDays: 30,
    },
    {
      categoryId: createdCategories['plumber'].id,
      name: 'Drainage Pipe Unclogging',
      slug: 'drainage-unclogging',
      description: 'Clearing choked kitchen sinks, floor drains, and bathroom outlets with modern augers.',
      basePrice: 449,
      priceType: 'FIXED',
      estimatedDurationMinutes: 60,
      warrantyDays: 15,
    },
    // Home Cleaning
    {
      categoryId: createdCategories['home-cleaning'].id,
      name: 'Complete 2BHK Home Deep Cleaning',
      slug: '2bhk-deep-cleaning',
      description: 'Intense floor buffing, window pane scrubbing, kitchen chimney degreasing, and bathrooms.',
      basePrice: 1999,
      priceType: 'FIXED',
      estimatedDurationMinutes: 240,
      warrantyDays: 7,
    },
    // AC Repair
    {
      categoryId: createdCategories['ac-repair'].id,
      name: 'Split AC Power Jet Cleaning Service',
      slug: 'split-ac-jet-service',
      description: 'High-pressure foam and water jet cleaning of cooling coils, blower, and outdoor unit.',
      basePrice: 599,
      priceType: 'FIXED',
      estimatedDurationMinutes: 60,
      warrantyDays: 30,
    },
  ];

  const createdServices = {};
  for (const s of servicesData) {
    createdServices[s.slug] = await prisma.service.create({
      data: s,
    });
  }

  // 10. Map Provider to Services
  await prisma.providerService.createMany({
    data: [
      {
        providerId: electricianUser.providerProfile.id,
        serviceId: createdServices['fan-repair-installation'].id,
        customPrice: 299,
        pricingType: 'FIXED',
        experienceMonths: 96,
        isActive: true,
      },
      {
        providerId: electricianUser.providerProfile.id,
        serviceId: createdServices['switchboard-mcb-repair'].id,
        customPrice: 399,
        pricingType: 'FIXED',
        experienceMonths: 96,
        isActive: true,
      },
      {
        providerId: electricianUser.providerProfile.id,
        serviceId: createdServices['home-electrical-inspection'].id,
        customPrice: 799,
        pricingType: 'INSPECTION',
        experienceMonths: 96,
        isActive: true,
      },
      {
        providerId: plumberUser.providerProfile.id,
        serviceId: createdServices['tap-shower-leakage'].id,
        customPrice: 249,
        pricingType: 'FIXED',
        experienceMonths: 72,
        isActive: true,
      },
      {
        providerId: plumberUser.providerProfile.id,
        serviceId: createdServices['drainage-unclogging'].id,
        customPrice: 449,
        pricingType: 'FIXED',
        experienceMonths: 72,
        isActive: true,
      },
      {
        providerId: cleanerUser.providerProfile.id,
        serviceId: createdServices['2bhk-deep-cleaning'].id,
        customPrice: 1899,
        pricingType: 'FIXED',
        experienceMonths: 60,
        isActive: true,
      },
    ],
  });

  // 11. Create a Completed Booking with Active Warranty, Review, and Payment
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const completedBooking = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-1001',
      customerId: customerUser.customerProfile.id,
      providerId: electricianUser.providerProfile.id,
      serviceId: createdServices['switchboard-mcb-repair'].id,
      bookingType: 'NORMAL',
      status: 'COMPLETED',
      problemDescription: 'Main living room switchboard sparking whenever AC was powered on.',
      bookingDate: pastDate,
      timeSlot: '10:00 AM - 12:00 PM',
      serviceAddress: 'Flat 402, Sea View Heights, Colaba Causeway, Mumbai',
      addressPincode: '400001',
      latitude: 18.922,
      longitude: 72.834,
      totalAmount: 399,
      isPaid: true,
      paymentMethod: 'ONLINE',
      completedAt: pastDate,
      statusHistory: {
        create: [
          { status: 'PENDING', comment: 'Booking created by customer' },
          { status: 'ACCEPTED', comment: 'Accepted by Amit Sharma' },
          { status: 'IN_PROGRESS', comment: 'Diagnostics and burnt switch replacement started' },
          { status: 'COMPLETED', comment: 'Fixed and tested. Safe load verified.' },
        ],
      },
      warranty: {
        create: {
          serviceName: 'Switchboard & MCB Tripping Diagnostic',
          warrantyDays: 30,
          startDate: pastDate,
          endDate: new Date(pastDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          terms: 'Full coverage for any sparking or loose connection issues within 30 days.',
          isActive: true,
        },
      },
      payments: {
        create: {
          transactionId: 'TXN-2026-9901-SEVA',
          paymentGatewayOrderId: 'order_test_9901',
          amount: 399,
          paymentMethod: 'ONLINE',
          status: 'SUCCESSFUL',
          commission: {
            create: {
              providerId: electricianUser.providerProfile.id,
              grossAmount: 399,
              commissionRate: 0.1,
              commissionAmount: 39.9,
              providerEarning: 359.1,
            },
          },
        },
      },
      review: {
        create: {
          customerId: customerUser.customerProfile.id,
          providerId: electricianUser.providerProfile.id,
          rating: 5,
          comment: 'Amit arrived right on time with all proper tools and replaced the damaged MCB within 40 minutes. Highly recommended professional!',
          providerReply: 'Thank you Rajesh ji! Glad to ensure your home electrical system is fully safe.',
        },
      },
    },
  });

  // 12. Create an Active In-Progress Booking
  await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-1002',
      customerId: customerUser.customerProfile.id,
      providerId: plumberUser.providerProfile.id,
      serviceId: createdServices['tap-shower-leakage'].id,
      bookingType: 'NORMAL',
      status: 'IN_PROGRESS',
      problemDescription: 'Master bathroom mixer tap is constantly leaking and dripping into bucket.',
      bookingDate: new Date(),
      timeSlot: '02:00 PM - 04:00 PM',
      serviceAddress: 'Flat 402, Sea View Heights, Colaba Causeway, Mumbai',
      addressPincode: '400001',
      latitude: 18.922,
      longitude: 72.834,
      totalAmount: 249,
      isPaid: false,
      paymentMethod: 'CASH',
      statusHistory: {
        create: [
          { status: 'PENDING', comment: 'Booking submitted' },
          { status: 'ACCEPTED', comment: 'Accepted by Suresh Patil' },
          { status: 'IN_PROGRESS', comment: 'Plumber on site repairing the cartridge' },
        ],
      },
    },
  });

  // 13. Create a Service Request with Multiple Competing Quotations!
  const sampleRequest = await prisma.serviceRequest.create({
    data: {
      requestNumber: 'REQ-2026-501',
      customerId: customerUser.customerProfile.id,
      serviceId: createdServices['home-electrical-inspection'].id,
      title: 'Full Inverter & Solar Backup Sub-circuit Wiring',
      description: 'Need complete dual-line inverter connection with 3 rooms backed up and auto-changeover switchboard.',
      address: 'Flat 402, Sea View Heights, Colaba Causeway, Mumbai',
      pincode: '400001',
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      preferredTimeSlot: '11:00 AM - 02:00 PM',
      status: 'QUOTED',
      quotations: {
        create: [
          {
            providerId: electricianUser.providerProfile.id,
            quotedAmount: 1850,
            estimatedDuration: '3 Hours',
            notes: 'Includes copper wiring, earthing loop check, and heavy duty changeover fuse installation.',
            status: 'PENDING',
          },
        ],
      },
    },
  });

  // 14. Create Subscription Plans
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Basic Home Care Plan',
        slug: 'basic-home-care',
        category: 'Residential',
        description: 'Ideal for small apartments. Includes periodic safety checkups and quick assistance.',
        price: 499,
        durationDays: 30,
        serviceLimit: 2,
        features: [
          '2 Complimentary Electrical or Plumbing visits/month',
          'Zero inspection consultation charges',
          'Priority booking slot allocation',
          '10% discount on material parts',
        ],
        isActive: true,
      },
      {
        name: 'Comprehensive Family Care',
        slug: 'comprehensive-family-care',
        category: 'All-in-One',
        description: 'Covers Electrical, Plumbing, and Appliance health checks with emergency dispatch.',
        price: 1299,
        durationDays: 90,
        serviceLimit: 6,
        features: [
          '6 Free inspection & maintenance visits per quarter',
          'Dedicated SOS emergency technician priority',
          'Free quarterly AC filter cleaning',
          'Extended 60-day warranty on all repairs',
        ],
        isActive: true,
      },
      {
        name: 'Annual Society & Villa Maintenance',
        slug: 'annual-villa-maintenance',
        category: 'Premium',
        description: 'Year-round worry-free home maintenance for larger bungalows and villas.',
        price: 3999,
        durationDays: 365,
        serviceLimit: 24,
        features: [
          '24 Scheduled visits throughout the year',
          'Quarterly water tank and sump inspection',
          'Full electrical thermal hazard scan',
          'VIP direct support line & dedicated manager',
        ],
        isActive: true,
      },
    ],
  });

  // 15. Create Platform Settings
  await prisma.platformSetting.createMany({
    data: [
      {
        key: 'PLATFORM_NAME',
        value: 'SevaSetu Hyperlocal Marketplace',
        description: 'User-facing platform branding',
      },
      {
        key: 'DEFAULT_COMMISSION_PERCENTAGE',
        value: '10',
        description: 'Standard platform commission deducted per booking',
      },
      {
        key: 'EMERGENCY_SOS_HOTLINE',
        value: '+91 1800-7382-7388',
        description: 'Toll-free emergency helpline number',
      },
      {
        key: 'SUPPORT_EMAIL',
        value: 'help@sevasetu.com',
        description: 'Customer and provider grievances email',
      },
      {
        key: 'AUTO_WARRANTY_DAYS',
        value: '30',
        description: 'Default warranty period automatically issued upon job completion',
      },
    ],
  });

  // 16. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        title: 'New Quotation Received!',
        message: 'Amit Sharma submitted a quote of ₹1,850 for your Inverter Wiring request.',
        type: 'QUOTATION',
        link: `/customer/quotations/${sampleRequest.id}`,
      },
      {
        userId: electricianUser.id,
        title: 'Payment Credited',
        message: 'Your account was credited with ₹359.10 for booking #BK-2026-1001.',
        type: 'PAYMENT',
        link: '/provider/earnings',
      },
      {
        userId: adminUser.id,
        title: 'New Provider Verification Pending',
        message: 'Vikram Singh (Appliance Repair) uploaded Aadhaar verification documents.',
        type: 'VERIFICATION',
        link: '/admin/verifications',
      },
    ],
  });

  console.log('✅ SevaSetu database seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('🔑 TEST ACCOUNTS:');
  console.log('Admin:       admin@sevasetu.com       / Admin@1234');
  console.log('Customer:    customer@sevasetu.com    / Customer@1234');
  console.log('Electrician: electrician@sevasetu.com / Provider@1234');
  console.log('Plumber:     plumber@sevasetu.com     / Provider@1234');
  console.log('Pending Pro: appliance@sevasetu.com   / Provider@1234');
  console.log('Shop Owner:  shop@sevasetu.com        / Shop@1234');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
