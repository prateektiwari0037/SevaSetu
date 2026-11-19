import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Bell, CalendarCheck, CheckCircle2, Clock, Heart, MapPin, Search, Wrench } from 'lucide-react';
import { Card, ErrorState, EmptyState, LinkButton, LoadingGrid, Skeleton } from '../../components/ui';
import BookingCard from '../../components/customer/BookingCard';
import ServiceCard from '../../components/customer/ServiceCard';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { bookingApi, catalogApi } from '../../services/customerApi';
import { customerName, filterBookings, formatDateTime, getId } from '../../utils/customer';

/** Rank categories by how many services they contain (popularity proxy available from the API). */
export const rankCategories = (categories, services) => {
  const counts = {};
  services.forEach((s) => {
    const cid = s.categoryId || getId(s.category);
    counts[cid] = (counts[cid] || 0) + 1;
  });
  return [...categories]
    .map((c) => ({ ...c, serviceCount: counts[getId(c)] || 0 }))
    .sort((a, b) => b.serviceCount - a.serviceCount || (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
};

/** Services with at least one active provider, most-offered first. */
export const recommendServices = (services, limit = 3) =>
  [...services]
    .filter((s) => (s._count?.providerServices ?? 1) > 0)
    .sort((a, b) => (b._count?.providerServices ?? 0) - (a._count?.providerServices ?? 0))
    .slice(0, limit);

function StatTile({ icon: Icon, label, value, tone, to }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <Link
      to={to}
      className="block bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:border-primary-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`} aria-hidden="true">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
      </div>
    </Link>
  );
}

export default function CustomerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const bookings = useAsync(() => bookingApi.mine(), [], { initialData: [] });
  const catalog = useAsync(
    async () => {
      const [categories, services] = await Promise.all([catalogApi.categories(), catalogApi.services()]);
      return { categories, services };
    },
    [],
    { initialData: { categories: [], services: [] } }
  );

  const all = bookings.data || [];
  const upcoming = useMemo(
    () => filterBookings(all, 'upcoming').sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate)),
    [all]
  );
  const active = useMemo(() => filterBookings(all, 'active'), [all]);
  const completed = useMemo(() => filterBookings(all, 'completed'), [all]);
  const categories = useMemo(
    () => rankCategories(catalog.data.categories, catalog.data.services).slice(0, 8),
    [catalog.data]
  );
  const recommended = useMemo(() => recommendServices(catalog.data.services), [catalog.data]);
  const recentNotifications = (notifications || []).slice(0, 4);

  const quickActions = [
    { to: '/customer/book', label: t('bookAService'), icon: Wrench, cls: 'bg-primary-600 text-white hover:bg-primary-700' },
    { to: '/customer/services', label: t('servicesTitle'), icon: Search, cls: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
    { to: '/customer/emergency', label: t('cNavEmergency'), icon: AlertCircle, cls: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' },
    { to: '/customer/favorites', label: t('cNavFavorites'), icon: Heart, cls: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
    { to: '/customer/addresses', label: t('cNavAddresses'), icon: MapPin, cls: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary-700 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          {t('welcomeBack')}, {customerName(user)} 👋
        </h1>
        <p className="text-sm text-primary-50 mt-1 max-w-xl">{t('dashboardSubtitle')}</p>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {quickActions.map(({ to, label, icon: Icon, cls }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${cls}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Booking summary" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {bookings.loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[74px] rounded-2xl" />)
        ) : (
          <>
            <StatTile icon={Clock} label={t('upcomingBookings')} value={upcoming.length} tone="amber" to="/customer/bookings?tab=upcoming" />
            <StatTile icon={CalendarCheck} label={t('activeBookings')} value={active.length} tone="indigo" to="/customer/bookings?tab=active" />
            <StatTile icon={CheckCircle2} label={t('completedBookings')} value={completed.length} tone="green" to="/customer/bookings?tab=completed" />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-3" aria-labelledby="upcoming-heading">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-heading" className="text-base font-bold text-slate-900">
              {t('upcomingBookings')}
            </h2>
            <Link to="/customer/bookings" className="text-xs font-semibold text-primary-700 hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          {bookings.loading ? (
            <LoadingGrid count={2} columns="md:grid-cols-2" label="Loading bookings…" />
          ) : bookings.error ? (
            <ErrorState error={bookings.error} onRetry={bookings.reload} title="Could not load bookings" />
          ) : upcoming.length === 0 && active.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No upcoming bookings"
              description="Book a trusted professional in a few taps."
              action={<LinkButton to="/customer/book">{t('bookAService')}</LinkButton>}
            />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...new Map([...active, ...upcoming].map((b) => [getId(b), b])).values()].slice(0, 4).map((b) => (
                <li key={getId(b)}>
                  <BookingCard booking={b} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-notifs-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-notifs-heading" className="text-base font-bold text-slate-900">
              {t('recentNotifications')}
            </h2>
            <Link to="/customer/notifications" className="text-xs font-semibold text-primary-700 hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <Card className="divide-y divide-slate-100">
            {recentNotifications.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-300" aria-hidden="true" /> No notifications yet.
              </p>
            ) : (
              recentNotifications.map((n) => (
                <div key={getId(n)} className="p-3.5">
                  <p className={`text-xs ${n.isRead ? 'text-slate-700 font-medium' : 'text-slate-900 font-bold'}`}>
                    {!n.isRead && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5 align-middle" aria-label="Unread" />}
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      <section aria-labelledby="categories-heading" className="space-y-3">
        <h2 id="categories-heading" className="text-base font-bold text-slate-900">
          {t('popularCategoriesShort')}
        </h2>
        {catalog.loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : catalog.error ? (
          <ErrorState error={catalog.error} onRetry={catalog.reload} title="Could not load categories" />
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((c) => (
              <li key={getId(c)}>
                <Link
                  to={`/customer/services?category=${getId(c)}`}
                  className="block p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {c.serviceCount} service{c.serviceCount === 1 ? '' : 's'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!catalog.loading && !catalog.error && recommended.length > 0 && (
        <section aria-labelledby="recommended-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recommended-heading" className="text-base font-bold text-slate-900">
              {t('recommendedServices')}
            </h2>
            <Link to="/customer/services" className="text-xs font-semibold text-primary-700 hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommended.map((s) => (
              <ServiceCard key={getId(s)} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
