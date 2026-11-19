import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  error: { icon: AlertCircle, cls: 'bg-red-50 border-red-200 text-red-800' },
  info: { icon: Info, cls: 'bg-slate-50 border-slate-200 text-slate-800' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, tone = 'info', duration = 4000) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useRef(null);
  api.current = {
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d ?? 6000),
    info: (m, d) => push(m, 'info', d),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info;
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-2 p-3 rounded-xl border shadow-lg text-sm ${tone.cls}`}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="p-0.5 rounded hover:bg-black/5"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const noop = () => {};
const fallback = { success: noop, error: noop, info: noop, dismiss: noop };

/** Toast API. Falls back to no-ops outside the provider so components stay testable. */
export const useToast = () => useContext(ToastContext) || fallback;
