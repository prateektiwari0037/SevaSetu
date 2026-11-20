import crypto from 'crypto';
import {
  Complaint,
  CustomerProfile,
  Booking,
  User,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

/**
 * POST /api/v1/complaints
 * Customer creates a new complaint ticket
 */
export const createComplaint = async (req, res, next) => {
  try {
    const { category = 'GENERAL', subject, title, description, bookingId, attachments = [] } = req.body;
    const complaintTitle = (title || subject || '').trim();

    if (!complaintTitle || !description) {
      return errorResponse(res, 'Title/subject and description are required', 400);
    }

    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
    if (!customer) {
      return errorResponse(res, 'Customer profile required to file a complaint', 403);
    }

    let verifiedBookingId = null;
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        customerId: customer._id,
      });
      if (booking) {
        verifiedBookingId = booking._id;
      }
    }

    const ticketNumber = `CMP-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    const complaint = await Complaint.create({
      ticketNumber,
      customerId: customer._id,
      bookingId: verifiedBookingId,
      title: complaintTitle,
      description: description.trim(),
      category: category.toUpperCase(),
      status: 'OPEN',
      attachments: Array.isArray(attachments) ? attachments : [],
      messages: [
        {
          senderUserId: req.user._id || req.user.id,
          senderRole: req.user.role || 'CUSTOMER',
          message: description.trim(),
          timestamp: new Date(),
        },
      ],
    });

    // Notify Administrators
    const admins = await User.find({ role: 'ADMIN', accountStatus: 'ACTIVE' });
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        title: `New Support Complaint #${ticketNumber}`,
        message: `Customer opened a dispute ticket: "${complaintTitle}".`,
        type: 'COMPLAINT',
        link: '/admin/complaints',
        data: { complaintId: complaint._id.toString(), ticketNumber },
      }));
      await Notification.insertMany(notifications);
    }

    return successResponse(res, 'Complaint ticket submitted successfully', complaint, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints & GET /api/v1/admin/complaints
 * Customer retrieves their tickets, Admin retrieves all platform complaints with filters
 */
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (!customer) return successResponse(res, 'No complaints found', []);
      query.customerId = customer._id;
    }

    if (status) {
      const normalizedStatus = status === 'IN_REVIEW' || status === 'UNDER_REVIEW'
        ? { $in: ['IN_REVIEW', 'UNDER_REVIEW'] }
        : status;
      query.status = normalizedStatus;
    }

    if (category) {
      query.category = category.toUpperCase();
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email mobile avatarUrl' },
      })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'serviceId', select: 'name basePrice' },
          { path: 'providerId', populate: { path: 'userId', select: 'fullName mobile' } },
        ],
      })
      .populate('assignedAdminId', 'fullName email');

    const total = await Complaint.countDocuments(query);

    return successResponse(res, 'Complaints retrieved successfully', complaints, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/:id
 * Retrieve complaint details by MongoDB ID or ticketNumber
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const complaint = await Complaint.findOne(query)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email mobile avatarUrl' },
      })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'serviceId', select: 'name basePrice durationMinutes' },
          { path: 'providerId', populate: { path: 'userId', select: 'fullName mobile avatarUrl' } },
        ],
      })
      .populate('assignedAdminId', 'fullName email')
      .populate({
        path: 'messages.senderUserId',
        select: 'fullName role avatarUrl',
      });

    if (!complaint) {
      return errorResponse(res, 'Complaint ticket not found', 404);
    }

    // Role ownership check
    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (!customer || complaint.customerId._id.toString() !== customer._id.toString()) {
        return errorResponse(res, 'Access denied: You do not own this complaint ticket', 403);
      }
    }

    return successResponse(res, 'Complaint details retrieved', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/complaints/:id/messages
 * Add response message to a complaint thread
 */
export const addComplaintMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return errorResponse(res, 'Message text is required', 400);
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { ticketNumber: id };
    const complaint = await Complaint.findOne(query).populate('customerId');

    if (!complaint) {
      return errorResponse(res, 'Complaint ticket not found', 404);
    }

    // Authorization check
    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (!customer || complaint.customerId._id.toString() !== customer._id.toString()) {
        return errorResponse(res, 'Access denied to this ticket', 403);
      }
    }

    const newMessage = {
      senderUserId: req.user._id || req.user.id,
      senderRole: req.user.role,
      message: message.trim(),
      timestamp: new Date(),
    };

    complaint.messages.push(newMessage);

    // If admin responds to OPEN ticket, advance status to IN_REVIEW
    if (req.user.role === 'ADMIN' && complaint.status === 'OPEN') {
      complaint.status = 'IN_REVIEW';
      if (!complaint.assignedAdminId) {
        complaint.assignedAdminId = req.user._id || req.user.id;
      }
    }

    await complaint.save();

    // Notify counterpart
    if (req.user.role === 'ADMIN') {
      if (complaint.customerId?.userId) {
        await Notification.create({
          userId: complaint.customerId.userId,
          title: `Support Update on #${complaint.ticketNumber}`,
          message: `Admin responded: "${message.trim().slice(0, 80)}..."`,
          type: 'COMPLAINT',
          link: '/customer/complaints',
          data: { complaintId: complaint._id.toString() },
        });
      }
    } else {
      // Customer sent a message -> notify assigned admin or general admins
      const notifyTarget = complaint.assignedAdminId || (await User.findOne({ role: 'ADMIN' }))?._id;
      if (notifyTarget) {
        await Notification.create({
          userId: notifyTarget,
          title: `Reply on Ticket #${complaint.ticketNumber}`,
          message: `Customer replied: "${message.trim().slice(0, 80)}..."`,
          type: 'COMPLAINT',
          link: '/admin/complaints',
          data: { complaintId: complaint._id.toString() },
        });
      }
    }

    return successResponse(res, 'Message appended to ticket', newMessage, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/complaints/:id/status (or /api/v1/admin/complaints/:id)
 * Admin updates ticket status and resolution notes
 */
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolution, assignedAdminId } = req.body;

    const validStatuses = ['OPEN', 'IN_REVIEW', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { ticketNumber: id };
    const complaint = await Complaint.findOne(query).populate('customerId');

    if (!complaint) {
      return errorResponse(res, 'Complaint ticket not found', 404);
    }

    if (status) complaint.status = status;
    if (assignedAdminId) complaint.assignedAdminId = assignedAdminId;

    const resolutionNotes = (resolution || adminNotes || '').trim();
    if (resolutionNotes || status === 'RESOLVED' || status === 'REJECTED' || status === 'CLOSED') {
      complaint.resolution = {
        notes: resolutionNotes || complaint.resolution?.notes || '',
        resolvedAt: new Date(),
        resolvedByAdminId: req.user._id || req.user.id,
      };
    }

    await complaint.save();

    // Log admin audit event
    await logAuditEvent(
      req,
      'ADMIN_UPDATE_COMPLAINT_STATUS',
      {
        ticketNumber: complaint.ticketNumber,
        status: complaint.status,
        resolutionNotes,
      },
      req.user._id || req.user.id
    );

    // Notify customer
    if (complaint.customerId?.userId) {
      await Notification.create({
        userId: complaint.customerId.userId,
        title: `Complaint #${complaint.ticketNumber} Update`,
        message: `Your complaint is now marked as ${complaint.status}.${resolutionNotes ? ` Note: ${resolutionNotes}` : ''}`,
        type: 'COMPLAINT',
        link: '/customer/complaints',
        data: { complaintId: complaint._id.toString() },
      });
    }

    return successResponse(res, `Complaint updated to ${complaint.status}`, complaint);
  } catch (error) {
    next(error);
  }
};
