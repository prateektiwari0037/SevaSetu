import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Star,
  ShieldCheck,
  ArrowRight,
  User,
  Wrench,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0 });
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [profRes, bookRes, earnRes, reqRes] = await Promise.all([
        api.get('/providers/profile/me'),
        api.get('/bookings'),
        api.get('/providers/earnings/my'),
        api.get('/service-requests?status=OPEN'),
      ]);
      setProfile(profRes.data);
      setBookings(bookRes.data || []);
      setEarnings(earnRes.data || { totalEarnings: 0 });
      setOpenRequests(reqRes.data || []);
    } catch (err) {
      console.error('Failed to load provider dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to accept booking');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Please state the reason for rejecting this booking:', 'Unavailable at slot');
    if (!reason) return;
    try {
      await api.patch(`/bookings/${bookingId}/reject`, { reason });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to reject booking');
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const ongoingBookings = bookings.filter((b) => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const isVerified = profile?.verificationStatus === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Top Banner with Verification Badge */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-primary-400 bg-primary-950 px-2.5 py-0.5 rounded-full border border-primary-800">
              Provider Workstation
            </span>
            {isVerified ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Admin Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Verification Pending
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {profile?.fullName || user?.email}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {profile?.businessName || profile?.primaryCategory || 'Certified Professional'} • Pincode: {profile?.servicePincode || '400001'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/provider/services/add"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            + Add Service
          </Link>
          <Link
            to="/provider/quotations"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition"
          >
            Quotation Requests ({openRequests.length})
          </Link>
        </div>
      </div>

      {!isVerified && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Your profile is currently awaiting document verification from the SevaSetu admin desk.
            </span>
          </div>
          <Link
            to="/provider/verification"
            className="font-bold underline text-amber-900 shrink-0 ml-2"
          >
            Upload Documents
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Earnings</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">
            ₹{earnings.totalEarnings || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Customer Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {profile?.ratingAverage || 5.0}
            <span className="text-xs text-slate-400 font-normal ml-1">/ 5.0</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Requests</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600">
            {pendingBookings.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Completed Jobs</span>
            <CheckCircle2 className="w-5 h-5 text-primary-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {completedBookings.length}
          </span>
        </div>
      </div>

      {/* Pending Booking Requests with 1-Click Action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Incoming Booking Requests</h2>
          <Link to="/provider/bookings" className="text-xs font-semibold text-primary-600 hover:underline">
            View All Bookings
          </Link>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-1">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">No pending booking requests right now.</p>
            <p>You will receive priority notifications when customers schedule jobs in your area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      #{b.bookingNumber} • {b.bookingType}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{b.service?.name}</h4>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">₹{b.totalAmount}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {b.problemDescription}
                </p>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                  <p>
                    <strong>Scheduled:</strong> {new Date(b.bookingDate).toLocaleDateString()} ({b.timeSlot})
                  </p>
                  <p>
                    <strong>Address:</strong> {b.serviceAddress}
                  </p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => handleReject(b.id)}
                    className="flex-1 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(b.id)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition"
                  >
                    Accept Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ongoing / Accepted Jobs */}
      {ongoingBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Jobs in Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {b.status}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{b.service?.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: {b.customer?.fullName} • ₹{b.totalAmount}
                  </p>
                </div>
                <Link
                  to={`/provider/bookings/${b.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Manage Job
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
