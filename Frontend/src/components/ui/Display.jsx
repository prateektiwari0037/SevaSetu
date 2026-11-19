import React from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

const BADGE_TONES = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
};

export function Badge({ tone = 'slate', icon: Icon, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
        BADGE_TONES[tone] || BADGE_TONES.slate
      } ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions, backLink }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        {backLink}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Accessible tab list (roving buttons). `tabs`: [{ key, label, count }] */
export function Tabs({ tabs, active, onChange, label = 'Tabs', idPrefix = 'tab' }) {
  const onKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    document.getElementById(`${idPrefix}-${tabs[next].key}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {tabs.map((tab, i) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            id={`${idPrefix}-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              selected
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${
                  selected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, label = 'Pagination' }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let p = windowStart; p <= Math.min(totalPages, windowStart + 4); p += 1) pages.push(p);

  const btn =
    'min-w-[2.25rem] h-9 px-2 inline-flex items-center justify-center rounded-xl text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-1.5 pt-4">
      <button
        type="button"
        className={`${btn} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`${btn} ${
            p === page ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={`${btn} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

export function RatingStars({ value = 0, count, size = 'sm' }) {
  const v = Math.round(Number(value) * 10) / 10;
  const px = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${v || 0} out of 5`}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${px} ${i <= Math.round(v) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
        ))}
      </span>
      <span className="text-xs font-semibold text-slate-700" aria-hidden="true">
        {v ? v.toFixed(1) : 'New'}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-400" aria-hidden="true">
          ({count})
        </span>
      )}
    </span>
  );
}

/** 1–5 star picker implemented as a radio group for keyboard and screen-reader support. */
export function RatingInput({ value, onChange, name = 'rating', label = 'Rating', error }) {
  const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  return (
    <fieldset>
      <legend className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        <span className="text-red-600 ml-0.5" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-invalid={error ? true : undefined}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-0.5 rounded focus-within:ring-2 focus-within:ring-primary-500">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} star${n > 1 ? 's' : ''} – ${labels[n - 1]}`}
            />
            <Star
              aria-hidden="true"
              className={`w-7 h-7 transition ${n <= (value || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
            />
          </label>
        ))}
        {value ? <span className="ml-2 text-xs font-medium text-slate-600">{labels[value - 1]}</span> : null}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
    </fieldset>
  );
}
