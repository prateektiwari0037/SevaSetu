import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Package,
  Send,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get(`/shops/${id}`);
        setShop(res.data);
      } catch (err) {
        console.error('Failed to load shop details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    setInquiryError('');
    setSubmittingInquiry(true);

    try {
      await api.post('/shops/inquiries', {
        shopId: shop.id,
        customerName: inquiryName,
        customerPhone: inquiryPhone,
        customerEmail: inquiryEmail || undefined,
        message: inquiryMessage,
        itemName: selectedItemName || undefined,
      });

      setInquirySuccess(true);
      setInquiryMessage('');
      setSelectedItemName('');
    } catch (err) {
      setInquiryError(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Shop Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested shop does not exist or has been deactivated.</p>
        <Link to="/shops" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Browse All Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Shop Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-md">
              {shop.shopCategory}
            </span>
            {shop.verificationStatus === 'APPROVED' && (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified Merchant
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {shop.shopName}
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed">{shop.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-primary-600 mr-2 shrink-0" />
              <span>{shop.address}, {shop.pincode}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-primary-600 mr-2 shrink-0" />
              <span>{shop.openingHours || '09:00 AM - 08:30 PM'}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-primary-600 mr-2 shrink-0" />
              <span>{shop.contactPhone}</span>
            </div>
          </div>
        </div>

        {/* Quick Inquiry CTA */}
        <div className="w-full md:w-auto shrink-0 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">Looking for specific parts or bulk quote?</p>
          <a
            href="#inquiry-section"
            className="block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Send Inquiry to Shop
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Catalog Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Package className="w-5 h-5 text-primary-600 mr-2" /> Product Catalog & Inventory
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {shop.catalogItems?.length || 0} items listed
            </span>
          </div>

          {(!shop.catalogItems || shop.catalogItems.length === 0) ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No specific catalog products listed yet. Please submit an inquiry below.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shop.catalogItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.inStock
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">₹{item.price}</span>
                      <span className="text-[10px] text-slate-400 ml-1">/ {item.unit}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItemName(item.name);
                        const section = document.getElementById('inquiry-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      Inquire Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Inquiry Form */}
        <div id="inquiry-section" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Send className="w-4 h-4 text-primary-600 mr-2" /> Send Customer Inquiry
            </h3>
            <p className="text-xs text-slate-500">
              Inquire about current stock, bulk pricing, or material specifications directly from the merchant.
            </p>

            {inquirySuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold">Inquiry Sent Successfully!</p>
                <p>The shop owner will respond via phone call or WhatsApp shortly.</p>
                <button
                  onClick={() => setInquirySuccess(false)}
                  className="mt-2 text-primary-700 font-bold underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
                {inquiryError && (
                  <p className="p-2 bg-red-50 text-red-600 rounded-lg">{inquiryError}</p>
                )}

                {selectedItemName && (
                  <div className="p-2 bg-primary-50 text-primary-800 rounded-lg flex items-center justify-between">
                    <span>Item: <strong>{selectedItemName}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedItemName('')}
                      className="text-xs font-bold text-primary-900"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. +91 9820011223"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inquiry / Requirements *</label>
                  <textarea
                    rows={3}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Specify quantity, brand requirements, or ask for availability..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {submittingInquiry ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
