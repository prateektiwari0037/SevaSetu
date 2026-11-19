import React, { useState } from 'react';
import { Globe, Lock, LogOut, UserX } from 'lucide-react';
import { PageHeader, Card, Button, TextInput, Alert, ConfirmDialog } from '../../components/ui';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { profileApi } from '../../services/customerApi';

export const validatePasswordChange = ({ currentPassword, newPassword, confirmPassword }) => {
  const e = {};
  if (!currentPassword) e.currentPassword = 'Enter your current password';
  if (!newPassword || newPassword.length < 8) e.newPassword = 'New password must be at least 8 characters';
  else if (newPassword === currentPassword) e.newPassword = 'New password must be different from the current one';
  if (confirmPassword !== newPassword) e.confirmPassword = 'Passwords do not match';
  return e;
};

function Section({ icon: Icon, title, description, children }) {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icon className="w-4 h-4 text-primary-600" aria-hidden="true" /> {title}
        </h2>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function CustomerSettings() {
  const { t, lang, changeLanguage } = useLanguage();
  const { logout } = useAuth();
  const toast = useToast();

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwServerError, setPwServerError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  const [confirm, setConfirm] = useState(null); // 'logoutAll' | 'deactivate'
  const [busy, setBusy] = useState(false);

  const setPwField = (k) => (e) => {
    setPw((v) => ({ ...v, [k]: e.target.value }));
    if (pwErrors[k]) setPwErrors((x) => ({ ...x, [k]: undefined }));
  };

  const selectLanguage = (code) => {
    changeLanguage(code);
    // Best-effort: persist preference on the profile so notifications can use it.
    profileApi.update({ preferredLanguage: code }).catch(() => {});
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const found = validatePasswordChange(pw);
    setPwErrors(found);
    if (Object.keys(found).length) return;
    setPwSaving(true);
    setPwServerError('');
    try {
      await profileApi.changePassword(pw);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwDone(true);
      toast.success('Password changed. Please sign in again.');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setPwServerError(err.message || 'Could not change password');
    } finally {
      setPwSaving(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm === 'logoutAll') await api.post('/auth/logout-all');
      if (confirm === 'deactivate') await api.delete('/users/account');
      await logout();
    } catch (err) {
      toast.error(err.message || 'Action failed');
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title={t('settingsTitle')} description="Language, password and account security." />

      <Section icon={Globe} title="Language" description="Choose the language for navigation and labels.">
        <div className="flex gap-3" role="radiogroup" aria-label="Interface language">
          {[
            ['en', 'English'],
            ['hi', 'हिन्दी (Hindi)'],
          ].map(([code, label]) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={lang === code}
              onClick={() => selectLanguage(code)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                lang === code ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Lock} title={t('changePassword')} description="You'll be signed out of all devices after changing your password.">
        <form onSubmit={changePassword} noValidate className="space-y-3" aria-label={t('changePassword')}>
          {pwServerError && <Alert tone="error">{pwServerError}</Alert>}
          {pwDone && <Alert tone="success">Password changed successfully. Signing you out…</Alert>}
          <TextInput
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={setPwField('currentPassword')}
            error={pwErrors.currentPassword}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              value={pw.newPassword}
              onChange={setPwField('newPassword')}
              error={pwErrors.newPassword}
              hint="At least 8 characters"
            />
            <TextInput
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              value={pw.confirmPassword}
              onChange={setPwField('confirmPassword')}
              error={pwErrors.confirmPassword}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={pwSaving} disabled={pwDone}>
              {t('changePassword')}
            </Button>
          </div>
        </form>
      </Section>

      <Section icon={LogOut} title="Sessions" description="Sign out from every device where you're logged in.">
        <Button variant="secondary" icon={LogOut} onClick={() => setConfirm('logoutAll')}>
          Sign out of all devices
        </Button>
      </Section>

      <Section icon={UserX} title="Deactivate account" description="Your account will be disabled. Contact support to reactivate it.">
        <Button variant="danger-outline" icon={UserX} onClick={() => setConfirm('deactivate')}>
          Deactivate my account
        </Button>
      </Section>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === 'deactivate' ? 'Deactivate your account?' : 'Sign out of all devices?'}
        message={
          confirm === 'deactivate'
            ? 'You will be signed out and will not be able to sign in until support reactivates your account.'
            : 'You will need to sign in again on every device, including this one.'
        }
        confirmLabel={confirm === 'deactivate' ? 'Deactivate' : 'Sign out everywhere'}
        loading={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
