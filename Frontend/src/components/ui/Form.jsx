import React, { useId } from 'react';

const controlClasses = (error) =>
  [
    'w-full px-3 py-2 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'disabled:bg-slate-50 disabled:text-slate-500',
    error ? 'border-red-400' : 'border-slate-200',
  ].join(' ');

/**
 * Label + control + hint/error wiring with proper aria attributes.
 * `children` is a render function receiving the control props.
 */
export function Field({ label, required, error, hint, id: idProp, className = '', children }) {
  const autoId = useId();
  const id = idProp || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
          {required && (
            <span className="text-red-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
        className: controlClasses(error),
      })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ label, required, error, hint, className, id, ...rest }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={id}>
      {(p) => <input {...p} {...rest} />}
    </Field>
  );
}

export function Select({ label, required, error, hint, className, id, children, ...rest }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={id}>
      {(p) => (
        <select {...p} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function TextArea({ label, required, error, hint, className, id, rows = 4, ...rest }) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={id}>
      {(p) => <textarea rows={rows} {...p} {...rest} />}
    </Field>
  );
}
