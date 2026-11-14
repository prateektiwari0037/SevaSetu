import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function CustomerSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [plansRes, mySubRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions'),
      ]);
      setPlans(plansRes.data || []);
      setMySubscriptions(mySubRes.data || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (planId) => {
    if (!window.confirm('Confirm subscription to this maintenance plan?')) return;
    setSubscribingId(planId);
    try {
      await api.post('/subscriptions', { planId });
      setActionSuccess('Plan activated successfully! Your monthly inspections are ready.');
      fetchData();
    } catch (err) {
      alert(err.message || 'Subscription failed');
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Subscription Plans</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hassle-free recurring maintenance for home electricals, plumbing, and appliances
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Active Subscriptions */}
      {mySubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Your Active Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-3xl p-6 border border-primary-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-800 bg-white px-2.5 py-1 rounded-md">
                    {sub.status}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    Valid until {new Date(sub.endDate).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{sub.plan?.name}</h3>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-primary-200/60">
                  <span className="text-slate-600">Remaining Inspections:</span>
                  <span className="font-extrabold text-primary-700 text-sm">
                    {sub.servicesRemaining} visits left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Available Annual & Monthly Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-primary-400 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-50 uppercase tracking-wider px-2.5 py-1 rounded-md">
                    {plan.category}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-2">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="py-2 border-y border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900">₹{plan.price}</span>
                  <span className="text-xs text-slate-500 ml-1">/ {plan.durationDays} days</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs text-slate-600">
                  {(plan.features || []).map((feat, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 mr-2 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={subscribingId === plan.id}
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {subscribingId === plan.id ? 'Activating...' : 'Subscribe Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
