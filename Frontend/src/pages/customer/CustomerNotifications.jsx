import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarCheck, CheckCheck, Check, Trash2 } from 'lucide-react';
import { PageHeader, Card, Tabs, Button, LoadingList, ErrorState, EmptyState, Badge } from '../../components/ui';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { notificationApi } from '../../services/customerApi';
import { formatDateTime, getId } from '../../utils/customer';

export default function CustomerNotifications() {
  const { t } = useLanguage();
  const toast = useToast();
  const shared = useNotifications(); // keeps the header badge in sync
  const { data, setData, loading, error, reload } = useAsync(() => notificationApi.list(), [], {
    initialData: { notifications: [], unreadCount: 0 },
  });
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const visible = useMemo(() => {
    if (tab === 'unread') return notifications.filter((n) => !n.isRead);
    if (tab === 'booking') return notifications.filter((n) => n.type === 'BOOKING');
    return notifications;
  }, [notifications, tab]);

  const patchLocal = (fn) => setData((d) => ({ ...d, notifications: fn(d.notifications) }));

  const markRead = async (n) => {
    const id = getId(n);
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      patchLocal((list) => list.map((x) => (getId(x) === id ? { ...x, isRead: true } : x)));
      shared.fetchNotifications?.();
    } catch (err) {
      toast.error(err.message || 'Could not update notification');
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      patchLocal((list) => list.map((x) => ({ ...x, isRead: true })));
      shared.fetchNotifications?.();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message || 'Could not mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const remove = async (n) => {
    const id = getId(n);
    setBusyId(id);
    try {
      await notificationApi.remove(id);
      patchLocal((list) => list.filter((x) => getId(x) !== id));
      shared.fetchNotifications?.();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error(err.message || 'Could not delete notification');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('notificationsTitle')}
        description={unreadCount ? `${unreadCount} unread` : 'You are all caught up.'}
        actions={
          <Button variant="secondary" icon={CheckCheck} onClick={markAll} loading={markingAll} disabled={!unreadCount}>
            {t('markAllRead')}
          </Button>
        }
      />
      <Tabs
        tabs={[
          { key: 'all', label: t('tabAll'), count: notifications.length },
          { key: 'unread', label: t('unread'), count: unreadCount },
          { key: 'booking', label: t('navBookings'), count: notifications.filter((n) => n.type === 'BOOKING').length },
        ]}
        active={tab}
        onChange={setTab}
        label="Notification filter"
        idPrefix="notif-tab"
      />
      <div id="notif-tab-panel" role="tabpanel" aria-labelledby={`notif-tab-${tab}`}>
        {loading ? (
          <LoadingList label="Loading notifications…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} title="Could not load notifications" />
        ) : visible.length === 0 ? (
          <EmptyState icon={Bell} title={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'} />
        ) : (
          <ul className="space-y-2">
            {visible.map((n) => {
              const id = getId(n);
              const Icon = n.type === 'BOOKING' ? CalendarCheck : Bell;
              return (
                <li key={id}>
                  <Card className={`p-4 flex gap-3 ${n.isRead ? '' : 'border-primary-200 bg-primary-50/30'}`}>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        n.isRead ? 'bg-slate-100 text-slate-400' : 'bg-primary-100 text-primary-700'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm ${n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{n.title}</p>
                        {!n.isRead && <Badge tone="primary">{t('unread')}</Badge>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                        {n.link && n.link.startsWith('/customer') && (
                          <Link
                            to={n.link}
                            onClick={() => !n.isRead && markRead(n)}
                            className="text-[11px] font-semibold text-primary-700 hover:underline"
                          >
                            {n.type === 'BOOKING' ? t('viewBooking') : t('cViewDetails')}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                      {!n.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Check}
                          onClick={() => markRead(n)}
                          disabled={busyId === id}
                          aria-label={`Mark "${n.title}" as read`}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => remove(n)}
                        disabled={busyId === id}
                        aria-label={`Delete "${n.title}"`}
                      />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
