import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshSession from '../models/RefreshSession.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sevasetu_jwt_super_secret_production_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_DAYS = 7;

export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateCryptoToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createRefreshSession(user, req) {
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  const session = await RefreshSession.create({
    userId: user._id || user.id,
    tokenHash,
    userAgent: req?.headers['user-agent'] || '',
    ipAddress: req?.ip || req?.socket?.remoteAddress || '',
    expiresAt,
  });

  return { rawRefreshToken, session };
}

export function setRefreshCookie(res, rawRefreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('sevasetu_refresh_token', rawRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('sevasetu_refresh_token', {
    httpOnly: true,
    path: '/api/v1/auth',
  });
}
