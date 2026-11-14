import React, { useState, useEffect } from 'react';
import { LifeBuoy, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ShopInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await api.get('/shops/owner/inquiries');
        setInquiries(res.data || []);
      } catch (err) {
        console.error('Failed to load inquiries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Inquiries</h1>
        <p className="text-xs text-slate-500 mt-1">
          Stock checks, bulk quotes, and direct messages sent by neighborhood buyers
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No customer inquiries received yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{inq.customerName}</h4>
                  {inq.itemName && (
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded mt-1 inline-block">
                      Item: {inq.itemName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {inq.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                "{inq.message}"
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={`tel:${inq.customerPhone}`}
                  className="font-bold text-primary-600 hover:underline flex items-center"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" /> Call: {inq.customerPhone}
                </a>
                <span className="text-[10px] text-slate-400">
                  {new Date(inq.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
