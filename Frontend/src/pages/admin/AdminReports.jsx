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
} from 'lucide-react';
import api from '../../services/api';

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
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
          <p className="text-[11px] text-slate-400 mt-0.5">Fulfilled service bookings</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Cancellation Rate</span>
          <span className="text-2xl font-bold text-red-500 mt-1 block">{cancellationRate}%</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer & provider dropped jobs</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Provider Verification Ratio</span>
          <span className="text-2xl font-bold text-primary-600 mt-1 block">
            {stats?.totalProviders > 0
              ? Math.round(((stats.verifiedProviders || 0) / stats.totalProviders) * 100)
              : 100}
            %
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved vs onboarding</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Avg Order Value (AOV)</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ₹
            {stats?.completedBookings > 0
              ? Math.round((stats.totalRevenue || 0) / stats.completedBookings)
              : 850}
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
            Bookings Distribution by State
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Completed Jobs</span>
                <span className="text-emerald-600">{stats?.completedBookings || 0}</span>
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
                <span className="text-blue-600">{stats?.activeBookings || 0}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${stats?.totalBookings > 0 ? ((stats.activeBookings || 0) / stats.totalBookings) * 100 : 20}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Cancelled Orders</span>
                <span className="text-red-500">{stats?.cancelledBookings || 0}</span>
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

        {/* Hyperlocal Network Density */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Activity className="w-4 h-4 text-primary-600 mr-2" />
            Hyperlocal Network Density
          </h2>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-semibold">Registered Consumers</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {stats?.totalCustomers || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Verified residential users</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-semibold">Certified Technicians</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {stats?.verifiedProviders || 0}
              </span>
              <span className="text-[10px] text-primary-600 font-semibold">Approved local experts</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-semibold">Local Hardware Stores</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {stats?.totalShops || 0}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Verified parts merchants</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-semibold">Pending Compliance Queue</span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">
                {stats?.pendingVerifications || 0}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">Under officer review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
