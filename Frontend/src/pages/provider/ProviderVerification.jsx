import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, FileText, Clock } from 'lucide-react';
import api from '../../services/api';

export default function ProviderVerification() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [docType, setDocType] = useState('GOVT_ID');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await api.get('/providers/verification/status');
      setStatusData(res.data);
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/providers/documents', {
        docType,
        documentNumber,
        fileUrl: fileUrl || '/uploads/sample-verification-doc.jpg',
      });
      setSuccess('Document uploaded successfully! Admin will review within 24 hours.');
      setDocumentNumber('');
      setFileUrl('');
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Checking verification status...</div>;
  }

  const status = statusData?.verificationStatus || 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Skill & ID Verification Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Government identity documents and trade licenses required for public booking approval
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

      {/* Verification Status Card */}
      <div
        className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          status === 'APPROVED'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : status === 'REJECTED'
            ? 'bg-red-50/60 border-red-200 text-red-950'
            : 'bg-amber-50/60 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              status === 'APPROVED'
                ? 'bg-emerald-200/80 text-emerald-800'
                : status === 'REJECTED'
                ? 'bg-red-200/80 text-red-800'
                : 'bg-amber-200/80 text-amber-800'
            }`}
          >
            {status === 'APPROVED' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : status === 'REJECTED' ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base">
              Verification Status: {status}
            </h3>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {status === 'APPROVED'
                ? 'Your credentials have been validated by the administration. You are certified to accept public bookings and quotations.'
                : status === 'REJECTED'
                ? `Verification was rejected. Reason: ${statusData?.rejectionReason || 'Documents unclear'}. Please upload updated copies below.`
                : 'Your submitted credentials are under review by the SevaSetu operations team. Standard turnaround is 12-24 hours.'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Document Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Upload className="w-4 h-4 text-primary-600 mr-2" /> Upload Supporting Verification Document
        </h3>

        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            >
              <option value="GOVT_ID">Government Photo ID (Aadhaar / Voter ID / PAN)</option>
              <option value="TRADE_LICENSE">Trade License / Electrical Wireman Certificate</option>
              <option value="SKILL_CERTIFICATE">Technical Apprenticeship / ITI Certificate</option>
              <option value="POLICE_VERIFICATION">Police Character Clearance Certificate</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Number / Registration ID *</label>
            <input
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. AADHAAR-XXXX-XXXX-1234 or LIC-EL-MUM-892"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document File Reference URL (or sample scan)</label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="/uploads/my-aadhaar-scan.jpg (or leave blank for test document)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
          >
            {submitting ? 'Submitting for Review...' : 'Submit Document for Verification'}
          </button>
        </form>
      </div>

      {/* Submitted Documents Ledger */}
      {statusData?.documents?.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h4 className="font-bold text-slate-900">Submitted Documents History</h4>
          <div className="divide-y divide-slate-100">
            {statusData.documents.map((doc) => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{doc.docType.replace('_', ' ')}</span>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    ID: {doc.documentNumber || 'N/A'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    doc.verificationStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : doc.verificationStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {doc.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
