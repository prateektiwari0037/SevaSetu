import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { calculateDistanceKm } from '../../utils/distance.js';

export const getNearbyProviders = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      pincode,
      category,
      minRating,
      isAvailable,
      search,
      sortBy = 'rating', // rating, distance, experience
    } = req.query;

    const userLat = latitude ? parseFloat(latitude) : null;
    const userLon = longitude ? parseFloat(longitude) : null;

    const where = {
      verificationStatus: 'APPROVED',
      user: { isActive: true },
      ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' }),
      ...(pincode && {
        OR: [
          { servicePincode: pincode },
          { serviceAreas: { some: { pincode } } },
        ],
      }),
      ...(category && {
        OR: [
          { primaryCategory: { contains: category, mode: 'insensitive' } },
          {
            services: {
              some: {
                service: {
                  OR: [
                    { categoryId: category },
                    { category: { slug: category } },
                    { category: { name: { contains: category, mode: 'insensitive' } } },
                  ],
                },
              },
            },
          },
        ],
      }),
      ...(minRating && {
        ratingAverage: { gte: parseFloat(minRating) },
      }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
          { primaryCategory: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    let providers = await prisma.providerProfile.findMany({
      where,
      include: {
        services: {
          where: { isActive: true },
          include: { service: { include: { category: true } } },
        },
        portfolio: true,
        availability: true,
        serviceAreas: true,
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    // Calculate distance and annotate
    const providersWithDistance = providers.map((p) => {
      let distanceKm = null;
      if (userLat && userLon && p.latitude && p.longitude) {
        distanceKm = calculateDistanceKm(userLat, userLon, p.latitude, p.longitude);
      }
      return {
        ...p,
        distanceKm,
      };
    });

    // Sorting
    if (sortBy === 'distance' && userLat && userLon) {
      providersWithDistance.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'experience') {
      providersWithDistance.sort((a, b) => b.experienceYears - a.experienceYears);
    } else {
      // Default highest rated
      providersWithDistance.sort((a, b) => b.ratingAverage - a.ratingAverage);
    }

    return successResponse(res, 'Providers retrieved', providersWithDistance);
  } catch (error) {
    next(error);
  }
};

export const getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await prisma.providerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        services: {
          where: { isActive: true },
          include: { service: { include: { category: true } } },
        },
        portfolio: true,
        availability: true,
        serviceAreas: true,
        reviews: {
          include: {
            customer: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    return successResponse(res, 'Provider profile retrieved', provider);
  } catch (error) {
    next(error);
  }
};

export const getMyProviderProfile = async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        services: {
          include: { service: { include: { category: true } } },
        },
        documents: true,
        portfolio: true,
        availability: true,
        serviceAreas: true,
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', 404);
    }

    return successResponse(res, 'Provider profile retrieved', provider);
  } catch (error) {
    next(error);
  }
};

export const updateMyProviderProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      businessName,
      bio,
      avatarUrl,
      experienceYears,
      skills,
      primaryCategory,
      servicePincode,
      serviceRadiusKm,
      latitude,
      longitude,
      isAvailable,
    } = req.body;

    const provider = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(businessName !== undefined && { businessName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
        ...(skills !== undefined && { skills: Array.isArray(skills) ? skills : [skills] }),
        ...(primaryCategory !== undefined && { primaryCategory }),
        ...(servicePincode !== undefined && { servicePincode }),
        ...(serviceRadiusKm !== undefined && { serviceRadiusKm: parseFloat(serviceRadiusKm) }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return successResponse(res, 'Provider profile updated', provider);
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    const { docType, documentNumber, fileUrl } = req.body;
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    const doc = await prisma.providerDocument.create({
      data: {
        providerId: provider.id,
        docType: docType || 'IDENTITY_PROOF',
        documentNumber,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : fileUrl,
        verificationStatus: 'PENDING',
      },
    });

    // Also notify admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'New Provider Document Uploaded',
          message: `${provider.fullName} has submitted a new verification document for review.`,
          type: 'VERIFICATION',
          link: '/admin/verifications',
        })),
      });
    }

    return successResponse(res, 'Document submitted for verification', doc, 201);
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        fullName: true,
        verificationStatus: true,
        rejectionReason: true,
        documents: true,
      },
    });

    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    return successResponse(res, 'Verification status retrieved', provider);
  } catch (error) {
    next(error);
  }
};

export const getProviderServices = async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    const services = await prisma.providerService.findMany({
      where: { providerId: provider.id },
      include: {
        service: {
          include: { category: true },
        },
      },
    });

    return successResponse(res, 'Provider services retrieved', services);
  } catch (error) {
    next(error);
  }
};

export const addProviderService = async (req, res, next) => {
  try {
    const { serviceId, customPrice, pricingType, experienceMonths } = req.body;
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    const providerService = await prisma.providerService.upsert({
      where: {
        providerId_serviceId: {
          providerId: provider.id,
          serviceId,
        },
      },
      update: {
        customPrice: customPrice ? parseFloat(customPrice) : null,
        pricingType: pricingType || 'FIXED',
        experienceMonths: experienceMonths ? parseInt(experienceMonths) : 12,
        isActive: true,
      },
      create: {
        providerId: provider.id,
        serviceId,
        customPrice: customPrice ? parseFloat(customPrice) : null,
        pricingType: pricingType || 'FIXED',
        experienceMonths: experienceMonths ? parseInt(experienceMonths) : 12,
        isActive: true,
      },
      include: { service: true },
    });

    return successResponse(res, 'Service added to provider profile', providerService, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProviderService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customPrice, pricingType, experienceMonths, isActive } = req.body;

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    const updated = await prisma.providerService.update({
      where: { id },
      data: {
        ...(customPrice !== undefined && {
          customPrice: customPrice ? parseFloat(customPrice) : null,
        }),
        ...(pricingType && { pricingType }),
        ...(experienceMonths !== undefined && {
          experienceMonths: parseInt(experienceMonths),
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { service: true },
    });

    return successResponse(res, 'Service updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProviderService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.providerService.delete({ where: { id } });
    return successResponse(res, 'Service removed from profile');
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { availability, isAvailable } = req.body;
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    await prisma.$transaction(async (tx) => {
      if (isAvailable !== undefined) {
        await tx.providerProfile.update({
          where: { id: provider.id },
          data: { isAvailable },
        });
      }

      if (Array.isArray(availability)) {
        await tx.providerAvailability.deleteMany({
          where: { providerId: provider.id },
        });

        await tx.providerAvailability.createMany({
          data: availability.map((slot) => ({
            providerId: provider.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime || '09:00',
            endTime: slot.endTime || '18:00',
            isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
          })),
        });
      }
    });

    const updated = await prisma.providerAvailability.findMany({
      where: { providerId: provider.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return successResponse(res, 'Availability updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getEarnings = async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    const commissions = await prisma.platformCommission.findMany({
      where: { providerId: provider.id },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                service: true,
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedBookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: 'COMPLETED',
      },
      include: { service: true, customer: true, payments: true },
      orderBy: { completedAt: 'desc' },
    });

    const totalEarnings = commissions.reduce((sum, c) => sum + c.providerEarning, 0);
    const totalPlatformCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    return successResponse(res, 'Earnings data retrieved', {
      totalEarnings,
      totalPlatformCommissions,
      completedJobsCount: completedBookings.length,
      recentCommissions: commissions.slice(0, 10),
      completedBookings: completedBookings.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};
