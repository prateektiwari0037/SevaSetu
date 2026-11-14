import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, TrendingUp, CalendarCheck } from 'lucide-react';
import api from '../../services/api';

export default function ProviderEarnings() {
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    totalPlatformCommissions: 0,
    completedJobsCount: 0,
    recentCommissions: [],
    completedBookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/providers/earnings/my');
        setEarningsData(res.data);
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings & Revenue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed breakdown of your completed service revenue, platform fee deductions, and net payouts
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Net Earnings (Take-Home)
          </span>
          <p className="text-3xl font-extrabold text-emerald-600">
            ₹{earningsData.totalEarnings || 0}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready for weekly bank settlement
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Platform Fees (10%)
          </span>
          <p className="text-3xl font-extrabold text-slate-900">
            ₹{earningsData.totalPlatformCommissions || 0}
          </p>
          <span className="text-[11px] text-slate-500 pt-1 block">
            Covers customer support & warranty guarantees
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Completed Service Jobs
          </span>
          <p className="text-3xl font-extrabold text-primary-600">
            {earningsData.completedJobsCount || 0}
          </p>
          <span className="text-[11px] text-slate-500 pt-1 block">
            Successfully delivered and verified
          </span>
        </div>
      </div>

      {/* Completed Bookings Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recent Completed Jobs Ledger</h3>

        {earningsData.completedBookings?.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No completed earnings recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Completed Date</th>
                  <th className="py-3 px-4">Gross Total</th>
                  <th className="py-3 px-4">Commission (10%)</th>
                  <th className="py-3 px-4 font-extrabold text-emerald-700">Net Earning (90%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earningsData.completedBookings.map((b) => {
                  const gross = b.totalAmount || 0;
                  const comm = Math.round(gross * 0.1 * 100) / 100;
                  const net = Math.round((gross - comm) * 100) / 100;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{b.bookingNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {b.customer?.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.service?.name}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{gross}</td>
                      <td className="py-3 px-4 text-slate-500">₹{comm}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">₹{net}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
