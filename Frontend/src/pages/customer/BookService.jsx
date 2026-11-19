import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Search,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  LoadingGrid,
  LoadingList,
  Modal,
  PageHeader,
  RatingStars,
  Skeleton,
  TextArea,
  TextInput,
} from '../../components/ui';
import AddressForm from '../../components/customer/AddressForm';
import { ProviderAvatar } from '../../components/customer/ProviderCard';
import useAsync from '../../hooks/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { addressApi, bookingApi, catalogApi, providerApi } from '../../services/customerApi';
import {
  buildSlotsForDate,
  formatAddress,
  formatCurrency,
  formatDate,
  getId,
  providerName,
  providerRating,
  providerReviewCount,
  serviceDuration,
  toDateInputValue,
} from '../../utils/customer';

const MAX_ADVANCE_DAYS = 30;
const STEPS = ['stepProvider', 'stepAddress', 'stepSchedule', 'stepReview'];

/** Heuristic: does a backend error refer to the chosen time slot? */
export const isSlotError = (err) =>
  err?.status === 409 || /\bslot\b|already booked|time (is )?(no longer )?(un)?available/i.test(err?.message || '');

function Stepper({ current, t }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Booking steps">
      {STEPS.map((key, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={key} aria-current={state === 'current' ? 'step' : undefined} className="min-w-0">
            <div className={`h-1.5 rounded-full ${state === 'todo' ? 'bg-slate-200' : 'bg-primary-500'}`} />
            <p className={`mt-1.5 text-[11px] font-semibold truncate ${state === 'todo' ? 'text-slate-400' : 'text-slate-800'}`}>
              <span className="sr-only">Step {i + 1}: </span>
              {t(key)}
              {state === 'done' && <span className="sr-only"> (completed)</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Step 0 (only on /customer/book): pick a service, then continue on /customer/book/:serviceId. */
function ServicePicker() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const services = useAsync(() => catalogApi.services(), [], { initialData: [] });

  const legacyServiceId = searchParams.get('serviceId');
  useEffect(() => {
    if (legacyServiceId) {
      const pid = searchParams.get('providerId');
      navigate(`/customer/book/${legacyServiceId}${pid ? `?providerId=${pid}` : ''}`, { replace: true });
    }
  }, [legacyServiceId, navigate, searchParams]);

  const filtered = (services.data || []).filter((s) =>
    `${s.name} ${s.category?.name || ''}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t('bookAService')} description={t('selectService')} />
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <label htmlFor="service-picker-search" className="sr-only">
          {t('searchServices')}
        </label>
        <input
          id="service-picker-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchServices')}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      {services.loading ? (
        <LoadingGrid label="Loading services…" />
      ) : services.error ? (
        <ErrorState error={services.error} onRetry={services.reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title={t('noServicesFound')} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <li key={getId(s)}>
              <Link
                to={`/customer/book/${getId(s)}`}
                className="block h-full p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary-400 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Badge tone="primary">{s.category?.name || 'General'}</Badge>
                <p className="mt-2 text-sm font-bold text-slate-900">{s.name}</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{formatCurrency(s.basePrice)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectableCard({ selected, onSelect, name, value, children, disabled, label }) {
  return (
    <label
      className={`block p-4 rounded-2xl border-2 cursor-pointer transition focus-within:ring-2 focus-within:ring-primary-500 ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
          : selected
          ? 'border-primary-500 bg-primary-50/50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        className="sr-only"
        aria-label={label}
      />
      {children}
    </label>
  );
}

function BookingWizard({ serviceId }) {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetProviderId = searchParams.get('providerId') || '';

  const serviceReq = useAsync(() => catalogApi.service(serviceId), [serviceId]);
  const addressReq = useAsync(() => addressApi.list(), [], { initialData: [] });

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState(presetProviderId);
  const [addressId, setAddressId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [problem, setProblem] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState(() => new Set());
  const [confirmed, setConfirmed] = useState(null);
  const [addressModal, setAddressModal] = useState(false);

  const service = serviceReq.data;
  const providerOptions = useMemo(
    () => (service?.providerServices || []).filter((ps) => ps.provider),
    [service]
  );
  const selectedPS = providerOptions.find((ps) => getId(ps.provider) === providerId);
  const selectedProvider = selectedPS?.provider || null;
  const price = selectedPS?.customPrice ?? service?.basePrice ?? 0;
  const addresses = addressReq.data || [];
  const selectedAddress = addresses.find((a) => getId(a) === addressId);

  // Preselect default address once loaded.
  useEffect(() => {
    if (!addressId && addresses.length) {
      setAddressId(getId(addresses.find((a) => a.isDefault) || addresses[0]));
    }
  }, [addresses, addressId]);

  // Drop a preset provider that is not eligible for this service.
  useEffect(() => {
    if (service && providerId && !providerOptions.some((ps) => getId(ps.provider) === providerId)) {
      setProviderId('');
    }
  }, [service, providerOptions, providerId]);

  // Full provider profile (for weekly availability) + availability endpoint, if any.
  const providerProfile = useAsync(
    () => (providerId ? providerApi.get(providerId) : Promise.resolve(null)),
    [providerId]
  );
  const slotReq = useAsync(
    async () => {
      if (!date) return [];
      const remote = providerId ? await providerApi.availability(providerId, date) : null;
      if (remote) {
        return remote.map((s) => ({
          label: s.label || s.timeSlot || s.slot,
          available: s.available !== false && s.isAvailable !== false,
          reason: s.reason || (s.available === false ? 'Already booked' : ''),
        }));
      }
      return buildSlotsForDate(providerProfile.data, date);
    },
    [providerId, date, providerProfile.data]
  );
  const slots = (slotReq.data || []).map((s) =>
    unavailableSlots.has(`${date}|${s.label}`) ? { ...s, available: false, reason: 'Slot no longer available' } : s
  );

  const today = toDateInputValue();
  const maxDate = toDateInputValue(new Date(Date.now() + MAX_ADVANCE_DAYS * 86400000));

  const validateStep = (s) => {
    const e = {};
    if (s === 0 && providerOptions.length > 0 && !providerId) e.provider = 'Please select a provider';
    if (s === 1 && !selectedAddress) e.address = 'Please select or add a service address';
    if (s === 2) {
      if (!date) e.date = 'Please select a date';
      else if (date < today) e.date = 'Date cannot be in the past';
      else if (date > maxDate) e.date = `Bookings can be made up to ${MAX_ADVANCE_DAYS} days ahead`;
      if (!slot) e.slot = 'Please select a time slot';
      else if (slots.find((x) => x.label === slot)?.available === false) e.slot = 'This slot is not available. Choose another.';
      if (problem.trim().length < 10) e.problem = 'Please describe the problem (at least 10 characters)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) {
      setSubmitError(null);
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };
  const prev = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    for (const s of [0, 1, 2]) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await bookingApi.create({
        serviceId: getId(service),
        ...(providerId ? { providerId } : {}),
        bookingType: 'NORMAL',
        problemDescription: problem.trim(),
        bookingDate: date,
        timeSlot: slot,
        serviceAddress: formatAddress(selectedAddress),
        addressArea: selectedAddress.area,
        addressCity: selectedAddress.city,
        addressPincode: selectedAddress.pincode,
        totalAmount: price,
        paymentMethod: 'CASH',
      });
      setConfirmed(booking);
      toast.success(t('bookingConfirmed'));
    } catch (err) {
      if (isSlotError(err)) {
        setUnavailableSlots((prev) => new Set(prev).add(`${date}|${slot}`));
        setSlot('');
        setStep(2);
        setErrors({ slot: err.message || 'That slot is no longer available. Please choose another.' });
      } else {
        setSubmitError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addAddress = async (payload) => {
    const created = await addressApi.create(payload);
    await addressReq.reload();
    if (getId(created)) setAddressId(getId(created));
    setAddressModal(false);
    toast.success('Address saved');
  };

  if (serviceReq.loading) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading booking form…</span>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <LoadingList count={3} />
      </div>
    );
  }
  if (serviceReq.error) {
    return (
      <div className="space-y-4">
        <Link to="/customer/book" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('selectService')}
        </Link>
        <ErrorState
          error={serviceReq.error}
          onRetry={serviceReq.reload}
          title={serviceReq.error.status === 404 ? 'Service not found' : 'Could not load service'}
        />
      </div>
    );
  }

  if (confirmed) {
    const bid = getId(confirmed);
    return (
      <Card className="max-w-xl mx-auto p-6 sm:p-8 text-center space-y-4" role="status" aria-live="polite">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('bookingConfirmed')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Booking <span className="font-mono font-semibold text-slate-700">#{confirmed.bookingNumber || bid}</span> is{' '}
            {confirmed.status === 'PENDING' || !confirmed.status ? 'awaiting provider confirmation' : confirmed.status.toLowerCase()}.
          </p>
        </div>
        <dl className="text-sm text-left bg-slate-50 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Service</dt>
            <dd className="font-semibold text-slate-800 text-right">{service.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">When</dt>
            <dd className="font-semibold text-slate-800 text-right">
              {formatDate(confirmed.bookingDate || date)} · {confirmed.timeSlot || slot}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t('totalPrice')}</dt>
            <dd className="font-semibold text-slate-800">{formatCurrency(confirmed.totalAmount ?? price)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t('paymentMethod')}</dt>
            <dd className="font-semibold text-slate-800">{t('cashOnService')}</dd>
          </div>
        </dl>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {bid && (
            <Button onClick={() => navigate(`/customer/bookings/${bid}`)} icon={ArrowRight}>
              {t('viewBooking')}
            </Button>
          )}
          <LinkButton to="/customer/bookings" variant="secondary">
            {t('bookingsTitle')}
          </LinkButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        backLink={
          <Link to={`/customer/services/${serviceId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {service.name}
          </Link>
        }
        title={`${t('bookAService')}: ${service.name}`}
        description={`${service.category?.name || ''}${serviceDuration(service) ? ` · ~${serviceDuration(service)} min` : ''}`}
      />
      <Stepper current={step} t={t} />

      <Card className="p-5 sm:p-6">
        {step === 0 && (
          <fieldset>
            <legend className="text-base font-bold text-slate-900 mb-3">{t('selectProvider')}</legend>
            {providerOptions.length === 0 ? (
              <Alert tone="info" title="No provider is listed for this service right now">
                Your request will be sent to verified providers, and the first one available will accept it. You'll be notified.
              </Alert>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-invalid={errors.provider ? true : undefined}>
                {providerOptions.map((ps) => {
                  const p = ps.provider;
                  const pid = getId(p);
                  const pPrice = ps.customPrice ?? service.basePrice;
                  return (
                    <SelectableCard
                      key={pid}
                      name="provider"
                      value={pid}
                      selected={providerId === pid}
                      onSelect={() => {
                        setProviderId(pid);
                        setSlot('');
                        setErrors((e) => ({ ...e, provider: undefined }));
                      }}
                      label={`${providerName(p)}, ${formatCurrency(pPrice)}`}
                    >
                      <div className="flex gap-3">
                        <ProviderAvatar provider={p} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{providerName(p)}</p>
                          <RatingStars value={providerRating(p)} count={providerReviewCount(p)} />
                          <div className="flex items-center gap-2 mt-1">
                            {p.verificationStatus === 'APPROVED' && (
                              <Badge tone="green" icon={BadgeCheck}>
                                {t('verified')}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500">
                              {p.experienceYears ?? 0} {t('years')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">{formatCurrency(pPrice)}</p>
                      </div>
                    </SelectableCard>
                  );
                })}
              </div>
            )}
            {errors.provider && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                {errors.provider}
              </p>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="text-base font-bold text-slate-900 mb-3">{t('selectAddress')}</legend>
            {addressReq.loading ? (
              <LoadingList count={2} label="Loading addresses…" />
            ) : addressReq.error ? (
              <ErrorState error={addressReq.error} onRetry={addressReq.reload} title="Could not load your addresses" />
            ) : addresses.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No saved addresses"
                description="Add the address where the service is needed."
                action={
                  <Button icon={Plus} onClick={() => setAddressModal(true)}>
                    {t('addNewAddress')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3" role="radiogroup" aria-invalid={errors.address ? true : undefined}>
                {addresses.map((a) => (
                  <SelectableCard
                    key={getId(a)}
                    name="address"
                    value={getId(a)}
                    selected={addressId === getId(a)}
                    onSelect={() => {
                      setAddressId(getId(a));
                      setErrors((e) => ({ ...e, address: undefined }));
                    }}
                    label={`${a.label || 'Address'}: ${formatAddress(a)}`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {a.label || 'Address'} {a.isDefault && <Badge tone="primary">{t('defaultLabel')}</Badge>}
                        </p>
                        <p className="text-xs text-slate-600">{formatAddress(a)}</p>
                      </div>
                    </div>
                  </SelectableCard>
                ))}
                <Button variant="secondary" icon={Plus} onClick={() => setAddressModal(true)}>
                  {t('addNewAddress')}
                </Button>
              </div>
            )}
            {errors.address && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                {errors.address}
              </p>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <TextInput
              label={t('selectDate')}
              type="date"
              required
              min={today}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot('');
                setErrors((x) => ({ ...x, date: undefined, slot: undefined }));
              }}
              error={errors.date}
              className="max-w-xs"
            />
            <fieldset>
              <legend className="block text-xs font-semibold text-slate-700 mb-2">
                {t('selectSlot')}
                <span className="text-red-600 ml-0.5" aria-hidden="true">
                  *
                </span>
              </legend>
              {!date ? (
                <p className="text-xs text-slate-500">Pick a date to see available time slots.</p>
              ) : slotReq.loading || providerProfile.loading ? (
                <div role="status" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <span className="sr-only">Loading time slots…</span>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-11" />
                  ))}
                </div>
              ) : slotReq.error ? (
                <ErrorState error={slotReq.error} onRetry={slotReq.reload} title="Could not load time slots" />
              ) : slots.every((s) => !s.available) ? (
                <Alert tone="warning" title="No slots available on this date">
                  Please choose another date.
                </Alert>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-invalid={errors.slot ? true : undefined}>
                  {slots.map((s) => (
                    <label
                      key={s.label}
                      title={s.available ? undefined : s.reason}
                      className={`flex flex-col items-center justify-center text-center px-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition focus-within:ring-2 focus-within:ring-primary-500 ${
                        !s.available
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                          : slot === s.label
                          ? 'border-primary-500 bg-primary-50 text-primary-800 cursor-pointer'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={s.label}
                        checked={slot === s.label}
                        disabled={!s.available}
                        onChange={() => {
                          setSlot(s.label);
                          setErrors((x) => ({ ...x, slot: undefined }));
                        }}
                        className="sr-only"
                        aria-label={`${s.label}${s.available ? '' : ` – unavailable: ${s.reason}`}`}
                      />
                      <Clock className="w-3.5 h-3.5 mb-0.5" aria-hidden="true" />
                      {s.label}
                    </label>
                  ))}
                </div>
              )}
              {errors.slot && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                  {errors.slot}
                </p>
              )}
            </fieldset>
            <TextArea
              label={t('describeProblem')}
              required
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                if (errors.problem) setErrors((x) => ({ ...x, problem: undefined }));
              }}
              error={errors.problem}
              hint="e.g. Ceiling fan making noise at high speed"
              maxLength={1000}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">{t('reviewBooking')}</h2>
            {submitError && (
              <Alert tone="error" title="Booking could not be placed">
                {submitError.message}
                {Array.isArray(submitError.errors) && (
                  <ul className="list-disc list-inside mt-1">
                    {submitError.errors.map((e, i) => (
                      <li key={i}>{typeof e === 'string' ? e : e.message || e.msg}</li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}
            <dl className="divide-y divide-slate-100 text-sm">
              {[
                ['Service', service.name, null],
                ['Provider', selectedProvider ? providerName(selectedProvider) : 'Any available verified provider', 0],
                [t('serviceAddress'), formatAddress(selectedAddress), 1],
                ['Date & time', `${formatDate(date)} · ${slot}`, 2],
                ['Problem', problem.trim(), 2],
              ].map(([label, value, editStep]) => (
                <div key={label} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                  <dt className="sm:w-36 shrink-0 text-slate-500">{label}</dt>
                  <dd className="flex-1 font-medium text-slate-800 break-words">{value}</dd>
                  {editStep !== null && (
                    <button
                      type="button"
                      onClick={() => setStep(editStep)}
                      className="text-xs font-semibold text-primary-700 hover:underline self-start"
                      aria-label={`Edit ${label}`}
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </dl>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t('fixedPrice')}</span>
                <span className="text-xl font-extrabold text-slate-900">{formatCurrency(price)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Wallet className="w-4 h-4 text-slate-400" aria-hidden="true" />
                {t('paymentMethod')}: <span className="font-semibold">{t('cashOnService')}</span> — pay the provider after the job is done.
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" icon={ArrowLeft} onClick={prev} disabled={step === 0 || submitting}>
          {t('back')}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            {t('continue')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} icon={CalendarDays}>
            {t('confirmBooking')}
          </Button>
        )}
      </div>

      <Modal open={addressModal} onClose={() => setAddressModal(false)} title={t('addNewAddress')} size="lg">
        <AddressForm onSubmit={addAddress} onCancel={() => setAddressModal(false)} />
      </Modal>
    </div>
  );
}

export default function BookService() {
  const { serviceId } = useParams();
  return serviceId ? <BookingWizard key={serviceId} serviceId={serviceId} /> : <ServicePicker />;
}
