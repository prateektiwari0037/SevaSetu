import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ShieldCheck,
  Zap,
  Droplets,
  Sparkles,
  Tv,
  Wrench,
  Hammer,
  Paintbrush,
  BookOpen,
  Wind,
  Grid,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Store,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pincode, setPincode] = useState(() => localStorage.getItem('sevasetu_pincode') || '400001');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, provRes, shopRes] = await Promise.all([
          api.get('/categories'),
          api.get('/providers/nearby?pincode=' + pincode),
          api.get('/shops?pincode=' + pincode),
        ]);
        setCategories(catRes.data || []);
        setFeaturedProviders((provRes.data || []).slice(0, 4));
        setFeaturedShops((shopRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Home data load error:', err);
      }
    };
    fetchData();
  }, [pincode]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services?search=${encodeURIComponent(searchQuery)}&pincode=${encodeURIComponent(pincode)}`);
  };

  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'electrician':
        return Zap;
      case 'plumber':
        return Droplets;
      case 'home-cleaning':
        return Sparkles;
      case 'appliance-repair':
        return Tv;
      case 'vehicle-repair':
        return Wrench;
      case 'carpenter':
        return Hammer;
      case 'painting':
        return Paintbrush;
      case 'home-tutor':
        return BookOpen;
      case 'ac-repair':
        return Wind;
      default:
        return Grid;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50/70 via-slate-50 to-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Trust Pill */}
          <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-primary-200 text-xs font-semibold text-primary-800 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span>100% Admin Verified Local Technicians & Independent Pros</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col sm:flex-row gap-2.5"
          >
            <div className="flex-1 flex items-center px-3 bg-slate-50 rounded-xl border border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
            <div className="sm:w-44 flex items-center px-3 bg-slate-50 rounded-xl border border-slate-100">
              <MapPin className="w-4 h-4 text-primary-600 shrink-0 mr-2" />
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                className="w-full bg-transparent py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-primary-500/20 transition flex items-center justify-center space-x-2"
            >
              <span>{t('searchButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Metrics */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-100 shadow-xs">
              <span className="text-xl font-bold text-slate-900">10+</span>
              <span className="block text-xs text-slate-500">Service Categories</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-100 shadow-xs">
              <span className="text-xl font-bold text-slate-900">100%</span>
              <span className="block text-xs text-slate-500">Verified IDs</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-100 shadow-xs">
              <span className="text-xl font-bold text-slate-900">30 Days</span>
              <span className="block text-xs text-slate-500">Service Warranty</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-100 shadow-xs">
              <span className="text-xl font-bold text-red-600">Priority</span>
              <span className="block text-xs text-slate-500">Emergency SOS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency SOS Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                Immediate Urgent Dispatch
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">{t('emergencyBannerTitle')}</h3>
              <p className="text-red-100 text-xs sm:text-sm mt-1 max-w-xl">
                {t('emergencyBannerText')}
              </p>
            </div>
          </div>
          <Link
            to="/customer/emergency"
            className="px-6 py-3 bg-white hover:bg-red-50 text-red-700 font-bold text-sm rounded-2xl shadow-lg transition whitespace-nowrap shrink-0"
          >
            {t('requestEmergencyBtn')}
          </Link>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('popularCategories')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('browseByService')}</p>
          </div>
          <Link
            to="/services"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
          >
            <span>{t('viewAllCategories')}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.slug);
            return (
              <Link
                key={cat.id}
                to={`/services?category=${cat.slug}`}
                className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-primary-400 hover:shadow-lg hover:-translate-y-1 transition duration-200 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center transition mb-3">
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-1">
                  {cat._count?.services || 0} Services
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Multiple Quotation Feature Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl space-y-5 relative z-10">
            <div className="inline-flex items-center space-x-2 bg-primary-950 text-primary-400 border border-primary-800/80 px-3 py-1 rounded-full text-xs font-semibold">
              <FileCheck className="w-4 h-4" />
              <span>Transparent Market Pricing</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Compare Multiple Quotations from Nearby Verified Pros
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Have a custom repair, wiring job, or renovation? Submit your requirement once and receive independent, transparent bids from local professionals. Compare prices and choose the best offer with zero hidden costs.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/customer/book-service"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
              >
                Request Quotations Now
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Providers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Local Professionals</h2>
            <p className="text-xs text-slate-500 mt-1">Top-rated certified technicians in your pincode area</p>
          </div>
          <Link
            to="/providers"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
          >
            <span>View All Providers</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition duration-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-primary-700 font-bold flex items-center justify-center text-lg border border-slate-200">
                    {provider.fullName?.charAt(0)}
                  </div>
                  {provider.verificationStatus === 'APPROVED' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base">{provider.fullName}</h3>
                <p className="text-xs text-primary-600 font-medium">
                  {provider.businessName || provider.primaryCategory}
                </p>

                <div className="flex items-center space-x-2 my-2 text-xs text-slate-500">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{provider.ratingAverage || 5.0}</span>
                  </div>
                  <span>•</span>
                  <span>{provider.experienceYears} Years Exp</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {provider.bio || 'Experienced local professional providing reliable service.'}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {(provider.skills || []).slice(0, 3).map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-[10px] font-medium text-slate-600 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/providers/${provider.id}`}
                  className="w-full text-center py-2 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white font-semibold text-xs rounded-xl transition"
                >
                  View Profile & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Local Shops Integration Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Local Spare Parts & Hardware Shops</h2>
            <p className="text-xs text-slate-500 mt-1">Order genuine electrical, plumbing & repair materials directly</p>
          </div>
          <Link
            to="/shops"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
          >
            <span>Explore Shops</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                    {shop.shopCategory}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {shop.openingHours || 'Open Today'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{shop.shopName}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                  <span className="truncate">{shop.address}, {shop.pincode}</span>
                </p>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {shop.description}
                </p>

                {/* Catalog Items count */}
                <div className="mt-4 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-medium">In-Stock Catalog Items</span>
                  <span className="font-bold text-primary-600">{shop.catalogItems?.length || 0} items</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  to={`/shops/${shop.id}`}
                  className="block text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
                >
                  View Catalog & Contact Shop
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose SevaSetu Value Props */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">{t('whyChooseTitle')}</h2>
            <p className="text-sm text-slate-600">
              Built on transparency, verified accountability, and community empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t('feature1Title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{t('feature1Desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t('feature2Title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{t('feature2Desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t('feature3Title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{t('feature3Desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t('feature4Title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{t('feature4Desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
