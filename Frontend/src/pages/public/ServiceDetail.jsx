import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Star,
  MapPin,
  ArrowRight,
  FileText,
} from 'lucide-react';
import api from '../../services/api';

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (err) {
        console.error('Failed to load service:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Service Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested service does not exist or has been deactivated.</p>
        <Link to="/services" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
          Browse All Services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Service Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-md">
              {service.category?.name}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {service.warrantyDays}-Day Service Warranty
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {service.name}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {service.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Estimated Duration</span>
              <span className="text-sm font-bold text-slate-800 flex items-center mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {service.estimatedDurationMinutes} Minutes
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Pricing Type</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 capitalize">
                {service.priceType} Charge
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Standard Base Price</span>
              <span className="text-xl font-extrabold text-primary-600 mt-0.5">
                ₹{service.basePrice}
              </span>
            </div>
          </div>
        </div>

        {/* Action Box */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full md:w-80 shrink-0 space-y-4">
          <div className="text-center pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Standard Starting Price</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{service.basePrice}</p>
          </div>

          <div className="space-y-2">
            <Link
              to={`/customer/book-service?serviceId=${service.id}`}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-500/20 transition flex items-center justify-center space-x-2"
            >
              <span>Book Instant Service</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={`/customer/book-service?serviceId=${service.id}&mode=quotation`}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Get Multiple Quotations</span>
            </Link>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-normal">
            No cancellation charges before technician dispatch. Transparent pricing guaranteed.
          </p>
        </div>
      </div>

      {/* Verified Providers Offering This Service */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Nearby Providers Offering {service.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compare verified professionals, review scores, and book directly
          </p>
        </div>

        {(!service.providerServices || service.providerServices.length === 0) ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">
              Currently all assigned specialists for this specific service are booked.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              You can still submit a quotation request, and eligible nearby technicians will respond promptly.
            </p>
            <Link
              to={`/customer/book-service?serviceId=${service.id}&mode=quotation`}
              className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold"
            >
              Request Quotations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.providerServices.map((ps) => {
              const provider = ps.provider;
              return (
                <div
                  key={ps.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{provider.fullName}</h4>
                        <p className="text-xs text-primary-600 font-medium">
                          {provider.businessName || provider.primaryCategory}
                        </p>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 my-2.5">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        <span>{provider.ratingAverage || 5.0}</span>
                      </div>
                      <span>•</span>
                      <span>{provider.experienceYears} Years Exp</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {provider.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Rate</span>
                      <p className="text-base font-extrabold text-slate-900">
                        ₹{ps.customPrice || service.basePrice}
                      </p>
                    </div>
                    <Link
                      to={`/customer/book-service?serviceId=${service.id}&providerId=${provider.id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                    >
                      Book Specialist
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
