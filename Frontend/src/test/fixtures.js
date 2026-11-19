/** Shapes mirror the backend controllers (bookings/services/providers/...). */
export const categories = [
  { id: 'c-elec', name: 'Electrician', slug: 'electrician', displayOrder: 1 },
  { id: 'c-plumb', name: 'Plumber', slug: 'plumber', displayOrder: 2 },
];

export const services = [
  {
    id: 's-fan',
    name: 'Ceiling Fan Repair',
    categoryId: 'c-elec',
    category: categories[0],
    description: 'Fix noisy or slow fans',
    basePrice: 299,
    estimatedDurationMinutes: 60,
    warrantyDays: 30,
    _count: { providerServices: 2 },
  },
  {
    id: 's-tap',
    name: 'Tap Leakage Fix',
    categoryId: 'c-plumb',
    category: categories[1],
    description: 'Stop dripping taps',
    basePrice: 199,
    estimatedDurationMinutes: 45,
    warrantyDays: 15,
    _count: { providerServices: 1 },
  },
];

export const providerA = {
  id: 'p-ravi',
  fullName: 'Ravi Sharma',
  businessName: 'Sharma Electricals',
  experienceYears: 6,
  ratingAverage: 4.7,
  ratingCount: 23,
  verificationStatus: 'APPROVED',
  isAvailable: true,
  city: 'Mumbai',
  area: 'Andheri',
  servicePincode: '400053',
  primaryCategory: 'Electrician',
  availability: [1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: '08:00', endTime: '20:00', isAvailable: true })),
  services: [{ id: 'ps1', serviceId: 's-fan', customPrice: 349, service: services[0] }],
  reviews: [],
};

export const providerB = {
  id: 'p-meera',
  fullName: 'Meera Patil',
  experienceYears: 3,
  ratingAverage: 4.1,
  ratingCount: 5,
  verificationStatus: 'APPROVED',
  isAvailable: true,
  city: 'Pune',
  area: 'Kothrud',
  servicePincode: '411038',
  primaryCategory: 'Plumber',
  availability: [],
  services: [{ id: 'ps2', serviceId: 's-tap', customPrice: null, service: services[1] }],
};

export const serviceDetail = {
  ...services[0],
  providerServices: [{ id: 'ps1', serviceId: 's-fan', customPrice: 349, provider: providerA }],
};

export const addresses = [
  {
    id: 'a-home',
    label: 'Home',
    addressLine: 'Flat 402, Sunshine Heights | MG Road',
    landmark: 'City Mall',
    area: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    isDefault: true,
  },
  {
    id: 'a-work',
    label: 'Work',
    addressLine: 'Tower B | BKC',
    area: 'Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    isDefault: false,
  },
];

const future = (days) => new Date(Date.now() + days * 86400000).toISOString();
const past = (days) => new Date(Date.now() - days * 86400000).toISOString();

export const bookings = [
  {
    id: 'b-pending',
    bookingNumber: 'BK-100001',
    status: 'PENDING',
    bookingDate: future(2),
    timeSlot: '10:00 AM - 12:00 PM',
    service: services[0],
    provider: providerA,
    providerId: 'p-ravi',
    serviceAddress: 'Flat 402, Sunshine Heights, Mumbai',
    totalAmount: 349,
    paymentMethod: 'CASH',
    createdAt: past(1),
  },
  {
    id: 'b-progress',
    bookingNumber: 'BK-100002',
    status: 'IN_PROGRESS',
    bookingDate: past(0),
    timeSlot: '02:00 PM - 04:00 PM',
    service: services[1],
    provider: providerB,
    providerId: 'p-meera',
    serviceAddress: 'Tower B, BKC',
    totalAmount: 199,
    paymentMethod: 'CASH',
  },
  {
    id: 'b-done',
    bookingNumber: 'BK-100003',
    status: 'COMPLETED',
    bookingDate: past(5),
    completedAt: past(5),
    timeSlot: '10:00 AM - 12:00 PM',
    service: services[0],
    provider: providerA,
    providerId: 'p-ravi',
    serviceAddress: 'Flat 402',
    totalAmount: 349,
    paymentMethod: 'CASH',
    review: null,
  },
  {
    id: 'b-cancel',
    bookingNumber: 'BK-100004',
    status: 'CANCELLED',
    bookingDate: past(10),
    timeSlot: '04:00 PM - 06:00 PM',
    service: services[1],
    provider: null,
    serviceAddress: 'Tower B',
    totalAmount: 199,
    paymentMethod: 'CASH',
    cancellationReason: 'Booked by mistake',
  },
];
