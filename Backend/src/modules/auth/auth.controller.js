import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sevasetu_jwt_super_secret_production_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req, res, next) => {
  try {
    const { email, phone, password, role = 'CUSTOMER', fullName, ...profileData } = req.body;

    if (!email || !password || !fullName) {
      return errorResponse(res, 'Email, password, and full name are required', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      return errorResponse(res, 'User with this email or phone already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole = ['CUSTOMER', 'PROVIDER', 'SHOP_OWNER', 'ADMIN'].includes(role)
      ? role
      : 'CUSTOMER';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          phone: phone || null,
          passwordHash,
          role: validRole,
          isVerified: validRole === 'CUSTOMER', // Customers are verified on signup; Providers and Shops require verification
        },
      });

      if (validRole === 'CUSTOMER') {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            fullName,
            emergencyContact: profileData.emergencyContact || null,
          },
        });
      } else if (validRole === 'PROVIDER') {
        await tx.providerProfile.create({
          data: {
            userId: user.id,
            fullName,
            businessName: profileData.businessName || null,
            experienceYears: profileData.experienceYears ? parseInt(profileData.experienceYears) : 0,
            skills: Array.isArray(profileData.skills) ? profileData.skills : [],
            primaryCategory: profileData.primaryCategory || null,
            servicePincode: profileData.servicePincode || null,
            verificationStatus: 'PENDING',
          },
        });
      } else if (validRole === 'SHOP_OWNER') {
        await tx.shopProfile.create({
          data: {
            userId: user.id,
            shopName: profileData.shopName || `${fullName}'s Store`,
            ownerName: fullName,
            shopCategory: profileData.shopCategory || 'General Hardware',
            address: profileData.address || 'Address pending',
            pincode: profileData.pincode || '400001',
            city: profileData.city || 'Mumbai',
            contactPhone: phone || '0000000000',
            verificationStatus: 'PENDING',
          },
        });
      } else if (validRole === 'ADMIN') {
        await tx.adminProfile.create({
          data: {
            userId: user.id,
            fullName,
            department: profileData.department || 'Operations',
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to SevaSetu!',
          message: `Hello ${fullName}, welcome to SevaSetu Hyperlocal Marketplace. Your account has been registered successfully.`,
          type: 'SYSTEM',
        },
      });

      return user;
    });

    const token = jwt.sign(
      { userId: result.id, email: result.email, role: result.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const fullUser = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        customerProfile: true,
        providerProfile: true,
        shopProfile: true,
        adminProfile: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = fullUser;
    return successResponse(
      res,
      'Registration successful',
      { user: userWithoutPassword, token },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        customerProfile: true,
        providerProfile: true,
        shopProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated or suspended.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return successResponse(res, 'Login successful', { user: userWithoutPassword, token });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return successResponse(res, 'Logged out successfully');
};

export const me = async (req, res) => {
  const { passwordHash: _, ...userWithoutPassword } = req.user;
  return successResponse(res, 'Current user retrieved', { user: userWithoutPassword });
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Both current and new passwords are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Current password does not match', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return success to avoid email enumeration
      return successResponse(
        res,
        'If an account exists with this email, a reset token has been generated.'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return successResponse(res, 'Password reset token generated successfully', {
      resetToken: token,
      expiresAt,
      note: 'In production this is delivered via secure email/SMS.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return errorResponse(res, 'Reset token and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long', 400);
    }

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetTokenRecord || resetTokenRecord.used || resetTokenRecord.expiresAt < new Date()) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { used: true },
      }),
    ]);

    return successResponse(res, 'Password has been reset successfully. Please log in.');
  } catch (error) {
    next(error);
  }
};
