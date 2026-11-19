import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Briefcase, CalendarClock, MapPin, MessageSquare } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Badge,
  LinkButton,
  ErrorState,
  EmptyState,
  RatingStars,
  Skeleton,
  LoadingGrid,
} from '../../components/ui';
import { ProviderAvatar } from '../../components/customer/ProviderCard';
import FavoriteButton from '../../components/customer/FavoriteButton';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { providerApi } from '../../services/customerApi';
import {
  availabilitySummary,
  formatCurrency,
  formatDate,
  getId,
  isProviderVerified,
  providerCategories,
  providerName,
  providerRating,
  providerReviewCount,
  providerServiceArea,
} from '../../utils/customer';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CustomerProviderDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { data: provider, loading, error, reload } = useAsync(() => providerApi.get(id), [id]);

  const back = (
    <Link to="/customer/providers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700">
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('providersTitle')}
    </Link>
  );

  if (loading) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading provider…</span>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <LoadingGrid count={2} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <ErrorState error={error} onRetry={reload} title={error.status === 404 ? 'Provider not found' : 'Could not load provider'} />
      </div>
    );
  }

  const pid = getId(provider);
  const services = (provider.services || []).filter((ps) => ps.service && ps.isActive !== false);
  const reviews = provider.reviews || [];
  const verified = isProviderVerified(provider);
  const weekly = [...(provider.availability || [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="space-y-6">
      {back}
      {!verified && (
        <Alert tone="warning" title="This provider is not verified yet">
          Bookings are only available with verified providers.
        </Alert>
      )}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <ProviderAvatar provider={provider} size="lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{providerName(provider)}</h1>
                {provider.businessName && <p className="text-sm text-slate-500">{provider.fullName}</p>}
              </div>
              <FavoriteButton provider={provider} showLabel />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RatingStars value={providerRating(provider)} count={providerReviewCount(provider)} size="lg" />
              {verified ? (
                <Badge tone="green" icon={BadgeCheck}>
                  {t('verified')}
                </Badge>
              ) : (
                <Badge>{t('notVerified')}</Badge>
              )}
              {provider.isAvailable === false && <Badge tone="amber">Currently unavailable</Badge>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {providerCategories(provider).map((c) => (
                <Badge key={c} tone="primary">
                  {c}
                </Badge>
              ))}
            </div>
            {provider.bio && <p className="text-sm text-slate-600 leading-relaxed">{provider.bio}</p>}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-sm">
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase font-semibold text-slate-400">{t('cExperience')}</dt>
                  <dd className="font-medium text-slate-800">
                    {provider.experienceYears ?? 0} {t('years')}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase font-semibold text-slate-400">{t('serviceArea')}</dt>
                  <dd className="font-medium text-slate-800">{providerServiceArea(provider)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase font-semibold text-slate-400">{t('availability')}</dt>
                  <dd className="font-medium text-slate-800">{availabilitySummary(provider)}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3" aria-labelledby="provider-services-heading">
          <h2 id="provider-services-heading" className="text-base font-bold text-slate-900">
            Services offered
          </h2>
          {services.length === 0 ? (
            <EmptyState title="This provider has not listed any services yet" />
          ) : (
            <ul className="space-y-3">
              {services.map((ps) => {
                const sid = ps.serviceId || getId(ps.service);
                const price = ps.customPrice ?? ps.service.basePrice;
                return (
                  <li key={getId(ps) || sid}>
                    <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{ps.service.name}</p>
                        <p className="text-xs text-slate-500">{ps.service.category?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-slate-900">{formatCurrency(price)}</span>
                        {verified ? (
                          <LinkButton
                            to={`/customer/book/${sid}?providerId=${pid}`}
                            size="sm"
                            aria-label={`Book ${ps.service.name} with ${providerName(provider)}`}
                          >
                            {t('cBookNow')}
                          </LinkButton>
                        ) : (
                          <Button size="sm" disabled title="Only verified providers can be booked">
                            {t('cBookNow')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}

          <h2 className="text-base font-bold text-slate-900 pt-3">Customer reviews</h2>
          {reviews.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No reviews yet" />
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={getId(r)}>
                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{r.customer?.fullName || 'Customer'}</p>
                      <span className="text-[11px] text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <RatingStars value={r.rating} />
                    {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                    {r.providerReply && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-semibold">Provider reply:</span> {r.providerReply}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="provider-hours-heading">
          <Card className="p-4">
            <h2 id="provider-hours-heading" className="text-sm font-bold text-slate-900 mb-2">
              Weekly availability
            </h2>
            {weekly.length === 0 ? (
              <p className="text-xs text-slate-500">Working hours not published. Pick a slot when booking and the provider will confirm.</p>
            ) : (
              <ul className="text-xs divide-y divide-slate-100">
                {weekly.map((d) => (
                  <li key={d.dayOfWeek} className="flex justify-between py-1.5">
                    <span className="font-medium text-slate-700">{DAYS[d.dayOfWeek]}</span>
                    <span className={d.isAvailable === false ? 'text-slate-400' : 'text-slate-600'}>
                      {d.isAvailable === false ? 'Closed' : `${d.startTime}–${d.endTime}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
