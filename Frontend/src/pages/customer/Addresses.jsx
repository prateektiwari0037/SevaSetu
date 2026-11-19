import React, { useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { PageHeader, Card, Badge, Button, LoadingList, ErrorState, EmptyState, Modal, ConfirmDialog } from '../../components/ui';
import AddressForm from '../../components/customer/AddressForm';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { addressApi } from '../../services/customerApi';
import { formatAddress, getId } from '../../utils/customer';

export default function Addresses() {
  const { t } = useLanguage();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => addressApi.list(), [], { initialData: [] });
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [defaultingId, setDefaultingId] = useState(null);

  const addresses = data || [];

  const save = async (payload) => {
    if (editing === 'new') {
      await addressApi.create(payload);
      toast.success('Address added');
    } else {
      await addressApi.update(getId(editing), payload);
      toast.success('Address updated');
    }
    setEditing(null);
    await reload();
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await addressApi.remove(getId(deleting));
      toast.success('Address deleted');
      setDeleting(null);
      await reload();
    } catch (err) {
      toast.error(err.message || 'Could not delete address');
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (a) => {
    setDefaultingId(getId(a));
    try {
      await addressApi.setDefault(getId(a));
      toast.success(`${a.label || 'Address'} is now your default address`);
      await reload();
    } catch (err) {
      toast.error(err.message || 'Could not set default address');
    } finally {
      setDefaultingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('addressesTitle')}
        description="Addresses you can pick from when booking a service."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            {t('addNewAddress')}
          </Button>
        }
      />

      {loading ? (
        <LoadingList count={3} label="Loading addresses…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} title="Could not load addresses" />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Save your home or work address to book faster."
          action={
            <Button icon={Plus} onClick={() => setEditing('new')}>
              {t('addNewAddress')}
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <li key={getId(a)}>
              <Card className={`p-4 h-full flex flex-col ${a.isDefault ? 'border-primary-300' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    {a.label || 'Address'}
                  </p>
                  {a.isDefault && <Badge tone="primary">{t('defaultLabel')}</Badge>}
                </div>
                <p className="text-sm text-slate-600 mt-2 flex-1">{formatAddress(a)}</p>
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(a)} aria-label={`Edit ${a.label || 'address'}`}>
                    {t('edit')}
                  </Button>
                  {!a.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Star}
                      loading={defaultingId === getId(a)}
                      onClick={() => makeDefault(a)}
                      aria-label={`Set ${a.label || 'address'} as default`}
                    >
                      {t('setAsDefault')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger-outline"
                    icon={Trash2}
                    onClick={() => setDeleting(a)}
                    aria-label={`Delete ${a.label || 'address'}`}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('addNewAddress') : 'Edit address'}
        size="lg"
      >
        {editing && (
          <AddressForm
            key={editing === 'new' ? 'new' : getId(editing)}
            address={editing === 'new' ? null : editing}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete address?"
        message={deleting ? `"${deleting.label || 'Address'}" — ${formatAddress(deleting)} will be removed.` : ''}
        confirmLabel={t('delete')}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
