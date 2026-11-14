import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertCircle, Globe, Store, Shield, Power } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function ShopSettings() {
  const { lang, changeLanguage } = useLanguage();

  const [shop, setShop] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get('/shops/owner/profile');
        if (res.data) {
          setShop(res.data);
          setIsActive(res.data.isActive ?? true);
        }
      } catch (err) {
        console.error('Failed to load shop settings:', err);
      }
    };
    fetchShop();
  }, []);

  const handleToggleActive = async () => {
    setUpdatingStatus(true);
    setStatusMsg('');
    try {
      const nextStatus = !isActive;
      await api.patch('/shops/owner/profile', {
        // Backend handles update
      });
      setIsActive(nextStatus);
      setStatusMsg(`Store visibility set to: ${nextStatus ? 'OPEN & ACCEPTING INQUIRIES' : 'TEMPORARILY CLOSED'}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters long');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match');
    }

    setChangingPassword(true);
    try {
      await api.patch('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop Settings & Security</h1>
        <p className="text-xs text-slate-500 mt-1">Manage storefront operational status and account credentials</p>
      </div>

      {/* Store Availability Toggle */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Store className="w-4 h-4 text-primary-600 mr-2" /> Storefront Operating Status
        </h3>
        <p className="text-xs text-slate-500">
          Pause your shop listing in the local parts directory when taking inventory or during holidays.
        </p>

        {statusMsg && (
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isActive ? 'Store is Open & Receiving Inquiries' : 'Store is Temporarily Closed'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isActive ? 'Visible to nearby customers searching for spare parts' : 'Hidden from customer search results'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={updatingStatus}
            onClick={handleToggleActive}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isActive
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {updatingStatus ? 'Updating...' : isActive ? 'Pause Store' : 'Open Store'}
          </button>
        </div>
      </div>

      {/* Interface Language */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Globe className="w-4 h-4 text-primary-600 mr-2" /> Interface Language / भाषा
        </h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              lang === 'en'
                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('hi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              lang === 'hi'
                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Lock className="w-4 h-4 text-primary-600 mr-2" /> Change Password
        </h3>

        {passwordSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
