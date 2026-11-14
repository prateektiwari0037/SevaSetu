import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import api from '../../services/api';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Ratings & Reviews</h1>
        <p className="text-xs text-slate-500 mt-1">
          Feedback and ratings you have shared for completed service visits
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Star className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No reviews submitted yet</h3>
          <p className="text-xs text-slate-400">
            Reviews can be submitted upon completion of any scheduled booking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {rev.booking?.service?.name || 'Home Service'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Booking #{rev.booking?.bookingNumber}
                  </span>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                "{rev.comment}"
              </p>

              {rev.providerReply && (
                <div className="pl-3 border-l-2 border-primary-500 text-xs">
                  <span className="text-[10px] font-bold text-primary-800 uppercase block">
                    Provider Reply:
                  </span>
                  <p className="text-slate-600 mt-0.5">{rev.providerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
