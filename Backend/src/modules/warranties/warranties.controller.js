import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getWarrantyByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const warranty = await prisma.warranty.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: { service: true, provider: true },
        },
        revisitRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!warranty) return errorResponse(res, 'No warranty certificate found for this booking', 404);

    const isExpired = new Date() > warranty.endDate;

    return successResponse(res, 'Warranty details', {
      ...warranty,
      isExpired,
      daysRemaining: Math.max(
        0,
        Math.ceil((warranty.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const createRevisitRequest = async (req, res, next) => {
  try {
    const { bookingId, reason, preferredDate } = req.body;

    if (!bookingId || !reason) {
      return errorResponse(res, 'Booking ID and reason for revisit are required', 400);
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { warranty: true, provider: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.customerId !== customer.id) {
      return errorResponse(res, 'Unauthorized access to booking', 403);
    }
    if (!booking.warranty) {
      return errorResponse(res, 'No warranty associated with this booking', 400);
    }
    if (new Date() > booking.warranty.endDate) {
      return errorResponse(res, 'Warranty has expired. Cannot request free revisit.', 400);
    }
    if (!booking.providerId) {
      return errorResponse(res, 'No provider associated with this booking', 400);
    }

    const revisit = await prisma.$transaction(async (tx) => {
      const r = await tx.revisitRequest.create({
        data: {
          warrantyId: booking.warranty.id,
          bookingId: booking.id,
          customerId: customer.id,
          providerId: booking.providerId,
          reason,
          scheduledDate: preferredDate ? new Date(preferredDate) : null,
          status: 'PENDING',
        },
      });

      // Notify provider
      await tx.notification.create({
        data: {
          userId: booking.provider.userId,
          title: 'Warranty Revisit Requested',
          message: `Customer ${customer.fullName} requested a warranty revisit for booking #${booking.bookingNumber}. Reason: ${reason}`,
          type: 'WARRANTY',
          link: `/provider/bookings/${booking.id}`,
        },
      });

      return r;
    });

    return successResponse(res, 'Warranty revisit request submitted successfully', revisit, 201);
  } catch (error) {
    next(error);
  }
};

export const getRevisits = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (customer) where.customerId = customer.id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (provider) where.providerId = provider.id;
    }

    const revisits = await prisma.revisitRequest.findMany({
      where,
      include: {
        booking: { include: { service: true } },
        customer: true,
        provider: true,
        warranty: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Revisits retrieved', revisits);
  } catch (error) {
    next(error);
  }
};

export const updateRevisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, providerNotes } = req.body;

    const revisit = await prisma.revisitRequest.findUnique({
      where: { id },
      include: { customer: true, booking: true },
    });
    if (!revisit) return errorResponse(res, 'Revisit request not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.revisitRequest.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
          ...(providerNotes !== undefined && { providerNotes }),
        },
      });

      await tx.notification.create({
        data: {
          userId: revisit.customer.userId,
          title: `Warranty Revisit ${status}`,
          message: `Your warranty revisit for booking #${revisit.booking.bookingNumber} is marked ${status}. Note: ${providerNotes || 'Updated'}`,
          type: 'WARRANTY',
          link: `/customer/bookings/${revisit.bookingId}`,
        },
      });

      return r;
    });

    return successResponse(res, 'Revisit status updated', updated);
  } catch (error) {
    next(error);
  }
};
