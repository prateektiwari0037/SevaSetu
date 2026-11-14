import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  Store,
  Briefcase,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminVerifications() {
  const [activeTab, setActiveTab] = useState('providers'); // 'providers' | 'shops'
  const [data, setData] = useState({ providers: [], shops: [] });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, type: null, reason: '' });

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/verifications');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load pending verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApproveProvider = async (id) => {
    if (!window.confirm('Approve this service provider for public bookings?')) return;
    setProcessingId(id);
    setFeedback(null);
    try {
      await api.patch(`/admin/providers/${id}/verify`, { status: 'APPROVED' });
      setFeedback({ type: 'success', message: 'Provider approved successfully! Notification sent.' });
      fetchVerifications();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve provider' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveShop = async (id) => {
    if (!window.confirm('Approve this local shop for the marketplace directory?')) return;
    setProcessingId(id);
    setFeedback(null);
    try {
      await api.patch(`/admin/shops/${id}/verify`, { status: 'APPROVED' });
      setFeedback({ type: 'success', message: 'Shop verified successfully! Notification sent.' });
      fetchVerifications();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve shop' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (id, type) => {
    setRejectModal({ open: true, id, type, reason: '' });
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason.trim()) return;

    setProcessingId(rejectModal.id);
    setFeedback(null);

    try {
      if (rejectModal.type === 'provider') {
        await api.patch(`/admin/providers/${rejectModal.id}/verify`, {
          status: 'REJECTED',
          rejectionReason: rejectModal.reason,
        });
        setFeedback({ type: 'success', message: 'Provider verification rejected with reason.' });
      } else {
        await api.patch(`/admin/shops/${rejectModal.id}/verify`, {
          status: 'REJECTED',
        });
        setFeedback({ type: 'success', message: 'Shop verification rejected.' });
      }
      setRejectModal({ open: false, id: null, type: null, reason: '' });
      fetchVerifications();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject verification' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification & Compliance Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review credentials, identity proofs, and physical storefronts before approving public listings
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'providers'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Pending Service Providers ({data.providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shops')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'shops'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Pending Local Shops ({data.shops.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading verification requests...</div>
      ) : activeTab === 'providers' ? (
        data.providers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
            No pending provider verification requests at this time.
          </div>
        ) : (
          <div className="space-y-4">
            {data.providers.map((p) => (
              <div
                key={p.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-base">{p.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      PENDING REVIEW
                    </span>
                  </div>

                  <p className="text-xs text-primary-600 font-semibold">
                    Category: {p.primaryCategory || 'General Technician'} • {p.experienceYears} Years Experience
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {p.user?.email}
                    </span>
                    <span className="flex items-center font-mono">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {p.user?.phone || 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Pincode: {p.servicePincode || '400001'} (Radius {p.serviceRadiusKm} km)
                    </span>
                  </div>

                  {/* Documents List */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Submitted Documents ({p.documents?.length || 0}):
                    </span>
                    {p.documents && p.documents.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {p.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] flex items-center space-x-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary-600" />
                            <span className="font-semibold text-slate-800">{doc.docType}:</span>
                            <span className="font-mono text-slate-500">{doc.documentNumber || 'N/A'}</span>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-600 hover:text-primary-800 ml-1"
                              >
                                <ExternalLink className="w-3 h-3 inline" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-600 italic">No document files attached yet</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                  <button
                    disabled={processingId === p.id}
                    onClick={() => handleApproveProvider(p.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Approve Provider</span>
                  </button>

                  <button
                    disabled={processingId === p.id}
                    onClick={() => handleOpenRejectModal(p.id, 'provider')}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : data.shops.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
          No pending shop verification requests at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {data.shops.map((s) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-base">{s.shopName}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    PENDING REVIEW
                  </span>
                </div>

                <p className="text-xs text-primary-600 font-semibold">
                  Category: {s.shopCategory} • Proprietor: {s.ownerName}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {s.user?.email}
                  </span>
                  <span className="flex items-center font-mono">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {s.contactPhone}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {s.address}, {s.city} - {s.pincode}
                  </span>
                </div>

                {s.bannerUrl && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Storefront Photo:
                    </span>
                    <a
                      href={s.bannerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-800 font-semibold"
                    >
                      <span>View Uploaded Storefront Photo</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                <button
                  disabled={processingId === s.id}
                  onClick={() => handleApproveShop(s.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Verify Shop</span>
                </button>

                <button
                  disabled={processingId === s.id}
                  onClick={() => handleOpenRejectModal(s.id, 'shop')}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Verification Application
            </h3>
            <p className="text-xs text-slate-500">
              Please state why this application does not satisfy compliance standards. The user will be notified to resubmit.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                required
                rows={3}
                placeholder="e.g. Identity document photo is blurred, or trade license number mismatch..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, id: null, type: null, reason: '' })}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
