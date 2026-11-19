import React from 'react';
import { Heart } from 'lucide-react';
import { PageHeader, LoadingGrid, ErrorState, EmptyState, LinkButton, Alert } from '../../components/ui';
import ProviderCard from '../../components/customer/ProviderCard';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Favorites() {
  const { t } = useLanguage();
  const { items, loading, error, unsupported, reload } = useFavorites();

  return (
    <div className="space-y-5">
      <PageHeader title={t('favoritesTitle')} description="Providers you've saved for quick re-booking." />
      {loading ? (
        <LoadingGrid count={3} label="Loading favorites…" lines={4} />
      ) : unsupported ? (
        <Alert tone="warning" title="Favorites are not available yet">
          The favorites service is not enabled on the server. Saved providers will appear here once it is.
        </Alert>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} title="Could not load favorites" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('noFavorites')}
          description="Tap the heart on any provider to save them here."
          action={<LinkButton to="/customer/providers">{t('providersTitle')}</LinkButton>}
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(({ providerId, provider }) => (
            <li key={providerId}>
              <ProviderCard provider={{ id: providerId, ...provider }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
