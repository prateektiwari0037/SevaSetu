import AuditLog from '../models/AuditLog.js';

export async function logAuditEvent(req, action, details = {}, userId = null) {
  try {
    const actorId = userId || req?.user?._id || req?.user?.id || null;
    await AuditLog.create({
      userId: actorId,
      action,
      ipAddress: req?.ip || req?.socket?.remoteAddress || null,
      userAgent: req?.headers ? req.headers['user-agent'] : null,
      details,
    });
  } catch (err) {
    // Non-blocking: never fail a primary operation because of an audit log write
    console.error('Audit log write error:', err.message);
  }
}
