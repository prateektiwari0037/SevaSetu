import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit3, CheckCircle2, Home } from 'lucide-react';
import api from '../../services/api';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('Home');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400001');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setLabel('Home');
    setStreetAddress('');
    setCity('Mumbai');
    setState('Maharashtra');
    setPincode('400001');
    setIsDefault(addresses.length === 0);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setStreetAddress(addr.streetAddress);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete address');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/users/addresses/${editingId}`, {
          label,
          streetAddress,
          city,
          state,
          pincode,
          isDefault,
        });
      } else {
        await api.post('/users/addresses', {
          label,
          streetAddress,
          city,
          state,
          pincode,
          isDefault,
        });
      }
      setModalOpen(false);
      fetchAddresses();
    } catch (err) {
      alert(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Saved Addresses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Save home, office, and family locations for 1-click booking dispatch
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Address</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No saved addresses yet</h3>
          <p className="text-xs text-slate-400">Add your first address for faster service checkout.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-3xl border bg-white shadow-xs transition flex flex-col justify-between ${
                addr.isDefault ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{addr.streetAddress}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Label</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home, Office, Parents"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Flat No, Building, Street, Landmark"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span className="font-semibold text-slate-700">Set as default service address</span>
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
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
