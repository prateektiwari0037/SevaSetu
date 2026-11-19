import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { favoritesApi, isEndpointMissing } from '../services/customerApi';
import { getId } from '../utils/customer';

const FavoritesContext = createContext(null);

/** Favorites API items may be `{ providerId, provider }` or a bare provider object. */
export const normalizeFavorite = (item) => {
  const provider = item?.provider || item;
  const providerId = item?.providerId || getId(provider);
  return { providerId, provider };
};

export const FavoritesProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsupported, setUnsupported] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await favoritesApi.list();
      setItems(list.map(normalizeFavorite).filter((f) => f.providerId));
      setUnsupported(false);
    } catch (err) {
      if (isEndpointMissing(err)) setUnsupported(true);
      else setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ids = useMemo(() => new Set(items.map((f) => f.providerId)), [items]);

  const setPending = (id, on) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /** Optimistically toggles a provider; rolls back and rethrows on failure. */
  const toggle = useCallback(
    async (provider) => {
      const providerId = getId(provider);
      if (!providerId) return false;
      const wasFavorite = ids.has(providerId);
      const snapshot = items;
      setPending(providerId, true);
      setItems((prev) =>
        wasFavorite ? prev.filter((f) => f.providerId !== providerId) : [...prev, { providerId, provider }]
      );
      try {
        if (wasFavorite) await favoritesApi.remove(providerId);
        else await favoritesApi.add(providerId);
        return !wasFavorite;
      } catch (err) {
        setItems(snapshot);
        if (isEndpointMissing(err)) setUnsupported(true);
        throw err;
      } finally {
        setPending(providerId, false);
      }
    },
    [ids, items]
  );

  const value = {
    items,
    loading,
    error,
    unsupported,
    reload: load,
    isFavorite: (id) => ids.has(id),
    isPending: (id) => pendingIds.has(id),
    toggle,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

const fallback = {
  items: [],
  loading: false,
  error: null,
  unsupported: true,
  reload: () => {},
  isFavorite: () => false,
  isPending: () => false,
  toggle: async () => false,
  outsideProvider: true,
};

export const useFavorites = () => useContext(FavoritesContext) || fallback;
