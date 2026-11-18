import User from '../../models/User.js';
import CustomerProfile from '../../models/CustomerProfile.js';
import ProviderProfile from '../../models/ProviderProfile.js';
import ShopProfile from '../../models/ShopProfile.js';
import Address from '../../models/Address.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

/**
 * GET /api/v1/users/me (or /api/v1/users/profile)
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('customerProfile')
      .populate('providerProfile')
      .populate('shopProfile')
      .populate('adminProfile')
      .populate('addresses');

    if (!user) return errorResponse(res, 'User not found', 404);

    return successResponse(res, 'User profile retrieved', user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me (or /api/v1/users/profile)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      mobile,
      phone,
      preferredLanguage,
      avatarUrl,
      bio,
      emergencyContact,
      alternatePhone,
      businessName,
      experienceYears,
      skills,
      primaryCategory,
      city,
      area,
      servicePincode,
      serviceRadiusKm,
      shopName,
      shopCategory,
      address,
      streetAddress,
      pincode,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (fullName) user.fullName = fullName.trim();
    if (mobile || phone) user.mobile = (mobile || phone).trim();
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    // Update role-specific profile
    if (user.role === 'CUSTOMER') {
      await CustomerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          ...(fullName && { fullName: fullName.trim() }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(emergencyContact !== undefined && { emergencyContact }),
          ...(alternatePhone !== undefined && { alternatePhone }),
        },
        { upsert: true, new: true }
      );
    } else if (user.role === 'PROVIDER') {
      const parsedSkills = skills
        ? Array.isArray(skills)
          ? skills
          : skills.split(',').map((s) => s.trim())
        : undefined;

      await ProviderProfile.findOneAndUpdate(
        { userId: user._id },
        {
          ...(fullName && { fullName: fullName.trim() }),
          ...(businessName !== undefined && { businessName }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears, 10) }),
          ...(parsedSkills !== undefined && { skills: parsedSkills }),
          ...(primaryCategory !== undefined && { primaryCategory }),
          ...(city !== undefined && { city }),
          ...(area !== undefined && { area }),
          ...(servicePincode !== undefined && { servicePincode }),
          ...(serviceRadiusKm !== undefined && { serviceRadiusKm: parseFloat(serviceRadiusKm) }),
        },
        { upsert: true, new: true }
      );
    } else if (user.role === 'SHOP_OWNER') {
      await ShopProfile.findOneAndUpdate(
        { userId: user._id },
        {
          ...(shopName && { shopName }),
          ...(fullName && { ownerName: fullName }),
          ...(shopCategory && { shopCategory }),
          ...(address && { address }),
          ...(streetAddress && { streetAddress }),
          ...(pincode && { pincode }),
          ...(city && { city }),
          ...(area && { area }),
          ...(avatarUrl && { bannerUrl: avatarUrl }),
        },
        { upsert: true, new: true }
      );
    }

    await logAuditEvent(req, 'PROFILE_UPDATED', {}, user._id);

    const updatedUser = await User.findById(user._id)
      .populate('customerProfile')
      .populate('providerProfile')
      .populate('shopProfile')
      .populate('adminProfile')
      .populate('addresses');

    return successResponse(res, 'Profile updated successfully', updatedUser.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/me/addresses (or /api/v1/users/addresses)
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    return successResponse(res, 'User addresses retrieved', addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/addresses (or /api/v1/users/addresses)
 */
export const addAddress = async (req, res, next) => {
  try {
    const {
      label = 'Home',
      addressLine,
      streetAddress,
      landmark = '',
      area = '',
      city,
      state,
      pincode,
      country = 'India',
      isDefault = false,
    } = req.body;

    const finalAddressLine = (addressLine || streetAddress || '').trim();

    if (!finalAddressLine || !city || !state || !pincode) {
      return errorResponse(res, 'Address line, city, state, and PIN code are required', 400);
    }

    const count = await Address.countDocuments({ userId: req.user._id });
    const shouldBeDefault = isDefault || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      userId: req.user._id,
      label,
      addressLine: finalAddressLine,
      landmark: landmark.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim(),
      isDefault: shouldBeDefault,
    });

    return successResponse(res, 'Address added successfully', address, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me/addresses/:id (or /api/v1/users/addresses/:id)
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      label,
      addressLine,
      streetAddress,
      landmark,
      area,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    const address = await Address.findOne({ _id: id, userId: req.user._id });
    if (!address) {
      return errorResponse(res, 'Address not found or unauthorized', 404);
    }

    if (isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    if (label !== undefined) address.label = label;
    if (addressLine !== undefined || streetAddress !== undefined) {
      address.addressLine = (addressLine || streetAddress).trim();
    }
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (area !== undefined) address.area = area.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (pincode !== undefined) address.pincode = pincode.trim();
    if (country !== undefined) address.country = country.trim();
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    return successResponse(res, 'Address updated successfully', address);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/me/addresses/:id (or /api/v1/users/addresses/:id)
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!address) {
      return errorResponse(res, 'Address not found or unauthorized', 404);
    }

    // If the deleted address was default, promote the newest remaining address
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return successResponse(res, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/account
 */
export const deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { accountStatus: 'DISABLED' });
    await logAuditEvent(req, 'ACCOUNT_DISABLED', {}, req.user._id);
    return successResponse(res, 'Account has been disabled');
  } catch (error) {
    next(error);
  }
};
