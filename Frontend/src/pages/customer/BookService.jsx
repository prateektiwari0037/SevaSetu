import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  ShieldCheck,
  FileText,
  ArrowRight,
  Plus,
} from 'lucide-react';
import api from '../../services/api';

export default function BookService() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedServiceId = searchParams.get('serviceId') || '';
  const preselectedProviderId = searchParams.get('providerId') || '';
  const initialMode = searchParams.get('mode') === 'quotation' ? 'QUOTATION' : 'DIRECT';

  const [mode, setMode] = useState(initialMode); // 'DIRECT' | 'QUOTATION'
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [providers, setProviders] = useState([]);

  // Form Fields
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId);
  const [selectedProviderId, setSelectedProviderId] = useState(preselectedProviderId);
  const [problemDescription, setProblemDescription] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customPincode, setCustomPincode] = useState('400001');
  const [isEmergency, setIsEmergency] = useState(false);

  // New address inline form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Mumbai');
  const [newState, setNewState] = useState('Maharashtra');
  const [newPincode, setNewPincode] = useState('400001');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
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
        console.error('Failed to load initial booking data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // When service changes, fetch providers offering it
  useEffect(() => {
    if (selectedServiceId) {
      const loadProviders = async () => {
        try {
          const res = await api.get(`/services/${selectedServiceId}`);
          if (res.data?.providerServices) {
            setProviders(res.data.providerServices.map((ps) => ps.provider));
          }
        } catch (err) {
          console.error(err);
        }
      };
      loadProviders();
    }
  }, [selectedServiceId]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/addresses', {
        label: newLabel,
        streetAddress: newStreet,
        city: newCity,
        state: newState,
        pincode: newPincode,
        isDefault: true,
      });
      setAddresses([res.data, ...addresses]);
      setSelectedAddressId(res.data.id);
      setShowNewAddress(false);
      setNewStreet('');
    } catch (err) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedServiceId) {
      return setError('Please select a service category and service');
    }
    if (!problemDescription.trim()) {
      return setError('Please enter a description of the problem or task');
    }

    // Resolve address
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
      return setError('Please select or enter a service location address');
    }

    setSubmitting(true);
    try {
      if (mode === 'QUOTATION') {
        const selectedService = services.find((s) => s.id === selectedServiceId);
        const reqRes = await api.post('/service-requests', {
          serviceId: selectedServiceId,
          title: `Quotation Request: ${selectedService?.name || 'Home Service'}`,
          description: problemDescription,
          address: finalAddress,
          pincode: finalPincode,
          preferredDate: bookingDate,
          preferredTimeSlot: timeSlot,
        });

        navigate(`/customer/quotations/${reqRes.data.id}`);
      } else {
        // Direct Booking
        const bookRes = await api.post('/bookings', {
          serviceId: selectedServiceId,
          providerId: selectedProviderId || undefined,
          problemDescription,
          bookingDate,
          timeSlot,
          serviceAddress: finalAddress,
          addressPincode: finalPincode,
          bookingType: isEmergency ? 'EMERGENCY' : 'NORMAL',
        });

        navigate(`/customer/bookings/${bookRes.data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {mode === 'QUOTATION' ? 'Request Multiple Service Quotations' : 'Book a Local Service'}
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          {mode === 'QUOTATION'
            ? 'Describe your requirement and get transparent bids from verified neighborhood technicians.'
            : 'Schedule an instant visit from a verified local technician with guaranteed 30-day warranty.'}
        </p>

        {/* Mode Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl mt-2">
          <button
            type="button"
            onClick={() => setMode('DIRECT')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
              mode === 'DIRECT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Direct Service Booking
          </button>
          <button
            type="button"
            onClick={() => setMode('QUOTATION')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
              mode === 'QUOTATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Multiple Quotations Mode
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
        {/* Service Selection */}
        <div>
          <label className="block font-bold text-slate-900 mb-2">1. Select Service Category & Job *</label>
          <select
            required
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
          >
            <option value="">-- Choose a Service --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.category?.name} → {s.name} (Base: ₹{s.basePrice})
              </option>
            ))}
          </select>

          {selectedService && (
            <div className="mt-2.5 p-3 bg-primary-50/60 rounded-xl border border-primary-100 flex items-center justify-between text-xs">
              <span className="text-primary-800 font-medium">{selectedService.description}</span>
              <span className="font-extrabold text-primary-900 whitespace-nowrap ml-2">
                Starting ₹{selectedService.basePrice}
              </span>
            </div>
          )}
        </div>

        {/* Optional Provider Selection (Direct mode only) */}
        {mode === 'DIRECT' && providers.length > 0 && (
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Select Specific Provider (Optional - leave default for best available technician)
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">⚡ Auto-Assign Nearest Available Certified Pro</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.experienceYears} yrs exp • ★ {p.ratingAverage || 5.0})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Problem Description */}
        <div>
          <label className="block font-bold text-slate-900 mb-1">
            2. Describe the Problem / Service Requirements *
          </label>
          <textarea
            rows={3}
            required
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="e.g. Living room fan is making loud buzzing noise and regulator knob is loose..."
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Address Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-slate-900">3. Service Location Address *</label>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-primary-600 font-bold hover:underline flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showNewAddress ? 'Cancel' : 'Add New Address'}
            </button>
          </div>

          {showNewAddress ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mb-3">
              <span className="font-bold text-slate-800 block text-xs">Save New Address</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Label (e.g. Home, Office)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Flat / Building / Street Address"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddNewAddress}
                className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs"
              >
                Save & Select This Address
              </button>
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-start space-x-2.5 transition ${
                    selectedAddressId === addr.id
                      ? 'border-primary-600 bg-primary-50/50'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="addressSelection"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 text-primary-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">{addr.label}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
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
                placeholder="Full Street Address"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
              <input
                type="text"
                required
                maxLength={6}
                value={customPincode}
                onChange={(e) => setCustomPincode(e.target.value)}
                placeholder="Pincode (6 digits)"
                className="w-48 px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          )}
        </div>

        {/* Date and Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-900 mb-1">4. Preferred Service Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">5. Preferred Time Slot *</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="08:00 AM - 10:00 AM">Morning: 08:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 12:00 PM">Morning: 10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">Afternoon: 12:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 04:00 PM">Afternoon: 02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">Evening: 04:00 PM - 06:00 PM</option>
                <option value="06:00 PM - 08:00 PM">Evening: 06:00 PM - 08:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Emergency SOS Checkbox */}
        {mode === 'DIRECT' && (
          <label className="flex items-center space-x-2.5 p-3 rounded-2xl border border-red-200 bg-red-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded"
            />
            <div>
              <span className="font-bold text-red-700 block">Mark as Priority Emergency SOS Request</span>
              <span className="text-[11px] text-red-600">
                Broadcasts urgently to all nearby active technicians for immediate dispatch.
              </span>
            </div>
          </label>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {mode === 'QUOTATION' ? (
              <span>Multiple independent bids will arrive within minutes.</span>
            ) : (
              <span>Protected by SevaSetu 30-Day Service Warranty.</span>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-500/20 transition flex items-center space-x-2"
          >
            <span>
              {submitting
                ? 'Submitting...'
                : mode === 'QUOTATION'
                ? 'Submit for Quotations'
                : 'Confirm & Place Booking'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
