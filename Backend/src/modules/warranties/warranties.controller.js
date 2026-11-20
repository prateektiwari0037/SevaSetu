import {
  Warranty,
  Booking,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getWarrantyByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const warranty = await Warranty.findOne({ bookingId })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'serviceId', select: 'name basePrice durationMinutes' },
          { path: 'providerId', populate: { path: 'userId', select: 'fullName mobile' } },
        ],
      });

    if (!warranty) {
      return errorResponse(res, 'No warranty certificate found for this booking', 404);
    }

    const isExpired = new Date() > warranty.validUntil;
    const daysRemaining = Math.max(
      0,
      Math.ceil((warranty.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return successResponse(res, 'Warranty details', {
      ...warranty.toObject(),
      endDate: warranty.validUntil,
      isExpired,
      daysRemaining,
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

    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const booking = await Booking.findById(bookingId).populate('providerId');
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (booking.customerId.toString() !== customer._id.toString()) {
      return errorResponse(res, 'Unauthorized access to booking', 403);
    }

    const warranty = await Warranty.findOne({ bookingId: booking._id });
    if (!warranty) {
      return errorResponse(res, 'No warranty certificate associated with this booking', 400);
    }

    if (new Date() > warranty.validUntil) {
      return errorResponse(res, 'Warranty has expired. Cannot request free revisit.', 400);
    }

    const revisit = {
      customerId: customer._id,
      providerId: booking.providerId?._id || null,
      reason: reason.trim(),
      scheduledDate: preferredDate ? new Date(preferredDate) : null,
      status: 'PENDING',
    };

    warranty.revisitRequests.push(revisit);
    await warranty.save();

    // Notify provider if assigned
    if (booking.providerId?.userId) {
      await Notification.create({
        userId: booking.providerId.userId,
        title: 'Warranty Revisit Requested',
        message: `Customer requested a warranty revisit for booking #${booking.bookingNumber}. Reason: ${reason.trim()}`,
        type: 'WARRANTY',
        link: `/provider/bookings/${booking._id}`,
      });
    }

    return successResponse(res, 'Warranty revisit request submitted successfully', revisit, 201);
  } catch (error) {
    next(error);
  }
};

export const getRevisits = async (req, res, next) => {
  try {
    const warranties = await Warranty.find({ 'revisitRequests.0': { $exists: true } })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'serviceId', select: 'name' },
          { path: 'customerId', populate: { path: 'userId', select: 'fullName email mobile' } },
          { path: 'providerId', populate: { path: 'userId', select: 'fullName mobile' } },
        ],
      });

    let revisits = [];
    for (const w of warranties) {
      for (const r of w.revisitRequests) {
        revisits.push({
          ...r.toObject(),
          warrantyId: w._id,
          booking: w.bookingId,
        });
      }
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (customer) {
        revisits = revisits.filter((r) => r.customerId?.toString() === customer._id.toString());
      }
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user._id || req.user.id });
      if (provider) {
        revisits = revisits.filter((r) => r.providerId?.toString() === provider._id.toString());
      }
    }

    return successResponse(res, 'Revisits retrieved', revisits);
  } catch (error) {
    next(error);
  }
};

export const updateRevisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, providerNotes } = req.body;

    const warranty = await Warranty.findOne({ 'revisitRequests._id': id }).populate({
      path: 'bookingId',
      populate: { path: 'customerId', populate: { path: 'userId' } },
    });

    if (!warranty) return errorResponse(res, 'Revisit request not found', 404);

    const revisit = warranty.revisitRequests.id(id);
    if (!revisit) return errorResponse(res, 'Revisit item not found', 404);

    if (status) revisit.status = status;
    if (scheduledDate) revisit.scheduledDate = new Date(scheduledDate);
    if (providerNotes !== undefined) revisit.providerNotes = providerNotes;

    await warranty.save();

    // Notify customer
    const customerUserId = warranty.bookingId?.customerId?.userId?._id;
    if (customerUserId) {
      await Notification.create({
        userId: customerUserId,
        title: `Warranty Revisit ${status}`,
        message: `Your warranty revisit status is now ${status}.${providerNotes ? ` Note: ${providerNotes}` : ''}`,
        type: 'WARRANTY',
        link: `/customer/bookings/${warranty.bookingId?._id}`,
      });
    }

    return successResponse(res, 'Revisit status updated', revisit);
  } catch (error) {
    next(error);
  }
};
