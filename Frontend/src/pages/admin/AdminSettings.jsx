import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Shield,
  Phone,
  Mail,
  Percent,
  Clock,
  Save,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const settingsMap = {};
      if (Array.isArray(res.data)) {
        res.data.forEach((s) => {
          settingsMap[s.key] = s.value;
        });
      }
      setSettings({
        platformCommissionPct: settingsMap.platformCommissionPct || '10',
        emergencyRadiusKm: settingsMap.emergencyRadiusKm || '15',
        standardWarrantyDays: settingsMap.standardWarrantyDays || '30',
        emergencyHotline: settingsMap.emergencyHotline || '+91 1800 123 4567',
        supportEmail: settingsMap.supportEmail || 'support@sevasetu.com',
        maintenanceMode: settingsMap.maintenanceMode || 'false',
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSetting = async (key, description) => {
    setSavingKey(key);
    setFeedback(null);
    try {
      await api.patch('/admin/settings', {
        key,
        value: settings[key],
        description,
      });
      setFeedback({ type: 'success', message: `Setting "${key}" saved successfully!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update setting' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingKey('all');
    setFeedback(null);
    try {
      const keys = [
        { key: 'platformCommissionPct', desc: 'Platform commission percentage' },
        { key: 'emergencyRadiusKm', desc: 'Emergency SOS radius in kilometers' },
        { key: 'standardWarrantyDays', desc: 'Standard service warranty period in days' },
        { key: 'emergencyHotline', desc: 'Public SOS emergency helpline' },
        { key: 'supportEmail', desc: 'Support center contact email' },
        { key: 'maintenanceMode', desc: 'Platform maintenance mode flag' },
      ];

      for (const item of keys) {
        await api.patch('/admin/settings', {
          key: item.key,
          value: settings[item.key],
          description: item.desc,
        });
      }

      setFeedback({ type: 'success', message: 'All platform configurations saved successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading platform settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings & Configurations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system-wide parameters, commission fee splits, warranties, and emergency contact numbers
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={savingKey !== null}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          <span>{savingKey === 'all' ? 'Saving All...' : 'Save All Settings'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Marketplace Financials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
            <Percent className="w-4 h-4 text-primary-600 mr-2" />
            Marketplace Financials & Commission
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Commission Fee (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.platformCommissionPct}
                  onChange={(e) => handleChange('platformCommissionPct', e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() =>
                    handleSaveSetting('platformCommissionPct', 'Platform commission percentage')
                  }
                  disabled={savingKey === 'platformCommissionPct'}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Standard platform commission deducted from completed service booking orders (current: 10%).
              </p>
            </div>
          </div>
        </div>

        {/* Hyperlocal Dispatch & Quality Policies */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-primary-600 mr-2" />
            Hyperlocal Dispatch & Quality Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency SOS Radius (km)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.emergencyRadiusKm}
                  onChange={(e) => handleChange('emergencyRadiusKm', e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() =>
                    handleSaveSetting('emergencyRadiusKm', 'Emergency SOS radius in kilometers')
                  }
                  disabled={savingKey === 'emergencyRadiusKm'}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Maximum distance threshold for broadcasting emergency repair notifications to nearby technicians.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Warranty Period (Days)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={settings.standardWarrantyDays}
                  onChange={(e) => handleChange('standardWarrantyDays', e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'standardWarrantyDays',
                      'Standard service warranty period in days'
                    )
                  }
                  disabled={savingKey === 'standardWarrantyDays'}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Default service warranty duration for free revisits on completed repairs.
              </p>
            </div>
          </div>
        </div>

        {/* Public Contact & Emergency Channels */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-primary-600 mr-2" />
            Support Channels & Helplines
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency 24x7 Helpline
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.emergencyHotline}
                  onChange={(e) => handleChange('emergencyHotline', e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() =>
                    handleSaveSetting('emergencyHotline', 'Public SOS emergency helpline')
                  }
                  disabled={savingKey === 'emergencyHotline'}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Support Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() =>
                    handleSaveSetting('supportEmail', 'Support center contact email')
                  }
                  disabled={savingKey === 'supportEmail'}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
