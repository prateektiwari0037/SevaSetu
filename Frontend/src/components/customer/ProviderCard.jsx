import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Briefcase, CalendarClock, MapPin } from 'lucide-react';
import { Card, Badge, LinkButton, RatingStars } from '../ui';
import FavoriteButton from './FavoriteButton';
import { useLanguage } from '../../context/LanguageContext';
import {
  availabilitySummary,
  formatCurrency,
  getId,
  isProviderVerified,
  providerCategories,
  providerName,
  providerRating,
  providerReviewCount,
  providerServiceArea,
  providerStartingPrice,
} from '../../utils/customer';

export function ProviderAvatar({ provider, size = 'md' }) {
  const name = providerName(provider);
  const dims = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-base';
  if (provider?.avatarUrl) {
    return <img src={provider.avatarUrl} alt="" className={`${dims} rounded-2xl object-cover bg-slate-100 shrink-0`} />;
  }
  return (
    <div
      className={`${dims} rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Provider summary card. `price` overrides the computed "starting from" price
 * (used when listing providers for one specific service).
 */
export default function ProviderCard({ provider, price, actions, basePath = '/customer/providers' }) {
  const { t } = useLanguage();
  const id = getId(provider);
  const name = providerName(provider);
  const categories = providerCategories(provider);
  const verified = isProviderVerified(provider);
  const displayPrice = price ?? providerStartingPrice(provider);

  return (
    <Card as="article" className="p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <ProviderAvatar provider={provider} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              <Link to={`${basePath}/${id}`} className="hover:text-primary-700 focus:outline-none focus-visible:underline">
                {name}
              </Link>
            </h3>
            <FavoriteButton provider={provider} size="sm" />
          </div>
          {provider?.businessName && provider?.fullName && (
            <p className="text-xs text-slate-500 truncate">{provider.fullName}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RatingStars value={providerRating(provider)} count={providerReviewCount(provider)} />
            {verified ? (
              <Badge tone="green" icon={BadgeCheck}>
                {t('verified')}
              </Badge>
            ) : (
              <Badge tone="slate">{t('notVerified')}</Badge>
            )}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.slice(0, 3).map((c) => (
            <Badge key={c} tone="primary">
              {c}
            </Badge>
          ))}
        </div>
      )}

      <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t('cExperience')}</dt>
          <dd>
            {provider?.experienceYears ?? 0} {t('years')} {t('cExperience').toLowerCase()}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t('serviceArea')}</dt>
          <dd className="truncate">{providerServiceArea(provider)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t('availability')}</dt>
          <dd className="truncate">{availabilitySummary(provider)}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-slate-100 mt-4">
        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            {price !== undefined ? t('fixedPrice') : t('startingFrom')}
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {displayPrice !== null && displayPrice !== undefined ? formatCurrency(displayPrice) : '—'}
          </span>
        </div>
        {actions || (
          <LinkButton to={`${basePath}/${id}`} size="sm" variant="secondary" aria-label={`View profile of ${name}`}>
            {t('cViewDetails')}
          </LinkButton>
        )}
      </div>
    </Card>
  );
}
