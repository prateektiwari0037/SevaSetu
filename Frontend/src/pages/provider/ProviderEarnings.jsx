import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, TrendingUp, CalendarCheck, Clock, Wallet } from 'lucide-react';
import api from '../../services/api';

export default function ProviderEarnings() {
  const [earnings, setEarnings] = useState({
    summary: {
      completedJobsCount: 0,
      totalServiceValue: 0,
      cashCollected: 0,
      pendingCollection: 0,
      platformCommission: 0,
      providerNetEarnings: 0,
      currency: 'INR',
    },
    breakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/providers/me/earnings');
        if (res.data) {
          if (res.data.summary) {
            setEarnings(res.data);
          } else {
            // Adapt flat format
            setEarnings({
              summary: {
                completedJobsCount: res.data.completedJobsCount || 0,
                totalServiceValue: res.data.totalEarnings || 0,
                cashCollected: res.data.totalEarnings || 0,
                pendingCollection: 0,
                platformCommission: res.data.totalPlatformCommissions || 0,
                providerNetEarnings: (res.data.totalEarnings || 0) - (res.data.totalPlatformCommissions || 0),
                currency: 'INR',
              },
              breakdown: res.data.completedBookings || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const s = earnings.summary || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-600" /> Provider Earnings & Settlements
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed breakdown of your completed service revenue, cash collected on service, and platform commission.
        </p>
      </div>

      {/* Metrics Row (PRD Section 9 required fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Service Value */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Service Value
          </span>
          <p className="text-2xl font-extrabold text-slate-900">
            ₹{s.totalServiceValue || 0}
          </p>
          <span className="text-[11px] text-slate-500 flex items-center pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {s.completedJobsCount || 0} completed bookings
          </span>
        </div>

        {/* Cash Collected */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Cash Collected
          </span>
          <p className="text-2xl font-extrabold text-emerald-600">
            ₹{s.cashCollected || 0}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified cash receipts
          </span>
        </div>

        {/* Platform Commission (10%) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Platform Commission (10%)
          </span>
          <p className="text-2xl font-extrabold text-slate-700">
            ₹{s.platformCommission || 0}
          </p>
          <span className="text-[11px] text-slate-400 pt-1 block">
            Platform support & warranty fee
          </span>
        </div>

        {/* Provider Net Earnings */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Provider Net Earnings
          </span>
          <p className="text-2xl font-extrabold text-emerald-700">
            ₹{s.providerNetEarnings || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold pt-1 block">
            Net take-home (90%)
          </span>
        </div>
      </div>

      {/* Completed Bookings Ledger (Booking-wise breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Booking-Wise Earnings Breakdown</h3>
          <span className="text-xs text-slate-400">Fixed INR Pricing Snapshot</span>
        </div>

        {earnings.breakdown?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No completed service bookings recorded yet. Once you complete assigned service jobs, your verified earnings breakdown will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Gross Value</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4 font-extrabold text-emerald-700">Net Take-Home</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.breakdown.map((b) => (
                  <tr key={b.bookingId || b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      #{b.bookingNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{b.serviceName || b.service?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{b.customerName || b.customer?.fullName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {b.paymentMethod || 'CASH_ON_SERVICE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{b.grossAmount || b.totalAmount || 0}</td>
                    <td className="py-3 px-4 text-slate-500">₹{b.platformCommission || Math.round((b.totalAmount || 0) * 0.1)}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600">₹{b.netEarnings || Math.round((b.totalAmount || 0) * 0.9)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
