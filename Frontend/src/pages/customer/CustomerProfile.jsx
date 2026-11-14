import React, { useState } from 'react';
import { User, Phone, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.customerProfile?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.customerProfile?.bio || '');
  const [emergencyContact, setEmergencyContact] = useState(
    user?.customerProfile?.emergencyContact || ''
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await api.patch('/users/profile', {
        fullName,
        phone,
        bio,
        emergencyContact,
      });

      // Refresh profile data
      const meRes = await api.get('/auth/me');
      updateUser(meRes.data.user);
      setSuccess(true);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personal Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your contact information and emergency phone numbers</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
          <input
            type="tel"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="+91 9820099887 (Next of kin / guardian)"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">About Me / Notes</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Special instructions for visiting service professionals..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
