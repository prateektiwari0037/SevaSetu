import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';

export default function CustomerNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Status updates regarding bookings, quotations, and warranty service
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition flex items-center space-x-1"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No notifications yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Updates on your bookings and incoming quotations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200/80'
                  : 'bg-primary-50/50 border-primary-200 shadow-xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      n.isRead ? 'bg-slate-300' : 'bg-primary-600'
                    }`}
                  />
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-4">{n.message}</p>
                <span className="text-[10px] text-slate-400 pl-4 block mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              <button
                onClick={(e) => handleDelete(n.id, e)}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
