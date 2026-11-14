import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function CustomerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Service Quality');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active selected complaint for chat
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data || []);
      if (selectedComplaint) {
        const updated = (res.data || []).find((c) => c.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        category,
        subject,
        description,
        bookingId: bookingId || undefined,
      });
      setModalOpen(false);
      setSubject('');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/complaints/${selectedComplaint.id}/messages`, {
        message: replyMessage,
      });
      setReplyMessage('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support & Grievances</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit complaints, report disputes, or request resolution from platform administrators
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>New Complaint Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Complaints List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tickets ({complaints.length})
          </h3>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
          ) : complaints.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No active complaints.
            </div>
          ) : (
            <div className="space-y-2">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={async () => {
                    const res = await api.get(`/complaints/${c.id}`);
                    setSelectedComplaint(res.data);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedComplaint?.id === c.id
                      ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{c.ticketNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{c.subject}</h4>
                  <span className="text-[10px] text-slate-500 mt-1 block">{c.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 Cols: Selected Complaint Thread */}
        <div className="lg:col-span-2">
          {selectedComplaint ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col h-[550px] justify-between">
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Ticket #{selectedComplaint.ticketNumber} • {selectedComplaint.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {selectedComplaint.subject}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                    {selectedComplaint.status}
                  </span>
                </div>

                {/* Messages scroll area */}
                <div className="py-4 space-y-3 overflow-y-auto max-h-[360px] pr-2">
                  {(selectedComplaint.messages || []).map((msg) => {
                    const isAdmin = msg.senderRole === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs ${
                            isAdmin
                              ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                              : 'bg-primary-600 text-white rounded-tr-xs'
                          }`}
                        >
                          <span
                            className={`block text-[10px] font-bold mb-1 ${
                              isAdmin ? 'text-purple-700' : 'text-primary-100'
                            }`}
                          >
                            {isAdmin ? '🛡️ SevaSetu Support Admin' : 'You (Customer)'}
                          </span>
                          <p className="leading-relaxed">{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a message or response..."
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-64">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <span>Select a complaint ticket from the left to view the thread.</span>
            </div>
          )}
        </div>
      </div>

      {/* New Complaint Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Support Ticket</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="Service Quality">Service Quality & Workmanship</option>
                  <option value="Provider Behavior">Provider Conduct / Late Arrival</option>
                  <option value="Billing & Charges">Overcharging / Billing Issue</option>
                  <option value="Warranty Dispute">Warranty Claim Disagreement</option>
                  <option value="Other">Other Platform Grievance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of the issue..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all relevant details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
