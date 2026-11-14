import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  ShieldCheck,
  CalendarCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.verificationStatus = statusFilter;

      const res = await api.get('/admin/providers', { params });
      setProviders(res.data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered local technicians, ratings, skills, and credential statuses
          </p>
        </div>
        <Link
          to="/admin/verifications"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center self-start sm:self-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
          <span>Verification Desk</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by provider name, business name, or skill..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Verification Statuses</option>
          <option value="APPROVED">Approved / Verified</option>
          <option value="PENDING">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading service providers...</div>
      ) : providers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
          No matching providers found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.fullName}</h3>
                    <p className="text-[11px] font-semibold text-primary-600">
                      {p.businessName || p.primaryCategory || 'General Technician'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      p.verificationStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.verificationStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : p.verificationStatus === 'SUSPENDED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.verificationStatus}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-3 text-xs text-slate-600">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{p.ratingAverage ? p.ratingAverage.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-400 font-normal ml-0.5">({p.ratingCount})</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-700">{p.experienceYears}</span> yrs exp
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-700">{p._count?.bookings || 0}</span> jobs
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-slate-500 border-t border-slate-50 pt-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{p.user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-mono">{p.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Pincode: {p.servicePincode || '400001'} (Radius {p.serviceRadiusKm} km)</span>
                  </div>
                </div>

                {p.skills && p.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.skills.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-md text-[10px] text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                    {p.skills.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{p.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {p.documents?.length || 0} Docs Uploaded
                </span>
                <Link
                  to="/admin/verifications"
                  className="font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <span>Inspect Credentials</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
