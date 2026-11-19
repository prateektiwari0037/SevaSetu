import React from 'react';
import { Badge } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META } from '../../utils/customer';

export function BookingStatusBadge({ status }) {
  const { t } = useLanguage();
  const meta = BOOKING_STATUS_META[status] || { label: status || 'Unknown', tone: 'slate' };
  const label = meta.labelKey ? t(meta.labelKey) : meta.label;
  return <Badge tone={meta.tone}>{label === meta.labelKey ? meta.label : label}</Badge>;
}

export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status] || { label: status, tone: 'slate' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
