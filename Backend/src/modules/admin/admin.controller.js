import User from '../../models/User.js';
import ProviderProfile from '../../models/ProviderProfile.js';
import ShopProfile from '../../models/ShopProfile.js';
import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import Notification from '../../models/Notification.js';
import PlatformSetting from '../../models/PlatformSetting.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalShops,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      payments,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      ProviderProfile.countDocuments(),
      ProviderProfile.countDocuments({ verificationStatus: 'APPROVED' }),
      ProviderProfile.countDocuments({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      }),
      ShopProfile.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Payment.find({ status: 'PAID' }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer')
        .populate('provider')
        .populate('service'),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const platformCommission = Math.round(totalRevenue * 0.1 * 100) / 100;

    return successResponse(res, 'Admin dashboard metrics retrieved', {
      totalCustomers,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalShops,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      platformCommission,
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, search, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
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

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .populate('customerProfile')
      .populate('providerProfile')
      .populate('shopProfile');

    return successResponse(
      res,
      'Users retrieved',
      users.map((u) => u.toSafeJSON())
    );
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, accountStatus } = req.body;

    const statusToSet = accountStatus
      ? accountStatus
      : isActive === false || isActive === 'false'
      ? 'SUSPENDED'
      : 'ACTIVE';

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: statusToSet },
      { new: true }
    );

    if (!user) return errorResponse(res, 'User not found', 404);

    await logAuditEvent(
      req,
      'ADMIN_UPDATE_USER_STATUS',
      { targetUserId: id, status: statusToSet },
      req.user._id
    );

    return successResponse(
      res,
      `User account status updated to ${statusToSet}`,
      user.toSafeJSON()
    );
  } catch (error) {
    next(error);
  }
};

export const getProviders = async (req, res, next) => {
  try {
    const { verificationStatus, search } = req.query;

    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { primaryCategory: { $regex: search, $options: 'i' } },
      ];
    }

    const providers = await ProviderProfile.find(query)
      .sort({ createdAt: -1 })
      .populate('user');

    return successResponse(res, 'Providers retrieved', providers);
  } catch (error) {
    next(error);
  }
};

export const verifyProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING', 'PENDING_VERIFICATION'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid verification status', 400);
    }

    const provider = await ProviderProfile.findByIdAndUpdate(
      id,
      {
        verificationStatus: status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      { new: true }
    ).populate('user');

    if (!provider) return errorResponse(res, 'Provider profile not found', 404);

    if (provider.userId) {
      await User.findByIdAndUpdate(provider.userId, {
        emailVerified: status === 'APPROVED' ? true : undefined,
      });

      await Notification.create({
        userId: provider.userId,
        title: `Provider Verification: ${status}`,
        message:
          status === 'APPROVED'
            ? 'Congratulations! Your SevaSetu provider profile has been approved. You can now accept customer bookings.'
            : `Your provider verification status has been updated to ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        type: 'SYSTEM',
        link: '/provider/dashboard',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_VERIFY_PROVIDER',
      { providerId: id, status, rejectionReason },
      req.user._id
    );

    return successResponse(res, `Provider marked as ${status}`, provider);
  } catch (error) {
    next(error);
  }
};

export const getPendingVerifications = async (req, res, next) => {
  try {
    const [pendingProviders, pendingShops] = await Promise.all([
      ProviderProfile.find({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      })
        .sort({ createdAt: -1 })
        .populate('user'),
      ShopProfile.find({
        verificationStatus: { $in: ['PENDING', 'PENDING_VERIFICATION'] },
      })
        .sort({ createdAt: -1 })
        .populate('user'),
    ]);

    return successResponse(res, 'Pending verifications retrieved', {
      providers: pendingProviders,
      shops: pendingShops,
    });
  } catch (error) {
    next(error);
  }
};

export const getShops = async (req, res, next) => {
  try {
    const { verificationStatus, search } = req.query;
    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
      ];
    }

    const shops = await ShopProfile.find(query).sort({ createdAt: -1 }).populate('user');
    return successResponse(res, 'Shops retrieved', shops);
  } catch (error) {
    next(error);
  }
};

export const verifyShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const shop = await ShopProfile.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true }
    );

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    if (shop.userId) {
      await Notification.create({
        userId: shop.userId,
        title: `Shop Verification Status: ${status}`,
        message: `Your storefront "${shop.shopName}" verification status is now ${status}.`,
        type: 'SYSTEM',
        link: '/shop/dashboard',
      });
    }

    await logAuditEvent(
      req,
      'ADMIN_VERIFY_SHOP',
      { shopId: id, status },
      req.user._id
    );

    return successResponse(res, `Shop verification updated to ${status}`, shop);
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSetting.find();
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

    return successResponse(res, 'Setting updated', setting);
  } catch (error) {
    next(error);
  }
};
