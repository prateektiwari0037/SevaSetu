import React, { useMemo } from 'react';
import { Wrench } from 'lucide-react';
import { PageHeader, LoadingGrid, ErrorState, EmptyState, Pagination, Button } from '../../components/ui';
import ServiceCard from '../../components/customer/ServiceCard';
import DiscoveryFilters from '../../components/customer/DiscoveryFilters';
import useAsync from '../../hooks/useAsync';
import useUrlFilters from '../../hooks/useUrlFilters';
import { useLanguage } from '../../context/LanguageContext';
import { catalogApi, providerApi } from '../../services/customerApi';
import { getId, paginate } from '../../utils/customer';

const PAGE_SIZE = 9;
const DEFAULTS = {
  search: '',
  category: '',
  city: '',
  area: '',
  pincode: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  verified: false,
  page: 1,
};

const includesCI = (haystack, needle) => (haystack || '').toLowerCase().includes(needle.toLowerCase());

/**
 * Loads services with server-side filters (category/search/price). Location,
 * rating and verified filters are provider attributes, so when any is set we
 * load matching providers and keep only services that at least one offers.
 */
export async function loadFilteredServices(f) {
  const services = await catalogApi.services({
    categoryId: f.category,
    search: f.search,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
  });
  const needsProviders = f.city || f.area || f.pincode || f.minRating || f.verified;
  if (!needsProviders) return services;

  let providers = await providerApi.list({ pincode: f.pincode, minRating: f.minRating });
  if (f.city) providers = providers.filter((p) => includesCI(p.city, f.city));
  if (f.area) providers = providers.filter((p) => includesCI(p.area, f.area));
  if (f.verified) providers = providers.filter((p) => p.verificationStatus === 'APPROVED');

  const offered = new Set();
  providers.forEach((p) =>
    (p.services || []).forEach((ps) => offered.add(ps.serviceId || getId(ps.service)))
  );
  return services.filter((s) => offered.has(getId(s)));
}

export default function CustomerServices() {
  const { t } = useLanguage();
  const [filters, setFilters, resetFilters] = useUrlFilters(DEFAULTS);
  const categories = useAsync(() => catalogApi.categories(), [], { initialData: [] });

  const { page, ...query } = filters;
  const queryKey = JSON.stringify(query);
  const services = useAsync(() => loadFilteredServices(query), [queryKey], { initialData: [] });

  const paged = useMemo(() => paginate(services.data || [], page, PAGE_SIZE), [services.data, page]);

  return (
    <div className="space-y-5">
      <PageHeader title={t('servicesTitle')} description={t('servicesSubtitle')} />

      <DiscoveryFilters
        values={filters}
        onApply={(v) => setFilters(v)}
        onReset={resetFilters}
        categories={categories.data || []}
        fields={['search', 'category', 'city', 'area', 'pincode', 'minPrice', 'maxPrice', 'minRating', 'verified']}
        searchPlaceholder={t('searchServices')}
      />

      {categories.data?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Quick category filter">
          <button
            type="button"
            onClick={() => setFilters({ category: '' })}
            aria-pressed={!filters.category}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
              !filters.category ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.data.map((c) => (
            <button
              key={getId(c)}
              type="button"
              onClick={() => setFilters({ category: getId(c) })}
              aria-pressed={filters.category === getId(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                filters.category === getId(c) ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <section aria-labelledby="service-results-heading" aria-busy={services.loading}>
        <h2 id="service-results-heading" className="sr-only">
          Service results
        </h2>
        {services.loading ? (
          <LoadingGrid label="Loading services…" />
        ) : services.error ? (
          <ErrorState error={services.error} onRetry={services.reload} title="Could not load services" />
        ) : paged.items.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={t('noServicesFound')}
            description={t('tryAdjustingFilters')}
            action={
              <Button variant="secondary" onClick={resetFilters}>
                {t('clearFilters')}
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3" aria-live="polite">
              {services.data.length} service{services.data.length === 1 ? '' : 's'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paged.items.map((s) => (
                <ServiceCard key={getId(s)} service={s} />
              ))}
            </div>
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              onChange={(p) => setFilters({ page: p }, { resetPage: false })}
              label="Service results pages"
            />
          </>
        )}
      </section>
    </div>
  );
}
