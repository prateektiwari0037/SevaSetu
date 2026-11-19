import React, { useState } from 'react';
import { Button, TextInput, Select, Alert } from '../ui';
import { joinAddressLine, splitAddressLine, validateAddress } from '../../utils/customer';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

const toFormValues = (address) => {
  const { house, street } = splitAddressLine(address?.addressLine || address?.streetAddress || '');
  return {
    label: address?.label || 'Home',
    house,
    street,
    landmark: address?.landmark || '',
    area: address?.area || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    isDefault: Boolean(address?.isDefault),
  };
};

/** Maps form values to the backend Address payload. */
export const toAddressPayload = (v) => ({
  label: v.label,
  addressLine: joinAddressLine(v.house, v.street),
  landmark: v.landmark.trim(),
  area: v.area.trim(),
  city: v.city.trim(),
  state: v.state.trim(),
  pincode: v.pincode.trim(),
  isDefault: v.isDefault,
});

export default function AddressForm({ address, onSubmit, onCancel, submitLabel = 'Save address' }) {
  const [values, setValues] = useState(() => toFormValues(address));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateAddress(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setServerError('');
    try {
      await onSubmit(toAddressPayload(values));
    } catch (err) {
      setServerError(err.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label="Address form">
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <Select label="Label" value={values.label} onChange={set('label')}>
        <option value="Home">Home</option>
        <option value="Work">Work</option>
        <option value="Other">Other</option>
      </Select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput
          label="House / building"
          required
          value={values.house}
          onChange={set('house')}
          error={errors.house}
          placeholder="Flat 402, Sunshine Heights"
          autoComplete="address-line1"
        />
        <TextInput
          label="Street"
          required
          value={values.street}
          onChange={set('street')}
          error={errors.street}
          placeholder="MG Road"
          autoComplete="address-line2"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput label="Landmark" value={values.landmark} onChange={set('landmark')} placeholder="Near City Mall" />
        <TextInput
          label="Area"
          required
          value={values.area}
          onChange={set('area')}
          error={errors.area}
          placeholder="Andheri West"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextInput
          label="City"
          required
          value={values.city}
          onChange={set('city')}
          error={errors.city}
          autoComplete="address-level2"
        />
        <Select label="State" required value={values.state} onChange={set('state')} error={errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <TextInput
          label="PIN code"
          required
          value={values.pincode}
          onChange={(e) => set('pincode')({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
          error={errors.pincode}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="400001"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={set('isDefault')}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        Make this my default address
      </label>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
