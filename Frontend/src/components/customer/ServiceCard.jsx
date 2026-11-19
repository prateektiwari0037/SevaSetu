import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, Users } from 'lucide-react';
import { Card, Badge, LinkButton } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, getId, serviceDuration, serviceWarranty } from '../../utils/customer';

export default function ServiceCard({ service, basePath = '/customer/services' }) {
  const { t } = useLanguage();
  const id = getId(service);
  const duration = serviceDuration(service);
  const warranty = serviceWarranty(service);
  const providerCount = service?._count?.providerServices ?? service?.providerServices?.length;

  return (
    <Card as="article" className="p-5 flex flex-col hover:shadow-lg hover:border-primary-300 transition">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge tone="primary">{service?.category?.name || 'General'}</Badge>
        {warranty ? (
          <Badge tone="green" icon={ShieldCheck}>
            {warranty}d warranty
          </Badge>
        ) : null}
      </div>
      <h3 className="text-base font-bold text-slate-900">
        <Link to={`${basePath}/${id}`} className="hover:text-primary-700 focus:outline-none focus-visible:underline">
          {service?.name}
        </Link>
      </h3>
      {service?.description && (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{service.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-3">
        {duration ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {duration} min
          </span>
        ) : null}
        {providerCount !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            {providerCount} provider{providerCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-slate-100 mt-4">
        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">{t('fixedPrice')}</span>
          <span className="text-lg font-extrabold text-slate-900">{formatCurrency(service?.basePrice)}</span>
        </div>
        <div className="flex gap-2">
          <LinkButton to={`${basePath}/${id}`} variant="subtle" size="sm" aria-label={`View details for ${service?.name}`}>
            {t('cViewDetails')}
          </LinkButton>
          <LinkButton to={`/customer/book/${id}`} size="sm" aria-label={`Book ${service?.name}`}>
            {t('cBookNow')}
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}
