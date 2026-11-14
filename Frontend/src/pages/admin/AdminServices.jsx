import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Clock,
  Shield,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    priceType: 'FIXED',
    estimatedDurationMinutes: 60,
    warrantyDays: 30,
    imageUrl: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        api.get('/services'),
        api.get('/categories'),
      ]);
      setServices(srvRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      name: '',
      slug: '',
      description: '',
      basePrice: '499',
      priceType: 'FIXED',
      estimatedDurationMinutes: 60,
      warrantyDays: 30,
      imageUrl: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setFormData({
      categoryId: srv.categoryId || '',
      name: srv.name || '',
      slug: srv.slug || '',
      description: srv.description || '',
      basePrice: srv.basePrice || 0,
      priceType: srv.priceType || 'FIXED',
      estimatedDurationMinutes: srv.estimatedDurationMinutes || 60,
      warrantyDays: srv.warrantyDays || 30,
      imageUrl: srv.imageUrl || '',
      isActive: srv.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      if (editingService) {
        await api.patch(`/services/${editingService.id}`, formData);
        setFeedback({ type: 'success', message: `Service "${formData.name}" updated successfully.` });
      } else {
        await api.post('/services', formData);
        setFeedback({ type: 'success', message: `Service "${formData.name}" created successfully.` });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (srv) => {
    try {
      await api.patch(`/services/${srv.id}`, { isActive: !srv.isActive });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle status' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete service "${name}"?`)) return;

    try {
      await api.delete(`/services/${id}`);
      setFeedback({ type: 'success', message: `Service "${name}" deleted.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete service' });
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(search.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !selectedCategory || srv.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Services Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage standardized customer service offerings, pricing structures, and warranty periods
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Service</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service title or keywords..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading services catalog...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No matching services found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Base Pricing</th>
                  <th className="py-3.5 px-4">Est. Duration</th>
                  <th className="py-3.5 px-4">Warranty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{srv.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{srv.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {srv.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{srv.basePrice}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({srv.priceType})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {srv.estimatedDurationMinutes} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {srv.warrantyDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          srv.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {srv.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(srv)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                          title={srv.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {srv.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id, srv.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingService ? `Edit Service: ${editingService.name}` : 'Add New Service Offering'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editingService ? prev.slug : name.toLowerCase().replace(/\s+/g, '-'),
                    }));
                  }}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug *
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
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: e.target.value }))}
                    required
                    min={0}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Type
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceType: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="HOURLY">HOURLY</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDurationMinutes: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warranty (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.warrantyDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, warrantyDays: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
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
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
