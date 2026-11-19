/**
 * Pure helpers shared by customer pages. The backend is mid-migration
 * (Prisma -> Mongoose), so field names are read defensively from both shapes.
 */

export const getId = (obj) => (obj ? obj.id || obj._id || null : null);

export const formatCurrency = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatDate = (value, opts = {}) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** YYYY-MM-DD in local time (for <input type="date"> and the booking payload). */
export const toDateInputValue = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------- Services ----------
export const serviceDuration = (s) => s?.estimatedDurationMinutes ?? s?.durationMinutes ?? null;
export const serviceWarranty = (s) => s?.warrantyDays ?? null;

// ---------- Providers ----------
export const providerName = (p) => p?.businessName || p?.fullName || 'Service Provider';
export const providerRating = (p) => Number(p?.ratingAverage ?? p?.rating ?? 0);
export const providerReviewCount = (p) => Number(p?.ratingCount ?? p?.reviews?.length ?? 0);
export const isProviderVerified = (p) => p?.verificationStatus === 'APPROVED';

export const providerCategories = (p) => {
  const names = new Set();
  if (p?.primaryCategory) names.add(p.primaryCategory);
  (p?.services || []).forEach((ps) => {
    const cat = ps?.service?.category?.name;
    if (cat) names.add(cat);
  });
  return [...names];
};

export const providerServiceArea = (p) => {
  const parts = [p?.area, p?.city].filter(Boolean);
  const pins = new Set();
  if (p?.servicePincode) pins.add(p.servicePincode);
  (p?.serviceAreas || []).forEach((a) => a?.pincode && pins.add(a.pincode));
  (p?.serviceRadiusAreas || []).forEach((a) => typeof a === 'string' && pins.add(a));
  const pinText = pins.size ? `PIN ${[...pins].slice(0, 3).join(', ')}` : '';
  return [parts.join(', '), pinText].filter(Boolean).join(' · ') || 'Service area not listed';
};

/** Price a provider charges for a given service: custom price if set, else catalog base price. */
export const providerPriceFor = (provider, service) => {
  const sid = getId(service);
  const match = (provider?.services || []).find(
    (ps) => ps?.serviceId === sid || getId(ps?.service) === sid
  );
  const custom = match?.customPrice;
  if (custom !== undefined && custom !== null && Number.isFinite(Number(custom))) return Number(custom);
  return service?.basePrice ?? null;
};

/** Lowest fixed price across a provider's listed services, for list cards. */
export const providerStartingPrice = (p) => {
  const prices = (p?.services || [])
    .map((ps) => ps?.customPrice ?? ps?.service?.basePrice)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
};

export const providerOffersService = (provider, serviceId) =>
  (provider?.services || []).some((ps) => ps?.serviceId === serviceId || getId(ps?.service) === serviceId);

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const availabilitySummary = (p) => {
  const days = (p?.availability || []).filter((a) => a?.isAvailable !== false);
  if (!days.length) return p?.isAvailable === false ? 'Currently unavailable' : 'Available on request';
  const sorted = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const first = sorted[0];
  const label = sorted.map((d) => DAY_SHORT[d.dayOfWeek] ?? '?').join(', ');
  return `${label} · ${first.startTime || '09:00'}–${first.endTime || '18:00'}`;
};

// ---------- Booking slots ----------
/**
 * Standard slot windows shown when the provider-availability endpoint is unavailable.
 * The backend remains the source of truth and rejects unavailable slots on create.
 */
export const DEFAULT_TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

const slotStartHour = (label) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(label || '');
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h + Number(m[2]) / 60;
};

const parseHHMM = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '');
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
};

/**
 * Build slot list for a date. Uses the provider's weekly availability (if returned)
 * to mark slots outside working hours, and disables slots already in the past today.
 */
export const buildSlotsForDate = (provider, dateStr, now = new Date()) => {
  if (!dateStr) return [];
  const date = new Date(`${dateStr}T00:00:00`);
  const dow = date.getDay();
  const weekly = provider?.availability || [];
  const today = weekly.find((a) => a.dayOfWeek === dow);
  const isToday = toDateInputValue(now) === dateStr;
  const nowHour = now.getHours() + now.getMinutes() / 60;

  return DEFAULT_TIME_SLOTS.map((label) => {
    const start = slotStartHour(label);
    let available = true;
    let reason = '';
    if (weekly.length) {
      if (!today || today.isAvailable === false) {
        available = false;
        reason = 'Provider does not work on this day';
      } else {
        const open = parseHHMM(today.startTime) ?? 9;
        const close = parseHHMM(today.endTime) ?? 18;
        if (start < open || start + 2 > close) {
          available = false;
          reason = 'Outside provider working hours';
        }
      }
    }
    if (available && isToday && start <= nowHour + 1) {
      available = false;
      reason = 'Slot has already passed';
    }
    return { label, available, reason };
  });
};

// ---------- Booking status ----------
export const BOOKING_STATUS_META = {
  PENDING: { label: 'Pending', tone: 'amber', labelKey: 'statusPending' },
  ACCEPTED: { label: 'Accepted', tone: 'blue', labelKey: 'statusAccepted' },
  IN_PROGRESS: { label: 'In Progress', tone: 'indigo', labelKey: 'statusInProgress' },
  COMPLETED: { label: 'Completed', tone: 'green', labelKey: 'statusCompleted' },
  REJECTED: { label: 'Rejected', tone: 'red', labelKey: 'statusRejected' },
  CANCELLED: { label: 'Cancelled', tone: 'slate', labelKey: 'statusCancelled' },
};

export const BOOKING_TIMELINE_STEPS = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export const isCancellable = (b) => ['PENDING', 'ACCEPTED'].includes(b?.status);

const startOfToday = (now = new Date()) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Tab buckets for the booking list. A booking may appear in more than one bucket. */
export const BOOKING_BUCKETS = {
  upcoming: (b, now) =>
    ['PENDING', 'ACCEPTED'].includes(b.status) && new Date(b.bookingDate) >= startOfToday(now),
  pending: (b) => b.status === 'PENDING',
  active: (b) => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status),
  completed: (b) => b.status === 'COMPLETED',
  cancelled: (b) => ['CANCELLED', 'REJECTED'].includes(b.status),
};

export const filterBookings = (bookings, bucket, now = new Date()) => {
  const fn = BOOKING_BUCKETS[bucket];
  return fn ? bookings.filter((b) => fn(b, now)) : bookings;
};

export const paymentMethodLabel = (m) => {
  if (!m || m === 'CASH' || m === 'CASH_ON_SERVICE' || m === 'PAY_LATER') return 'Cash on Service';
  return m;
};

/** Read-only payment status derived from backend fields. Customers never change it. */
export const paymentStatusOf = (b) => {
  if (b?.isPaid) return 'PAID';
  const payments = b?.payments || [];
  if (payments.some((p) => ['SUCCESS', 'PAID', 'COMPLETED'].includes(p?.status))) return 'PAID';
  if (b?.status === 'CANCELLED' || b?.status === 'REJECTED') return 'NOT_APPLICABLE';
  return 'PENDING';
};

export const PAYMENT_STATUS_META = {
  PAID: { label: 'Paid', tone: 'green' },
  PENDING: { label: 'Due on service', tone: 'amber' },
  NOT_APPLICABLE: { label: 'Not applicable', tone: 'slate' },
};

// ---------- Addresses ----------
/**
 * The backend stores a single `addressLine`. The form collects house/building and
 * street separately and joins them with " | " so they can be split back for editing.
 */
export const ADDRESS_LINE_SEPARATOR = ' | ';

export const formatAddress = (a) =>
  a
    ? [
        (a.addressLine || a.streetAddress || '').split(ADDRESS_LINE_SEPARATOR).join(', '),
        a.landmark && `Near ${a.landmark}`,
        a.area,
        a.city,
        a.state,
        a.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
export const splitAddressLine = (line = '') => {
  const idx = line.indexOf(ADDRESS_LINE_SEPARATOR);
  if (idx === -1) return { house: line, street: '' };
  return { house: line.slice(0, idx), street: line.slice(idx + ADDRESS_LINE_SEPARATOR.length) };
};
export const joinAddressLine = (house, street) =>
  [house.trim(), street.trim()].filter(Boolean).join(ADDRESS_LINE_SEPARATOR);

export const validateAddress = (v) => {
  const errors = {};
  if (!v.house?.trim()) errors.house = 'House / building is required';
  if (!v.street?.trim()) errors.street = 'Street is required';
  if (!v.area?.trim()) errors.area = 'Area is required';
  if (!v.city?.trim()) errors.city = 'City is required';
  if (!v.state?.trim()) errors.state = 'State is required';
  if (!/^[1-9]\d{5}$/.test(v.pincode?.trim() || '')) errors.pincode = 'Enter a valid 6-digit PIN code';
  return errors;
};

// ---------- Pagination ----------
export const paginate = (items, page, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    page: current,
    totalPages,
    items: items.slice((current - 1) * pageSize, current * pageSize),
  };
};

export const customerName = (user) =>
  user?.customerProfile?.fullName || user?.fullName || user?.email?.split('@')[0] || 'there';
