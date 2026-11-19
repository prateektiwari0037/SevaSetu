import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { PageHeader, Card, LoadingList, ErrorState, EmptyState, Button, RatingStars, Modal } from '../../components/ui';
import ReviewForm from '../../components/customer/ReviewForm';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi, reviewApi } from '../../services/customerApi';
import { formatDate, getId, providerName } from '../../utils/customer';

/** Completed bookings with an assigned provider and no review yet. */
export const reviewEligibleBookings = (bookings, reviews) => {
  const reviewed = new Set(reviews.map((r) => r.bookingId || getId(r.booking)));
  return bookings.filter(
    (b) => b.status === 'COMPLETED' && !b.review && (b.providerId || b.provider) && !reviewed.has(getId(b))
  );
};

export default function CustomerReviews() {
  const { t } = useLanguage();
  const toast = useToast();
  const data = useAsync(
    async () => {
      const [bookings, reviews] = await Promise.all([bookingApi.mine({ status: 'COMPLETED' }), reviewApi.mine()]);
      return { bookings, reviews };
    },
    [],
    { initialData: { bookings: [], reviews: [] } }
  );
  const [reviewing, setReviewing] = useState(null);

  const eligible = useMemo(
    () => reviewEligibleBookings(data.data?.bookings || [], data.data?.reviews || []),
    [data.data]
  );
  const history = data.data?.reviews || [];

  return (
    <div className="space-y-6">
      <PageHeader title={t('reviewsTitle')} description="Rate completed services and see the reviews you've written." />

      {data.loading ? (
        <LoadingList label="Loading reviews…" />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} title="Could not load reviews" />
      ) : (
        <>
          <section aria-labelledby="awaiting-review-heading" className="space-y-3">
            <h2 id="awaiting-review-heading" className="text-base font-bold text-slate-900">
              {t('awaitingReview')} <span className="text-slate-400 font-medium">({eligible.length})</span>
            </h2>
            {eligible.length === 0 ? (
              <p className="text-sm text-slate-500">You're all caught up — no completed bookings are waiting for a review.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eligible.map((b) => (
                  <li key={getId(b)}>
                    <Card className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/customer/bookings/${getId(b)}`} className="text-sm font-bold text-slate-900 hover:text-primary-700">
                          {b.service?.name}
                        </Link>
                        <p className="text-xs text-slate-500 truncate">
                          {b.provider ? providerName(b.provider) : 'Provider'} · {formatDate(b.completedAt || b.bookingDate)}
                        </p>
                      </div>
                      <Button size="sm" icon={Star} onClick={() => setReviewing(b)}>
                        {t('leaveReview')}
                      </Button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="review-history-heading" className="space-y-3">
            <h2 id="review-history-heading" className="text-base font-bold text-slate-900">
              {t('reviewHistory')}
            </h2>
            {history.length === 0 ? (
              <EmptyState icon={MessageSquare} title="You haven't written any reviews yet" />
            ) : (
              <ul className="space-y-3">
                {history.map((r) => (
                  <li key={getId(r)}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{r.booking?.service?.name || 'Service'}</p>
                          <p className="text-xs text-slate-500">{r.provider ? providerName(r.provider) : ''}</p>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <RatingStars value={r.rating} />
                      {r.comment && <p className="text-sm text-slate-700 mt-1">{r.comment}</p>}
                      {r.providerReply && (
                        <p className="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-slate-600">
                          <span className="font-semibold">Provider reply:</span> {r.providerReply}
                        </p>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Modal open={Boolean(reviewing)} onClose={() => setReviewing(null)} title={`${t('leaveReview')}: ${reviewing?.service?.name || ''}`}>
        {reviewing && (
          <ReviewForm
            bookingId={getId(reviewing)}
            onCancel={() => setReviewing(null)}
            onSubmitted={() => {
              toast.success('Thank you! Your review was submitted.');
              setReviewing(null);
              data.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
