import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ArrowRight,
  Filter,
} from 'lucide-react';
import api from '../../services/api';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const url = activeTab === 'ALL' ? '/bookings' : `/bookings?status=${activeTab}`;
        const res = await api.get(url);
        setBookings(res.data || []);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [activeTab]);

  const tabs = [
    { key: 'ALL', label: 'All Bookings' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Service Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status, service history, payments, and warranty revisits
          </p>
        </div>
        <Link
          to="/customer/book-service"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          + Book New Service
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No bookings found in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any {activeTab.toLowerCase().replace('_', ' ')} bookings.
          </p>
          <Link
            to="/customer/book-service"
            className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Book a Service Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-primary-300 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      #{booking.bookingNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{booking.service?.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {booking.problemDescription}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Scheduled Date</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase">Total Amount</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{booking.totalAmount}</span>
                  </div>
                </div>

                {booking.provider && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500">Technician:</span>
                    <span className="font-bold text-slate-800">{booking.provider.fullName}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Paid: <strong className={booking.isPaid ? 'text-emerald-600' : 'text-amber-600'}>{booking.isPaid ? 'Yes (Paid)' : 'Pending'}</strong>
                </span>
                <Link
                  to={`/customer/bookings/${booking.id}`}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
