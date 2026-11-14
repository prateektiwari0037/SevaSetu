import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';

export default function CompareQuotations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/service-requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      console.error('Failed to load quotation request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleSelectQuotation = async (quotationId) => {
    if (!window.confirm('Are you sure you want to select this quotation and confirm the booking?')) {
      return;
    }

    setSelectingId(quotationId);
    setError('');
    try {
      const res = await api.patch(`/quotations/${quotationId}/select`);
      setSuccess('Quotation selected successfully! Booking confirmed.');

      // Wait 1.5s then navigate to confirmed booking
      setTimeout(() => {
        if (res.data?.booking?.id) {
          navigate(`/customer/bookings/${res.data.booking.id}`);
        } else {
          fetchRequest();
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to select quotation');
    } finally {
      setSelectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Request Not Found</h2>
        <Link to="/customer/dashboard" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isConfirmed = request.status === 'CONFIRMED';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500">
          Request #{request.requestNumber}
        </span>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Request Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
              {request.service?.name}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{request.title}</h1>
          </div>
          <span
            className={`px-3.5 py-1 text-xs font-bold uppercase rounded-full ${
              isConfirmed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}
          >
            {request.status}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          {request.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-500 pt-2">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Location</span>
            <span className="font-semibold text-slate-800">{request.address} ({request.pincode})</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Preferred Date</span>
            <span className="font-semibold text-slate-800">
              {new Date(request.preferredDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Time Slot</span>
            <span className="font-semibold text-slate-800">{request.preferredTimeSlot}</span>
          </div>
        </div>
      </div>

      {/* Competing Quotations Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Submitted Quotations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare transparent bids from independent local technicians. Select one to confirm.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            {request.quotations?.length || 0} Quotes Received
          </span>
        </div>

        {(!request.quotations || request.quotations.length === 0) ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Awaiting Technician Quotes</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Eligible nearby technicians have been notified of your request. New quotes will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {request.quotations.map((quote) => {
              const isSelected = quote.status === 'SELECTED';
              const isNotSelected = quote.status === 'NOT_SELECTED';
              return (
                <div
                  key={quote.id}
                  className={`bg-white rounded-3xl p-6 border transition space-y-4 flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                      : isNotSelected
                      ? 'border-slate-200 opacity-60'
                      : 'border-slate-200/80 shadow-xs hover:border-primary-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg border border-primary-200">
                          {quote.provider?.fullName?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            {quote.provider?.fullName}
                          </h4>
                          <p className="text-xs text-primary-600 font-medium">
                            {quote.provider?.businessName || quote.provider?.primaryCategory}
                          </p>
                          <div className="flex items-center text-amber-500 text-xs font-bold mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                            <span>{quote.provider?.ratingAverage || 5.0}</span>
                            <span className="text-slate-400 font-normal ml-1">
                              ({quote.provider?.experienceYears} yrs exp)
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                          Winner Selected
                        </span>
                      ) : isNotSelected ? (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-medium text-xs rounded-full">
                          Not Selected
                        </span>
                      ) : null}
                    </div>

                    {/* Price and Duration */}
                    <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Quoted Total
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                          ₹{quote.quotedAmount}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Est. Duration
                        </span>
                        <span className="text-xs font-bold text-slate-800 mt-1 block">
                          {quote.estimatedDuration}
                        </span>
                      </div>
                    </div>

                    {/* Technician Notes */}
                    {quote.notes && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <strong className="text-slate-800 block text-[11px] mb-1">
                          Technician Proposal & Scope:
                        </strong>
                        {quote.notes}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="pt-3 border-t border-slate-100">
                    {isSelected ? (
                      <div className="text-center py-2 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        Selected Winner • Booking Confirmed
                      </div>
                    ) : isConfirmed ? (
                      <div className="text-center py-2 text-slate-400 text-xs font-medium">
                        Another quotation was confirmed for this job.
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={selectingId === quote.id}
                        onClick={() => handleSelectQuotation(quote.id)}
                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                      >
                        <span>
                          {selectingId === quote.id
                            ? 'Confirming Selection...'
                            : `Select Quote & Confirm at ₹${quote.quotedAmount}`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
