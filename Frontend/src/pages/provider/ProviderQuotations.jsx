import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Clock, Star, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function ProviderQuotations() {
  const [openRequests, setOpenRequests] = useState([]);
  const [myQuotations, setMyQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('2 Hours');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [reqRes, myQuotesRes] = await Promise.all([
        api.get('/service-requests'),
        api.get('/provider/quotations'),
      ]);
      setOpenRequests(reqRes.data || []);
      setMyQuotations(myQuotesRes.data || []);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenQuoteModal = (req) => {
    setSelectedReq(req);
    setQuotedAmount(req.service?.basePrice || '');
    setEstimatedDuration('2 Hours');
    setNotes('');
    setQuoteModalOpen(true);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/quotations', {
        serviceRequestId: selectedReq.id,
        quotedAmount: parseFloat(quotedAmount),
        estimatedDuration,
        notes,
      });

      setQuoteModalOpen(false);
      setSuccess('Quotation submitted successfully! The customer has been notified.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Multiple Quotation Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review open customer requirements, submit transparent competitive bids, and win confirmed jobs
        </p>
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

      {/* Open Customer Requests available to bid on */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Open Customer Service Requests</h2>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading requests...</div>
        ) : openRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No open quotation requests currently available for your registered trade categories.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
                      {req.service?.name}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {req._count?.quotations || req.quotations?.length || 0} bids received
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{req.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-relaxed">
                    {req.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <p>
                      <strong>Preferred Date:</strong> {new Date(req.preferredDate).toLocaleDateString()} ({req.preferredTimeSlot})
                    </p>
                    <p>
                      <strong>Pincode:</strong> {req.pincode}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenQuoteModal(req)}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Price Quotation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submitted Quotations Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Submitted Quotations</h2>
        {myQuotations.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            You have not submitted any quotations yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myQuotations.map((quote) => (
              <div
                key={quote.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Req #{quote.serviceRequest?.requestNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {quote.serviceRequest?.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      quote.status === 'SELECTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : quote.status === 'NOT_SELECTED'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {quote.status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Quoted Price</span>
                    <span className="text-base font-extrabold text-slate-900">₹{quote.quotedAmount}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Duration</span>
                    <span className="font-bold text-slate-800">{quote.estimatedDuration}</span>
                  </div>
                </div>

                {quote.notes && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                    {quote.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Quotation Modal */}
      {quoteModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Submit Quotation for: "{selectedReq.title}"
            </h3>
            <p className="text-xs text-slate-500">
              Customer requirement at {selectedReq.pincode}. Enter your final transparent price.
            </p>

            <form onSubmit={handleSubmitQuote} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quoted Total Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated Completion Time *
                </label>
                <input
                  type="text"
                  required
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g. 2 Hours / 1 Day"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scope of Work & Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify parts included, warranty details, or work methodology..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
