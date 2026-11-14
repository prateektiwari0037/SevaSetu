import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import api from '../../services/api';

export default function ProviderAvailability() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [schedule, setSchedule] = useState([
    { dayOfWeek: 0, dayName: 'Sunday', isAvailable: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 1, dayName: 'Monday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, dayName: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, dayName: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, dayName: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, dayName: 'Friday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 6, dayName: 'Saturday', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  ]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await api.get('/providers/profile/me');
        if (res.data) {
          setIsAvailable(res.data.isAvailable);
          if (res.data.availability?.length > 0) {
            setSchedule((prev) =>
              prev.map((day) => {
                const match = res.data.availability.find((a) => a.dayOfWeek === day.dayOfWeek);
                return match
                  ? {
                      ...day,
                      isAvailable: match.isAvailable,
                      startTime: match.startTime,
                      endTime: match.endTime,
                    }
                  : day;
              })
            );
          }
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
      }
    };
    fetchAvailability();
  }, []);

  const handleDayToggle = (dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isAvailable: !d.isAvailable } : d))
    );
  };

  const handleTimeChange = (dayOfWeek, field, val) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: val } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.patch('/providers/availability/my', {
        isAvailable,
        availability: schedule,
      });
      setSuccess(true);
    } catch (err) {
      alert(err.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Working Hours & Availability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Control your active status and set operating hours to avoid overlapping bookings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>Availability schedule saved successfully!</span>
        </div>
      )}

      {/* Master Toggle */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-900 text-sm block">Global Service Status</span>
          <span className="text-xs text-slate-500">
            {isAvailable
              ? 'You are actively listed in search results and can receive booking dispatches.'
              : 'You are temporarily marked unavailable / on leave. Customers cannot book you.'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsAvailable(!isAvailable)}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            isAvailable
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {isAvailable ? '🟢 Online & Available' : '🔴 On Leave / Busy'}
        </button>
      </div>

      {/* Day by Day Schedule */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Weekly Operating Days & Shifts</h3>
        <div className="divide-y divide-slate-100">
          {schedule.map((slot) => (
            <div key={slot.dayOfWeek} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center space-x-3 cursor-pointer sm:w-36">
                <input
                  type="checkbox"
                  checked={slot.isAvailable}
                  onChange={() => handleDayToggle(slot.dayOfWeek)}
                  className="rounded text-primary-600 w-4 h-4"
                />
                <span className={`font-bold ${slot.isAvailable ? 'text-slate-900' : 'text-slate-400'}`}>
                  {slot.dayName}
                </span>
              </label>

              {slot.isAvailable ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeChange(slot.dayOfWeek, 'startTime', e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeChange(slot.dayOfWeek, 'endTime', e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              ) : (
                <span className="text-slate-400 font-medium italic">Off Day (Closed)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
