import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { PageHeader, LoadingGrid, ErrorState, EmptyState, Pagination, Button } from '../../components/ui';
import ProviderCard from '../../components/customer/ProviderCard';
import DiscoveryFilters from '../../components/customer/DiscoveryFilters';
import useAsync from '../../hooks/useAsync';
import useUrlFilters from '../../hooks/useUrlFilters';
import { useLanguage } from '../../context/LanguageContext';
import { catalogApi, providerApi } from '../../services/customerApi';
import { getId, isProviderVerified, paginate, providerStartingPrice } from '../../utils/customer';

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
  available: false,
  page: 1,
};

const includesCI = (haystack, needle) => (haystack || '').toLowerCase().includes(needle.toLowerCase());

/** Server filters: search/category/pincode/minRating/isAvailable. City/area/price/verified applied client-side. */
export function applyProviderClientFilters(providers, f) {
  return providers.filter((p) => {
    if (f.city && !includesCI(p.city, f.city)) return false;
    if (f.area && !includesCI(p.area, f.area)) return false;
    if (f.verified && !isProviderVerified(p)) return false;
    const price = providerStartingPrice(p);
    if (f.minPrice !== '' && f.minPrice !== undefined && (price === null || price < Number(f.minPrice))) return false;
    if (f.maxPrice !== '' && f.maxPrice !== undefined && (price === null || price > Number(f.maxPrice))) return false;
    return true;
  });
}

export default function CustomerProviders() {
  const { t } = useLanguage();
  const [filters, setFilters, resetFilters] = useUrlFilters(DEFAULTS);
  const categories = useAsync(() => catalogApi.categories(), [], { initialData: [] });

  const serverKey = JSON.stringify([filters.search, filters.category, filters.pincode, filters.minRating, filters.available]);
  const providers = useAsync(
    () =>
      providerApi.list({
        search: filters.search,
        category: filters.category,
        pincode: filters.pincode,
        minRating: filters.minRating,
        isAvailable: filters.available ? 'true' : undefined,
      }),
    [serverKey],
    { initialData: [] }
  );

  const filtered = useMemo(() => applyProviderClientFilters(providers.data || [], filters), [providers.data, filters]);
  const paged = useMemo(() => paginate(filtered, filters.page, PAGE_SIZE), [filtered, filters.page]);

  return (
    <div className="space-y-5">
      <PageHeader title={t('providersTitle')} description={t('providersSubtitle')} />

      <DiscoveryFilters
        values={filters}
        onApply={(v) => setFilters(v)}
        onReset={resetFilters}
        categories={categories.data || []}
        categoryValueKey="name"
        fields={['search', 'category', 'city', 'area', 'pincode', 'minPrice', 'maxPrice', 'minRating', 'verified', 'available']}
        searchPlaceholder={t('searchProviders')}
      />

      <section aria-labelledby="provider-results-heading" aria-busy={providers.loading}>
        <h2 id="provider-results-heading" className="sr-only">
          Provider results
        </h2>
        {providers.loading ? (
          <LoadingGrid label="Loading providers…" lines={4} />
        ) : providers.error ? (
          <ErrorState error={providers.error} onRetry={providers.reload} title="Could not load providers" />
        ) : paged.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('noProvidersFound')}
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
              {filtered.length} provider{filtered.length === 1 ? '' : 's'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paged.items.map((p) => (
                <ProviderCard key={getId(p)} provider={p} />
              ))}
            </div>
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              onChange={(p) => setFilters({ page: p }, { resetPage: false })}
              label="Provider results pages"
            />
          </>
        )}
      </section>
    </div>
  );
}
