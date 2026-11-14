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
} from 'lucide-react';
import api from '../../services/api';

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Home Maintenance',
    description: '',
    price: '999',
    durationDays: 30,
    serviceLimit: 2,
    features: '',
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'Home Maintenance',
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
      await api.post('/plans', {
        ...formData,
        features: featureList,
      });
      setFeedback({ type: 'success', message: `Subscription plan "${formData.name}" created!` });
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create plan' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure recurring residential and commercial maintenance plans for long-term customer retention
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New Plan</span>
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

      {/* Plans Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading subscription plans...</div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
          No subscription plans created yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                  {p.category}
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
                      slug: name.toLowerCase().replace(/\s+/g, '-'),
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
