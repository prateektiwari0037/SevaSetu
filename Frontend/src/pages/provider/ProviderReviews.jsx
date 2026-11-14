import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ProviderReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/my-reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSendReply = async (reviewId) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    setSubmittingId(reviewId);
    try {
      await api.patch(`/reviews/${reviewId}/reply`, {
        providerReply: text,
      });
      fetchReviews();
      setReplyText({ ...replyText, [reviewId]: '' });
    } catch (err) {
      alert(err.message || 'Failed to submit reply');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Feedback & Reviews</h1>
        <p className="text-xs text-slate-500 mt-1">
          Read client satisfaction comments and respond to maintain a high reputation
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Star className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No reviews yet</h3>
          <p className="text-xs text-slate-400">
            Reviews will appear here as soon as clients conclude service bookings with you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {rev.customer?.fullName || 'Customer'}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Service: {rev.booking?.service?.name}
                    </span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic mt-2">
                  "{rev.comment}"
                </p>

                {rev.providerReply && (
                  <div className="mt-3 pl-3 border-l-2 border-primary-500 bg-primary-50/50 p-2.5 rounded-r-xl text-xs">
                    <span className="text-[10px] font-bold text-primary-800 uppercase block">
                      Your Response:
                    </span>
                    <p className="text-slate-700 mt-0.5">{rev.providerReply}</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {!rev.providerReply && (
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={replyText[rev.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                    placeholder="Write a response to thank the customer..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    disabled={submittingId === rev.id}
                    className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
