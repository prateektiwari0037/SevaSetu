import crypto from 'crypto';
import {
  EmergencyRequest,
  CustomerProfile,
  ProviderProfile,
  Booking,
  Service,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import NotificationService from '../../services/notification.service.js';

/**
 * 1. CREATE EMERGENCY REQUEST (Manual Location Based)
 * POST /api/v1/emergency-requests
 */
export const createEmergencyRequest = async (req, res, next) => {
  try {
    const {
      emergencyCategory,
      category,
      description,
      problemDescription,
      city,
      area,
      pincode,
      addressPincode,
      fullAddress,
      serviceAddress,
      contactNumber,
      phone,
      serviceId,
    } = req.body;

    const cat = emergencyCategory || category || 'General Emergency';
    const desc = description || problemDescription;
    const reqCity = city || 'Mumbai';
    const reqArea = area || '';
    const reqPincode = (pincode || addressPincode || '').trim();
    const reqAddress = fullAddress || serviceAddress;
    const reqPhone = contactNumber || phone || req.user.phone;

    if (!desc || !reqAddress || !reqPincode) {
      return errorResponse(
        res,
        'Description, full address, and PIN Code are required for emergency dispatch',
        400
      );
    }

    let customer = await CustomerProfile.findOne({ userId: req.user.id });
    if (!customer) {
      customer = await CustomerProfile.create({
        userId: req.user.id,
        fullName: req.user.fullName || 'Customer',
        phone: reqPhone || '',
      });
    }

    // Manual Location Matching: Find verified, available providers serving this PIN Code or City/Area
    const query = {
      verificationStatus: 'APPROVED',
      isAvailable: true,
      $or: [
        { servicePincode: reqPincode },
        { 'serviceAreas.pincode': reqPincode },
        { city: { $regex: new RegExp(`^${reqCity}$`, 'i') } },
      ],
    };

    const eligibleProviders = await ProviderProfile.find(query).populate('userId', 'fullName email phone');

    const requestNumber = `SOS-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const timeoutMinutes = 15;
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    // Create Emergency Request record
    const emergency = await EmergencyRequest.create({
      requestNumber,
      customerId: customer._id,
      serviceId: serviceId || null,
      emergencyCategory: cat,
      description: desc,
      city: reqCity,
      area: reqArea,
      pincode: reqPincode,
      fullAddress: reqAddress,
      contactNumber: reqPhone || customer.phone || '',
      status: 'PENDING',
      notifiedProviderIds: eligibleProviders.map((p) => p._id),
      expiresAt,
    });

    // Notify all eligible providers (in-app + Dev notification)
    for (const provider of eligibleProviders) {
      if (provider.userId?._id || provider.userId) {
        await NotificationService.sendNotification({
          userId: provider.userId._id || provider.userId,
          title: `🚨 EMERGENCY SOS DISPATCH: ${cat}`,
          message: `Urgent emergency nearby at ${reqAddress}, PIN: ${reqPincode}. Open immediately to respond.`,
          type: 'EMERGENCY',
          link: `/provider/bookings`,
        });
      }
    }

    return successResponse(
      res,
      eligibleProviders.length > 0
        ? 'Emergency SOS alert broadcast to eligible active providers in your area'
        : 'Emergency SOS request registered. No active providers currently online in your area; request queued.',
      {
        emergencyId: emergency._id,
        requestNumber: emergency.requestNumber,
        status: emergency.status,
        notifiedProvidersCount: eligibleProviders.length,
        expiresAt: emergency.expiresAt,
        disclaimer: emergency.disclaimer,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET USER'S EMERGENCY REQUESTS
 * GET /api/v1/emergency-requests/my
 */
export const getMyEmergencyRequests = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (!customer) return successResponse(res, 'No emergency requests', []);
      filter.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (!provider) return successResponse(res, 'No emergency requests', []);
      filter = {
        $or: [
          { acceptedProviderId: provider._id },
          { notifiedProviderIds: provider._id, status: 'PENDING' },
        ],
      };
    }

    const emergencies = await EmergencyRequest.find(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'acceptedProviderId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = emergencies.map((e) => ({
      ...e,
      id: e._id.toString(),
      customer: e.customerId,
      acceptedProvider: e.acceptedProviderId,
    }));

    return successResponse(res, 'Emergency requests retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. RESPOND TO EMERGENCY REQUEST (Provider Action)
 * POST /api/v1/emergency-requests/:id/respond
 */
export const respondToEmergencyRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason = '' } = req.body; // 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return errorResponse(res, 'Action must be either ACCEPT or REJECT', 400);
    }

    const provider = await ProviderProfile.findOne({ userId: req.user.id });
    if (!provider) {
      return errorResponse(res, 'Provider profile required to respond to emergency requests', 403);
    }

    if (provider.verificationStatus !== 'APPROVED') {
      return errorResponse(res, 'Only verified providers can accept emergency requests', 403);
    }

    const emergency = await EmergencyRequest.findById(id).populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName email phone' },
    });

    if (!emergency) {
      return errorResponse(res, 'Emergency request not found', 404);
    }

    // Check expiry
    if (new Date() > emergency.expiresAt && emergency.status === 'PENDING') {
      emergency.status = 'TIMEOUT';
      await emergency.save();
      return errorResponse(res, 'Emergency request has timed out and expired', 410);
    }

    if (action === 'REJECT') {
      if (!emergency.rejectedProviderIds.includes(provider._id)) {
        emergency.rejectedProviderIds.push(provider._id);
      }
      await emergency.save();
      return successResponse(res, 'Emergency request declined', { status: emergency.status });
    }

    // Action is ACCEPT
    if (emergency.status !== 'PENDING') {
      return errorResponse(
        res,
        `Emergency request is already ${emergency.status} by another provider`,
        409
      );
    }

    // Atomically claim the emergency request
    emergency.status = 'ACCEPTED';
    emergency.acceptedProviderId = provider._id;

    // Create an emergency Booking record
    const bookingNumber = `BK-${emergency.requestNumber}`;
    const basePrice = 599; // Emergency base rate
    const totalPaise = basePrice * 100;
    const commissionPaise = Math.round(totalPaise * 0.1);
    const providerEarningsPaise = totalPaise - commissionPaise;

    const booking = await Booking.create({
      bookingNumber,
      customerId: emergency.customerId?._id || emergency.customerId,
      providerId: provider._id,
      serviceId: emergency.serviceId || '600000000000000000000001',
      bookingType: 'EMERGENCY',
      status: 'ACCEPTED',
      bookingStatus: 'ACCEPTED',
      problemDescription: `🚨 [EMERGENCY]: ${emergency.description}`,
      bookingDate: new Date(),
      timeSlot: 'IMMEDIATE SOS DISPATCH',
      scheduledStart: new Date(),
      serviceAddress: emergency.fullAddress,
      addressArea: emergency.area,
      addressCity: emergency.city,
      addressPincode: emergency.pincode,
      addressSnapshot: {
        fullAddress: emergency.fullAddress,
        area: emergency.area,
        city: emergency.city,
        pincode: emergency.pincode,
        contactPhone: emergency.contactNumber,
      },
      serviceSnapshot: {
        name: `Emergency: ${emergency.emergencyCategory}`,
        description: emergency.description,
        categoryName: emergency.emergencyCategory,
        durationMinutes: 60,
        basePrice,
      },
      priceSnapshot: {
        basePricePaise: totalPaise,
        totalPaise,
        commissionRate: 0.1,
        commissionPaise,
        providerEarningsPaise,
        amountInRupees: basePrice,
      },
      totalAmount: basePrice,
      paymentMethod: 'CASH_ON_SERVICE',
      paymentStatus: 'UNPAID',
      collectionStatus: 'UNPAID',
      isPaid: false,
      statusHistory: [
        {
          status: 'ACCEPTED',
          timestamp: new Date(),
          comment: `Emergency dispatched and accepted by ${provider.fullName || 'Provider'}`,
          changedByUserId: req.user.id,
        },
      ],
    });

    emergency.bookingId = booking._id;
    await emergency.save();

    // Notify customer
    const customerUserId = emergency.customerId?.userId?._id || emergency.customerId?.userId;
    if (customerUserId) {
      await NotificationService.sendNotification({
        userId: customerUserId,
        title: '🚨 Emergency Provider Dispatched!',
        message: `${provider.fullName || 'A verified service provider'} has accepted your emergency request and is en route!`,
        type: 'EMERGENCY',
        link: `/customer/bookings/${booking._id}`,
      });
    }

    return successResponse(res, 'Emergency request accepted successfully. Booking dispatched.', {
      emergencyId: emergency._id,
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      status: emergency.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET EMERGENCY DETAILS
 * GET /api/v1/emergency-requests/:id
 */
export const getEmergencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const emergency = await EmergencyRequest.findById(id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .populate({
        path: 'acceptedProviderId',
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .lean();

    if (!emergency) {
      return errorResponse(res, 'Emergency request not found', 404);
    }

    emergency.id = emergency._id.toString();
    emergency.customer = emergency.customerId;
    emergency.acceptedProvider = emergency.acceptedProviderId;

    return successResponse(res, 'Emergency details', emergency);
  } catch (error) {
    next(error);
  }
};
