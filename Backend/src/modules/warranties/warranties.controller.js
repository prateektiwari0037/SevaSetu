import crypto from 'crypto';
import {
  Warranty,
  Booking,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import NotificationService from '../../services/notification.service.js';

/**
 * 1. GET MY WARRANTIES
 * GET /api/v1/warranties/my
 */
export const getMyWarranties = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer) return successResponse(res, 'No warranties found', []);
      filter.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (!provider) return successResponse(res, 'No warranties found', []);
      filter.providerId = provider._id;
    }

    const warranties = await Warranty.find(filter)
      .populate('serviceId', 'name description')
      .populate('bookingId', 'bookingNumber serviceAddress bookingDate totalAmount')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = warranties.map((w) => {
      const isExpired = new Date() > new Date(w.validUntil);
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(w.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      return {
        ...w,
        id: w._id.toString(),
        isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        service: w.serviceId,
        booking: w.bookingId,
        provider: w.providerId,
        customer: w.customerId,
      };
    });

    return successResponse(res, 'Warranties retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. CREATE WARRANTY REVISIT REQUEST
 * POST /api/v1/warranties/:id/revisits
 */
export const createRevisitRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, preferredDate } = req.body;

    if (!reason) {
      return errorResponse(res, 'Reason for warranty revisit is required', 400);
    }

    const customer = await CustomerProfile.findOne({ userId: req.user.id });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    // Find warranty either by warranty _id or bookingId
    let warranty = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      warranty = await Warranty.findOne({
        $or: [{ _id: id }, { bookingId: id }],
      }).populate('bookingId providerId');
    }

    if (!warranty) {
      return errorResponse(res, 'Warranty certificate not found', 404);
    }

    // Ownership check
    if (warranty.customerId && warranty.customerId.toString() !== customer._id.toString()) {
      return errorResponse(res, 'Access denied: You can only request revisits for your own warranties', 403);
    }

    // Check expiry
    if (new Date() > warranty.validUntil) {
      warranty.status = 'EXPIRED';
      warranty.isActive = false;
      await warranty.save();
      return errorResponse(
        res,
        'Warranty period has expired. Free revisit cannot be requested for expired warranties.',
        400
      );
    }

    // Check policy snapshot: Does policy allow free revisit?
    if (warranty.policySnapshot && warranty.policySnapshot.allowsFreeRevisit === false) {
      return errorResponse(
        res,
        'This service warranty policy does not cover free revisits.',
        400
      );
    }

    const revisitNumber = `REV-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const newRevisit = {
      revisitNumber,
      reason: reason.trim(),
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      status: 'PENDING',
      requestedAt: new Date(),
    };

    warranty.revisits.push(newRevisit);
    await warranty.save();

    // Notify provider
    const providerUserId = warranty.providerId?.userId?._id || warranty.providerId?.userId || warranty.providerId;
    if (providerUserId) {
      await NotificationService.sendNotification({
        userId: providerUserId,
        title: 'Warranty Revisit Requested',
        message: `Customer ${customer.fullName || 'User'} requested a warranty revisit under certificate #${warranty.certificateNumber}. Reason: ${reason}`,
        type: 'WARRANTY',
        link: `/provider/bookings`,
      });
    }

    return successResponse(res, 'Warranty revisit request submitted successfully', {
      warrantyId: warranty._id,
      certificateNumber: warranty.certificateNumber,
      revisit: newRevisit,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET WARRANTY BY BOOKING
 * GET /api/v1/warranties/booking/:bookingId
 */
export const getWarrantyByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const warranty = await Warranty.findOne({ bookingId })
      .populate('serviceId')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .lean();

    if (!warranty) {
      return errorResponse(res, 'No warranty certificate found for this booking', 404);
    }

    const isExpired = new Date() > new Date(warranty.validUntil);
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(warranty.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return successResponse(res, 'Warranty details retrieved', {
      ...warranty,
      id: warranty._id.toString(),
      isExpired,
      daysRemaining: isExpired ? 0 : daysRemaining,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. UPDATE REVISIT STATUS (Provider / Admin Action)
 * PATCH /api/v1/revisits/:id/status
 */
export const updateRevisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, providerNotes = '' } = req.body;

    if (!['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return errorResponse(res, 'Status must be ACCEPTED, REJECTED, or COMPLETED', 400);
    }

    // Find the warranty containing this revisit
    const warranty = await Warranty.findOne({ 'revisits._id': id }).populate('customerId');
    if (!warranty) return errorResponse(res, 'Revisit request not found', 404);

    const revisit = warranty.revisits.id(id);
    if (!revisit) return errorResponse(res, 'Revisit request not found', 404);

    revisit.status = status;
    if (providerNotes) revisit.providerNotes = providerNotes;
    if (scheduledDate) revisit.preferredDate = new Date(scheduledDate);
    if (['REJECTED', 'COMPLETED'].includes(status)) {
      revisit.resolvedAt = new Date();
    }

    await warranty.save();

    // Notify customer
    const customerUserId = warranty.customerId?.userId?._id || warranty.customerId?.userId;
    if (customerUserId) {
      await NotificationService.sendNotification({
        userId: customerUserId,
        title: `Warranty Revisit ${status}`,
        message: `Your warranty revisit request (#${revisit.revisitNumber}) is now ${status}. Notes: ${providerNotes || 'None'}`,
        type: 'WARRANTY',
      });
    }

    return successResponse(res, 'Warranty revisit status updated', revisit);
  } catch (error) {
    next(error);
  }
};
