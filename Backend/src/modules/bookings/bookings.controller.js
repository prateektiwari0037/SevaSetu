import crypto from 'crypto';
import {
  Booking,
  CustomerProfile,
  ProviderProfile,
  Service,
  Notification,
  Review,
  User,
} from '../../models/index.js';
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
      addressArea = '',
      addressCity = 'Mumbai',
      bookingType = 'NORMAL',
      totalAmount,
      paymentMethod = 'CASH_ON_SERVICE',
    } = req.body;

    if (!serviceId || !problemDescription || !bookingDate || !timeSlot || !serviceAddress || !addressPincode) {
      return errorResponse(
        res,
        'Service, problem description, date, time slot, address, and pincode are required',
        400
      );
    }

    let customer = await CustomerProfile.findOne({ userId: req.user.id });
    if (!customer) {
      customer = await CustomerProfile.create({
        userId: req.user.id,
        fullName: req.user.fullName || '',
        phone: req.user.phone || '',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return errorResponse(res, 'Selected service does not exist', 404);
    }

    let verifiedProviderId = null;
    if (providerId) {
      const provider = await ProviderProfile.findById(providerId);
      if (!provider || provider.verificationStatus !== 'APPROVED') {
        return errorResponse(res, 'Selected provider is not verified or unavailable', 400);
      }
      verifiedProviderId = provider._id;
    }

    const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const finalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : service.basePrice;

    const newBooking = await Booking.create({
      bookingNumber,
      customerId: customer._id,
      providerId: verifiedProviderId,
      serviceId: service._id,
      bookingType,
      status: 'PENDING',
      problemDescription,
      bookingDate: new Date(bookingDate),
      timeSlot,
      serviceAddress,
      addressArea,
      addressCity,
      addressPincode,
      totalAmount: finalAmount,
      paymentMethod,
      isPaid: false,
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          comment: 'Booking placed by customer',
          changedByUserId: req.user.id,
        },
      ],
    });

    // Notify provider if direct booking
    if (verifiedProviderId) {
      const prov = await ProviderProfile.findById(verifiedProviderId);
      if (prov) {
        await Notification.create({
          userId: prov.userId,
          title: 'New Booking Request',
          message: `New booking #${bookingNumber} for ${service.name} received.`,
          type: 'BOOKING',
          data: { bookingId: newBooking._id.toString() },
        });
      }
    }

    return successResponse(res, 'Booking created successfully', newBooking, 201);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer) return successResponse(res, 'No bookings found', []);
      filter.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (!provider) return successResponse(res, 'No bookings found', []);
      filter.providerId = provider._id;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name basePrice durationMinutes imageUrl')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
      })
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Booking.countDocuments(filter);

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id.toString(),
      service: b.serviceId,
      provider: b.providerId,
      customer: b.customerId,
    }));

    return successResponse(res, 'Bookings retrieved', {
      bookings: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id)
        .populate('serviceId')
        .populate({
          path: 'providerId',
          populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
        })
        .populate({
          path: 'customerId',
          populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
        })
        .lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: id })
        .populate('serviceId')
        .populate({
          path: 'providerId',
          populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
        })
        .populate({
          path: 'customerId',
          populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
        })
        .lean();
    }

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    booking.id = booking._id.toString();
    booking.service = booking.serviceId;
    booking.provider = booking.providerId;
    booking.customer = booking.customerId;

    return successResponse(res, 'Booking details retrieved', booking);
  } catch (error) {
    next(error);
  }
};

export const acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) {
      return errorResponse(res, 'Provider profile required to accept booking', 403);
    }

    if (provider.verificationStatus === 'SUSPENDED') {
      return errorResponse(res, 'Suspended provider cannot accept bookings', 403);
    }

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    if (booking.status !== 'PENDING') {
      return errorResponse(res, `Booking is in ${booking.status} status and cannot be accepted`, 400);
    }

    // Check if assigned to another provider
    if (booking.providerId && booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Booking is assigned to another provider', 403);
    }

    // Check for overlapping accepted bookings for this provider at same date and slot
    const startOfDay = new Date(booking.bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(booking.bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlapping = await Booking.findOne({
      _id: { $ne: booking._id },
      providerId: provider._id,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] },
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: booking.timeSlot,
    });

    if (overlapping) {
      return errorResponse(
        res,
        `You already have an active booking (${overlapping.bookingNumber}) scheduled at ${booking.timeSlot}`,
        409
      );
    }

    booking.status = 'ACCEPTED';
    booking.providerId = provider._id;
    booking.statusHistory.push({
      status: 'ACCEPTED',
      timestamp: new Date(),
      comment: `Booking accepted by provider ${provider.fullName || ''}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    // Notify customer
    if (booking.customerId?.userId) {
      await Notification.create({
        userId: booking.customerId.userId,
        title: 'Booking Accepted',
        message: `${provider.fullName || 'The service provider'} has accepted your booking #${booking.bookingNumber}.`,
        type: 'BOOKING',
        data: { bookingId: booking._id.toString() },
      });
    }

    return successResponse(res, 'Booking accepted successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Provider is unavailable at the requested time' } = req.body;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) {
      return errorResponse(res, 'Provider profile required', 403);
    }

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (booking.status !== 'PENDING') {
      return errorResponse(res, `Booking is ${booking.status} and cannot be rejected`, 400);
    }

    booking.status = 'REJECTED';
    booking.statusHistory.push({
      status: 'REJECTED',
      timestamp: new Date(),
      comment: `Rejected by provider: ${reason}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    if (booking.customerId?.userId) {
      await Notification.create({
        userId: booking.customerId.userId,
        title: 'Booking Declined',
        message: `Your booking #${booking.bookingNumber} was declined by the provider. Reason: ${reason}`,
        type: 'BOOKING',
        data: { bookingId: booking._id.toString() },
      });
    }

    return successResponse(res, 'Booking rejected successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const startBookingWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Verify ownership
    if (!booking.providerId || booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
    }

    if (booking.status !== 'ACCEPTED') {
      return errorResponse(res, `Cannot start service. Booking is currently ${booking.status} (must be ACCEPTED)`, 400);
    }

    booking.status = 'IN_PROGRESS';
    booking.statusHistory.push({
      status: 'IN_PROGRESS',
      timestamp: new Date(),
      comment: 'Provider has started service work',
      changedByUserId: req.user.id,
    });

    await booking.save();

    if (booking.customerId?.userId) {
      await Notification.create({
        userId: booking.customerId.userId,
        title: 'Service Work Started',
        message: `The provider has arrived and started work on booking #${booking.bookingNumber}.`,
        type: 'BOOKING',
        data: { bookingId: booking._id.toString() },
      });
    }

    return successResponse(res, 'Service marked as in progress', booking);
  } catch (error) {
    next(error);
  }
};

export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cashCollected } = req.body;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Verify ownership
    if (!booking.providerId || booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
    }

    if (!['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
      return errorResponse(res, `Cannot complete booking in ${booking.status} status`, 400);
    }

    booking.status = 'COMPLETED';
    if (cashCollected !== undefined) {
      booking.isPaid = Boolean(cashCollected);
    } else {
      // By default in Cash on Service, completion marks as collected
      booking.isPaid = true;
    }

    booking.statusHistory.push({
      status: 'COMPLETED',
      timestamp: new Date(),
      comment: 'Service successfully completed by provider',
      changedByUserId: req.user.id,
    });

    await booking.save();

    // Update provider completed jobs count
    provider.completedJobsCount = (provider.completedJobsCount || 0) + 1;
    await provider.save();

    if (booking.customerId?.userId) {
      await Notification.create({
        userId: booking.customerId.userId,
        title: 'Service Completed',
        message: `Your booking #${booking.bookingNumber} is marked as completed. Please leave a review!`,
        type: 'BOOKING',
        data: { bookingId: booking._id.toString() },
      });
    }

    return successResponse(res, 'Booking marked as completed', booking);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
      return errorResponse(res, `Cannot cancel booking in ${booking.status} status`, 400);
    }

    booking.status = 'CANCELLED';
    booking.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      comment: `Cancelled: ${reason}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    return successResponse(res, 'Booking cancelled successfully', booking);
  } catch (error) {
    next(error);
  }
};
