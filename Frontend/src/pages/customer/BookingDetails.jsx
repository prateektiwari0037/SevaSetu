import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, LifeBuoy, Mail, MapPin, Phone, ShieldCheck, Star, Wallet, XCircle } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LinkButton,
  RatingStars,
  Select,
  Skeleton,
  TextArea,
} from '../../components/ui';
import BookingTimeline from '../../components/customer/BookingTimeline';
import ReviewForm from '../../components/customer/ReviewForm';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/customer/StatusBadge';
import { ProviderAvatar } from '../../components/customer/ProviderCard';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../services/customerApi';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getId,
  isCancellable,
  isProviderVerified,
  paymentMethodLabel,
  paymentStatusOf,
  providerName,
} from '../../utils/customer';

const CANCEL_REASONS = [
  'Booked by mistake',
  'Found another provider',
  'Problem resolved itself',
  'Need to change the date or time',
  'Other',
];

function Section({ title, children, icon: Icon }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
        {Icon && <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />}
        {title}
      </h2>
      {children}
    </Card>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const toast = useToast();
  const { data: booking, setData, loading, error, reload } = useAsync(() => bookingApi.get(id), [id]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelOther, setCancelOther] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const back = (
    <Link to="/customer/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700 mb-2">
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('bookingsTitle')}
    </Link>
  );

  if (loading) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading booking…</span>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (error) {
    const title = error.status === 404 ? 'Booking not found' : error.status === 403 ? 'You do not have access to this booking' : 'Could not load booking';
    return (
      <div className="space-y-4">
        {back}
        <ErrorState error={error} onRetry={error.status >= 500 || !error.status ? reload : undefined} title={title} />
      </div>
    );
  }

  const bid = getId(booking);
  const provider = booking.provider;
  const paymentStatus = paymentStatusOf(booking);
  const canReview = booking.status === 'COMPLETED' && !booking.review && Boolean(booking.providerId || provider);

  const confirmCancel = async () => {
    const reason = cancelReason === 'Other' ? cancelOther.trim() : cancelReason;
    if (!reason || reason.length < 5) {
      setCancelError('Please tell us why you are cancelling (at least 5 characters)');
      return;
    }
    setCancelling(true);
    setCancelError('');
    try {
      await bookingApi.cancel(bid, reason);
      toast.success('Booking cancelled');
      setCancelOpen(false);
      await reload();
    } catch (err) {
      setCancelError(err.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        {back}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-slate-400">#{booking.bookingNumber || bid}</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{booking.service?.name || 'Service booking'}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <BookingStatusBadge status={booking.status} />
              <span>
                {formatDate(booking.bookingDate)} · {booking.timeSlot}
              </span>
              {booking.bookingType === 'EMERGENCY' && <Badge tone="red">Emergency</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isCancellable(booking) && (
              <Button variant="danger-outline" icon={XCircle} onClick={() => setCancelOpen(true)}>
                {t('cancelBooking')}
              </Button>
            )}
            <LinkButton to={`/customer/complaints?bookingId=${bid}`} variant="secondary" icon={LifeBuoy}>
              {t('raiseComplaint')}
            </LinkButton>
          </div>
        </div>
      </div>

      {canReview && !showReview && (
        <Alert
          tone="success"
          title="Service completed — how did it go?"
          action={
            <Button size="sm" icon={Star} onClick={() => setShowReview(true)}>
              {t('leaveReview')}
            </Button>
          }
        >
          Your feedback helps other customers choose the right provider.
        </Alert>
      )}
      {canReview && showReview && (
        <Section title={t('leaveReview')} icon={Star}>
          <ReviewForm
            bookingId={bid}
            onCancel={() => setShowReview(false)}
            onSubmitted={(review) => {
              toast.success('Thank you! Your review was submitted.');
              setShowReview(false);
              setData((b) => ({ ...b, review }));
            }}
          />
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Section title={t('bookingTimeline')}>
            <BookingTimeline booking={booking} />
          </Section>

          <Section title="Problem description">
            <p className="text-sm text-slate-700 whitespace-pre-line">{booking.problemDescription || '—'}</p>
          </Section>

          {booking.review && (
            <Section title="Your review" icon={Star}>
              <RatingStars value={booking.review.rating} />
              {booking.review.comment && <p className="text-sm text-slate-700 mt-1">{booking.review.comment}</p>}
              {booking.review.providerReply && (
                <p className="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-slate-600">
                  <span className="font-semibold">Provider reply:</span> {booking.review.providerReply}
                </p>
              )}
            </Section>
          )}
        </div>

        <div className="space-y-5">
          <Section title={t('providerDetails')}>
            {provider ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ProviderAvatar provider={provider} />
                  <div className="min-w-0">
                    <Link to={`/customer/providers/${getId(provider)}`} className="text-sm font-bold text-slate-900 hover:text-primary-700">
                      {providerName(provider)}
                    </Link>
                    {isProviderVerified(provider) && (
                      <div>
                        <Badge tone="green" icon={BadgeCheck}>
                          {t('verified')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && provider.user && (
                  <ul className="text-xs text-slate-600 space-y-1">
                    {provider.user.phone && (
                      <li className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <a href={`tel:${provider.user.phone}`} className="hover:underline">
                          {provider.user.phone}
                        </a>
                      </li>
                    )}
                    {provider.user.email && (
                      <li className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <a href={`mailto:${provider.user.email}`} className="hover:underline break-all">
                          {provider.user.email}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">A verified provider will be assigned once your request is accepted.</p>
            )}
          </Section>

          <Section title={t('serviceAddress')} icon={MapPin}>
            <p className="text-sm text-slate-700">{booking.serviceAddress || '—'}</p>
            {booking.addressPincode && <p className="text-xs text-slate-500 mt-1">PIN {booking.addressPincode}</p>}
          </Section>

          <Section title={t('priceSnapshot')} icon={Wallet}>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('fixedPrice')}</dt>
                <dd className="font-extrabold text-slate-900">{formatCurrency(booking.totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('paymentMethod')}</dt>
                <dd className="font-medium text-slate-800">{paymentMethodLabel(booking.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">{t('paymentStatus')}</dt>
                <dd>
                  <PaymentStatusBadge status={paymentStatus} />
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-slate-400 mt-3">
              Price locked at booking time. Payment status is updated by the platform and cannot be changed here.
            </p>
          </Section>

          {booking.warranty && (
            <Section title="Warranty" icon={ShieldCheck}>
              <p className="text-sm text-slate-700">
                {booking.warranty.warrantyDays}-day warranty · valid until {formatDate(booking.warranty.endDate)}
              </p>
              <Badge tone={booking.warranty.isActive ? 'green' : 'slate'} className="mt-2">
                {booking.warranty.isActive ? 'Active' : 'Expired'}
              </Badge>
            </Section>
          )}

          <p className="text-[11px] text-slate-400 px-1">Booked on {formatDateTime(booking.createdAt)}</p>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title={t('cancelBooking')}
        confirmLabel={t('cancelBooking')}
        cancelLabel="Keep booking"
        loading={cancelling}
        onCancel={() => {
          setCancelOpen(false);
          setCancelError('');
        }}
        onConfirm={confirmCancel}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Cancel booking <span className="font-mono">#{booking.bookingNumber}</span> on {formatDate(booking.bookingDate)}?
          </p>
          <Select label={t('cancellationReason')} required value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          {cancelReason === 'Other' && (
            <TextArea label="Tell us more" required rows={2} value={cancelOther} onChange={(e) => setCancelOther(e.target.value)} />
          )}
          {cancelError && <Alert tone="error">{cancelError}</Alert>}
        </div>
      </ConfirmDialog>
    </div>
  );
}
