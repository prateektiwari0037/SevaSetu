import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Wrench,
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsRes, requestsRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/service-requests'),
        ]);
        setBookings(bookingsRes.data || []);
        setRequests(requestsRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const activeBookings = bookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const statusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-700 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {user?.customerProfile?.fullName || 'Neighbor'}!
          </h1>
          <p className="text-xs sm:text-sm text-primary-100 max-w-xl">
            Book trusted local technicians, compare multiple quotations, and track active home repairs with 30-day warranty peace of mind.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/customer/book-service"
            className="px-5 py-2.5 bg-white text-primary-800 font-bold text-xs rounded-xl shadow-md hover:bg-primary-50 transition"
          >
            + Book Service
          </Link>
          <Link
            to="/customer/emergency"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Emergency SOS</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Bookings</span>
            <CalendarCheck className="w-5 h-5 text-primary-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{bookings.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Jobs</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-2xl font-extrabold text-blue-600">{activeBookings.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Completed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">{completedBookings.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Quotations</span>
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-purple-600">{requests.length}</span>
        </div>
      </div>

      {/* Active Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active & Upcoming Services</h2>
          <Link to="/customer/bookings" className="text-xs font-semibold text-primary-600 hover:underline">
            View All Bookings
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading your bookings...
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No active bookings right now.</p>
            <p className="text-xs text-slate-400">Need something fixed? Book a technician or request quotations.</p>
            <Link
              to="/customer/book-service"
              className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Book Service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-primary-300 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      #{b.bookingNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{b.service?.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{b.problemDescription}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Date & Slot</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(b.bookingDate).toLocaleDateString()} ({b.timeSlot})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase">Total Amount</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{b.totalAmount}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/customer/bookings/${b.id}`}
                    className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition block"
                  >
                    Track Progress & Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multiple Quotations Requests */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Quotation Requests</h2>
            <span className="text-xs text-slate-500">{requests.length} active requests</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
                      {req.service?.name}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {req.quotations?.length || 0} Quotes Received
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{req.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{req.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status: <strong>{req.status}</strong></span>
                  <Link
                    to={`/customer/quotations/${req.id}`}
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Compare Quotes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
