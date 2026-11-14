import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const createBooking = async (req, res, next) => {
  try {
    const {
      serviceId,
      providerId,
      problemDescription,
      bookingDate,
      timeSlot,
      serviceAddress,
      addressPincode,
      latitude,
      longitude,
      bookingType = 'NORMAL', // NORMAL, EMERGENCY, SUBSCRIPTION
      totalAmount,
      paymentMethod = 'CASH',
      attachments = [],
    } = req.body;

    if (!serviceId || !problemDescription || !bookingDate || !timeSlot || !serviceAddress) {
      return errorResponse(
        res,
        'Service, problem description, date, time slot, and address are required',
        400
      );
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return errorResponse(res, 'Customer profile required to make a booking', 400);
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return errorResponse(res, 'Selected service does not exist', 404);
    }

    // If provider is specified, verify they exist and are approved
    let verifiedProviderId = null;
    if (providerId) {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
      });
      if (!provider || provider.verificationStatus !== 'APPROVED') {
        return errorResponse(res, 'Selected provider is not verified or unavailable', 400);
      }
      verifiedProviderId = provider.id;
    }

    const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const finalAmount = totalAmount ? parseFloat(totalAmount) : service.basePrice;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          providerId: verifiedProviderId,
          serviceId: service.id,
          bookingType,
          status: 'PENDING',
          problemDescription,
          bookingDate: new Date(bookingDate),
          timeSlot,
          serviceAddress,
          addressPincode: addressPincode || '400001',
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          totalAmount: finalAmount,
          paymentMethod,
        },
      });

      // Status history entry
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: newBooking.id,
          status: 'PENDING',
          comment: 'Booking request created by customer',
          changedByUserId: req.user.id,
        },
      });

      // Save attachments if any
      if (Array.isArray(attachments) && attachments.length > 0) {
        await tx.bookingAttachment.createMany({
          data: attachments.map((url) => ({
            bookingId: newBooking.id,
            fileUrl: url,
            fileType: 'image',
          })),
        });
      }

      // Customer notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: 'Booking Request Submitted',
          message: `Your booking #${bookingNumber} for ${service.name} has been placed.`,
          type: 'BOOKING',
          link: `/customer/bookings/${newBooking.id}`,
        },
      });

      // Provider notification if assigned
      if (verifiedProviderId) {
        const assignedProvider = await tx.providerProfile.findUnique({
          where: { id: verifiedProviderId },
        });
        if (assignedProvider) {
          await tx.notification.create({
            data: {
              userId: assignedProvider.userId,
              title: 'New Booking Request Received',
              message: `You have received a new ${bookingType} booking #${bookingNumber} for ${service.name}.`,
              type: 'BOOKING',
              link: `/provider/bookings/${newBooking.id}`,
            },
          });
        }
      }

      return newBooking;
    });

    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        service: true,
        provider: true,
        customer: true,
        attachments: true,
        statusHistory: true,
      },
    });

    return successResponse(res, 'Booking created successfully', fullBooking, 201);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, bookingType, startDate, endDate } = req.query;

    let where = {
      ...(status && { status }),
      ...(bookingType && { bookingType }),
      ...(startDate || endDate
        ? {
            bookingDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!customer) return successResponse(res, 'Bookings retrieved', []);
      where.customerId = customer.id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!provider) return successResponse(res, 'Bookings retrieved', []);
      where.providerId = provider.id;
    }
    // Admin sees all without additional role constraint

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: { include: { category: true } },
        provider: true,
        customer: true,
        payments: true,
        review: true,
        warranty: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }],
      },
      include: {
        service: { include: { category: true } },
        provider: {
          include: {
            user: { select: { id: true, phone: true, email: true } },
          },
        },
        customer: {
          include: {
            user: { select: { id: true, phone: true, email: true } },
          },
        },
        attachments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payments: true,
        review: true,
        warranty: true,
        revisitRequests: true,
        complaints: true,
      },
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Role-based authorization check
    if (req.user.role === 'CUSTOMER' && booking.customer.userId !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }
    if (
      req.user.role === 'PROVIDER' &&
      booking.provider &&
      booking.provider.userId !== req.user.id
    ) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, 'Booking details retrieved', booking);
  } catch (error) {
    next(error);
  }
};

export const acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, service: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.status !== 'PENDING') {
      return errorResponse(res, `Booking is in ${booking.status} status and cannot be accepted`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          providerId: provider.id,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'ACCEPTED',
          comment: `Booking accepted by provider ${provider.fullName}`,
          changedByUserId: req.user.id,
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: booking.customer.userId,
          title: 'Booking Accepted',
          message: `${provider.fullName} has accepted your booking #${booking.bookingNumber}.`,
          type: 'BOOKING',
          link: `/customer/bookings/${id}`,
        },
      });

      return b;
    });

    return successResponse(res, 'Booking accepted successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Provider is unavailable at the requested time' } = req.body;

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.status !== 'PENDING') {
      return errorResponse(res, `Booking is not pending`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'REJECTED',
          comment: `Rejected by provider: ${reason}`,
          changedByUserId: req.user.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.customer.userId,
          title: 'Booking Request Declined',
          message: `Your booking #${booking.bookingNumber} was declined by the provider. Reason: ${reason}`,
          type: 'BOOKING',
          link: `/customer/bookings/${id}`,
        },
      });

      return b;
    });

    return successResponse(res, 'Booking rejected', updated);
  } catch (error) {
    next(error);
  }
};

export const startBookingWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { provider: true, customer: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (req.user.role === 'PROVIDER' && booking.provider?.userId !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }
    if (booking.status !== 'ACCEPTED') {
      return errorResponse(res, 'Work can only be started on accepted bookings', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'IN_PROGRESS',
          comment: 'Provider has started service work',
          changedByUserId: req.user.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.customer.userId,
          title: 'Service Work Started',
          message: `The provider has arrived and commenced work on booking #${booking.bookingNumber}.`,
          type: 'BOOKING',
          link: `/customer/bookings/${id}`,
        },
      });

      return b;
    });

    return successResponse(res, 'Work marked as in progress', updated);
  } catch (error) {
    next(error);
  }
};

export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalAmount } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { provider: true, customer: true, service: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (req.user.role === 'PROVIDER' && booking.provider?.userId !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }
    if (booking.status !== 'IN_PROGRESS' && booking.status !== 'ACCEPTED') {
      return errorResponse(res, 'Booking cannot be completed from current status', 400);
    }

    const now = new Date();
    const warrantyDays = booking.service.warrantyDays || 30;
    const warrantyEnd = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          ...(finalAmount !== undefined && { totalAmount: parseFloat(finalAmount) }),
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'COMPLETED',
          comment: 'Service work completed successfully by provider',
          changedByUserId: req.user.id,
        },
      });

      // Automatically create warranty certificate
      await tx.warranty.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          serviceName: booking.service.name,
          warrantyDays,
          startDate: now,
          endDate: warrantyEnd,
          terms: `Covers workmanship and parts service for ${warrantyDays} days from date of completion.`,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: booking.customer.userId,
          title: 'Service Completed! Please Leave a Review',
          message: `Your booking #${booking.bookingNumber} is marked completed. Your ${warrantyDays}-day warranty is now active. Please rate your experience!`,
          type: 'BOOKING',
          link: `/customer/bookings/${id}`,
        },
      });

      return b;
    });

    return successResponse(res, 'Booking marked completed and warranty activated', updated);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { provider: true, customer: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return errorResponse(res, `Booking is already ${booking.status}`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'CANCELLED',
          comment: `Booking cancelled: ${reason}`,
          changedByUserId: req.user.id,
        },
      });

      // Notify opposing party
      if (req.user.role === 'CUSTOMER' && booking.provider) {
        await tx.notification.create({
          data: {
            userId: booking.provider.userId,
            title: 'Booking Cancelled by Customer',
            message: `Booking #${booking.bookingNumber} was cancelled by the customer. Reason: ${reason}`,
            type: 'BOOKING',
            link: `/provider/bookings/${id}`,
          },
        });
      } else if (req.user.role === 'PROVIDER') {
        await tx.notification.create({
          data: {
            userId: booking.customer.userId,
            title: 'Booking Cancelled by Provider',
            message: `Booking #${booking.bookingNumber} was cancelled by provider. Reason: ${reason}`,
            type: 'BOOKING',
            link: `/customer/bookings/${id}`,
          },
        });
      }

      return b;
    });

    return successResponse(res, 'Booking cancelled successfully', updated);
  } catch (error) {
    next(error);
  }
};
