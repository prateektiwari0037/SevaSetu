import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  User,
  Eye,
  Briefcase,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminQuotations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/service-requests');
        setRequests(res.data);
      } catch (err) {
        console.error('Failed to load quotation requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multiple Quotation Bidding Monitor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit customer quotation requests, multi-provider bids, and final selections (strictly non-negotiable)
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Requests: <span className="font-bold text-primary-600">{requests.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading bidding requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No quotation requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Request #</th>
                  <th className="py-3.5 px-4">Service Required</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Budget / Est.</th>
                  <th className="py-3.5 px-4">Bids Received</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Inspect Bids</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900">
                        #{r.requestNumber}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{r.title}</div>
                      <div className="text-[11px] text-slate-400">{r.service?.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{r.customer?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{r.pincode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {r.budgetEstimate ? `₹${r.budgetEstimate}` : 'Open Quote'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700">
                        {r.quotations?.length || 0} Quotes
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'CLOSED'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="px-2.5 py-1.5 rounded-lg text-primary-600 hover:bg-primary-50 font-semibold text-xs transition-colors inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Compare</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Request & Quotations Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Bids for Request #{selectedRequest.requestNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedRequest.title} • {selectedRequest.service?.name}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  selectedRequest.status === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {selectedRequest.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-slate-700">Problem Description:</span>
              <p className="text-slate-600 leading-relaxed">{selectedRequest.description}</p>
            </div>

            {/* Provider Bids Side-by-Side */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Submitted Provider Quotations ({selectedRequest.quotations?.length || 0})
              </h4>

              {selectedRequest.quotations && selectedRequest.quotations.length > 0 ? (
                <div className="space-y-2">
                  {selectedRequest.quotations.map((q) => (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        q.status === 'SELECTED'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : q.status === 'NOT_SELECTED'
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {q.provider?.fullName || 'Technician'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              q.status === 'SELECTED'
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{q.comments || 'No extra notes'}</p>
                        <p className="text-[10px] text-slate-400">
                          Est. Duration: {q.estimatedDurationHours} hrs
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-slate-900">₹{q.quotedAmount}</span>
                        <span className="text-[10px] text-slate-400 block">Non-negotiable</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No quotes received yet</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Bidding View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
