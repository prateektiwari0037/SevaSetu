import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    iconUrl: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      iconUrl: '',
      imageUrl: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      iconUrl: cat.iconUrl || '',
      imageUrl: cat.imageUrl || '',
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, formData);
        setFeedback({ type: 'success', message: `Category "${formData.name}" updated successfully.` });
      } else {
        await api.post('/categories', formData);
        setFeedback({ type: 'success', message: `Category "${formData.name}" created successfully.` });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle status' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? This may impact linked services.`)) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      setFeedback({ type: 'success', message: `Category "${name}" deleted.` });
      fetchCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete category' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Category Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure primary trade categories displayed across customer discovery portals
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Category</span>
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

      {/* Categories Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold">
                      <Grid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">/{cat.slug}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      cat.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>

                <div className="mt-3 flex items-center space-x-4 text-[11px] text-slate-400">
                  <span className="flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    {cat.services?.length || 0} Listed Services
                  </span>
                  <span>Order: {cat.displayOrder || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`text-xs font-semibold flex items-center space-x-1 ${
                    cat.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {cat.isActive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : name.toLowerCase().replace(/\s+/g, '-'),
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
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
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
