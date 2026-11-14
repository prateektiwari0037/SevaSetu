import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { calculateDistanceKm } from '../../utils/distance.js';

export const createEmergencyRequest = async (req, res, next) => {
  try {
    const {
      serviceId,
      problemDescription,
      serviceAddress,
      addressPincode,
      latitude,
      longitude,
    } = req.body;

    if (!serviceId || !problemDescription || !serviceAddress) {
      return errorResponse(res, 'Service, problem description, and address are required', 400);
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return errorResponse(res, 'Customer profile required', 400);

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return errorResponse(res, 'Service not found', 404);

    const userLat = latitude ? parseFloat(latitude) : null;
    const userLon = longitude ? parseFloat(longitude) : null;

    // Find all verified, available providers for this service
    const eligibleProviders = await prisma.providerProfile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        isAvailable: true,
        services: { some: { serviceId } },
      },
      include: {
        user: true,
      },
    });

    const bookingNumber = `EMG-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    // Create Emergency Booking
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          serviceId,
          bookingType: 'EMERGENCY',
          status: 'PENDING',
          problemDescription: `🚨 [EMERGENCY SOS]: ${problemDescription}`,
          bookingDate: new Date(),
          timeSlot: 'IMMEDIATE / SOS DISPATCH',
          serviceAddress,
          addressPincode: addressPincode || '400001',
          latitude: userLat,
          longitude: userLon,
          totalAmount: service.basePrice * 1.5, // 1.5x emergency rate
          paymentMethod: 'CASH',
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          status: 'PENDING',
          comment: '🚨 Emergency SOS broadcast initiated to nearby providers',
          changedByUserId: req.user.id,
        },
      });

      // Send emergency priority notifications to all matching providers
      if (eligibleProviders.length > 0) {
        await tx.notification.createMany({
          data: eligibleProviders.map((p) => ({
            userId: p.userId,
            title: '🚨 PRIORITY EMERGENCY SOS REQUEST',
            message: `Urgent emergency nearby for ${service.name} at ${serviceAddress}! Tap immediately to accept.`,
            type: 'EMERGENCY',
            link: `/provider/bookings/${b.id}`,
          })),
        });
      }

      return b;
    });

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
    let where = {
      bookingType: 'EMERGENCY',
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (customer) where.customerId = customer.id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (provider) {
        where = {
          bookingType: 'EMERGENCY',
          OR: [
            { providerId: provider.id },
            { status: 'PENDING' }, // can accept any pending emergency in their category
          ],
        };
      }
    }

    const emergencies = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        customer: true,
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Emergency requests retrieved', emergencies);
  } catch (error) {
    next(error);
  }
};

export const getEmergencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        bookingType: 'EMERGENCY',
      },
      include: {
        service: true,
        customer: true,
        provider: true,
        statusHistory: true,
      },
    });

    if (!booking) return errorResponse(res, 'Emergency request not found', 404);

    return successResponse(res, 'Emergency details', booking);
  } catch (error) {
    next(error);
  }
};
