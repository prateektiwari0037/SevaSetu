import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function CustomerSettings() {
  const { lang, changeLanguage } = useLanguage();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Preferences, interface language, and password security</p>
      </div>

      {/* Language Preferences */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Globe className="w-4 h-4 text-primary-600 mr-2" /> Interface Language Preference
        </h3>
        <p className="text-xs text-slate-500">
          Choose the language you prefer for service descriptions, navigation, and notifications.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              lang === 'en'
                ? 'border-primary-600 bg-primary-50 text-primary-800'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            English (Default)
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('hi')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              lang === 'hi'
                ? 'border-primary-600 bg-primary-50 text-primary-800'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center">
          <Lock className="w-4 h-4 text-primary-600 mr-2" /> Change Password
        </h3>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {changingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
