import { describe, expect, it } from 'vitest';
import {
  buildSlotsForDate,
  filterBookings,
  formatAddress,
  isCancellable,
  joinAddressLine,
  paginate,
  paymentMethodLabel,
  paymentStatusOf,
  providerPriceFor,
  providerStartingPrice,
  splitAddressLine,
  toDateInputValue,
  validateAddress,
} from '../utils/customer';
import { bookings, providerA, providerB, services } from './fixtures';

describe('booking buckets', () => {
  it('splits bookings into upcoming / pending / active / completed / cancelled', () => {
    expect(filterBookings(bookings, 'upcoming').map((b) => b.id)).toEqual(['b-pending']);
    expect(filterBookings(bookings, 'pending').map((b) => b.id)).toEqual(['b-pending']);
    expect(filterBookings(bookings, 'active').map((b) => b.id)).toEqual(['b-progress']);
    expect(filterBookings(bookings, 'completed').map((b) => b.id)).toEqual(['b-done']);
    expect(filterBookings(bookings, 'cancelled').map((b) => b.id)).toEqual(['b-cancel']);
  });

  it('only allows cancelling pending or accepted bookings', () => {
    expect(isCancellable({ status: 'PENDING' })).toBe(true);
    expect(isCancellable({ status: 'ACCEPTED' })).toBe(true);
    expect(isCancellable({ status: 'IN_PROGRESS' })).toBe(false);
    expect(isCancellable({ status: 'COMPLETED' })).toBe(false);
  });
});

describe('time slots', () => {
  it('marks slots outside provider hours and on non-working days as unavailable', () => {
    const sunday = '2026-11-22'; // providerA works Mon–Sat
    const slots = buildSlotsForDate(providerA, sunday, new Date('2026-11-19T08:00:00'));
    expect(slots.every((s) => !s.available)).toBe(true);
    expect(slots[0].reason).toMatch(/does not work/);

    const narrow = { availability: [{ dayOfWeek: 1, startTime: '10:00', endTime: '14:00' }] };
    const monday = '2026-11-23';
    const m = buildSlotsForDate(narrow, monday, new Date('2026-11-19T08:00:00'));
    expect(m.find((s) => s.label.startsWith('08:00')).available).toBe(false);
    expect(m.find((s) => s.label.startsWith('10:00')).available).toBe(true);
    expect(m.find((s) => s.label.startsWith('12:00')).available).toBe(true);
    expect(m.find((s) => s.label.startsWith('02:00')).available).toBe(false);
  });

  it('disables slots that already passed today', () => {
    const now = new Date('2026-11-19T13:30:00');
    const slots = buildSlotsForDate(null, toDateInputValue(now), now);
    expect(slots.find((s) => s.label.startsWith('12:00')).available).toBe(false);
    expect(slots.find((s) => s.label.startsWith('04:00')).available).toBe(true);
  });
});

describe('pricing and payment', () => {
  it('uses the provider custom price, falling back to the catalog base price', () => {
    expect(providerPriceFor(providerA, services[0])).toBe(349);
    expect(providerPriceFor(providerB, services[1])).toBe(199);
    expect(providerStartingPrice(providerB)).toBe(199);
  });

  it('labels cash payments as Cash on Service and derives read-only status', () => {
    expect(paymentMethodLabel('CASH')).toBe('Cash on Service');
    expect(paymentMethodLabel('CASH_ON_SERVICE')).toBe('Cash on Service');
    expect(paymentStatusOf({ status: 'COMPLETED', isPaid: true })).toBe('PAID');
    expect(paymentStatusOf({ status: 'PENDING' })).toBe('PENDING');
    expect(paymentStatusOf({ status: 'CANCELLED' })).toBe('NOT_APPLICABLE');
  });
});

describe('addresses', () => {
  it('round-trips house and street through the single backend addressLine', () => {
    const line = joinAddressLine(' Flat 1 ', 'MG Road ');
    expect(line).toBe('Flat 1 | MG Road');
    expect(splitAddressLine(line)).toEqual({ house: 'Flat 1', street: 'MG Road' });
    expect(splitAddressLine('Legacy single line')).toEqual({ house: 'Legacy single line', street: '' });
  });

  it('validates required fields and PIN code format', () => {
    const errs = validateAddress({ house: '', street: 'x', area: '', city: 'Mumbai', state: '', pincode: '0123' });
    expect(Object.keys(errs).sort()).toEqual(['area', 'house', 'pincode', 'state']);
    expect(
      validateAddress({ house: 'A', street: 'B', area: 'C', city: 'D', state: 'E', pincode: '400001' })
    ).toEqual({});
  });

  it('formats an address for display and the booking payload', () => {
    expect(formatAddress({ addressLine: 'Flat 1', landmark: 'Mall', area: 'Andheri', city: 'Mumbai', state: 'MH', pincode: '400053' })).toBe(
      'Flat 1, Near Mall, Andheri, Mumbai, MH, 400053'
    );
  });
});

describe('paginate', () => {
  it('clamps the page and slices items', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(items, 3, 10)).toEqual({ page: 3, totalPages: 3, items: [20, 21, 22] });
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toEqual({ page: 1, totalPages: 1, items: [] });
  });
});
