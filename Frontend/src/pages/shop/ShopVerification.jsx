import React, { useState, useEffect } from 'react';
import { ShieldCheck, Store, CheckCircle2, AlertCircle, FileText, Clock, Building2, UploadCloud } from 'lucide-react';
import api from '../../services/api';

export default function ShopVerification() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form for shop document verification details
  const [bannerUrl, setBannerUrl] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/shops/owner/profile');
      const data = res.data;
      setShop(data);
      setBannerUrl(data.bannerUrl || '');
      setAddress(data.address || '');
      setPincode(data.pincode || '');
      setCity(data.city || '');
    } catch (err) {
      console.error('Failed to load shop verification:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateStorefront = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/shops/owner/profile', {
        bannerUrl,
        address,
        pincode,
        city,
      });
      setSuccess('Storefront documents & physical location updated successfully! Under admin review.');
      fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to update store verification details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading shop verification details...</div>;
  }

  const status = shop?.verificationStatus || 'PENDING';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Local Shop Verification & Compliance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verified merchant status grants high visibility in the local discovery marketplace and trust badges
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
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : status === 'REJECTED'
            ? 'bg-red-50/70 border-red-200 text-red-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
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
              <ShieldCheck className="w-6 h-6" />
            ) : status === 'REJECTED' ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Merchant Status</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1">
              {status === 'APPROVED'
                ? 'Your Shop is Fully Verified & Live'
                : status === 'REJECTED'
                ? 'Verification Request Rejected'
                : 'Merchant Verification in Progress'}
            </h2>
            <p className="text-xs opacity-80 mt-1 max-w-xl">
              {status === 'APPROVED'
                ? 'Your hardware / electrical shop appears in customer search results, near-me listings, and accepts parts inquiries.'
                : status === 'REJECTED'
                ? 'Please review your physical address and storefront image credentials below and submit an update.'
                : 'SevaSetu compliance officers typically review shop listings within 24 to 48 business hours.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-slate-500 block">Catalog Status</span>
          <span className="text-sm font-bold text-slate-800">{shop?.catalogItems?.length || 0} Listed Items</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verification Checklist */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Building2 className="w-4 h-4 text-emerald-600 mr-2" />
            Verification Checklist
          </h3>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start space-x-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Valid business name & local owner identity</span>
            </li>
            <li className="flex items-start space-x-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Physical storefront address with verifiable pincode</span>
            </li>
            <li className="flex items-start space-x-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Direct customer contact phone number</span>
            </li>
            <li className="flex items-start space-x-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Shopfront exterior / interior banner photo</span>
            </li>
          </ul>

          <div className="p-3.5 bg-slate-50 rounded-2xl text-[11px] text-slate-500 leading-relaxed border border-slate-200/60">
            <strong>Need assistance?</strong> Contact our merchant support desk at <span className="font-semibold text-slate-700">partners@sevasetu.com</span>.
          </div>
        </div>

        {/* Update Proof Details */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <UploadCloud className="w-4 h-4 text-primary-600 mr-2" />
            Storefront & Physical Verification Update
          </h3>

          <form onSubmit={handleUpdateStorefront} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storefront Banner / Shop Photo URL
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or uploaded photo link"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                A clear storefront picture showing your signboard helps nearby customers recognize your shop.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Shop Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                  pattern="[0-9]{6}"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Updating Compliance Records...' : 'Save & Submit Verification Records'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
