import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Store,
  MapPin,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Package,
} from 'lucide-react';
import api from '../../services/api';

export default function Shops() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pincode, setPincode] = useState(() => searchParams.get('pincode') || localStorage.getItem('sevasetu_pincode') || '400001');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    try {
      let url = `/shops?`;
      if (pincode && pincode !== 'GPS Locked') url += `pincode=${encodeURIComponent(pincode)}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      setShops(res.data || []);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [pincode, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShops();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Local Hardware & Spare Parts Shops
        </h1>
        <p className="text-sm text-slate-600">
          Source genuine switches, wires, plumbing pipes, bathroom fixtures, and tools directly from verified neighborhood merchants.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop name, city, address..."
              className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800"
            />
          </form>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode (e.g. 400001)"
              className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden"
          >
            <option value="">All Shop Types</option>
            <option value="Hardware">Hardware & Construction</option>
            <option value="Electrical">Electrical Spares & Cables</option>
            <option value="Plumbing">Plumbing Fittings & Sanitary</option>
            <option value="Automobile">Automobile Parts</option>
          </select>
        </div>
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Loading verified local stores...</p>
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No local shops found in this area.</p>
          <p className="text-xs text-slate-400 mt-1">Try searching with a broader pincode or different categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-primary-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                    {shop.shopCategory}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {shop.openingHours || 'Open Daily'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{shop.shopName}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                  <span>{shop.address}, {shop.pincode}</span>
                </p>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {shop.description}
                </p>

                {/* Catalog summary */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="flex items-center text-slate-600 font-medium">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Catalog Inventory
                  </span>
                  <span className="font-bold text-primary-600">{shop.catalogItems?.length || 0} Products</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  to={`/shops/${shop.id}`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                >
                  <span>Browse Catalog & Inquiry</span>
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
