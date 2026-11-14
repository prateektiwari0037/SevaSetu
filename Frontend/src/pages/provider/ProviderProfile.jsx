import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProviderProfile() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [skills, setSkills] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [servicePincode, setServicePincode] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/providers/profile/me');
        if (res.data) {
          const p = res.data;
          setFullName(p.fullName || '');
          setBusinessName(p.businessName || '');
          setPhone(p.user?.phone || user?.phone || '');
          setBio(p.bio || '');
          setExperienceYears(p.experienceYears || 0);
          setSkills((p.skills || []).join(', '));
          setPrimaryCategory(p.primaryCategory || '');
          setServicePincode(p.servicePincode || '');
          setServiceRadiusKm(p.serviceRadiusKm || 15);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await api.patch('/providers/profile/me', {
        fullName,
        businessName,
        bio,
        experienceYears,
        skills: skills.split(',').map((s) => s.trim()),
        primaryCategory,
        servicePincode,
        serviceRadiusKm,
      });

      // Update phone on user record if changed
      await api.patch('/users/profile', { phone });

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
        <h1 className="text-2xl font-bold text-slate-900">Provider Business Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Update public business details, skills, and service area configuration
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business / Agency Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Category</label>
            <input
              type="text"
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
            <input
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Base Pincode</label>
            <input
              type="text"
              maxLength={6}
              value={servicePincode}
              onChange={(e) => setServicePincode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service Radius (Km)</label>
            <input
              type="number"
              min="1"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(parseFloat(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Specialized Skills (comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Professional Bio & Experience Summary</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
          >
            {saving ? 'Saving...' : 'Update Provider Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
