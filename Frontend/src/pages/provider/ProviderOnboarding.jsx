import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  Upload,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || user?.mobile || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
    bio: '',
    experienceYears: 2,
    skills: ['Home Wiring', 'Appliance Repair'],
    primaryCategory: '',
    categoryIds: [],
    city: 'Mumbai',
    area: 'Andheri West',
    servicePincode: '400053',
    serviceRadiusKm: 10,
    serviceAreas: [{ pincode: '400053', area: 'Andheri West', city: 'Mumbai' }],
    isAvailable: true,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    // Fetch categories and existing profile
    const init = async () => {
      try {
        const [catRes, profRes] = await Promise.all([
          api.get('/categories'),
          api.get('/providers/me'),
        ]);

        if (catRes.data) {
          setCategories(catRes.data);
          if (catRes.data.length > 0 && !formData.primaryCategory) {
            setFormData((prev) => ({
              ...prev,
              primaryCategory: catRes.data[0].name,
              categoryIds: [catRes.data[0]._id || catRes.data[0].id],
            }));
          }
        }

        if (profRes.data) {
          const p = profRes.data;
          setFormData((prev) => ({
            ...prev,
            fullName: p.fullName || prev.fullName,
            bio: p.bio || prev.bio,
            experienceYears: p.experienceYears ?? prev.experienceYears,
            skills: p.skills?.length ? p.skills : prev.skills,
            primaryCategory: p.primaryCategory || prev.primaryCategory,
            city: p.city || prev.city,
            area: p.area || prev.area,
            servicePincode: p.servicePincode || prev.servicePincode,
            serviceAreas: p.serviceAreas?.length ? p.serviceAreas : prev.serviceAreas,
          }));
        }
      } catch (err) {
        console.error('Failed to load onboarding info:', err);
      }
    };

    init();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddServiceArea = () => {
    if (newPincode.trim() && newArea.trim()) {
      setFormData((prev) => ({
        ...prev,
        serviceAreas: [
          ...prev.serviceAreas,
          { pincode: newPincode.trim(), area: newArea.trim(), city: prev.city },
        ],
      }));
      setNewPincode('');
      setNewArea('');
    }
  };

  const handleRemoveArea = (index) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/providers/me', formData);
      setSuccess('Profile onboarding completed successfully! Proceeding to KYC verification...');
      setTimeout(() => {
        navigate('/provider/verification');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save onboarding data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> SevaSetu Provider Marketplace
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Complete Provider Onboarding
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Set up your verified professional profile, select service coverage areas, and get ready to receive local customer bookings.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, title: 'Personal & Contact' },
          { num: 2, title: 'Skills & Experience' },
          { num: 3, title: 'Service Coverage & Availability' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`cursor-pointer p-4 rounded-xl border text-center transition ${
              step === s.num
                ? 'bg-primary-50 border-primary-500 text-primary-900 font-bold shadow-xs'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span
              className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 mb-1 ${
                step === s.num ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </span>
            <div className="text-xs font-medium">{s.title}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Step Forms */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" /> Personal & Contact Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Profile Photo URL</label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Professional Bio & Service Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Describe your background, craftsmanship, and why customers should book you..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 flex items-center gap-2"
              >
                Next: Skills & Experience <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-600" /> Skills & Service Category
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Approved Service Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="primaryCategory"
                  value={formData.primaryCategory}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const cat = categories.find((c) => c.name === selectedName);
                    setFormData((prev) => ({
                      ...prev,
                      primaryCategory: selectedName,
                      categoryIds: cat ? [cat._id || cat.id] : prev.categoryIds,
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Providers must choose from platform-approved categories.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Skills tag input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Technical Skills & Specializations
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="e.g. Inverter Installation, Geyser Repair"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 flex items-center gap-2"
              >
                Next: Coverage & Availability <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" /> Service Coverage Areas & Availability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Base City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Base Area / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="servicePincode"
                  value={formData.servicePincode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Coverage Areas List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Additional Service Coverage Areas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <input
                  type="text"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  placeholder="PIN Code (e.g. 400069)"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Area Name (e.g. Andheri East)"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddServiceArea}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Coverage Area
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.serviceAreas.map((sa, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{sa.area}</span>
                      <span className="text-slate-500 ml-2">PIN: {sa.pincode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability toggle */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Available for Immediate Service Orders</span>
                <span className="text-[11px] text-slate-500">
                  Toggle on to receive instant booking notifications in your coverage areas
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-xs transition"
              >
                {loading ? 'Saving to Database...' : 'Save & Proceed to Verification'} <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
