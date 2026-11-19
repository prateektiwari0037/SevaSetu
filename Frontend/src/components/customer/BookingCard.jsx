import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { Card } from '../ui';
import { BookingStatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, getId, providerName } from '../../utils/customer';

export default function BookingCard({ booking, compact = false }) {
  const id = getId(booking);
  return (
    <Card as="article" className="p-4 hover:border-primary-300 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-slate-400">#{booking?.bookingNumber || id}</p>
          <h3 className="text-sm font-bold text-slate-900 truncate">
            <Link
              to={`/customer/bookings/${id}`}
              className="hover:text-primary-700 focus:outline-none focus-visible:underline"
            >
              {booking?.service?.name || 'Service booking'}
            </Link>
          </h3>
        </div>
        <BookingStatusBadge status={booking?.status} />
      </div>
      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <dt className="sr-only">Date</dt>
          <dd>{formatDate(booking?.bookingDate)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <dt className="sr-only">Time slot</dt>
          <dd>{booking?.timeSlot || '—'}</dd>
        </div>
        {!compact && (
          <>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <dt className="sr-only">Provider</dt>
              <dd className="truncate">{booking?.provider ? providerName(booking.provider) : 'Awaiting provider'}</dd>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Address</dt>
              <dd className="truncate">{booking?.serviceAddress || '—'}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm font-extrabold text-slate-900">{formatCurrency(booking?.totalAmount)}</span>
        <Link
          to={`/customer/bookings/${id}`}
          className="text-xs font-semibold text-primary-700 hover:underline"
          aria-label={`View booking ${booking?.bookingNumber || ''}`}
        >
          View details →
        </Link>
      </div>
    </Card>
  );
}
