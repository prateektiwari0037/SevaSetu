import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          <p className="text-xs text-slate-500">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetToken ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-800">Password Reset Token Generated</p>
            <p className="text-[11px] text-slate-600">
              For testing and development convenience, your reset token is:
            </p>
            <code className="block p-2 bg-white rounded-lg text-xs font-mono border border-emerald-200 break-all select-all text-slate-800">
              {resetToken}
            </code>
            <Link
              to={`/reset-password/${resetToken}`}
              className="inline-block mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition"
            >
              Proceed to Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <span>{submitting ? 'Generating...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-semibold text-primary-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
