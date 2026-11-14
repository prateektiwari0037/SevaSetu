import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

export default function ProviderBookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleStatusUpdate = async (action) => {
    setActionError('');
    setActionSuccess('');
    try {
      if (action === 'accept') {
        await api.patch(`/bookings/${booking.id}/accept`);
        setActionSuccess('Booking accepted! Customer has been notified.');
      } else if (action === 'reject') {
        const reason = prompt('Reason for rejecting:', 'Schedule conflict');
        if (!reason) return;
        await api.patch(`/bookings/${booking.id}/reject`, { reason });
        setActionSuccess('Booking rejected.');
      } else if (action === 'start') {
        await api.patch(`/bookings/${booking.id}/start`);
        setActionSuccess('Work marked as IN PROGRESS.');
      } else if (action === 'complete') {
        if (!window.confirm('Mark this job as completed? The 30-day warranty will be generated.')) return;
        await api.patch(`/bookings/${booking.id}/complete`);
        setActionSuccess('Job completed! 30-day warranty activated.');
      }
      fetchBooking();
    } catch (err) {
      setActionError(err.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <Link to="/provider/bookings" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Return to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/provider/bookings"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Jobs List
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500">
          Booking #{booking.bookingNumber}
        </span>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
              {booking.service?.name}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Job Value: ₹{booking.totalAmount}
            </h1>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold uppercase rounded-full border border-amber-200">
            {booking.status}
          </span>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700">Quick Work Status Actions:</span>
          <div className="flex flex-wrap gap-2">
            {booking.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('reject')}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleStatusUpdate('accept')}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Accept Booking
                </button>
              </>
            )}

            {booking.status === 'ACCEPTED' && (
              <button
                onClick={() => handleStatusUpdate('start')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Mark Work Started (IN PROGRESS)
              </button>
            )}

            {booking.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusUpdate('complete')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Mark Job Completed & Close
              </button>
            )}

            {booking.status === 'COMPLETED' && (
              <span className="text-xs font-bold text-emerald-700 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Job Completed
              </span>
            )}
          </div>
        </div>

        {/* Customer & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Information</span>
            <p className="text-sm font-bold text-slate-900">{booking.customer?.fullName}</p>
            {booking.customer?.user?.phone && (
              <a
                href={`tel:${booking.customer.user.phone}`}
                className="inline-flex items-center text-primary-600 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5 mr-1" /> Call: {booking.customer.user.phone}
              </a>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Location & Slot</span>
            <p className="font-semibold text-slate-800 flex items-start">
              <MapPin className="w-3.5 h-3.5 text-primary-600 mr-1 mt-0.5 shrink-0" />
              <span>{booking.serviceAddress} (PIN: {booking.addressPincode})</span>
            </p>
            <p className="text-slate-600">
              {new Date(booking.bookingDate).toLocaleDateString()} • {booking.timeSlot}
            </p>
          </div>
        </div>

        {/* Problem Description */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-1.5">Problem Reported by Customer:</h4>
          <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
            {booking.problemDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
