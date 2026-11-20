import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  PieChart,
  Activity,
  Layers,
  LifeBuoy,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, repRes] = await Promise.all([
          api.get('/admin/dashboard').catch(() => ({ data: {} })),
          api.get('/admin/reports').catch(() => ({ data: {} })),
        ]);
        setStats(dashRes.data || {});
        setReports(repRes.data || {});
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading business analytics...</div>;
  }

  const completionRate =
    stats?.totalBookings > 0
      ? Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100)
      : 100;

  const cancellationRate =
    stats?.totalBookings > 0
      ? Math.round(((stats.cancelledBookings || 0) / stats.totalBookings) * 100)
      : 0;

  const categoryPopularity = reports?.categoryPopularity || [];
  const maxCategoryCount = Math.max(1, ...categoryPopularity.map((c) => c.bookingsCount || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Operational Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Marketplace velocity, category demand, financial performance, and provider quality metrics
        </p>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Completion Rate</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{completionRate}%</span>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats?.completedBookings || 0} completed of {stats?.totalBookings || 0} total</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Cancellation Rate</span>
          <span className="text-2xl font-bold text-red-500 mt-1 block">{cancellationRate}%</span>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats?.cancelledBookings || 0} cancellations recorded</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Provider Verification Ratio</span>
          <span className="text-2xl font-bold text-primary-600 mt-1 block">
            {stats?.totalProviders > 0
              ? Math.round(((stats.verifiedProviders || 0) / stats.totalProviders) * 100)
              : 100}%
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats?.verifiedProviders || 0} approved of {stats?.totalProviders || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Avg Order Value (AOV)</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ₹
            {stats?.completedBookings > 0
              ? Math.round((stats.totalRevenue || 0) / stats.completedBookings)
              : 350}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Per completed work order</p>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Volume Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <PieChart className="w-4 h-4 text-primary-600 mr-2" />
            Bookings Lifecycle Distribution
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Completed Jobs</span>
                <span className="text-emerald-600 font-mono">{stats?.completedBookings || 0}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Active In-Flight Bookings</span>
                <span className="text-blue-600 font-mono">{stats?.activeBookings || 0}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${stats?.totalBookings > 0 ? ((stats.activeBookings || 0) / stats.totalBookings) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Cancelled Orders</span>
                <span className="text-red-500 font-mono">{stats?.cancelledBookings || 0}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${cancellationRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Popularity Demand */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Layers className="w-4 h-4 text-primary-600 mr-2" />
            Service Category Popularity & Volume
          </h2>

          <div className="space-y-3 pt-2">
            {categoryPopularity.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No category booking data yet</div>
            ) : (
              categoryPopularity.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="text-primary-600 font-mono">
                      {cat.bookingsCount} bookings (₹{cat.volume || 0})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${Math.round(((cat.bookingsCount || 0) / maxCategoryCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Settlement Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <DollarSign className="w-4 h-4 text-emerald-600 mr-2" />
            Cash Collection & Revenue Split
          </h2>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-emerald-50 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Platform Commission</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                ₹{(stats?.platformCommission || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">10% retained service fee</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">Provider Disbursements</span>
              <span className="text-xl font-extrabold text-blue-700 mt-1 block">
                ₹{((stats?.totalRevenue || 0) - (stats?.platformCommission || 0)).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-blue-600 mt-0.5 block">90% net technician earnings</span>
            </div>
          </div>
        </div>

        {/* Operational Disputes & Grievances */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <LifeBuoy className="w-4 h-4 text-amber-600 mr-2" />
            Dispute & Compliance Health
          </h2>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-amber-50 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Open Complaints</span>
              <span className="text-xl font-extrabold text-amber-700 mt-1 block">
                {stats?.openComplaints || 0}
              </span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Pending dispute tickets</span>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">Pending KYC Approvals</span>
              <span className="text-xl font-extrabold text-purple-700 mt-1 block">
                {stats?.pendingVerifications || 0}
              </span>
              <span className="text-[10px] text-purple-600 mt-0.5 block">Awaiting credential audit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
