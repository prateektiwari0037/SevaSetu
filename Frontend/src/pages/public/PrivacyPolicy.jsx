import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-700">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="text-xs text-slate-400">Effective Date: November 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
        <p>
          SevaSetu collects personal details necessary to provide reliable hyperlocal services, including name, email address, mobile phone number, physical service addresses, and GPS geolocation coordinates when permitted by your browser.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">2. Provider Verification Data</h2>
        <p>
          For service providers and merchants, we collect and securely verify government-issued identity cards (e.g., Aadhaar / PAN / Trade License), skill certificates, and business addresses. This data is reviewed strictly by authorized administrative staff.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">3. Payment & Security</h2>
        <p>
          SevaSetu never stores sensitive payment instrument data (such as full credit/debit card numbers or CVV). All online card and UPI transactions are processed through certified PCI-DSS compliant payment gateways with server-side signature verification.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">4. Contact & Inquiries</h2>
        <p>
          For privacy inquiries or account data deletion requests, contact privacy@sevasetu.com.
        </p>
      </section>
    </div>
  );
}
