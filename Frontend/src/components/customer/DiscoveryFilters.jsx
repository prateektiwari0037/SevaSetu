import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, Select, TextInput } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { getId } from '../../utils/customer';

/**
 * Search + filter panel shared by service and provider discovery.
 * Edits are kept in a local draft and applied on submit, so typing doesn't
 * trigger a request per keystroke. `fields` selects which filters render.
 */
export default function DiscoveryFilters({
  values,
  onApply,
  onReset,
  categories = [],
  fields = [],
  searchPlaceholder,
  categoryValueKey = 'id',
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(values);
  const [open, setOpen] = useState(false);
  const [priceError, setPriceError] = useState('');

  useEffect(() => setDraft(values), [values]);

  const has = (f) => fields.includes(f);
  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDraft((d) => ({ ...d, [key]: v }));
  };

  const submit = (e) => {
    e.preventDefault();
    const min = draft.minPrice === '' ? null : Number(draft.minPrice);
    const max = draft.maxPrice === '' ? null : Number(draft.maxPrice);
    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      setPriceError('Prices cannot be negative');
      return;
    }
    if (min !== null && max !== null && min > max) {
      setPriceError('Min price cannot be greater than max price');
      return;
    }
    if (has('pincode') && draft.pincode && !/^\d{6}$/.test(draft.pincode)) {
      setPriceError('PIN code must be 6 digits');
      return;
    }
    setPriceError('');
    onApply({ ...draft, search: (draft.search || '').trim() });
    setOpen(false);
  };

  const activeCount = fields.filter((f) => f !== 'search' && values[f] && values[f] !== '').length;

  return (
    <Card className="p-4">
      <form onSubmit={submit} role="search" aria-label="Filter results">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <label htmlFor="discovery-search" className="sr-only">
              {searchPlaceholder}
            </label>
            <input
              id="discovery-search"
              type="search"
              value={draft.search || ''}
              onChange={set('search')}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit">{t('searchAction')}</Button>
          <Button
            variant="secondary"
            className="lg:hidden"
            icon={SlidersHorizontal}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="discovery-filter-fields"
          >
            <span className="sr-only sm:not-sr-only">{t('filters')}</span>
            {activeCount > 0 && <span className="ml-0.5 text-[10px] bg-primary-100 text-primary-700 rounded px-1">{activeCount}</span>}
          </Button>
        </div>

        <div
          id="discovery-filter-fields"
          className={`${open ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3`}
        >
          {has('category') && (
            <Select label={t('allCategories')} value={draft.category || ''} onChange={set('category')}>
              <option value="">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={getId(c)} value={categoryValueKey === 'name' ? c.name : getId(c)}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          {has('city') && <TextInput label={t('filterCity')} value={draft.city || ''} onChange={set('city')} placeholder="Mumbai" />}
          {has('area') && <TextInput label={t('filterArea')} value={draft.area || ''} onChange={set('area')} placeholder="Andheri" />}
          {has('pincode') && (
            <TextInput
              label={t('filterPincode')}
              value={draft.pincode || ''}
              onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              inputMode="numeric"
              placeholder="400001"
            />
          )}
          {has('minPrice') && (
            <TextInput label={t('filterMinPrice')} type="number" min="0" value={draft.minPrice || ''} onChange={set('minPrice')} />
          )}
          {has('maxPrice') && (
            <TextInput label={t('filterMaxPrice')} type="number" min="0" value={draft.maxPrice || ''} onChange={set('maxPrice')} />
          )}
          {has('minRating') && (
            <Select label={t('filterMinRating')} value={draft.minRating || ''} onChange={set('minRating')}>
              <option value="">Any rating</option>
              <option value="4.5">4.5★ & above</option>
              <option value="4">4★ & above</option>
              <option value="3">3★ & above</option>
            </Select>
          )}
          {(has('verified') || has('available')) && (
            <div className="flex flex-col justify-end gap-2 text-sm text-slate-700 pb-1">
              {has('verified') && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.verified)}
                    onChange={set('verified')}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t('filterVerifiedOnly')}
                </label>
              )}
              {has('available') && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.available)}
                    onChange={set('available')}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t('filterAvailableOnly')}
                </label>
              )}
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-2">
            {priceError ? (
              <p role="alert" className="text-xs font-medium text-red-600">
                {priceError}
              </p>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={X} onClick={onReset}>
                {t('clearFilters')}
              </Button>
              <Button type="submit" size="sm" variant="secondary">
                {t('applyFilters')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
