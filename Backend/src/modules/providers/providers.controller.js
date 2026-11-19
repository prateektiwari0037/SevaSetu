import mongoose from 'mongoose';
import {
  ProviderProfile,
  ProviderService,
  Service,
  Category,
  Booking,
  Review,
  Notification,
  User,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

/**
 * Helper to get provider profile for logged-in user
 */
async function getOrCreateProviderProfile(userId, userObj = {}) {
  let profile = await ProviderProfile.findOne({ userId });
  if (!profile) {
    profile = await ProviderProfile.create({
      userId,
      fullName: userObj.fullName || '',
      verificationStatus: 'DRAFT',
      city: 'Mumbai',
      servicePincode: '400001',
      isAvailable: true,
    });
  }
  return profile;
}

// -------------------------------------------------------------
// 1. PROVIDER PROFILE & ONBOARDING
// -------------------------------------------------------------

export const getMyProviderProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);
    await profile.populate([
      { path: 'userId', select: 'fullName email phone avatarUrl role' },
      { path: 'categoryIds', select: 'name slug iconUrl' },
      { path: 'serviceIds', select: 'name slug basePrice' },
    ]);

    // Also get active offered services count
    const servicesCount = await ProviderService.countDocuments({
      providerId: profile._id,
      isActive: true,
    });

    const responseData = profile.toObject();
    responseData.servicesCount = servicesCount;

    return successResponse(res, 'Provider profile retrieved successfully', responseData);
  } catch (error) {
    next(error);
  }
};

export const updateMyProviderProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const {
      fullName,
      businessName,
      bio,
      avatarUrl,
      experienceYears,
      skills,
      primaryCategory,
      categoryIds,
      serviceIds,
      city,
      area,
      servicePincode,
      serviceAreas,
      serviceRadiusKm,
      isAvailable,
    } = req.body;

    if (fullName !== undefined) {
      profile.fullName = fullName;
      await User.findByIdAndUpdate(req.user.id, { fullName });
    }
    if (businessName !== undefined) profile.businessName = businessName;
    if (bio !== undefined) profile.bio = bio;
    if (avatarUrl !== undefined) {
      profile.avatarUrl = avatarUrl;
      await User.findByIdAndUpdate(req.user.id, { avatarUrl });
    }
    if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears) || 0;
    if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills : [];
    if (primaryCategory !== undefined) profile.primaryCategory = primaryCategory;
    if (categoryIds !== undefined) profile.categoryIds = categoryIds;
    if (serviceIds !== undefined) profile.serviceIds = serviceIds;
    if (city !== undefined) profile.city = city;
    if (area !== undefined) profile.area = area;
    if (servicePincode !== undefined) profile.servicePincode = servicePincode;
    if (serviceAreas !== undefined) profile.serviceAreas = serviceAreas;
    if (serviceRadiusKm !== undefined) profile.serviceRadiusKm = Number(serviceRadiusKm) || 10;
    if (isAvailable !== undefined) profile.isAvailable = Boolean(isAvailable);

    await profile.save();

    return successResponse(res, 'Provider profile updated successfully', profile);
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 2. KYC VERIFICATION
// -------------------------------------------------------------

export const getVerificationStatus = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    return successResponse(res, 'Verification status retrieved', {
      verificationStatus: profile.verificationStatus,
      verificationNotes: profile.verificationNotes || '',
      documents: profile.documents || [],
      canResubmit: ['REJECTED', 'DRAFT'].includes(profile.verificationStatus),
    });
  } catch (error) {
    next(error);
  }
};

export const submitVerification = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    if (profile.verificationStatus === 'APPROVED') {
      return errorResponse(res, 'Profile is already verified and approved', 400);
    }
    if (profile.verificationStatus === 'SUSPENDED') {
      return errorResponse(res, 'Account is suspended. Contact support.', 403);
    }

    const { documentType, docType, documentUrl, fileUrl, notes } = req.body || {};
    const type = documentType || docType || 'ID_PROOF';
    let docUrl = documentUrl || fileUrl;
    let originalName = '';
    let mimeType = '';
    let size = 0;

    if (req.file) {
      // Private upload path (no public directory exposure)
      docUrl = `/uploads/${req.file.filename}`;
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
      size = req.file.size;
    }

    if (!docUrl) {
      return errorResponse(res, 'Please upload a verification document', 400);
    }

    // Append document to documents list
    profile.documents.push({
      documentType,
      documentUrl: docUrl,
      originalName,
      mimeType,
      size,
      status: 'PENDING',
      verified: false,
      uploadedAt: new Date(),
    });

    profile.verificationStatus = 'PENDING';
    if (notes) profile.verificationNotes = notes;

    await profile.save();

    // Create a notification for provider
    await Notification.create({
      userId: req.user.id,
      title: 'KYC Verification Submitted',
      message: 'Your verification documents have been submitted and are under review.',
      type: 'VERIFICATION',
      data: { status: 'PENDING' },
    });

    return successResponse(res, 'Verification documents submitted successfully', {
      verificationStatus: profile.verificationStatus,
      documents: profile.documents,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 3. PROVIDER SERVICE MANAGEMENT (Fixed Pricing)
// -------------------------------------------------------------

export const getProviderServices = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const services = await ProviderService.find({ providerId: profile._id })
      .populate('serviceId')
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = services.map((ps) => ({
      ...ps,
      id: ps._id.toString(),
      service: ps.serviceId,
      category: ps.categoryId,
    }));

    return successResponse(res, 'Provider services retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const addProviderService = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    if (profile.verificationStatus === 'SUSPENDED') {
      return errorResponse(res, 'Suspended providers cannot add services', 403);
    }

    const { serviceId, fixedPrice, customPrice, estimatedDurationMinutes, description } = req.body;

    if (!serviceId) {
      return errorResponse(res, 'Platform serviceId is required', 400);
    }

    // Verify service exists on platform (Providers must choose from approved categories/services)
    const platformService = await Service.findById(serviceId);
    if (!platformService) {
      return errorResponse(res, 'Selected platform service does not exist', 404);
    }

    const price = fixedPrice !== undefined ? Number(fixedPrice) : (customPrice !== undefined ? Number(customPrice) : platformService.basePrice);
    if (isNaN(price) || price < 0) {
      return errorResponse(res, 'Valid fixed price is required (INR)', 400);
    }

    // Check if provider already offers this service
    const existing = await ProviderService.findOne({
      providerId: profile._id,
      serviceId,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.fixedPrice = price;
        if (estimatedDurationMinutes) {
          existing.estimatedDurationMinutes = Number(estimatedDurationMinutes);
        }
        if (description !== undefined) existing.description = description;
        await existing.save();
        return successResponse(res, 'Service re-activated for your profile', existing);
      }
      return errorResponse(res, 'You have already added this service offering', 409);
    }

    const newProviderService = await ProviderService.create({
      providerId: profile._id,
      serviceId: platformService._id,
      categoryId: platformService.categoryId,
      fixedPrice: price,
      currency: 'INR',
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || platformService.durationMinutes || 60,
      description: description || platformService.description || '',
      isActive: true,
    });

    // Also add to provider's serviceIds array if not present
    if (!profile.serviceIds.includes(platformService._id)) {
      profile.serviceIds.push(platformService._id);
    }
    if (!profile.categoryIds.includes(platformService.categoryId)) {
      profile.categoryIds.push(platformService.categoryId);
    }
    await profile.save();

    await newProviderService.populate(['serviceId', 'categoryId']);

    return successResponse(res, 'Service added successfully to provider profile', newProviderService, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProviderService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const providerService = await ProviderService.findOne({
      _id: id,
      providerId: profile._id,
    });

    if (!providerService) {
      return errorResponse(res, 'Offered service not found for this provider', 404);
    }

    const { fixedPrice, estimatedDurationMinutes, description, isActive } = req.body;

    if (fixedPrice !== undefined) {
      const price = Number(fixedPrice);
      if (isNaN(price) || price < 0) {
        return errorResponse(res, 'Fixed price must be a non-negative number', 400);
      }
      providerService.fixedPrice = price;
    }
    if (estimatedDurationMinutes !== undefined) {
      providerService.estimatedDurationMinutes = Number(estimatedDurationMinutes) || 60;
    }
    if (description !== undefined) providerService.description = description;
    if (isActive !== undefined) providerService.isActive = Boolean(isActive);

    await providerService.save();

    return successResponse(res, 'Offered service updated successfully', providerService);
  } catch (error) {
    next(error);
  }
};

export const deleteProviderService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const providerService = await ProviderService.findOneAndDelete({
      _id: id,
      providerId: profile._id,
    });

    if (!providerService) {
      return errorResponse(res, 'Offered service not found', 404);
    }

    // Remove from provider's serviceIds
    profile.serviceIds = profile.serviceIds.filter(
      (sid) => sid.toString() !== providerService.serviceId.toString()
    );
    await profile.save();

    return successResponse(res, 'Offered service removed successfully');
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 4. AVAILABILITY MANAGEMENT
// -------------------------------------------------------------

export const getAvailability = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    // Fetch existing active booking blocks to prevent overlap
    const activeBookings = await Booking.find({
      providerId: profile._id,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] },
      bookingDate: { $gte: new Date() },
    })
      .select('bookingNumber bookingDate timeSlot status')
      .lean();

    return successResponse(res, 'Provider availability retrieved', {
      isAvailable: profile.isAvailable,
      weeklySchedule: profile.availability?.weeklySchedule || [],
      unavailableDates: profile.availability?.unavailableDates || [],
      timeOffBlocks: profile.availability?.timeOffBlocks || [],
      activeBookingBlocks: activeBookings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const {
      isAvailable,
      weeklySchedule,
      unavailableDates,
      timeOffBlocks,
    } = req.body;

    if (isAvailable !== undefined) {
      profile.isAvailable = Boolean(isAvailable);
    }

    if (weeklySchedule && Array.isArray(weeklySchedule)) {
      // Validate days
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      for (const item of weeklySchedule) {
        if (!validDays.includes(item.day)) {
          return errorResponse(res, `Invalid day name: ${item.day}`, 400);
        }
      }
      profile.availability.weeklySchedule = weeklySchedule;
    }

    if (unavailableDates && Array.isArray(unavailableDates)) {
      profile.availability.unavailableDates = unavailableDates.map((d) => new Date(d));
    }

    if (timeOffBlocks && Array.isArray(timeOffBlocks)) {
      profile.availability.timeOffBlocks = timeOffBlocks.map((t) => ({
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        reason: t.reason || 'Time Off',
      }));
    }

    await profile.save();

    return successResponse(res, 'Availability schedule updated successfully', {
      isAvailable: profile.isAvailable,
      availability: profile.availability,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 5. BOOKING MANAGEMENT (Provider View & Actions)
// -------------------------------------------------------------

export const getMyBookings = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const { status, date, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [{ providerId: profile._id }],
    };

    // If provider is approved, they can also see unassigned PENDING bookings in their service pincode
    if (profile.verificationStatus === 'APPROVED' && profile.isAvailable) {
      const matchPincodes = [profile.servicePincode];
      if (profile.serviceAreas && profile.serviceAreas.length > 0) {
        profile.serviceAreas.forEach((sa) => {
          if (sa.pincode) matchPincodes.push(sa.pincode);
        });
      }

      query.$or.push({
        providerId: null,
        status: 'PENDING',
        addressPincode: { $in: matchPincodes },
        ...(profile.serviceIds?.length ? { serviceId: { $in: profile.serviceIds } } : {}),
      });
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name basePrice durationMinutes imageUrl')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email phone avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Booking.countDocuments(query);

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id.toString(),
      service: b.serviceId,
      customer: b.customerId,
    }));

    return successResponse(res, 'Provider bookings retrieved', {
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

// -------------------------------------------------------------
// 6. EARNINGS DASHBOARD
// -------------------------------------------------------------

export const getEarnings = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    // Get all completed bookings for this provider
    const completedBookings = await Booking.find({
      providerId: profile._id,
      status: 'COMPLETED',
    })
      .populate('serviceId', 'name basePrice')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone' },
      })
      .sort({ updatedAt: -1 })
      .lean();

    let totalServiceValue = 0;
    let cashCollected = 0;
    let pendingCollection = 0;

    const breakdown = completedBookings.map((b) => {
      const amount = b.totalAmount || 0;
      totalServiceValue += amount;

      if (b.isPaid) {
        cashCollected += amount;
      } else {
        pendingCollection += amount;
      }

      // Platform commission 10%
      const commission = Math.round(amount * 0.1);
      const netEarnings = amount - commission;

      return {
        bookingId: b._id.toString(),
        bookingNumber: b.bookingNumber,
        serviceName: b.serviceId?.name || 'Service',
        customerName: b.customerId?.userId?.fullName || 'Customer',
        completedDate: b.updatedAt,
        grossAmount: amount,
        platformCommission: commission,
        netEarnings,
        paymentMethod: b.paymentMethod,
        isPaid: b.isPaid,
      };
    });

    const totalCommission = Math.round(totalServiceValue * 0.1);
    const providerNetEarnings = totalServiceValue - totalCommission;

    return successResponse(res, 'Earnings calculated successfully', {
      summary: {
        completedJobsCount: completedBookings.length,
        totalServiceValue,
        cashCollected,
        pendingCollection,
        platformCommission: totalCommission,
        providerNetEarnings,
        currency: 'INR',
      },
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 7. PROVIDER REVIEWS
// -------------------------------------------------------------

export const getProviderReviews = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const reviews = await Review.find({ providerId: profile._id })
      .populate('customerId', 'fullName avatarUrl')
      .populate('bookingId', 'bookingNumber serviceId')
      .sort({ createdAt: -1 })
      .lean();

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      const score = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distribution[score] = (distribution[score] || 0) + 1;
      totalScore += r.rating || 5;
    });

    const averageRating = reviews.length > 0 ? Number((totalScore / reviews.length).toFixed(1)) : 0;

    return successResponse(res, 'Provider reviews retrieved', {
      averageRating,
      totalReviews: reviews.length,
      distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 8. PORTFOLIO MANAGEMENT
// -------------------------------------------------------------

export const uploadPortfolioImage = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    const { description, imageUrl } = req.body;
    let url = imageUrl;

    if (req.file) {
      url = `/uploads/${req.file.filename}`;
    }

    if (!url) {
      return errorResponse(res, 'Image file or imageUrl is required', 400);
    }

    const portfolioItem = {
      url,
      description: description || '',
      order: profile.portfolioImages.length,
      uploadedAt: new Date(),
    };

    profile.portfolioImages.push(portfolioItem);
    await profile.save();

    return successResponse(res, 'Portfolio image added successfully', profile.portfolioImages, 201);
  } catch (error) {
    next(error);
  }
};

export const deletePortfolioImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    profile.portfolioImages = profile.portfolioImages.filter(
      (img) => img._id.toString() !== id
    );
    await profile.save();

    return successResponse(res, 'Portfolio image removed successfully', profile.portfolioImages);
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 9. DASHBOARD STATS
// -------------------------------------------------------------

export const getDashboardStats = async (req, res, next) => {
  try {
    const profile = await getOrCreateProviderProfile(req.user.id, req.user);

    // Bookings count by status
    const bookings = await Booking.find({ providerId: profile._id }).lean();

    let totalBookings = bookings.length;
    let pendingBookings = 0;
    let activeBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let totalEarnings = 0;

    bookings.forEach((b) => {
      if (b.status === 'PENDING') pendingBookings++;
      else if (['ACCEPTED', 'IN_PROGRESS'].includes(b.status)) activeBookings++;
      else if (b.status === 'COMPLETED') {
        completedBookings++;
        totalEarnings += b.totalAmount || 0;
      } else if (['REJECTED', 'CANCELLED'].includes(b.status)) cancelledBookings++;
    });

    const netEarnings = Math.round(totalEarnings * 0.9);

    // Upcoming schedule (active bookings)
    const upcomingSchedule = await Booking.find({
      providerId: profile._id,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] },
    })
      .populate('serviceId', 'name')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone' },
      })
      .sort({ bookingDate: 1 })
      .limit(5)
      .lean();

    // Recent notifications
    const recentNotifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return successResponse(res, 'Provider dashboard stats retrieved', {
      metrics: {
        totalBookings,
        pendingBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalEarnings,
        netEarnings,
      },
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      upcomingSchedule,
      recentNotifications,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 10. PUBLIC PROVIDER DIRECTORY
// -------------------------------------------------------------

export const getNearbyProviders = async (req, res, next) => {
  try {
    const { pincode, category, search } = req.query;

    const filter = {
      verificationStatus: 'APPROVED',
      isAvailable: true,
    };

    if (pincode) {
      filter.$or = [
        { servicePincode: pincode },
        { 'serviceAreas.pincode': pincode },
      ];
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const providers = await ProviderProfile.find(filter)
      .populate('userId', 'fullName avatarUrl')
      .populate('categoryIds', 'name slug')
      .lean();

    return successResponse(res, 'Nearby providers retrieved', providers);
  } catch (error) {
    next(error);
  }
};

export const getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let provider = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      provider = await ProviderProfile.findById(id)
        .populate('userId', 'fullName avatarUrl phone email')
        .populate('categoryIds')
        .lean();
    }

    if (!provider) {
      return errorResponse(res, 'Provider not found', 404);
    }

    // Get offered services
    const services = await ProviderService.find({
      providerId: provider._id,
      isActive: true,
    })
      .populate('serviceId')
      .lean();

    provider.services = services;

    return successResponse(res, 'Provider details retrieved', provider);
  } catch (error) {
    next(error);
  }
};
