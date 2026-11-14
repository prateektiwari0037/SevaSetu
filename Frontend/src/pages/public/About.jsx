import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, MapPin, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-16 py-12">
      {/* Header Banner */}
      <section className="max-w-5xl mx-auto px-4 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Our Vision & Mission
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Bridging Homes with Trusted Hyperlocal Experts
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          SevaSetu was founded to solve a fundamental urban challenge: finding trusted, accountable, and transparent local technicians without endless phone calls or surprise pricing.
        </p>
      </section>

      {/* Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">1. Verification & Trust</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every professional on SevaSetu is verified through government photo ID checks, experience verification, and criminal background screening. No unverified provider can accept bookings.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">2. Empowering Local Pros</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We empower independent electricians, plumbers, and mechanics with digital identity, digital invoicing, booking management, and direct customer relationships without predatory middleman fees.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">3. 30-Day Work Warranty</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our customers enjoy total peace of mind. If any repaired switch, joint, or appliance fails within the warranty period, an authorized revisit is scheduled at no extra charge.
            </p>
          </div>
        </div>
      </section>

      {/* The Story / Problem & Solution */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">How SevaSetu Solves the Local Problem</h2>
            <p className="text-slate-600 text-sm">Comparing traditional service discovery with SevaSetu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-4">
              <h4 className="text-base font-bold text-red-700 flex items-center">
                ❌ Traditional Unorganized Market
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 font-bold">•</span>
                  No background verification or skill certification
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 font-bold">•</span>
                  Unpredictable, inflated pricing negotiated on the spot
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 font-bold">•</span>
                  Zero post-repair guarantee or warranty coverage
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 font-bold">•</span>
                  Unavailability during emergencies and night blackouts
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <h4 className="text-base font-bold text-emerald-700 flex items-center">
                ✅ The SevaSetu Guarantee
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  Admin-verified ID, trade certificates, and customer ratings
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  Multiple transparent quotations with no hidden surprises
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  Automated 30-day warranty certificate on completed jobs
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  Dedicated priority Emergency SOS broadcast system
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Ready to experience hassle-free home maintenance?
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/services"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            Explore Services
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl transition"
          >
            Join as a Service Provider
          </Link>
        </div>
      </section>
    </div>
  );
}
