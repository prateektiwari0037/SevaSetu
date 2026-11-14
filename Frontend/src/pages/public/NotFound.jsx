import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404 - Page Not Found</h1>
        <p className="text-slate-600 mb-6">
          The hyperlocal service route you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition shadow-md shadow-primary-500/20"
          >
            <Home className="w-4 h-4 mr-2" /> Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
