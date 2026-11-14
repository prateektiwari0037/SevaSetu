import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Store,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Platform Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      subtitle: `Platform Comm: ₹${(stats?.platformCommission || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
      link: '/admin/payments',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      subtitle: `${stats?.completedBookings || 0} completed, ${stats?.activeBookings || 0} active`,
      icon: CalendarCheck,
      color: 'bg-primary-600 text-white',
      link: '/admin/bookings',
    },
    {
      title: 'Verified Providers',
      value: stats?.verifiedProviders || 0,
      subtitle: `${stats?.pendingVerifications || 0} pending verification`,
      icon: Briefcase,
      color: 'bg-blue-600 text-white',
      link: '/admin/providers',
    },
    {
      title: 'Active Customers',
      value: stats?.totalCustomers || 0,
      subtitle: `${stats?.totalShops || 0} local shops registered`,
      icon: Users,
      color: 'bg-purple-600 text-white',
      link: '/admin/users',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform operations, financial oversight, and verification queue
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {stats?.pendingVerifications > 0 && (
            <Link
              to="/admin/verifications"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{stats.pendingVerifications} Pending Approvals</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{kpi.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Action Shortcut Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-primary-500/20 text-primary-300 px-2.5 py-1 rounded-full border border-primary-500/30">
              Operations Quick Action
            </span>
            <h2 className="text-lg font-bold mt-2">Provider & Merchant Compliance Desk</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Inspect government identity proofs, trade licenses, and storefront photos to approve reliable local service providers.
            </p>
          </div>
          <Link
            to="/admin/verifications"
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center shrink-0"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Recent Bookings and Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <CalendarCheck className="w-4 h-4 text-primary-600 mr-2" />
              Recent Platform Bookings
            </h2>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        #{b.bookingNumber}
                      </span>
                      {b.bookingType === 'EMERGENCY' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          SOS
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mt-0.5">
                      {b.service?.name || 'General Service'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Customer: {b.customer?.fullName || 'Customer'} • Provider: {b.provider?.fullName || 'Pending'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block">
                      ₹{b.totalAmount}
                    </span>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        b.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'ACCEPTED'
                          ? 'bg-purple-100 text-purple-800'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No bookings found</p>
            )}
          </div>
        </div>

        {/* Platform Summary & Shortcuts */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Layers className="w-4 h-4 text-primary-600 mr-2" />
            Platform Operational Health
          </h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Active In-flight Jobs</span>
              <span className="font-bold text-blue-600">{stats?.activeBookings || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Successfully Completed</span>
              <span className="font-bold text-emerald-600">{stats?.completedBookings || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Cancelled Bookings</span>
              <span className="font-bold text-red-500">{stats?.cancelledBookings || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Pending Provider Verifications</span>
              <span className="font-bold text-amber-600">{stats?.pendingVerifications || 0}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-700">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/admin/categories"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-700 transition-colors"
              >
                Categories
              </Link>
              <Link
                to="/admin/services"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-700 transition-colors"
              >
                Services
              </Link>
              <Link
                to="/admin/complaints"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-700 transition-colors"
              >
                Complaints
              </Link>
              <Link
                to="/admin/settings"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-700 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
