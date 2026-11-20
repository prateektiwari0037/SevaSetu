import crypto from 'crypto';
import {
  Booking,
  Service,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const createEmergencyRequest = async (req, res, next) => {
  try {
    const {
      serviceId,
      problemDescription,
      serviceAddress,
      addressPincode,
      addressArea = '',
      addressCity = 'Mumbai',
    } = req.body;

    if (!serviceId || !problemDescription || !serviceAddress) {
      return errorResponse(res, 'Service, problem description, and address are required', 400);
    }

    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
    if (!customer) return errorResponse(res, 'Customer profile required', 400);

    const service = await Service.findById(serviceId);
    if (!service) return errorResponse(res, 'Service not found', 404);

    // Find all verified, available providers
    const eligibleProviders = await ProviderProfile.find({
      verificationStatus: 'APPROVED',
      isAvailable: true,
    }).populate('userId');

    const bookingNumber = `EMG-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    const booking = await Booking.create({
      bookingNumber,
      customerId: customer._id,
      serviceId: service._id,
      bookingType: 'EMERGENCY',
      status: 'PENDING',
      problemDescription: `🚨 [EMERGENCY SOS]: ${problemDescription.trim()}`,
      bookingDate: new Date(),
      timeSlot: 'IMMEDIATE / SOS DISPATCH',
      serviceAddress,
      addressArea,
      addressCity,
      addressPincode: addressPincode || '400001',
      totalAmount: Math.round(service.basePrice * 1.5), // 1.5x emergency rate
      paymentMethod: 'CASH_ON_SERVICE',
      isPaid: false,
      statusHistory: [
        {
          status: 'PENDING',
          comment: '🚨 Emergency SOS broadcast initiated to nearby providers',
          changedByUserId: req.user._id || req.user.id,
          timestamp: new Date(),
        },
      ],
    });

    // Notify all eligible providers
    if (eligibleProviders.length > 0) {
      const notifications = eligibleProviders
        .filter((p) => p.userId?._id)
        .map((p) => ({
          userId: p.userId._id,
          title: '🚨 PRIORITY EMERGENCY SOS REQUEST',
          message: `Urgent emergency nearby for ${service.name} at ${serviceAddress}! Check and accept.`,
          type: 'EMERGENCY',
          link: `/provider/bookings/${booking._id}`,
          data: { bookingId: booking._id.toString() },
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return successResponse(
      res,
      'Emergency SOS request broadcasted to nearby providers',
      {
        booking,
        notifiedProvidersCount: eligibleProviders.length,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getEmergencyRequests = async (req, res, next) => {
  try {
    const query = { bookingType: 'EMERGENCY' };

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (customer) query.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user._id || req.user.id });
      if (provider) {
        query.$or = [{ providerId: provider._id }, { status: 'PENDING' }];
      }
    }

    const emergencies = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('serviceId', 'name basePrice durationMinutes imageUrl')
      .populate({ path: 'customerId', populate: { path: 'userId', select: 'fullName mobile avatarUrl' } })
      .populate({ path: 'providerId', populate: { path: 'userId', select: 'fullName mobile avatarUrl' } });

    return successResponse(res, 'Emergency requests retrieved', emergencies);
  } catch (error) {
    next(error);
  }
};

export const getEmergencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({
      _id: id,
      bookingType: 'EMERGENCY',
    })
      .populate('serviceId', 'name basePrice durationMinutes imageUrl')
      .populate({ path: 'customerId', populate: { path: 'userId', select: 'fullName mobile' } })
      .populate({ path: 'providerId', populate: { path: 'userId', select: 'fullName mobile' } });

    if (!booking) return errorResponse(res, 'Emergency request not found', 404);

    return successResponse(res, 'Emergency details', booking);
  } catch (error) {
    next(error);
  }
};
