import {
  Review,
  Booking,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const submitReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return errorResponse(res, 'Booking ID and rating (1-5) are required', 400);
    }

    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5 stars', 400);
    }

    const customer = await CustomerProfile.findOne({ userId: req.user.id });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const booking = await Booking.findById(bookingId);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (booking.customerId.toString() !== customer._id.toString()) {
      return errorResponse(res, 'You can only review your own bookings', 403);
    }

    if (booking.status !== 'COMPLETED') {
      return errorResponse(res, 'Reviews can only be submitted for completed services', 400);
    }

    const existingReview = await Review.findOne({ bookingId: booking._id });
    if (existingReview) {
      return errorResponse(res, 'You have already submitted a review for this booking', 400);
    }

    if (!booking.providerId) {
      return errorResponse(res, 'No provider assigned to this booking', 400);
    }

    const review = await Review.create({
      bookingId: booking._id,
      customerId: customer._id,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      rating: ratingNum,
      comment: comment || '',
    });

    // Recalculate provider rating
    const allReviews = await Review.find({ providerId: booking.providerId });
    const totalScore = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    const ratingAverage = Number((totalScore / allReviews.length).toFixed(1));
    const ratingCount = allReviews.length;

    const provider = await ProviderProfile.findByIdAndUpdate(
      booking.providerId,
      { ratingAverage, ratingCount },
      { new: true }
    );

    // Notify provider
    if (provider?.userId) {
      await Notification.create({
        userId: provider.userId,
        title: `⭐ New ${ratingNum}-Star Review Received!`,
        message: `A customer rated your service: "${comment || 'Great service!'}"`,
        type: 'REVIEW',
        data: { reviewId: review._id.toString() },
      });
    }

    return successResponse(res, 'Review submitted successfully', review, 201);
  } catch (error) {
    next(error);
  }
};

export const getProviderReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ providerId: id })
      .populate('customerId', 'fullName avatarUrl')
      .populate('bookingId', 'bookingNumber serviceId')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 'Provider reviews retrieved', reviews);
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer) return successResponse(res, 'Reviews', []);

      const reviews = await Review.find({ customerId: customer._id })
        .populate('providerId', 'fullName avatarUrl')
        .populate('bookingId', 'bookingNumber serviceId')
        .sort({ createdAt: -1 })
        .lean();

      return successResponse(res, 'My reviews', reviews);
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (!provider) return successResponse(res, 'Reviews', []);

      const reviews = await Review.find({ providerId: provider._id })
        .populate('customerId', 'fullName avatarUrl')
        .populate('bookingId', 'bookingNumber serviceId')
        .sort({ createdAt: -1 })
        .lean();

      return successResponse(res, 'My reviews', reviews);
    }

    return successResponse(res, 'Reviews', []);
  } catch (error) {
    next(error);
  }
};

export const replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { providerReply } = req.body;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const review = await Review.findById(id);
    if (!review) return errorResponse(res, 'Review not found', 404);

    if (review.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'You can only reply to reviews for your services', 403);
    }

    review.providerReply = providerReply;
    await review.save();

    return successResponse(res, 'Reply added to review', review);
  } catch (error) {
    next(error);
  }
};
