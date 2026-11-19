import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 disabled:bg-primary-300',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:text-slate-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300',
  'danger-outline': 'bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:text-red-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function buttonClasses({ variant = 'primary', size = 'md', block = false, className = '' } = {}) {
  return [
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    block ? 'w-full' : '',
    className,
  ].join(' ');
}

export default function Button({
  variant,
  size,
  block,
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="w-4 h-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function LinkButton({ to, variant, size, block, icon: Icon, className, children, ...rest }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, block, className })} {...rest}>
      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
    </Link>
  );
}
