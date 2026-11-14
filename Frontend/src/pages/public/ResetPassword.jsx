import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function ResetPassword() {
  const { token: routeToken } = useParams();
  const [token, setToken] = useState(routeToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Reset Your Password</h2>
          <p className="text-xs text-slate-500">
            Enter your new secure password below.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-800">Password Reset Successful!</p>
            <p className="text-[11px] text-slate-600">
              Your password has been changed securely. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reset Security Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter reset token"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password (min 6 chars)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <span>{submitting ? 'Updating Password...' : 'Save New Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
