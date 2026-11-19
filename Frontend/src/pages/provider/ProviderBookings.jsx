import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, Phone } from 'lucide-react';
import api from '../../services/api';

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'ALL' ? '/bookings' : `/bookings?status=${activeTab}`;
      const res = await api.get(url);
      setBookings(Array.isArray(res.data) ? res.data : (res.data?.bookings || []));
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleAccept = async (id) => {
    try {
      await api.patch(`/bookings/${id}/accept`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to accept booking');
    }
  };

  const handleStartWork = async (id) => {
    try {
      await api.patch(`/bookings/${id}/start`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to start work');
    }
  };

  const handleCompleteWork = async (id) => {
    if (!window.confirm('Mark this service job as completed? This will activate the 30-day warranty.')) return;
    try {
      await api.patch(`/bookings/${id}/complete`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to complete work');
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All Jobs' },
    { key: 'PENDING', label: 'Pending Requests' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
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
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Bookings & Jobs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review incoming service orders, update work progress, and conclude completed jobs
        </p>
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

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading jobs...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No bookings found in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      #{booking.bookingNumber} • {booking.bookingType}
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

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <p>
                    <strong>Customer:</strong> {booking.customer?.fullName}
                  </p>
                  <p>
                    <strong>Scheduled:</strong> {new Date(booking.bookingDate).toLocaleDateString()} (
                    {booking.timeSlot})
                  </p>
                  <p className="line-clamp-1">
                    <strong>Address:</strong> {booking.serviceAddress}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900">₹{booking.totalAmount}</span>

                <div className="flex space-x-2">
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => handleAccept(booking.id)}
                      className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Accept
                    </button>
                  )}

                  {booking.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartWork(booking.id)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Start Work
                    </button>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteWork(booking.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Complete Work
                    </button>
                  )}

                  <Link
                    to={`/provider/bookings/${booking.id}`}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
