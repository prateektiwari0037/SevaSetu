import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/apiResponse.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'sevasetu_jwt_super_secret_production_key_2026';

    const decoded = jwt.verify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customerProfile: true,
        providerProfile: true,
        shopProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account has been deactivated or suspended', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'sevasetu_jwt_super_secret_production_key_2026';
      const decoded = jwt.verify(token, secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          customerProfile: true,
          providerProfile: true,
          shopProfile: true,
          adminProfile: true,
        },
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore optional auth failures
  }
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of [${roles.join(', ')}] permissions.`,
        403
      );
    }
    next();
  };
};
