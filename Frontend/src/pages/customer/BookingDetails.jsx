import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CreditCard,
  ShieldCheck,
  Star,
  User,
  Phone,
  RefreshCw,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [processingPayment, setProcessingPayment] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [revisitModalOpen, setRevisitModalOpen] = useState(false);
  const [revisitReason, setRevisitReason] = useState('');
  const [revisitDate, setRevisitDate] = useState('');
  const [submittingRevisit, setSubmittingRevisit] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      console.error('Failed to load booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // Handle Payment
  const handleProcessPayment = async () => {
    setProcessingPayment(true);
    setActionError('');
    try {
      // 1. Create order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking.id,
        paymentMethod,
      });

      // 2. Verify payment directly
      await api.post('/payments/verify', {
        paymentId: orderRes.data.payment.id,
        paymentMethod,
      });

      setPaymentModalOpen(false);
      setActionSuccess('Payment verified successfully! Thank you.');
      fetchBooking();
    } catch (err) {
      setActionError(err.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setActionError('');
    try {
      await api.post('/reviews', {
        bookingId: booking.id,
        rating,
        comment: reviewComment,
      });
      setReviewModalOpen(false);
      setActionSuccess('Review submitted! Thank you for rating this service.');
      fetchBooking();
    } catch (err) {
      setActionError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Warranty Revisit
  const handleSubmitRevisit = async (e) => {
    e.preventDefault();
    setSubmittingRevisit(true);
    setActionError('');
    try {
      await api.post('/revisits', {
        bookingId: booking.id,
        reason: revisitReason,
        preferredDate: revisitDate || undefined,
      });
      setRevisitModalOpen(false);
      setActionSuccess('Warranty revisit request submitted. The technician will contact you.');
      fetchBooking();
    } catch (err) {
      setActionError(err.message || 'Failed to request warranty revisit');
    } finally {
      setSubmittingRevisit(false);
    }
  };

  // Handle Cancellation
  const handleCancelBooking = async (e) => {
    e.preventDefault();
    setSubmittingCancel(true);
    setActionError('');
    try {
      await api.patch(`/bookings/${booking.id}/cancel`, {
        reason: cancelReason,
      });
      setCancelModalOpen(false);
      setActionSuccess('Booking cancelled successfully.');
      fetchBooking();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking');
    } finally {
      setSubmittingCancel(false);
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
        <Link to="/customer/bookings" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Return to My Bookings
        </Link>
      </div>
    );
  }

  // Calculate timeline active step
  const steps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
  let currentStepIdx = steps.indexOf(booking.status);
  if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') {
    currentStepIdx = -1;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/bookings"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to All Bookings
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

      {/* Booking Status Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{booking.service?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Type: <strong>{booking.bookingType}</strong> • Created on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>
          <span className="px-3.5 py-1 text-xs font-bold uppercase rounded-full bg-primary-100 text-primary-800 border border-primary-200">
            {booking.status}
          </span>
        </div>

        {/* 4-Step Visual Progress Bar */}
        {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' ? (
          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
            {[
              { label: 'Requested', desc: 'Awaiting Pro' },
              { label: 'Accepted', desc: 'Assigned' },
              { label: 'In Progress', desc: 'Work Started' },
              { label: 'Completed', desc: 'Warranty Active' },
            ].map((step, idx) => {
              const isPastOrCurrent = currentStepIdx >= idx;
              return (
                <div key={idx} className="space-y-2">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      isPastOrCurrent ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                  <div>
                    <span
                      className={`block font-bold ${
                        isPastOrCurrent ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            <strong>Terminal Status: {booking.status}</strong>
            <p className="mt-1">
              Reason: {booking.cancellationReason || booking.rejectionReason || 'Terminated by authorized user'}
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Details & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Service & Schedule Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Problem & Location */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Job Description & Address</h3>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              {booking.problemDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Service Location</span>
                <p className="font-semibold text-slate-800 flex items-start">
                  <MapPin className="w-3.5 h-3.5 text-primary-600 mr-1.5 mt-0.5 shrink-0" />
                  <span>{booking.serviceAddress} (PIN: {booking.addressPincode})</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Scheduled Slot</span>
                <p className="font-semibold text-slate-800 flex items-center">
                  <Clock className="w-3.5 h-3.5 text-primary-600 mr-1.5 shrink-0" />
                  <span>
                    {new Date(booking.bookingDate).toLocaleDateString()} • {booking.timeSlot}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Provider Profile */}
          {booking.provider ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Assigned Technician</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg border border-primary-200">
                    {booking.provider.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{booking.provider.fullName}</h4>
                    <p className="text-xs text-primary-600 font-medium">
                      {booking.provider.businessName || booking.provider.primaryCategory}
                    </p>
                    <div className="flex items-center text-amber-500 text-xs font-bold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 mr-1" />
                      <span>{booking.provider.ratingAverage || 5.0}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <a
                    href={`tel:${booking.provider.user?.phone}`}
                    className="inline-flex items-center px-3.5 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs rounded-xl transition"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    <span>Call Pro</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center py-6">
              <p className="text-xs font-medium text-slate-600">Technician Matching in Progress</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Eligible certified technicians near {booking.addressPincode} are currently reviewing this request.
              </p>
            </div>
          )}

          {/* 30-Day Warranty Certificate Section */}
          {booking.warranty && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center text-xs font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                  30-Day Service Warranty Active
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  Valid Until {new Date(booking.warranty.endDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {booking.warranty.terms || 'Covers free technician revisit and repair if the issue reoccurs.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setRevisitModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Warranty Revisit</span>
                </button>
              </div>
            </div>
          )}

          {/* Customer Review Section */}
          {booking.review ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Your Service Review</h4>
                <div className="flex text-amber-400">
                  {[...Array(booking.review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{booking.review.comment}"
              </p>
            </div>
          ) : booking.status === 'COMPLETED' ? (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-amber-900">How was your service experience?</h4>
                <p className="text-xs text-amber-700 mt-0.5">Please rate the provider to maintain community trust.</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                Leave Rating
              </button>
            </div>
          ) : null}

          {/* Status History Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Activity Log & Updates</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {booking.statusHistory?.map((h) => (
                <div key={h.id} className="py-2.5 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                      {h.status}
                    </span>
                    <p className="text-slate-600 mt-1">{h.comment}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-4">
                    {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Price Breakdown & Payment */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Bill Breakdown</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Service Charge</span>
                <span>₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & Warranty Fee</span>
                <span className="text-emerald-600 font-semibold">FREE (Covered)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Final Bill</span>
                <span>₹{booking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs mb-3">
                <span className="text-slate-500">Payment Status:</span>
                <span
                  className={`font-bold ${
                    booking.isPaid ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {booking.isPaid ? 'Paid in Full' : 'Payment Due'}
                </span>
              </div>

              {!booking.isPaid && booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Settle & Pay ₹{booking.totalAmount}</span>
                </button>
              )}
            </div>

            {/* Cancel Booking option if eligible */}
            {['PENDING', 'ACCEPTED'].includes(booking.status) && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full py-2 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl transition"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Select Payment Method</h3>
            <p className="text-xs text-slate-500">Total payable amount: <strong>₹{booking.totalAmount}</strong></p>

            <div className="space-y-2">
              <label
                className={`flex items-center p-3 rounded-xl border cursor-pointer text-xs transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mr-2"
                />
                <span>Online Gateway (UPI, Netbanking, Cards)</span>
              </label>

              <label
                className={`flex items-center p-3 rounded-xl border cursor-pointer text-xs transition ${
                  paymentMethod === 'CASH'
                    ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="mr-2"
                />
                <span>Cash on Service Completion</span>
              </label>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingPayment}
                onClick={handleProcessPayment}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {processingPayment ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Rate Your Service</h3>
            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Star Rating (1 to 5)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Comment</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience with the technician..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Revisit Modal */}
      {revisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Warranty Revisit</h3>
            <p className="text-xs text-slate-500">
              Your service is protected under warranty. Describe the recurring issue below.
            </p>

            <form onSubmit={handleSubmitRevisit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Revisit *</label>
                <textarea
                  rows={3}
                  required
                  value={revisitReason}
                  onChange={(e) => setRevisitReason(e.target.value)}
                  placeholder="Explain why the repair needs checking again..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Revisit Date</label>
                <input
                  type="date"
                  value={revisitDate}
                  onChange={(e) => setRevisitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisitModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRevisit}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submittingRevisit ? 'Submitting...' : 'Request Revisit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cancel Booking</h3>
            <p className="text-xs text-slate-500">Are you sure you want to cancel this booking?</p>

            <form onSubmit={handleCancelBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Change of plans, resolved independently..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
