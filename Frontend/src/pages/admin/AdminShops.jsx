import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.verificationStatus = statusFilter;

      const res = await api.get('/admin/shops', { params });
      setShops(res.data);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShops();
  };

  const handleVerifyShop = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/shops/${id}/verify`, { status });
      fetchShops();
    } catch (err) {
      console.error('Failed to update shop status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Local Shop & Merchant Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered hardware stores, catalog sizes, and merchant verification statuses
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Stores: <span className="font-bold text-primary-600">{shops.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop title or owner name..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Verification Statuses</option>
          <option value="APPROVED">Approved / Live</option>
          <option value="PENDING">Pending Review</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading local stores...</div>
      ) : shops.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
          No matching local shops found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.shopName}</h3>
                    <p className="text-[11px] font-semibold text-primary-600">{s.shopCategory}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      s.verificationStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.verificationStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.verificationStatus}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Proprietor: {s.ownerName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.contactPhone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {s.city} ({s.pincode})
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Items</span>
                    <span className="font-bold text-slate-800">{s._count?.catalogItems || 0}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Inquiries</span>
                    <span className="font-bold text-primary-600">{s._count?.inquiries || 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {s.isActive ? 'Open' : 'Closed'}
                </span>

                <div className="flex items-center space-x-1.5">
                  {s.verificationStatus !== 'APPROVED' && (
                    <button
                      disabled={updatingId === s.id}
                      onClick={() => handleVerifyShop(s.id, 'APPROVED')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                    >
                      Verify
                    </button>
                  )}
                  {s.verificationStatus !== 'REJECTED' && (
                    <button
                      disabled={updatingId === s.id}
                      onClick={() => handleVerifyShop(s.id, 'REJECTED')}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
