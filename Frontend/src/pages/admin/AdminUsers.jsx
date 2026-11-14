import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Ban,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `Reactivate account for ${user.email}?`
      : `Are you sure you want to suspend account for ${user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(user.id);
    setFeedback(null);

    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: nextStatus });
      setFeedback({
        type: 'success',
        message: `Account for ${user.email} marked as ${nextStatus ? 'ACTIVE' : 'SUSPENDED'}.`,
      });
      fetchUsers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update user status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getDisplayName = (user) => {
    if (user.customerProfile?.fullName) return user.customerProfile.fullName;
    if (user.providerProfile?.fullName) return user.providerProfile.fullName;
    if (user.shopProfile?.shopName) return `${user.shopProfile.shopName} (${user.shopProfile.ownerName})`;
    return user.email.split('@')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered platform accounts, inspect profiles, and manage access privileges
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Registered: <span className="font-bold text-primary-600">{users.length}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="PROVIDER">Providers</option>
            <option value="SHOP_OWNER">Shop Owners</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>

          <button
            onClick={fetchUsers}
            title="Refresh Users"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user records...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No matching users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">User / Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{getDisplayName(u)}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'PROVIDER'
                            ? 'bg-emerald-100 text-emerald-700'
                            : u.role === 'SHOP_OWNER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center text-[11px] text-slate-600">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500 font-mono">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        <span>{u.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center text-emerald-700 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unverified</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors disabled:opacity-50 ${
                            u.isActive
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {updatingId === u.id
                            ? 'Processing...'
                            : u.isActive
                            ? 'Suspend'
                            : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
