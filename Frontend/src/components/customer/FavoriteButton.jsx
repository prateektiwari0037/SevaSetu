import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { getId, providerName } from '../../utils/customer';

/** Heart toggle for a provider. Hidden when the favorites API is unavailable. */
export default function FavoriteButton({ provider, size = 'md', showLabel = false }) {
  const favorites = useFavorites();
  const toast = useToast();
  const id = getId(provider);
  if (!id || favorites.unsupported) return null;

  const active = favorites.isFavorite(id);
  const pending = favorites.isPending(id);
  const name = providerName(provider);
  const label = active ? `Remove ${name} from favorites` : `Add ${name} to favorites`;

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nowFavorite = await favorites.toggle(provider);
      toast.success(nowFavorite ? `${name} saved to favorites` : `${name} removed from favorites`);
    } catch (err) {
      toast.error(err.message || 'Could not update favorites');
    }
  };

  const dims = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`${showLabel ? 'px-3 h-9 gap-1.5' : dims} inline-flex items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 ${
        active ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
      }`}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart className={`w-4 h-4 ${active ? 'fill-rose-500' : ''}`} aria-hidden="true" />
      )}
      {showLabel && <span className="text-xs font-semibold">{active ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
