import React, { useMemo } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { PageHeader, Tabs, LoadingList, ErrorState, EmptyState, LinkButton, Pagination } from '../../components/ui';
import BookingCard from '../../components/customer/BookingCard';
import useAsync from '../../hooks/useAsync';
import useUrlFilters from '../../hooks/useUrlFilters';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi } from '../../services/customerApi';
import { filterBookings, getId, paginate } from '../../utils/customer';

const TAB_KEYS = [
  ['upcoming', 'tabUpcoming'],
  ['pending', 'tabPending'],
  ['active', 'tabActive'],
  ['completed', 'tabCompleted'],
  ['cancelled', 'tabCancelled'],
  ['all', 'tabAll'],
];
const PAGE_SIZE = 10;

export default function CustomerBookings() {
  const { t } = useLanguage();
  const [filters, setFilters] = useUrlFilters({ tab: 'upcoming', page: 1 });
  const { data, loading, error, reload } = useAsync(() => bookingApi.mine(), [], { initialData: [] });

  const bookings = data || [];
  const tabs = useMemo(
    () =>
      TAB_KEYS.map(([key, labelKey]) => ({
        key,
        label: t(labelKey),
        count: loading ? undefined : key === 'all' ? bookings.length : filterBookings(bookings, key).length,
      })),
    [bookings, loading, t]
  );

  const visible = useMemo(() => {
    const list = filters.tab === 'all' ? bookings : filterBookings(bookings, filters.tab);
    if (filters.tab === 'upcoming') {
      return [...list].sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
    }
    return list;
  }, [bookings, filters.tab]);
  const paged = paginate(visible, filters.page, PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('bookingsTitle')}
        actions={
          <LinkButton to="/customer/book" icon={Plus}>
            {t('bookAService')}
          </LinkButton>
        }
      />
      <Tabs
        tabs={tabs}
        active={filters.tab}
        onChange={(tab) => setFilters({ tab })}
        label="Booking status"
        idPrefix="booking-tab"
      />
      <div id="booking-tab-panel" role="tabpanel" aria-labelledby={`booking-tab-${filters.tab}`} aria-busy={loading}>
        {loading ? (
          <LoadingList label="Loading bookings…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} title="Could not load your bookings" />
        ) : paged.items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={t('noBookings')}
            description="When you book a service it will appear here."
            action={<LinkButton to="/customer/services">{t('servicesTitle')}</LinkButton>}
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {paged.items.map((b) => (
                <li key={getId(b)}>
                  <BookingCard booking={b} />
                </li>
              ))}
            </ul>
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              onChange={(p) => setFilters({ page: p }, { resetPage: false })}
              label="Booking pages"
            />
          </>
        )}
      </div>
    </div>
  );
}
