import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact SevaSetu Support
        </h1>
        <p className="text-sm text-slate-600">
          Have queries about service bookings, merchant partnerships, or platform feedback? Reach out to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Platform Grievance & Helpdesk</h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start">
                <Phone className="w-4 h-4 text-primary-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Customer Helpline</span>
                  <span>Toll-Free: 1800-7382-7388 (Mon - Sat, 8:00 AM - 9:00 PM)</span>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="w-4 h-4 text-primary-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Email Support</span>
                  <span>help@sevasetu.com / grievances@sevasetu.com</span>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-primary-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Operations Center</span>
                  <span>SevaSetu Technologies Pvt Ltd, Nariman Point, Mumbai, Maharashtra 400021</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
            <h4 className="font-bold text-sm text-primary-400">Emergency Inquiries</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you have an ongoing emergency booking (electrical hazard, burst pipe), please use the in-app Emergency SOS flow for priority technician dispatch.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          {sent ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you for contacting us. Our operations team will respond to {email} within 2 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Service warranty question or provider inquiry"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your query in detail..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
