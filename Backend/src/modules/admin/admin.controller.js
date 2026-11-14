import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

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
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.providerProfile.count(),
      prisma.providerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.shopProfile.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.findMany({ where: { status: 'SUCCESSFUL' } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, provider: true, service: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
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

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { customerProfile: { fullName: { contains: search, mode: 'insensitive' } } },
          { providerProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        customerProfile: true,
        providerProfile: true,
        shopProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Users retrieved', users);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: { id: true, email: true, role: true, isActive: true },
    });

    return successResponse(res, `User ${isActive ? 'reactivated' : 'suspended'} successfully`, user);
  } catch (error) {
    next(error);
  }
};

export const getProviders = async (req, res, next) => {
  try {
    const { verificationStatus, search } = req.query;

    const where = {
      ...(verificationStatus && { verificationStatus }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
          { primaryCategory: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, phone: true, isActive: true } },
        documents: true,
        services: { include: { service: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Providers retrieved', providers);
  } catch (error) {
    next(error);
  }
};

export const verifyProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // APPROVED, REJECTED, SUSPENDED

    if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
      return errorResponse(res, 'Invalid verification status', 400);
    }

    const provider = await prisma.$transaction(async (tx) => {
      const p = await tx.providerProfile.update({
        where: { id },
        data: {
          verificationStatus: status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
        include: { user: true },
      });

      // Update user isVerified flag
      await tx.user.update({
        where: { id: p.userId },
        data: { isVerified: status === 'APPROVED' },
      });

      // Notify provider
      await tx.notification.create({
        data: {
          userId: p.userId,
          title: `Verification Status: ${status}`,
          message:
            status === 'APPROVED'
              ? 'Congratulations! Your SevaSetu provider profile has been approved. You can now accept public bookings.'
              : `Your provider verification was marked ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          type: 'VERIFICATION',
          link: '/provider/verification',
        },
      });

      return p;
    });

    return successResponse(res, `Provider marked as ${status}`, provider);
  } catch (error) {
    next(error);
  }
};

export const getPendingVerifications = async (req, res, next) => {
  try {
    const [pendingProviders, pendingShops] = await Promise.all([
      prisma.providerProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        include: {
          user: { select: { email: true, phone: true, createdAt: true } },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        include: {
          user: { select: { email: true, phone: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
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
    const where = {
      ...(verificationStatus && { verificationStatus }),
      ...(search && {
        OR: [
          { shopName: { contains: search, mode: 'insensitive' } },
          { ownerName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const shops = await prisma.shopProfile.findMany({
      where,
      include: {
        user: { select: { email: true, phone: true, isActive: true } },
        _count: { select: { catalogItems: true, inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Shops retrieved', shops);
  } catch (error) {
    next(error);
  }
};

export const verifyShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const shop = await prisma.shopProfile.update({
      where: { id },
      data: { verificationStatus: status },
      include: { user: true },
    });

    await prisma.notification.create({
      data: {
        userId: shop.userId,
        title: `Shop Verification Status: ${status}`,
        message: `Your shop "${shop.shopName}" verification status is now ${status}.`,
        type: 'SHOP',
        link: '/shop/verification',
      },
    });

    return successResponse(res, `Shop verification updated to ${status}`, shop);
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await prisma.platformSetting.findMany();
    return successResponse(res, 'Platform settings', settings);
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key) return errorResponse(res, 'Setting key is required', 400);

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value,
        ...(description && { description }),
      },
      create: {
        key,
        value,
        description,
      },
    });

    return successResponse(res, 'Setting updated', setting);
  } catch (error) {
    next(error);
  }
};
