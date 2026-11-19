import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LifeBuoy, MessageSquare, Plus, Send, ShieldCheck } from 'lucide-react';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Alert,
  LoadingList,
  ErrorState,
  EmptyState,
  Modal,
  Select,
  TextArea,
  TextInput,
  Skeleton,
} from '../../components/ui';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi, complaintApi } from '../../services/customerApi';
import { formatDate, formatDateTime, getId } from '../../utils/customer';

export const COMPLAINT_CATEGORIES = [
  ['SERVICE_QUALITY', 'Poor service quality'],
  ['PROVIDER_BEHAVIOUR', 'Provider behaviour'],
  ['NO_SHOW', 'Provider did not arrive'],
  ['PRICING', 'Pricing / overcharging'],
  ['DAMAGE', 'Property damage'],
  ['OTHER', 'Other'],
];

const STATUS_TONE = { OPEN: 'amber', UNDER_REVIEW: 'blue', RESOLVED: 'green', REJECTED: 'red', CLOSED: 'slate' };
const statusLabel = (s) => (s || 'OPEN').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const subjectOf = (c) => c.subject || c.title || 'Complaint';

export const validateComplaint = (v) => {
  const e = {};
  if (!v.category) e.category = 'Select a category';
  if (!v.subject.trim() || v.subject.trim().length < 5) e.subject = 'Subject must be at least 5 characters';
  if (v.description.trim().length < 20) e.description = 'Describe the issue in at least 20 characters';
  return e;
};

function NewComplaintForm({ bookings, presetBookingId, onCreated, onCancel }) {
  const [values, setValues] = useState({
    category: '',
    subject: '',
    description: '',
    bookingId: presetBookingId || '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateComplaint(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setServerError('');
    try {
      const created = await complaintApi.create({
        category: values.category,
        subject: values.subject.trim(),
        description: values.description.trim(),
        bookingId: values.bookingId || undefined,
      });
      onCreated(created);
    } catch (err) {
      setServerError(err.message || 'Could not submit complaint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3" aria-label="New complaint">
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <Select label="Related booking" value={values.bookingId} onChange={set('bookingId')} hint="Optional — link the complaint to a booking">
        <option value="">Not related to a booking</option>
        {bookings.map((b) => (
          <option key={getId(b)} value={getId(b)}>
            #{b.bookingNumber} · {b.service?.name} · {formatDate(b.bookingDate)}
          </option>
        ))}
      </Select>
      <Select label="Category" required value={values.category} onChange={set('category')} error={errors.category}>
        <option value="">Select a category</option>
        {COMPLAINT_CATEGORIES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
      <TextInput label="Subject" required value={values.subject} onChange={set('subject')} error={errors.subject} maxLength={120} />
      <TextArea
        label="Description"
        required
        value={values.description}
        onChange={set('description')}
        error={errors.description}
        maxLength={2000}
        hint="What happened, when, and what outcome you expect."
      />
      <p className="text-[11px] text-slate-500">
        Image attachments are not supported yet — please describe the issue in detail. Our team may contact you for photos.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} icon={Send}>
          Submit complaint
        </Button>
      </div>
    </form>
  );
}

function ComplaintThread({ complaintId, currentUserId, onClose }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => complaintApi.get(complaintId), [complaintId]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await complaintApi.reply(complaintId, reply.trim());
      setReply('');
      await reload();
    } catch (err) {
      toast.error(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const closed = ['RESOLVED', 'CLOSED', 'REJECTED'].includes(data.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge tone={STATUS_TONE[data.status] || 'slate'}>{statusLabel(data.status)}</Badge>
        <span className="font-mono">#{data.ticketNumber}</span>
        {data.booking && <span>· Booking #{data.booking.bookingNumber}</span>}
      </div>
      {data.adminNotes && (
        <Alert tone="info" title="Admin response">
          {data.adminNotes}
        </Alert>
      )}
      <ol className="space-y-2 max-h-80 overflow-y-auto" aria-label="Messages">
        {(data.messages || []).map((m, i) => {
          const mine = m.senderUserId === currentUserId;
          const admin = m.senderRole === 'ADMIN';
          return (
            <li key={getId(m) || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-primary-600 text-white' : admin ? 'bg-sky-50 border border-sky-200 text-slate-800' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {admin && (
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-sky-700 mb-0.5">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" /> SevaSetu support
                  </p>
                )}
                <p className="whitespace-pre-line">{m.message}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? 'text-primary-100' : 'text-slate-400'}`}>
                  {formatDateTime(m.createdAt || m.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {closed ? (
        <p className="text-xs text-slate-500">This complaint is {statusLabel(data.status).toLowerCase()}. Open a new complaint if you need more help.</p>
      ) : (
        <form onSubmit={send} className="flex gap-2">
          <label htmlFor="complaint-reply" className="sr-only">
            Reply
          </label>
          <input
            id="complaint-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add a message…"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit" icon={Send} loading={sending} disabled={!reply.trim()} aria-label="Send message" />
        </form>
      )}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default function CustomerComplaints() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const presetBookingId = searchParams.get('bookingId') || '';

  const complaints = useAsync(() => complaintApi.list(), [], { initialData: [] });
  const bookings = useAsync(() => bookingApi.mine().catch(() => []), [], { initialData: [] });
  const [creating, setCreating] = useState(Boolean(presetBookingId));
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    if (presetBookingId) setCreating(true);
  }, [presetBookingId]);

  const closeCreate = () => {
    setCreating(false);
    if (presetBookingId) setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('complaintsTitle')}
        description="Report a problem with a booking and track our response."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            {t('newComplaint')}
          </Button>
        }
      />

      {complaints.loading ? (
        <LoadingList label="Loading complaints…" />
      ) : complaints.error ? (
        <ErrorState error={complaints.error} onRetry={complaints.reload} title="Could not load complaints" />
      ) : complaints.data.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No complaints raised"
          description="If something went wrong with a service, let us know and we'll help."
          action={
            <Button icon={Plus} onClick={() => setCreating(true)}>
              {t('newComplaint')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {complaints.data.map((c) => (
            <li key={getId(c)}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{subjectOf(c)}</p>
                    <Badge tone={STATUS_TONE[c.status] || 'slate'}>{statusLabel(c.status)}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">#{c.ticketNumber}</span> · {formatDate(c.createdAt)}
                    {c.booking?.service?.name && ` · ${c.booking.service.name}`}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                </div>
                <Button size="sm" variant="secondary" icon={MessageSquare} onClick={() => setViewingId(getId(c))}>
                  View{c._count?.messages ? ` (${c._count.messages})` : ''}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={closeCreate} title={t('newComplaint')} size="lg">
        {creating && (
          <NewComplaintForm
            bookings={bookings.data || []}
            presetBookingId={presetBookingId}
            onCancel={closeCreate}
            onCreated={(c) => {
              toast.success(`Complaint ${c?.ticketNumber ? `#${c.ticketNumber} ` : ''}submitted`);
              closeCreate();
              complaints.reload();
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(viewingId)} onClose={() => setViewingId(null)} title="Complaint details" size="lg">
        {viewingId && <ComplaintThread complaintId={viewingId} currentUserId={getId(user)} onClose={() => setViewingId(null)} />}
      </Modal>
    </div>
  );
}
