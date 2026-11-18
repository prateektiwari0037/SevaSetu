import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ShopProfile from '../models/ShopProfile.js';
import { errorResponse } from '../utils/apiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sevasetu_jwt_super_secret_production_key_2026';

/**
 * Primary Authentication Middleware
 * Checks Authorization header Bearer token (or cookie fallback)
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.sevasetu_access_token) {
      token = req.cookies.sevasetu_access_token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication token required', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Session expired. Please refresh your session or log in again.', 401);
      }
      return errorResponse(res, 'Invalid authentication token', 401);
    }

    const user = await User.findById(decoded.userId)
      .populate('customerProfile')
      .populate('providerProfile')
      .populate('shopProfile')
      .populate('adminProfile');

    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (user.accountStatus !== 'ACTIVE') {
      return errorResponse(
        res,
        `Account is ${user.accountStatus.toLowerCase()}. Access denied.`,
        403
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Alias for backwards compatibility
export const authenticateToken = authenticate;

/**
 * Optional Authentication Middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId)
        .populate('customerProfile')
        .populate('providerProfile')
        .populate('shopProfile')
        .populate('adminProfile');

      if (user && user.accountStatus === 'ACTIVE') {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

/**
 * Role-Based Authorization Middleware
 * Usage: authorizeRoles('ADMIN', 'PROVIDER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

// Alias for backwards compatibility
export const requireRole = authorizeRoles;

/**
 * Enforces that user account status is ACTIVE
 */
export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }
  if (req.user.accountStatus !== 'ACTIVE') {
    return errorResponse(
      res,
      `Your account is currently ${req.user.accountStatus.toLowerCase()}. Please contact customer support.`,
      403
    );
  }
  next();
};

/**
 * Enforces that provider is approved by platform admin
 */
export const requireVerifiedProvider = async (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required', 401);

  if (req.user.role !== 'PROVIDER') {
    return errorResponse(res, 'Provider role required', 403);
  }

  const provider =
    req.user.providerProfile ||
    (await ProviderProfile.findOne({ userId: req.user._id }));

  if (!provider || provider.verificationStatus !== 'APPROVED') {
    return errorResponse(
      res,
      'Provider account verification is pending or rejected. Contact admin for verification.',
      403
    );
  }

  req.providerProfile = provider;
  next();
};

/**
 * Enforces that shop owner is approved by platform admin
 */
export const requireApprovedShop = async (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required', 401);

  if (req.user.role !== 'SHOP_OWNER') {
    return errorResponse(res, 'Shop owner role required', 403);
  }

  const shop =
    req.user.shopProfile || (await ShopProfile.findOne({ userId: req.user._id }));

  if (!shop || shop.verificationStatus !== 'APPROVED') {
    return errorResponse(
      res,
      'Shop storefront verification is pending or rejected. Contact admin for verification.',
      403
    );
  }

  req.shopProfile = shop;
  next();
};

/**
 * Resource Ownership Validation Middleware
 * Ensures the resource belongs to the logged in user or admin
 */
export const validateResourceOwnership = (
  ResourceModel,
  idParam = 'id',
  ownerField = 'userId'
) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return errorResponse(res, 'Authentication required', 401);

      // Admins always have access
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        return errorResponse(res, 'Resource ID missing in request', 400);
      }

      const resource = await ResourceModel.findById(resourceId);
      if (!resource) {
        return errorResponse(res, 'Resource not found', 404);
      }

      const currentUserId = req.user._id.toString();
      const resourceOwnerId = resource[ownerField]?.toString();

      // Check direct user ownership
      if (resourceOwnerId && resourceOwnerId === currentUserId) {
        req.resource = resource;
        return next();
      }

      // Check customer profile ownership if ownerField is customerId
      if (ownerField === 'customerId' && req.user.customerProfile) {
        if (resource.customerId?.toString() === req.user.customerProfile._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      // Check provider profile ownership if ownerField is providerId
      if (ownerField === 'providerId' && req.user.providerProfile) {
        if (resource.providerId?.toString() === req.user.providerProfile._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      // Check shop profile ownership if ownerField is shopId
      if (ownerField === 'shopId' && req.user.shopProfile) {
        if (resource.shopId?.toString() === req.user.shopProfile._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      return errorResponse(
        res,
        'Forbidden: You do not have permission to access or modify this resource',
        403
      );
    } catch (err) {
      next(err);
    }
  };
};
