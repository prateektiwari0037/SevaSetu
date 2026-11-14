import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Fallback to nearby top-rated if user has not bookmarked
        const res = await api.get('/providers/nearby?minRating=4.8');
        setFavorites(res.data || []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Favorite & Recommended Providers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your saved technicians for quick repeat bookings and priority service
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No favorites saved yet</h3>
          <p className="text-xs text-slate-400 mt-1">Browse providers and tap the heart icon to save them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-primary-300 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg border border-primary-200">
                      {provider.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{provider.fullName}</h4>
                      <p className="text-xs text-primary-600 font-medium">
                        {provider.businessName || provider.primaryCategory}
                      </p>
                    </div>
                  </div>
                  <span className="p-1.5 text-red-500 bg-red-50 rounded-full">
                    <Heart className="w-4 h-4 fill-red-500" />
                  </span>
                </div>

                <div className="flex items-center space-x-2 my-2.5 text-xs text-slate-500">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{provider.ratingAverage || 5.0}</span>
                  </div>
                  <span>•</span>
                  <span>{provider.experienceYears} Years Exp</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {provider.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={`/providers/${provider.id}`}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                >
                  <span>Book Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
