import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filter state stored in the URL query string so filtered views are shareable
 * and survive back/forward navigation. Booleans are stored as "1".
 */
export default function useUrlFilters(defaults) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const out = {};
    Object.entries(defaults).forEach(([key, def]) => {
      const raw = params.get(key);
      if (typeof def === 'boolean') out[key] = raw === null ? def : raw === '1';
      else if (typeof def === 'number') out[key] = raw === null || Number.isNaN(Number(raw)) ? def : Number(raw);
      else out[key] = raw ?? def;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = { ...values, ...patch };
      if (resetPage && 'page' in defaults && !('page' in patch)) next.page = defaults.page;
      const sp = new URLSearchParams();
      Object.entries(next).forEach(([key, v]) => {
        if (v === defaults[key] || v === '' || v === null || v === undefined || v === false) return;
        sp.set(key, typeof v === 'boolean' ? '1' : String(v));
      });
      setParams(sp, { replace: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, setParams]
  );

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  return [values, update, reset];
}
