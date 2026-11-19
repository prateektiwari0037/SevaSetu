import React from 'react';
import { Check, X } from 'lucide-react';
import { BOOKING_STATUS_META, BOOKING_TIMELINE_STEPS, formatDateTime } from '../../utils/customer';

/**
 * Progress stepper (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED) plus the
 * backend's status-history log when present.
 */
export default function BookingTimeline({ booking }) {
  const status = booking?.status;
  const history = [...(booking?.statusHistory || [])].sort(
    (a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
  );
  const terminal = status === 'CANCELLED' || status === 'REJECTED';
  const reachedIndex = terminal
    ? Math.max(
        0,
        ...history.map((h) => BOOKING_TIMELINE_STEPS.indexOf(h.status)).filter((i) => i >= 0)
      )
    : BOOKING_TIMELINE_STEPS.indexOf(status);

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-1" aria-label="Booking progress">
        {BOOKING_TIMELINE_STEPS.map((step, i) => {
          const done = i <= reachedIndex && !(terminal && i > reachedIndex);
          const current = !terminal && i === reachedIndex;
          return (
            <li key={step} className="flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
              <div className="flex items-center w-full">
                <div className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : done ? 'bg-primary-500' : 'bg-slate-200'}`} />
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    done ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <div
                  className={`flex-1 h-0.5 ${
                    i === BOOKING_TIMELINE_STEPS.length - 1 ? 'invisible' : i < reachedIndex ? 'bg-primary-500' : 'bg-slate-200'
                  }`}
                />
              </div>
              <span className={`mt-1.5 text-[11px] font-semibold ${done ? 'text-slate-800' : 'text-slate-400'}`}>
                {BOOKING_STATUS_META[step].label}
                <span className="sr-only">{done ? ' (done)' : ' (not reached)'}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {terminal && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <X className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Booking {BOOKING_STATUS_META[status].label.toLowerCase()}</p>
            {(booking?.cancellationReason || booking?.rejectionReason) && (
              <p className="text-[13px]">Reason: {booking.cancellationReason || booking.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4" aria-label="Status history">
          {history.map((h, i) => (
            <li key={h.id || h._id || i} className="pl-4 relative">
              <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-white" aria-hidden="true" />
              <p className="text-xs font-bold text-slate-800">{BOOKING_STATUS_META[h.status]?.label || h.status}</p>
              {h.comment && <p className="text-xs text-slate-600">{h.comment}</p>}
              <p className="text-[11px] text-slate-400">{formatDateTime(h.createdAt || h.timestamp)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
