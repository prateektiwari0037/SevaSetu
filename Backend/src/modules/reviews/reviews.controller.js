import prisma from '../../config/db.js';
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

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, provider: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.customerId !== customer.id) {
      return errorResponse(res, 'You can only review your own bookings', 403);
    }
    if (booking.status !== 'COMPLETED') {
      return errorResponse(res, 'Reviews can only be submitted for completed services', 400);
    }
    if (booking.review) {
      return errorResponse(res, 'You have already submitted a review for this booking', 400);
    }
    if (!booking.providerId) {
      return errorResponse(res, 'No provider assigned to this booking', 400);
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          customerId: customer.id,
          providerId: booking.providerId,
          rating: ratingNum,
          comment,
        },
      });

      // Recalculate provider rating
      const allReviews = await tx.review.findMany({
        where: { providerId: booking.providerId },
        select: { rating: true },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const ratingAverage = Math.round((totalRating / allReviews.length) * 10) / 10;
      const ratingCount = allReviews.length;

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          ratingAverage,
          ratingCount,
        },
      });

      // Notify provider
      if (booking.provider) {
        await tx.notification.create({
          data: {
            userId: booking.provider.userId,
            title: `⭐ New ${ratingNum}-Star Review Received!`,
            message: `A customer rated your service: "${comment || 'Great service!'}"`,
            type: 'REVIEW',
            link: '/provider/reviews',
          },
        });
      }

      return newReview;
    });

    return successResponse(res, 'Review submitted successfully', review, 201);
  } catch (error) {
    next(error);
  }
};

export const getProviderReviews = async (req, res, next) => {
  try {
    const { id } = req.params; // providerId
    const reviews = await prisma.review.findMany({
      where: { providerId: id },
      include: {
        customer: { select: { fullName: true, avatarUrl: true } },
        booking: { include: { service: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Provider reviews retrieved', reviews);
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req, res, next) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!customer) return successResponse(res, 'Reviews', []);

      const reviews = await prisma.review.findMany({
        where: { customerId: customer.id },
        include: {
          provider: true,
          booking: { include: { service: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return successResponse(res, 'My reviews', reviews);
    } else if (req.user.role === 'PROVIDER') {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!provider) return successResponse(res, 'Reviews', []);

      const reviews = await prisma.review.findMany({
        where: { providerId: provider.id },
        include: {
          customer: true,
          booking: { include: { service: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
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

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return errorResponse(res, 'Review not found', 404);
    if (review.providerId !== provider.id) {
      return errorResponse(res, 'You can only reply to reviews for your services', 403);
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { providerReply },
    });

    return successResponse(res, 'Reply added to review', updated);
  } catch (error) {
    next(error);
  }
};
