import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customerProfile: true,
        providerProfile: {
          include: {
            services: { include: { service: true } },
            documents: true,
            availability: true,
          },
        },
        shopProfile: {
          include: {
            catalogItems: true,
          },
        },
        adminProfile: true,
        addresses: { orderBy: { createdAt: 'desc' } },
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return successResponse(res, 'User profile retrieved', userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const {
      phone,
      preferredLanguage,
      fullName,
      bio,
      avatarUrl,
      emergencyContact,
      businessName,
      experienceYears,
      skills,
      primaryCategory,
      servicePincode,
      serviceRadiusKm,
      shopName,
      shopCategory,
      address,
      pincode,
      city,
    } = req.body;

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(preferredLanguage !== undefined && { preferredLanguage }),
        },
      });

      if (req.user.role === 'CUSTOMER' && req.user.customerProfile) {
        await tx.customerProfile.update({
          where: { userId: req.user.id },
          data: {
            ...(fullName && { fullName }),
            ...(bio !== undefined && { bio }),
            ...(avatarUrl !== undefined && { avatarUrl }),
            ...(emergencyContact !== undefined && { emergencyContact }),
          },
        });
      } else if (req.user.role === 'PROVIDER' && req.user.providerProfile) {
        await tx.providerProfile.update({
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
          },
        });
      } else if (req.user.role === 'SHOP_OWNER' && req.user.shopProfile) {
        await tx.shopProfile.update({
          where: { userId: req.user.id },
          data: {
            ...(shopName && { shopName }),
            ...(fullName && { ownerName: fullName }),
            ...(shopCategory && { shopCategory }),
            ...(address && { address }),
            ...(pincode && { pincode }),
            ...(city && { city }),
            ...(avatarUrl && { bannerUrl: avatarUrl }),
          },
        });
      }

      return updatedUser;
    });

    return successResponse(res, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false },
    });
    return successResponse(res, 'Account deactivated successfully');
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return successResponse(res, 'Addresses retrieved', addresses);
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { label = 'Home', streetAddress, city, state, pincode, latitude, longitude, isDefault } =
      req.body;

    if (!streetAddress || !city || !state || !pincode) {
      return errorResponse(res, 'Street address, city, state, and pincode are required', 400);
    }

    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const shouldBeDefault = isDefault || count === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: req.user.id,
          label,
          streetAddress,
          city,
          state,
          pincode,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          isDefault: shouldBeDefault,
        },
      });
    });

    return successResponse(res, 'Address added successfully', address, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, streetAddress, city, state, pincode, latitude, longitude, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return errorResponse(res, 'Address not found or unauthorized', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(label && { label }),
          ...(streetAddress && { streetAddress }),
          ...(city && { city }),
          ...(state && { state }),
          ...(pincode && { pincode }),
          ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
          ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });
    });

    return successResponse(res, 'Address updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return errorResponse(res, 'Address not found or unauthorized', 404);
    }

    await prisma.address.delete({ where: { id } });
    return successResponse(res, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};
