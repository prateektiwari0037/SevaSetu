import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, TrendingUp, ThumbsUp } from 'lucide-react';
import api from '../../services/api';

export default function ProviderReviews() {
  const [reviewsData, setReviewsData] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/providers/me/reviews');
      if (res.data) {
        if (res.data.reviews) {
          setReviewsData(res.data);
        } else if (Array.isArray(res.data)) {
          // Flat list
          const list = res.data;
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          let total = 0;
          list.forEach((r) => {
            const sc = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
            dist[sc] = (dist[sc] || 0) + 1;
            total += r.rating || 5;
          });
          setReviewsData({
            averageRating: list.length ? Number((total / list.length).toFixed(1)) : 0,
            totalReviews: list.length,
            distribution: dist,
            reviews: list,
          });
        }
      }
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

  const { averageRating, totalReviews, distribution, reviews } = reviewsData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Customer Ratings & Reviews
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review authentic feedback from clients who booked your services. Ratings cannot be modified.
        </p>
      </div>

      {/* Ratings Summary & Distribution (PRD Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Average Rating Card */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-r border-slate-100">
          <span className="text-4xl font-extrabold text-slate-900">{averageRating || 0}</span>
          <div className="flex text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i <= Math.round(averageRating) ? 'fill-amber-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Based on {totalReviews || 0} verified customer reviews
          </span>
        </div>

        {/* Rating Distribution Bar Chart */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution?.[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                  {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right font-medium text-slate-400 text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Star className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No customer reviews yet</h3>
          <p className="text-xs text-slate-400">
            Reviews from clients will appear here after they complete service bookings with you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id || rev._id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {rev.customer?.fullName || rev.customerId?.fullName || 'Verified Customer'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rev.booking?.bookingNumber ? `#${rev.booking.bookingNumber}` : ''}
                      {rev.booking?.service?.name ? ` • ${rev.booking.service.name}` : ''}
                    </span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic mt-2">
                  "{rev.comment || 'Great professional service delivered on time.'}"
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
                    value={replyText[rev.id || rev._id] || ''}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [rev.id || rev._id]: e.target.value })
                    }
                    placeholder="Write a response to thank the customer..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => handleSendReply(rev.id || rev._id)}
                    disabled={submittingId === (rev.id || rev._id)}
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
