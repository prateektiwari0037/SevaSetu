import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Phone, Mail, ShieldCheck, LifeBuoy, ArrowRight } from 'lucide-react';

export default function CustomerSupport() {
  const faqs = [
    {
      q: 'How does the SevaSetu 30-Day Service Warranty work?',
      a: 'Any eligible completed job automatically receives 30 days of warranty coverage. If the repaired switch, leak, or appliance acts up again within 30 days, simply open your booking details and click "Request Warranty Revisit" for free inspection.',
    },
    {
      q: 'How does Multiple Quotations comparison work?',
      a: 'When you choose "Multiple Quotations", eligible verified technicians submit independent bids. You compare quotes transparently and select one winner with 1 click. Unselected quotes are automatically closed with no hassle.',
    },
    {
      q: 'Can I cancel my service request?',
      a: 'Yes, you can cancel any pending or accepted booking through your dashboard prior to the technician starting work on-site with zero penalty.',
    },
    {
      q: 'Are the technicians verified?',
      a: 'Yes. 100% of providers on SevaSetu must submit government photo ID (Aadhaar/PAN) and trade certification, which is verified by our administrative team before they can take bookings.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Support & FAQs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Common questions, emergency guidelines, and grievance escalation paths
        </p>
      </div>

      {/* Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Submit a Grievance Ticket</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Report service quality concerns, billing disagreements, or request administrator intervention.
          </p>
          <Link
            to="/customer/complaints"
            className="inline-flex items-center text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            <span>Open Complaint Desk</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Emergency Dispatch Helpline</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            For urgent midnight water pipe bursts or sparks, reach our dedicated dispatch response center.
          </p>
          <a
            href="tel:180073827388"
            className="inline-flex items-center text-xs font-bold text-red-600 hover:text-red-700"
          >
            <span>Call 1800-7382-7388</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
        <div className="divide-y divide-slate-100 space-y-4 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="pt-4 first:pt-0 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <HelpCircle className="w-3.5 h-3.5 text-primary-600 mr-2 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 pl-5 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
