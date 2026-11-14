import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Package, LifeBuoy, CheckCircle2, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function ShopDashboard() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get('/shops/owner/profile');
        setShop(res.data);
      } catch (err) {
        console.error('Failed to load shop dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  const isVerified = shop?.verificationStatus === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-300 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
              Merchant Workstation
            </span>
            {isVerified ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Store
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Verification Pending
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{shop?.shopName || 'Local Shop'}</h1>
          <p className="text-xs sm:text-sm text-blue-200">
            {shop?.shopCategory} • {shop?.address}, {shop?.pincode}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/shop/catalog"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Catalog</span>
          </Link>
          <Link
            to="/shop/inquiries"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition"
          >
            Inquiries ({shop?.inquiries?.length || 0})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Catalog Items</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            {shop?.catalogItems?.length || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Customer Inquiries</span>
            <LifeBuoy className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-purple-600">
            {shop?.inquiries?.length || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Store Status</span>
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xl font-extrabold text-emerald-600">
            {isVerified ? 'Verified & Live' : 'Under Review'}
          </span>
        </div>
      </div>

      {/* Recent Catalog Preview */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Featured Inventory Items</h2>
          <Link to="/shop/catalog" className="text-xs font-bold text-primary-600 hover:underline">
            View All ({shop?.catalogItems?.length || 0})
          </Link>
        </div>

        {(!shop?.catalogItems || shop.catalogItems.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No items in catalog yet. Add products to attract neighborhood customers.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {shop.catalogItems.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-0.5">{item.name}</h4>
                  <span className="text-xs font-extrabold text-primary-700 mt-1 block">
                    ₹{item.price} / {item.unit}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.inStock ? 'In Stock' : 'Out'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
