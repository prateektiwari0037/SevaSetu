import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Navigation,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

export default function Providers() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pincode, setPincode] = useState(() => searchParams.get('pincode') || localStorage.getItem('sevasetu_pincode') || '400001');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating, distance, experience
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Categories error:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const lat = localStorage.getItem('sevasetu_lat');
      const lon = localStorage.getItem('sevasetu_lon');

      let url = `/providers/nearby?sortBy=${sortBy}&`;
      if (pincode && pincode !== 'GPS Locked') url += `pincode=${encodeURIComponent(pincode)}&`;
      if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (minRating) url += `minRating=${minRating}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (lat && lon) url += `latitude=${lat}&longitude=${lon}&`;

      const res = await api.get(url);
      setProviders(res.data || []);
    } catch (err) {
      console.error('Providers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [pincode, selectedCategory, minRating, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem('sevasetu_lat', pos.coords.latitude);
          localStorage.setItem('sevasetu_lon', pos.coords.longitude);
          setPincode('GPS Locked');
          setSortBy('distance');
        },
        () => {
          alert('Location access denied. Please enter your pincode manually.');
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Verified Local Technicians & Pros
        </h1>
        <p className="text-sm text-slate-600">
          Discover certified electricians, plumbers, appliance technicians, and handymen near you.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, bio..."
              className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800"
            />
          </form>

          {/* Pincode & GPS */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode (e.g. 400001)"
              className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800"
            />
            <button
              onClick={handleUseCurrentGPS}
              title="Detect Current GPS Location"
              className="p-1 hover:bg-slate-200 rounded text-primary-600 shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden"
          >
            <option value="rating">Highest Rated</option>
            <option value="distance">Nearest Distance (GPS)</option>
            <option value="experience">Most Experienced</option>
          </select>
        </div>
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Searching verified nearby providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No verified providers found in this area.</p>
          <p className="text-xs text-slate-400 mt-1">Try expanding your pincode search or resetting category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-primary-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg border border-primary-200">
                      {provider.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{provider.fullName}</h3>
                      <p className="text-xs text-primary-600 font-medium">
                        {provider.businessName || provider.primaryCategory}
                      </p>
                    </div>
                  </div>
                  {provider.verificationStatus === 'APPROVED' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 my-3 text-xs text-slate-500">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{provider.ratingAverage || 5.0}</span>
                  </div>
                  <span>•</span>
                  <span>{provider.experienceYears} Years Exp</span>
                  {provider.distanceKm !== null && (
                    <>
                      <span>•</span>
                      <span className="text-primary-700 font-semibold">{provider.distanceKm} km away</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mt-1">
                  {provider.bio || 'Experienced local professional providing reliable service.'}
                </p>

                {/* Skills Badges */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(provider.skills || []).slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-[10px] font-semibold text-slate-600 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Pincode: <span className="text-slate-800">{provider.servicePincode || 'Local'}</span>
                </span>
                <Link
                  to={`/providers/${provider.id}`}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
                >
                  <span>Profile & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
