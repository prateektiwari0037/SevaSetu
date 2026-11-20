import crypto from 'crypto';
import {
  Booking,
  CustomerProfile,
  ProviderProfile,
  Service,
  Notification,
  Review,
  Warranty,
  Payment,
  User,
  SlotReservation,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import NotificationService from '../../services/notification.service.js';

// Valid lifecycle transitions table
const ALLOWED_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

/**
 * 1. CREATE BOOKING (Concurrency-Safe Slot Reservation)
 */
export const createBooking = async (req, res, next) => {
  try {
    const {
      serviceId,
      providerId,
      providerServiceId,
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
      contactPhone = '',
    } = req.body;

    if (!serviceId || !problemDescription || !bookingDate || !timeSlot || !serviceAddress || !addressPincode) {
      return errorResponse(
        res,
        'Service, problem description, date, time slot, address, and pincode are required',
        400
      );
    }

    // Resolve or create CustomerProfile for requesting user
    let customer = await CustomerProfile.findOne({ userId: req.user.id });
    if (!customer) {
      customer = await CustomerProfile.create({
        userId: req.user.id,
        fullName: req.user.fullName || 'Customer',
        phone: req.user.phone || contactPhone || '',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return errorResponse(res, 'Selected service does not exist', 404);
    }

    let verifiedProviderId = null;
    let providerObj = null;

    if (providerId) {
      providerObj = await ProviderProfile.findById(providerId);
      if (!providerObj || providerObj.verificationStatus !== 'APPROVED') {
        return errorResponse(res, 'Selected provider is not verified or unavailable', 400);
      }
      if (providerObj.isAvailable === false) {
        return errorResponse(res, 'Provider is currently marked as unavailable', 400);
      }
      verifiedProviderId = providerObj._id;

      // Slot Conflict Detection & Atomic Reservation Check
      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictingBooking = await Booking.findOne({
        providerId: verifiedProviderId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: timeSlot.trim(),
        status: { $in: ['ACCEPTED', 'IN_PROGRESS', 'PENDING'] },
      });

      if (conflictingBooking) {
        return errorResponse(
          res,
          `The selected slot (${timeSlot}) is already reserved or booked for this provider.`,
          409
        );
      }

      // Concurrency-safe atomic slot reservation
      const dateString = new Date(bookingDate).toISOString().split('T')[0];
      try {
        await SlotReservation.create({
          providerId: verifiedProviderId,
          dateString,
          timeSlot: timeSlot.trim(),
          status: 'RESERVED',
        });
      } catch (slotErr) {
        if (slotErr.code === 11000) {
          return errorResponse(
            res,
            `The selected slot (${timeSlot}) is already reserved or booked for this provider.`,
            409
          );
        }
        throw slotErr;
      }
    }

    const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const finalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : (service.basePrice || 499);
    const totalPaise = Math.round(finalAmount * 100);
    const commissionRate = 0.1; // 10% platform commission
    const commissionPaise = Math.round(totalPaise * commissionRate);
    const providerEarningsPaise = totalPaise - commissionPaise;

    const addressSnapshot = {
      fullAddress: serviceAddress,
      area: addressArea,
      city: addressCity,
      pincode: addressPincode,
      contactPhone: contactPhone || customer.phone || '',
    };

    const serviceSnapshot = {
      name: service.name,
      description: service.description || '',
      categoryName: service.categoryName || 'General',
      durationMinutes: service.durationMinutes || 60,
      basePrice: service.basePrice || finalAmount,
    };

    const priceSnapshot = {
      basePricePaise: totalPaise,
      totalPaise,
      commissionRate,
      commissionPaise,
      providerEarningsPaise,
      amountInRupees: finalAmount,
    };

    const newBooking = await Booking.create({
      bookingNumber,
      customerId: customer._id,
      providerId: verifiedProviderId,
      serviceId: service._id,
      providerServiceId: providerServiceId || null,
      bookingType,
      status: 'PENDING',
      bookingStatus: 'PENDING',
      problemDescription,
      bookingDate: new Date(bookingDate),
      timeSlot: timeSlot.trim(),
      scheduledStart: new Date(bookingDate),
      serviceAddress,
      addressArea,
      addressCity,
      addressPincode,
      addressSnapshot,
      serviceSnapshot,
      priceSnapshot,
      totalAmount: finalAmount,
      paymentMethod: paymentMethod === 'PAY_LATER' ? 'PAY_LATER' : 'CASH_ON_SERVICE',
      paymentStatus: 'UNPAID',
      collectionStatus: 'UNPAID',
      isPaid: false,
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          comment: 'Booking created by customer',
          changedByUserId: req.user.id,
        },
      ],
      collectionHistory: [
        {
          status: 'UNPAID',
          timestamp: new Date(),
          changedByUserId: req.user.id,
          amountPaise: totalPaise,
          notes: 'Booking initiated with Cash on Service',
        },
      ],
    });

    if (verifiedProviderId) {
      const dateString = new Date(bookingDate).toISOString().split('T')[0];
      await SlotReservation.findOneAndUpdate(
        { providerId: verifiedProviderId, dateString, timeSlot: timeSlot.trim() },
        { bookingId: newBooking._id, status: 'RESERVED' }
      );
    }

    // Notify provider if directly assigned
    if (providerObj?.userId) {
      await NotificationService.notifyBookingEvent('BOOKING_CREATED', newBooking);
    }

    return successResponse(res, 'Booking created successfully', newBooking, 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        'The selected slot is already reserved or booked for this provider.',
        409
      );
    }
    next(error);
  }
};

/**
 * 2. GET ALL BOOKINGS (Role-Scoped & Filtered)
 */
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

/**
 * 3. GET BOOKING BY ID
 */
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

    // Role-based access check
    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer || booking.customerId?._id?.toString() !== customer._id.toString()) {
        return errorResponse(res, 'Access denied to this booking', 403);
      }
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (
        !provider ||
        (booking.providerId && booking.providerId?._id?.toString() !== provider._id.toString())
      ) {
        return errorResponse(res, 'Access denied to this booking', 403);
      }
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

/**
 * 4. ACCEPT BOOKING (Provider Action with Conflict Check)
 */
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
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    if (booking.status !== 'PENDING') {
      return errorResponse(
        res,
        `Booking is in ${booking.status} status and cannot be accepted`,
        400
      );
    }

    if (booking.providerId && booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Booking is assigned to another provider', 403);
    }

    // Slot Conflict Check
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
    booking.bookingStatus = 'ACCEPTED';
    booking.providerId = provider._id;
    booking.statusHistory.push({
      status: 'ACCEPTED',
      timestamp: new Date(),
      comment: `Booking accepted by provider ${provider.fullName || ''}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    await NotificationService.notifyBookingEvent('BOOKING_ACCEPTED', booking);

    return successResponse(res, 'Booking accepted successfully', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. REJECT BOOKING (Provider Action)
 */
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
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (booking.providerId && booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
    }

    if (booking.status !== 'PENDING') {
      return errorResponse(res, `Booking is ${booking.status} and cannot be rejected`, 400);
    }

    booking.status = 'REJECTED';
    booking.bookingStatus = 'REJECTED';
    booking.cancellationReason = reason;
    booking.statusHistory.push({
      status: 'REJECTED',
      timestamp: new Date(),
      comment: `Rejected by provider: ${reason}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    // Release atomic slot reservation
    await SlotReservation.deleteMany({ bookingId: booking._id });

    await NotificationService.notifyBookingEvent('BOOKING_REJECTED', booking, { reason });

    return successResponse(res, 'Booking rejected successfully', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. START SERVICE WORK (Provider Action)
 */
export const startBookingWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (!booking.providerId || booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
    }

    if (booking.status !== 'ACCEPTED') {
      return errorResponse(
        res,
        `Cannot start service. Booking is currently ${booking.status} (must be ACCEPTED)`,
        400
      );
    }

    booking.status = 'IN_PROGRESS';
    booking.bookingStatus = 'IN_PROGRESS';
    booking.statusHistory.push({
      status: 'IN_PROGRESS',
      timestamp: new Date(),
      comment: 'Provider has started service work',
      changedByUserId: req.user.id,
    });

    await booking.save();

    await NotificationService.notifyBookingEvent('SERVICE_STARTED', booking);

    return successResponse(res, 'Service marked as in progress', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. COMPLETE BOOKING (Provider Action & Warranty Generation)
 */
export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cashCollected } = req.body;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (!booking.providerId || booking.providerId.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
    }

    if (!['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
      return errorResponse(res, `Cannot complete booking in ${booking.status} status`, 400);
    }

    booking.status = 'COMPLETED';
    booking.bookingStatus = 'COMPLETED';

    // In Cash on Service, completion can record provider collection report
    if (cashCollected !== undefined) {
      booking.collectionStatus = cashCollected ? 'PROVIDER_REPORTED' : 'UNPAID';
      booking.isPaid = Boolean(cashCollected);
      booking.paymentStatus = cashCollected ? 'PAID' : 'UNPAID';
    } else {
      // Default completion: provider reported collection
      booking.collectionStatus = 'PROVIDER_REPORTED';
      booking.isPaid = true;
      booking.paymentStatus = 'PAID';
    }

    booking.statusHistory.push({
      status: 'COMPLETED',
      timestamp: new Date(),
      comment: 'Service successfully completed by provider',
      changedByUserId: req.user.id,
    });

    booking.collectionHistory.push({
      status: booking.collectionStatus,
      timestamp: new Date(),
      changedByUserId: req.user.id,
      amountPaise: booking.priceSnapshot?.totalPaise || Math.round(booking.totalAmount * 100),
      notes: 'Provider marked completion and reported cash on service',
    });

    await booking.save();

    // Increment completed jobs count
    provider.completedJobsCount = (provider.completedJobsCount || 0) + 1;
    await provider.save();

    // Automatically issue warranty certificate snapshot (30 days default)
    try {
      const existingWarranty = await Warranty.findOne({ bookingId: booking._id });
      if (!existingWarranty) {
        const certNumber = `WAR-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
        const startDate = new Date();
        const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days warranty

        await Warranty.create({
          bookingId: booking._id,
          customerId: booking.customerId?._id || booking.customerId,
          providerId: booking.providerId,
          serviceId: booking.serviceId,
          certificateNumber: certNumber,
          durationDays: 30,
          startDate,
          validUntil,
          endDate: validUntil,
          policySnapshot: {
            allowsFreeRevisit: true,
            terms: 'Covers service defects and workmanship for 30 days after completion.',
            coveredScope: booking.serviceSnapshot?.name || 'Service Workmanship',
          },
          status: 'ACTIVE',
          isActive: true,
        });
      }
    } catch (wErr) {
      console.warn('Auto warranty creation note:', wErr.message);
    }

    await NotificationService.notifyBookingEvent('SERVICE_COMPLETED', booking);

    return successResponse(res, 'Booking marked as completed', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. CANCEL BOOKING (Customer / Provider / Admin Action)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Ownership check: Customer, assigned Provider, or Admin
    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer || booking.customerId?._id?.toString() !== customer._id.toString()) {
        return errorResponse(res, 'Access denied: You can only cancel your own bookings', 403);
      }
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (!provider || booking.providerId?.toString() !== provider._id.toString()) {
        return errorResponse(res, 'Access denied: You are not assigned to this booking', 403);
      }
    }

    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
      return errorResponse(res, `Cannot cancel booking in ${booking.status} status`, 400);
    }

    booking.status = 'CANCELLED';
    booking.bookingStatus = 'CANCELLED';
    booking.cancellationReason = reason;
    booking.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      comment: `Cancelled: ${reason}`,
      changedByUserId: req.user.id,
    });

    await booking.save();

    // Release atomic slot reservation
    await SlotReservation.deleteMany({ bookingId: booking._id });

    await NotificationService.notifyBookingEvent('BOOKING_CANCELLED', booking, { reason });

    return successResponse(res, 'Booking cancelled successfully', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. CASH COLLECTION REPORTING (Provider Action)
 * POST /api/v1/bookings/:id/collection/report
 */
export const reportCashCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, notes = '' } = req.body;

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Provider profile required to report cash collection', 403);
    }

    const booking = await Booking.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (req.user.role !== 'ADMIN' && booking.providerId?.toString() !== provider._id.toString()) {
      return errorResponse(res, 'Access denied: Not your assigned booking', 403);
    }

    if (!['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
      return errorResponse(res, `Cannot report cash collection on ${booking.status} booking`, 400);
    }

    const reportedAmount = amount ? parseFloat(amount) : booking.totalAmount;
    const reportedPaise = Math.round(reportedAmount * 100);

    booking.collectionStatus = 'PROVIDER_REPORTED';
    booking.collectionHistory.push({
      status: 'PROVIDER_REPORTED',
      timestamp: new Date(),
      changedByUserId: req.user.id,
      amountPaise: reportedPaise,
      notes: notes || `Provider reported receiving ₹${reportedAmount} cash on service`,
    });

    await booking.save();

    // Create or update Payment record
    const transactionId = `TXN-CASH-${Date.now()}-${crypto.randomInt(100, 999)}`;
    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        bookingId: booking._id,
        transactionId,
        amount: reportedAmount,
        amountInPaise: reportedPaise,
        commissionRate: 0.1,
        paymentMethod: 'CASH_ON_SERVICE',
        status: 'PROVIDER_REPORTED',
        collectionStatus: 'PROVIDER_REPORTED',
        collectedAt: new Date(),
        collectedBy: req.user.id,
        notes,
        $push: {
          auditHistory: {
            status: 'PROVIDER_REPORTED',
            timestamp: new Date(),
            changedByUserId: req.user.id,
            notes: notes || 'Provider reported cash collection',
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await NotificationService.notifyBookingEvent('COLLECTION_REPORTED', booking);

    return successResponse(res, 'Cash collection reported by provider. Awaiting customer confirmation.', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      collectionStatus: booking.collectionStatus,
      amountReported: reportedAmount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. CASH COLLECTION CONFIRMATION (Customer Action)
 * POST /api/v1/bookings/:id/collection/confirm
 */
export const confirmCashCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = 'Confirmed by customer' } = req.body;

    const booking = await Booking.findById(id).populate({
      path: 'providerId',
      populate: { path: 'userId', select: 'fullName email' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer || booking.customerId.toString() !== customer._id.toString()) {
        return errorResponse(res, 'Access denied: You can only confirm your own bookings', 403);
      }
    } else if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only the customer or an admin can confirm cash payment', 403);
    }

    booking.collectionStatus = 'CONFIRMED';
    booking.paymentStatus = 'PAID';
    booking.isPaid = true;

    booking.collectionHistory.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      changedByUserId: req.user.id,
      amountPaise: booking.priceSnapshot?.totalPaise || Math.round(booking.totalAmount * 100),
      notes,
    });

    await booking.save();

    // Settle Payment record
    const amountPaise = booking.priceSnapshot?.totalPaise || Math.round(booking.totalAmount * 100);
    const commissionPaise = Math.round(amountPaise * 0.1);
    const providerEarningsPaise = amountPaise - commissionPaise;

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        collectionStatus: 'CONFIRMED',
        status: 'PAID',
        confirmedAt: new Date(),
        confirmedBy: req.user.id,
        amountInPaise: amountPaise,
        commissionInPaise: commissionPaise,
        providerEarningsPaise: providerEarningsPaise,
        $push: {
          auditHistory: {
            status: 'CONFIRMED',
            timestamp: new Date(),
            changedByUserId: req.user.id,
            notes,
          },
        },
      },
      { upsert: true }
    );

    await NotificationService.notifyBookingEvent('COLLECTION_CONFIRMED', booking);

    return successResponse(res, 'Payment confirmed successfully', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      collectionStatus: booking.collectionStatus,
      isPaid: booking.isPaid,
      settlement: {
        totalPaise: amountPaise,
        commissionPaise,
        providerEarningsPaise,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. CASH COLLECTION DISPUTE (Customer / Provider Action)
 * POST /api/v1/bookings/:id/collection/dispute
 */
export const disputeCashCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, 'Dispute reason is required', 400);
    }

    const booking = await Booking.findById(id).populate({
      path: 'providerId',
      populate: { path: 'userId', select: 'fullName' },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    booking.collectionStatus = 'DISPUTED';
    booking.disputeReason = reason;

    booking.collectionHistory.push({
      status: 'DISPUTED',
      timestamp: new Date(),
      changedByUserId: req.user.id,
      amountPaise: booking.priceSnapshot?.totalPaise || 0,
      notes: `Dispute raised: ${reason}`,
    });

    await booking.save();

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        collectionStatus: 'DISPUTED',
        status: 'DISPUTED',
        disputeReason: reason,
        $push: {
          auditHistory: {
            status: 'DISPUTED',
            timestamp: new Date(),
            changedByUserId: req.user.id,
            notes: reason,
          },
        },
      },
      { upsert: true }
    );

    await NotificationService.notifyBookingEvent('COLLECTION_DISPUTED', booking, { reason });

    return successResponse(res, 'Collection dispute registered for administrative review', {
      bookingId: booking._id,
      collectionStatus: booking.collectionStatus,
      disputeReason: booking.disputeReason,
    });
  } catch (error) {
    next(error);
  }
};
