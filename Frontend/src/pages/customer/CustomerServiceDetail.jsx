import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, Users } from 'lucide-react';
import {
  PageHeader,
  Card,
  Badge,
  LinkButton,
  ErrorState,
  EmptyState,
  LoadingGrid,
  Skeleton,
} from '../../components/ui';
import ProviderCard from '../../components/customer/ProviderCard';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { catalogApi } from '../../services/customerApi';
import { formatCurrency, getId, serviceDuration, serviceWarranty } from '../../utils/customer';

export default function CustomerServiceDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { data: service, loading, error, reload } = useAsync(() => catalogApi.service(id), [id]);

  const back = (
    <Link to="/customer/services" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700 mb-2">
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('servicesTitle')}
    </Link>
  );

  if (loading) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading service…</span>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <LoadingGrid count={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <ErrorState error={error} onRetry={reload} title={error.status === 404 ? 'Service not found' : 'Could not load service'} />
      </div>
    );
  }

  const providerServices = (service?.providerServices || []).filter((ps) => ps.provider);
  const duration = serviceDuration(service);
  const warranty = serviceWarranty(service);
  const sid = getId(service);

  return (
    <div className="space-y-6">
      <PageHeader
        backLink={back}
        title={service.name}
        description={service.category?.name}
        actions={
          <LinkButton to={`/customer/book/${sid}`} size="lg">
            {t('cBookNow')}
          </LinkButton>
        }
      />

      <Card className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{service.description || 'No description provided.'}</p>
          <div className="flex flex-wrap gap-2">
            {duration ? <Badge icon={Clock}>{duration} min</Badge> : null}
            {warranty ? (
              <Badge tone="green" icon={ShieldCheck}>
                {warranty}-day warranty
              </Badge>
            ) : null}
            <Badge tone="blue" icon={Users}>
              {providerServices.length} verified provider{providerServices.length === 1 ? '' : 's'}
            </Badge>
          </div>
          {Array.isArray(service.inclusions) && service.inclusions.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Included</h3>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {service.inclusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] uppercase font-semibold text-slate-400">{t('fixedPrice')}</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(service.basePrice)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {t('cashOnService')} · No negotiation. Individual providers may list their own fixed price.
          </p>
        </div>
      </Card>

      <section aria-labelledby="service-providers-heading">
        <h2 id="service-providers-heading" className="text-base font-bold text-slate-900 mb-3">
          {t('selectProvider')}
        </h2>
        {providerServices.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No providers currently available for this service"
            description="You can still place a request — an available verified provider can accept it."
            action={<LinkButton to={`/customer/book/${sid}`}>{t('cBookNow')}</LinkButton>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {providerServices.map((ps) => {
              const price = ps.customPrice ?? service.basePrice;
              const pid = getId(ps.provider);
              return (
                <ProviderCard
                  key={getId(ps) || pid}
                  provider={ps.provider}
                  price={price}
                  actions={
                    <LinkButton
                      to={`/customer/book/${sid}?providerId=${pid}`}
                      size="sm"
                      aria-label={`Book ${service.name} with ${ps.provider.businessName || ps.provider.fullName}`}
                    >
                      {t('cBookNow')}
                    </LinkButton>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
