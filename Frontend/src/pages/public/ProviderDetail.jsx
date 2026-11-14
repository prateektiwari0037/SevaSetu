import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Calendar,
  Wrench,
  ArrowRight,
  MessageSquare,
  Award,
} from 'lucide-react';
import api from '../../services/api';

export default function ProviderDetail() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await api.get(`/providers/${id}`);
        setProvider(res.data);
      } catch (err) {
        console.error('Failed to load provider profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Provider Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested provider profile does not exist or has been removed.</p>
        <Link to="/providers" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Browse All Providers
        </Link>
      </div>
    );
  }

  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Provider Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary-100 text-primary-700 font-extrabold flex items-center justify-center text-3xl border border-primary-200 shrink-0">
            {provider.fullName?.charAt(0)}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{provider.fullName}</h1>
              {provider.verificationStatus === 'APPROVED' && (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified Pro
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-primary-600">
              {provider.businessName || provider.primaryCategory}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                <span>{provider.ratingAverage || 5.0}</span>
                <span className="text-slate-400 font-normal ml-1">({provider.reviews?.length || 0} reviews)</span>
              </div>
              <span>•</span>
              <span className="flex items-center font-medium">
                <Award className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {provider.experienceYears} Years Experience
              </span>
              <span>•</span>
              <span>Pincode: {provider.servicePincode || '400001'}</span>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/customer/book-service?providerId=${provider.id}`}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-500/20 transition text-center"
          >
            Book Directly
          </Link>
          <Link
            to={`/customer/book-service?providerId=${provider.id}&mode=quotation`}
            className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition text-center"
          >
            Request Custom Quotation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Bio, Services Offered, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Provider */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">About the Professional</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {provider.bio || 'Verified service professional dedicated to quality craftsmanship and prompt punctuality.'}
            </p>

            {/* Skills */}
            <div className="pt-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Specialized Skills & Qualifications
              </h4>
              <div className="flex flex-wrap gap-2">
                {(provider.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Services Offered</h3>
              <span className="text-xs font-semibold text-slate-500">
                {provider.services?.length || 0} active services
              </span>
            </div>

            {(!provider.services || provider.services.length === 0) ? (
              <p className="text-xs text-slate-400 py-4">No specific individual catalog services listed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {provider.services.map((ps) => (
                  <div key={ps.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{ps.service?.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ps.service?.description}</p>
                      <span className="inline-flex items-center text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded mt-1.5">
                        <ShieldCheck className="w-3 h-3 mr-1" /> {ps.service?.warrantyDays || 30}-Day Warranty
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{ps.customPrice || ps.service?.basePrice}
                      </span>
                      <Link
                        to={`/customer/book-service?serviceId=${ps.service?.id}&providerId=${provider.id}`}
                        className="block mt-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl transition"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Customer Reviews & Ratings</h3>
              <div className="flex items-center text-amber-500 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 mr-1" />
                <span>{provider.ratingAverage || 5.0} / 5.0</span>
              </div>
            </div>

            {(!provider.reviews || provider.reviews.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No reviews yet. Be the first customer to book and rate this provider!
              </p>
            ) : (
              <div className="space-y-4">
                {provider.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {rev.customer?.fullName?.charAt(0) || 'C'}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{rev.customer?.fullName || 'Verified Customer'}</span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    {rev.providerReply && (
                      <div className="mt-2 pl-3 border-l-2 border-primary-500 bg-primary-50/50 p-2 rounded-r-xl">
                        <span className="text-[10px] font-bold text-primary-800 uppercase">Provider Response:</span>
                        <p className="text-xs text-slate-700 mt-0.5">{rev.providerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Availability & Contact */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 text-primary-600 mr-2" /> Working Hours & Availability
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(!provider.availability || provider.availability.length === 0) ? (
                <p className="text-slate-400 py-2">Available Mon - Sat (09:00 AM - 07:00 PM)</p>
              ) : (
                provider.availability.map((av) => (
                  <div key={av.id} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-700">{daysMap[av.dayOfWeek]}</span>
                    <span className="font-semibold text-slate-900">
                      {av.startTime} - {av.endTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-3">
            <h4 className="font-bold text-sm flex items-center text-primary-400">
              <ShieldCheck className="w-4 h-4 mr-2" /> Verified Guarantee
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every booking made through SevaSetu is protected under our 30-day service warranty and customer dispute coverage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
