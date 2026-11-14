import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ShopCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [inStock, setInStock] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/shops/owner/catalog');
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setCategory('Hardware');
    setDescription('');
    setPrice('');
    setUnit('piece');
    setInStock(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setPrice(item.price);
    setUnit(item.unit || 'piece');
    setInStock(item.inStock);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product from your store catalog?')) return;
    try {
      await api.delete(`/shops/owner/catalog/${id}`);
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/shops/owner/catalog/${editingId}`, {
          name,
          category,
          description,
          price: parseFloat(price),
          unit,
          inStock,
        });
      } else {
        await api.post('/shops/owner/catalog', {
          name,
          category,
          description,
          price: parseFloat(price),
          unit,
          inStock,
        });
      }
      setModalOpen(false);
      fetchCatalog();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Catalog & Products</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your inventory, update pricing, and toggle in-stock availability
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading catalog...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Catalog is currently empty</h3>
          <p className="text-xs text-slate-400">Add products to showcase parts and tools to clients.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.inStock
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description || 'Quality product available at our local store.'}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900">₹{item.price}</span>
                  <span className="text-xs text-slate-400">per {item.unit}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Product' : 'Add Catalog Product'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Havells 2.5 sq mm Wire (90m)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Electrical, Plumbing, Hardware"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="piece, meter, box, kg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Specs</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span className="font-semibold text-slate-700">Item currently in stock</span>
              </label>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
