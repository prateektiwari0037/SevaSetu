import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ProviderServices() {
  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await api.get('/providers/services/my');
      setMyServices(res.data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this service from your profile?')) return;
    try {
      await api.delete(`/providers/services/my/${id}`);
      setMyServices(myServices.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Service Offerings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your service rates, duration, and catalog shown to customers
          </p>
        </div>
        <Link
          to="/provider/services/add"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading catalog...</div>
      ) : myServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="font-bold text-slate-800 text-base">No services configured yet</p>
          <p className="text-xs text-slate-400">Add services to start appearing in search results.</p>
          <Link
            to="/provider/services/add"
            className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Add Service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myServices.map((ps) => (
            <div
              key={ps.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                  {ps.service?.category?.name}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{ps.service?.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Experience: {Math.round(ps.experienceMonths / 12)} yrs • Base: ₹{ps.service?.basePrice}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Rate</span>
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{ps.customPrice || ps.service?.basePrice}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(ps.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
