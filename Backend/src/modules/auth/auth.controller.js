import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../models/User.js';
import CustomerProfile from '../../models/CustomerProfile.js';
import ProviderProfile from '../../models/ProviderProfile.js';
import ShopProfile from '../../models/ShopProfile.js';
import AdminProfile from '../../models/AdminProfile.js';
import RefreshSession from '../../models/RefreshSession.js';
import Notification from '../../models/Notification.js';
import {
  generateAccessToken,
  createRefreshSession,
  setRefreshCookie,
  clearRefreshCookie,
  hashToken,
  generateCryptoToken,
} from '../../utils/token.js';
import { logAuditEvent } from '../../utils/auditLogger.js';
import emailService from '../../services/email.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { DASHBOARD_DESTINATIONS } from '../../config/constants.js';

/**
 * Helper to fetch a fully populated safe user
 */
async function getFullSafeUser(userId) {
  const user = await User.findById(userId)
    .populate('customerProfile')
    .populate('providerProfile')
    .populate('shopProfile')
    .populate('adminProfile')
    .populate('addresses');
  return user ? user.toSafeJSON() : null;
}

/**
 * POST /api/v1/auth/register/customer
 */
export const registerCustomer = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      mobile,
      phone,
      password,
      confirmPassword,
      termsAccepted,
      emergencyContact,
    } = req.body;

    const contactMobile = typeof (mobile || phone) === 'string' ? (mobile || phone).trim() : '';
    const userFullName = typeof fullName === 'string' ? fullName.trim() : '';
    const userEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const userPassword = typeof password === 'string' ? password : '';

    if (!userFullName || !userEmail || !contactMobile || !userPassword) {
      return errorResponse(res, 'Full name, email, mobile number, and password are required', 400);
    }

    if (confirmPassword && userPassword !== confirmPassword) {
      return errorResponse(res, 'Password and confirm password do not match', 400);
    }

    if (userPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', 400);
    }

    const normalizedEmail = userEmail;

    // Check duplicate email or mobile
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: contactMobile }],
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        return errorResponse(res, 'An account with this email address already exists', 409);
      }
      return errorResponse(res, 'An account with this mobile number already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Email verification token
    const rawVerificationToken = generateCryptoToken();
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: contactMobile,
      passwordHash,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      emailVerified: false,
      mobileVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    const customerProfile = await CustomerProfile.create({
      userId: user._id,
      fullName: fullName.trim(),
      emergencyContact: emergencyContact || null,
    });

    await Notification.create({
      userId: user._id,
      title: 'Welcome to SevaSetu!',
      message: `Hello ${fullName}, your customer account has been created successfully. Welcome to your neighborhood services platform.`,
      type: 'SYSTEM',
    });

    // Send verification email in development/production
    await emailService.sendVerificationEmail(normalizedEmail, rawVerificationToken, fullName);

    // Generate tokens & session
    const accessToken = generateAccessToken(user);
    const { rawRefreshToken } = await createRefreshSession(user, req);
    setRefreshCookie(res, rawRefreshToken);

    await logAuditEvent(req, 'AUTH_REGISTER_CUSTOMER', { email: normalizedEmail }, user._id);

    const safeUser = await getFullSafeUser(user._id);

    return successResponse(
      res,
      'Customer registered successfully',
      {
        user: safeUser,
        token: accessToken,
        refreshToken: rawRefreshToken,
        dashboardDestination: DASHBOARD_DESTINATIONS.CUSTOMER,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/register/provider
 */
export const registerProvider = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      mobile,
      phone,
      password,
      confirmPassword,
      businessName,
      primaryCategory,
      skills,
      experienceYears,
      city,
      area,
      servicePincode,
    } = req.body;

    const contactMobile = typeof (mobile || phone) === 'string' ? (mobile || phone).trim() : '';
    const userFullName = typeof fullName === 'string' ? fullName.trim() : '';
    const userEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const userPassword = typeof password === 'string' ? password : '';

    if (!userFullName || !userEmail || !contactMobile || !userPassword) {
      return errorResponse(res, 'Full name, email, mobile number, and password are required', 400);
    }

    if (confirmPassword && userPassword !== confirmPassword) {
      return errorResponse(res, 'Password and confirm password do not match', 400);
    }

    if (userPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', 400);
    }

    const normalizedEmail = userEmail;

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: contactMobile }],
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        return errorResponse(res, 'An account with this email address already exists', 409);
      }
      return errorResponse(res, 'An account with this mobile number already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rawVerificationToken = generateCryptoToken();
    const verificationTokenHash = hashToken(rawVerificationToken);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: contactMobile,
      passwordHash,
      role: 'PROVIDER',
      accountStatus: 'ACTIVE',
      emailVerified: false,
      mobileVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim())
      : [];

    await ProviderProfile.create({
      userId: user._id,
      fullName: fullName.trim(),
      businessName: businessName?.trim() || `${fullName}'s Technical Services`,
      primaryCategory: primaryCategory || null,
      skills: parsedSkills,
      experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
      city: city || 'Mumbai',
      area: area || '',
      servicePincode: servicePincode || '400001',
      verificationStatus: 'PENDING_VERIFICATION',
    });

    await Notification.create({
      userId: user._id,
      title: 'Provider Account Registered',
      message: `Hello ${fullName}, your provider account has been registered. Please complete your profile and upload verification documents.`,
      type: 'SYSTEM',
    });

    await emailService.sendVerificationEmail(normalizedEmail, rawVerificationToken, fullName);

    const accessToken = generateAccessToken(user);
    const { rawRefreshToken } = await createRefreshSession(user, req);
    setRefreshCookie(res, rawRefreshToken);

    await logAuditEvent(req, 'AUTH_REGISTER_PROVIDER', { email: normalizedEmail }, user._id);

    const safeUser = await getFullSafeUser(user._id);

    return successResponse(
      res,
      'Provider registered successfully. Verification is pending.',
      {
        user: safeUser,
        token: accessToken,
        refreshToken: rawRefreshToken,
        dashboardDestination: DASHBOARD_DESTINATIONS.PROVIDER,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/register/shop-owner
 */
export const registerShopOwner = async (req, res, next) => {
  try {
    const {
      ownerName,
      fullName,
      email,
      mobile,
      phone,
      password,
      confirmPassword,
      shopName,
      shopCategory,
      address,
      streetAddress,
      city,
      area,
      pincode,
    } = req.body;

    const contactMobile = (mobile || phone || '').trim();
    const finalOwnerName = (ownerName || fullName || '').trim();

    if (!finalOwnerName || !email || !contactMobile || !password) {
      return errorResponse(res, 'Owner name, email, mobile number, and password are required', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 'Password and confirm password do not match', 400);
    }

    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: contactMobile }],
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        return errorResponse(res, 'An account with this email address already exists', 409);
      }
      return errorResponse(res, 'An account with this mobile number already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rawVerificationToken = generateCryptoToken();
    const verificationTokenHash = hashToken(rawVerificationToken);

    const user = await User.create({
      fullName: finalOwnerName,
      email: normalizedEmail,
      mobile: contactMobile,
      passwordHash,
      role: 'SHOP_OWNER',
      accountStatus: 'ACTIVE',
      emailVerified: false,
      mobileVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await ShopProfile.create({
      userId: user._id,
      shopName: shopName?.trim() || `${finalOwnerName}'s Store`,
      ownerName: finalOwnerName,
      shopCategory: shopCategory || 'General Hardware',
      address: address || streetAddress || 'Address pending',
      streetAddress: streetAddress || address || 'Address pending',
      city: city || 'Mumbai',
      area: area || '',
      pincode: pincode || '400001',
      contactPhone: contactMobile,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    await Notification.create({
      userId: user._id,
      title: 'Shop Storefront Created',
      message: `Hello ${finalOwnerName}, your storefront has been created. Please complete your store details and upload verification documents.`,
      type: 'SYSTEM',
    });

    await emailService.sendVerificationEmail(normalizedEmail, rawVerificationToken, finalOwnerName);

    const accessToken = generateAccessToken(user);
    const { rawRefreshToken } = await createRefreshSession(user, req);
    setRefreshCookie(res, rawRefreshToken);

    await logAuditEvent(req, 'AUTH_REGISTER_SHOPOWNER', { email: normalizedEmail }, user._id);

    const safeUser = await getFullSafeUser(user._id);

    return successResponse(
      res,
      'Shop owner registered successfully. Storefront verification is pending.',
      {
        user: safeUser,
        token: accessToken,
        refreshToken: rawRefreshToken,
        dashboardDestination: DASHBOARD_DESTINATIONS.SHOP_OWNER,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/register (Unified Endpoint for Backwards Compatibility)
 */
export const registerUnified = async (req, res, next) => {
  const { role = 'CUSTOMER' } = req.body;
  if (role === 'ADMIN') {
    return errorResponse(res, 'Direct admin registration is not permitted', 403);
  }
  if (role === 'PROVIDER') return registerProvider(req, res, next);
  if (role === 'SHOP_OWNER') return registerShopOwner(req, res, next);
  return registerCustomer(req, res, next);
};

/**
 * POST /api/v1/auth/login
 * Unified login with Email or Mobile
 */
export const login = async (req, res, next) => {
  try {
    const { email, mobile, phone, loginIdentifier, identifier, password } = req.body;
    const rawCred = loginIdentifier || identifier || email || mobile || phone || '';
    const credId = typeof rawCred === 'string' ? rawCred.trim() : '';
    const pass = typeof password === 'string' ? password : '';

    if (!credId || !pass) {
      return errorResponse(res, 'Email/mobile and password are required', 400);
    }

    const normalizedCred = credId.toLowerCase();

    // Query user with passwordHash
    const user = await User.findOne({
      $or: [{ email: normalizedCred }, { mobile: credId }],
    }).select('+passwordHash');

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (user.accountStatus !== 'ACTIVE') {
      return errorResponse(
        res,
        `Your account has been ${user.accountStatus.toLowerCase()}. Please contact customer support.`,
        403
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAuditEvent(req, 'AUTH_LOGIN_FAILED', { identifier: credId }, user._id);
      return errorResponse(res, 'Invalid credentials', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const { rawRefreshToken } = await createRefreshSession(user, req);
    setRefreshCookie(res, rawRefreshToken);

    await logAuditEvent(req, 'AUTH_LOGIN_SUCCESS', { role: user.role }, user._id);

    const safeUser = await getFullSafeUser(user._id);
    const destination = DASHBOARD_DESTINATIONS[user.role] || '/customer/dashboard';

    return successResponse(res, 'Login successful', {
      user: safeUser,
      token: accessToken,
      refreshToken: rawRefreshToken,
      dashboardDestination: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh Token Rotation
 */
export const refresh = async (req, res, next) => {
  try {
    let rawRefreshToken = null;

    if (req.cookies && req.cookies.sevasetu_refresh_token) {
      rawRefreshToken = req.cookies.sevasetu_refresh_token;
    } else if (req.body && req.body.refreshToken) {
      rawRefreshToken = req.body.refreshToken;
    }

    if (!rawRefreshToken) {
      return errorResponse(res, 'Refresh token required', 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await RefreshSession.findOne({
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearRefreshCookie(res);
      return errorResponse(res, 'Invalid or expired refresh session. Please log in again.', 401);
    }

    const user = await User.findById(session.userId);
    if (!user || user.accountStatus !== 'ACTIVE') {
      await RefreshSession.findByIdAndUpdate(session._id, { isRevoked: true });
      clearRefreshCookie(res);
      return errorResponse(res, 'User account is no longer active', 403);
    }

    // Token Rotation: revoke old session, issue new one
    await RefreshSession.findByIdAndUpdate(session._id, { isRevoked: true });

    const newAccessToken = generateAccessToken(user);
    const { rawRefreshToken: newRawRefresh } = await createRefreshSession(user, req);
    setRefreshCookie(res, newRawRefresh);

    return successResponse(res, 'Session refreshed successfully', {
      token: newAccessToken,
      refreshToken: newRawRefresh,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    let rawRefreshToken = req.cookies?.sevasetu_refresh_token || req.body?.refreshToken;

    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshSession.findOneAndUpdate({ tokenHash }, { isRevoked: true });
    }

    clearRefreshCookie(res);
    await logAuditEvent(req, 'AUTH_LOGOUT', {}, req.user?._id);

    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout-all
 */
export const logoutAll = async (req, res, next) => {
  try {
    if (!req.user) return errorResponse(res, 'Authentication required', 401);

    await RefreshSession.updateMany(
      { userId: req.user._id, isRevoked: false },
      { isRevoked: true }
    );

    clearRefreshCookie(res);
    await logAuditEvent(req, 'AUTH_LOGOUT_ALL', {}, req.user._id);

    return successResponse(res, 'Successfully logged out from all devices');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email address is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && user.accountStatus === 'ACTIVE') {
      const rawToken = generateCryptoToken();
      const hashedToken = hashToken(rawToken);

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await user.save();

      await emailService.sendPasswordResetEmail(user.email, rawToken, user.fullName);
      await logAuditEvent(req, 'PASSWORD_RESET_REQUESTED', { email: user.email }, user._id);
    }

    // Always return safe non-enumerating message
    return successResponse(
      res,
      'If your email address is registered, password reset instructions have been sent.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, password, confirmPassword } = req.body;
    const finalPassword = newPassword || password;

    if (!token || !finalPassword) {
      return errorResponse(res, 'Reset token and new password are required', 400);
    }

    if (confirmPassword && finalPassword !== confirmPassword) {
      return errorResponse(res, 'Password and confirm password do not match', 400);
    }

    if (finalPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', 400);
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordHash');

    if (!user) {
      return errorResponse(res, 'Invalid or expired password reset token', 400);
    }

    user.passwordHash = await bcrypt.hash(finalPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing refresh sessions
    await RefreshSession.updateMany({ userId: user._id }, { isRevoked: true });
    clearRefreshCookie(res);

    await logAuditEvent(req, 'PASSWORD_RESET_COMPLETED', {}, user._id);

    return successResponse(res, 'Password has been reset successfully. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return errorResponse(res, 'New password and confirm password do not match', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters long', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) return errorResponse(res, 'User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Invalidate other refresh sessions
    await RefreshSession.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true }
    );
    clearRefreshCookie(res);

    await logAuditEvent(req, 'PASSWORD_CHANGED', {}, user._id);

    return successResponse(res, 'Password changed successfully. Please log in again.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return errorResponse(res, 'Verification token is required', 400);
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired email verification token', 400);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await logAuditEvent(req, 'EMAIL_VERIFIED', {}, user._id);

    return successResponse(res, 'Email address verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  try {
    const email = req.body?.email || req.user?.email;
    if (!email) {
      return errorResponse(res, 'Email address is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.emailVerified) {
      return errorResponse(res, 'Email address is already verified', 400);
    }

    const rawToken = generateCryptoToken();
    user.emailVerificationToken = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, rawToken, user.fullName);
    await logAuditEvent(req, 'EMAIL_VERIFICATION_RESENT', {}, user._id);

    return successResponse(res, 'Verification email resent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const me = async (req, res, next) => {
  try {
    const safeUser = await getFullSafeUser(req.user._id);
    return successResponse(res, 'Current user retrieved', { user: safeUser });
  } catch (error) {
    next(error);
  }
};
