import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Zap,
  Droplets,
  Wrench,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

export default function EmergencyBooking() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customPincode, setCustomPincode] = useState('400001');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, servRes, addrRes] = await Promise.all([
          api.get('/categories'),
          api.get('/services'),
          api.get('/users/addresses'),
        ]);
        setCategories(catRes.data || []);
        setServices(servRes.data || []);
        setAddresses(addrRes.data || []);

        if (addrRes.data?.length > 0) {
          const defaultAddr = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Failed to load emergency data:', err);
      }
    };
    fetchData();
  }, []);

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedServiceId) {
      return setError('Please select the service category requiring immediate emergency attention');
    }
    if (!problemDescription.trim()) {
      return setError('Please briefly describe the urgent emergency problem');
    }

    let finalAddress = customAddress;
    let finalPincode = customPincode;
    if (selectedAddressId) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        finalAddress = `${addr.label}: ${addr.streetAddress}, ${addr.city}`;
        finalPincode = addr.pincode;
      }
    }

    if (!finalAddress) {
      return setError('Please provide the physical location for emergency dispatch');
    }

    setSubmitting(true);
    try {
      const lat = localStorage.getItem('sevasetu_lat');
      const lon = localStorage.getItem('sevasetu_lon');

      const res = await api.post('/emergency-requests', {
        serviceId: selectedServiceId,
        problemDescription,
        serviceAddress: finalAddress,
        addressPincode: finalPincode,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lon ? parseFloat(lon) : undefined,
      });

      if (res.data?.booking?.id) {
        navigate(`/customer/bookings/${res.data.booking.id}`);
      } else {
        navigate('/customer/bookings');
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-8 text-white shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">🚨 Priority Emergency SOS Dispatch</h1>
        <p className="text-red-100 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Immediate priority broadcast sent to all verified nearby electricians, plumbers, and emergency technicians.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Emergency Form */}
      <form onSubmit={handleEmergencySubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
        <div>
          <label className="block font-bold text-slate-900 mb-2">1. Emergency Service Category *</label>
          <select
            required
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Select Urgent Category --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                🚨 {s.category?.name} → {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-900 mb-1">
            2. Describe the Immediate Hazard / Problem *
          </label>
          <textarea
            rows={3}
            required
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="e.g. Major pipe burst flooding kitchen, or burning smell / sparks from electrical mains board..."
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-900 mb-2">3. Emergency Address *</label>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-start space-x-2 transition ${
                    selectedAddressId === addr.id
                      ? 'border-red-600 bg-red-50/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="emergencyAddress"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 text-red-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">{addr.label}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {addr.streetAddress}, {addr.city} ({addr.pincode})
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                required
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Full Street Address for Emergency Team"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
              <input
                type="text"
                required
                maxLength={6}
                value={customPincode}
                onChange={(e) => setCustomPincode(e.target.value)}
                placeholder="6-digit Pincode"
                className="w-48 px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
          <strong className="block text-amber-950">Emergency Notice:</strong>
          <p>
            Emergency bookings are given top priority in our dispatcher queue. An emergency call-out surcharge may apply for rapid response.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2 animate-pulse"
        >
          <span>{submitting ? 'Broadcasting Urgent SOS...' : '🚨 Broadcast Immediate Emergency SOS'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
