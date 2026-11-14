import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function AddProviderService() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('36');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, servRes] = await Promise.all([
          api.get('/categories'),
          api.get('/services'),
        ]);
        setCategories(catRes.data || []);
        setAllServices(servRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = selectedCategoryId
    ? allServices.filter((s) => s.categoryId === selectedCategoryId)
    : allServices;

  const handleServiceChange = (id) => {
    setSelectedServiceId(id);
    const selected = allServices.find((s) => s.id === id);
    if (selected) {
      setCustomPrice(selected.basePrice);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return setError('Please select a service');

    setSubmitting(true);
    setError('');
    try {
      await api.post('/providers/services/my', {
        serviceId: selectedServiceId,
        customPrice: parseFloat(customPrice),
        experienceMonths: parseInt(experienceMonths),
      });
      navigate('/provider/services');
    } catch (err) {
      setError(err.message || 'Failed to add service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        to="/provider/services"
        className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-primary-600"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Services
      </Link>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Service to Offerings</h1>
          <p className="text-slate-500 mt-1">
            Choose from registered platform categories and configure your personal price rate.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Filter by Category</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedServiceId('');
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Service *</label>
            <select
              required
              value={selectedServiceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
            >
              <option value="">-- Choose a Service --</option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Base: ₹{s.basePrice})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Your Custom Price Rate (₹) *</label>
              <input
                type="number"
                required
                min="50"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience in this skill (months)</label>
              <input
                type="number"
                min="1"
                value={experienceMonths}
                onChange={(e) => setExperienceMonths(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {submitting ? 'Adding...' : 'Add to My Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
