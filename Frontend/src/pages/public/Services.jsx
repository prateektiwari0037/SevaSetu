import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Wrench,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function Services() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const searchKeyword = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchKeyword);
  const [priceTypeFilter, setPriceTypeFilter] = useState('ALL');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let url = `/services?`;
        if (selectedCategory) url += `categorySlug=${encodeURIComponent(selectedCategory)}&`;
        if (searchKeyword) url += `search=${encodeURIComponent(searchKeyword)}&`;
        if (priceTypeFilter !== 'ALL') url += `priceType=${encodeURIComponent(priceTypeFilter)}&`;

        const res = await api.get(url);
        setServices(res.data || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedCategory, searchKeyword, priceTypeFilter]);

  const handleCategoryClick = (slug) => {
    if (selectedCategory === slug) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchParams.set('search', searchInput.trim());
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore Hyperlocal Services
        </h1>
        <p className="text-sm text-slate-600">
          Transparent pricing, certified experts, and guaranteed 30-day warranty on all jobs.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search service name or description..."
            className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={priceTypeFilter}
            onChange={(e) => setPriceTypeFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden"
          >
            <option value="ALL">All Pricing Types</option>
            <option value="FIXED">Fixed Price</option>
            <option value="INSPECTION">Inspection / Diagnostic</option>
            <option value="HOURLY">Hourly Rate</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategoryClick('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            !selectedCategory
              ? 'bg-primary-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat.slug
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Loading available services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No services found matching your criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or changing your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-xl hover:border-primary-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                    {service.category?.name || 'General'}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {service.warrantyDays}d Warranty
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {service.estimatedDurationMinutes} mins
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-600">
                    {service.priceType} Price
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Base Price</span>
                  <span className="text-lg font-extrabold text-slate-900">₹{service.basePrice}</span>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/services/${service.id}`}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/customer/book-service?serviceId=${service.id}`}
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
