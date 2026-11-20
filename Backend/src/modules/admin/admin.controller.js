import mongoose from 'mongoose';
import {
  User,
  CustomerProfile,
  ProviderProfile,
  ShopProfile,
  Booking,
  Payment,
  Notification,
  PlatformSetting,
  Complaint,
  Subscription,
  SubscriptionPlan,
  AuditLog,
  Category,
  Service,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

/**
 * 1. GET /api/v1/admin/dashboard
 * Live administrative statistics derived purely from MongoDB
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalShops,
      pendingShopApprovals,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      openComplaints,
      emergencyTotal,
      activeEmergency,
      allCompletedBookings,
      allBookings,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      ProviderProfile.countDocuments(),
      ProviderProfile.countDocuments({ verificationStatus: 'APPROVED' }),
      ProviderProfile.countDocuments({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      }),
      ShopProfile.countDocuments(),
      ShopProfile.countDocuments({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_REVIEW', 'UNDER_REVIEW'] } }),
      Booking.countDocuments({ bookingType: 'EMERGENCY' }),
      Booking.countDocuments({
        bookingType: 'EMERGENCY',
        status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
      }),
      Booking.find({ status: 'COMPLETED' }).select('totalAmount isPaid paymentMethod'),
      Booking.find().select('totalAmount isPaid paymentMethod status'),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({ path: 'customerId', populate: { path: 'userId', select: 'fullName email mobile' } })
        .populate({ path: 'providerId', populate: { path: 'userId', select: 'fullName email mobile' } })
        .populate('serviceId', 'name basePrice'),
    ]);

    // Financial summaries (Cash on Service / Pay Later fixed pricing)
    const totalGrossRevenue = allCompletedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const cashCollected = allCompletedBookings
      .filter((b) => b.isPaid || b.paymentMethod === 'CASH_ON_SERVICE' || b.paymentMethod === 'CASH')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const payLaterPending = allBookings
      .filter((b) => !b.isPaid && b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Platform commission (10% standard rule)
    const commissionSetting = await PlatformSetting.findOne({ key: 'platformCommissionPct' });
    const commissionPct = commissionSetting ? parseFloat(commissionSetting.value) || 10 : 10;
    const platformCommission = Math.round(totalGrossRevenue * (commissionPct / 100) * 100) / 100;
    const providerDisbursements = Math.round((totalGrossRevenue - platformCommission) * 100) / 100;

    return successResponse(res, 'Admin dashboard metrics retrieved', {
      totalCustomers,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalShops,
      pendingShopApprovals,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalGrossRevenue,
      platformCommission,
      cashCollectionSummaries: {
        totalGrossVolume: totalGrossRevenue,
        cashCollected,
        payLaterPending,
      },
      platformCommissionSummaries: {
        ratePct: commissionPct,
        totalCommissionEarned: platformCommission,
        providerDisbursements,
      },
      openComplaints,
      emergencyRequestSummaries: {
        totalEmergency: emergencyTotal,
        activeEmergency,
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/v1/admin/users
 * Search and filter platform user accounts
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, status, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (role) query.role = role.toUpperCase();
    if (status) query.accountStatus = status.toUpperCase();
    if (isActive !== undefined) {
      query.accountStatus = isActive === 'true' ? 'ACTIVE' : { $in: ['SUSPENDED', 'DISABLED'] };
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customerProfile')
        .populate('providerProfile')
        .populate('shopProfile'),
      User.countDocuments(query),
    ]);

    return successResponse(
      res,
      'Users retrieved',
      users.map((u) => u.toSafeJSON ? u.toSafeJSON() : u),
      200,
      {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PATCH /api/v1/admin/users/:id/status
 * Suspend, reactivate, or disable user account
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus, isActive, reason = '' } = req.body;

    const statusToSet = accountStatus
      ? accountStatus.toUpperCase()
      : isActive === false || isActive === 'false'
      ? 'SUSPENDED'
      : 'ACTIVE';

    if (!['ACTIVE', 'SUSPENDED', 'DISABLED'].includes(statusToSet)) {
      return errorResponse(res, 'Invalid account status. Must be ACTIVE, SUSPENDED, or DISABLED', 400);
    }

    // Prevent admin from suspending their own active account
    if (id === (req.user._id || req.user.id).toString() && statusToSet !== 'ACTIVE') {
      return errorResponse(res, 'Administrators cannot suspend their own active account', 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: statusToSet },
      { new: true }
    );

    if (!user) return errorResponse(res, 'User not found', 404);

    await logAuditEvent(
      req,
      'ADMIN_UPDATE_USER_STATUS',
      { targetUserId: id, status: statusToSet, reason },
      req.user._id || req.user.id
    );

    return successResponse(
      res,
      `User account status updated to ${statusToSet}`,
      user.toSafeJSON ? user.toSafeJSON() : user
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/v1/admin/providers
 * List providers with KYC status and details
 */
export const getProviders = async (req, res, next) => {
  try {
    const { verificationStatus, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus.toUpperCase();
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { primaryCategory: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { servicePincode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [providers, total] = await Promise.all([
      ProviderProfile.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({ path: 'userId', select: 'fullName email mobile accountStatus avatarUrl' }),
      ProviderProfile.countDocuments(query),
    ]);

    return successResponse(res, 'Providers retrieved', providers, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/v1/admin/providers/:id/approve
 */
export const approveProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = 'All submitted documents verified.' } = req.body;

    const provider = await ProviderProfile.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'APPROVED',
        verificationNotes: notes,
        rejectionReason: null,
      },
      { new: true }
    ).populate('userId');

    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    if (provider.userId?._id) {
      await User.findByIdAndUpdate(provider.userId._id, { emailVerified: true });
      await Notification.create({
        userId: provider.userId._id,
        title: 'Provider Account Verified',
        message: 'Congratulations! Your SevaSetu provider account has been approved. You are now live to accept customer bookings.',
        type: 'SYSTEM',
        link: '/provider/dashboard',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_APPROVE_PROVIDER',
      { providerId: id, notes },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Provider successfully approved and verified', provider);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. POST /api/v1/admin/providers/:id/reject
 */
export const rejectProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return errorResponse(res, 'A clear rejection reason is required', 400);
    }

    const provider = await ProviderProfile.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      },
      { new: true }
    ).populate('userId');

    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    if (provider.userId?._id) {
      await Notification.create({
        userId: provider.userId._id,
        title: 'Verification Not Approved',
        message: `Your provider verification could not be approved. Reason: ${rejectionReason.trim()}`,
        type: 'SYSTEM',
        link: '/provider/verification',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_REJECT_PROVIDER',
      { providerId: id, rejectionReason: rejectionReason.trim() },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Provider verification marked as rejected', provider);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy alias: PATCH /api/v1/admin/providers/:id/verify
 */
export const verifyProvider = async (req, res, next) => {
  const { status, rejectionReason, notes } = req.body;
  if (status === 'APPROVED') {
    req.body.notes = notes || 'Approved';
    return approveProvider(req, res, next);
  } else if (status === 'REJECTED') {
    req.body.rejectionReason = rejectionReason || 'Verification requirements not satisfied';
    return rejectProvider(req, res, next);
  } else if (status === 'SUSPENDED') {
    const provider = await ProviderProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'SUSPENDED' },
      { new: true }
    );
    return successResponse(res, 'Provider suspended', provider);
  } else {
    return errorResponse(res, 'Invalid status for verification', 400);
  }
};

/**
 * GET /api/v1/admin/verifications
 * Retrieve pending queues for providers and shops
 */
export const getPendingVerifications = async (req, res, next) => {
  try {
    const [pendingProviders, pendingShops] = await Promise.all([
      ProviderProfile.find({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      })
        .sort({ createdAt: -1 })
        .populate({ path: 'userId', select: 'fullName email mobile avatarUrl' }),
      ShopProfile.find({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      })
        .sort({ createdAt: -1 })
        .populate({ path: 'userId', select: 'fullName email mobile avatarUrl' }),
    ]);

    return successResponse(res, 'Pending verifications retrieved', {
      providers: pendingProviders,
      shops: pendingShops,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET /api/v1/admin/shops
 */
export const getShops = async (req, res, next) => {
  try {
    const { verificationStatus, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus.toUpperCase();
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { pincode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [shops, total] = await Promise.all([
      ShopProfile.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({ path: 'userId', select: 'fullName email mobile accountStatus' }),
      ShopProfile.countDocuments(query),
    ]);

    return successResponse(res, 'Shops retrieved', shops, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. POST /api/v1/admin/shops/:id/approve
 */
export const approveShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await ShopProfile.findByIdAndUpdate(
      id,
      { verificationStatus: 'APPROVED' },
      { new: true }
    ).populate('userId');

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    if (shop.userId?._id) {
      await Notification.create({
        userId: shop.userId._id,
        title: 'Shop Approved',
        message: `Your shop "${shop.shopName}" is now verified and live in the SevaSetu directory.`,
        type: 'SYSTEM',
        link: '/shop/dashboard',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_APPROVE_SHOP',
      { shopId: id, shopName: shop.shopName },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Shop storefront approved', shop);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. POST /api/v1/admin/shops/:id/reject
 */
export const rejectShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason = 'Store verification requirements not met' } = req.body;

    const shop = await ShopProfile.findByIdAndUpdate(
      id,
      { verificationStatus: 'REJECTED' },
      { new: true }
    ).populate('userId');

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    if (shop.userId?._id) {
      await Notification.create({
        userId: shop.userId._id,
        title: 'Shop Verification Update',
        message: `Your storefront "${shop.shopName}" was not approved. ${rejectionReason}`,
        type: 'SYSTEM',
        link: '/shop/verification',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_REJECT_SHOP',
      { shopId: id, rejectionReason },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Shop storefront rejected', shop);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy alias: PATCH /api/v1/admin/shops/:id/verify
 */
export const verifyShop = async (req, res, next) => {
  const { status, rejectionReason } = req.body;
  if (status === 'APPROVED') {
    return approveShop(req, res, next);
  } else if (status === 'REJECTED') {
    req.body.rejectionReason = rejectionReason;
    return rejectShop(req, res, next);
  } else {
    const shop = await ShopProfile.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
    return successResponse(res, `Shop status updated to ${status}`, shop);
  }
};

/**
 * 10. GET /api/v1/admin/bookings
 * Comprehensive platform bookings monitor with cash collection audit
 */
export const getAdminBookings = async (req, res, next) => {
  try {
    const {
      status,
      bookingType,
      isPaid,
      paymentMethod,
      search,
      page = 1,
      limit = 30,
    } = req.query;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (bookingType) query.bookingType = bookingType.toUpperCase();
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    if (paymentMethod) query.paymentMethod = paymentMethod.toUpperCase();

    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { serviceAddress: { $regex: search, $options: 'i' } },
        { addressCity: { $regex: search, $options: 'i' } },
        { addressPincode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'customerId',
          populate: { path: 'userId', select: 'fullName email mobile avatarUrl' },
        })
        .populate({
          path: 'providerId',
          populate: { path: 'userId', select: 'fullName email mobile avatarUrl' },
        })
        .populate('serviceId', 'name basePrice durationMinutes imageUrl'),
      Booking.countDocuments(query),
    ]);

    // Financial calculations for the selected filter set
    const totalVolume = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const commissionEstimate = Math.round(totalVolume * 0.1 * 100) / 100;

    return successResponse(res, 'Admin bookings retrieved', bookings, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      summary: {
        totalVolume,
        commissionEstimate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. GET /api/v1/admin/reports
 * Real-time MongoDB business aggregations
 */
export const getAdminReports = async (req, res, next) => {
  try {
    // 1. User growth and distribution
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // 2. Booking status distribution
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalVolume: { $sum: '$totalAmount' } } },
    ]);

    // 3. Category demand
    const categoryPopularity = await Booking.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'service.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          bookingsCount: { $sum: 1 },
          volume: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookingsCount: -1 } },
    ]);

    // 4. Cash collections and disbursements
    const completedBookings = await Booking.find({ status: 'COMPLETED' }).select('totalAmount paymentMethod isPaid');
    const totalGrossRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformCommission = Math.round(totalGrossRevenue * 0.1 * 100) / 100;
    const providerDisbursements = Math.round((totalGrossRevenue - platformCommission) * 100) / 100;

    // 5. Provider verification statistics
    const providerStats = await ProviderProfile.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]);

    // 6. Complaint resolution metrics
    const complaintStats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 7. Subscription usage
    const subscriptionStats = await Subscription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalPaid: { $sum: '$totalPaid' } } },
    ]);

    return successResponse(res, 'Admin business reports retrieved', {
      usersByRole,
      bookingsByStatus,
      categoryPopularity: categoryPopularity.map((c) => ({
        category: c._id || 'Uncategorized',
        bookingsCount: c.bookingsCount,
        volume: c.volume,
      })),
      cashCollection: {
        totalGrossRevenue,
        platformCommission,
        providerDisbursements,
      },
      providerStats,
      complaintStats,
      subscriptionStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 12. GET /api/v1/admin/settings & PATCH /api/v1/admin/settings
 */
export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSetting.find().sort({ key: 1 });
    return successResponse(res, 'Platform settings', settings);
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key) return errorResponse(res, 'Setting key is required', 400);

    const setting = await PlatformSetting.findOneAndUpdate(
      { key },
      {
        key,
        value,
        ...(description && { description }),
      },
      { upsert: true, new: true }
    );

    await logAuditEvent(
      req,
      'ADMIN_UPDATE_PLATFORM_SETTING',
      { key, value },
      req.user._id || req.user.id
    );

    return successResponse(res, `Platform setting '${key}' updated`, setting);
  } catch (error) {
    next(error);
  }
};

/**
 * 13. GET /api/v1/admin/audit-logs
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = { $regex: action, $options: 'i' };
    if (userId) query.userId = userId;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'fullName email role'),
      AuditLog.countDocuments(query),
    ]);

    return successResponse(res, 'Audit logs retrieved', logs, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};
