import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Wrench,
  MapPin,
  Shield,
  CreditCard,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.bookingType = typeFilter;

      const res = await api.get('/bookings', { params });
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, typeFilter]);

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.service?.name?.toLowerCase().includes(q) ||
      b.customer?.fullName?.toLowerCase().includes(q) ||
      b.provider?.fullName?.toLowerCase().includes(q) ||
      b.serviceAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Bookings Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking, emergency dispatches, and work order audit records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBookings}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Total Orders: <span className="font-bold text-primary-600">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking #, service, customer or technician name..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Acceptance</option>
          <option value="ACCEPTED">Accepted / Dispatched</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Booking Types</option>
          <option value="NORMAL">Normal Booking</option>
          <option value="EMERGENCY">Emergency SOS</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading booking records...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No matching bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Booking #</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Assigned Provider</th>
                  <th className="py-3.5 px-4">Scheduled Slot</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          #{b.bookingNumber}
                        </span>
                        {b.bookingType === 'EMERGENCY' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            SOS
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.service?.name}</div>
                      <div className="text-[11px] text-slate-400">{b.service?.category?.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{b.customer?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{b.addressPincode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.provider ? (
                        <div className="font-medium text-primary-600">{b.provider.fullName}</div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Awaiting Provider</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>
                        {new Date(b.bookingDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">{b.timeSlot || 'Anytime'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">₹{b.totalAmount}</div>
                      <div className="text-[10px] text-slate-400">{b.paymentStatus || 'PENDING'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'ACCEPTED'
                            ? 'bg-purple-100 text-purple-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-2.5 py-1.5 rounded-lg text-primary-600 hover:bg-primary-50 font-semibold text-xs transition-colors inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Booking #{selectedBooking.bookingNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  Created {new Date(selectedBooking.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  selectedBooking.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedBooking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Customer</span>
                <p className="font-bold text-slate-800">{selectedBooking.customer?.fullName}</p>
                <p className="text-slate-500">{selectedBooking.serviceAddress}</p>
                <p className="font-mono text-slate-400">Pincode: {selectedBooking.addressPincode}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Provider</span>
                <p className="font-bold text-slate-800">
                  {selectedBooking.provider?.fullName || 'Unassigned'}
                </p>
                <p className="text-slate-500">
                  {selectedBooking.provider?.businessName || selectedBooking.service?.name}
                </p>
                <p className="text-slate-400">Rating: {selectedBooking.provider?.ratingAverage || '5.0'} ★</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700">Service & Problem Description</span>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                {selectedBooking.problemDescription || 'No description entered.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl text-xs text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="font-bold text-slate-800">{selectedBooking.bookingType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Fee</span>
                <span className="font-bold text-emerald-600">₹{selectedBooking.totalAmount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment</span>
                <span className="font-bold text-slate-800">{selectedBooking.paymentStatus}</span>
              </div>
            </div>

            {selectedBooking.warranty && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Active Warranty Certificate #{selectedBooking.warranty.certificateNumber}
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    Valid until {new Date(selectedBooking.warranty.validUntil).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
