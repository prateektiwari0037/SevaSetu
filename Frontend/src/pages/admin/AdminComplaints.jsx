import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/complaints').catch(() => api.get('/complaints'));
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSelectTicket = async (id) => {
    try {
      const res = await api.get(`/admin/complaints/${id}`).catch(() => api.get(`/complaints/${id}`));
      setSelectedTicket(res.data);
      setAdminNotes(res.data.adminNotes || '');
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      await api.post(`/admin/complaints/${selectedTicket.id}/messages`, {
        message: replyText.trim(),
      });
      setReplyText('');
      handleSelectTicket(selectedTicket.id);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/complaints/${selectedTicket.id}`, {
        status,
        adminNotes,
      });
      handleSelectTicket(selectedTicket.id);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!statusFilter) return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints & Dispute Resolution Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Investigate customer dissatisfaction tickets, mediate between customers and providers, and log resolutions
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 self-start sm:self-auto"
        >
          <option value="">All Ticket Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Dismissed / Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tickets ({filteredComplaints.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No tickets found</div>
            ) : (
              filteredComplaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectTicket(c.id)}
                  className={`w-full text-left p-4 transition-colors hover:bg-slate-50 flex flex-col space-y-1.5 ${
                    selectedTicket?.id === c.id ? 'bg-primary-50/60 border-l-4 border-primary-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{c.ticketNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'OPEN'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">{c.subject}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{c.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{c.customer?.fullName || 'Customer'}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Conversation & Resolution Pane */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col h-[700px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      #{selectedTicket.ticketNumber} – {selectedTicket.subject}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedTicket.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filed by {selectedTicket.customer?.fullName} • Category: {selectedTicket.category}
                  </p>
                </div>

                {/* Status Update Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  {selectedTicket.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selectedTicket.status !== 'UNDER_REVIEW' && selectedTicket.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Investigate
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isAdmin = m.senderRole === 'ADMIN';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1">
                          {isAdmin ? 'Admin Support Agent' : selectedTicket.customer?.fullName || 'Customer'} •{' '}
                          {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-primary-600 text-white rounded-tr-xs'
                              : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No messages in ticket thread</p>
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official response to the customer..."
                  className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <LifeBuoy className="w-12 h-12 stroke-1 mb-2 opacity-50" />
              <p className="text-xs">Select a dispute ticket from the left panel to inspect and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
