import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to load payments history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalGross = payments.reduce((sum, p) => sum + (p.status === 'SUCCESSFUL' ? p.amount : 0), 0);
  const platformEarnings = Math.round(totalGross * 0.1 * 100) / 100;
  const providerDisbursed = Math.round(totalGross * 0.9 * 100) / 100;

  const filteredPayments = payments.filter((p) => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Commission Accounting</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track gross merchandise volume (GMV), 10% platform revenue commissions, and provider payouts
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Gross Platform GMV</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ₹{totalGross.toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Total collected through online & COD orders</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block">
            Platform Net Revenue (10%)
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            ₹{platformEarnings.toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Retained platform service commissions</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 block">Provider Disbursements (90%)</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            ₹{providerDisbursed.toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Net earnings payable to verified technicians</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Transaction Ledger ({filteredPayments.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
          >
            <option value="">All Payment Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading ledger...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No payment transactions recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Gross Amount</th>
                  <th className="py-3.5 px-4">Platform Fee (10%)</th>
                  <th className="py-3.5 px-4">Provider Share (90%)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p) => {
                  const comm = Math.round(p.amount * 0.1 * 100) / 100;
                  const prov = Math.round(p.amount * 0.9 * 100) / 100;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.transactionId || `TXN-${p.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-primary-600">
                        {p.booking?.bookingNumber ? `#${p.booking.bookingNumber}` : 'Direct'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.booking?.customer?.fullName || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{p.amount}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">₹{comm}</td>
                      <td className="py-3.5 px-4 font-semibold text-blue-600">₹{prov}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'SUCCESSFUL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
