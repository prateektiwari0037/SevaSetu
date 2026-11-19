import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, RefreshCw, Inbox } from 'lucide-react';
import Button from './Button';

const ALERT_TONES = {
  error: { icon: AlertCircle, cls: 'bg-red-50 border-red-200 text-red-800', role: 'alert' },
  success: { icon: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', role: 'status' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-800', role: 'status' },
  info: { icon: Info, cls: 'bg-sky-50 border-sky-200 text-sky-800', role: 'status' },
};

export function Alert({ tone = 'info', title, children, className = '', action }) {
  const t = ALERT_TONES[tone] || ALERT_TONES.info;
  const Icon = t.icon;
  return (
    <div role={t.role} className={`flex items-start gap-2.5 p-3 border rounded-xl text-sm ${t.cls} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-[13px]' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const message = typeof error === 'string' ? error : error?.message;
  return (
    <Alert
      tone="error"
      title={title}
      action={
        onRetry && (
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300 ${className}`}>
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 ? 'w-4/5' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Grid/list of skeleton cards with an accessible loading label. */
export function LoadingGrid({ count = 6, columns = 'sm:grid-cols-2 lg:grid-cols-3', label = 'Loading…', lines }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className={`grid grid-cols-1 ${columns} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} lines={lines} />
        ))}
      </div>
    </div>
  );
}

export function LoadingList({ count = 4, label = 'Loading…' }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4" aria-hidden="true">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
