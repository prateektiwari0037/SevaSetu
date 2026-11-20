import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  ShieldCheck,
  Zap,
  Users,
  Check,
  Clock,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'subscribers'
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Home Maintenance',
    tier: 'SILVER',
    description: '',
    price: '999',
    durationDays: 30,
    serviceLimit: 2,
    features: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        api.get('/subscription-plans').catch(() => api.get('/plans')),
        api.get('/admin/subscriptions').catch(() => ({ data: [] })),
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
    } catch (err) {
      console.error('Failed to load subscriptions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'Home Maintenance',
      tier: 'SILVER',
      description: '',
      price: '999',
      durationDays: 30,
      serviceLimit: 2,
      features: '2 Free Annual AC/Electrical Inspections\nPriority Emergency SOS Dispatch\n15% Off Spare Parts Catalog',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const featureList = formData.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      await api.post('/subscription-plans', {
        ...formData,
        features: featureList,
      });
      setFeedback({ type: 'success', message: `Subscription plan "${formData.name}" created!` });
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create plan' });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveSubscription = async (id) => {
    setApprovingId(id);
    setFeedback(null);
    try {
      await api.post(`/admin/subscriptions/${id}/approve`, {
        approvalNotes: 'Manual cash payment verified by administrator',
      });
      setFeedback({ type: 'success', message: 'Subscription manual payment verified and activated!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve subscription' });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure recurring residential maintenance plans and audit manual offline subscriber activations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'plans' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plans Catalog ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'subscribers'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Subscribers & Manual Approvals ({subscriptions.length})</span>
        </button>
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

      {/* Tab Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading subscriptions data...</div>
      ) : activeTab === 'plans' ? (
        plans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
            No subscription plans created yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.id || p._id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    {p.tier || p.category}
                  </span>

                  <h3 className="font-bold text-slate-900 text-lg mt-3">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹{p.price}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {p.durationDays} days</span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    <span>{p.serviceLimit} Free Service Visits Included</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Plan Features:
                    </span>
                    {p.features && p.features.length > 0 ? (
                      p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No features specified</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-center text-slate-400 text-[11px]">
                  Plan Identifier: <span className="font-mono text-slate-600">{p.slug}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Subscribers Tab */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          {subscriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No subscriber records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Plan</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Remaining Visits</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subscriptions.map((s) => (
                    <tr key={s._id || s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {s.customerId?.userId?.fullName || s.customerId?.fullName || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.customerId?.userId?.mobile || s.customerId?.phone || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{s.plan?.name || s.planId?.name || 'Standard Plan'}</div>
                        <div className="text-[11px] text-slate-400">₹{s.totalPaid} paid via {s.paymentMethod || 'CASH'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-primary-600">{s.servicesRemaining ?? 1} visits left</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(s.endDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.status === 'PENDING_APPROVAL' ? (
                          <button
                            onClick={() => handleApproveSubscription(s._id || s.id)}
                            disabled={approvingId === (s._id || s.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            {approvingId === (s._id || s.id) ? 'Approving...' : 'Approve Payment'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Create New Subscription Plan</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    }));
                  }}
                  required
                  placeholder="e.g. Platinum Home Care"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    required
                    min={0}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, durationDays: e.target.value }))}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Visit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.serviceLimit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serviceLimit: e.target.value }))}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tier: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Features (One per line)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
