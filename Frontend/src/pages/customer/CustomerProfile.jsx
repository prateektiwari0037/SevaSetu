import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MapPin, Save, Trash2 } from 'lucide-react';
import { PageHeader, Card, Button, TextInput, TextArea, Alert, Skeleton, ErrorState } from '../../components/ui';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { profileApi } from '../../services/customerApi';
import { customerName } from '../../utils/customer';

const PHONE_RE = /^(\+91[-\s]?)?[6-9]\d{9}$/;

export const validateProfile = (v) => {
  const e = {};
  if (!v.fullName.trim() || v.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  if (!PHONE_RE.test(v.mobile.replace(/\s/g, ''))) e.mobile = 'Enter a valid 10-digit Indian mobile number';
  if (v.alternatePhone && !PHONE_RE.test(v.alternatePhone.replace(/\s/g, ''))) e.alternatePhone = 'Enter a valid mobile number';
  if (v.emergencyContact && !PHONE_RE.test(v.emergencyContact.replace(/\s/g, ''))) e.emergencyContact = 'Enter a valid mobile number';
  if (v.avatarUrl && !/^https?:\/\/\S+$/i.test(v.avatarUrl.trim())) e.avatarUrl = 'Enter an image URL starting with http:// or https://';
  if (v.bio.length > 500) e.bio = 'Keep this under 500 characters';
  return e;
};

const fromUser = (u) => ({
  fullName: u?.customerProfile?.fullName || u?.fullName || '',
  mobile: u?.mobile || u?.phone || '',
  alternatePhone: u?.customerProfile?.alternatePhone || '',
  emergencyContact: u?.customerProfile?.emergencyContact || '',
  avatarUrl: u?.avatarUrl || u?.customerProfile?.avatarUrl || '',
  bio: u?.customerProfile?.bio || '',
});

export default function CustomerProfile() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, updateUser } = useAuth();
  const profile = useAsync(() => profileApi.get(), []);
  const [values, setValues] = useState(() => fromUser(user));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    if (profile.data) setValues(fromUser(profile.data));
  }, [profile.data]);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (k === 'avatarUrl') setAvatarBroken(false);
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setServerError('');
    try {
      const updated = await profileApi.update({
        fullName: values.fullName.trim(),
        mobile: values.mobile.trim(),
        alternatePhone: values.alternatePhone.trim(),
        emergencyContact: values.emergencyContact.trim(),
        avatarUrl: values.avatarUrl.trim(),
        bio: values.bio,
      });
      if (updated) updateUser({ ...user, ...updated });
      toast.success('Profile updated');
    } catch (err) {
      setServerError(err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const source = profile.data || user;
  const initial = customerName(source).charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title={t('profileTitle')} description="Your personal details used for bookings and notifications." />

      {profile.loading && !user ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : profile.error && !user ? (
        <ErrorState error={profile.error} onRetry={profile.reload} />
      ) : (
        <Card className="p-5 sm:p-6">
          <form onSubmit={save} noValidate className="space-y-5" aria-label="Edit profile">
            {serverError && <Alert tone="error">{serverError}</Alert>}

            <fieldset className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <legend className="sr-only">Profile photo</legend>
              {values.avatarUrl && !avatarBroken ? (
                <img
                  src={values.avatarUrl}
                  alt="Profile avatar preview"
                  onError={() => setAvatarBroken(true)}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 text-2xl font-bold flex items-center justify-center" aria-hidden="true">
                  {initial}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <TextInput
                  label="Avatar image URL"
                  type="url"
                  value={values.avatarUrl}
                  onChange={set('avatarUrl')}
                  error={errors.avatarUrl || (avatarBroken ? 'Image could not be loaded from this URL' : undefined)}
                  hint="Paste a link to a square image. Direct photo upload isn't available yet."
                  placeholder="https://…"
                />
                {values.avatarUrl && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setValues((v) => ({ ...v, avatarUrl: '' }))}>
                    Remove photo
                  </Button>
                )}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput label="Full name" required value={values.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
              <TextInput label="Email" value={source?.email || ''} disabled hint="Email can't be changed here." />
              <TextInput
                label="Mobile number"
                required
                type="tel"
                value={values.mobile}
                onChange={set('mobile')}
                error={errors.mobile}
                autoComplete="tel"
              />
              <TextInput label="Alternate phone" type="tel" value={values.alternatePhone} onChange={set('alternatePhone')} error={errors.alternatePhone} />
              <TextInput
                label="Emergency contact"
                type="tel"
                value={values.emergencyContact}
                onChange={set('emergencyContact')}
                error={errors.emergencyContact}
                className="sm:col-span-2"
              />
            </div>
            <TextArea label="About me / notes for providers" value={values.bio} onChange={set('bio')} error={errors.bio} rows={3} maxLength={500} />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <Link to="/customer/addresses" className="inline-flex items-center gap-1 text-primary-700 hover:underline">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Manage addresses
                </Link>
                <Link to="/customer/settings" className="inline-flex items-center gap-1 text-primary-700 hover:underline">
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" /> {t('changePassword')}
                </Link>
              </div>
              <Button type="submit" icon={Save} loading={saving}>
                {t('save')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
