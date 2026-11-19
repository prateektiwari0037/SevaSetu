import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, ShieldCheck, Store, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Client-side checks mirroring the backend rules (min 8-char password, required contact fields). */
export const validateRegistration = ({ fullName, email, phone, password, confirmPassword }) => {
  if (!fullName.trim() || fullName.trim().length < 2) return 'Please enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address';
  if (!/^(\+91[-\s]?)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) return 'Please enter a valid 10-digit Indian mobile number';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password !== confirmPassword) return 'Password and confirm password do not match';
  return '';
};

export default function Register() {
  const [role, setRole] = useState('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Provider specific
  const [businessName, setBusinessName] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('Electrician');
  const [experienceYears, setExperienceYears] = useState('3');
  const [skills, setSkills] = useState('Wiring, MCB, Inverter');
  const [servicePincode, setServicePincode] = useState('400001');

  // Shop specific
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('Hardware & Electrical');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPincode, setShopPincode] = useState('400001');
  const [shopCity, setShopCity] = useState('Mumbai');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateRegistration({ fullName, email, phone, password, confirmPassword });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        ...(role === 'PROVIDER' && {
          businessName,
          primaryCategory,
          experienceYears,
          skills: skills.split(',').map((s) => s.trim()),
          servicePincode,
        }),
        ...(role === 'SHOP_OWNER' && {
          shopName,
          shopCategory,
          address: shopAddress,
          pincode: shopPincode,
          city: shopCity,
        }),
      };

      const newUser = await register(payload);
      navigate(getDashboardRoute(newUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Seva<span className="text-primary-600">Setu</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500">
            Choose your role to get started with SevaSetu
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
              role === 'CUSTOMER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('PROVIDER')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
              role === 'PROVIDER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
            <span>Technician</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('SHOP_OWNER')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
              role === 'SHOP_OWNER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Shop Owner</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-label="Registration form" className="space-y-4 text-xs">
          <div>
            <label htmlFor="reg-fullname" className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              id="reg-fullname"
              autoComplete="name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-email" className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                id="reg-email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
              <input
                id="reg-phone"
                autoComplete="tel"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9820011223"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-password" className="block font-semibold text-slate-700 mb-1">
                Create Password (min 8 chars) *
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="reg-confirm-password" className="block font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Dynamic Provider Fields */}
          {role === 'PROVIDER' && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Professional & Verification Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Trade Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sharma Electricals"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Category</label>
                  <select
                    value={primaryCategory}
                    onChange={(e) => setPrimaryCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Home Cleaning">Home Cleaning</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Painting">Painting</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Area Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={servicePincode}
                    onChange={(e) => setServicePincode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Wiring, MCB, Inverter, Fan repair"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Dynamic Shop Fields */}
          {role === 'SHOP_OWNER' && (
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Shop Registration Details
              </span>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Gupta Hardware & Electricals"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shop Category</label>
                  <input
                    type="text"
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    placeholder="Hardware, Electrical, Plumbing"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={shopCity}
                    onChange={(e) => setShopCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="Shop #, Street, Locality"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={shopPincode}
                    onChange={(e) => setShopPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-500/20 transition flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Registering...' : `Register as ${role.replace('_', ' ')}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
