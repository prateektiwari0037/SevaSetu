import React, { useState } from 'react';
import { CheckCircle2, Layers } from 'lucide-react';
import { PageHeader, Card, Badge, Button, LoadingGrid, ErrorState, EmptyState, ConfirmDialog, Alert } from '../../components/ui';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { subscriptionApi } from '../../services/customerApi';
import { formatCurrency, formatDate, getId } from '../../utils/customer';

const daysLeft = (end) => Math.max(0, Math.ceil((new Date(end) - Date.now()) / 86400000));

export default function CustomerSubscriptions() {
  const { t } = useLanguage();
  const toast = useToast();
  const data = useAsync(
    async () => {
      const [plans, mine] = await Promise.all([subscriptionApi.plans(), subscriptionApi.mine()]);
      return { plans, mine };
    },
    [],
    { initialData: { plans: [], mine: [] } }
  );
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [cancelSub, setCancelSub] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const plans = data.data?.plans || [];
  const mine = data.data?.mine || [];
  const active = mine.filter((s) => s.status === 'ACTIVE' && new Date(s.endDate) > new Date());
  const past = mine.filter((s) => !active.includes(s));
  const activePlanIds = new Set(active.map((s) => s.planId || getId(s.plan)));

  const subscribe = async () => {
    setBusy(true);
    setActionError('');
    try {
      await subscriptionApi.subscribe(getId(confirmPlan));
      toast.success(`Subscribed to ${confirmPlan.name}`);
      setConfirmPlan(null);
      await data.reload();
    } catch (err) {
      setActionError(err.message || 'Could not activate subscription');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setActionError('');
    try {
      await subscriptionApi.cancel(getId(cancelSub));
      toast.success('Subscription cancelled');
      setCancelSub(null);
      await data.reload();
    } catch (err) {
      setActionError(err.message || 'Could not cancel subscription');
    } finally {
      setBusy(false);
    }
  };

  if (data.loading) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('subscriptionsTitle')} />
        <LoadingGrid count={3} label="Loading subscriptions…" />
      </div>
    );
  }
  if (data.error) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('subscriptionsTitle')} />
        <ErrorState error={data.error} onRetry={data.reload} title="Could not load subscriptions" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('subscriptionsTitle')} description="Maintenance plans with a set number of included service visits." />

      <section aria-labelledby="active-sub-heading" className="space-y-3">
        <h2 id="active-sub-heading" className="text-base font-bold text-slate-900">
          {t('activeSubscription')}
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">You don't have an active subscription.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((s) => {
              const limit = s.plan?.serviceLimit ?? 0;
              const remaining = s.servicesRemaining ?? 0;
              const used = Math.max(0, limit - remaining);
              const pct = limit ? Math.round((used / limit) * 100) : 0;
              return (
                <li key={getId(s)}>
                  <Card className="p-5 border-primary-300 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-slate-900">{s.plan?.name}</p>
                        <p className="text-xs text-slate-500">{s.plan?.category}</p>
                      </div>
                      <Badge tone="green">Active</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Usage</span>
                        <span>
                          {used} of {limit} visits used · {remaining} left
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full bg-slate-100 overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={limit}
                        aria-valuenow={used}
                        aria-label="Service visits used"
                      >
                        <div className="h-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-400">Started</dt>
                        <dd className="font-medium text-slate-700">{formatDate(s.startDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Expires</dt>
                        <dd className="font-medium text-slate-700">
                          {formatDate(s.endDate)} ({daysLeft(s.endDate)} days left)
                        </dd>
                      </div>
                    </dl>
                    <div className="flex justify-end">
                      <Button size="sm" variant="danger-outline" onClick={() => setCancelSub(s)}>
                        Cancel subscription
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="plans-heading" className="space-y-3">
        <h2 id="plans-heading" className="text-base font-bold text-slate-900">
          {t('availablePlans')}
        </h2>
        {plans.length === 0 ? (
          <EmptyState icon={Layers} title="No plans are available right now" />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isActive = activePlanIds.has(getId(p));
              return (
                <li key={getId(p)}>
                  <Card className="p-5 h-full flex flex-col">
                    <Badge tone="primary">{p.category || 'General'}</Badge>
                    <p className="mt-2 text-base font-bold text-slate-900">{p.name}</p>
                    {p.description && <p className="text-xs text-slate-500 mt-1">{p.description}</p>}
                    <p className="mt-3 text-2xl font-extrabold text-slate-900">
                      {formatCurrency(p.price)}
                      <span className="text-xs font-medium text-slate-500"> / {p.durationDays} days</span>
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-600 flex-1">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                        {p.serviceLimit} service visit{p.serviceLimit === 1 ? '' : 's'} included
                      </li>
                      {(p.features || []).map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-4"
                      block
                      variant={isActive ? 'secondary' : 'primary'}
                      disabled={isActive}
                      onClick={() => {
                        setActionError('');
                        setConfirmPlan(p);
                      }}
                    >
                      {isActive ? 'Current plan' : 'Activate plan'}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-sub-heading" className="space-y-2">
          <h2 id="past-sub-heading" className="text-sm font-bold text-slate-700">
            Past subscriptions
          </h2>
          <ul className="text-xs text-slate-600 divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200">
            {past.map((s) => (
              <li key={getId(s)} className="px-4 py-2.5 flex justify-between gap-2">
                <span>{s.plan?.name}</span>
                <span>
                  {s.status} · ended {formatDate(s.endDate)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(confirmPlan)}
        title={`Activate ${confirmPlan?.name || 'plan'}?`}
        confirmLabel="Activate"
        tone="primary"
        loading={busy}
        onConfirm={subscribe}
        onCancel={() => setConfirmPlan(null)}
      >
        <p className="text-sm text-slate-600">
          {formatCurrency(confirmPlan?.price)} for {confirmPlan?.durationDays} days with {confirmPlan?.serviceLimit} included visit(s).
          Payment is collected offline — no online payment is taken here.
        </p>
        {actionError && <Alert tone="error" className="mt-3">{actionError}</Alert>}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(cancelSub)}
        title="Cancel subscription?"
        message={`Your ${cancelSub?.plan?.name || ''} plan will stop immediately. Remaining visits will be forfeited.`}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep plan"
        loading={busy}
        onConfirm={cancel}
        onCancel={() => setCancelSub(null)}
      >
        {actionError && <Alert tone="error" className="mt-3">{actionError}</Alert>}
      </ConfirmDialog>
    </div>
  );
}
