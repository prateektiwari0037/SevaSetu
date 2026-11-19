import React, { useState } from 'react';
import { Alert, Button, RatingInput, TextArea } from '../ui';
import { reviewApi } from '../../services/customerApi';

export const isDuplicateReviewError = (err) => /already/i.test(err?.message || '') || err?.status === 409;

/** Rating + comment form for a completed booking. Calls onSubmitted(review) on success. */
export default function ReviewForm({ bookingId, onSubmitted, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!rating || rating < 1 || rating > 5) found.rating = 'Please select a rating from 1 to 5 stars';
    if (comment.trim().length > 0 && comment.trim().length < 10) found.comment = 'Review must be at least 10 characters';
    if (comment.length > 1000) found.comment = 'Review must be 1000 characters or fewer';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const review = await reviewApi.submit({ bookingId, rating, comment: comment.trim() });
      onSubmitted?.(review || { bookingId, rating, comment: comment.trim() });
    } catch (err) {
      setServerError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3" aria-label="Review form">
      {serverError && (
        <Alert tone={isDuplicateReviewError(serverError) ? 'warning' : 'error'} title={isDuplicateReviewError(serverError) ? 'Already reviewed' : 'Review not submitted'}>
          {serverError.message}
        </Alert>
      )}
      <RatingInput value={rating} onChange={(v) => { setRating(v); setErrors((x) => ({ ...x, rating: undefined })); }} error={errors.rating} name={`rating-${bookingId}`} />
      <TextArea
        label="Your review"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={errors.comment}
        hint="Share details about the quality, punctuality and behaviour (optional)"
        maxLength={1000}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          Submit review
        </Button>
      </div>
    </form>
  );
}
