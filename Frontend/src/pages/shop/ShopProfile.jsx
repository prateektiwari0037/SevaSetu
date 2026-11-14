import React, { useState, useEffect } from 'react';
import { Store, User, Phone, Mail, MapPin, Clock, Tag, Image, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import api from '../../services/api';

export default function ShopProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    shopCategory: 'Hardware & Electrical',
    description: '',
    bannerUrl: '',
    address: '',
    city: '',
    pincode: '',
    contactPhone: '',
    contactEmail: '',
    openingHours: '9:00 AM - 9:00 PM (Mon-Sat)',
  });

  const categories = [
    'Hardware & Electrical',
    'Sanitary & Plumbing Supplies',
    'Paint & Decor Studio',
    'Electronic & Appliance Spares',
    'Tools & Industrial Equipment',
    'Auto Parts & Battery Centre',
    'General Home Care & Hardware',
  ];

  const fetchProfile = async () => {
    try {
      const res = await api.get('/shops/owner/profile');
      const data = res.data;
      if (data) {
        setFormData({
          shopName: data.shopName || '',
          ownerName: data.ownerName || '',
          shopCategory: data.shopCategory || 'Hardware & Electrical',
          description: data.description || '',
          bannerUrl: data.bannerUrl || '',
          address: data.address || '',
          city: data.city || '',
          pincode: data.pincode || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          openingHours: data.openingHours || '9:00 AM - 9:00 PM (Mon-Sat)',
        });
      }
    } catch (err) {
      console.error('Failed to load shop profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await api.patch('/shops/owner/profile', formData);
      setSuccess('Shop business profile updated successfully!');
      fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to update shop profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading shop profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Shop Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your storefront branding, trading details, and public contact information
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Editor Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Shop Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    required
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner / Proprietor Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Category *
                </label>
                <select
                  name="shopCategory"
                  value={formData.shopCategory}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Hours
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    placeholder="e.g. 9:00 AM - 8:30 PM (Mon-Sat)"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storefront Banner Image URL
              </label>
              <div className="relative">
                <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business & Hardware Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe parts and products in stock, brands carried, and warranties..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2">
              Physical Location & Contact
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{6}"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Support Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Marketplace Preview Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Live Marketplace Preview
            </h3>
            <span className="text-[10px] text-slate-400">Customer view</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="h-36 bg-slate-100 relative overflow-hidden">
              {formData.bannerUrl ? (
                <img
                  src={formData.bannerUrl}
                  alt={formData.shopName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400">
                  <Store className="w-10 h-10 opacity-40" />
                </div>
              )}
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-primary-700 shadow-xs backdrop-blur-xs">
                  {formData.shopCategory}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {formData.shopName || 'Your Shop Name'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Proprietor: {formData.ownerName || 'Owner Name'}
                </p>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {formData.description || 'Description of hardware, spares, parts, and electrical tools...'}
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {formData.address ? `${formData.address}, ${formData.city} - ${formData.pincode}` : 'Physical location'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formData.openingHours || 'Opening hours'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formData.contactPhone || '+91 98765 00000'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
