import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth, getDashboardRoute } from '../../context/AuthContext';

export default function Forbidden() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">403 - Access Forbidden</h1>
        <p className="text-slate-600 mb-6">
          You do not have administrative or authorized permissions to view this portal.
          {user && (
            <span className="block mt-2 font-medium text-slate-800">
              Current Role: <span className="text-primary-600">{role}</span>
            </span>
          )}
        </p>

        <div className="space-y-3">
          {role ? (
            <Link
              to={getDashboardRoute(role)}
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition shadow-md shadow-primary-500/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to My Dashboard
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition shadow-md shadow-primary-500/20"
            >
              <Home className="w-4 h-4 mr-2" /> Back to Homepage
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
