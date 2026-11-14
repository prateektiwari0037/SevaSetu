import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-700">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms & Conditions</h1>
      <p className="text-xs text-slate-400">Effective Date: November 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">1. Service Marketplace Platform</h2>
        <p>
          SevaSetu operates as an online marketplace facilitating discovery and bookings between independent local service providers, local shops, and consumers.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">2. Multiple Quotation Policy</h2>
        <p>
          Where customers request quotations, each provider independently submits their competitive bid. In accordance with platform design, no back-and-forth price negotiations or counter-offers are permitted on the platform. Customers may compare transparent bids and select one provider transactionally.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">3. 30-Day Service Warranty & Revisits</h2>
        <p>
          Eligible completed service jobs automatically receive warranty protection. If an issue reoccurs within the active warranty duration (typically 30 days from completion), customers may raise a warranty revisit request through their dashboard.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">4. Cancellations and Payments</h2>
        <p>
          Customers may cancel pending bookings without penalty prior to technician acceptance or arrival. Cash payments are settled directly upon satisfactory service delivery.
        </p>
      </section>
    </div>
  );
}
